# EduLearn - E-Learning Portal

A full-stack e-learning portal with slide-based learning, MCQ quizzes, e-certificates, and an admin dashboard.

## Features

### Learner Portal
- Browse and enroll in learning modules
- Navigate through slides at your own pace
- Take MCQ quizzes after completing slides
- Download e-certificates upon passing

### Admin Dashboard
- Overview of user progress, module performance, and certificate stats
- Create and manage learning modules (title, description, thumbnail, pass score)
- Add/edit/delete slides (text content + image upload)
- Add/edit/delete MCQ questions with 4 options and correct answer marking

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Install all dependencies
npm run install:all

# Start backend (port 3001)
npm run dev:backend

# Start frontend (port 5173)  
npm run dev:frontend
```

Or run both concurrently:
```bash
npm install
npm run dev
```

### Default Admin Account
- Email: `admin@elearning.com`
- Password: `admin123`

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Express.js, SQLite (better-sqlite3), JWT Auth
- **Certificates**: HTML Canvas (client-side generation)

## Project Structure

```
├── backend/
│   ├── server.js          # Express app entry point
│   ├── database.js        # SQLite schema + connection
│   ├── middleware/auth.js  # JWT middleware
│   └── routes/
│       ├── auth.js        # Register/login
│       ├── modules.js     # Module viewing + quiz submission
│       ├── admin.js       # Admin CRUD operations
│       └── certificates.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx     # User module list
        │   ├── ModuleView.jsx    # Slide viewer + quiz
        │   ├── Certificates.jsx  # Certificate download
        │   └── admin/
        │       ├── AdminDashboard.jsx  # Stats + analytics
        │       ├── AdminModules.jsx    # Module list
        │       └── AdminModuleEdit.jsx # Module editor
        └── components/
            ├── Layout.jsx       # User navbar
            └── AdminLayout.jsx  # Admin sidebar
```
