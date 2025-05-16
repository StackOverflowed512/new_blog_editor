import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import { toast } from "react-toastify";

const LoginForm = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await login(formData);
            localStorage.setItem("token", response.data.token);
            onLoginSuccess(response.data.user);
            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Login failed. Please check your credentials."
            );
            toast.error("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form fade-in">
            <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome Back</h2>
                <p className="auth-form-subtitle">Sign in to continue to BlogWave</p>
            </div>

            {error && <div className="auth-form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="auth-form-group">
                    <label htmlFor="username" className="auth-form-label">
                        <i className="fas fa-user"></i> Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        className="auth-form-input"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label htmlFor="password" className="auth-form-label">
                        <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="auth-form-input"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-form-button"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="loading-spinner small"></span> Signing in...
                        </>
                    ) : (
                        <>Sign In</>
                    )}
                </button>
            </form>

            <div className="auth-form-footer">
                Don't have an account?{" "}
                <Link to="/register" className="auth-form-link">
                    Sign up
                </Link>
            </div>
        </div>
    );
};

export default LoginForm;