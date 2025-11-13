# Stitch LMS Workspace

This repository now separates the **client** (static LMS dashboard) and a minimal **server** runtime for local development or deployment.

## Repository Layout

```
.
├── client/              # All front-end HTML/CSS/JS assets
│   ├── index.html       # Landing page entry point
│   └── pages/           # Per-page layouts (instructor, student, admin, etc.)
├── server/              # Express server for serving static assets + healthcheck
│   ├── package.json
│   └── server.js
├── docs/                # Documentation (Quick Start, Project Summary, etc.)
└── README.md
```

## Getting Started

### Client
- Open `client/index.html` directly in a browser, **or**
- Serve the folder with any static server (`npx serve client`).

### Server
```
cd server
npm install
npm run dev
```
The server exposes the static client at `http://localhost:5173/` and provides a `/health` endpoint for uptime checks.

## Next Steps
- Replace the Express placeholder with your preferred backend (Nest, Fastify, etc.).
- Move shared assets (images/fonts) into `client/assets/`.
- Update the docs in `docs/` if the deployment workflow changes.

