package com.smartagri.core.config;

import com.smartagri.core.domain.User;
import com.smartagri.core.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String defaultUsername = "saihruthik";
        if (!userRepository.existsByUsername(defaultUsername)) {
            User user = User.builder()
                    .username(defaultUsername)
                    .email("saihruthik2005@gmail.com")
                    .passwordHash(passwordEncoder.encode("saihruthik"))
                    .role(User.Role.FARMER)
                    .build();
            userRepository.save(user);
            System.out.println("🟢 Successfully seeded default user: saihruthik / saihruthik");
        }
    }
}
