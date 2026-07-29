# Project Structure

```
vision-infomation/
│
├── run.py                        # Entry point: python run.py
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
│
├── backend/
│   └── app/
│       ├── main.py               # FastAPI app, mounts static/templates
│       ├── config.py             # Settings (pydantic-settings)
│       │
│       ├── api/                  # Route handlers
│       │   ├── cameras.py        # REST CRUD /api/cameras
│       │   ├── lenses.py         # REST CRUD /api/lenses
│       │   ├── objects.py        # REST CRUD /api/objects
│       │   ├── vision_setups.py  # REST CRUD + /calculate
│       │   └── pages.py          # HTML page routes (Jinja2)
│       │
│       ├── models/               # Pydantic v2 models
│       │   ├── camera.py
│       │   ├── lens.py
│       │   ├── object.py
│       │   └── vision_setup.py
│       │
│       ├── storage/              # JSON file I/O (no DB)
│       │   ├── base_storage.py   # Generic CRUD on JSON file
│       │   ├── camera_storage.py
│       │   ├── lens_storage.py
│       │   ├── object_storage.py
│       │   └── vision_setup_storage.py
│       │
│       ├── services/             # Business logic layer
│       │   ├── camera_service.py
│       │   ├── lens_service.py
│       │   ├── object_service.py
│       │   ├── vision_setup_service.py
│       │   └── calculator_service.py  # Orchestrates all calculators
│       │
│       ├── calculations/         # Pure calculation modules
│       │   ├── base.py           # BaseCalculator + CalculatorResult
│       │   ├── fov_calculator.py
│       │   ├── dof_calculator.py
│       │   ├── motion_blur_calculator.py
│       │   ├── resolution_calculator.py
│       │   ├── pixel_density_calculator.py
│       │   ├── diffraction_calculator.py
│       │   ├── nyquist_calculator.py
│       │   ├── brightness_calculator.py
│       │   ├── lens_matching_calculator.py
│       │   └── sensor_calculator.py
│       │
│       └── utils/
│           ├── units.py          # Unit converters (mm, µm, inch, s, µs…)
│           ├── validators.py     # Field validation helpers
│           └── logger.py        # Logging setup
│
├── frontend/
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/main.js           # All CRUD + calculation UI logic
│   │
│   └── templates/               # Jinja2 templates
│       ├── base.html
│       ├── dashboard.html
│       ├── cameras/list.html  form.html
│       ├── lenses/list.html   form.html
│       ├── objects/list.html  form.html
│       └── vision_setups/list.html  form.html  detail.html
│
├── data/                        # Runtime JSON data (gitignore-able)
│   ├── cameras.json
│   ├── lenses.json
│   ├── objects.json
│   └── vision_setups.json
│
└── tests/
    ├── test_fov_calculator.py
    ├── test_dof_calculator.py
    ├── test_motion_blur_calculator.py
    ├── test_resolution_calculator.py
    └── test_sensor_calculator.py
```

## Design Principles

- **Storage Layer** reads/writes JSON — API never touches files directly
- **Service Layer** contains business logic — API routes stay thin
- **Calculator Layer** is pure Python — no I/O, fully testable
- Every calculator declares `required_parameters`; missing inputs return `{"status": "insufficient_data", "missing": [...]}`
