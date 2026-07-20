package com.smartagri.core.repository;

import com.smartagri.core.domain.SensorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SensorLogRepository extends JpaRepository<SensorLog, Long> {

    @Query("SELECT s FROM SensorLog s WHERE s.farm.id = :farmId ORDER BY s.recordedAt ASC")
    List<SensorLog> findByFarmIdOrderByRecordedAtAsc(@Param("farmId") UUID farmId);

    @Query("SELECT s FROM SensorLog s WHERE s.farm.id = :farmId ORDER BY s.recordedAt DESC")
    List<SensorLog> findTop10ByFarmIdOrderByRecordedAtDesc(@Param("farmId") UUID farmId);
}
