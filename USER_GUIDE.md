# User Guide — Machine Vision Calculator

## 1. Khởi động

```bash
pip install -r requirements.txt
python run.py
```

Mở trình duyệt tại **http://localhost:8000**

---

## 2. Dashboard

Hiển thị số lượng Camera / Lens / Object / Vision Setup và 5 setup gần nhất.

---

## 3. Thêm Camera

1. Nhấn **Camera** trên sidebar → **Thêm Camera**
2. Điền các thông số:
   - **Sensor**: Resolution Width/Height (px), Pixel Size (µm), Sensor Width/Height (mm)
   - **Capture**: FPS, Exposure Time Min/Max (µs), Dynamic Range (dB), Bit Depth, QE (%), Read Noise (e-), Full Well Capacity (e-)
   - **Interface**: GigE / USB3 / Camera Link…
3. Nhấn **Tạo Camera**

> Các thông số Pixel Size, Sensor Width/Height, Resolution là **bắt buộc** để tính FoV và Resolution.

---

## 4. Thêm Lens

1. Nhấn **Lens** → **Thêm Lens**
2. Điền:
   - **Focal Length** (mm) — bắt buộc
   - **F-number** (f/#) — bắt buộc cho DoF và Diffraction
   - **Image Circle** (mm) — để kiểm tra sensor coverage
   - **MTF50** (lp/mm) — để so sánh với Nyquist limit
3. Nhấn **Tạo Lens**

---

## 5. Thêm Object

1. Nhấn **Object** → **Thêm Object**
2. Điền:
   - **Width / Height** (mm) — kích thước vật thể cần kiểm tra
   - **Speed** (mm/s) — nếu vật di chuyển trên băng tải
   - **Min Defect Size** (mm) — kích thước lỗi nhỏ nhất cần phát hiện
   - **Required Accuracy** (mm)

---

## 6. Tạo Vision Setup & Tính toán

1. Nhấn **Vision Setup** → **Tạo Setup**
2. Chọn **Camera**, **Lens**, **Object**
3. Nhập **Working Distance** (mm) — khoảng cách từ lens đến vật
4. Nhập các thông số môi trường tuỳ chọn (Lighting, Camera Tilt…)
5. Nhấn **Tạo Setup** → chuyển sang trang chi tiết
6. Nhấn nút **Calculate**
7. Kết quả hiện bên dưới, gồm:

| Module          | Kết quả chính                  |
|-----------------|-------------------------------|
| FoV             | Horizontal / Vertical FoV (mm)|
| Resolution      | mm/pixel, µm/pixel            |
| Pixel Density   | pixels/mm, can_detect_feature |
| Depth of Field  | Total DoF (mm)                |
| Diffraction     | Airy disk (µm), is limited?   |
| Nyquist         | Max resolvable freq (lp/mm)   |
| Motion Blur     | Blur (pixels), max exposure   |
| Sensor          | Dynamic Range (dB), SNR       |
| Brightness      | Relative brightness (%)       |
| Lens Matching   | Suitability score 0–100       |
| **Scores**      | Lens / Camera / **Overall**   |

---

## 7. Thiếu dữ liệu

Nếu một calculator không đủ dữ liệu, thay vì báo lỗi, nó trả về:

```
Thiếu dữ liệu: sensor_width, focal_length
```

→ Quay lại sửa Camera / Lens / Object rồi nhấn **Calculate** lại.

---

## 8. Tìm kiếm

Trên mỗi trang danh sách có ô **Tìm kiếm** — gõ bất kỳ từ khoá nào (tên, hãng, model…), bảng lọc ngay lập tức.

---

## 9. API (cho developer)

- Swagger UI: **http://localhost:8000/api/docs**
- ReDoc: **http://localhost:8000/api/redoc**

Tất cả dữ liệu lưu trong `data/*.json` — có thể backup / chỉnh sửa trực tiếp.
