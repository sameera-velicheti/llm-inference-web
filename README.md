# llm-inference-web
A web interface for large language model inference with authentication, guest access, and a modular backend architecture.

The server is implemented using Node.js and Express, following an MVC architecture

## Backend Technology Stack
JavaScript
Node.js
Express.js
SQLite 
bcrypt (to hash user passwords)
uuid (to generate password reset tokens)
express-session (to maintain login sessions)

## Backend Structure
│
├── src
│   ├── config
│   │   └── db.js
│   │
│   ├── controllers
│   │   └── authController.js
│   │
│   ├── middleware
│   │   └── authMiddleware.js
│   │
│   ├── models
│   │   └── userModel.js
│   │
│   ├── routes
│   │   └── authRoutes.js
│   │
│   ├── views
│   │   └── authView.js
│   │
│   ├── app.js
│   └── server.js
│
└── database
    └── app.db

## Running Backend
Clone repo: git clone <repo url>
npm install
Start server: node backend/server.js

Backend server runs locally at: http://localhost:3000

Authentication routes are prefixed with: http://localhost:3000/api/auth

## Database Design
The database contains three main tables: `users`, `password_reset_tokens`, and `sessions_log`. 
The `users` table stores registered user accounts and hashed passwords, while the 
`password_reset_tokens` table manages temporary tokens used for password recovery. 
The `sessions_log` table records session activity for both authenticated users and 
guest sessions. Database interactions are handled through the Model layer of the 
MVC architecture using the `better-sqlite3` library.

## REST API Routes
| Method | Endpoint | Description |
|-------|----------|-------------|
| POST | /api/auth/register | Create a new user account |
| POST | /api/auth/login | Authenticate user login/login to user session |
| POST | /api/auth/logout | Logout of current user session |
| POST | /api/auth/guest | Create a guest session |
| POST | /api/auth/forgot-password | Generate a password reset token |
| POST | /api/auth/reset-password | Reset a user's password |
| GET | /api/auth/cas/login | Mock Rutgers CAS authentication |
| GET | /api/auth/me | Retrieve current session information |

## Request Format
Requests sending data should use JSON

Example: 
POST /api/auth/register

{
  "email": "user@test.com",
  "password": "Password123!"
}

