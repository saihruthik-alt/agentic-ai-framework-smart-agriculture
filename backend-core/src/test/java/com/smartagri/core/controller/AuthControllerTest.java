package com.smartagri.core.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartagri.core.dto.AuthResponse;
import com.smartagri.core.dto.LoginRequest;
import com.smartagri.core.dto.RegisterRequest;
import com.smartagri.core.service.AuthService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Disable security filters to test MVC bindings directly
@ActiveProfiles("h2")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testRegisterSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("testfarmer")
                .email("farmer@agri.com")
                .password("securepassword")
                .role("FARMER")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("mock-jwt-token")
                .userId(UUID.randomUUID())
                .username("testfarmer")
                .email("farmer@agri.com")
                .role("FARMER")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.username").value("testfarmer"))
                .andExpect(jsonPath("$.role").value("FARMER"));
    }

    @Test
    public void testLoginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("testfarmer")
                .password("securepassword")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("mock-jwt-token")
                .userId(UUID.randomUUID())
                .username("testfarmer")
                .email("farmer@agri.com")
                .role("FARMER")
                .build();

        Mockito.when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.username").value("testfarmer"));
    }
}
