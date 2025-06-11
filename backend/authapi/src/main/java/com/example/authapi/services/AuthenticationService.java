package com.example.authapi.services;

import com.example.authapi.dtos.LoginUserDto;
import com.example.authapi.dtos.RegisterUserDto;
import com.example.authapi.entities.User;
import com.example.authapi.mfa.Totp;
import com.example.authapi.repositories.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final FastApiService fastApiService; // Inject FastApiService
    private final ObjectMapper objectMapper; // For creating JSON nodes

    public AuthenticationService(
            UserRepository userRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            FastApiService fastApiService,
            ObjectMapper objectMapper
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fastApiService = fastApiService;
        this.objectMapper = objectMapper;
    }

    public User signup(RegisterUserDto input) {
        if (!Totp.validateTOTP(input.getSecret(), input.getTotp())) {
            return null;
        }
        User user = new User();
        user.setFullName(input.getFullName());
        user.setEmail(input.getEmail());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setSecret(input.getSecret());
        user.setMlModelData("{}"); // Initialize mlModelData for new users
        return userRepository.save(user);
    }

    // This method will now strictly be for TOTP-enabled login (if called directly)
    public User authenticate(LoginUserDto input) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        User user = userRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!Totp.validateTOTP(user.getSecret(), input.getTotp())) {
            throw new BadCredentialsException("Invalid TOTP");
        }
        return user;
    }

    // Updated to use user-specific ML data for prediction
    public AuthenticationPredictionResponse authenticateWithPrediction(LoginUserDto input, JsonNode clientIpData) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        input.getEmail(),
                        input.getPassword()
                )
        );

        User user = userRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Get user's current ML model data (pattern memory)
        String userMlModelData = user.getMlModelData();
        if (userMlModelData == null || userMlModelData.isEmpty()) {
            userMlModelData = "{}"; // Initialize if null or empty
        }

        // Call FastAPI for prediction with user-specific data
        JsonNode predictionResult = fastApiService.getPrediction(user.getEmail(), clientIpData, userMlModelData);
        System.out.println("FastAPI Prediction Result for user " + user.getEmail() + ": " + predictionResult);

        if (predictionResult != null && predictionResult.has("prediction") && predictionResult.has("user_ml_data")) {
            double predictionValue = predictionResult.get("prediction").asDouble();
            String returnedMlModelData = predictionResult.get("user_ml_data").toString(); // Get potentially updated ML data

            // Save the updated ML model data back to the user object (even if it didn't change for prediction)
            // This ensures any initializations or minor updates from the FastAPI side are persisted.
            user.setMlModelData(returnedMlModelData);
            userRepository.save(user);

            // Determine prediction status
            if (predictionValue < 0.5) { // Assuming 0 for normal
                return new AuthenticationPredictionResponse(user, "normal", returnedMlModelData);
            } else { // Assuming 1 for anomaly
                return new AuthenticationPredictionResponse(user, "anomaly", returnedMlModelData);
            }
        } else {
            System.err.println("FastAPI prediction did not return expected format. Defaulting to anomaly.");
            return new AuthenticationPredictionResponse(user, "anomaly", userMlModelData); // Return current ML data
        }
    }

    // Updated to use user-specific ML data for model update
    public User authenticateAndAttemptModelUpdate(LoginUserDto input) {
        User user = userRepository.findByEmail(input.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!Totp.validateTOTP(user.getSecret(), input.getTotp())) {
            throw new BadCredentialsException("Invalid TOTP");
        }

        // Get user's current ML model data (pattern memory)
        String userMlModelData = user.getMlModelData();
        if (userMlModelData == null || userMlModelData.isEmpty()) {
            userMlModelData = "{}"; // Initialize if null or empty
        }

        // If TOTP is correct, attempt to update the model in FastAPI with user's specific data
        if (input.getIpData() != null) {
            // Assuming 0 is the 'normal' target to update the model with, as the user successfully verified TOTP
            JsonNode updateResult = fastApiService.updateModel(user.getEmail(), input.getIpData(), userMlModelData, 0);
            System.out.println("FastAPI Update Result for user " + user.getEmail() + ": " + updateResult);

            if (updateResult != null && updateResult.has("user_ml_data")) {
                String newMlModelData = updateResult.get("user_ml_data").toString();
                user.setMlModelData(newMlModelData); // Save the updated ML data back to the user
                userRepository.save(user);
            } else {
                System.err.println("FastAPI update did not return expected user_ml_data.");
            }
        } else {
            System.err.println("No IP data provided for model update for user " + user.getEmail() + ".");
        }

        return user;
    }

    public String getSecret() {
        return Totp.generateSecret();
    }
}
