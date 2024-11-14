import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const navigate = useNavigate(); // Initialize navigate function from React Router

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/auth/login', {
                ...formData,
            });
            console.log('Form data submitted:', response.data);
        } catch (error) {
            console.error('Error submitting form data:', error);
        }
    };

    const handleSignUp = (e) => {
        e.preventDefault();
        navigate('/signup'); // Redirect to the signup page
    };

    return (
        <div>
        <form onSubmit={handleSubmit}>
        <div>
            <label>Email:</label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
            />
        </div>
        <div>
            <label>Password:</label>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
            />
        </div>
        <div>
            <label>TOTP:</label>
            <input
                type="text"
                name="totp"
                value={formData.totp}
                onChange={handleChange}
            />
        </div>
        <button type="submit">LogIn</button>
        
    </form>
    <h4>Don't have Account</h4>
    <h5>Creat new account</h5>
    <button onClick={handleSignUp}>SignUp</button>
    </div>
        
    );
};

export default Login;
