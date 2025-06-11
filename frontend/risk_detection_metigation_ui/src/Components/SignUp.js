import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom'; // Ensure Navigate is imported
import './SignUp.css'; // Import the CSS file

function SignUp() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        secret: '', // Will be populated after fetching from backend
        totp: ''    // User will input this
    });

    const [extraFields, setExtraFields] = useState([]); // Used to manage QR code display
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false); // State to handle redirection

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Corrected to update formData.totp directly
    const handleExtraFieldChange = (index, e) => {
        const { value } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            totp: value
        }));
        // You might not need to update extraFields array here if it's only for display
        // If you were storing specific TOTP values per field (unlikely for a single form),
        // you'd modify newExtraFields and setExtraFields(newExtraFields);
    };

    const addExtraField = async () => {
        try {
            console.log("calling get request ");
            const response = await axios.get('http://localhost:8080/auth/getSecret');
            console.log("called get request ");
            console.log(response);
            const secret = response.data;

            setFormData(prevFormData => ({
                ...prevFormData,
                secret: secret
            }));

            const otpauthUrl = `otpauth://totp/Example:${formData.email}?secret=${secret}&issuer=Example`;

            // Add the new field to extraFields state for QR code display
            setExtraFields([...extraFields, { otpauthUrl: otpauthUrl }]);
            setIsButtonDisabled(true); // Disable button after secret is fetched

        } catch (error) {
            console.error("Error fetching secret:", error);
            // Handle error (e.g., display error message to user)
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Construct the payload with ONLY the fields expected by RegisterUserDto
            const registrationData = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                secret: formData.secret,
                totp: formData.totp
            };

            console.log('Sending registration data:', registrationData);

            const response = await axios.post('http://localhost:8080/auth/signup', registrationData);

            console.log('Registration successful:', response.data);
            setRedirectToLogin(true); // <--- THIS LINE IS ADDED/CONFIRMED FOR REDIRECTION

        } catch (error) {
            console.error('Error submitting form data:', error);
            // Enhanced error handling to show specific backend messages
            if (error.response && error.response.data && error.response.data.message) {
                alert(`Registration failed: ${error.response.data.message}`);
            } else if (error.message) {
                alert(`Registration failed: ${error.message}`);
            } else {
                alert('Registration failed. Please try again.');
            }
        }
    };

    const handleLogin = () => {
        navigate('/login-simple'); // Assuming '/login-simple' is your login route
    };

    // If redirectToLogin is true, navigate to the login page
    if (redirectToLogin) {
        return <Navigate to="/login-simple" />;
    }

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
                <div className="form-group">
                    <label htmlFor="fullName">Full Name:</label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Conditional rendering for QR code and TOTP input */}
                {extraFields.map((field, index) => (
                    <div className="form-group" key={index}>
                        <label htmlFor={`totp-${index}`}>TOTP:</label>
                        <input
                            type="text"
                            name="totp"
                            id={`totp-${index}`}
                            value={formData.totp} /* Corrected: should be formData.totp */
                            onChange={(e) => handleExtraFieldChange(index, e)}
                            required // TOTP should be required for signup
                        />
                        <div className="qr-code-container">
                            <QRCode value={field.otpauthUrl} size={128} level="H" />
                        </div>
                    </div>
                ))}

                <div className='button-group'>
                    <button type="button" className="btn-add-extra" onClick={addExtraField} disabled={isButtonDisabled || !formData.email}>NEXT</button>
                </div>
                <div className='button-group'>
                    <button type="submit" className="btn-signup">Sign up</button>
                </div>
            </form>
            <h6 className="login-prompt">Already have an account</h6>
            <div className='button-group'>
                <button className="btn-login" onClick={handleLogin}>Log In</button>
            </div>
        </div>
    );
}

export default SignUp;