# Machine Vision Calculator

A web application for managing **Camera**, **Lens**, **Object** and computing Machine Vision parameters.  
Built with **FastAPI + Jinja2 + Bootstrap 5**. All data stored in plain **JSON** files — no database required.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy env template
cp .env.example .env

# 3. Run
python run.py
```

Open [http://localhost:8000](http://localhost:8000)

---

## Docker

```bash
docker-compose up --build
```

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Backend      | Python 3.12, FastAPI, Pydantic v2   |
| Data         | JSON files via Pandas-free storage  |
| Frontend     | Jinja2, Bootstrap 5, Vanilla JS     |
| Tests        | pytest                              |
| Container    | Docker + docker-compose             |

---

## Features

- **Camera** management (full sensor specs, capture params)
- **Lens** management (optics, MTF, telecentric support)
- **Object** management (size, motion, inspection requirements)
- **Vision Setup** — combine Camera + Lens + Object and **Calculate** all parameters in one click
- 10 built-in calculators (FoV, DoF, Motion Blur, Resolution, Diffraction, Nyquist, Sensor DR, Brightness, Lens Matching, Pixel Density)
- Suitability scores (Lens, Camera, Overall)
- Swagger UI at `/api/docs`

---

## Running Tests

```bash
pytest tests/ -v
```
