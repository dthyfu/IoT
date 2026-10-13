
package com.iot.iotsystem.service;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MqttService {

    private final MqttClient mqttClient;

    @Value("${mqtt.topic.device-control}")
    private String deviceControlTopic;

    public MqttService(MqttClient mqttClient) {
        this.mqttClient = mqttClient;
    }

    public void publish(String message) throws Exception {
        MqttMessage mqttMessage = new MqttMessage(
                message.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        mqttMessage.setQos(1);

        mqttClient.publish(deviceControlTopic, mqttMessage);
    }
}
