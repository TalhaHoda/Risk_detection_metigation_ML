package com.example.authapi.controllers;

import com.example.authapi.dtos.LoginUserDto;
import com.example.authapi.dtos.RegisterUserDto;
import com.example.authapi.entities.User;
import com.example.authapi.responses.LoginResponse;
import com.example.authapi.services.AuthenticationService;
import com.example.authapi.services.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/auth")
@RestController
public class AuthenticationController {
    private final JwtService jwtService;
    private final AuthenticationService authenticationService;

    public AuthenticationController(JwtService jwtService, AuthenticationService authenticationService) {
        this.jwtService = jwtService;
        this.authenticationService = authenticationService;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/signup")
    public ResponseEntity<User> register(@RequestBody RegisterUserDto registerUserDto) {
        User registeredUser = authenticationService.signup(registerUserDto);
        if (registeredUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(registeredUser);
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginUserDto loginUserDto) {
        try {
            // Authenticate the user and validate TOTP, then generate JWT token
            String jwtToken = String.valueOf(authenticationService.authenticate(loginUserDto));

            // Prepare the login response
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(jwtToken);
            loginResponse.setExpiresIN(jwtService.getExpirationTime());

            return ResponseEntity.ok(loginResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping("/getSecret")
    public ResponseEntity<String> getSecret() {
        String secret = authenticationService.getSecret();
        if (secret == null || secret.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("");
        }
        return ResponseEntity.status(HttpStatus.OK).body(secret);
    }
}
