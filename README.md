Non on n'a pas mis à jour le README avec les nouvelles fonctionnalités. Voici le README complet mis à jour :

````markdown
# MyBank — Personal Expense Manager

MyBank is a full-stack personal finance management application developed with Symfony, React, Docker and MySQL. It allows users to track their expenses and income, organize them by custom categories, and visualize their financial statistics in real time.

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
php bin/console doctrine:migrations:migrate
```

Generate JWT keys:
```bash
php bin/console lexik:jwt:generate-keypair
```

Start the backend server:
```bash
symfony server:start --port=8000
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

## Docker Setup (Full)

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
├── backend/                 # Symfony API
│   ├── src/
│   │   ├── Controller/      # API Controllers
│   │   ├── Entity/          # Doctrine entities
│   │   ├── Repository/      # Database repositories
│   │   └── EventListener/   # JWT event listeners
│   ├── config/
│   │   ├── packages/        # Symfony configuration
│   │   └── jwt/             # JWT keys
│   └── migrations/          # Database migrations
│
├── frontend/                # React user application
│   ├── src/
│   │   ├── api/             # Axios configuration
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Page layouts
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   └── test/            # Unit tests
│
├── frontend-admin/          # React admin portal
│   ├── src/
│   │   ├── api/             # Axios configuration
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Admin pages
│   │   ├── services/        # API services
│   │   └── test/            # Unit tests
│
├── .github/
│   └── workflows/
│       └── ci.yaml          # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## Features

### User Portal (http://localhost:5173)
- ✅ JWT Authentication (Login / Register)
- ✅ Account pending approval system
- ✅ Dashboard with balance, income and expenses statistics
- ✅ Operations management (CRUD)
- ✅ Categories management (select from predefined categories)
- ✅ Auto-add category when creating an operation
- ✅ Responsive design (mobile, tablet, desktop)

### Admin Portal (http://localhost:5174)
- ✅ Admin-only access
- ✅ Dashboard with global platform statistics
- ✅ User management (approve, reject, delete, change role)
- ✅ Pending registrations approval
- ✅ View all operations from all users

---

## User Roles

| Role | Permissions |
|------|------------|
| `ROLE_USER` | Manage own operations and categories, view dashboard |
| `ROLE_ADMIN` | Access admin portal, manage all users, validate registrations, view all operations |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and get JWT token |
| GET | `/api/me` | Get current user info |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations` | Get all operations |
| POST | `/api/operations` | Create an operation |
| PUT | `/api/operations/{id}` | Update an operation |
| DELETE | `/api/operations/{id}` | Delete an operation |
| GET | `/api/dashboard` | Get dashboard statistics |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all available categories |
| GET | `/api/my-categories` | Get user's categories |
| POST | `/api/my-categories` | Add category to user's list |
| DELETE | `/api/my-categories/{id}` | Remove category from user's list |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (admin only) |
| PUT | `/api/users/{id}/status` | Update user status (admin only) |
| PUT | `/api/users/{id}/role` | Update user role (admin only) |
| DELETE | `/api/users/{id}` | Delete a user (admin only) |

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

##  Security

- JWT authentication protects all API routes
- Users can only access their own operations
- Passwords are hashed with Symfony's password hasher
- New accounts require admin approval before access
- Admin accounts cannot access the user portal
- User accounts cannot access the admin portal
- Role-based access control (ROLE_USER / ROLE_ADMIN)

---

## Author

**Elodie MINKOUE**
CDA 3ème année — L'École Multimédia — 2025
````
