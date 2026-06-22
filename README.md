# ResumeForge Local

A **100% browser-based** ATS resume optimizer. No Python, no backend, no API keys — just one command and everything runs on your machine.

Upload a resume, paste a job description, get ATS scores, keyword analysis, skill gaps, and an optimized resume. All processing happens in your browser; data is stored in `localStorage`.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

That's it. No backend to start.

---

## Features

- Resume upload (PDF, DOCX) or paste text
- Job description paste or file upload
- ATS scoring (keyword, skill, experience, education, formatting)
- Keyword & skill gap analysis
- Rule-based resume rewriting (never fabricates content)
- PDF & DOCX export
- Resume history (saved in browser)
- Local login/signup (stored in browser)
- Dark / light mode

---

## Deploy to Vercel

Because there is **no backend**, the frontend can be deployed to Vercel:

```bash
cd frontend
npm run build
```

Or connect the `frontend` folder to Vercel — set build command to `npm run build` and output directory to `dist`.

---

## Project Structure

```
ResumeForge-Local/
└── frontend/
    ├── src/
    │   ├── engine/       # All ATS logic (runs in browser)
    │   ├── services/     # localStorage auth & history
    │   ├── pages/
    │   └── components/
    └── package.json
```

The `backend/` folder is **legacy** from an earlier version and is no longer required.

---

## Data & Privacy

- Accounts and resume history are stored in your browser's **localStorage**
- Nothing is sent to any server
- Clearing browser data will remove your account and history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React, Vite, Tailwind CSS |
| PDF read | pdf.js |
| DOCX read | mammoth |
| PDF export | jsPDF |
| DOCX export | docx |
| Storage | localStorage |

---

## License

MIT
