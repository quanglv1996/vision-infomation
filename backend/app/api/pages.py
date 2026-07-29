"""HTML page routes — rendered by Jinja2."""
from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.services.camera_service import CameraService
from app.services.lens_service import LensService
from app.services.object_service import ObjectService
from app.services.vision_setup_service import VisionSetupService

router = APIRouter(tags=["Pages"])
templates = Jinja2Templates(directory=str(settings.templates_dir))

_cameras = CameraService()
_lenses  = LensService()
_objects = ObjectService()
_setups  = VisionSetupService()


# ── Root ─────────────────────────────────────────────────────────────────────
@router.get("/", response_class=RedirectResponse, include_in_schema=False)
def root():
    return RedirectResponse(url="/dashboard")


# ── Dashboard ─────────────────────────────────────────────────────────────────
@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    recent = _setups.list()[-5:][::-1]
    return templates.TemplateResponse("dashboard.html", {
        "request":      request,
        "camera_count": _cameras.count(),
        "lens_count":   _lenses.count(),
        "object_count": _objects.count(),
        "setup_count":  _setups.count(),
        "recent_setups": recent,
    })


# ── Cameras ──────────────────────────────────────────────────────────────────
@router.get("/cameras", response_class=HTMLResponse)
def cameras_list(request: Request):
    return templates.TemplateResponse("cameras/list.html", {
        "request": request,
        "cameras": _cameras.list(),
    })


@router.get("/cameras/new", response_class=HTMLResponse)
def cameras_new(request: Request):
    return templates.TemplateResponse("cameras/form.html", {
        "request": request,
        "camera": None,
    })


@router.get("/cameras/{camera_id}/edit", response_class=HTMLResponse)
def cameras_edit(request: Request, camera_id: str):
    cam = _cameras.get(camera_id)
    return templates.TemplateResponse("cameras/form.html", {
        "request": request,
        "camera": cam,
    })


# ── Lenses ────────────────────────────────────────────────────────────────────
@router.get("/lenses", response_class=HTMLResponse)
def lenses_list(request: Request):
    return templates.TemplateResponse("lenses/list.html", {
        "request": request,
        "lenses": _lenses.list(),
    })


@router.get("/lenses/new", response_class=HTMLResponse)
def lenses_new(request: Request):
    return templates.TemplateResponse("lenses/form.html", {
        "request": request,
        "lens": None,
    })


@router.get("/lenses/{lens_id}/edit", response_class=HTMLResponse)
def lenses_edit(request: Request, lens_id: str):
    return templates.TemplateResponse("lenses/form.html", {
        "request": request,
        "lens": _lenses.get(lens_id),
    })


# ── Objects ───────────────────────────────────────────────────────────────────
@router.get("/objects", response_class=HTMLResponse)
def objects_list(request: Request):
    return templates.TemplateResponse("objects/list.html", {
        "request": request,
        "objects": _objects.list(),
    })


@router.get("/objects/new", response_class=HTMLResponse)
def objects_new(request: Request):
    return templates.TemplateResponse("objects/form.html", {
        "request": request,
        "obj": None,
    })


@router.get("/objects/{object_id}/edit", response_class=HTMLResponse)
def objects_edit(request: Request, object_id: str):
    return templates.TemplateResponse("objects/form.html", {
        "request": request,
        "obj": _objects.get(object_id),
    })


# ── Vision Setups ─────────────────────────────────────────────────────────────
@router.get("/vision-setups", response_class=HTMLResponse)
def setups_list(request: Request):
    return templates.TemplateResponse("vision_setups/list.html", {
        "request": request,
        "setups": _setups.list(),
    })


@router.get("/vision-setups/new", response_class=HTMLResponse)
def setups_new(request: Request):
    return templates.TemplateResponse("vision_setups/form.html", {
        "request":  request,
        "setup":    None,
        "cameras":  _cameras.list(),
        "lenses":   _lenses.list(),
        "objects":  _objects.list(),
    })


@router.get("/vision-setups/{setup_id}", response_class=HTMLResponse)
def setups_detail(request: Request, setup_id: str):
    setup   = _setups.get(setup_id)
    camera  = _cameras.get(setup.camera_id) if setup else None
    lens    = _lenses.get(setup.lens_id)    if setup else None
    obj     = _objects.get(setup.object_id) if setup else None
    return templates.TemplateResponse("vision_setups/detail.html", {
        "request": request,
        "setup":   setup,
        "camera":  camera,
        "lens":    lens,
        "obj":     obj,
    })


@router.get("/vision-setups/{setup_id}/edit", response_class=HTMLResponse)
def setups_edit(request: Request, setup_id: str):
    return templates.TemplateResponse("vision_setups/form.html", {
        "request":  request,
        "setup":    _setups.get(setup_id),
        "cameras":  _cameras.list(),
        "lenses":   _lenses.list(),
        "objects":  _objects.list(),
    })
