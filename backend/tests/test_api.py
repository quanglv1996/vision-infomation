"""API smoke tests — every module endpoint answers with synthetic inputs."""
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def _png(img: np.ndarray) -> bytes:
    return cv2.imencode(".png", img)[1].tobytes()


def _textured(seed: int, h: int = 96, w: int = 128) -> np.ndarray:
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    g = 100 + 60 * np.sin(xx / 9.0) + 30 * np.cos(yy / 7.0) + rng.normal(0, 3, (h, w))
    g = np.clip(g, 0, 255).astype(np.uint8)
    return cv2.cvtColor(g, cv2.COLOR_GRAY2BGR)


def _files(field: str, n: int, seed: int = 0):
    return [(field, (f"img{i}.png", _png(_textured(seed + i)), "image/png")) for i in range(n)]


class TestMetadata:
    def test_parameters_grouped(self, client):
        r = client.get("/api/parameters")
        assert r.status_code == 200
        assert any(p["id"] == "focal_length" for g in r.json() for p in g["parameters"])

    def test_unknown_parameter_404(self, client):
        assert client.get("/api/parameters/nope").status_code == 404

    def test_formulas(self, client):
        r = client.get("/api/formulas")
        assert r.status_code == 200 and len(r.json()) > 0


class TestCalculator:
    def test_calculate(self, client):
        r = client.post("/api/calculate", json={
            "known_values": {"resolution_x": 2448, "pixel_size": 3.45},
        })
        assert r.status_code == 200
        assert r.json()["all_values"]["sensor_width"] == pytest.approx(2448 * 3.45 / 1000)

    def test_recommend(self, client):
        r = client.post("/api/recommend", json={"required_fov_x": 100, "working_distance": 400})
        assert r.status_code == 200
        assert len(r.json()) <= 10

    def test_project_crud(self, client):
        pid = client.post("/api/projects", json={"name": "p", "known_values": {"focal_length": 25}}).json()["id"]
        assert client.get(f"/api/projects/{pid}").status_code == 200
        assert client.delete(f"/api/projects/{pid}").status_code == 204
        assert client.get(f"/api/projects/{pid}").status_code == 404


class TestImageModules:
    def test_lighting(self, client):
        r = client.post("/api/lighting/analyze", files=_files("sequence", 10))
        assert r.status_code == 200, r.text

    def test_undecodable_image_422(self, client):
        r = client.post("/api/lighting/analyze", files=[("sequence", ("x.png", b"junk", "image/png"))])
        assert r.status_code == 422

    def test_quality(self, client):
        r = client.post("/api/quality/analyze", files=_files("images", 2))
        assert r.status_code == 200, r.text

    @pytest.mark.parametrize("image_type", ["white_card", "gray_card", "colorchecker", "reference"])
    def test_color(self, client, image_type):
        r = client.post("/api/color/analyze", files=_files("image", 1), data={"image_type": image_type})
        assert r.status_code == 200, r.text

    def test_comparison_requires_two_images(self, client):
        assert client.post("/api/comparison/analyze", files=_files("images", 1)).status_code == 400

    def test_comparison(self, client):
        r = client.post("/api/comparison/analyze", files=_files("images", 3))
        assert r.status_code == 200, r.text
        assert r.json()["n_images"] == 3

    def test_geometric_without_pattern_is_client_error(self, client):
        r = client.post("/api/calibration/geometric", files=_files("images", 3))
        assert r.status_code == 422

    def test_validation(self, client):
        r = client.post("/api/validation/analyze", json={
            "measurements": [10.0, 10.01, 9.99, 10.02, 9.98], "usl": 10.1, "lsl": 9.9,
            "inference_times_ms": [20, 21, 19, 22],
        })
        assert r.status_code == 200, r.text

    def test_validation_empty_400(self, client):
        assert client.post("/api/validation/analyze", json={}).status_code == 400
