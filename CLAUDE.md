# CLAUDE.md

Machine Vision Calculator — a FastAPI + React tool for industrial machine-vision engineers. Two halves:

1. **Calculator** — a declarative knowledge base of parameters + formulas; the engine infers every derivable value from whatever the user knows, and recommends camera + lens combinations from a JSON catalog.
2. **Image-analysis modules** — upload images, get metrics: lighting calibration, image quality, geometric (intrinsic) calibration, color calibration, image comparison, plus a data-only vision-system validation module (repeatability, GR&R, AI/OCR metrics, runtime, stability).

User-facing docs (README.md) are in Vietnamese; code, comments and identifiers are in English.

## Commands

Backend (run from `backend/`; imports are relative to that dir, e.g. `from knowledge.formulas import ...`):

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 9999      # Swagger at http://localhost:9999/api/docs
pytest -q                                  # all tests
pytest tests/test_api.py -q                # API smoke tests only
```

Requires **Python ≥ 3.9** (uses `list[...]` in FastAPI signatures). On this machine the base conda env is 3.8 and cannot import the app; the `vision_inspection` conda env (3.9, FastAPI 0.109) works. Docker uses 3.12.

Frontend (run from `frontend/`):

```bash
npm install
npm run dev                 # http://localhost:5173, proxies /api → VITE_PROXY_TARGET (default http://localhost:9999)
npx tsc --noEmit -p .       # type-check — must be clean; `npm run build` runs tsc first
npm run build
```

Everything: `docker compose up --build` (compose sets `VITE_PROXY_TARGET=http://backend:9999`).

## Architecture

### Backend (`backend/`)

```
main.py                  FastAPI app, CORS, mounts api_router at /api
app/core/config.py       Settings (pydantic-settings, env prefix MVC_): CORS, catalog dir, version
app/core/imaging.py      Shared image helpers: decode_image, to_gray, bit_depth, safe_kernel, downsample
app/api/router.py        _MODULES list → include_router for each endpoint module
app/api/deps.py          read_image(s), read_optional_image (→422 on bad image), service_errors() context manager
app/api/endpoints/*.py   Thin HTTP layer: validate form/JSON, decode uploads, call one service function
app/schemas/*.py         Pydantic request/response models (one file per module)
app/services/*.py        All business logic; pure functions taking numpy arrays / schemas
app/services/catalog.py  Cached loaders for catalog/cameras.json, lenses.json
knowledge/               Parameter + formula definitions (the knowledge base) and units
calculation/             engine.py (inference), graph.py (NetworkX graph for UI), validator.py
catalog/*.json           Camera / lens database
```

Request flow for image modules: endpoint → `read_images()` (OpenCV arrays, `IMREAD_UNCHANGED`, so BGR/BGRA/gray and uint8/uint16 all reach services) → `with service_errors("<label>"):` → `run_*()` service → Pydantic result. `service_errors` maps unexpected exceptions to 500 and any `client_errors=(...)` you pass to 422.

### Calculation engine

- `knowledge/parameters.py` — `PARAMETERS` dict is the single source of truth (id, unit, category, min/max).
- `knowledge/formulas.py` — `FORMULAS` list of `_f(id, name, desc, inputs, output, expr, ...)`. `expr` is a Python expression evaluated with `SAFE_MATH` only (no builtins). SymPy derives inverse expressions for every input at import time (positive-symbol assumption).
- `calculation/engine.py` — loop ≤ 50 iterations: forward pass (all inputs known → output), inverse pass (output + other inputs known → solve for the missing input). Then conflict detection (alternative formulas disagree > 1 %), range/performance warnings, and `_find_missing` for targets.
- Forward results must be finite and ≥ 0 (except `distortion`); inverse results must be > 0. A formula that produces negatives is silently ignored.
- `priority` (lower first) decides which formula wins when several produce the same output; the others are only used for conflict checks.

**Units are fixed per parameter** and formulas convert inline: `pixel_size` μm, lengths mm, `exposure_time` μs, `speed` mm/s, `conveyor_speed` m/min, `wavelength` nm, `airy_disk` μm. Check `PARAMETERS[...].unit` before writing a formula.

### Frontend (`frontend/src/`)

```
modules.tsx              MODULES registry → top-level tabs rendered by App.tsx
components/CalculatorModule/   Calculator layout (Toolbar | ParameterPanel | WorkspacePanel | DetailsPanel | LogPanel)
components/<Module>/index.tsx  One folder per analysis module: upload form + result tabs/panels
components/common/       Shared UI (HeatmapCanvas renders backend `downsample()` maps)
services/http.ts         Single axios instance + getJson/postJson/postForm + errorMessage()
services/*Api.ts         One file per backend module
stores/calculationStore.ts  Zustand (+immer) store for the calculator only; analysis modules use local state / react-query useMutation
types/*.ts               Hand-written mirrors of backend Pydantic schemas
theme/theme.ts, theme/status.ts  MUI dark theme; TONE + status→colour maps for badges
```

Path alias `@/` → `src/`.

## Conventions and gotchas

- **Frontend types are manual copies of `app/schemas/*.py`.** When you change a response schema, update the matching `frontend/src/types/*.ts` in the same change.
- Image helpers belong in `app/core/imaging.py`; don't re-add per-service `_to_gray`/`_downsample` copies. Maps sent to the UI go through `imaging.downsample()` (64 px default; comparison uses 32).
- Status strings are part of the API contract (`pass/warning/fail`, `excellent/good/acceptable/poor`, …). The frontend colours them via `theme/status.ts` — add new statuses there rather than hard-coding hex values.
- Show API errors with `errorMessage(err, fallback)` from `services/http.ts` (it unwraps FastAPI `detail`).
- Projects are stored in memory (`InMemoryProjectRepository`) and vanish on restart; endpoints get the store via `Depends(get_project_repository)`.
- The catalog JSON is cached on first use — restart the backend after editing it.
- `requirements.txt` says FastAPI ≥ 0.110 but the code also runs on 0.109; the 204 DELETE route sets `response_class=Response, response_model=None` for that reason.

## Extending

**New parameter / formula:** add a `_p(...)` entry to `PARAMETERS` and/or an `_f(...)` entry to `FORMULAS`. No engine change needed. `tests/test_formulas.py` checks every formula references known parameters and evaluates on mock values — extend its mock dict if you add inputs.

**New camera / lens:** append to `catalog/cameras.json` / `lenses.json` (fields must match `CameraOut` / `LensOut` in `app/schemas/recommendation.py`).

**New analysis module** (e.g. `focus`):
1. `app/schemas/focus.py` — result model(s).
2. `app/services/focus_service.py` — `run_focus(images: list[np.ndarray], ...) -> FocusResult`, using `app.core.imaging`.
3. `app/api/endpoints/focus.py` — `router = APIRouter(prefix="/focus", tags=["focus"])`, decode with `read_images`, wrap the call in `service_errors`.
4. Add the module to `_MODULES` in `app/api/router.py`; add a case to `tests/test_api.py`.
5. Frontend: `types/focus.ts`, `services/focusApi.ts` (use `postForm`), `components/Focus/index.tsx`, then one entry in `MODULES` (`src/modules.tsx`).
