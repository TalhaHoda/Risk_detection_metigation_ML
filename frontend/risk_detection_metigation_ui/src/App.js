import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import SignUp from "./Components/SignUp";
import Login from "./Components/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          exact
          path="/"
          element={<SignUp />}
        />
        <Route
          path="/signup"
          element={<SignUp />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
      </Routes>
    </Router>
  );
}

export default App;
