package com.iot.iotsystem.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {

    private final JdbcTemplate jdbcTemplate;

    public SensorController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Lay danh sach cam bien tu MySQL
    @GetMapping
    public List<Map<String, Object>> getAllSensors() {
        String sql = """
            SELECT id, code, name, type, unit, mqtt_topic
            FROM sensors
            ORDER BY id
            """;

        return jdbcTemplate.queryForList(sql);
    }
}
