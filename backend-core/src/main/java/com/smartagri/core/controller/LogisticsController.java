package com.smartagri.core.controller;

import com.smartagri.core.domain.LogisticsShipment;
import com.smartagri.core.service.LogisticsShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/farms/{farmId}/logistics")
@RequiredArgsConstructor
public class LogisticsController {

    private final LogisticsShipmentService logisticsShipmentService;

    @PostMapping
    public ResponseEntity<LogisticsShipment> createShipment(
            @PathVariable UUID farmId,
            @Valid @RequestBody LogisticsShipment shipment,
            Principal principal) {
        LogisticsShipment created = logisticsShipmentService.createShipment(farmId, shipment, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LogisticsShipment>> getShipments(
            @PathVariable UUID farmId,
            Principal principal) {
        List<LogisticsShipment> list = logisticsShipmentService.getShipments(farmId, principal.getName());
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{shipmentId}")
    public ResponseEntity<LogisticsShipment> updateStatus(
            @PathVariable UUID farmId,
            @PathVariable UUID shipmentId,
            @RequestParam String status,
            Principal principal) {
        LogisticsShipment updated = logisticsShipmentService.updateStatus(farmId, shipmentId, status, principal.getName());
        return ResponseEntity.ok(updated);
    }
}
