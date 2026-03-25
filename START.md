# How to Run This Project

## Prerequisites
- Node.js installed
- PostgreSQL running locally
- `.env` file configured (copy from `.env.example` and fill in your DB details)

---

## Step 1 — Install dependencies

Open a terminal in the project root (`C:\Users\admin\ToDO`) and run:

```
npm install
cd frontend
npm install
cd ..
```

---

## Step 2 — Setup the database (first time only)

```
npx ts-node src/utils/initDb.ts init
```

To also add sample users/data:

```
npx ts-node src/utils/seed.ts
```

---

## Step 3 — Start the backend

Open **Terminal 1** and run:

```
npx ts-node src/index.ts
```

Runs on: http://localhost:3001

---

## Step 4 — Start the frontend

Open **Terminal 2** and run:

```
cd frontend
npm start
```

Opens automatically at: http://localhost:3000

---

## Login Credentials

| Role     | Username  | Password    |
|----------|-----------|-------------|
| Manager  | manager1  | password123 |
| Employee | employee1 | password123 |

---

## .env must have these values

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
JWT_SECRET=any_random_secret
PORT=3001
```
