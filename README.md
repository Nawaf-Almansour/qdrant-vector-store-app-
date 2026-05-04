# Qdrant Vector Store — Image Similarity Search

Full-stack application for image similarity search using Qdrant vector database and CLIP embeddings.

## Architecture

- **Backend**: NestJS (TypeScript)
- **Frontend**: React + Vite + TailwindCSS
- **Vector DB**: Qdrant
- **Embeddings**: CLIP ViT-B/32 via Transformers.js (512-dim)
- **Image Storage**: Local filesystem

## Quick Start

### 1. Start Qdrant

```bash
docker-compose up -d
```

### 2. Start Backend

```bash
cd backend
cp ../.env.example ../.env
npm install
npm run start:dev
```

Backend runs on `http://localhost:3000`. Swagger docs at `http://localhost:3000/api`.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/images/index` | Upload and index an image |
| POST | `/api/v1/images/search` | Search similar images |
| DELETE | `/api/v1/images/:imageId/vector` | Delete an image vector |

## Environment Variables

See `.env.example` for all configuration options.
# qdrant-vector-store-app-
