package com.example.authapi.services;

import com.example.authapi.entities.User;

public class AuthenticationPredictionResponse {
    private User user;
    private String prediction; // "normal" or "anomaly"
    private String updatedMlModelData; // To carry back the updated ML data from FastAPI

    public AuthenticationPredictionResponse(User user, String prediction, String updatedMlModelData) {
        this.user = user;
        this.prediction = prediction;
        this.updatedMlModelData = updatedMlModelData;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPrediction() {
        return prediction;
    }

    public void setPrediction(String prediction) {
        this.prediction = prediction;
    }

    public String getUpdatedMlModelData() {
        return updatedMlModelData;
    }

    public void setUpdatedMlModelData(String updatedMlModelData) {
        this.updatedMlModelData = updatedMlModelData;
    }
}
