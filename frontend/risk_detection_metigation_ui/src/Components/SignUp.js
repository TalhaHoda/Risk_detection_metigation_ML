import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { Navigate } from 'react-router-dom';


const SignUp = () => {
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
        //newExtraFields[index].value = e.target.value;
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
            console.log("my secret "+secret);
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
        console.log(formData)
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
        <div>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Full Name:</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                    />
                </div>
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
                {extraFields.map((field, index) => (
                    <div key={index}>
                        <label>TOTP:</label>
                        <input
                            type="text"
                            name="totp"
                            value={formData.value}
                            onChange={(e) => handleExtraFieldChange(index, e)}
                        />
                        <QRCode value={field.otpauthUrl} />
                    </div>
                ))}
                <button type="button" onClick={addExtraField} disabled={isButtonDisabled}>Add Extra Field</button>
                <button type="submit">Sign up</button>
            </form>
            <h6>Already have an account</h6>
            <button onClick={handleLogin}>Log In</button>
        </div>
    );
};

export default SignUp;
