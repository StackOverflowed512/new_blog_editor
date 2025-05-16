import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBlogs, deleteBlog } from "../services/api";
import { toast } from "react-toastify";

const BlogList = ({ listType = "all", currentUser }) => {
    // listType can be "all", "published", "my-drafts", "my-published"
    const [blogs, setBlogs] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [published, setPublished] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            let params = {};
            if (listType === "published") {
                params.status = "published";
            } else if (listType === "my-drafts" && currentUser) {
                params.status = "draft";
                params.user_id = currentUser.id;
            } else if (listType === "my-published" && currentUser) {
                params.status = "published";
                params.user_id = currentUser.id;
            }
            // For "all", no specific params, backend returns all by default (or you can choose a default)

            const response = await getAllBlogs(params);
            if (listType === "all") {
                // Separate them for display
                setDrafts(
                    response.data.filter(
                        (blog) =>
                            blog.status === "draft" &&
                            blog.user_id === currentUser?.id
                    )
                );
                setPublished(
                    response.data.filter((blog) => blog.status === "published")
                );
            } else {
                setBlogs(response.data);
            }
        } catch (error) {
            toast.error(
                "Failed to fetch blogs: " +
                    (error.response?.data?.message || error.message)
            );
            console.error("Fetch blogs error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, [listType, currentUser]); // Re-fetch if listType or currentUser changes

    const handleDelete = async (blogId) => {
        if (window.confirm("Are you sure you want to delete this blog post?")) {
            try {
                await deleteBlog(blogId);
                toast.success("Blog post deleted successfully!");
                fetchBlogs(); // Refresh the list
            } catch (error) {
                toast.error(
                    "Failed to delete blog post: " +
                        (error.response?.data?.message || error.message)
                );
            }
        }
    };

    const renderBlogItem = (blog) => (
        <li key={blog.id}>
            <h3>
                <Link to={`/blogs/${blog.id}`}>{blog.title || "Untitled"}</Link>
                {blog.status === "draft" && <em> (Draft)</em>}
            </h3>
            <p className="blog-meta">
                By: {blog.author_username || "Unknown"} | Last updated:{" "}
                {new Date(blog.updated_at).toLocaleDateString()}
            </p>
            {blog.tags && blog.tags.length > 0 && (
                <p className="blog-tags">
                    Tags:{" "}
                    {blog.tags.map((tag) => (
                        <span key={tag} className="tag">
                            {tag}
                        </span>
                    ))}
                </p>
            )}
            <div className="blog-actions">
                {currentUser && currentUser.id === blog.user_id && (
                    <>
                        <button
                            onClick={() => navigate(`/editor/${blog.id}`)}
                            className="edit-btn"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(blog.id)}
                            className="delete-btn"
                        >
                            Delete
                        </button>
                    </>
                )}
                {blog.status === "published" &&
                    (!currentUser || currentUser.id !== blog.user_id) && (
                        <Link to={`/blogs/${blog.id}`} className="view-btn">
                            View Post
                        </Link>
                    )}
            </div>
        </li>
    );

    if (loading) return <div className="loading">Loading blogs...</div>;

    const listTitle =
        {
            all: "All Blogs",
            published: "Published Blogs",
            "my-drafts": "My Drafts",
            "my-published": "My Published Posts",
        }[listType] || "Blogs";

    if (listType === "all") {
        return (
            <div className="blog-list-container container">
                {currentUser && drafts.length > 0 && (
                    <>
                        <h2>My Drafts</h2>
                        {drafts.length > 0 ? (
                            <ul className="blog-list">
                                {drafts.map(renderBlogItem)}
                            </ul>
                        ) : (
                            <p className="empty-message">No drafts yet.</p>
                        )}
                    </>
                )}
                <h2>Published Blogs</h2>
                {published.length > 0 ? (
                    <ul className="blog-list">
                        {published.map(renderBlogItem)}
                    </ul>
                ) : (
                    <p className="empty-message">No published blogs yet.</p>
                )}
            </div>
        );
    }

    return (
        <div className="blog-list-container container">
            <h2>{listTitle}</h2>
            {blogs.length > 0 ? (
                <ul className="blog-list">{blogs.map(renderBlogItem)}</ul>
            ) : (
                <p className="empty-message">
                    No blogs found in this category.
                </p>
            )}
        </div>
    );
};

export default BlogList;
