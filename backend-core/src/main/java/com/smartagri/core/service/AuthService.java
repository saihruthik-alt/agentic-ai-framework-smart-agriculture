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
            User user = userRepository.findByEmail(finalEmail)
                    .orElseGet(() -> {
                        // Generate a unique username if the default one is already taken
                        String username = finalName.replaceAll("[^a-zA-Z0-9]", "");
                        if (username.length() < 3) {
                            username = "user_" + username;
                        }
                        if (username.length() > 40) {
                            username = username.substring(0, 40);
                        }
                        
                        String uniqueUsername = username;
                        int suffix = 1;
                        while (userRepository.existsByUsername(uniqueUsername)) {
                            uniqueUsername = username + suffix;
                            suffix++;
                        }

                        User newUser = User.builder()
                                .username(uniqueUsername)
                                .email(finalEmail)
                                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                                .role(User.Role.FARMER)
                                .build();
                        return userRepository.save(newUser);
                    });

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to authenticate with Google: " + e.getMessage(), e);
        }
    }
}
