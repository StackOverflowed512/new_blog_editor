import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Added Link
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Quill's snow theme
import { saveDraft, publishBlog, getBlogById } from "../services/api";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";

const BlogEditor = ({ currentUser, blogIdForViewing }) => {
    // Added blogIdForViewing prop
    const { id: blogIdFromRouteParams } = useParams(); // For /editor/:id route
    const navigate = useNavigate();

    // Determine the blog ID to use: from viewing prop, then route params, then null
    const effectiveBlogId = blogIdForViewing || blogIdFromRouteParams;

    const [blogData, setBlogData] = useState({
        id: effectiveBlogId ? parseInt(effectiveBlogId) : null,
        title: "",
        content: "",
        tags: "", // Comma-separated string
        user_id: null, // Will be populated when fetching existing blog
        author_username: null,
        status: "draft", // Default status for new posts
    });
    const [statusMessage, setStatusMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isViewMode, setIsViewMode] = useState(!!blogIdForViewing); // True if blogIdForViewing is provided

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Debounced auto-save function
    const debouncedAutoSave = useCallback(
        debounce(async (currentDataToSave) => {
            if (
                isViewMode ||
                !currentUser ||
                (!currentDataToSave.title && !currentDataToSave.content)
            ) {
                return;
            }
            if (!isMounted.current) return;

            setIsSaving(true);
            setStatusMessage("Auto-saving draft...");
            try {
                const payload = {
                    id: currentDataToSave.id,
                    title: currentDataToSave.title,
                    content: currentDataToSave.content,
                    tags: currentDataToSave.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                };
                const response = await saveDraft(payload);
                if (isMounted.current) {
                    if (!currentDataToSave.id && response.data.id) {
                        setBlogData((prev) => ({
                            ...prev,
                            id: response.data.id,
                        }));
                        window.history.replaceState(
                            null,
                            "",
                            `/editor/${response.data.id}`
                        );
                    }
                    setStatusMessage(
                        `Draft auto-saved at ${new Date().toLocaleTimeString()}`
                    );
                    toast.info("Draft auto-saved!"); // Changed to info for less intrusion
                }
            } catch (error) {
                if (isMounted.current) {
                    setStatusMessage("Auto-save failed.");
                    toast.error(
                        "Auto-save failed: " +
                            (error.response?.data?.message || error.message)
                    );
                }
                console.error("Auto-save error:", error);
            } finally {
                if (isMounted.current) setIsSaving(false);
            }
        }, 5000),
        [currentUser, isViewMode]
    );

    // Effect for loading existing blog post
    useEffect(() => {
        setIsViewMode(!!blogIdForViewing); // Update view mode if prop changes

        if (effectiveBlogId) {
            const fetchBlog = async () => {
                if (!isMounted.current) return;
                setIsLoading(true);
                setStatusMessage("Loading blog...");
                try {
                    const response = await getBlogById(effectiveBlogId);
                    if (isMounted.current) {
                        const fetchedBlog = response.data;
                        // If in edit mode (/editor/:id) and user doesn't own it (and it's a draft)
                        if (
                            !blogIdForViewing &&
                            fetchedBlog.status === "draft" &&
                            fetchedBlog.user_id !== currentUser?.id
                        ) {
                            toast.error("You can only edit your own drafts.");
                            navigate("/my-blogs");
                            return;
                        }
                        setBlogData({
                            id: fetchedBlog.id,
                            title: fetchedBlog.title,
                            content: fetchedBlog.content,
                            tags: Array.isArray(fetchedBlog.tags)
                                ? fetchedBlog.tags.join(", ")
                                : fetchedBlog.tags || "",
                            user_id: fetchedBlog.user_id,
                            author_username: fetchedBlog.author_username,
                            status: fetchedBlog.status,
                        });
                        setStatusMessage(
                            blogIdForViewing
                                ? `Viewing: ${fetchedBlog.title}`
                                : "Blog loaded for editing."
                        );
                    }
                } catch (error) {
                    if (isMounted.current) {
                        toast.error(
                            "Failed to load blog: " +
                                (error.response?.data?.message || error.message)
                        );
                        setStatusMessage("Failed to load blog.");
                        navigate("/");
                    }
                } finally {
                    if (isMounted.current) setIsLoading(false);
                }
            };
            // For view mode, fetch always. For edit mode, fetch only if user is logged in.
            if (blogIdForViewing || currentUser) {
                fetchBlog();
            } else if (!blogIdForViewing && !currentUser) {
                toast.warn("Please log in to edit posts.");
                navigate("/login");
            }
        } else {
            // New post
            if (!currentUser && !blogIdForViewing) {
                // No effectiveBlogId means new post
                toast.warn("Please log in to create a new post.");
                navigate("/login");
                return;
            }
            setBlogData({
                // Reset for new post
                id: null,
                title: "",
                content: "",
                tags: "",
                user_id: currentUser?.id,
                author_username: currentUser?.username,
                status: "draft",
            });
            setStatusMessage("Ready to write a new post!");
            setIsViewMode(false); // Ensure not in view mode for new post
        }
    }, [effectiveBlogId, blogIdForViewing, navigate, currentUser]); // Added blogIdForViewing

    // Effect for auto-save trigger
    useEffect(() => {
        if (
            !isViewMode &&
            (blogData.title || blogData.content || blogData.tags)
        ) {
            debouncedAutoSave(blogData);
        }
        return () => {
            debouncedAutoSave.cancel();
        };
    }, [
        blogData.title,
        blogData.content,
        blogData.tags,
        blogData.id,
        debouncedAutoSave,
        isViewMode,
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBlogData((prev) => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (value) => {
        setBlogData((prev) => ({ ...prev, content: value }));
    };

    const handleSaveDraft = async () => {
        if (!currentUser) {
            toast.warn("Please log in to save drafts.");
            navigate("/login");
            return;
        }
        setIsSaving(true);
        setStatusMessage("Saving draft...");
        try {
            const payload = {
                id: blogData.id,
                title: blogData.title,
                content: blogData.content,
                tags: blogData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
            };
            const response = await saveDraft(payload);
            if (isMounted.current) {
                if (!blogData.id && response.data.id) {
                    setBlogData((prev) => ({
                        ...prev,
                        id: response.data.id,
                        status: "draft",
                    }));
                    window.history.replaceState(
                        null,
                        "",
                        `/editor/${response.data.id}`
                    );
                } else {
                    setBlogData((prev) => ({ ...prev, status: "draft" }));
                }
                setStatusMessage(
                    `Draft saved at ${new Date().toLocaleTimeString()}`
                );
                toast.success("Draft saved successfully!");
            }
        } catch (error) {
            if (isMounted.current) {
                setStatusMessage("Failed to save draft.");
                toast.error(
                    "Failed to save draft: " +
                        (error.response?.data?.message || error.message)
                );
            }
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!currentUser) {
            toast.warn("Please log in to publish posts.");
            navigate("/login");
            return;
        }
        if (!blogData.title.trim() || !blogData.content.trim()) {
            toast.error("Title and Content are required to publish.");
            return;
        }
        setIsSaving(true);
        setStatusMessage("Publishing...");
        try {
            const payload = {
                id: blogData.id,
                title: blogData.title,
                content: blogData.content,
                tags: blogData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
            };
            const response = await publishBlog(payload);
            if (isMounted.current) {
                setStatusMessage("Blog published successfully!");
                toast.success("Blog published successfully!");
                navigate(`/blogs/${response.data.id}`);
            }
        } catch (error) {
            if (isMounted.current) {
                setStatusMessage("Failed to publish blog.");
                toast.error(
                    "Failed to publish blog: " +
                        (error.response?.data?.message || error.message)
                );
            }
        } finally {
            if (isMounted.current) setIsSaving(false);
        }
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [
                { list: "ordered" },
                { list: "bullet" },
                { indent: "-1" },
                { indent: "+1" },
            ],
            ["link", "image", "video"], // Added video
            [{ color: [] }, { background: [] }], // Font color, background color
            [{ font: [] }], // Font family
            [{ align: [] }], // Text alignment
            ["clean"],
        ],
    };

    if (isLoading)
        return <div className="loading container">Loading editor...</div>;

    // If trying to access editor directly without being logged in (and not for viewing)
    if (!currentUser && !effectiveBlogId && !blogIdForViewing) {
        return (
            <div className="container">
                <p>
                    Please <Link to="/login">login</Link> to create or edit
                    posts.
                </p>{" "}
                {/* Added Link import */}
            </div>
        );
    }

    // Determine if the current user can edit this post
    const canEdit =
        currentUser && (blogData.user_id === currentUser.id || !blogData.id); // Owns post or new post

    return (
        <div className="blog-editor container">
            <h2>
                {isViewMode
                    ? `Viewing: ${blogData.title || "Blog Post"}`
                    : blogData.id
                    ? "Edit Blog Post"
                    : "Create New Blog Post"}
            </h2>
            {isViewMode && blogData.author_username && (
                <p className="blog-meta">
                    By: {blogData.author_username} | Status: {blogData.status} |
                    Last updated:{" "}
                    {new Date(
                        blogData.updated_at || blogData.created_at
                    ).toLocaleDateString()}
                </p>
            )}

            <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                    type="text"
                    id="title"
                    name="title" // For handleInputChange
                    value={blogData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog title"
                    readOnly={isViewMode || (!canEdit && !!blogData.id)} // Read-only if viewing or not owner of existing
                    disabled={isViewMode || (!canEdit && !!blogData.id)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="content">Content</label>
                <ReactQuill
                    theme="snow"
                    value={blogData.content}
                    onChange={handleContentChange}
                    modules={quillModules}
                    placeholder={
                        isViewMode
                            ? ""
                            : "Write your amazing blog content here..."
                    }
                    readOnly={isViewMode || (!canEdit && !!blogData.id)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                    type="text"
                    id="tags"
                    name="tags" // For handleInputChange
                    value={blogData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., tech, react, javascript"
                    readOnly={isViewMode || (!canEdit && !!blogData.id)}
                    disabled={isViewMode || (!canEdit && !!blogData.id)}
                />
            </div>

            {!isViewMode && canEdit && (
                <div className="editor-actions">
                    <div>
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className="save-draft-btn"
                        >
                            {isSaving ? "Saving..." : "Save Draft"}
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isSaving}
                            className="publish-btn"
                        >
                            {isSaving ? "Publishing..." : "Publish"}
                        </button>
                    </div>
                    <span className="status-message">{statusMessage}</span>
                </div>
            )}
            {isViewMode &&
                currentUser &&
                blogData.user_id === currentUser.id && (
                    <div className="editor-actions">
                        <button
                            onClick={() => navigate(`/editor/${blogData.id}`)}
                            className="edit-btn"
                        >
                            Edit This Post
                        </button>
                        <span className="status-message">{statusMessage}</span>
                    </div>
                )}
            {isViewMode && !canEdit && blogData.status === "draft" && (
                <p className="status-message">
                    This is a draft and not publicly visible.
                </p>
            )}
        </div>
    );
};

export default BlogEditor;
