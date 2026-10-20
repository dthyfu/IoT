
package com.iot.iotsystem.auth;

import com.iot.iotsystem.model.User;
import com.iot.iotsystem.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Map<String, Object> login(LoginRequest request) {

        if (request.getUsername() == null
                || request.getUsername().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"
            );
        }

        User user = userRepository
                .findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tên đăng nhập hoặc mật khẩu không đúng"
                ));

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPasswordHash()
                )) {
            throw new IllegalArgumentException(
                    "Tên đăng nhập hoặc mật khẩu không đúng"
            );
        }

        return Map.of(
                "message", "Đăng nhập thành công",
                "id", user.getId(),
                "username", user.getUsername(),
                "fullName", user.getFullName(),
                "email", user.getEmail() == null ? "" : user.getEmail()
        );
    }
}
