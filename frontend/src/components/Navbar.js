import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <Link to="/" className="brand">
                BlogPlatform
            </Link>
            <div>
                <Link to="/">Home</Link>
                {currentUser && <Link to="/editor">New Post</Link>}
                {currentUser && <Link to="/my-blogs">My Blogs</Link>}
            </div>
            <div className="auth-links">
                {currentUser ? (
                    <>
                        <span>Hi, {currentUser.username}</span>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
