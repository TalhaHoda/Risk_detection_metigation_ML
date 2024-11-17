import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the CSS file

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [totp, setTotp] = useState(''); // State to manage the TOTP input
    const [showTotpPopup, setShowTotpPopup] = useState(false); // State to manage the visibility of the TOTP popup
    const [successMessage, setSuccessMessage] = useState(''); // State to manage the success message
    const [errorMessage, setErrorMessage] = useState(''); // State to manage the error message

    const navigate = useNavigate(); // Initialize navigate function from React Router

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleTotpChange = (e) => {
        setTotp(e.target.value);
    };

    const handleLoginClick = (e) => {
        e.preventDefault();
        setShowTotpPopup(true); // Show the TOTP popup when login button is clicked
    };

    const handleTotpSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/auth/login', {
                ...formData,
                totp
            });
            console.log('Form data submitted:', response.data);
            setSuccessMessage('Login successful! Redirecting...'); // Set success message
            setErrorMessage(''); // Clear any previous error messages

            // Store the JWT token in local storage
            localStorage.setItem('jwtToken', response.data.token);

            // Redirect to the home page after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            console.error('Error submitting form data:', error);
            setSuccessMessage(''); // Clear any previous success messages
            if (error.response && error.response.data) {
                setErrorMessage('Invalid TOTP. Please try again.'); // Set TOTP error message
            } else {
                setErrorMessage('Login failed. Please try again.'); // Set generic error message
            }
            setShowTotpPopup(false); // Hide the TOTP popup on error
        }
    };

    const handleSignUp = (e) => {
        e.preventDefault();
        navigate('/signup'); // Redirect to the signup page
    };

    return (
        <div className="login-container">
            <div className="form-box">
                <form className="login-form" onSubmit={handleLoginClick}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
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
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit" className="btn-login">Log In</button>
                    </div>
                </form>
                {successMessage && <p className="success-message">{successMessage}</p>} {/* Display success message */}
                {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error message */}
                <h4>Don't have an account?</h4>
                <h5>Create a new account</h5>
                <div className="button-group">
                    <button className="btn-signup" onClick={handleSignUp}>Sign Up</button>
                </div>
            </div>
            {showTotpPopup && (
                <div className="totp-popup">
                    <form onSubmit={handleTotpSubmit}>
                        <div className="form-group">
                            <label>TOTP:</label>
                            <input
                                type="text"
                                name="totp"
                                value={totp}
                                onChange={handleTotpChange}
                                required
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn-login">Submit TOTP</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Login;
