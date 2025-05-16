import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/api";
import { toast } from "react-toastify";

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
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

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await register({
                username: formData.username,
                password: formData.password,
            });
            toast.success("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Registration failed. Please try again."
            );
            toast.error("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form fade-in">
            <div className="auth-form-header">
                <h2 className="auth-form-title">Create Account</h2>
                <p className="auth-form-subtitle">
                    Join the BlogWave community
                </p>
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
                        placeholder="Choose a username"
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
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label
                        htmlFor="confirmPassword"
                        className="auth-form-label"
                    >
                        <i className="fas fa-check-circle"></i> Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        className="auth-form-input"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
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
                            <span className="loading-spinner small"></span>{" "}
                            Creating Account...
                        </>
                    ) : (
                        <>Create Account</>
                    )}
                </button>
            </form>

            <div className="auth-form-footer">
                Already have an account?{" "}
                <Link to="/login" className="auth-form-link">
                    Sign in
                </Link>
            </div>
        </div>
    );
};

export default RegisterForm;
