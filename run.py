# Machine Vision Calculator – entry point
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))

import uvicorn  # noqa: E402

if __name__ == "__main__":
    from app.config import settings  # noqa: E402

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
