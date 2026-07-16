package com.smartagri.core.service;

import com.smartagri.core.domain.Crop;
import com.smartagri.core.domain.Farm;
import com.smartagri.core.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CropService {

    private final CropRepository cropRepository;
    private final FarmService farmService;

    @Transactional
    public Crop addCropToFarm(UUID farmId, Crop crop, String username) {
        // This implicitly verifies farm ownership and access rights
        Farm farm = farmService.getFarmById(farmId, username);
        crop.setFarm(farm);
        if (crop.getStatus() == null) {
            crop.setStatus(Crop.Status.PLANTED);
        }
        return cropRepository.save(crop);
    }

    public List<Crop> getCropsByFarm(UUID farmId, String username) {
        // Verify farm ownership first
        Farm farm = farmService.getFarmById(farmId, username);
        return cropRepository.findByFarm(farm);
    }

    @Transactional
    public void deleteCrop(UUID farmId, UUID cropId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found"));
        if (!crop.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Crop does not belong to this farm");
        }
        cropRepository.delete(crop);
    }
}
