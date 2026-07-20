package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "livestock_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivestockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @NotNull
    @Column(name = "tag_id", nullable = false)
    private String tagId; // RFID ear tag ID

    @NotNull
    @Column(name = "animal_type", nullable = false)
    private String animalType; // Cow, Buffalo, Goat

    @NotNull
    @Column(name = "body_temp_celsius", precision = 4, scale = 1, nullable = false)
    private BigDecimal bodyTempCelsius;

    @NotNull
    @Column(name = "activity_status", nullable = false)
    private String activityStatus; // Active, Resting, Low Activity

    @NotNull
    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;
}
