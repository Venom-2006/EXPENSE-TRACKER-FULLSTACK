import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", currency: "USD", theme: "dark" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("https://expense-tracker-fullstack-1-o0un.onrender.com/api/users/register", formData);
      if (response.data.success) {
        localStorage.setItem("userInfo", JSON.stringify(response.data.data));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input type="text" name="name" onChange={handleChange} required /></div>
          <div className="form-group"><label>Email Address</label><input type="email" name="email" onChange={handleChange} required /></div>
          <div className="form-group"><label>Password</label><input type="password" name="password" onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="form-group half-width">
              <label>App Theme</label>
              <select name="theme" value={formData.theme} onChange={handleChange}>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-submit">{loading ? "Processing..." : "Register"}</button>
        </form>
        <p className="redirect-text">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}

export default Register;