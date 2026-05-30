# MyBank

MyBank is a full-stack personal finance management application developed with Symfony, React, Docker and MySQL.

The application allows users to:
- create an account
- authenticate with JWT
- manage financial operations
- manage expense categories
- view a financial dashboard
- secure data according to user roles

---

# Tech Stack

## Backend
- Symfony 7
- PHP 8.3
- Doctrine ORM
- JWT Authentication
- MySQL

## Frontend
- React
- Vite
- Axios
- React Router

## DevOps
- Docker
- Docker Compose
- GitHub Actions (CI/CD)

---

# Project Structure

```txt
MyBank
│
├── backend
├── frontend
└── .github
    └── workflows
        └── ci.yml

Features
Authentication
User registration
User login
JWT authentication
Role management (ROLE_USER / ROLE_ADMIN)
Categories
Create category
Update category
Delete category
View categories
Operations
Create operation
Update operation
Delete operation
View operations
User-based operation protection
Dashboard
Balance calculation
Income calculation
Expense calculation
Recent operations
Security

The application uses JWT authentication.

Protected routes require a Bearer Token.

Security rules:

Users can only access their own operations
Only admins can manage categories
Passwords are hashed
Validation is applied on backend requests
Docker Setup
Start containers
docker compose up -d
Stop containers
docker compose down
Backend Installation

Move to backend folder:

cd backend

Install dependencies:

composer install

Run migrations:

php bin/console doctrine:migrations:migrate

Start Symfony server:

symfony server:start
Database

The project uses MySQL with Docker.

phpMyAdmin:

http://localhost:8081

Backend API:

http://localhost:8000
API Routes
Authentication
Register
POST /api/register
Login
POST /api/login_check
Categories
Get all categories
GET /api/categories
Get category by id
GET /api/categories/{id}
Create category
POST /api/categories
Update category
PUT /api/categories/{id}
Delete category
DELETE /api/categories/{id}
Operations
Get all operations
GET /api/operations
Get operation by id
GET /api/operations/{id}
Create operation
POST /api/operations
Update operation
PUT /api/operations/{id}
Delete operation
DELETE /api/operations/{id}
Dashboard
GET /api/dashboard
CI/CD

GitHub Actions automatically:

installs dependencies
starts MySQL
runs migrations
runs Symfony tests

Workflow file:

.github/workflows/ci.yml
Testing

The backend was tested with:

Postman
JWT authentication
CRUD operations
role permissions
validation tests
Author

Elodie Minkoue