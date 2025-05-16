import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { "x-access-token": token } : {};
};

const api = axios.create({
    baseURL: API_URL,
});

// Authentication
export const register = (userData) => api.post("/auth/register", userData);
export const login = (credentials) => api.post("/auth/login", credentials);
export const getCurrentUser = () =>
    api.get("/auth/me", { headers: getAuthHeaders() });

// Blogs
export const saveDraft = (blogData) => {
    return api.post("/blogs/save-draft", blogData, {
        headers: getAuthHeaders(),
    });
};

export const publishBlog = (blogData) => {
    return api.post("/blogs/publish", blogData, { headers: getAuthHeaders() });
};

export const getAllBlogs = (params = {}) => {
    // params can be { status: 'published' } or { user_id: 1 }
    return api.get("/blogs", { params });
};

export const getBlogById = (id) => {
    return api.get(`/blogs/${id}`);
};

export const deleteBlog = (id) => {
    return api.delete(`/blogs/${id}`, { headers: getAuthHeaders() });
};

export default api;
