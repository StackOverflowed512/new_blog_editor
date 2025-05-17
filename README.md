# BlogWave - Modern Blogging Platform

BlogWave is a full-stack blogging platform built with React and Flask, featuring a modern UI, real-time content editing, and user authentication.

![BlogWave Screenshot](screenshots/blogwave.png)

## Features

-   🚀 Modern, responsive UI design
-   👤 User authentication (register/login)
-   ✍️ Rich text editor with real-time preview
-   📝 Draft saving and auto-save functionality
-   🏷️ Tag support for better content organization
-   📱 Mobile-friendly design
-   🔍 Blog search and filtering
-   📊 User dashboard with post management

## Tech Stack

### Frontend

-   React.js
-   React Router for navigation
-   React-Quill for rich text editing
-   Axios for API requests
-   React-Toastify for notifications
-   Font Awesome for icons

### Backend

-   Flask (Python)
-   SQLAlchemy for database ORM
-   JWT for authentication
-   SQLite database (configurable for PostgreSQL)
-   Flask-CORS for cross-origin support

## Getting Started

### Prerequisites

-   Node.js (v14+ recommended)
-   Python (v3.8+ recommended)
-   pip (Python package manager)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/blogwave.git
cd blogwave
```

2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend

```bash
cd ../frontend
npm install
```

4. Configure environment variables

```bash
# In backend/.flaskenv
FLASK_APP=app:create_app
FLASK_ENV=development
FLASK_DEBUG=1
JWT_SECRET_KEY="your-secret-key"

# In frontend/.env
REACT_APP_API_URL=http://localhost:5001/api
```

### Running the Application

1. Start the backend server

```bash
cd backend
flask run
```

2. Start the frontend development server

```bash
cd frontend
npm start
```

The application will be available at:

-   Frontend: http://localhost:3000
-   Backend API: http://localhost:5001

## Project Structure

```
blogwave/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── public/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
└── README.md
```

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - User login
-   `GET /api/auth/me` - Get current user

### Blogs

-   `GET /api/blogs` - Get all blogs
-   `GET /api/blogs/<id>` - Get specific blog
-   `POST /api/blogs/save-draft` - Save blog draft
-   `POST /api/blogs/publish` - Publish blog
-   `DELETE /api/blogs/<id>` - Delete blog

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

-   [React](https://reactjs.org/)
-   [Flask](https://flask.palletsprojects.com/)
-   [React-Quill](https://github.com/zenoamaro/react-quill)
-   [Font Awesome](https://fontawesome.com/)

Project Link: [https://github.com/yourusername/blogwave](https://github.com/StackOverflowed512/new_blog_editor)

