from app.config import settings
from app.models.vision_setup import VisionSetup
from app.storage.base_storage import BaseStorage


class VisionSetupStorage(BaseStorage[VisionSetup]):
    def __init__(self) -> None:
        super().__init__(settings.data_dir / "vision_setups.json", VisionSetup)

    def search_setups(self, query: str) -> list[VisionSetup]:
        return self.search(query, ["name", "lighting_type", "notes"])
