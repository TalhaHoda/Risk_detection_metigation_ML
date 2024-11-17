import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import './SignUp.css'; // Import the CSS file

function SignUp() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        secret: '',
        totp: ''
    });

    const [extraFields, setExtraFields] = useState([]);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false); // State to handle redirection

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleExtraFieldChange = (index, e) => {
        const newExtraFields = [...extraFields];
        formData.totp = e.target.value;
        setExtraFields(newExtraFields);
    };

    const addExtraField = async () => {
        try {
            console.log("calling get request ");
            const response = await axios.get('http://localhost:8080/auth/getSecret');
            console.log("called get request ");
            console.log(response);
            const secret = response.data;
            formData.secret = secret;
            const otpauthUrl = `otpauth://totp/Example:${formData.email}?secret=${secret}&issuer=Example`;
            console.log(response);
            console.log("my secret " + secret);
            console.log(otpauthUrl);
            const newField = { value: secret, otpauthUrl };
            setExtraFields([...extraFields, newField]);
            setIsButtonDisabled(true); // Disable the button after adding an extra field
        } catch (error) {
            console.error('Error fetching secret URL:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/auth/signup', {
                ...formData,
                extraFields
            });
            console.log('Form data submitted:', response.data);
        } catch (error) {
            console.error('Error submitting form data:', error);
        }
        console.log(formData);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setRedirectToLogin(true); // Set redirection state to true
    };

    // Redirect to login if the state is true
    if (redirectToLogin) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="signup-container">
    <form className="signup-form" onSubmit={handleSubmit}>
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
        {extraFields.map((field, index) => (
            <div className="form-group" key={index}>
                <label htmlFor={`totp-${index}`}>TOTP:</label>
                <input
                    type="text"
                    name="totp"
                    id={`totp-${index}`}
                    value={formData.value}
                    onChange={(e) => handleExtraFieldChange(index, e)}
                />
                <div className="qr-code-container">
                    <QRCode value={field.otpauthUrl} />
                </div>
            </div>
        ))}
        <div className='button-group'>
        <button type="button" className="btn-add-extra" onClick={addExtraField} disabled={isButtonDisabled}>NEXT</button>
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
