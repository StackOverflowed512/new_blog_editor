import React, { useState, useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Link,
    useParams,
} from "react-router-dom"; // Added useParams
import BlogEditor from "./components/BlogEditor";
import BlogList from "./components/BlogList";
import Navbar from "./components/Navbar";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import { getCurrentUser } from "./services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// A wrapper for protected routes
const ProtectedRoute = ({ children, currentUser }) => {
    if (!currentUser) {
        toast.info("Please log in to access this page.");
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Component to display a single blog (read-only view)
const BlogViewPage = () => {
    // This is a simplified version. You'd fetch the blog by ID here.
    // For now, we'll use BlogEditor. A proper BlogView component would be better.
    const { id } = useParams(); // useParams was missing
    const [currentUserForView, setCurrentUserForView] = useState(null); // Minimal user context for viewing

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Fetch minimal user data if needed for conditional UI elements in BlogEditor
            getCurrentUser()
                .then((response) => setCurrentUserForView(response.data))
                .catch(() => {
                    /* Don't necessarily clear token, just means no logged-in user */
                });
        }
    }, []);

    // Pass the blog ID to the editor component.
    // The BlogEditor itself fetches the blog data based on this ID.
    // If you want a truly read-only view, BlogEditor would need a 'readOnly' prop
    // or you'd create a separate BlogView component.
    return (
        <BlogEditor blogIdForViewing={id} currentUser={currentUserForView} />
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
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setCurrentUser(null);
        toast.info("Logged out successfully.");
    };

    if (loadingAuth) {
        return <div className="loading">Loading application...</div>;
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
            />
            <Navbar currentUser={currentUser} onLogout={handleLogout} />
            <main>
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
                                    {" "}
                                    {/* Added a container for better layout */}
                                    <BlogList
                                        listType="my-drafts"
                                        currentUser={currentUser}
                                    />
                                    <BlogList
                                        listType="my-published"
                                        currentUser={currentUser}
                                    />
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
