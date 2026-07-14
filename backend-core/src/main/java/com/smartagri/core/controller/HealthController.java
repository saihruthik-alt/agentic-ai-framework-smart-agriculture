package com.smartagri.core.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "backend-core");
        
        // Check DB Connection
        try {
            jdbcTemplate.execute("SELECT 1");
            status.put("database", "UP");
        } catch (Exception e) {
            status.put("database", "DOWN (" + e.getMessage() + ")");
            status.put("status", "DEGRADED");
        }

        // Check Redis Connection
        try {
            String ping = redisTemplate.getConnectionFactory().getConnection().ping();
            status.put("redis", "UP (" + ping + ")");
        } catch (Exception e) {
            status.put("redis", "DOWN (" + e.getMessage() + ")");
            status.put("status", "DEGRADED");
        }

        return ResponseEntity.ok(status);
    }
}
