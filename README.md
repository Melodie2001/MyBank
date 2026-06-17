# MyBank — Personal Expense Manager

MyBank is a full-stack personal finance management application developed with Symfony, React, Docker and MySQL. It allows users to track their expenses and income, organize them by custom categories, set monthly budgets per category, and receive real-time notifications for budget alerts and account events.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend User | React 19, Vite, React Router DOM, Axios |
| Frontend Admin | React 19, Vite, React Router DOM, Axios |
| Backend | Symfony 7, PHP 8.3, Doctrine ORM |
| Database | MySQL 8.0 |
| Authentication | JWT (LexikJWTAuthenticationBundle) |
| Containerization | Docker & Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Vitest (Frontend), PHPUnit (Backend) |

---

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) v20+
- [PHP](https://www.php.net/) 8.3+
- [Composer](https://getcomposer.org/)
- [Symfony CLI](https://symfony.com/download)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Melodie2001/MyBank.git
cd MyBank
```

### 2. Start Docker services

```bash
docker-compose up -d
```

### 3. Backend setup

```bash
cd backend
composer install
```

Run migrations:

```bash
docker exec mybank_backend php bin/console doctrine:migrations:migrate --no-interaction
```

Generate JWT keys:

```bash
php bin/console lexik:jwt:generate-keypair
```

### 4. Frontend User setup

```bash
cd frontend
npm install
npm run dev
```

The user application is available at **http://localhost:5173**

### 5. Frontend Admin setup

```bash
cd frontend-admin
npm install
npm run dev
```

The admin portal is available at **http://localhost:5174**

---

## Docker Setup

To run the entire application with Docker:

```bash
docker-compose up -d
```

Stop containers:

```bash
docker-compose down
```

| Service | URL |
|---------|-----|
| Frontend User | http://localhost:5173 |
| Frontend Admin | http://localhost:5174 |
| Backend API | http://localhost:8000 |
| phpMyAdmin | http://localhost:8081 |
| MySQL | localhost:3307 |

---

## Project Structure

```
MyBank/
├── backend/                    # Symfony API
│   ├── src/
│   │   ├── Controller/         # API Controllers
│   │   │   ├── AuthController.php
│   │   │   ├── BudgetController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── OperationController.php
│   │   │   └── UserController.php
│   │   ├── Entity/             # Doctrine entities
│   │   │   ├── Budget.php
│   │   │   ├── Category.php
│   │   │   ├── Notification.php
│   │   │   ├── Operation.php
│   │   │   └── User.php
│   │   ├── Repository/         # Database repositories
│   │   ├── Service/
│   │   │   └── NotificationService.php
│   │   └── EventListener/      # JWT event listeners
│   ├── migrations/             # Database migrations
│   └── config/
│
├── frontend/                   # React user application
│   ├── src/
│   │   ├── api/                # Axios configuration
│   │   ├── components/
│   │   │   └── Sidebar.jsx     # Horizontal topbar
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Operations.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── budgetService.js
│   │   │   ├── categoryService.js
│   │   │   ├── notificationService.js
│   │   │   ├── operationService.js
│   │   │   └── userService.js
│   │   └── styles/
│
├── frontend-admin/             # React admin portal
│
├── .github/
│   └── workflows/
│       └── ci.yaml             # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## Features

### User Portal (http://localhost:5173)

#### Navigation
- Horizontal topbar with logo, navigation tabs (Dashboard / Operations / Categories), dark mode toggle, notification bell with unread badge, and user avatar dropdown (Profile / Logout)

#### Authentication
- JWT Login / Register (with email, password, first name, last name, phone, date of birth, gender)
- Account pending approval system — new accounts require admin validation before access
- Account validated notification sent automatically on approval

#### Dashboard
- Balance, total income and total expenses overview
- Recent operations with category emojis
- Search bar with combined filters

#### Operations
- Full CRUD (create, edit, delete)
- Filter by type (All / Income / Expense) and text search
- **Budget integration in "New Operation" modal**: when selecting an expense category, the modal shows the existing monthly budget status (progress bar, spent/remaining) or offers to set a new monthly limit inline — no need to navigate away

#### Categories
- Select from predefined categories (icon + color)
- Stats cards: total categories, budgets configured, most spent category, budget alerts count
- Per-category card with: monthly total, operation count, budget progress bar (green/amber/red), "Over budget" badge
- Set or edit monthly budget limit directly from the category card
- Auto-add category when creating an operation

#### Budgets
- Create a monthly expense limit per category
- Real-time progress tracking (spent / limit / remaining / percentage)
- Color-coded: green < 80%, amber 80–99%, red ≥ 100%

#### Notifications
- Bell icon with red badge showing the number of unread notifications (refreshed every 60s)
- Dedicated `/notifications` page with notifications grouped by date (Today / Yesterday / Earlier)
- Notification types:
  - 💰 **operation_added** — every new expense or income
  - ⚠️ **budget_warning** — when a category reaches 80% of its monthly limit
  - 🚨 **budget_exceeded** — when a category exceeds 100% of its monthly limit
  - ✅ **account_validated** — when an admin approves a user account
- Budget threshold alerts trigger only on threshold crossing (not on every operation above threshold)
- Mark individual or all notifications as read, delete notifications

#### Profile
- View and edit all personal information: first name, last name, email, phone, date of birth, gender
- Change password section

### Admin Portal (http://localhost:5174)
- Admin-only access
- Dashboard with global platform statistics
- User management (approve, reject, delete, change role)
- Pending registrations approval
- View all operations from all users

---

## User Roles

| Role | Permissions |
|------|------------|
| `ROLE_USER` | Manage own operations, categories, budgets; receive notifications; view dashboard |
| `ROLE_ADMIN` | Access admin portal, manage all users, validate registrations, view all operations |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user (with gender field) |
| POST | `/api/login` | Login and get JWT token |
| GET | `/api/me` | Get current user info |
| PUT | `/api/me` | Update profile (name, email, phone, birthDate, gender, password) |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations` | Get all operations |
| POST | `/api/operations` | Create an operation (triggers operation_added + budget alert notifications) |
| PUT | `/api/operations/{id}` | Update an operation |
| DELETE | `/api/operations/{id}` | Delete an operation |
| GET | `/api/me/operations` | Get current user's operations |
| GET | `/api/dashboard` | Get dashboard statistics |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all available categories |
| GET | `/api/my-categories` | Get user's categories |
| POST | `/api/my-categories` | Add category to user's list |
| DELETE | `/api/my-categories/{id}` | Remove category from user's list |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get all user budgets with spent/remaining/percentage |
| POST | `/api/budgets` | Create a monthly budget for a category |
| PUT | `/api/budgets/{id}` | Update budget monthly limit |
| DELETE | `/api/budgets/{id}` | Delete a budget |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all notifications (newest first) |
| GET | `/api/notifications/unread-count` | Get number of unread notifications |
| PUT | `/api/notifications/read-all` | Mark all notifications as read |
| PUT | `/api/notifications/{id}/read` | Mark one notification as read |
| DELETE | `/api/notifications/{id}` | Delete a notification |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (admin only) |
| PUT | `/api/users/{id}/status` | Update user status — triggers account_validated notification (admin only) |
| PUT | `/api/users/{id}/role` | Update user role (admin only) |
| DELETE | `/api/users/{id}` | Delete a user (admin only) |

---

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `Version20260615211008` | Create `budget` table |
| `Version20260617140000` | Add `gender` column to `user` table |
| `Version20260617160000` | Create `notification` table |

---

## Running Tests

### Frontend User tests (Vitest)

```bash
cd frontend
npm run test:run
```

### Frontend Admin tests (Vitest)

```bash
cd frontend-admin
npm run test:run
```

### Backend tests (PHPUnit)

```bash
cd backend
php bin/phpunit
```

---

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration. On every push to `main`:

1. **Backend CI** — Installs dependencies, runs migrations, executes PHPUnit tests
2. **Frontend User CI** — Installs dependencies, runs Vitest tests, builds the application
3. **Frontend Admin CI** — Installs dependencies, runs Vitest tests, builds the application

---

## Security

- JWT authentication protects all API routes
- Users can only access their own data (operations, categories, budgets, notifications)
- Passwords are hashed with Symfony's password hasher
- New accounts require admin approval before access
- Budget threshold notifications only trigger on threshold crossing to prevent spam
- Admin accounts cannot access the user portal
- Role-based access control (ROLE_USER / ROLE_ADMIN)

---

## Author

**Elodie MINKOUE**  
CDA 3ème année — L'École Multimédia — 2025
