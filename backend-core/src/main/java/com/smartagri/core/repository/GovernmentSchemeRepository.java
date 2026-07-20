package com.smartagri.core.repository;

import com.smartagri.core.domain.GovernmentScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface GovernmentSchemeRepository extends JpaRepository<GovernmentScheme, UUID> {

    @Query("SELECT g FROM GovernmentScheme g WHERE (g.eligibleState = :state OR g.eligibleState = 'All') AND g.maxLandSizeHectares >= :landSize")
    List<GovernmentScheme> findEligibleSchemes(@Param("state") String state, @Param("landSize") BigDecimal landSize);
}
