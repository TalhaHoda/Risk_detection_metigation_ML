import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Remove JWT token from local storage or cookies
        localStorage.removeItem('jwtToken');

        // Redirect to login page
        navigate('/login');
    };

    return (
        <div className="home-container">
            <h1>Welcome to the Home Page!</h1>
            <p>You have successfully logged in.</p>
            <button onClick={handleLogout} className="btn-logout">Log Out</button>
        </div>
    );
};

export default Home;
