
package com.iot.iotsystem.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sensor-data")
public class SensorDataController {

    private final JdbcTemplate jdbcTemplate;

    public SensorDataController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Lay ban ghi moi nhat cua moi loai cam bien
    @GetMapping("/latest")
    public List<Map<String, Object>> getLatestSensorData() {
        String sql = """
            SELECT
                s.id AS sensor_id,
                s.code AS sensor_code,
                s.name AS sensor_name,
                s.type AS sensor_type,
                s.unit,
                sd.value,
                sd.measured_at
            FROM sensors s
            JOIN sensor_data sd ON sd.sensor_id = s.id
            WHERE sd.id = (
                SELECT MAX(sd2.id)
                FROM sensor_data sd2
                WHERE sd2.sensor_id = s.id
            )
            ORDER BY s.id
            """;

        return jdbcTemplate.queryForList(sql);
    }

    
    @GetMapping("/history")
    public List<Map<String, Object>> getSensorHistory() {
        String sql = """
            SELECT measured_at, temperature, light, humidity
            FROM (
                SELECT
                    measured_at,
                    MAX(CASE WHEN sensor_id = 1 THEN value END) AS temperature,
                    MAX(CASE WHEN sensor_id = 2 THEN value END) AS light,
                    MAX(CASE WHEN sensor_id = 3 THEN value END) AS humidity
                FROM sensor_data
                WHERE sensor_id IN (1, 2, 3)
                GROUP BY measured_at
                ORDER BY measured_at DESC
                LIMIT 15
            ) AS recent
            ORDER BY measured_at ASC
            """;

        return jdbcTemplate.queryForList(sql);
    }

    // Lay toan bo lich su du lieu cam bien, moi nhat truoc
    @GetMapping
    public List<Map<String, Object>> getAllSensorData() {
        String sql = """
            SELECT
                sd.id AS id,
                s.type AS sensor_type,
                s.name AS sensor_name,
                sd.value AS value,
                s.unit AS unit,
                sd.measured_at AS measured_at
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            ORDER BY sd.measured_at DESC, sd.id DESC
            """;

        return jdbcTemplate.queryForList(sql);
    }

}
