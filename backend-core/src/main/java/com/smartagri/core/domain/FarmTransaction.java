package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "farm_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @NotNull
    @Column(name = "transaction_type", nullable = false)
    private String type; // EXPENSE, REVENUE

    @NotNull
    @Column(name = "category", nullable = false)
    private String category; // SEEDS, FERTILIZERS, LABOR, SALES, MACHINERY

    @NotNull
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "description")
    private String description;

    @NotNull
    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;
}
