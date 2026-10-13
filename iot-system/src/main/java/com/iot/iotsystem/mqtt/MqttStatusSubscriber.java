
package com.iot.iotsystem.mqtt;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.iotsystem.controller.DeviceStatusController;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MqttStatusSubscriber {

    @Value("${mqtt.broker-url}")
    private String brokerUrl;

    @Value("${mqtt.username}")
    private String username;

    @Value("${mqtt.password}")
    private String password;

    private MqttClient client;

    private final DeviceStatusController deviceStatusController;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    public MqttStatusSubscriber(
            DeviceStatusController deviceStatusController,
            JdbcTemplate jdbcTemplate) {
        this.deviceStatusController = deviceStatusController;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void start() {
        try {
            client = new MqttClient(
                    brokerUrl,
                    "spring-boot-status-subscriber",
                    new MemoryPersistence()
            );

            MqttConnectOptions options = new MqttConnectOptions();
            options.setUserName(username);
            options.setPassword(password.toCharArray());
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);

            client.connect(options);

            client.subscribe("esp32/device-status", (topic, message) -> {
                String payload = new String(message.getPayload());

                System.out.println(
                        "[MQTT STATUS] " + topic + " -> " + payload
                );

                try {
                    Map<String, String> statuses = objectMapper.readValue(
                            payload,
                            new TypeReference<Map<String, String>>() {}
                    );

                    for (Map.Entry<String, String> entry : statuses.entrySet()) {
                        String device = entry.getKey();
                        String status = entry.getValue();

                        if (!device.matches("led[1-3]")) {
                            continue;
                        }

                        if (!status.equalsIgnoreCase("on")
                                && !status.equalsIgnoreCase("off")) {
                            continue;
                        }

                        int deviceId = switch (device) {
                            case "led1" -> 1;
                            case "led2" -> 2;
                            case "led3" -> 3;
                            default -> -1;
                        };

                        String normalizedStatus =
                                status.equalsIgnoreCase("on") ? "On" : "Off";

                        String expectedAction = normalizedStatus;

                        // Update the newest pending request for this LED.
                        int updated = jdbcTemplate.update("""
                            UPDATE action_history
                            SET status = ?,
                                completed_at = CURRENT_TIMESTAMP
                            WHERE id = (
                                SELECT id FROM (
                                    SELECT id
                                    FROM action_history
                                    WHERE device_id = ?
                                      AND action = ?
                                      AND status = 'Pending'
                                    ORDER BY id DESC
                                    LIMIT 1
                                ) AS pending_action
                            )
                            """,
                            normalizedStatus, deviceId, expectedAction
                        );

                        System.out.println(
                                "[HISTORY] " + device
                                + " -> " + normalizedStatus
                                + ", updated records: " + updated
                        );

                        // Update current device status.
                        jdbcTemplate.update("""
                            UPDATE devices
                            SET current_status = ?
                            WHERE id = ?
                            """,
                            normalizedStatus.toUpperCase(), deviceId
                        );

                        // Notify the dashboard through WebSocket.
                        deviceStatusController.sendDeviceStatus(
                                device,
                                normalizedStatus
                        );
                    }

                } catch (Exception e) {
                    System.err.println(
                            "[MQTT STATUS] Cannot process message: "
                                    + e.getMessage()
                    );
                }
            });

            System.out.println(
                    "Subscribed to MQTT topic esp32/device-status"
            );

        } catch (Exception e) {
            System.err.println(
                    "Cannot connect MQTT status subscriber: "
                            + e.getMessage()
            );
        }
    }

    @PreDestroy
    public void stop() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
            }
        } catch (Exception e) {
            System.err.println(
                    "Error closing MQTT subscriber: " + e.getMessage()
            );
        }
    }
}
