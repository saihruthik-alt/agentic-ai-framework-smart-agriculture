package com.smartagri.core.controller;

import com.smartagri.core.domain.Crop;
import com.smartagri.core.domain.Farm;
import com.smartagri.core.dto.FarmReportDTO;
import com.smartagri.core.service.CropService;
import com.smartagri.core.service.FarmService;
import com.smartagri.core.service.SensorLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;
    private final CropService cropService;
    private final SensorLogService sensorLogService;

    @GetMapping("/{farmId}/report")
    public ResponseEntity<FarmReportDTO> getFarmReport(@PathVariable UUID farmId, Principal principal) {
        try {
            Farm farm = farmService.getFarmById(farmId, principal.getName());
            List<Crop> crops = cropService.getCropsByFarm(farmId, principal.getName());
            List<com.smartagri.core.domain.SensorLog> logs = sensorLogService.getLatestSensorLogs(farmId, principal.getName());
            
            List<FarmReportDTO.CropSummary> cropSummaries = crops.stream()
                .map(c -> FarmReportDTO.CropSummary.builder()
                    .cropId(c.getId())
                    .name(c.getName())
                    .variety(c.getVariety())
                    .status(c.getStatus().name())
                    .plantedAt(c.getPlantedAt().toString())
                    .harvestPlannedAt(c.getHarvestPlannedAt() != null ? c.getHarvestPlannedAt().toString() : "N/A")
                    .build())
                .toList();
                
            FarmReportDTO.TelemetrySummary telemetrySummary = null;
            if (!logs.isEmpty()) {
                com.smartagri.core.domain.SensorLog latest = logs.get(0);
                telemetrySummary = FarmReportDTO.TelemetrySummary.builder()
                    .soilMoisture(latest.getSoilMoisture())
                    .soilTemp(latest.getSoilTemp())
                    .npkNitrogen(latest.getNpkNitrogen())
                    .npkPhosphorus(latest.getNpkPhosphorus())
                    .npkPotassium(latest.getNpkPotassium())
                    .lastRecordedAt(latest.getRecordedAt().toString())
                    .build();
            }
            
            FarmReportDTO report = FarmReportDTO.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .latitude(farm.getLatitude())
                .longitude(farm.getLongitude())
                .soilType(farm.getSoilType())
                .totalAreaHectares(farm.getTotalAreaHectares())
                .crops(cropSummaries)
                .latestTelemetry(telemetrySummary)
                .compiledAt(LocalDateTime.now())
                .build();
                
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping
    public ResponseEntity<Farm> createFarm(@Valid @RequestBody Farm farm, Principal principal) {
        Farm created = farmService.createFarm(farm, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Farm>> getFarms(Principal principal) {
        List<Farm> farms = farmService.getFarms(principal.getName());
        return ResponseEntity.ok(farms);
    }

    @GetMapping("/{farmId}")
    public ResponseEntity<Farm> getFarmById(@PathVariable UUID farmId, Principal principal) {
        try {
            Farm farm = farmService.getFarmById(farmId, principal.getName());
            return ResponseEntity.ok(farm);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{farmId}/crops")
    public ResponseEntity<Crop> addCrop(
            @PathVariable UUID farmId,
            @Valid @RequestBody Crop crop,
            Principal principal
    ) {
        try {
            Crop planted = cropService.addCropToFarm(farmId, crop, principal.getName());
            return new ResponseEntity<>(planted, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/{farmId}/crops")
    public ResponseEntity<List<Crop>> getCrops(@PathVariable UUID farmId, Principal principal) {
        try {
            List<Crop> crops = cropService.getCropsByFarm(farmId, principal.getName());
            return ResponseEntity.ok(crops);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{farmId}")
    public ResponseEntity<Void> deleteFarm(@PathVariable UUID farmId, Principal principal) {
        try {
            farmService.deleteFarm(farmId, principal.getName());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{farmId}/crops/{cropId}")
    public ResponseEntity<Void> deleteCrop(
            @PathVariable UUID farmId,
            @PathVariable UUID cropId,
            Principal principal
    ) {
        try {
            cropService.deleteCrop(farmId, cropId, principal.getName());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
