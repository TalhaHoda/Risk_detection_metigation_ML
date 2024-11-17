import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import SignUp from "./Components/SignUp";
import Login from "./Components/Login";
import Home from "./Components/Home"; // Your home component
import Logout from "./Components/Logout"; // Import the Logout component

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} /> {/* Add Logout route */}
            </Routes>
        </Router>
    );
}

export default App;
