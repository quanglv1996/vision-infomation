from app.config import settings
from app.models.object import InspectionObject
from app.storage.base_storage import BaseStorage


class ObjectStorage(BaseStorage[InspectionObject]):
    def __init__(self) -> None:
        super().__init__(settings.data_dir / "objects.json", InspectionObject)

    def search_objects(self, query: str) -> list[InspectionObject]:
        return self.search(query, ["name", "color", "notes"])
