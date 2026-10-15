# Machine Vision Calculator

Một **Hệ Thống Kiến Thức Kỹ Thuật** toàn diện cho tính toán thông số máy ảnh trong lĩnh vực máy ảnh công nghiệp.

Nhập vào bất kỳ thông số nào đã biết — công cụ tính toán sẽ tự động suy luận tất cả các giá trị có thể được tính toán, xác định các thông số còn thiếu, và đưa ra gợi ý về các bộ máy ảnh + lens phù hợp.

---

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Tính Năng](#tính-năng)
- [Kiến Trúc](#kiến-trúc)
- [Cài Đặt](#cài-đặt)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Công Nghệ](#công-nghệ)
- [API Documentation](#api-documentation)

---

## 🎯 Tổng Quan

**Machine Vision Calculator** là một ứng dụng web toàn diện được thiết kế để:

- **Tính toán thông số quang học**: Tự động tính toán các thông số máy ảnh dựa trên các thông số đầu vào
- **Phân tích hình ảnh**: Đánh giá chất lượng hình ảnh, độ sắc nét, cân bằng màu
- **Hiệu chỉnh**: Hỗ trợ hiệu chỉnh màu, hiệu chỉnh hình học cho hệ thống máy ảnh
- **Gợi ý thành phần**: Đề xuất các bộ máy ảnh và lens phù hợp từ danh sách
- **Trực quan hóa**: Hiển thị quan hệ giữa các thông số thông qua đồ thị phụ thuộc
- **Lập dự án**: Quản lý và lưu trữ các dự án máy ảnh

---

## ✨ Tính Năng Chính

### Backend (FastAPI)
- ✅ **Calculation Engine**: Engine tính toán dựa trên forward/backward chaining
- ✅ **Formula Library**: Thư viện công thức tự động đảo ngược bằng SymPy
- ✅ **Parameter Graph**: Đồ thị tham số dựa trên NetworkX để theo dõi quan hệ
- ✅ **Catalog Management**: Quản lý danh sách máy ảnh và lens từ JSON
- ✅ **Image Processing**: Xử lý hình ảnh với OpenCV và scikit-image
- ✅ **Color Calibration**: Hiệu chỉnh màu sắc hình ảnh
- ✅ **Geometric Calibration**: Hiệu chỉnh hình học camera
- ✅ **Quality Assessment**: Đánh giá chất lượng hình ảnh
- ✅ **Lighting Analysis**: Phân tích điều kiện ánh sáng
- ✅ **Tài khoản & cấu hình (PostgreSQL)**: Đăng ký có xác nhận email, đăng nhập JWT, quản trị tài khoản, lưu/mở lại cấu hình theo từng người dùng

### Frontend (React + TypeScript)
- ✅ **Thiết kế theo bài toán**: Chụp ảnh tĩnh, chụp ảnh động, quét dòng (line scan), đo kích thước, đọc mã/OCR — nhập ít thông số, tự tính và kiểm tra đạt/không đạt
- ✅ **Giá trị phổ biến**: Mỗi thông số có danh sách giá trị thường dùng để chọn nhanh; chọn **Khác…** để nhập giá trị riêng
- ✅ **Cách tính từng bước**: Hiển thị công thức, giá trị thay vào và kết quả của mỗi bước
- ✅ **Tài liệu (Docs)**: Thư viện kiến thức machine vision và các kỹ thuật hiệu chuẩn, có công thức và ví dụ tính toán
- ✅ **Chế độ Nâng cao (tự do)**: Nhập bất kỳ thông số nào, đặt mục tiêu, xem cách tính và đồ thị phụ thuộc — cùng giao diện với chế độ theo bài toán
- ✅ **Gợi ý camera + lens**: Xếp hạng tổ hợp trong catalog theo FOV / WD / độ chính xác hiện tại (ở cả hai chế độ)
- ✅ **Tài khoản**: Đăng ký (xác nhận qua email), đăng nhập, quên mật khẩu, đổi mật khẩu
- ✅ **Cấu hình đã lưu**: Lưu cấu hình đang tính, mở lại để thử nghiệm/sửa, nhân bản, đổi tên, xuất/nhập JSON
- ✅ **Quản lý tài khoản (admin)**: Duyệt đăng ký, thêm, sửa, khóa/mở khóa, xóa tài khoản
- ✅ **Real-time Calculation**: Cập nhật kết quả tính toán theo thời gian thực
- ✅ **Image Upload & Preview**: Tải và xem trước hình ảnh
- ✅ **State Management**: Quản lý trạng thái bằng Zustand + react-query

---

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)           │
│     - UI: Material-UI, Vite, React Hooks       │
│     - State: Zustand                            │
│     - API Client: Axios                         │
└────────────────┬────────────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────────────┐
│          Backend (FastAPI + Python)             │
│  ┌───────────────────────────────────────────┐  │
│  │  API Endpoints (Router + Services)        │  │
│  │  - Calculate, Color Calibration, etc.    │  │
│  └───────────────┬─────────────────────────┘  │
│                  │                            │
│  ┌───────────────▼─────────────────────────┐  │
│  │  Calculation Engine                      │  │
│  │  - Forward/Backward Chaining            │  │
│  │  - Parameter Inference                  │  │
│  └───────────────┬─────────────────────────┘  │
│                  │                            │
│  ┌───────────────▼─────────────────────────┐  │
│  │  Formula Library (SymPy)                 │  │
│  │  - Auto-inversion                       │  │
│  │  - Symbol Resolution                    │  │
│  └───────────────┬─────────────────────────┘  │
│                  │                            │
│  ┌───────────────▼─────────────────────────┐  │
│  │  Parameter Graph (NetworkX)              │  │
│  │  - Dependency Tracking                  │  │
│  │  - Relationship Mapping                 │  │
│  └───────────────┬─────────────────────────┘  │
│                  │                            │
│  ┌───────────────▼─────────────────────────┐  │
│  │  Catalog (JSON)                         │  │
│  │  - cameras.json                         │  │
│  │  - lenses.json                          │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Cài Đặt & Chạy

### Yêu Cầu Hệ Thống
- **Node.js** 16+ (cho Frontend)
- **Python** 3.9+ (cho Backend)
- **PostgreSQL** 14+ (lưu tài khoản và cấu hình; Docker Compose đã kèm sẵn)
- **Docker** & **Docker Compose** (tùy chọn)

### Tùy Chọn 1: Chạy Local (Phát Triển)

#### Backend

```bash
# Điều hướng đến thư mục backend
cd backend

# Tạo virtual environment (tùy chọn nhưng khuyên dùng)
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt

# PostgreSQL (nếu chưa có): chạy tạm bằng Docker
docker run -d --name vision-db -e POSTGRES_USER=vision -e POSTGRES_PASSWORD=vision \
  -e POSTGRES_DB=vision -p 5432:5432 postgres:16-alpine

# Cấu hình qua biến môi trường MVC_* hoặc file backend/.env
export MVC_DATABASE_URL=postgresql+psycopg://vision:vision@localhost:5432/vision
export MVC_ADMIN_EMAIL=admin@vision.local MVC_ADMIN_PASSWORD='ChangeMe@123'
# Không đặt MVC_SMTP_HOST → email (link xác nhận) được in ra log backend

# Chạy server (bảng dữ liệu và tài khoản admin được tạo tự động khi khởi động)
uvicorn main:app --reload --port 9999
```

Server sẽ khởi động tại: `http://localhost:9999`. Các module tính toán và phân tích ảnh vẫn chạy khi chưa có database; chỉ đăng nhập và lưu cấu hình cần PostgreSQL (trả 503 khi không kết nối được).

**API Docs**: Truy cập `http://localhost:9999/api/docs` để xem Swagger UI

#### Frontend

```bash
# Điều hướng đến thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Ứng dụng sẽ khởi động tại: `http://localhost:5173`

### Tùy Chọn 2: Chạy với Docker Compose

```bash
# Từ thư mục gốc của project
cp .env.example .env        # đổi MVC_SECRET_KEY, mật khẩu admin, SMTP…
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:9999
# API Docs: http://localhost:9999/api/docs
# Hộp thư dev (Mailpit): http://localhost:8025 — mọi email xác nhận / đặt lại mật khẩu hiện ở đây
```

Compose gồm 4 dịch vụ: `db` (PostgreSQL 16, dữ liệu trong volume `pgdata`), `mailpit` (bắt email khi phát triển), `backend`, `frontend`.
Tài khoản quản trị mặc định: `admin@vision.local` / `ChangeMe@123` (đặt bằng `MVC_ADMIN_EMAIL` / `MVC_ADMIN_PASSWORD` trước lần chạy đầu, hoặc đổi mật khẩu sau khi đăng nhập).

Để gửi email thật, đặt `MVC_SMTP_HOST`, `MVC_SMTP_PORT`, `MVC_SMTP_USER`, `MVC_SMTP_PASSWORD`, `MVC_SMTP_STARTTLS` / `MVC_SMTP_SSL`, `MVC_SMTP_FROM` trong `.env` (ví dụ Gmail trong `.env.example`) và đặt `MVC_FRONTEND_URL` là địa chỉ người dùng truy cập (dùng cho link trong email).

### Tùy Chọn 3: Build Sản Phẩm

#### Frontend

```bash
cd frontend
npm run build

# Output sẽ nằm trong thư mục 'dist'
npm run preview  # Xem trước build
```

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Thiết Kế Hệ Vision Theo Bài Toán

1. Mở ứng dụng tại `http://localhost:5173`, chọn **Thiết kế hệ vision → Theo bài toán**
2. Chọn bài toán: **Chụp ảnh tĩnh**, **Chụp ảnh động**, **Quét dòng (Line scan)**, **Đo kích thước chính xác** hoặc **Đọc mã / OCR**
3. Chọn chế độ: *Biết WD → tính tiêu cự*, *Biết lens → tính WD* hoặc *Kiểm tra cấu hình có sẵn*
4. Chọn cảm biến phổ biến và các giá trị từ danh sách (hoặc **Khác…** để tự nhập) — kết quả tự cập nhật
5. Đọc **Kiểm tra yêu cầu** (đạt / cần chú ý / không đạt), **Gợi ý** và **Cách tính từng bước** ở cột bên phải
6. **Gợi ý camera + lens từ catalog** (cột phải) tìm tổ hợp phù hợp với FOV / WD / độ chính xác hiện tại
7. Nút **Nâng cao** mang các thông số sang chế độ tự do; nút **Lưu** lưu cấu hình (cần đăng nhập)

### 1b. Chế Độ Nâng Cao (tính toán tự do)

Dùng khi bài toán không nằm trong 5 bài toán mẫu, hoặc khi bạn biết một tổ hợp thông số khác thường (VD: biết lens + DOF, cần WD).

1. Chọn nhóm thông số ở cột trái (Camera, Lens, Vật, Chuyển động…) hoặc tìm theo tên
2. Nhập/chọn bất kỳ thông số nào đã biết — kết quả tự tính; ô tính được hiển thị giá trị màu xanh, bấm **Tính được** để xem công thức
3. Bấm biểu tượng 🎯 để đặt **mục tiêu**: cột phải cho biết còn thiếu thông số nào để tính được
4. **Đồ thị phụ thuộc** hiển thị quan hệ giữa các thông số; **Lưu** lưu cấu hình như ở chế độ theo bài toán

### 1c. Tài Liệu

Mục **Tài liệu** gồm 3 nhóm: *Nền tảng* (cảm biến, FOV, lens, DOF & nhiễu xạ, chiếu sáng), *Bài toán vision* và *Hiệu chuẩn & kiểm định* (chiếu sáng, mm/pixel, hình học, màu, chất lượng ảnh, so sánh ảnh, kiểm định GR&R…). Mỗi bài có công thức, giải thích ký hiệu và ví dụ tính từng bước. Mỗi module phân tích có nút **Hướng dẫn** mở đúng bài liên quan.

### 1d. Tài Khoản & Cấu Hình Đã Lưu

1. Bấm **Đăng nhập** (góc dưới thanh điều hướng) → tab **Đăng ký**, nhập họ tên, email, mật khẩu (≥ 8 ký tự)
2. Mở email xác nhận và bấm **Xác nhận email** — ứng dụng tự đăng nhập. Không nhận được email? Dùng **Gửi lại** trong hộp đăng nhập
3. Trong **Thiết kế hệ vision**, bấm **Lưu** để lưu cấu hình đang làm. Sau khi lưu, cấu hình được "liên kết": chip xanh hiển thị tên và trạng thái *chưa lưu* khi bạn sửa; bấm **Lưu** lần nữa để cập nhật, hoặc menu ⋮ → **Lưu thành cấu hình mới**
4. Mục **Cấu hình đã lưu**: tìm kiếm, lọc theo bài toán, xem chi tiết (thông số nhập + kết quả lúc lưu), **Mở** để thử nghiệm/sửa, đổi tên, nhân bản, xuất/nhập JSON, xóa
5. Menu tài khoản → **Hồ sơ & mật khẩu** để đổi tên hoặc mật khẩu; **Quên mật khẩu?** trong hộp đăng nhập gửi link đặt lại qua email

Khách (chưa đăng nhập) vẫn dùng được mọi module tính toán và phân tích; đăng nhập chỉ cần để lưu cấu hình.

### 1e. Quản Lý Tài Khoản (admin)

Mục **Quản trị → Quản lý tài khoản** chỉ hiện với quản trị viên:
- Thống kê: tổng tài khoản, chờ xác nhận email, quản trị viên, đã khóa (bấm để lọc)
- **Duyệt** tài khoản chờ xác nhận (đánh dấu email đã xác nhận) hoặc **gửi lại email xác nhận**
- **Thêm** tài khoản (mặc định đã xác nhận), **sửa** họ tên / email / vai trò / mật khẩu, **khóa / mở khóa**, **xóa** (xóa kèm cấu hình của người đó)
- Khóa tài khoản hoặc đặt mật khẩu mới sẽ đăng xuất người dùng khỏi mọi thiết bị. Không thể tự khóa, tự hạ quyền, tự xóa, hoặc xóa quản trị viên cuối cùng

### 2. Tải & Phân Tích Hình Ảnh

1. Chọn mô-đun **Image Quality** hoặc **Color Calibration**
2. Tải hình ảnh lên bằng nút **Upload**
3. Chọn cùi bắp để phân tích
4. Xem kết quả phân tích trong panel tương ứng

### 3. Hiệu Chỉnh Màu

1. Chuyển đến tab **Color Calibration**
2. Tải hình ảnh chứa color checker board
3. Chọn không gian màu mục tiêu
4. Hiệu chỉnh Gamma và Gray Balance
5. Xem hình ảnh đã hiệu chỉnh

### 4. Gợi Ý Thiết Bị

1. Nhập yêu cầu trong **Thiết kế hệ vision** (theo bài toán hoặc Nâng cao) — cần có FOV ngang
2. Ở cột kết quả, bấm **Tìm camera + lens phù hợp**
3. So sánh 5 tổ hợp có điểm cao nhất (độ phân giải, mm/pixel, DOF, nhòe…)

---

## 📁 Cấu Trúc Dự Án

```
vision-information/
│
├── backend/                          # FastAPI Backend
│   ├── main.py                       # Entry point
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                    # Docker configuration
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── core/                     # Dùng chung toàn backend
│   │   │   ├── config.py             # Settings (env prefix MVC_): DB, JWT, SMTP, admin
│   │   │   ├── errors.py             # AppError → {"detail": {code, message}}
│   │   │   ├── imaging.py            # Helper ảnh: decode, to_gray, downsample...
│   │   │   ├── mailer.py             # Gửi email SMTP (hoặc ghi log khi chưa cấu hình)
│   │   │   └── security.py           # bcrypt + JWT (access / verify / reset)
│   │   │
│   │   ├── db/                       # PostgreSQL (SQLAlchemy 2)
│   │   │   ├── models.py             # User, SavedConfig
│   │   │   └── session.py            # Engine, get_db, tạo bảng + admin khi khởi động
│   │   │
│   │   ├── api/                      # API routes
│   │   │   ├── router.py             # Main router (danh sách _MODULES)
│   │   │   ├── deps.py               # Đọc ảnh upload, map lỗi service → HTTP, get_current_user / require_admin
│   │   │   └── endpoints/            # API endpoints
│   │   │       ├── admin_users.py    # Quản lý tài khoản (admin)
│   │   │       ├── auth.py           # Đăng ký, xác nhận email, đăng nhập, mật khẩu
│   │   │       ├── calculate.py      # Calculation endpoint
│   │   │       ├── color_calibration.py
│   │   │       ├── geometric_calibration.py
│   │   │       ├── image_comparison.py
│   │   │       ├── image_quality.py
│   │   │       ├── lighting.py
│   │   │       ├── parameters.py
│   │   │       ├── configs.py        # Cấu hình đã lưu của người dùng
│   │   │       ├── recommendations.py
│   │   │       └── validation.py
│   │   │
│   │   ├── schemas/                  # Pydantic models (request/response)
│   │   │   ├── calculation.py
│   │   │   ├── color_calibration.py
│   │   │   ├── geometric_calibration.py
│   │   │   ├── image_comparison.py
│   │   │   ├── image_quality.py
│   │   │   ├── lighting.py
│   │   │   ├── parameter.py
│   │   │   ├── auth.py               # Tài khoản + admin
│   │   │   ├── config.py             # Cấu hình đã lưu
│   │   │   ├── recommendation.py
│   │   │   └── validation.py
│   │   │
│   │   └── services/                 # Business logic
│   │       ├── calculation_service.py
│   │       ├── catalog.py            # Load + cache catalog JSON
│   │       ├── color_calibration_service.py
│   │       ├── geometric_calibration_service.py
│   │       ├── image_comparison_service.py
│   │       ├── image_quality_service.py
│   │       ├── lighting_service.py
│   │       ├── auth_service.py       # Đăng ký / xác nhận / đăng nhập / reset
│   │       ├── config_service.py     # CRUD cấu hình + snapshot kết quả
│   │       ├── user_service.py       # Quản trị tài khoản
│   │       ├── recommendation_service.py
│   │       └── validation_service.py
│   │
│   ├── calculation/                  # Calculation Engine
│   │   ├── __init__.py
│   │   ├── engine.py                 # Main calculation engine
│   │   ├── graph.py                  # Parameter graph (NetworkX)
│   │   └── validator.py              # Parameter validation
│   │
│   ├── knowledge/                    # Knowledge Base
│   │   ├── __init__.py
│   │   ├── formulas.py               # All formulas (SymPy)
│   │   ├── parameters.py             # Parameter definitions
│   │   └── units.py                  # Unit definitions
│   │
│   ├── catalog/                      # Equipment Catalog
│   │   ├── cameras.json              # Camera specifications
│   │   └── lenses.json               # Lens specifications
│   │
│   └── tests/                        # Unit tests
│       ├── conftest.py               # Test dùng SQLite in-memory (hoặc MVC_TEST_DATABASE_URL)
│       ├── test_api.py               # Smoke test mọi endpoint
│       ├── test_auth.py              # Tài khoản, admin, cấu hình đã lưu
│       ├── test_engine.py
│       └── test_formulas.py
│
├── frontend/                         # React Frontend
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # npm dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── vite.config.ts                # Vite config
│   ├── Dockerfile                    # Docker configuration
│   │
│   └── src/
│       ├── main.tsx                  # React entry
│       ├── App.tsx                   # Main app component (tab bar)
│       ├── modules.tsx               # Registry các module/tab
│       │
│       ├── components/               # React components
│       │   ├── ColorCalibration/     # Color calibration module
│       │   │   ├── ColorCheckerPanel.tsx
│       │   │   ├── ColorSpacePanel.tsx
│       │   │   ├── ColorUpload.tsx
│       │   │   ├── GammaPanel.tsx
│       │   │   ├── GrayBalancePanel.tsx
│       │   │   └── index.tsx
│       │   │
│       │   ├── GeometricCalibration/
│       │   ├── ImageComparison/
│       │   ├── ImageQuality/
│       │   ├── LightingCalibration/
│       │   │
│       │   ├── Admin/                # Quản lý tài khoản (admin)
│       │   ├── Auth/                 # Hộp đăng nhập/đăng ký, link email, menu tài khoản, hồ sơ
│       │   ├── CalculatorModule/     # Thiết kế hệ vision: Theo bài toán | Nâng cao
│       │   ├── Configs/              # Cấu hình đã lưu + nút Lưu dùng trong calculator
│       │   ├── common/               # Component dùng chung (ModuleHeader, ConfirmDialog, HeatmapCanvas…)
│       │   ├── DependencyGraph/      # Đồ thị phụ thuộc (reactflow)
│       │   ├── FreeForm/             # Chế độ Nâng cao (tính toán tự do)
│       │   ├── Recommendations/      # Gợi ý camera + lens từ catalog
│       │   ├── Scenarios/            # Chế độ theo bài toán
│       │   └── ValidationModule/     # Validation UI
│       │
│       ├── services/                 # API services
│       │   ├── http.ts               # Axios client dùng chung + errorMessage
│       │   ├── api.ts                # Calculator / recommend
│       │   ├── authApi.ts            # Tài khoản + admin
│       │   ├── configApi.ts          # Cấu hình đã lưu
│       │   ├── colorCalibrationApi.ts
│       │   ├── geometricCalibrationApi.ts
│       │   ├── imageComparisonApi.ts
│       │   ├── imageQualityApi.ts
│       │   ├── lightingApi.ts
│       │   └── validationApi.ts
│       │
│       ├── stores/                   # Zustand state management
│       │   ├── authStore.ts          # Token, user, hộp đăng nhập
│       │   ├── configStore.ts        # Cấu hình đang liên kết với calculator
│       │   ├── freeFormStore.ts      # Giá trị của chế độ Nâng cao
│       │   └── navStore.ts           # Module đang mở + deep link
│       │
│       ├── theme/                    # UI theme
│       │   ├── theme.ts
│       │   └── status.ts             # Màu cho status (pass/warning/fail...)
│       │
│       └── types/                    # TypeScript types
│           ├── colorCalibration.ts
│           ├── geometricCalibration.ts
│           ├── imageComparison.ts
│           ├── imageQuality.ts
│           ├── lighting.ts
│           ├── validation.ts
│           └── index.ts
│
├── docker-compose.yml                # db (PostgreSQL) + mailpit + backend + frontend
├── .env.example                      # Biến môi trường mẫu (secret, admin, SMTP)
└── README.md                          # This file
```

---

## 💻 Công Nghệ Sử Dụng

### Backend
| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|----------|---------|
| **FastAPI** | ≥0.110.0 | Web framework |
| **Uvicorn** | ≥0.27.1 | ASGI server |
| **Pydantic** | ≥2.6.1 | Data validation |
| **SymPy** | ≥1.12 | Symbolic math & formula auto-inversion |
| **NetworkX** | ≥3.2.1 | Parameter graph & relationships |
| **NumPy** | ≥1.26.4 | Numerical computing |
| **OpenCV** | ≥4.9.0 | Image processing |
| **scikit-image** | ≥0.22.0 | Image analysis |
| **Pillow** | ≥10.2.0 | Image manipulation |
| **pytest** | ≥8.0.2 | Testing framework |

### Frontend
| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|----------|---------|
| **React** | ^18.2.0 | UI framework |
| **TypeScript** | ^5.4.2 | Type safety |
| **Vite** | ^5.2.6 | Build tool |
| **Material-UI** | ^5.15.14 | UI components |
| **Zustand** | ^4.5.2 | State management |
| **Axios** | ^1.6.8 | HTTP client |
| **React Hook Form** | ^7.51.2 | Form handling |
| **React Query** | ^5.29.0 | Data fetching |
| **React Flow** | ^11.11.3 | Graph visualization |
| **Recharts** | ^2.12.2 | Charts & graphs |
| **notistack** | ^3.0.1 | Notifications |

---

## 🔌 API Documentation

### Base URL
```
http://localhost:9999/api
```

### Endpoints Chính

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/calculate` | Suy luận toàn bộ tham số từ giá trị đã biết |
| POST | `/calculate/analyze` | Phân tích khả năng tính + dữ liệu đồ thị phụ thuộc |
| GET | `/parameters`, `/parameters/{id}` | Định nghĩa tham số |
| GET | `/formulas`, `/formulas/{id}` | Định nghĩa công thức (kèm công thức đảo) |
| POST | `/recommend` | Gợi ý bộ camera + lens |
| POST | `/auth/register` | Đăng ký (gửi email xác nhận) |
| POST | `/auth/verify-email` | Xác nhận email từ link → trả token |
| POST | `/auth/resend-verification` | Gửi lại email xác nhận |
| POST | `/auth/login` | Đăng nhập → `access_token` (Bearer) |
| POST | `/auth/forgot-password`, `/auth/reset-password` | Quên / đặt lại mật khẩu qua email |
| GET / PATCH | `/auth/me` | Thông tin / đổi tên, mật khẩu |
| GET / POST | `/admin/users` | (admin) Danh sách / tạo tài khoản |
| PATCH / DELETE | `/admin/users/{id}` | (admin) Sửa, khóa, duyệt / xóa |
| POST | `/admin/users/{id}/send-verification` | (admin) Gửi lại email xác nhận |
| GET / POST | `/configs` | Cấu hình đã lưu của bạn / lưu mới |
| GET / PATCH / DELETE | `/configs/{id}` | Xem / cập nhật / xóa |
| POST | `/configs/{id}/duplicate` | Nhân bản |
| POST | `/lighting/analyze` | Phân tích chiếu sáng (multipart: `sequence[]`, `white_ref?`, `dark_frame?`) |
| POST | `/quality/analyze` | Đánh giá chất lượng ảnh (multipart: `images[]`) |
| POST | `/calibration/geometric` | Hiệu chỉnh hình học (multipart: `images[]`, `board_cols`, `board_rows`, `square_size_mm`, ...) |
| POST | `/color/analyze` | Hiệu chỉnh màu (multipart: `image`, `image_type`) |
| POST | `/comparison/analyze` | So sánh 2–100 ảnh (multipart: `images[]`, `names`, `weights`, `grayscale`) |
| POST | `/validation/analyze` | Đánh giá hiệu năng hệ thống (JSON) |

Ví dụ tính toán:

```http
POST /api/calculate
Content-Type: application/json

{
  "known_values": { "resolution_x": 2448, "pixel_size": 3.45, "focal_length": 50, "working_distance": 500 },
  "targets": ["dof"]
}
```

Response gồm `steps` (giá trị + công thức dùng cho từng tham số), `all_values`, `missing_for_targets`, `warnings`, `validation_errors`.

### Swagger UI
Tất cả endpoints được tư liệu hóa đầy đủ trong Swagger UI:
```
http://localhost:9999/api/docs
```

---

## 🧪 Testing

### Chạy Unit Tests

```bash
cd backend

# Chạy tất cả tests
pytest

# Chạy tests với coverage
pytest --cov=app tests/

# Chạy một file test cụ thể
pytest tests/test_engine.py -v
```

Tests dùng SQLite in-memory nên không cần PostgreSQL. Để chạy trên PostgreSQL thật (bảng sẽ bị xóa trước):
`MVC_TEST_DATABASE_URL=postgresql+psycopg://vision:vision@localhost:5432/vision_test pytest`

### Tests Có Sẵn
- `test_api.py` - Smoke test cho mọi endpoint (ảnh tổng hợp)
- `test_auth.py` - Đăng ký/xác nhận/đăng nhập, quản trị tài khoản, cấu hình đã lưu
- `test_engine.py` - Kiểm tra calculation engine
- `test_formulas.py` - Kiểm tra formulas và auto-inversion

---

## 🔧 Development

Xem [CLAUDE.md](CLAUDE.md) để biết kiến trúc chi tiết, quy ước code và checklist thêm module phân tích mới.

### Thêm Công Thức Mới

1. Thêm một entry `_f(...)` vào `FORMULAS` trong `backend/knowledge/formulas.py`
2. Engine tự động suy luận các công thức đảo ngược bằng SymPy
3. API tự động hỗ trợ tính toán tham số mới

```python
_f("fov_x_from_sensor", "FOV X", "FOV = sensor_width / magnification",
   ["sensor_width", "magnification"], "fov_x",
   "sensor_width / magnification", cat="imaging"),
```

---

## 📊 Ví Dụ Workflow

### Tính Toán Độ Sâu Trường

**Input:**
- Focal length: 50mm
- Sensor size: 6.3 × 5.5 mm
- Working distance: 500 mm
- Maximum blur circle: 0.05 mm

**Process:**
1. Engine nhận input
2. Tìm công thức liên quan: DOF formula
3. Tính DOF (Depth of Field)
4. Tính toán các thông số khác: F-number, aperture diameter, etc.
5. Vẽ đồ thị quan hệ giữa các tham số

**Output:**
```json
{
  "depth_of_field": 125.5,
  "near_distance": 437.25,
  "far_distance": 562.75,
  "aperture_diameter": 7.2,
  "f_number": 6.9,
  "circle_of_confusion": 0.05
}
```

---

## 🤝 Đóng Góp

Chúng tôi chào đón các đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📝 License

Project này được phát hành dưới MIT License. Xem file [LICENSE](LICENSE) để chi tiết.

---

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:

1. Kiểm tra [Issues](../../issues) đã tồn tại
2. Tạo Issue mới với chi tiết rõ ràng
3. Liên hệ team phát triển

---

## 🎓 Tài Liệu Tham Khảo

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SymPy Tutorial](https://docs.sympy.org/)
- [NetworkX Guide](https://networkx.org/)

---

**Cập nhật lần cuối**: Tháng 8 năm 2026

---

## How the Calculation Engine Works

The engine is **purely declarative** — no hard-coded if/else logic.

1. **Formula Library** — each formula specifies `inputs → output + expression`.
2. **SymPy Auto-Inversion** — at startup, SymPy derives inverse expressions for every formula
   (e.g. from `sensor_width = resolution_x × pixel_size / 1000`, it derives
   `pixel_size = sensor_width × 1000 / resolution_x`).
3. **Forward Chaining** — iterates over formulas; applies any formula whose inputs are all known.
4. **Inverse Chaining** — if an output is known but one input is missing, solves for the unknown input.
5. **Repeats** until stable (≤ 50 iterations — always terminates).
6. **Conflict Detection** — warns when two different formulas produce inconsistent values.
7. **Missing Analysis** — for any target parameter, reports the minimal set of inputs still needed.

### Example

Given:
```json
{ "resolution_x": 2448, "pixel_size": 3.45, "focal_length": 50, "working_distance": 500 }
```

Engine automatically computes:
- `sensor_width` = 2448 × 3.45 / 1000 = **8.45 mm**
- `magnification` = 50 / (500 − 50) = **0.111**
- `fov_x` = 8.45 / 0.111 = **76.1 mm**
- `mm_per_pixel` = 76.1 / 2448 = **0.031 mm/pixel**
- `pixel_per_mm` = 1 / 0.031 = **32.2 px/mm**
- `detectable_feature` = 0.031 × 3 = **0.093 mm** (Nyquist)
- `repeatability` ≈ **0.003 mm** (sub-pixel estimate)
- ... and more

---

## Extending the System

### Add a new parameter

Edit `backend/knowledge/parameters.py` — add one entry to `PARAMETERS`.

### Add a new formula

Edit `backend/knowledge/formulas.py` — add one `_f(...)` entry to `FORMULAS`.
The engine picks it up automatically. SymPy derives the inverse at startup.

### Add cameras / lenses

Edit `backend/catalog/cameras.json` or `lenses.json`.

**No changes to the calculation engine are ever needed.**

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Implemented Parameter Categories

| Category | Parameters |
|----------|-----------|
| Camera | Resolution X/Y, Pixel Size, Sensor Width/Height/Diagonal, FPS, Bit Depth |
| Lens | Focal Length, Magnification, Working Distance, F-Number, NA, Distortion, Image Circle |
| Object | Width, Height, Thickness, Smallest Feature, Required Accuracy |
| Motion | Speed, Exposure Time, Motion Blur, Blur (px), Conveyor Speed, Encoder Resolution |
| Imaging | FOV X/Y, mm/pixel, pixel/mm, Pixels per Feature, Pixels per Object |
| Optics | DOF, Hyperfocal Distance, Airy Disk, Diffraction Limit |
| Lighting | Wavelength |
| Inspection | Repeatability, Measurement Error, Detectable Feature |

---

## Formula Library (28 formulas)

All with SymPy-derived inverses — total coverage: ~60 relationships.

Key formulas:
- `sensor_width = resolution_x × pixel_size / 1000`
- `magnification = focal_length / (working_distance − focal_length)`
- `fov_x = sensor_width / magnification`
- `mm_per_pixel = fov_x / resolution_x`
- `motion_blur = speed × exposure_time × 1e−6`
- `dof = 2 × f_number × (pixel_size/1000) × (1+M) / M²`
- `airy_disk = 2.44 × f_number × λ / 1000`
- `detectable_feature = mm_per_pixel × 3`  (Nyquist)
