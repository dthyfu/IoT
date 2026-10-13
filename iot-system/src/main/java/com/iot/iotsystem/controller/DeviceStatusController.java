
package com.iot.iotsystem.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class DeviceStatusController {

    private final SimpMessagingTemplate messagingTemplate;

    public DeviceStatusController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Gui trang thai thiet bi den frontend qua WebSocket
    public void sendDeviceStatus(String device, String status) {
        Map<String, String> data = Map.of(
                "device", device,
                "status", status
        );

        messagingTemplate.convertAndSend("/topic/device-status", data);

        System.out.println(
                "[WEBSOCKET] " + device + " -> " + status
        );
    }
}
