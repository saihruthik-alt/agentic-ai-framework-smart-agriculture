package com.smartagri.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "government_schemes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GovernmentScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "scheme_name", nullable = false)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @NotNull
    @Column(name = "eligibility_state", nullable = false)
    private String eligibleState; // Andhra Pradesh, Telangana, All

    @NotNull
    @Column(name = "max_land_size_hectares", precision = 6, scale = 2, nullable = false)
    private BigDecimal maxLandSizeHectares;

    @NotNull
    @Column(name = "benefit_details", nullable = false)
    private String benefitDetails;
}
