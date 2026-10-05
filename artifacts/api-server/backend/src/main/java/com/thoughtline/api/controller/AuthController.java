package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.AuthResponse;
import com.thoughtline.api.dto.Dtos.LoginInput;
import com.thoughtline.api.dto.Dtos.RegisterInput;
import com.thoughtline.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterInput input) {
        return authService.register(input);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginInput input) {
        return authService.login(input);
    }
}
