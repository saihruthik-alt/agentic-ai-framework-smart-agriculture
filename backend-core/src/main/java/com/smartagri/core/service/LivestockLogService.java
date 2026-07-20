package com.smartagri.core.service;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.LivestockLog;
import com.smartagri.core.repository.LivestockLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LivestockLogService {

    private final LivestockLogRepository livestockLogRepository;
    private final FarmService farmService;

    @Transactional
    public LivestockLog logLivestockStatus(UUID farmId, LivestockLog log, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        log.setFarm(farm);
        if (log.getLoggedAt() == null) {
            log.setLoggedAt(LocalDateTime.now());
        }
        return livestockLogRepository.save(log);
    }

    public List<LivestockLog> getLivestockLogs(UUID farmId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        List<LivestockLog> logs = livestockLogRepository.findByFarmIdOrderByLoggedAtDesc(farm.getId());
        
        // Seed default livestock entries if none exist yet to simulate sensor tags
        if (logs.isEmpty()) {
            seedDefaultLivestock(farm);
            logs = livestockLogRepository.findByFarmIdOrderByLoggedAtDesc(farm.getId());
        }
        return logs;
    }

    private void seedDefaultLivestock(Farm farm) {
        LivestockLog cow1 = LivestockLog.builder()
                .farm(farm)
                .tagId("RFID-COW-1002")
                .animalType("Cow")
                .bodyTempCelsius(BigDecimal.valueOf(38.6))
                .activityStatus("Active")
                .loggedAt(LocalDateTime.now().minusMinutes(10))
                .build();

        LivestockLog buffalo1 = LivestockLog.builder()
                .farm(farm)
                .tagId("RFID-BUF-2004")
                .animalType("Buffalo")
                .bodyTempCelsius(BigDecimal.valueOf(39.1))
                .activityStatus("Resting")
                .loggedAt(LocalDateTime.now().minusMinutes(25))
                .build();

        LivestockLog goat1 = LivestockLog.builder()
                .farm(farm)
                .tagId("RFID-GOA-3008")
                .animalType("Goat")
                .bodyTempCelsius(BigDecimal.valueOf(38.9))
                .activityStatus("Active")
                .loggedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        livestockLogRepository.save(cow1);
        livestockLogRepository.save(buffalo1);
        livestockLogRepository.save(goat1);
    }
}
