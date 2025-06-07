# 🖥️ PC Builder

A full-stack application that allows users to select PC components and visualize their custom PC builds. The app combines a **Python/FastAPI backend** with a **React/TypeScript frontend**, offering both performance and modern UI design.

## 🌟 Features

- Component selection from CPU, GPU, RAM, Motherboard, Storage, etc.
- Real-time visualization of selected build.
- Smart search & filtering using AI-powered embeddings.
- Validation and type safety using Zod and Pydantic.
- Responsive and sleek UI built with Tailwind CSS and Radix UI.

## 🔧 Technologies Used

### Backend

| Tech                  | Description                          |
|-----------------------|--------------------------------------|
| Python                | Core language                        |
| FastAPI               | Modern web framework for APIs        |
| Pydantic              | Data validation                      |
| Pandas                | Data manipulation                    |
| LangChain             | For future AI integrations           |
| ChromaDB              | Vector database for smart search     |
| Sentence Transformers | Embedding generation                 |
| python-dotenv         | Environment variables management     |

### Frontend

| Tech         | Description                  |
|--------------|-----------------------------|
| React        | UI library                  |
| TypeScript   | Type-safe JavaScript        |
| Vite         | Lightning-fast bundler      |
| Tailwind CSS | Utility-first styling       |
| Radix UI     | Accessible UI components    |
| Zod          | Schema validation           |

## 📁 Project Structure

```
pc-builder/
├── backend/        # FastAPI backend
│   ├── app/          # Application code
│   ├── models/       # Database models
│   ├── schemas/      # Pydantic schemas
│   └── requirements.txt
│
└── frontend/       # React + TypeScript frontend
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── hooks/       # Custom hooks
    │   ├── lib/         # Utilities and helpers
    │   └── pages/       # Page components
    │
    ├── public/       # Static assets
    ├── index.html
    └── package.json
```

## 🛠️ Setup Instructions

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and update environment variables as needed.

5. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The app should now be running at [http://localhost:5173](http://localhost:5173).
