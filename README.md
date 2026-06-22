# ResumeForge Local

**ResumeForge Local** is a production-ready ATS (Applicant Tracking System) Resume Optimizer that runs entirely on your machine. No external APIs, no cloud services, no paid subscriptions.

Upload your resume, paste a job description, and get ATS compatibility scores, keyword analysis, skill gap detection, and a professionally rewritten resume — all processed locally using open-source Python NLP libraries.

![Dashboard Screenshot](docs/screenshots/dashboard.png)
![Results Screenshot](docs/screenshots/results.png)
![Optimize Screenshot](docs/screenshots/optimize.png)

> Screenshot placeholders — add your own screenshots to `docs/screenshots/` after running the app.

---

## Features

- **Resume Upload** — PDF and DOCX with automatic section parsing
- **Job Description Analysis** — Paste text or upload PDF/DOCX
- **ATS Scoring Engine** — Keyword, skill, experience, education, and formatting scores (0–100)
- **Keyword Analysis** — Found, missing, and high-priority keywords
- **Skill Gap Analysis** — Matching, missing, and recommended skills
- **Resume Rewriter** — Rule-based NLP enhancement (never fabricates content)
- **Professional Summary Generator** — Built from your existing experience
- **Project & Experience Enhancement** — Stronger action verbs and professional language
- **Live Preview** — Side-by-side original vs optimized resume
- **ATS-Safe Templates** — Software Engineer, Data Analyst, AI/ML, Full Stack, Cybersecurity, Generic
- **Export** — PDF and DOCX generation
- **Dashboard** — Scores, charts, and recommendations
- **Authentication** — Local signup/login with SQLite
- **Resume History** — Store and revisit past optimizations
- **Dark Mode** — Full light/dark theme support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| NLP | spaCy, scikit-learn, NLTK, pandas, numpy |
| Documents | PyPDF2, pdfplumber, python-docx |
| PDF Export | ReportLab |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Git** (optional)

For Docker deployment:
- **Docker** and **Docker Compose**

---

## Quick Start (Local)

### 1. Clone / Navigate to Project

```bash
cd ResumeForge-Local
```

### 2. Run Setup Script

**Windows:**
```cmd
scripts\setup.bat
```

**macOS / Linux:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Start Backend

```bash
cd backend
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend (new terminal)

```bash
cd frontend
npm run dev
```

### 5. Open App

Visit [http://localhost:5173](http://localhost:5173)

- Create an account on the signup page
- Upload your resume and paste a job description
- View ATS scores and download optimized resume

---

## Manual Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/download_nlp_models.py
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords')"
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Docker Deployment

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Health Check | http://localhost:8000/health |
| API Docs | http://localhost:8000/docs |

---

## Project Structure

```
ResumeForge-Local/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # auth, resume, export endpoints
│   │   │   ├── deps.py          # auth dependencies
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py        # settings
│   │   │   ├── database.py      # SQLite setup
│   │   │   └── security.py      # JWT + bcrypt
│   │   ├── models/              # SQLAlchemy ORM
│   │   ├── schemas/             # Pydantic models
│   │   ├── services/
│   │   │   ├── document_parser.py
│   │   │   ├── resume_parser.py
│   │   │   ├── jd_analyzer.py
│   │   │   ├── ats_scorer.py
│   │   │   ├── keyword_analyzer.py
│   │   │   ├── skill_analyzer.py
│   │   │   ├── resume_rewriter.py
│   │   │   ├── export_service.py
│   │   │   ├── nlp_engine.py
│   │   │   └── optimizer.py
│   │   ├── utils/
│   │   └── main.py
│   ├── data/                    # SQLite DB, uploads, exports
│   ├── scripts/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docker/
├── scripts/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/resume/analyze` | Upload resume + JD, optimize |
| POST | `/api/v1/resume/analyze-text` | Paste resume text + JD |
| POST | `/api/v1/resume/parse-jd` | Parse job description file |
| GET | `/api/v1/resume/history` | List past optimizations |
| GET | `/api/v1/resume/history/{id}` | Get optimization detail |
| DELETE | `/api/v1/resume/history/{id}` | Delete record |
| POST | `/api/v1/export/pdf` | Export optimized resume as PDF |
| POST | `/api/v1/export/docx` | Export optimized resume as DOCX |
| GET | `/health` | Health check |

---

## ATS Scoring

The overall ATS score (0–100) is a weighted composite:

| Component | Weight |
|-----------|--------|
| Keyword Match | 30% |
| Skill Match | 25% |
| Experience Match | 25% |
| Education Match | 10% |
| Formatting | 10% |

---

## Important: No Fabrication Policy

ResumeForge Local **never invents** experience, projects, companies, skills, certifications, achievements, or education. It only:

- Rewrites existing content with stronger language
- Reorganizes sections for ATS compatibility
- Improves keyword alignment using your real experience
- Enhances formatting for parser-friendly output

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./data/resumeforge.db
```

---

## Troubleshooting

**spaCy model not found:**
```bash
python -m spacy download en_core_web_sm
```

**NLTK data missing:**
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

**CORS errors:** Ensure backend runs on port 8000 and frontend on 5173.

**PDF extraction fails:** Try re-saving the PDF or upload as DOCX.

---

## License

MIT License — free for personal and commercial use.

---

## Screenshots

Place screenshots in `docs/screenshots/`:

- `dashboard.png` — Main dashboard with ATS scores
- `optimize.png` — Resume upload and JD input
- `results.png` — Optimization results with charts
