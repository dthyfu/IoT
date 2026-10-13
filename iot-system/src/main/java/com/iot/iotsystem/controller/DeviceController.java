
package com.iot.iotsystem.controller;

import com.iot.iotsystem.service.MqttService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/device")
public class DeviceController {

    private final MqttService mqttService;
    private final JdbcTemplate jdbcTemplate;

    public DeviceController(
            MqttService mqttService,
            JdbcTemplate jdbcTemplate) {
        this.mqttService = mqttService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/control")
    public ResponseEntity<?> controlDevice(
            @RequestBody Map<String, String> request) {

        String led = request.get("led");
        String action = request.get("action");

        if (led == null || action == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Thieu led hoac action"));
        }

        if (!led.matches("led[1-3]")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "LED khong hop le"));
        }

        if (!action.equalsIgnoreCase("on")
                && !action.equalsIgnoreCase("off")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Action phai la on hoac off"));
        }

        // Map LED to device ID in the database.
        int deviceId = switch (led) {
            case "led1" -> 1;
            case "led2" -> 2;
            case "led3" -> 3;
            default -> throw new IllegalArgumentException("LED khong hop le");
        };

        String normalizedAction =
                action.equalsIgnoreCase("on") ? "On" : "Off";

        // Create a Pending history record for user (user ID 1).
        jdbcTemplate.update("""
            INSERT INTO action_history
                (user_id, device_id, action, status, requested_at)
            VALUES (?, ?, ?, 'Pending', CURRENT_TIMESTAMP)
            """,
            1, deviceId, normalizedAction
        );

        try {
            String message =
                    "{\"" + led + "\":\"" + action.toLowerCase() + "\"}";

            mqttService.publish(message);

            return ResponseEntity.ok(Map.of(
                    "message", "Da gui lenh MQTT",
                    "led", led,
                    "action", normalizedAction,
                    "status", "Pending"
            ));

        } catch (Exception e) {
            // Mark the latest matching pending request as Failed.
            jdbcTemplate.update("""
                UPDATE action_history
                SET status = 'Failed',
                    completed_at = CURRENT_TIMESTAMP
                WHERE device_id = ?
                  AND action = ?
                  AND status = 'Pending'
                ORDER BY id DESC
                LIMIT 1
                """,
                deviceId, normalizedAction
            );

            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Khong gui duoc lenh MQTT"));
        }
    }
}
