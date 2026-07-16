package com.smartagri.core.controller;

import com.smartagri.core.domain.Crop;
import com.smartagri.core.domain.Farm;
import com.smartagri.core.service.CropService;
import com.smartagri.core.service.FarmService;
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
public class FarmController {

    private final FarmService farmService;
    private final CropService cropService;

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
}
