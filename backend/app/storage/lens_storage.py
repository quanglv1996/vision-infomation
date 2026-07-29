from app.config import settings
from app.models.lens import Lens
from app.storage.base_storage import BaseStorage


class LensStorage(BaseStorage[Lens]):
    def __init__(self) -> None:
        super().__init__(settings.data_dir / "lenses.json", Lens)

    def search_lenses(self, query: str) -> list[Lens]:
        return self.search(query, ["name", "manufacturer", "model", "mount"])
