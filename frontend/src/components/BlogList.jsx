import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBlogs, deleteBlog } from "../services/api";
import { toast } from "react-toastify";

const BlogList = ({ listType, currentUser }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                let params = {};

                // Only attempt to filter by user_id if currentUser exists
                if (listType === "my-drafts" && currentUser) {
                    params = { status: "draft", user_id: currentUser.id };
                } else if (listType === "my-published" && currentUser) {
                    params = { status: "published", user_id: currentUser.id };
                } else if (listType === "all") {
                    params = { status: "published" };
                }

                const response = await getAllBlogs(params);
                setBlogs(response.data);
            } catch (error) {
                console.error("Error fetching blogs:", error);
                toast.error("Failed to load blogs. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch blogs if currentUser exists for my-drafts and my-published
        if (
            listType === "all" ||
            ((listType === "my-drafts" || listType === "my-published") &&
                currentUser)
        ) {
            fetchBlogs();
        }
    }, [listType, currentUser]);

    const handleDelete = async (id, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (window.confirm("Are you sure you want to delete this blog?")) {
            try {
                await deleteBlog(id);
                setBlogs(blogs.filter((blog) => blog.id !== id));
                toast.success("Blog deleted successfully!");
            } catch (error) {
                console.error("Error deleting blog:", error);
                toast.error("Failed to delete blog. Please try again.");
            }
        }
    };

    const handleEdit = (id, event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/editor/${id}`);
    };

    const getListTitle = () => {
        switch (listType) {
            case "my-drafts":
                return "My Drafts";
            case "my-published":
                return "My Published Blogs";
            case "all":
            default:
                return "Latest Blogs";
        }
    };

    const getRandomImageUrl = (id) => {
        const imageIds = [
            "1",
            "10",
            "100",
            "1000",
            "1001",
            "1002",
            "1003",
            "1004",
            "1005",
            "1006",
            "1008",
            "1009",
            "101",
            "1010",
            "1011",
        ];
        const randomId = imageIds[id % imageIds.length];
        return `https://picsum.photos/id/${randomId}/800/400`;
    };

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>Loading blogs...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <div className="blog-list">
                <div className="blog-list-header">
                    <h2 className="blog-list-title">{getListTitle()}</h2>
                    {(listType === "my-drafts" ||
                        listType === "my-published") && (
                        <Link to="/editor" className="btn btn-primary">
                            <i className="fas fa-plus"></i> New Blog
                        </Link>
                    )}
                </div>

                {blogs.length === 0 ? (
                    <div className="empty-message">
                        <div className="empty-message-icon">
                            <i className="fas fa-file-alt"></i>
                        </div>
                        <p className="empty-message-text">No blogs found</p>
                        {(listType === "my-drafts" ||
                            listType === "my-published") && (
                            <Link to="/editor" className="btn btn-primary">
                                <i className="fas fa-plus"></i> Create Your
                                First Blog
                            </Link>
                        )}
                    </div>
                ) : (
                    blogs.map((blog) => (
                        <div key={blog.id} className="blog-card">
                            <div
                                className="blog-card-image"
                                style={{
                                    backgroundImage: `url(${getRandomImageUrl(
                                        blog.id
                                    )})`,
                                }}
                            >
                                {blog.status && (
                                    <span
                                        className={`blog-card-status ${blog.status}`}
                                    >
                                        {blog.status}
                                    </span>
                                )}
                            </div>
                            <div className="blog-card-content">
                                <h3 className="blog-card-title">
                                    <Link to={`/blogs/${blog.id}`}>
                                        {blog.title || "Untitled Blog"}
                                    </Link>
                                </h3>
                                <p className="blog-card-excerpt">
                                    {truncateText(blog.content, 120)}
                                </p>
                                <div className="blog-card-meta">
                                    <div className="blog-card-author">
                                        <div className="blog-card-author-avatar">
                                            {blog.author
                                                ? getInitials(blog.author)
                                                : "U"}
                                        </div>
                                        <span>{blog.author || "Unknown"}</span>
                                    </div>
                                    <div className="blog-card-date">
                                        {formatDate(
                                            blog.updated_at || blog.created_at
                                        )}
                                    </div>
                                </div>

                                {blog.tags && (
                                    <div className="blog-card-tags">
                                        {blog.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="blog-card-tag"
                                            >
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {currentUser &&
                                    blog.user_id === currentUser.id && (
                                        <div className="blog-card-actions">
                                            <button
                                                className="blog-card-btn edit"
                                                onClick={(e) =>
                                                    handleEdit(blog.id, e)
                                                }
                                            >
                                                <i className="fas fa-edit"></i>{" "}
                                                Edit
                                            </button>
                                            <button
                                                className="blog-card-btn delete"
                                                onClick={(e) =>
                                                    handleDelete(blog.id, e)
                                                }
                                            >
                                                <i className="fas fa-trash-alt"></i>{" "}
                                                Delete
                                            </button>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BlogList;
