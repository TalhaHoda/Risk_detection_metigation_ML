import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css'; // Assuming CSS file is still named Login.css

const TotpLogin = () => { // Renamed from Login to TotpLogin
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        password: location.state?.password || '',
        totp: '',
        ipData: location.state?.ipData || null
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleTotpSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/auth/login-anomaly-totp', formData);
            console.log('Login successful with TOTP and model update:', response.data);
            setSuccessMessage('Login successful! Redirecting...');
            setErrorMessage('');

            localStorage.setItem('jwtToken', response.data.token);

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error('Login with TOTP failed:', error);
            setSuccessMessage('');
            setErrorMessage('Invalid TOTP. Please try again.');
        }
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    return (
        <div className="login-container">
            <div className="form-box">
                <form className="login-form" onSubmit={handleTotpSubmit}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label>TOTP:</label>
                        <input
                            type="text"
                            name="totp"
                            value={formData.totp}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit" className="btn-login">Submit TOTP</button>
                    </div>
                </form>
                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <h4>Don't have an account?</h4>
                <h5>Create a new account</h5>
                <div className="button-group">
                    <button className="btn-signup" onClick={handleSignUp}>Sign Up</button>
                </div>
            </div>
        </div>
    );
};

export default TotpLogin; // Export as TotpLogin