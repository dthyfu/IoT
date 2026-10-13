
package com.iot.iotsystem.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class SensorRealtimeController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SensorRealtimeController(
            SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Gui du lieu cam bien den Dashboard qua WebSocket
    public void sendSensorData(
            double temperature,
            double humidity,
            double light,
            String timestamp) {

        Map<String, Object> data = Map.of(
                "temperature", temperature,
                "humidity", humidity,
                "light", light,
                "timestamp", timestamp
        );

        try {
            String json = objectMapper.writeValueAsString(data);

            messagingTemplate.convertAndSend(
                    "/topic/sensors",
                    (Object) json
            );

            System.out.println("[WEBSOCKET SENSOR] " + json);

        } catch (JsonProcessingException e) {
            System.err.println(
                    "[WEBSOCKET SENSOR] Loi tao JSON: "
                    + e.getMessage()
            );
        }
    }
}
