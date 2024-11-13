package com.example.authapi.responses;

public class LoginResponse {

    private String token;
    private long expiresIN;

    public String getToken() {
        return token;
    }

    public LoginResponse setToken(String token) {
        this.token = token;
        return null;
    }

    public long getExpiresIN() {
        return expiresIN;
    }

    public LoginResponse setExpiresIN(long expiresIN) {
        this.expiresIN = expiresIN;
        return null;
    }
}
