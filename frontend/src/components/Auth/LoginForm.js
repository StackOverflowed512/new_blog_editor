import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/api";
import { toast } from "react-toastify";

const LoginForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await login({ username, password });
            localStorage.setItem("token", response.data.token);
            onLoginSuccess(response.data.user);
            toast.success("Logged in successfully!");
            navigate("/");
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                "Login failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="auth-form">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            <p className="switch-auth">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default LoginForm;
