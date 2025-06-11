import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SimpleLogin from './Components/SimpleLogin';
import TotpLogin from './Components/TotpLogin';
import SignUp from './Components/SignUp';
import Home from './Components/Home';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Your protected home page */}
          <Route path="/login-simple" element={<SimpleLogin />} /> {/* Initial login page */}
          <Route path="/login-totp" element={<TotpLogin />} />       {/* TOTP login page (changed path for clarity) */}
          <Route path="/signup" element={<SignUp />} />     {/* Sign up page */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;