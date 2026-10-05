package com.thoughtline.api.service;

import com.thoughtline.api.dto.Dtos.AuthResponse;
import com.thoughtline.api.dto.Dtos.LoginInput;
import com.thoughtline.api.dto.Dtos.RegisterInput;
import com.thoughtline.api.dto.Dtos.UserResponse;
import com.thoughtline.api.model.Role;
import com.thoughtline.api.model.UserAccount;
import com.thoughtline.api.repository.UserRepository;
import com.thoughtline.api.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwtService) {
        this.users = users;
        this.passwords = passwords;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterInput input) {
        String username = input.username().trim();
        String email = input.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already uses this email");
        }
        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setEmail(email);
        user.setDisplayName(input.displayName().trim());
        user.setPasswordHash(passwords.encode(input.password()));
        user.setRole(Role.USER);
        user = users.save(user);
        return new AuthResponse(jwtService.issue(user), toResponse(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginInput input) {
        UserAccount user = users.findByEmailIgnoreCase(input.email().trim())
            .filter(account -> passwords.matches(input.password(), account.getPasswordHash()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect"));
        return new AuthResponse(jwtService.issue(user), toResponse(user));
    }

    public static UserResponse toResponse(UserAccount user) {
        return new UserResponse(
            user.getId(), user.getUsername(), user.getEmail(), user.getDisplayName(),
            user.getBio(), user.getRole(), user.getCreatedAt()
        );
    }
}
