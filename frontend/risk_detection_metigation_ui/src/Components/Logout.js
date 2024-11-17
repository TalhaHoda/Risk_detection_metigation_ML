import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Remove JWT token from local storage or cookies
        localStorage.removeItem('jwtToken');

        // Redirect to login page
        navigate('/login');
    };

    return (
        <div className="logout-container">
            <button onClick={handleLogout} className="btn-logout">Log Out</button>
        </div>
    );
};

export default Logout;
