package com.smartagri.core.service;

import com.smartagri.core.config.JwtService;
import com.smartagri.core.domain.User;
import com.smartagri.core.dto.AuthResponse;
import com.smartagri.core.dto.LoginRequest;
import com.smartagri.core.dto.RegisterRequest;
import com.smartagri.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User.Role userRole;
        try {
            userRole = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            userRole = User.Role.FARMER;
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .build();

        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
        String token = jwtService.generateToken(userDetails, savedUser.getId(), savedUser.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String searchKey = request.getUsername().trim().toLowerCase();
        User user = userRepository.findByUsername(searchKey)
                .or(() -> userRepository.findByEmail(searchKey))
                .orElseThrow(() -> new IllegalArgumentException("Username or email not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid password");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse loginGoogle(Map<String, String> requestBody) {
        String idToken = requestBody.get("credential");
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Credential token is missing");
        }

        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid Google token format");
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);

            String email = (String) payload.get("email");
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("Email not found in Google token");
            }
            final String finalEmail = email.trim().toLowerCase();
            String name = (String) payload.get("name");

            if (name == null || name.trim().isEmpty()) {
                name = (String) payload.get("given_name");
            }
            if (name == null || name.trim().isEmpty()) {
                name = finalEmail.split("@")[0];
            }

            String finalName = name;
            Optional<User> existingUserOpt = userRepository.findByEmail(finalEmail);
            
            if (existingUserOpt.isEmpty()) {
                // If it is the first time
                String chosenUsername = requestBody.get("username");
                if (chosenUsername == null || chosenUsername.trim().isEmpty()) {
                    String suggestedUsername = finalName.replaceAll("[^a-zA-Z0-9]", "");
                    if (suggestedUsername.length() < 3) {
                        suggestedUsername = "user_" + suggestedUsername;
                    }
                    if (suggestedUsername.length() > 40) {
                        suggestedUsername = suggestedUsername.substring(0, 40);
                    }
                    
                    String uniqueSuggested = suggestedUsername;
                    int suffix = 1;
                    while (userRepository.existsByUsername(uniqueSuggested)) {
                        uniqueSuggested = suggestedUsername + suffix;
                        suffix++;
                    }
                    
                    return AuthResponse.builder()
                            .needsUsername(true)
                            .status("NEW_USER")
                            .email(finalEmail)
                            .username(uniqueSuggested)
                            .build();
                }
                
                String cleanUsername = chosenUsername.trim();
                if (cleanUsername.length() < 3) {
                    throw new IllegalArgumentException("Username must be at least 3 characters long");
                }
                if (userRepository.existsByUsername(cleanUsername)) {
                    throw new IllegalArgumentException("Username is already taken");
                }
                
                User newUser = User.builder()
                        .username(cleanUsername)
                        .email(finalEmail)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(User.Role.FARMER)
                        .build();
                User savedUser = userRepository.save(newUser);
                
                UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
                String token = jwtService.generateToken(userDetails, savedUser.getId(), savedUser.getRole().name());
                return AuthResponse.builder()
                        .token(token)
                        .userId(savedUser.getId())
                        .username(savedUser.getUsername())
                        .email(savedUser.getEmail())
                        .role(savedUser.getRole().name())
                        .needsUsername(false)
                        .status("SUCCESS")
                        .build();
            }
            
            User user = existingUserOpt.get();
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());
            
            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .needsUsername(false)
                    .status("SUCCESS")
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to authenticate with Google: " + e.getMessage(), e);
        }
    }
}
