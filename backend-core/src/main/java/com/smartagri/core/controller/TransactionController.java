package com.smartagri.core.controller;

import com.smartagri.core.domain.FarmTransaction;
import com.smartagri.core.service.FarmTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/farms/{farmId}/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final FarmTransactionService farmTransactionService;

    @PostMapping
    public ResponseEntity<FarmTransaction> logTransaction(
            @PathVariable UUID farmId,
            @Valid @RequestBody FarmTransaction transaction,
            Principal principal) {
        FarmTransaction created = farmTransactionService.logTransaction(farmId, transaction, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FarmTransaction>> getTransactions(
            @PathVariable UUID farmId,
            Principal principal) {
        List<FarmTransaction> list = farmTransactionService.getTransactions(farmId, principal.getName());
        return ResponseEntity.ok(list);
    }
}
