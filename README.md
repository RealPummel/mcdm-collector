# mcdm-collector

A web-based tool for collecting group inputs for **Multi-Criteria Decision Making (MCDM)** — specifically designed for cost-utility analyses.

Admins can create and manage surveys with custom criteria, publish them to respondents, and view aggregated results through a dashboard.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup & Quickstart](#setup--quickstart)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Available Services](#available-services)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

---

## Features

- **Survey builder** — create and configure multi-criteria surveys with custom questions
- **Admin dashboard** — manage surveys (create, edit, duplicate, delete, publish)
- **REST API** — FastAPI backend with auto-generated Swagger documentation

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Frontend           │──────▶│  FastAPI Backend │──────▶│  Supabase        │
│  React 19 + Vite    │       │  Python          │       │  (PostgreSQL)    │
│  Port 5173          │       │  Port 8000       │       │  hosted          │
└─────────────────────┘       └─────────────────┘       └──────────────────┘
```

---

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) & npm
- A [Supabase](https://supabase.com/) project (free tier is sufficient)

---

## Setup & Quickstart

### 1. Clone the repository

```bash
git clone https://github.com/RealPummel/mcdm-collector.git
cd mcdm-collector
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Fill in your Supabase connection details (see Environment Variables below)
```

### 3. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
fastapi dev main.py
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **http://localhost:5173**.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

| Variable       | Example                                                               | Description                        |
| -------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `DATABASE_URL` | `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` | Supabase PostgreSQL connection URL |

You can find your connection string in the Supabase dashboard under **Project Settings → Database → Connection string → URI**.

---

## API Endpoints

Full interactive API documentation is available at **http://localhost:8000/docs** (Swagger UI) once the backend is running.

---

## Available Services

| Service     | URL                        | Description                   |
| ----------- | -------------------------- | ----------------------------- |
| Backend API | http://localhost:8000      | FastAPI REST API              |
| Swagger UI  | http://localhost:8000/docs | Interactive API documentation |
| Frontend    | http://localhost:5173      | React frontend (via Vite)     |

---

## Tech Stack

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) — REST framework

**Frontend**

- [React 19](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — build tool & dev server

**Database**

- [Supabase](https://supabase.com/) — hosted PostgreSQL
