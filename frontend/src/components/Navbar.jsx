import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ currentUser, onLogout }) => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <i className="fas fa-feather-alt"></i>
                    BlogWave
                </Link>

                <div className="navbar-mobile-toggle" onClick={toggleMobileMenu}>
                    <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
                </div>

                <div className={`navbar-links ${mobileMenuOpen ? "active" : ""}`}>
                    <Link
                        to="/"
                        className={`navbar-link ${location.pathname === "/" ? "active" : ""}`}
                    >
                        <i className="fas fa-home"></i> Home
                    </Link>

                    {currentUser ? (
                        <>
                            <Link
                                to="/editor"
                                className={`navbar-link ${location.pathname === "/editor" ? "active" : ""}`}
                            >
                                <i className="fas fa-edit"></i> New Blog
                            </Link>
                            <Link
                                to="/my-blogs"
                                className={`navbar-link ${location.pathname === "/my-blogs" ? "active" : ""}`}
                            >
                                <i className="fas fa-book"></i> My Blogs
                            </Link>
                            <div className="navbar-user">
                                <div className="navbar-user-avatar">
                                    {getInitials(currentUser.username)}
                                </div>
                                <div className="navbar-user-name">{currentUser.username}</div>
                                <button onClick={onLogout} className="btn btn-secondary">
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={`navbar-link ${location.pathname === "/login" ? "active" : ""}`}
                            >
                                <i className="fas fa-sign-in-alt"></i> Login
                            </Link>
                            <Link
                                to="/register"
                                className={`navbar-link ${location.pathname === "/register" ? "active" : ""}`}
                            >
                                <i className="fas fa-user-plus"></i> Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;