<div align="center">

# 🚀 SynthTeX

### *The Cursor for LaTeX!*

Write LaTeX documents with AI assistance. Chat with your code, and compile to PDF—all in one place.

</div>

---

## 📹 Demo

<div align="center">

![SynthTeX Demo](assets/SynthTex-Demo.gif)

</div>

---

## ✨ Features

- 🤖 **AI-Powered Assistance** - Chat with your LaTeX code using advanced AI agents
- 🎨 **Modern Editor** - Monaco Editor with syntax highlighting and IntelliSense
- 📄 **PDF Compilation** - Compile your LaTeX documents to PDF in the cloud
- 🔄 **Live Sync** - Real-time collaboration and synchronization
- 📁 **Project Management** - Organize multiple LaTeX projects with ease
- 🔐 **Secure Authentication** - Built-in user authentication and project isolation
- ⚡ **Fast & Responsive** - Optimized for performance and speed

---

## 🛠️ Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0078D4?style=for-the-badge&logo=visual-studio-code&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-1C3C3C?style=for-the-badge&logo=sqlalchemy&logoColor=white)

### Infrastructure & Tools
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white)
![E2B](https://img.shields.io/badge/E2B-000000?style=for-the-badge&logo=e2b&logoColor=white)
![Turbo](https://img.shields.io/badge/Turbo-5C2D91?style=for-the-badge&logo=turbo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-000000?style=for-the-badge&logo=clerk&logoColor=white)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18
- **pnpm** >= 10.28.0
- **Python** >= 3.12
- **Docker** (for local development)
- **PostgreSQL** (or use Docker Compose)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SynthTeX.git
cd SynthTeX
```

### 2. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install frontend dependencies (handled by pnpm workspace)
# Install backend dependencies
cd apps/backend
uv sync

# Install compiler dependencies
cd ../compiler
uv sync
```

### 3. Environment Setup

#### Backend (.env)
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your configuration
```

#### Compiler (.env)
```bash
cd apps/compiler
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Servers

#### Using Docker Compose (Recommended)
```bash
docker-compose -f infra/docker-compose.yml up
```

#### Manual Start
```bash
# Terminal 1: Frontend
pnpm dev

# Terminal 2: Backend
cd apps/backend
uvicorn main:app --reload

# Terminal 3: Compiler Worker
cd apps/compiler
python worker.py
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
SynthTeX/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   ├── backend/           # FastAPI backend service
│   └── compiler/          # LaTeX compilation worker
├── packages/              # Shared packages
│   ├── ui/               # UI components
│   ├── typescript-config/ # TypeScript configurations
│   └── eslint-config/    # ESLint configurations
├── infra/                # Infrastructure as code
└── assets/               # Static assets
```

---

## 🏗️ Architecture

SynthTeX follows a monorepo architecture with three main services:

1. **Frontend** - Next.js application with real-time LaTeX editing and preview
2. **Backend** - FastAPI service handling authentication, project management, and AI agent interactions
3. **Compiler** - Background worker service that compiles LaTeX documents to PDF using sandboxed environments

---

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all services in development mode

# Building
pnpm build            # Build all packages and apps

# Code Quality
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier
pnpm check-types      # Type check all TypeScript projects
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [LangChain](https://www.langchain.com/) for AI agent capabilities
- Powered by [E2B](https://e2b.dev/) for secure code execution
- UI components inspired by modern design systems

---

<div align="center">

**Made with ❤️ by the SynthTeX team**

[⭐ Star us on GitHub](https://github.com/yourusername/SynthTeX) • [🐛 Report Bug](https://github.com/yourusername/SynthTeX/issues) • [💡 Request Feature](https://github.com/yourusername/SynthTeX/issues)

</div>
