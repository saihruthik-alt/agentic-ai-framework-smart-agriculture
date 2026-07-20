package com.smartagri.core.controller;

import com.smartagri.core.domain.LivestockLog;
import com.smartagri.core.service.LivestockLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/farms/{farmId}/livestock")
@RequiredArgsConstructor
public class LivestockController {

    private final LivestockLogService livestockLogService;

    @PostMapping
    public ResponseEntity<LivestockLog> logLivestockStatus(
            @PathVariable UUID farmId,
            @Valid @RequestBody LivestockLog log,
            Principal principal) {
        LivestockLog created = livestockLogService.logLivestockStatus(farmId, log, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LivestockLog>> getLivestockLogs(
            @PathVariable UUID farmId,
            Principal principal) {
        List<LivestockLog> list = livestockLogService.getLivestockLogs(farmId, principal.getName());
        return ResponseEntity.ok(list);
    }
}
