package com.smartagri.core.service;

import com.smartagri.core.domain.Farm;
import com.smartagri.core.domain.User;
import com.smartagri.core.repository.FarmRepository;
import com.smartagri.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    @Transactional
    public Farm createFarm(Farm farm, String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        farm.setOwner(owner);
        return farmRepository.save(farm);
    }

    public List<Farm> getFarms(String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return farmRepository.findByOwner(owner);
    }

    public Farm getFarmById(UUID farmId, String username) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return farmRepository.findByIdAndOwner(farmId, owner)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found or access denied"));
    }

    @Transactional
    public void deleteFarm(UUID farmId, String username) {
        Farm farm = getFarmById(farmId, username);
        farmRepository.delete(farm);
    }
}
