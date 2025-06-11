package com.example.authapi.dtos;

import com.fasterxml.jackson.databind.JsonNode;

public class LoginUserDto {

    private String email;
    private String password;
    private String totp;
    private JsonNode ipData; // New field for IP data

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getTotp() {
        return totp;
    }

    public void setTotp(String totp) {
        this.totp = totp;
    }

    public JsonNode getIpData() {
        return ipData;
    }

    public void setIpData(JsonNode ipData) {
        this.ipData = ipData;
    }
}
