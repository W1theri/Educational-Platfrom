# Educational Platform

Full-stack educational platform with role-based access for students, teachers, and admins.

## Overview

This project includes:

- A Node.js + Express + MongoDB backend (`/src`)
- A React + TypeScript + Vite frontend (`/frontend`)
- JWT-based authentication and role-based authorization
- Course enrollment (public/private with enrollment key)
- Lesson and assignment workflow
- File upload support for lesson materials and assignment submissions
- Teacher grading and comments
- Student gradebook and progress tracking
- Admin analytics and user management

## Tech Stack

- Backend: Node.js, Express 5, Mongoose, JWT, Multer, CORS
- Frontend: React 19, TypeScript, React Router, Axios, Tailwind CSS
- Database: MongoDB

## Repository Structure

```text
.
+-- src/
|   +-- app.js
|   +-- server.js
|   +-- routes.js
|   +-- config/
|   +-- db/
|   |   +-- mongo.js
|   |   +-- models/
|   +-- middlewares/
|   +-- modules/
|       +-- auth/
|       +-- users/
|       +-- courses/
|       +-- lessons/
|       +-- assignments/
|       +-- quizzes/
|       +-- resources/
|       +-- grades/
|       +-- admin/
+-- frontend/
|   +-- src/
|   +-- package.json
+-- uploads/
+-- .env.example
+-- ReadME.md
```

## Core Features

### Student

- Browse all available courses
- Enroll in public courses
- Enroll in private courses using enrollment key
- View lessons and materials
- Submit assignment text/files
- Auto-mark assignment lesson complete after submission
- See late/pending/graded status in gradebook

### Teacher

- Create and manage courses
- Create and update lessons
- Mark lessons as assignment lessons
- Set due date and max grade
- Review submissions
- Grade submissions and leave feedback/comments

### Admin

- View engagement stats
- View course analytics and student progress
- View/update users (students, teachers, admins)
- Reset user passwords

## Architecture Notes

- API base path: `http://localhost:3000/api`
- Frontend Axios base URL: `http://localhost:3000/api`
- Server port is fixed to `3000` in `src/server.js`
- Uploaded files are stored in `uploads/` and served at `/uploads/...`
- If `frontend/dist` exists, backend serves the built SPA
- If `frontend/dist` is missing, `/` returns a build instruction message

## Environment Variables

Use `.env` at repository root.

From `.env.example`:

```env
MONGO_URI=
MONGO_DB_NAME=
JWT_SECRET=
JWT_EXPIRES_IN=7d
```

## Installation

### 1. Install backend dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running the Project

### Backend

```bash
npm start
```

Backend starts on `http://localhost:3000`.

### Frontend (development)

```bash
cd frontend
npm run dev
```

Frontend runs on Vite dev server (typically `http://localhost:5173`).

### Frontend build (production/static serving by backend)

```bash
cd frontend
npm run build
cd ..
npm start
```

With `frontend/dist` present, backend serves frontend routes directly.

## Authentication and Authorization

### Auth flow

1. `POST /api/auth/register` or `POST /api/auth/login`
2. Receive JWT token + user object
3. Send `Authorization: Bearer <token>` for protected routes

### Roles

- `student`
- `teacher`
- `admin`

### Important role behavior

- Register endpoint only allows creating `student` or `teacher`
- Admin dashboard route requires `user.role === "admin"`
- Admin users must be promoted manually (DB/admin action), not via public register

## API Reference

All endpoints below are under `/api`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register (student/teacher) |
| POST | `/auth/login` | No | Login |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | Yes | Get current user profile |
| PUT | `/users/profile` | Yes | Update own profile |
| PUT | `/users/profile/password` | Yes | Change own password |
| GET | `/users/:id` | Admin | Get user by ID |
| GET | `/users` | Admin | List users (supports `role`, `search`) |
| PUT | `/users/:id/admin` | Admin | Admin update user |
| PUT | `/users/:id/reset-password` | Admin | Admin reset password |

### Courses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/courses` | Yes | List courses (supports `search`, `teacher`, `category`, `level`, `isPublic`) |
| GET | `/courses/my/courses` | Yes | Get my courses (teacher-created or student-enrolled) |
| GET | `/courses/:id` | No | Get single course |
| POST | `/courses` | Yes (teacher) | Create course |
| PUT | `/courses/:id` | Yes (owner teacher) | Update course |
| DELETE | `/courses/:id` | Yes (owner teacher/admin) | Delete course |
| POST | `/courses/:id/enroll` | Yes (student) | Enroll in course |
| GET | `/courses/:id/enrollment` | Yes | Get my enrollment for course |
| GET | `/courses/:id/enrollments` | Yes (teacher owner) | Get course enrollments |
| PUT | `/courses/enrollments/:enrollmentId` | Yes (teacher owner) | Update enrollment progress/status |
| GET | `/courses/:courseId/lessons` | Yes | Get lessons by course |
| GET | `/courses/:courseId/quizzes` | Yes | Get quizzes by course |

### Lessons

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/lessons/:id` | Yes | Get lesson details |
| POST | `/lessons` | Yes (teacher) | Create lesson (supports files) |
| PUT | `/lessons/:id` | Yes (owner teacher) | Update lesson (supports files) |
| DELETE | `/lessons/:id` | Yes (owner teacher) | Delete lesson |
| POST | `/lessons/:id/complete` | Yes (enrolled student) | Toggle completion |

### Assignments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/assignments` | Yes (teacher/admin) | Create assignment |
| GET | `/assignments/course/:courseId` | Yes | List course assignments |
| GET | `/assignments/course/:courseId/overview` | Yes | Teacher overview with stats |
| GET | `/assignments/lesson/:lessonId` | Yes | Get assignment by lesson |
| GET | `/assignments/my/submissions` | Yes (student) | Get my submissions |
| GET | `/assignments/:id` | Yes | Get assignment details |
| PUT | `/assignments/:id` | Yes (owner teacher) | Update assignment |
| DELETE | `/assignments/:id` | Yes (owner teacher) | Delete assignment |
| POST | `/assignments/:id/submit` | Yes (student) | Submit assignment (multipart) |
| PUT | `/assignments/:id/grade` | Yes (teacher/admin) | Grade submission |
| POST | `/assignments/:id/comment` | Yes | Add comment to submission |

### Quizzes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/quizzes` | Yes (teacher) | Create quiz |
| GET | `/quizzes/:id` | Yes | Get quiz |
| POST | `/quizzes/:id/submit` | Yes (student) | Submit quiz attempt |

### Resources

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resources/upload` | Yes | Upload a file |

### Grades

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/grades/student/:studentId/course/:courseId` | Yes | Student course grades |
| GET | `/grades/student/me/gradebook` | Yes (student) | Full gradebook |
| GET | `/grades/course/:courseId` | Yes (teacher/admin) | Course grade view |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Yes (admin) | Platform totals and average progress |
| GET | `/admin/analytics/courses` | Yes (admin) | Course analytics + student progress |

## Data Model Summary

### `User`

- `username`, `email`, `password`, `role`, `dateOfBirth`, `phoneNumber`

### `Course`

- `title`, `description`, `teacher`, `enrollmentKey`, `isPublic`, `category`, `level`, `duration`

### `Enrollment`

- `student`, `course`, `progress`, `completedLessons`, `status`, `enrolledAt`, `completedAt`

### `Lesson`

- `title`, `course`, `content`, `videoUrls`, `attachments`, `order`, `isPublished`
- Assignment-related: `isAssignment`, `dueDate`, `maxGrade`

### `Assignment`

- `title`, `description`, `lesson`, `course`, `dueDate`, `maxGrade`
- `submissions[]` with `student`, `content`, `fileUrl`, `filename`, `submittedAt`, `isLate`, `grade`, `feedback`, `comments`, `gradedAt`

### `Grade`

- `student`, `course`, `lesson`, `assignment`, `grade`, `status`, `submittedAt`, `isLate`, `gradedAt`

### `Quiz` and `QuizResult`

- Quizzes include question options, answer index, passing score, attempts
- Results store score, percentage, pass/fail, and submitted answers

## Assignment and Deadline Behavior

- Assignment lessons can be created from lesson management
- Student can submit once per assignment
- Submission is marked late when `submittedAt > dueDate`
- Late state is persisted (`isLate`) and shown in:
  - Course detail submission status
  - Teacher submission review
  - Student gradebook
- Student assignment submission can auto-mark lesson complete in UI flow

## Frontend Routes

| Route | Access |
|---|---|
| `/login`, `/register` | Public |
| `/dashboard` | Authenticated |
| `/courses` | Authenticated |
| `/courses/:id` | Authenticated |
| `/teacher/create-course` | Authenticated (teacher/admin UI access) |
| `/teacher/manage-course/:id` | Authenticated |
| `/teacher/courses/:courseId/assignments` | Authenticated |
| `/teacher/assignments/:assignmentId/review` | Authenticated |
| `/student/gradebook` | Authenticated |
| `/admin` | Admin only |

## Uploads

- Upload directory: `uploads/`
- Static URL path: `/uploads/<filename>`
- Used for lesson materials and assignment files

## Troubleshooting

### Cannot open admin dashboard

- Ensure logged-in user role is `admin`
- Register does not create admin accounts
- Promote role in DB, then log out and log in again

### Private courses do not appear in browse list

- `/courses` is authenticated and can return all courses
- Verify valid JWT token in frontend local storage

### Frontend not served by backend

- Build frontend first:
  - `cd frontend && npm run build`
- Then restart backend

### File links not opening

- Verify backend is running
- Verify uploaded file exists in `uploads/`

## Security Notes

- Do not commit real secrets in `.env`
- Use strong `JWT_SECRET` in production
- Tighten CORS config for production domains
- Consider file-type and virus scanning for uploads in production

## Known Gaps / Improvement Ideas

- Add backend validation library (Joi/Zod) for request schemas
- Add automated tests (unit/integration/e2e)
- Add rate limiting and request logging
- Add database migrations/seed scripts
- Add refresh tokens and secure cookie strategy
- Add role-aware route guards for teacher-specific frontend pages
