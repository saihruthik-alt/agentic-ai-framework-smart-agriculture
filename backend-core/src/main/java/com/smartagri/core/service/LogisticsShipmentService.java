package com.smartagri.core.service;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.LogisticsShipment;
import com.smartagri.core.repository.LogisticsShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LogisticsShipmentService {

    private final LogisticsShipmentRepository logisticsShipmentRepository;
    private final FarmService farmService;

    @Transactional
    public LogisticsShipment createShipment(UUID farmId, LogisticsShipment shipment, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        shipment.setFarm(farm);
        shipment.setUpdatedAt(LocalDateTime.now());
        if (shipment.getStatus() == null) {
            shipment.setStatus("HARVESTED");
        }
        return logisticsShipmentRepository.save(shipment);
    }

    public List<LogisticsShipment> getShipments(UUID farmId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        return logisticsShipmentRepository.findByFarmIdOrderByUpdatedAtDesc(farm.getId());
    }

    @Transactional
    public LogisticsShipment updateStatus(UUID farmId, UUID shipmentId, String status, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        LogisticsShipment shipment = logisticsShipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
        
        if (!shipment.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        
        shipment.setStatus(status);
        shipment.setUpdatedAt(LocalDateTime.now());
        return logisticsShipmentRepository.save(shipment);
    }
}
