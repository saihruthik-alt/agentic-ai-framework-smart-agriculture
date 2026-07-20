package com.smartagri.core.controller;

import com.smartagri.core.domain.SensorLog;
import com.smartagri.core.service.SensorLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/farms")
@RequiredArgsConstructor
public class SensorLogController {

    private final SensorLogService sensorLogService;

    @PostMapping("/{farmId}/telemetry")
    public ResponseEntity<SensorLog> addSensorLog(
            @PathVariable UUID farmId,
            @Valid @RequestBody SensorLog log,
            Principal principal
    ) {
        try {
            SensorLog saved = sensorLogService.saveSensorLog(farmId, log, principal.getName());
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{farmId}/telemetry")
    public ResponseEntity<List<SensorLog>> getSensorLogs(
            @PathVariable UUID farmId,
            Principal principal
    ) {
        try {
            List<SensorLog> logs = sensorLogService.getSensorLogs(farmId, principal.getName());
            return ResponseEntity.ok(logs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{farmId}/telemetry/latest")
    public ResponseEntity<List<SensorLog>> getLatestSensorLogs(
            @PathVariable UUID farmId,
            Principal principal
    ) {
        try {
            List<SensorLog> logs = sensorLogService.getLatestSensorLogs(farmId, principal.getName());
            return ResponseEntity.ok(logs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
