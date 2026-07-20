package com.smartagri.core.controller;

import com.smartagri.core.domain.GovernmentScheme;
import com.smartagri.core.service.GovernmentSchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/schemes")
@RequiredArgsConstructor
public class SchemeController {

    private final GovernmentSchemeService governmentSchemeService;

    @GetMapping("/eligible")
    public ResponseEntity<List<GovernmentScheme>> getEligibleSchemes(
            @RequestParam String state,
            @RequestParam BigDecimal landSize) {
        List<GovernmentScheme> eligible = governmentSchemeService.getEligibleSchemes(state, landSize);
        return ResponseEntity.ok(eligible);
    }
}
