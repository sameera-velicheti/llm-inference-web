# LLM Inference Web Interface
**ECE 452 Software Engineering — Group 8 — Spring 2026**

A full-stack web application providing a user interface for large language model (LLM) inference. Built with Node.js and Express following an MVC architecture, with SQLite for data persistence and a static HTML/CSS/JS frontend.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [REST API Reference](#rest-api-reference)
6. [Database Design](#database-design)
7. [Frontend Pages](#frontend-pages)
8. [Testing](#testing)
9. [Development Notes](#development-notes)
10. [Iteration Progress](#iteration-progress)

---

## Project Overview

This project is developed across three iterations as part of ECE 452. The application allows users to interact with a large language model through a clean web interface. Authentication is handled locally with support for registered accounts and guest sessions.

**Team roles:**
| Subteam | Responsibilities |
|---|---|
| Requirements | User stories, lo-fi UI sketches, GitHub repository setup |
| Development | Software architecture, backend implementation, unit tests |
| Testing | Acceptance tests (Cucumber.js), automated browser testing (Puppeteer) |

---

## Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| SQLite (better-sqlite3) | Local database |
| bcrypt | Password hashing |
| uuid | Reset token generation |
| express-session | Session management |
| cookie-parser | Cookie handling |

### Frontend
| Technology | Purpose |
|---|---|
| HTML / CSS / JavaScript | Static pages served by Express |
| DM Serif Display + DM Sans | Typography (Google Fonts) |

### Testing
| Technology | Purpose |
|---|---|
| Jasmine | Unit testing (Development team) |
| Cucumber.js | Acceptance testing (Testing team) |
| Puppeteer | Automated browser testing (Testing team) |

---

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # SQLite connection and table initialization
│   │   ├── controllers/
│   │   │   └── authController.js   # Business logic for all authentication routes
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # requireAuth session guard
│   │   ├── models/
│   │   │   └── userModel.js        # Database query functions
│   │   ├── routes/
│   │   │   └── authRoutes.js       # Route definitions
│   │   ├── views/
│   │   │   └── authView.js         # Standardized JSON response formatters
│   │   ├── app.js                  # Express app configuration
│   │   └── server.js               # Entry point, starts server on port 3000
│   └── spec/
│       ├── support/
│       │   └── jasmine.json        # Jasmine configuration
│       ├── authViewSpec.js         # Unit tests for response formatters
│       ├── authMiddlewareSpec.js   # Unit tests for session middleware
│       ├── userModelSpec.js        # Unit tests for database model layer
│       └── authControllerSpec.js  # Unit tests for controller logic
├── database/
│   └── app.db                      # SQLite database file
├── public/
│   ├── index.html                  # Landing page
│   ├── login.html                  # Login page
│   ├── register.html               # Account creation page
│   ├── reset-password.html         # Password reset page
│   ├── chat-guest.html             # Chat interface for guest users
│   ├── chat-user.html              # Chat interface for authenticated users
│   └── css/
│       └── style.css               # Shared stylesheet for all pages
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sameera-velicheti/llm-inference-web.git
cd llm-inference-web

# Install dependencies
npm install
```

### Running the Server

```bash
node backend/server.js
```

The server starts at `http://localhost:3000`.

The frontend is served automatically — open `http://localhost:3000` in your browser to access the landing page.

### Running Unit Tests

```bash
# Run all Jasmine unit tests
npm test

# Run a specific test suite
npx jasmine --config=backend/spec/support/jasmine.json --filter="authController"
npx jasmine --config=backend/spec/support/jasmine.json --filter="authView"
npx jasmine --config=backend/spec/support/jasmine.json --filter="authMiddleware"
npx jasmine --config=backend/spec/support/jasmine.json --filter="userModel"
```

---

## REST API Reference

All requests that send data should use JSON (`Content-Type: application/json`).
All responses follow a standard format:

**Success:**
```json
{ "success": true, "message": "...", ...data }
```

**Error:**
```json
{ "success": false, "error": "..." }
```

### Authentication Routes
Base path: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | /api/auth/register | Create a new user account | No |
| POST | /api/auth/login | Authenticate and start a session | No |
| POST | /api/auth/logout | Destroy the current session | No |
| POST | /api/auth/guest | Start a guest session | No |
| POST | /api/auth/forgot-password | Generate a password reset token | No |
| POST | /api/auth/reset-password | Reset password using a token | No |
| GET | /api/auth/me | Retrieve current session information | Yes |

### Example Requests

**Register**
```
POST /api/auth/register
{ "username": "yourname", "email": "user@example.com", "password": "Password123!" }
```
Validation rules: all fields required, email must be a valid format, username must be unique, email must be unique.

**Login**
```
POST /api/auth/login
{ "email": "user@example.com", "password": "Password123!" }
```

**Forgot Password**
```
POST /api/auth/forgot-password
{ "email": "user@example.com" }
```

**Reset Password**
```
POST /api/auth/reset-password
{ "token": "<reset-token>", "newPassword": "NewPassword123!" }
```

---

## Database Design

The SQLite database is located at `database/app.db` and is initialized automatically when the server starts.

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique user identifier |
| username | TEXT | UNIQUE, NOT NULL | Unique display name |
| email | TEXT | UNIQUE, NOT NULL | User email address |
| password_hash | TEXT | NOT NULL | bcrypt hashed password |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Account creation time |

### `password_reset_tokens`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique token identifier |
| user_id | INTEGER | FK → users.id | Associated user |
| token | TEXT | NOT NULL | UUID reset token string |
| used | INTEGER | DEFAULT 0 | 0 = unused, 1 = used |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Token creation time |

### `sessions_log`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique log identifier |
| user_id | INTEGER | | Null for guest sessions |
| is_guest | INTEGER | DEFAULT 0 | 0 = authenticated user, 1 = guest |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Session creation time |

---

## Frontend Pages

| Page | File | Description |
|---|---|---|
| Landing | `index.html` | Entry point with links to login, register, and guest access |
| Login | `login.html` | Email and password login form |
| Register | `register.html` | New account creation form |
| Reset Password | `reset-password.html` | Two-step password reset flow |
| Chat (Guest) | `chat-guest.html` | Chat interface for guest sessions |
| Chat (User) | `chat-user.html` | Chat interface for authenticated users with logout |

---

## Testing

### Unit Tests (Jasmine)

Unit tests are located in `backend/spec/` and follow test-driven development (TDD) principles. All external dependencies (database, bcrypt) are mocked using Jasmine spies so no real database operations occur during testing.

| Suite | File | Tests | Coverage |
|---|---|---|---|
| authView | authViewSpec.js | 9 | Response formatters |
| authMiddleware | authMiddlewareSpec.js | 6 | Session guard logic |
| userModel | userModelSpec.js | 20 | All database query functions including username lookup |
| authController | authControllerSpec.js | 35 | All route business logic including username uniqueness and email format validation |
| **Total** | | **70** | |

### Acceptance Tests (Cucumber.js)
Managed by the Testing team. See the Testing team's documentation for scenario definitions and step implementations.

### Automated Browser Tests (Puppeteer)
Managed by the Testing team. A one-minute demo video of the automated browser testing session is included in the final submission.

---

## Development Notes

### Password Reset Flow
In production, the `POST /api/auth/forgot-password` endpoint would deliver the reset token to the user's registered email address via an email delivery service (e.g. SendGrid, Nodemailer with SMTP). Since no email service is configured in this iteration, the token is returned directly in the API response and displayed on screen for testing and demonstration purposes.

**This is an intentional development workaround for Iteration 1.** The token is functional — it is stored in the database, expires on use, and correctly authenticates the reset request. Only the delivery mechanism differs from production behavior.

To test the reset flow manually:
1. `POST /api/auth/forgot-password` with a registered email → copy the token from the response
2. `POST /api/auth/reset-password` with the token and a new password

Email delivery integration is planned for a future iteration.

### LLM Inference
The chat interface is fully built and session-authenticated. The LLM inference call is not yet connected — the assistant response in the current iteration returns a placeholder string. LLM integration (via vLLM) is planned for a future iteration.

### Session Security
Sessions are managed server-side via `express-session`. The session secret is currently hardcoded as a development placeholder and should be moved to an environment variable before any production deployment.

---

## Iteration Progress

| Iteration | Focus | Status |
|---|---|---|
| Iteration 1 | Authentication, user accounts, frontend pages, unit tests | ✅ Complete |
| Iteration 2 | TBD | 🔲 Upcoming |
| Iteration 3 | TBD | 🔲 Upcoming |