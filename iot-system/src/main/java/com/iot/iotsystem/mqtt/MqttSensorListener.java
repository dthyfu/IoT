
package com.iot.iotsystem.mqtt;

import com.iot.iotsystem.controller.SensorRealtimeController;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class MqttSensorListener {

    private static final String BROKER = "tcp://";
    private static final String TOPIC = "esp32/sensor-data";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SensorRealtimeController sensorRealtimeController;

    private MqttClient mqttClient;

    public MqttSensorListener(
            JdbcTemplate jdbcTemplate,
            SensorRealtimeController sensorRealtimeController) {
        this.jdbcTemplate = jdbcTemplate;
        this.sensorRealtimeController = sensorRealtimeController;
    }

    @PostConstruct
    public void connect() {
        try {
            mqttClient = new MqttClient(
                BROKER,
                MqttClient.generateClientId(),
                new MemoryPersistence()
            );

            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(10);

            options.setUserName("");
            options.setPassword("".toCharArray());

            mqttClient.connect(options);

            mqttClient.subscribe(TOPIC, (topic, message) -> {
                String payload = new String(message.getPayload());
                System.out.println("MQTT nhận được: " + payload);
                saveSensorData(payload);
            });

            System.out.println("Đã kết nối MQTT: " + BROKER);
            System.out.println("Đang lắng nghe topic: " + TOPIC);

        } catch (MqttException e) {
            System.err.println("Không thể kết nối MQTT: " + e.getMessage());
        }
    }

    private void saveSensorData(String payload) {
        try {
            JsonNode json = objectMapper.readTree(payload);

            double temperature = json.get("temperature").asDouble();
            double humidity = json.get("humidity").asDouble();
            double light = json.get("light").asDouble();

            LocalDateTime measuredAt = LocalDateTime.now();

            if (json.hasNonNull("time")) {
                String time = json.get("time").asText();
                DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                        "d/M/yyyy HH:mm:ss", Locale.ROOT
                    );
                measuredAt = LocalDateTime.parse(time, formatter);
            }

            saveValue(1L, temperature, measuredAt);
            saveValue(2L, light, measuredAt);
            saveValue(3L, humidity, measuredAt);

            System.out.println("Đã lưu dữ liệu cảm biến vào MySQL.");
            String timestamp = measuredAt.toString();

            sensorRealtimeController.sendSensorData(
                    temperature,
                    humidity,
                    light,
                    timestamp
            );

        } catch (Exception e) {
            System.err.println("Lỗi xử lý dữ liệu MQTT: " + e.getMessage());
        }
    }

    private void saveValue(
        long sensorId,
        double value,
        LocalDateTime measuredAt
    ) {
        String sql = """
            INSERT INTO sensor_data (sensor_id, value, measured_at)
            VALUES (?, ?, ?)
            """;

        jdbcTemplate.update(sql, sensorId, value, measuredAt);
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                mqttClient.close();
            }
        } catch (MqttException e) {
            System.err.println("Lỗi ngắt kết nối MQTT: " + e.getMessage());
        }
    }
}
