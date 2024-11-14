package com.example.authapi.controllers;

import ch.qos.logback.core.net.SyslogOutputStream;
import com.example.authapi.entities.User;
import com.example.authapi.dtos.LoginUserDto;
import com.example.authapi.dtos.RegisterUserDto;
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
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(registeredUser);
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginUserDto loginUserDto) {
        User authenticatedUser = authenticationService.authenticate(loginUserDto);

        String jwtToken = jwtService.generateToken(authenticatedUser);

        System.out.println("my JWT token is "+jwtToken);

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setToken(jwtToken);
        loginResponse.setExpiresIN(jwtService.getExpirationTime());

        return ResponseEntity.ok(loginResponse);
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping ("/getSecret")
    public ResponseEntity<String> getSecret() {
        String secret = authenticationService.getSecret();
        if(secret == null || secret.isEmpty()) {
            System.out.println("my secret generation is failed "+secret);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("");
        }
        System.out.println("my secret generation is successfully "+secret);
        return ResponseEntity.status(HttpStatus.OK).body(secret);
        //return "AJLFHRBCRJDLSMFIOPDG";
    }
}