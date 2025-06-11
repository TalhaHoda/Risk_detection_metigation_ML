import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Assuming CSS file is still named Login.css

const SimpleLogin = () => { // Renamed from Login to SimpleLogin
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const getClientIpData = async () => {
        try {
            const response = await axios.get("https://ipapi.co/json/");
            return response.data;
        } catch (error) {
            console.error("Error fetching IP data:", error);
            return {};
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        const ipData = await getClientIpData();
        console.log("Client IP Data:", ipData);

        try {
            const response = await axios.post("http://localhost:8080/auth/login", { ...formData, ipData });
            console.log("Login successful:", response.data);

            if (response.data && response.data.token) {
                setSuccessMessage("Login successful! Redirecting...");
                localStorage.setItem("jwtToken", response.data.token);
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } else {
                setErrorMessage("An unexpected response received from the server.");
            }

        } catch (error) {
            console.error("Login failed:", error);
            // Corrected status code: 417 was used, but 403 Forbidden might be more semantically appropriate
            // Let's stick to 417 if that's what the backend sends, but be aware of common HTTP statuses.
            if (error.response && error.response.status === 417 && error.response.data === "TOTP_REQUIRED") {
                setErrorMessage("Anomaly detected. TOTP is required.");
                navigate("/login-totp", { state: { email: formData.email, password: formData.password, ipData: ipData } }); // Updated path
            } else {
                setSuccessMessage("");
                setErrorMessage("Invalid email or password. Please try again.");
            }
        }
    };

    const handleSignUp = () => {
        navigate("/signup");
    };

    return (
        <div className="login-container">
            <div className="form-box">
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="button-group">
                        <button type="submit" className="btn-login">Log In</button>
                    </div>
                </form>
                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                <h4>Don't have an account?</h4>
                <div className="button-group">
                    <button className="btn-signup" onClick={handleSignUp}>Sign Up</button>
                </div>
            </div>
        </div>
    );
};

export default SimpleLogin; // Export as SimpleLogin