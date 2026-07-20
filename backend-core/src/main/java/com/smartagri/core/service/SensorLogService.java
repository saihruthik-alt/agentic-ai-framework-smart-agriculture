package com.smartagri.core.service;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.SensorLog;
import com.smartagri.core.repository.SensorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SensorLogService {

    private final SensorLogRepository sensorLogRepository;
    private final FarmService farmService;

    @Transactional
    public SensorLog saveSensorLog(UUID farmId, SensorLog log, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        log.setFarm(farm);
        if (log.getRecordedAt() == null) {
            log.setRecordedAt(LocalDateTime.now());
        }
        return sensorLogRepository.save(log);
    }

    public List<SensorLog> getSensorLogs(UUID farmId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        return sensorLogRepository.findByFarmIdOrderByRecordedAtAsc(farm.getId());
    }

    public List<SensorLog> getLatestSensorLogs(UUID farmId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        return sensorLogRepository.findTop10ByFarmIdOrderByRecordedAtDesc(farm.getId());
    }
}
