# Qdrant Vector Store — Image Similarity Search

Full-stack application for image similarity search using Qdrant vector database and CLIP embeddings.

## Architecture

- **Backend**: NestJS (TypeScript)
- **Frontend**: React + Vite + TailwindCSS
- **Vector DB**: Qdrant
- **Embeddings**: CLIP ViT-B/32 via Transformers.js (512-dim)
- **Image Storage**: Local filesystem

## How Qdrant Works — System Diagram

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                                                                  │
│   ┌─────────────┐                    ┌─────────────────┐         │
│   │ Upload Page  │                    │  Search Page     │        │
│   │ (Index Image)│                    │ (Find Similar)   │        │
│   └──────┬──────┘                    └────────┬────────┘         │
└──────────┼────────────────────────────────────┼──────────────────┘
           │ POST /api/v1/images/index          │ POST /api/v1/images/search
           ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Images Controller                         │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                      │
│          ┌────────────────┼───────────────────┐                  │
│          ▼                ▼                   ▼                  │
│  ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐        │
│  │ Local Storage │ │ CLIP Model   │  │ Image Vector     │        │
│  │ Service       │ │ (Embedding)  │  │ Repository       │        │
│  │              │ │              │  │                  │        │
│  │ Save image   │ │ Image → 512  │  │ Qdrant upsert / │        │
│  │ to disk      │ │ dim vector   │  │ search / delete  │        │
│  └──────┬───────┘ └──────┬───────┘  └────────┬─────────┘        │
│         │                │                   │                  │
│         ▼                │                   ▼                  │
│  ┌──────────────┐        │          ┌──────────────────┐        │
│  │ ./uploads/   │        │          │ Qdrant Client    │        │
│  │ (filesystem) │        │          │ Service          │        │
│  └──────────────┘        │          └────────┬─────────┘        │
│                          │                   │                  │
└──────────────────────────┼───────────────────┼──────────────────┘
                           │                   │
                           │                   ▼
                           │          ┌──────────────────┐
                           │          │   Qdrant DB      │
                           │          │   (Docker)       │
                           │          │   Port 6333      │
                           │          └──────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Hugging Face    │
                  │  Transformers.js │
                  │  CLIP ViT-B/32   │
                  └──────────────────┘
```

### Image Indexing Flow

```
  Image Upload                CLIP Embedding              Qdrant Storage
  ───────────                 ──────────────              ──────────────
       │                           │                           │
  1. Validate image           3. Resize to                5. Upsert point:
     (type, size)                224×224 px                   id: uuid
       │                           │                          vector: [512 floats]
  2. Save to                  4. Run through                  payload: {
     ./uploads/{uuid}.jpg        CLIP vision model              business_id,
       │                           │                              category,
       │                      Output: 512-dim                     image_url,
       │                      normalized vector                   filename,
       │                           │                              created_at
       │                           │                            }
       ▼                           ▼                           ▼
  ┌──────────┐            ┌──────────────┐           ┌──────────────┐
  │ uploads/ │            │ [0.02, -0.1, │           │  Qdrant      │
  │ {uuid}   │            │  0.05, ...]  │           │  Collection: │
  │ .jpg     │            │  (512 dims)  │           │  image_      │
  └──────────┘            └──────────────┘           │  vectors     │
                                                     └──────────────┘
```

### Similarity Search Flow

```
  Query Image               Embedding                Search & Filter
  ───────────               ─────────                ───────────────
       │                        │                          │
  1. Upload query          2. Generate 512-dim        3. Qdrant cosine
     image                    CLIP vector                similarity search
       │                        │                          │
       │                        │                     4. Filter by:
       │                        │                        - business_id (required)
       │                        │                        - category (optional)
       │                        │                        - status (optional)
       │                        │                          │
       ▼                        ▼                     5. Return top-K
                                                         results with scores
                                                          │
                                                          ▼
                                                    ┌────────────────┐
                                                    │ Results:       │
                                                    │ [{             │
                                                    │   imageId,     │
                                                    │   score: 0.95, │
                                                    │   imageUrl,    │
                                                    │   category     │
                                                    │ }, ...]        │
                                                    └────────────────┘
```

### How Qdrant Stores and Searches Vectors

```
  Qdrant Collection: "image_vectors"
  ═══════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │  Point 1                                                │
  │  id: "a1b2c3d4-..."                                     │
  │  vector: [0.02, -0.11, 0.05, ..., 0.08]  (512 dims)   │
  │  payload: { business_id: "biz_001",                     │
  │             category: "product",                        │
  │             image_url: "/uploads/a1b2c3d4-....jpg" }    │
  ├─────────────────────────────────────────────────────────┤
  │  Point 2                                                │
  │  id: "e5f6g7h8-..."                                     │
  │  vector: [0.15, 0.03, -0.07, ..., -0.12]  (512 dims)  │
  │  payload: { business_id: "biz_001",                     │
  │             category: "logo",                           │
  │             image_url: "/uploads/e5f6g7h8-....png" }    │
  ├─────────────────────────────────────────────────────────┤
  │  Point N ...                                            │
  └─────────────────────────────────────────────────────────┘

  Search: cosine_similarity(query_vector, point.vector)
  ═══════════════════════════════════════════════════════
  Query vector ──►  Compare against ALL points  ──►  Rank by score
                    (with payload filters)           Return top-K
```

## Embedding Dimension — Why 512?

Each image is converted into a **512-dimensional vector** (an array of 512 floating-point numbers) by the CLIP ViT-B/32 model. This is what makes similarity search possible.

### What is an Embedding?

An embedding is a numeric representation of an image's visual content. Instead of comparing raw pixels, we compare these compact vectors — images that look similar will have vectors that point in similar directions.

```
  Original Image (any size)
         │
         ▼
  ┌─────────────────────────────┐
  │  1. Resize to 224×224 px    │   CLIP expects a fixed input size.
  │  2. Convert to RGB pixels   │   Remove alpha channel, normalize.
  │  3. Feed into CLIP Vision   │   ViT-B/32 transformer encoder.
  │  4. Extract projection      │   Get the image_embeds output.
  │  5. L2-normalize            │   Unit vector (length = 1.0).
  └─────────────────────────────┘
         │
         ▼
  [0.021, -0.108, 0.053, 0.014, ..., -0.031]
   ──────────────────────────────────────────
              512 float values

  Why 512?
  ────────
  • The CLIP ViT-B/32 architecture has a projection head that outputs
    exactly 512 dimensions. This is a fixed property of the model.
  • Smaller models (e.g. ViT-S) → 384 dims.
  • Larger models (e.g. ViT-L/14) → 768 dims.
  • We use ViT-B/32 for the best balance of speed vs. accuracy.
```

### How Cosine Similarity Works with 512-D Vectors

```
  Image A vector:  [0.02, -0.11, 0.05, ..., 0.08]   (512 values)
  Image B vector:  [0.03, -0.10, 0.04, ..., 0.07]   (512 values)

                          A · B
  cosine_sim(A, B) = ─────────────
                      ‖A‖ × ‖B‖

  Since vectors are L2-normalized (‖A‖ = ‖B‖ = 1), this simplifies to:

  cosine_sim(A, B) = A · B = Σ(Aᵢ × Bᵢ) for i = 1..512

  Score range:
  ┌──────────────────────────────────────────────────┐
  │  1.0  = identical images (vectors point same way) │
  │  0.7+ = very similar (same object, diff angle)    │
  │  0.5  = somewhat related                          │
  │  0.0  = completely unrelated                       │
  └──────────────────────────────────────────────────┘
```

## Payload Indexing — Fast Filtered Search

Qdrant doesn't just store vectors — each vector has a **payload** (metadata). We create **payload indexes** so Qdrant can filter results without scanning every point.

### What Gets Indexed

When the collection is created, we define keyword indexes on these fields:

```
  Payload Indexes (created on startup)
  ═════════════════════════════════════

  Field            Type       Purpose
  ─────            ────       ───────
  business_id      keyword    Tenant isolation — every query MUST
                              filter by business_id so users only
                              see their own images.

  owner_id         keyword    Filter images by who uploaded them.

  category         keyword    Group images: "product", "logo",
                              "banner", etc.

  status           keyword    Lifecycle: "active", "archived",
                              "deleted". Default: "active".

  created_at       datetime   Sort or filter by upload date.
```

### How Indexed vs. Non-Indexed Search Differs

```
  WITHOUT payload index (slow):
  ┌────────────────────────────────────────────────────┐
  │  1. Compute cosine similarity for ALL points       │
  │  2. Get top-1000 candidates                        │
  │  3. Check payload of each candidate one by one     │  ← full scan
  │  4. Keep only those matching business_id            │
  │  5. Return top-K                                   │
  └────────────────────────────────────────────────────┘

  WITH payload index (fast):                              ← what we use
  ┌────────────────────────────────────────────────────┐
  │  1. Use business_id index to get point IDs         │  ← index lookup
  │  2. Compute cosine similarity ONLY for those       │  ← skip irrelevant
  │  3. Rank by score                                  │
  │  4. Return top-K                                   │
  └────────────────────────────────────────────────────┘

  Example query filter sent to Qdrant:
  {
    "must": [
      { "key": "business_id", "match": { "value": "biz_001" } },
      { "key": "category",    "match": { "value": "product" } }
    ]
  }
```

### Complete Lifecycle of a Stored Point

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Point in Qdrant Collection "image_vectors"                      │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  id:      "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  (UUID)       │
  │                                                                  │
  │  vector:  [0.021, -0.108, 0.053, ..., -0.031]     (512 floats) │
  │           ↑                                                      │
  │           Generated by CLIP ViT-B/32 from the image pixels.     │
  │           Normalized to unit length for cosine distance.         │
  │                                                                  │
  │  payload: {                                                      │
  │    "image_id":     "a1b2c3d4-...",      ← same as point id     │
  │    "business_id":  "biz_001",           ← INDEXED (keyword)    │
  │    "owner_id":     "user_042",          ← INDEXED (keyword)    │
  │    "category":     "product",           ← INDEXED (keyword)    │
  │    "status":       "active",            ← INDEXED (keyword)    │
  │    "image_url":    "/uploads/a1b2...jpg",                       │
  │    "filename":     "red-chair.jpg",                             │
  │    "content_type": "image/jpeg",                                │
  │    "created_at":   "2026-05-04T06:17:50.123Z" ← INDEXED (dt)  │
  │  }                                                              │
  └──────────────────────────────────────────────────────────────────┘
```

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
