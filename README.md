# 🎓 Faculty Analytics & Accreditation Dashboard

An enterprise-grade, full-stack web application designed for higher education institutions to monitor faculty research output, automate accreditation metrics (NAAC / NBA / NIRF), generate standardized academic resumes, compute annual performance appraisals (PBAS / CAS), and foster interdisciplinary research collaboration.

---

## 🌟 Key Features

### 1. 🎓 Academic Integrations & Automation
- **Standardized Academic CV Generator:** 1-click export to **PDF / Print** and **Word (.doc)** formatted according to **AICTE**, **UGC CAS**, and **IEEE Academic** standards.
- **Live DOI & ORCID Auto-Sync:** Automated metadata retrieval from CrossRef API for research papers (Title, Journal, ISSN/ISBN, Authors, Indexing).
- **Smart Certificate OCR Parser:** Automated extraction of course titles, organizers, categories, dates, and durations from training certificates and proofs.

### 2. 🏛️ Accreditation & Institutional Intelligence
- **Annual PBAS / CAS Promotion Scorecard:** Automated calculation of UGC Category I (Teaching), Category II (Governance & FDPs), and Category III (Research API Points) with Career Advancement Scheme readiness tracking.
- **Department Radar & Hierarchy Benchmarks:** Multi-pillar radar comparison across Engineering departments (CSE, ECE, MECH, IT, EEE, CIVIL) in publications, grants, patents, and consultancies.
- **NAAC / NBA SSR Predictor:** Quantitative metric calculation engine for NAAC Criterion 2 & 3.

### 3. 🛡️ Security, Governance & Audit Trail
- **Activity Audit Logging:** Timestamped audit trail tracking data uploads, verifications, role assignments, and batch imports.
- **Granular RBAC:** Role-based access control distinguishing Faculty, HOD, IQAC Coordinator, Dean, and Super Admin.

### 4. ⚡ UI/UX, Productivity & Collaboration
- **Global Command Palette (`Ctrl + K` / `Cmd + K`):** Fast search and navigation across all modules and quick actions.
- **Research Collaboration Network Graph:** Interactive force-directed canvas visualizing institutional co-authorships, citation hubs, and research clusters.
- **Real-Time Notification Center:** Notification drawer with filters for document approvals, accreditation deadlines, and grant alerts.
- **Batch Data Management:** Pre-formatted Excel/CSV template download and batch data ingestion.

---

## 🏗️ Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, Chart.js, Recharts, Lucide Icons
- **Backend:** Python 3.12+, Django 5+, Django REST Framework (DRF), SimpleJWT
- **Database:** SQLite3 / PostgreSQL compatible

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend will start on `http://127.0.0.1:8000/`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5174/` (or `http://localhost:5173/`).

---

## 🧪 Running Automated Tests

```bash
cd backend
python manage.py test faculty_data
```