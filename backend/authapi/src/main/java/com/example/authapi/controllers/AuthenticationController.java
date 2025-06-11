package com.example.authapi.controllers;

import com.example.authapi.dtos.LoginUserDto;
import com.example.authapi.dtos.RegisterUserDto;
import com.example.authapi.entities.User;
import com.example.authapi.responses.LoginResponse;
import com.example.authapi.services.AuthenticationPredictionResponse;
import com.example.authapi.services.AuthenticationService;
import com.example.authapi.services.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
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

    // Existing login endpoint for TOTP (if needed directly)
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login-totp") // Renamed to avoid conflict with new endpoint
    public ResponseEntity<LoginResponse> authenticateWithTotp(@RequestBody LoginUserDto loginUserDto) {
        try {
            User user = authenticationService.authenticate(loginUserDto);
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(jwtService.generateToken(user));
            loginResponse.setExpiresIN(jwtService.getExpirationTime());
            return ResponseEntity.ok(loginResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    // New login endpoint that uses FastAPI prediction
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login")
    public ResponseEntity<?> loginWithPrediction(@RequestBody LoginUserDto loginUserDto) {
        try {
            // Extract IP data from the request if it's sent from the frontend
            // For simplicity, let's assume LoginUserDto now contains 'ipData' as JsonNode
            AuthenticationPredictionResponse response = authenticationService.authenticateWithPrediction(loginUserDto, loginUserDto.getIpData());

            if ("normal".equals(response.getPrediction())) {
                // If prediction is normal, return JWT without TOTP
                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setToken(jwtService.generateToken(response.getUser()));
                loginResponse.setExpiresIN(jwtService.getExpirationTime());
                return ResponseEntity.ok(loginResponse); // Frontend will redirect to LoginS
            } else {
                // If prediction is anomaly, instruct frontend to show TOTP
                // You can send a custom status code or a specific response body
                return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED) // Or 403 Forbidden, 412 Precondition Failed
                        .body("TOTP_REQUIRED"); // Frontend will check this string
            }
        } catch (Exception e) {
            System.err.println("Login with prediction failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }

    // New endpoint for TOTP verification after an anomaly prediction and model update
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login-anomaly-totp")
    public ResponseEntity<LoginResponse> authenticateAnomalyWithTotp(@RequestBody LoginUserDto loginUserDto) {
        try {
            User user = authenticationService.authenticateAndAttemptModelUpdate(loginUserDto);
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setToken(jwtService.generateToken(user));
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