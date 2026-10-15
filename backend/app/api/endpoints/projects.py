"""Project save / load endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response

from app.schemas.project import ProjectIn, ProjectOut, ProjectSummaryOut
from app.services.project_service import ProjectRepository, get_project_repository

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectSummaryOut])
def get_projects(repo: ProjectRepository = Depends(get_project_repository)) -> list[ProjectSummaryOut]:
    return repo.list()


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectIn, repo: ProjectRepository = Depends(get_project_repository)) -> ProjectOut:
    return repo.save(body.model_dump())


@router.get("/{project_id}", response_model=ProjectOut)
def load_project(project_id: str, repo: ProjectRepository = Depends(get_project_repository)) -> ProjectOut:
    project = repo.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=204, response_class=Response, response_model=None)
def remove_project(project_id: str, repo: ProjectRepository = Depends(get_project_repository)) -> None:
    if not repo.delete(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
