package com.smartagri.core.service;

import com.smartagri.core.domain.GovernmentScheme;
import com.smartagri.core.repository.GovernmentSchemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GovernmentSchemeService {

    private final GovernmentSchemeRepository governmentSchemeRepository;

    @Transactional
    public List<GovernmentScheme> getEligibleSchemes(String state, BigDecimal landSize) {
        if (governmentSchemeRepository.count() == 0) {
            seedDefaultSchemes();
        }
        return governmentSchemeRepository.findEligibleSchemes(state, landSize);
    }

    private void seedDefaultSchemes() {
        GovernmentScheme pmKisan = GovernmentScheme.builder()
                .name("PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)")
                .description("Income support scheme providing financial assistance to all landholder farmer families.")
                .eligibleState("All")
                .maxLandSizeHectares(BigDecimal.valueOf(2.0))
                .benefitDetails("₹6,000 per year in three equal installments directly transferred to bank accounts.")
                .build();

        GovernmentScheme rythuBandhu = GovernmentScheme.builder()
                .name("Rythu Bandhu Scheme (Telangana)")
                .description("Agricultural investment support scheme providing direct cash assistance to farmers per season.")
                .eligibleState("Telangana")
                .maxLandSizeHectares(BigDecimal.valueOf(10.0))
                .benefitDetails("₹10,000 per acre per year directly into bank accounts for seed/fertilizer purchases.")
                .build();

        GovernmentScheme rythuBharosa = GovernmentScheme.builder()
                .name("YSR Rythu Bharosa (Andhra Pradesh)")
                .description("Financial assistance program supporting farming households including tenant farmers.")
                .eligibleState("Andhra Pradesh")
                .maxLandSizeHectares(BigDecimal.valueOf(5.0))
                .benefitDetails("₹13,500 per year directly to farming households to cover input costs.")
                .build();

        GovernmentScheme cropInsurance = GovernmentScheme.builder()
                .name("PM Fasal Bima Yojana (Crop Insurance)")
                .description("Uniform premium crop insurance scheme guarding against natural calamities and pests.")
                .eligibleState("All")
                .maxLandSizeHectares(BigDecimal.valueOf(20.0))
                .benefitDetails("Comprehensive risk coverage from pre-sowing to post-harvest failures with premium capped at 2.0%.")
                .build();

        governmentSchemeRepository.save(pmKisan);
        governmentSchemeRepository.save(rythuBandhu);
        governmentSchemeRepository.save(rythuBharosa);
        governmentSchemeRepository.save(cropInsurance);
    }
}
