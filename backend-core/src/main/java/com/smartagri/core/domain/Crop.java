package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crops")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String variety;

    @NotNull
    @Column(name = "planted_at", nullable = false)
    private LocalDate plantedAt;

    @Column(name = "harvest_planned_at")
    private LocalDate harvestPlannedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Status {
        PLANTED,
        GROWING,
        HARVESTED,
        FAILED
    }
}
