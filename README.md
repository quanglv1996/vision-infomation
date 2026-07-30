# Machine Vision Calculator

An **Engineering Knowledge System** for machine vision parameter calculation.

Enter any known parameters — the engine automatically infers all derivable values, identifies
missing inputs, and recommends suitable camera + lens combinations.

---

## Architecture

```
Frontend (React + TypeScript + Vite + MUI)
  └─ REST API (FastAPI)
       └─ Calculation Engine (forward + inverse chaining)
            └─ Formula Library (SymPy auto-inversion)
                 └─ Parameter Graph (NetworkX)
                      └─ Camera / Lens Catalog (JSON)
```

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend

# Create package.json first if not present (content below)
npm install
npm run dev
# UI: http://localhost:5173
```

**frontend/package.json** (create this file):
```json
{
  "name": "machine-vision-calculator-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.14",
    "@mui/material": "^5.15.14",
    "@tanstack/react-query": "^5.29.0",
    "axios": "^1.6.8",
    "immer": "^10.0.4",
    "notistack": "^3.0.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.51.2",
    "react-resizable-panels": "^2.0.17",
    "reactflow": "^11.11.3",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.3.1",
    "@typescript-eslint/parser": "^7.3.1",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.2",
    "vite": "^5.2.6"
  }
}
```

### Docker Compose (both services together)

```bash
docker compose up --build
```

---

## Project Structure

```
vision-information/
├── backend/
│   ├── knowledge/
│   │   ├── parameters.py      ← All parameter definitions (single source of truth)
│   │   ├── formulas.py        ← All formulas + SymPy auto-inversion
│   │   └── units.py           ← Unit conversion system
│   ├── calculation/
│   │   ├── engine.py          ← Forward + inverse chaining engine
│   │   ├── graph.py           ← NetworkX dependency graph
│   │   └── validator.py       ← Input validation
│   ├── app/
│   │   ├── api/endpoints/     ← FastAPI endpoints
│   │   ├── schemas/           ← Pydantic request/response models
│   │   └── services/          ← Service layer
│   ├── catalog/
│   │   ├── cameras.json       ← Camera database (10 cameras)
│   │   └── lenses.json        ← Lens database (13 lenses)
│   ├── tests/                 ← pytest test suite
│   └── main.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Toolbar/        ← Top action bar
        │   ├── ParameterPanel/ ← Left category tree
        │   ├── WorkspacePanel/ ← Center: cards + graph + recommendations
        │   ├── DetailsPanel/   ← Right: formula explainer
        │   └── LogPanel/       ← Bottom: calculation log
        ├── stores/             ← Zustand state management
        ├── services/api.ts     ← Axios API client
        └── types/index.ts      ← TypeScript type definitions
```

---

## How the Calculation Engine Works

The engine is **purely declarative** — no hard-coded if/else logic.

1. **Formula Library** — each formula specifies `inputs → output + expression`.
2. **SymPy Auto-Inversion** — at startup, SymPy derives inverse expressions for every formula
   (e.g. from `sensor_width = resolution_x × pixel_size / 1000`, it derives
   `pixel_size = sensor_width × 1000 / resolution_x`).
3. **Forward Chaining** — iterates over formulas; applies any formula whose inputs are all known.
4. **Inverse Chaining** — if an output is known but one input is missing, solves for the unknown input.
5. **Repeats** until stable (≤ 50 iterations — always terminates).
6. **Conflict Detection** — warns when two different formulas produce inconsistent values.
7. **Missing Analysis** — for any target parameter, reports the minimal set of inputs still needed.

### Example

Given:
```json
{ "resolution_x": 2448, "pixel_size": 3.45, "focal_length": 50, "working_distance": 500 }
```

Engine automatically computes:
- `sensor_width` = 2448 × 3.45 / 1000 = **8.45 mm**
- `magnification` = 50 / (500 − 50) = **0.111**
- `fov_x` = 8.45 / 0.111 = **76.1 mm**
- `mm_per_pixel` = 76.1 / 2448 = **0.031 mm/pixel**
- `pixel_per_mm` = 1 / 0.031 = **32.2 px/mm**
- `detectable_feature` = 0.031 × 3 = **0.093 mm** (Nyquist)
- `repeatability` ≈ **0.003 mm** (sub-pixel estimate)
- ... and more

---

## Extending the System

### Add a new parameter

Edit `backend/knowledge/parameters.py` — add one entry to `PARAMETERS`.

### Add a new formula

Edit `backend/knowledge/formulas.py` — add one `_f(...)` entry to `FORMULAS`.
The engine picks it up automatically. SymPy derives the inverse at startup.

### Add cameras / lenses

Edit `backend/catalog/cameras.json` or `lenses.json`.

**No changes to the calculation engine are ever needed.**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/calculate` | Run full inference from known values |
| POST | `/api/calculate/analyze` | Reachability analysis + graph data |
| GET | `/api/parameters` | List all parameter definitions |
| GET | `/api/formulas` | List all formula definitions |
| POST | `/api/recommend` | Camera + lens recommendations |
| POST | `/api/projects` | Save project |
| GET | `/api/projects/{id}` | Load project |

Interactive docs: **http://localhost:8000/api/docs**

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Implemented Parameter Categories

| Category | Parameters |
|----------|-----------|
| Camera | Resolution X/Y, Pixel Size, Sensor Width/Height/Diagonal, FPS, Bit Depth |
| Lens | Focal Length, Magnification, Working Distance, F-Number, NA, Distortion, Image Circle |
| Object | Width, Height, Thickness, Smallest Feature, Required Accuracy |
| Motion | Speed, Exposure Time, Motion Blur, Blur (px), Conveyor Speed, Encoder Resolution |
| Imaging | FOV X/Y, mm/pixel, pixel/mm, Pixels per Feature, Pixels per Object |
| Optics | DOF, Hyperfocal Distance, Airy Disk, Diffraction Limit |
| Lighting | Wavelength |
| Inspection | Repeatability, Measurement Error, Detectable Feature |

---

## Formula Library (28 formulas)

All with SymPy-derived inverses — total coverage: ~60 relationships.

Key formulas:
- `sensor_width = resolution_x × pixel_size / 1000`
- `magnification = focal_length / (working_distance − focal_length)`
- `fov_x = sensor_width / magnification`
- `mm_per_pixel = fov_x / resolution_x`
- `motion_blur = speed × exposure_time × 1e−6`
- `dof = 2 × f_number × (pixel_size/1000) × (1+M) / M²`
- `airy_disk = 2.44 × f_number × λ / 1000`
- `detectable_feature = mm_per_pixel × 3`  (Nyquist)
