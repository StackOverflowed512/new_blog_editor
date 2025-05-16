import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getBlogById, deleteBlog } from "../services/api";
import { toast } from "react-toastify";

const BlogView = ({ currentUser }) => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlog = async () => {
            setLoading(true);
            try {
                const response = await getBlogById(id);
                setBlog(response.data);
            } catch (error) {
                console.error("Error fetching blog:", error);
                toast.error("Failed to load blog. It may have been deleted or is unavailable.");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this blog?")) {
            try {
                await deleteBlog(id);
                toast.success("Blog deleted successfully!");
                navigate("/");
            } catch (error) {
                console.error("Error deleting blog:", error);
                toast.error("Failed to delete blog. Please try again.");
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>Loading blog content...</span>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="container">
                <div className="empty-message">
                    <div className="empty-message-icon">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <p className="empty-message-text">Blog not found</p>
                    <Link to="/" className="btn btn-primary">
                        <i className="fas fa-home"></i> Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    // In the return statement where the blog content is rendered
    return (
        <div className="container blog-view">
            <div className="blog-view-header">
                <h1 className="blog-view-title">{blog.title || "Untitled Blog"}</h1>
                
                <div className="blog-view-meta">
                    <div className="blog-view-author">
                        <div className="blog-view-author-avatar">
                            {blog.author ? getInitials(blog.author) : "U"}
                        </div>
                        <div className="blog-view-author-info">
                            <div className="blog-view-author-name">{blog.author || "Unknown"}</div>
                            <div className="blog-view-date">
                                {formatDate(blog.updated_at || blog.created_at)}
                            </div>
                        </div>
                    </div>
                    
                    {blog.status && (
                        <span className={`blog-view-status ${blog.status}`}>
                            {blog.status}
                        </span>
                    )}
                </div>
                
                {blog.tags && (
                    <div className="blog-view-tags">
                        {blog.tags.map((tag, index) => (
                            <span key={index} className="blog-view-tag">
                                {tag.trim()}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            <div 
                className="blog-view-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
            />
            
            {currentUser && blog.user_id === currentUser.id && (
                <div className="blog-view-actions">
                    <Link to={`/editor/${blog.id}`} className="btn btn-primary">
                        <i className="fas fa-edit"></i> Edit
                    </Link>
                    <button onClick={handleDelete} className="btn btn-danger">
                        <i className="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlogView;