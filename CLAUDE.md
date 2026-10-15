# CLAUDE.md

Machine Vision Calculator — a FastAPI + React tool for industrial machine-vision engineers. Two halves:

1. **Calculator** — a declarative knowledge base of parameters + formulas; the engine infers every derivable value from whatever the user knows, and recommends camera + lens combinations from a JSON catalog.
2. **Image-analysis modules** — upload images, get metrics: lighting calibration, image quality, geometric (intrinsic) calibration, color calibration, image comparison, plus a data-only vision-system validation module (repeatability, GR&R, AI/OCR metrics, runtime, stability).
3. **Accounts (PostgreSQL)** — register with email confirmation, JWT login, admin user management, and per-user saved calculator configurations. Guests can use every calculator/analysis module; an account is only needed to save configs.

User-facing docs (README.md) are in Vietnamese; code, comments and identifiers are in English.

## Commands

Backend (run from `backend/`; imports are relative to that dir, e.g. `from knowledge.formulas import ...`):

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 9999      # Swagger at http://localhost:9999/api/docs
pytest -q                                  # all tests (SQLite in-memory, see tests/conftest.py)
pytest tests/test_api.py -q                # API smoke tests only
MVC_TEST_DATABASE_URL=postgresql+psycopg://… pytest tests/test_auth.py   # against real Postgres (drops its tables)
```

Requires **Python ≥ 3.9** (uses `list[...]` in FastAPI signatures). Docker uses 3.12. The app needs `MVC_DATABASE_URL` (default `postgresql+psycopg://vision:vision@localhost:5432/vision`) for the account endpoints; without a reachable DB it still starts (after ~15 s of retries) and those endpoints answer 503.

Frontend (run from `frontend/`):

```bash
npm install
npm run dev                 # http://localhost:5173, proxies /api → VITE_PROXY_TARGET (default http://localhost:9999)
npx tsc --noEmit -p .       # type-check — must be clean; `npm run build` runs tsc first
npm run build
```

Everything: `docker compose up --build` — services `db` (postgres:16, volume `pgdata`), `mailpit` (dev SMTP catcher, inbox at http://localhost:8025), `backend`, `frontend`. Settings come from `.env` (template: `.env.example`); default admin `admin@vision.local` / `ChangeMe@123`.

## Architecture

### Backend (`backend/`)

```
main.py                  FastAPI app, CORS, mounts api_router at /api
app/core/config.py       Settings (pydantic-settings, env prefix MVC_): CORS, catalog dir, DB URL, JWT secret, admin bootstrap, SMTP
app/core/security.py     bcrypt hashing; JWT create/decode for "access" / "verify" / "reset" tokens
app/core/mailer.py       send_email() over SMTP; with no MVC_SMTP_HOST it logs and appends to OUTBOX (tests read links there)
app/core/errors.py       AppError(status, message, code) → {"detail": {"code", "message"}} via handler in main.py
app/db/models.py         SQLAlchemy 2 models: User, SavedConfig (JSONB on Postgres, JSON on SQLite)
app/db/session.py        engine, get_db (ensure_schema on first use), init_db (startup retries); create_all, no migrations
app/core/imaging.py      Shared image helpers: decode_image, to_gray, bit_depth, safe_kernel, downsample
app/api/router.py        _MODULES list → include_router for each endpoint module
app/api/deps.py          read_image(s), read_optional_image (→422 on bad image), service_errors(), get_current_user, require_admin
app/api/endpoints/*.py   Thin HTTP layer: validate form/JSON, decode uploads, call one service function
app/schemas/*.py         Pydantic request/response models (one file per module)
app/services/*.py        All business logic; pure functions taking numpy arrays / schemas
app/services/catalog.py  Cached loaders for catalog/cameras.json, lenses.json
app/services/auth_service.py / user_service.py / config_service.py   Accounts, admin CRUD, saved configs
knowledge/               Parameter + formula definitions (the knowledge base) and units
calculation/             engine.py (inference), graph.py (NetworkX graph for UI), validator.py
catalog/*.json           Camera / lens database
```

Request flow for image modules: endpoint → `read_images()` (OpenCV arrays, `IMREAD_UNCHANGED`, so BGR/BGRA/gray and uint8/uint16 all reach services) → `with service_errors("<label>"):` → `run_*()` service → Pydantic result. `service_errors` maps unexpected exceptions to 500 and any `client_errors=(...)` you pass to 422.

### Calculation engine

- `knowledge/parameters.py` — `PARAMETERS` dict is the single source of truth (id, unit, category, min/max, `presets`). `presets=((value, label), …)` (or `_v(…)` for unlabelled) are the common values the UI offers as quick picks; they go out via `GET /parameters`.
- `knowledge/formulas.py` — `FORMULAS` list of `_f(id, name, desc, inputs, output, expr, ...)`. `expr` is a Python expression evaluated with `SAFE_MATH` only (no builtins). SymPy derives inverse expressions for every input at import time (positive-symbol assumption).
- `calculation/engine.py` — loop ≤ 50 iterations: forward pass (all inputs known → output), inverse pass (output + other inputs known → solve for the missing input). Then conflict detection (alternative formulas disagree > 1 %), range/performance warnings, and `_find_missing` for targets.
- Forward results must be finite and ≥ 0 (except `distortion`); inverse results must be > 0. A formula that produces negatives is silently ignored.
- `priority` (lower first) decides which formula wins when several produce the same output; the others are only used for conflict checks.
- `invertible=False` on a formula skips SymPy inverses. Use it for design rules (e.g. the 3 px/feature Nyquist rule), whose backward solution would invent inputs — such as a feature size derived from the camera resolution.

**Units are fixed per parameter** and formulas convert inline: `pixel_size` μm, lengths mm, `exposure_time` μs, `speed` mm/s, `conveyor_speed` m/min, `wavelength` nm, `airy_disk` μm. Check `PARAMETERS[...].unit` before writing a formula.

### Frontend (`frontend/src/`)

```
modules.tsx              MODULES registry (label, group, accent) → left navigation rail rendered by App.tsx; visited modules stay mounted
stores/navStore.ts       Active module + deep links: openDoc(id), openScenario(id)
components/CalculatorModule/   Header toggle: guided "Theo bài toán" (Scenarios) | "Nâng cao" (FreeForm); both stay mounted
components/Scenarios/    Guided vision problems: scenarios.ts (fields, defaults, modes, checks, suggestions), PresetField (presets + "Khác…"), ResultsPanel, StepList (shared "cách tính"), sensors.ts, paramLabels.ts (Vietnamese names)
components/FreeForm/     "Nâng cao": every parameter by category, auto-calc, targets, dependency graph dialog — same 3-column layout as Scenarios
components/Recommendations/   Catalog camera + lens ranking, fed from the current calculation (used by both views)
components/Configs/      "Cấu hình đã lưu" module, SaveConfigButton (used in both calculator headers), configMeta
components/Auth/         AuthDialog (login/register/forgot), EmailLinkHandler (?verify= / ?reset= links), AccountMenu, ProfileDialog
components/Admin/        Admin-only user management (module has adminOnly: true)
components/Docs/         Knowledge base: content/*.ts articles (typed DocBlock data), DocRenderer, search; works without the backend
components/<Module>/index.tsx  One folder per analysis module: upload form + result tabs/panels
components/common/       Shared UI (HeatmapCanvas renders backend `downsample()` maps; DocsButton opens a Docs article)
utils/format.ts          formatNumber() — shared numeric display
services/http.ts         Single axios instance + getJson/postJson/postForm + errorMessage()
services/*Api.ts         One file per backend module
stores/authStore.ts      token (localStorage) + user + auth dialog state; wires the bearer token into services/http.ts
stores/configStore.ts    which saved config each calculator workspace (scenario id or "free") is linked to; pending config to open
stores/freeFormStore.ts  values + targets of the "Nâng cao" view (so guided view / saved configs can hand values over)
hooks/useParameters.ts   react-query ['parameter-groups'] + paramById
types/*.ts               Hand-written mirrors of backend Pydantic schemas
theme/theme.ts, theme/status.ts  MUI dark theme, ACCENT palette + tint(); TONE + status→colour maps for badges
```

Path alias `@/` → `src/`. New user-facing UI text (scenarios, docs, navigation) is Vietnamese; older analysis panels are still English.

## Conventions and gotchas

- **Frontend types are manual copies of `app/schemas/*.py`.** When you change a response schema, update the matching `frontend/src/types/*.ts` in the same change.
- Image helpers belong in `app/core/imaging.py`; don't re-add per-service `_to_gray`/`_downsample` copies. Maps sent to the UI go through `imaging.downsample()` (64 px default; comparison uses 32).
- Status strings are part of the API contract (`pass/warning/fail`, `excellent/good/acceptable/poor`, …). The frontend colours them via `theme/status.ts` — add new statuses there rather than hard-coding hex values.
- Show API errors with `errorMessage(err, fallback)` from `services/http.ts` (it unwraps FastAPI `detail`).
- Accounts: `get_current_user` checks the JWT *and* `tv` == `User.token_version`; bump `token_version` to sign a user out everywhere (done on password change/reset and on lock). Error codes the frontend branches on: `email_not_verified`, `email_pending`, `email_taken`, `not_authenticated` (axios interceptor logs out), `invalid_token`, `self_protect`, `last_admin`.
- `RegisterIn` / admin create use `EmailStr` (rejects `.local` etc.); login / forgot / resend use a loose pattern so intranet admin addresses still work.
- Schema changes: tables come from `Base.metadata.create_all` — it creates missing tables but never alters existing ones. Adding a column to an existing deployment needs a manual `ALTER TABLE` (or introduce Alembic).
- Per-user react-query keys (`['configs']`, `['admin-users']`) are dropped in App.tsx whenever the signed-in user changes.
- The catalog JSON is cached on first use — restart the backend after editing it.
- `requirements.txt` says FastAPI ≥ 0.110 but the code also runs on 0.109; the 204 DELETE route sets `response_class=Response, response_model=None` for that reason.

## Extending

**New parameter / formula:** add a `_p(...)` entry to `PARAMETERS` and/or an `_f(...)` entry to `FORMULAS`. No engine change needed. `tests/test_formulas.py` checks every formula references known parameters and evaluates on mock values — extend its mock dict if you add inputs.

**New guided scenario:** add an entry to `SCENARIOS` in `components/Scenarios/scenarios.ts`. Field ids must be backend parameter ids; only fields visible in the current mode are sent as inputs, so make each mode's input set non-conflicting (see `TestScenarios` in `tests/test_engine.py`). Link it to a Docs article via `docId`.

**New Docs article:** add a `DocArticle` to the relevant `components/Docs/content/*.ts` array (category must match `DOC_CATEGORIES`). Keep thresholds and formulas identical to the backend service that implements the technique; set `moduleId` / `scenarioId` to show the "open module" / "try it" buttons.

**New authenticated endpoint:** depend on `get_current_user` (or `require_admin`) and `get_db` from `app/api/deps.py` / `app/db/session.py`; raise `AppError` for client errors. Add a test to `tests/test_auth.py` (use `_verified_user(client)` for a signed-in user).

**New camera / lens:** append to `catalog/cameras.json` / `lenses.json` (fields must match `CameraOut` / `LensOut` in `app/schemas/recommendation.py`).

**New analysis module** (e.g. `focus`):
1. `app/schemas/focus.py` — result model(s).
2. `app/services/focus_service.py` — `run_focus(images: list[np.ndarray], ...) -> FocusResult`, using `app.core.imaging`.
3. `app/api/endpoints/focus.py` — `router = APIRouter(prefix="/focus", tags=["focus"])`, decode with `read_images`, wrap the call in `service_errors`.
4. Add the module to `_MODULES` in `app/api/router.py`; add a case to `tests/test_api.py`.
5. Frontend: `types/focus.ts`, `services/focusApi.ts` (use `postForm`), `components/Focus/index.tsx`, then one entry in `MODULES` (`src/modules.tsx`).
