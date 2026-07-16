package com.smartagri.core.repository;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FarmRepository extends JpaRepository<Farm, UUID> {
    List<Farm> findByOwner(User owner);
    Optional<Farm> findByIdAndOwner(UUID id, User owner);
}
