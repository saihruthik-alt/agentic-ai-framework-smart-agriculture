package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sensor_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "soil_moisture", precision = 5, scale = 2)
    private BigDecimal soilMoisture;

    @Column(name = "soil_temp", precision = 5, scale = 2)
    private BigDecimal soilTemp;

    @Column(name = "npk_nitrogen", precision = 5, scale = 2)
    private BigDecimal npkNitrogen;

    @Column(name = "npk_phosphorus", precision = 5, scale = 2)
    private BigDecimal npkPhosphorus;

    @Column(name = "npk_potassium", precision = 5, scale = 2)
    private BigDecimal npkPotassium;

    @NotNull
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
