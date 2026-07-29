from app.config import settings
from app.models.camera import Camera
from app.storage.base_storage import BaseStorage


class CameraStorage(BaseStorage[Camera]):
    def __init__(self) -> None:
        super().__init__(settings.data_dir / "cameras.json", Camera)

    def search_cameras(self, query: str) -> list[Camera]:
        return self.search(query, ["name", "manufacturer", "model", "interface"])
