package com.smartagri.core.repository;

import com.smartagri.core.domain.Crop;
import com.smartagri.core.domain.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CropRepository extends JpaRepository<Crop, UUID> {
    List<Crop> findByFarm(Farm farm);
    Optional<Crop> findByIdAndFarm(UUID id, Farm farm);
}
