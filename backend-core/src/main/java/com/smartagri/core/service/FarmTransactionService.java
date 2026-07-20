package com.smartagri.core.service;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.FarmTransaction;
import com.smartagri.core.repository.FarmTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FarmTransactionService {

    private final FarmTransactionRepository farmTransactionRepository;
    private final FarmService farmService;

    @Transactional
    public FarmTransaction logTransaction(UUID farmId, FarmTransaction transaction, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        transaction.setFarm(farm);
        if (transaction.getLoggedAt() == null) {
            transaction.setLoggedAt(LocalDateTime.now());
        }
        return farmTransactionRepository.save(transaction);
    }

    public List<FarmTransaction> getTransactions(UUID farmId, String username) {
        Farm farm = farmService.getFarmById(farmId, username);
        return farmTransactionRepository.findByFarmIdOrderByLoggedAtDesc(farm.getId());
    }
}
