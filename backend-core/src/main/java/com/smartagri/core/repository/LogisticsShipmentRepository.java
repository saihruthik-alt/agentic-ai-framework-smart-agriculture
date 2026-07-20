package com.smartagri.core.repository;

import com.smartagri.core.domain.LogisticsShipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LogisticsShipmentRepository extends JpaRepository<LogisticsShipment, UUID> {

    @Query("SELECT s FROM LogisticsShipment s WHERE s.farm.id = :farmId ORDER BY s.updatedAt DESC")
    List<LogisticsShipment> findByFarmIdOrderByUpdatedAtDesc(@Param("farmId") UUID farmId);
}
