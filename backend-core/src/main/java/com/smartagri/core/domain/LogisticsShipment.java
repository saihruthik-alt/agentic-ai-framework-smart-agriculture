package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "logistics_shipments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsShipment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @NotNull
    @Column(name = "crop_name", nullable = false)
    private String cropName;

    @NotNull
    @Column(name = "quantity_quintals", precision = 8, scale = 2, nullable = false)
    private BigDecimal quantityQuintals;

    @NotNull
    @Column(name = "destination_mandi", nullable = false)
    private String destinationMandi;

    @NotNull
    @Column(name = "transit_status", nullable = false)
    private String status; // HARVESTED, IN_TRANSIT, ARRIVED, SOLD

    @Column(name = "estimated_delivery")
    private LocalDateTime estimatedDelivery;

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
