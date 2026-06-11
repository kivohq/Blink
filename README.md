# Open Source Chat App

![Logo](file:///C:/Users/Pansilu%20Chethiya/.gemini/antigravity/brain/1521aabf-0b80-4ae7-bf36-0b3846295ca4/logo.png)

## 📖 Overview

A modern, real‑time chat application built with **React**, **Node.js**, and **WebSocket**. It showcases a clean UI, extensible architecture, and production‑ready features such as user authentication, message persistence, and a responsive design.

> **Live Demo**: _[Coming soon – hosted at https://chat.example.com]_

---

## ✨ Features

- **Real‑time messaging** with WebSocket (Socket.io)
- **User authentication** (JWT‑based) and profile management
- **Rich text & emoji support**
- **Responsive UI** – looks great on desktop and mobile
- **Threaded conversations** and **search** capability
- **Docker‑compose** setup for easy local development
- **Extensible plugin system** for bots and integrations
- **Self‑hostable** – open source license allows you to run your own instance

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| Front‑end | React 18, Vite, TailwindCSS, TypeScript |
| Back‑end | Node.js 20, Express, Socket.io, TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Authentication | JWT, bcrypt |
| Containerisation | Docker & Docker‑Compose |
| Testing | Jest, React Testing Library |

---

## 📦 Installation

### Prerequisites

- **Node.js** (>=20) and **npm**
- **Docker** & **Docker‑Compose** (optional, for containerised dev)
- **Git**

### Steps

```bash
# Clone the repo
git clone https://github.com/your-org/open-source-chat-app.git
cd open-source-chat-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env as needed (DB credentials, JWT secret, etc.)

# Run the development servers
npm run dev   # starts Vite dev server (frontend) & backend concurrently
```

If you prefer Docker:

```bash
docker-compose up --build
```

The app will be available at `http://localhost:3000`.

---

## 🚀 Usage

1. **Register** a new account or **log in** with existing credentials.
2. Start a new conversation or join an existing channel.
3. Type a message and hit **Enter** – it appears instantly for all participants.
4. Use the emoji picker (top‑right) or markdown shortcuts for formatting.
5. Access your profile to update avatar, display name, or password.

---

## 🏗️ Architecture Overview

```
frontend/       # React SPA – UI components, routing, state management
backend/        # Express API – auth, message routes, WebSocket server
src/            # Shared TypeScript types & utilities
prisma/         # DB schema + migrations
Dockerfile       # Container image for the backend
docker-compose.yml # Orchestrates frontend, backend, and DB services
```

The frontend communicates with the backend via REST for auth and with the WebSocket endpoint for live chat. Messages are persisted in PostgreSQL and broadcast using Socket.io rooms.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository.
2. Create a **feature branch**: `git checkout -b feature/awesome-feature`.
3. Make your changes and ensure tests pass: `npm test`.
4. Open a **Pull Request** with a clear description of your changes.
5. Follow the code style guidelines (Prettier + ESLint) – the CI will enforce them.

See `CONTRIBUTING.md` for detailed guidelines.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- Inspired by the classic **Slack** UI and **Discord** chat experience.
- Thanks to the open‑source community for libraries such as **Socket.io**, **Prisma**, and **TailwindCSS**.
