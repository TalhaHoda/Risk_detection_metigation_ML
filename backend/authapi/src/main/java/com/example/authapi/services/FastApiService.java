package com.example.authapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
public class FastApiService {

    @Value("${fastapi.predict.url}")
    private String fastapiPredictUrl;

    @Value("${fastapi.update.url}")
    private String fastapiUpdateUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper; // Inject ObjectMapper

    public FastApiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    // Updated to send userEmail and userMlDataJson for personalized prediction
    public JsonNode getPrediction(String userEmail, JsonNode ipData, String userMlDataJson) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("user_email", userEmail); // Pass user email
        requestBody.set("data", ipData); // Pass client IP data

        if (userMlDataJson != null && !userMlDataJson.isEmpty()) {
            try {
                requestBody.set("user_ml_data", objectMapper.readTree(userMlDataJson)); // Deserialize and set user's ML data
            } catch (Exception e) {
                System.err.println("Error parsing userMlDataJson for prediction: " + e.getMessage());
                // Handle error, maybe send without user_ml_data or throw
            }
        } else {
            // If no existing ML data, send an empty JSON object or null
            requestBody.set("user_ml_data", objectMapper.createObjectNode());
        }


        HttpEntity<String> request = new HttpEntity<>(requestBody.toString(), headers);
        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(fastapiPredictUrl, request, JsonNode.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error calling FastAPI predict for user " + userEmail + ": " + e.getMessage());
            return null;
        }
    }

    // Updated to send userEmail and userMlDataJson for personalized model update
    public JsonNode updateModel(String userEmail, JsonNode ipData, String userMlDataJson, int target) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("user_email", userEmail); // Pass user email
        requestBody.set("data", ipData); // Pass client IP data
        requestBody.putArray("target").add(target); // Pass target for update

        if (userMlDataJson != null && !userMlDataJson.isEmpty()) {
            try {
                requestBody.set("user_ml_data", objectMapper.readTree(userMlDataJson)); // Deserialize and set user's ML data
            } catch (Exception e) {
                System.err.println("Error parsing userMlDataJson for update: " + e.getMessage());
                // Handle error
            }
        } else {
            // If no existing ML data, send an empty JSON object or null
            requestBody.set("user_ml_data", objectMapper.createObjectNode());
        }

        HttpEntity<String> request = new HttpEntity<>(requestBody.toString(), headers);
        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(fastapiUpdateUrl, request, JsonNode.class);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error calling FastAPI update for user " + userEmail + ": " + e.getMessage());
            return null;
        }
    }
}
