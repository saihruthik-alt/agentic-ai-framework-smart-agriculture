package com.smartagri.core.repository;

import com.smartagri.core.domain.LivestockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LivestockLogRepository extends JpaRepository<LivestockLog, UUID> {

    @Query("SELECT l FROM LivestockLog l WHERE l.farm.id = :farmId ORDER BY l.loggedAt DESC")
    List<LivestockLog> findByFarmIdOrderByLoggedAtDesc(@Param("farmId") UUID farmId);
}
