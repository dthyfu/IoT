
package com.iot.iotsystem.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final JdbcTemplate jdbcTemplate;

    public HistoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Get all device control history, newest first.
    @GetMapping
    public List<Map<String, Object>> getAllHistory() {
        String sql = """
            SELECT
                ah.id AS id,
                d.name AS device_name,
                ah.action AS action,
                ah.status AS device_status,
                u.username AS performed_by,
                COALESCE(ah.completed_at, ah.requested_at) AS time
            FROM action_history ah
            JOIN devices d ON ah.device_id = d.id
            JOIN users u ON ah.user_id = u.id
            ORDER BY ah.requested_at DESC, ah.id DESC
            """;

        return jdbcTemplate.queryForList(sql);
    }
}
