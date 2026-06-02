# 🏦 MyBank — Personal Expense Manager

MyBank is a full-stack personal finance management application developed with Symfony, React, Docker and MySQL. It allows users to track their expenses and income, organize them by custom categories, and visualize their financial statistics in real time.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router DOM, Axios |
| Backend | Symfony 7, PHP 8.3, Doctrine ORM |
| Database | MySQL 8.0 |
| Authentication | JWT (LexikJWTAuthenticationBundle) |
| Containerization | Docker & Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Vitest (Frontend), PHPUnit (Backend) |

---

## 📋 Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) v20+
- [PHP](https://www.php.net/) 8.3+
- [Composer](https://getcomposer.org/)
- [Symfony CLI](https://symfony.com/download)

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Melodie2001/MyBank.git
cd MyBank
```

### 2. Start the database with Docker
```bash
docker-compose up -d database
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

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The application is now available at **http://localhost:5173**

---

## 🐳 Docker Setup (Full)

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
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| phpMyAdmin | http://localhost:8081 |
| MySQL | localhost:3307 |

---

## 📁 Project Structure

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
├── frontend/                # React application
│   ├── src/
│   │   ├── api/             # Axios configuration
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Page layouts
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   └── test/            # Unit tests
│   └── public/
│
├── .github/
│   └── workflows/
│       └── ci.yaml          # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## 🌐 Features

- ✅ JWT Authentication (Login / Register)
- ✅ User approval system (pending / active / rejected)
- ✅ Dashboard with balance, income and expenses statistics
- ✅ Operations management (CRUD)
- ✅ Categories management with custom icon and color
- ✅ Admin panel with user management
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Unit tests (Vitest + PHPUnit)
- ✅ CI/CD with GitHub Actions
- ✅ Containerized with Docker

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| `ROLE_USER` | Manage own operations and categories, view dashboard |
| `ROLE_ADMIN` | Manage all users, validate registrations, view all operations |

---

## 🔐 API Endpoints

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
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/{id}` | Update a category |
| DELETE | `/api/categories/{id}` | Delete a category |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (admin only) |
| PUT | `/api/users/{id}/status` | Update user status (admin only) |
| DELETE | `/api/users/{id}` | Delete a user (admin only) |

---

## 🧪 Running Tests

### Frontend tests (Vitest)
```bash
cd frontend
npm run test:run
```

### Backend tests (PHPUnit)
```bash
cd backend
php bin/phpunit
```

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration. On every push to `main`:

1. **Backend CI** — Installs dependencies, runs migrations, executes PHPUnit tests
2. **Frontend CI** — Installs dependencies, runs Vitest tests, builds the application

---

## 🔒 Security

- JWT authentication protects all API routes
- Users can only access their own operations
- Passwords are hashed with Symfony's password hasher
- New accounts require admin approval before access
- Role-based access control (ROLE_USER / ROLE_ADMIN)

---

## 👩‍💻 Author

**Elodie MINKOUE**
CDA 3ème année — L'École Multimédia — 2025