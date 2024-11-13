package com.example.authapi.mfa;

import org.apache.commons.codec.binary.Base32;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

public class Totp {
    public static String generateSecret() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        Base32 base32 = new Base32();
        return base32.encodeToString(bytes);
    }

    // Method to generate a TOTP code
    public static String generateTOTP(String secret) {
        try {
            byte[] bytes = new Base32().decode(secret);
            SecretKeySpec signKey = new SecretKeySpec(bytes, "HmacSHA1");
            long currentTime = Instant.now().getEpochSecond() / 30;
            ByteBuffer buffer = ByteBuffer.allocate(8);
            buffer.putLong(currentTime);
            byte[] timeBytes = buffer.array();

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(signKey);
            byte[] hash = mac.doFinal(timeBytes);

            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) |
                    ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
            int otp = binary % 1000000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            throw new RuntimeException("Error generating TOTP", e);
        }
    }

    // Method to validate a TOTP code
    public static boolean validateTOTP(String secret, String totp) {
        try {
            String generatedTOTP = generateTOTP(secret);
            return generatedTOTP.equals(totp);

        } catch (Exception e) {
            throw new RuntimeException("Error validating TOTP", e);
        }
    }
}
