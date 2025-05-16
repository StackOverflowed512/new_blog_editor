import React, { useState, useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Link,
    useParams,
} from "react-router-dom";
import BlogEditor from "./components/BlogEditor";
import BlogList from "./components/BlogList";
import Navbar from "./components/Navbar";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import { getCurrentUser } from "./services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import BlogView from "./components/BlogView";

// A wrapper for protected routes
const ProtectedRoute = ({ children, currentUser }) => {
    if (!currentUser) {
        toast.info("Please log in to access this page.");
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Component to display a single blog (read-only view)
// Update the BlogViewPage component
const BlogViewPage = () => {
    const { id } = useParams();
    const [currentUserForView, setCurrentUserForView] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            getCurrentUser()
                .then((response) => setCurrentUserForView(response.data))
                .catch(() => {
                    /* Don't necessarily clear token, just means no logged-in user */
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <span>Loading blog content...</span>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <BlogView currentUser={currentUserForView} />
        </div>
    );
};

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            getCurrentUser()
                .then((response) => {
                    setCurrentUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem("token"); // Invalid token
                    setCurrentUser(null);
                })
                .finally(() => {
                    setLoadingAuth(false);
                });
        } else {
            setLoadingAuth(false);
        }
    }, []);

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        toast.success("Welcome back, " + userData.username + "!");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        toast.info("Logged out successfully.");
    };

    if (loadingAuth) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <span>Loading application...</span>
            </div>
        );
    }

    return (
        <Router>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            <Navbar currentUser={currentUser} onLogout={handleLogout} />
            <main className="fade-in">
                <Routes>
                    <Route
                        path="/login"
                        element={
                            !currentUser ? (
                                <LoginForm
                                    onLoginSuccess={handleLoginSuccess}
                                />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            !currentUser ? (
                                <RegisterForm />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <BlogList
                                listType="all"
                                currentUser={currentUser}
                            />
                        }
                    />
                    {/* Route for viewing a specific blog post, uses BlogEditor for display for now */}
                    <Route path="/blogs/:id" element={<BlogViewPage />} />

                    <Route
                        path="/editor"
                        element={
                            <ProtectedRoute currentUser={currentUser}>
                                <BlogEditor currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/editor/:id"
                        element={
                            <ProtectedRoute currentUser={currentUser}>
                                <BlogEditor currentUser={currentUser} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-blogs"
                        element={
                            <ProtectedRoute currentUser={currentUser}>
                                <div className="container">
                                    <h2 className="page-title">My Blogs</h2>
                                    <div className="blog-sections">
                                        <BlogList
                                            listType="my-drafts"
                                            currentUser={currentUser}
                                        />
                                        <BlogList
                                            listType="my-published"
                                            currentUser={currentUser}
                                        />
                                    </div>
                                </div>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback for any other route */}
                    <Route
                        path="*"
                        element={
                            <div className="container">
                                <h2>404 - Page Not Found</h2>
                                <p>
                                    The page you are looking for does not exist.
                                </p>
                                <Link to="/">Go to Homepage</Link>
                            </div>
                        }
                    />
                </Routes>
            </main>
        </Router>
    );
}

export default App;
