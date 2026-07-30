"""Project save / load endpoint (in-memory store for demonstration)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.project_service import (
    delete_project,
    get_project,
    list_projects,
    save_project,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectIn(BaseModel):
    name: str
    description: str = ""
    known_values: dict[str, float]
    targets: list[str] = []
    notes: str = ""


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    known_values: dict[str, float]
    targets: list[str]
    notes: str
    created_at: str
    updated_at: str


class ProjectSummaryOut(BaseModel):
    id: str
    name: str
    description: str
    parameter_count: int
    created_at: str
    updated_at: str


@router.get("", response_model=list[ProjectSummaryOut])
def get_projects() -> list[ProjectSummaryOut]:
    return list_projects()


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectIn) -> ProjectOut:
    return save_project(body.model_dump())


@router.get("/{project_id}", response_model=ProjectOut)
def load_project(project_id: str) -> ProjectOut:
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=204)
def remove_project(project_id: str) -> None:
    if not delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
