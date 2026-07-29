"""Vision Setup service — business logic layer."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.vision_setup import VisionSetup, VisionSetupCreate, VisionSetupUpdate
from app.services.calculator_service import CalculatorService
from app.services.camera_service import CameraService
from app.services.lens_service import LensService
from app.services.object_service import ObjectService
from app.storage.vision_setup_storage import VisionSetupStorage


class VisionSetupService:
    def __init__(self) -> None:
        self._storage  = VisionSetupStorage()
        self._cameras  = CameraService()
        self._lenses   = LensService()
        self._objects  = ObjectService()
        self._calc_svc = CalculatorService()

    def list(self, search: Optional[str] = None) -> List[VisionSetup]:
        if search:
            return self._storage.search_setups(search)
        return self._storage.get_all()

    def get(self, setup_id: str) -> Optional[VisionSetup]:
        return self._storage.get_by_id(setup_id)

    def create(self, payload: VisionSetupCreate) -> VisionSetup:
        setup = VisionSetup(**payload.model_dump())
        return self._storage.create(setup)

    def update(self, setup_id: str, payload: VisionSetupUpdate) -> Optional[VisionSetup]:
        existing = self._storage.get_by_id(setup_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        updated_data.update(payload.model_dump(exclude_none=True))
        updated_data["updated_at"] = datetime.now()
        updated = VisionSetup.model_validate(updated_data)
        return self._storage.update(setup_id, updated)

    def delete(self, setup_id: str) -> bool:
        return self._storage.delete(setup_id)

    def count(self) -> int:
        return self._storage.count()

    def calculate(self, setup_id: str) -> Optional[Dict[str, Any]]:
        """Chạy tất cả calculator cho setup và lưu kết quả vào file."""
        setup = self._storage.get_by_id(setup_id)
        if not setup:
            return None

        camera = self._cameras.get(setup.camera_id)
        lens   = self._lenses.get(setup.lens_id)
        obj    = self._objects.get(setup.object_id)

        camera_d = camera.model_dump() if camera else {}
        lens_d   = lens.model_dump()   if lens   else {}
        obj_d    = obj.model_dump()    if obj    else {}
        setup_d  = setup.model_dump()

        results = self._calc_svc.run_all(camera_d, lens_d, obj_d, setup_d)

        # Persist results back to setup
        existing_data = setup.model_dump()
        existing_data["results"]    = results
        existing_data["updated_at"] = datetime.now()
        updated_setup = VisionSetup.model_validate(existing_data)
        self._storage.update(setup_id, updated_setup)

        return results
