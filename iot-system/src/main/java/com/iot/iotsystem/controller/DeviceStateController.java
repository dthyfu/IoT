
package com.iot.iotsystem.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceStateController {

    private final JdbcTemplate jdbcTemplate;

    public DeviceStateController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/status")
    public List<Map<String, Object>> getDeviceStatus() {
        String sql = """
            SELECT
                id,
                name,
                current_status
            FROM devices
            ORDER BY id
            """;

        return jdbcTemplate.queryForList(sql);
    }
}