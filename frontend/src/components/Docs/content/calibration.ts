import type { DocArticle } from '../types'

const CAT = 'Hiệu chuẩn & kiểm định'

export const CALIBRATION_DOCS: DocArticle[] = [
  {
    id: 'calib-lighting',
    title: 'Hiệu chuẩn chiếu sáng',
    category: CAT,
    moduleId: 'lighting',
    summary: 'Đo độ sáng, clipping, độ đồng đều, điểm nóng, nhiễu/SNR, nhấp nháy và dải động — cách chụp và ngưỡng đánh giá.',
    blocks: [
      { type: 'p', text: 'Mục tiêu: xác nhận ánh sáng **đủ, đều và ổn định** trước khi phát triển thuật toán. Module **Chiếu sáng** phân tích một chuỗi ảnh chụp một tấm nền đồng nhất.' },
      { type: 'h', text: 'Cách chụp ảnh' },
      {
        type: 'list', ordered: true,
        items: [
          'Đặt **tấm trắng/xám đồng nhất** (giấy trắng mờ, tấm khuếch tán, thẻ xám 18 %) tại mặt phẳng vật.',
          'Giữ nguyên exposure, gain, khẩu như khi sản xuất; tắt auto exposure/ auto gain.',
          'Chụp **≥ 5 ảnh liên tiếp** (10–30 ảnh tốt hơn) để đo nhiễu theo thời gian và nhấp nháy.',
          'Tuỳ chọn: 1 ảnh **white reference** (nền sáng gần bão hòa) và 1 **dark frame** (đậy nắp lens) để tính dải động.',
        ],
      },
      { type: 'h', text: 'Các chỉ số và cách tính' },
      {
        type: 'formula', title: 'Độ sáng',
        expr: 'Brightness (%) = μ / I_max × 100',
        where: [['μ', 'mức xám trung bình của ảnh trung bình'], ['I_max', '2^bit − 1 (255 với 8 bit)']],
        note: 'Đạt: 20–80 % · Cảnh báo: 10–20 % hoặc 80–90 % · Không đạt: còn lại. Clipping tối > 5 % hoặc clipping sáng > 1 % số pixel là lỗi.',
      },
      {
        type: 'formula', title: 'Độ đồng đều',
        expr: 'U_minmax (%) = I_min / I_max × 100\nU_cv (%) = (1 − σ / μ) × 100',
        note: 'Xuất sắc ≥ 95 % · Tốt ≥ 90 % · Chấp nhận ≥ 80 % · Kém < 80 % (theo U_minmax).',
      },
      {
        type: 'formula', title: 'Điểm nóng / vùng tối',
        expr: 'bright: I > μ + 2.5σ        shadow: I < μ − 2.5σ',
        note: 'Ảnh được làm mờ Gaussian trước khi tìm vùng; mức độ = |μ_vùng − μ| / σ.',
      },
      {
        type: 'formula', title: 'Nhiễu & SNR',
        expr: 'σ_temporal = trung bình std(I_t) theo từng pixel qua các ảnh\nSNR (dB) = 20 × log₁₀(μ / σ_noise)',
        note: 'Xuất sắc ≥ 40 dB · Tốt ≥ 25 dB · Kém < 25 dB.',
      },
      {
        type: 'formula', title: 'Nhấp nháy (flicker)',
        expr: 'Flicker (%) = std(μ_frame) / mean(μ_frame) × 100',
        note: 'Có nhấp nháy khi > 2 %. FFT của độ sáng theo khung cho tần số nhấp nháy (chu kỳ/khung). Cần ≥ 5 ảnh.',
      },
      {
        type: 'formula', title: 'Dải động',
        expr: 'DR (stops) = log₂((μ_white − μ_dark) / σ_dark)\nDR khả dụng = DR − 1',
      },
      {
        type: 'example', title: 'Đèn vòng trên tấm trắng',
        given: [['Ảnh 8 bit', 'μ = 140'], ['I_min / I_max', '128 / 151'], ['σ nhiễu', '1.2']],
        steps: [
          ['Độ sáng', '140 / 255 × 100 = 54.9 % → Đạt'],
          ['Độ đồng đều', '128 / 151 × 100 = 84.8 % → Chấp nhận'],
          ['SNR', '20 × log₁₀(140 / 1.2) = 41.3 dB → Xuất sắc'],
        ],
        result: 'Ánh sáng đủ và ít nhiễu nhưng **không đều** (tối ở góc). Thêm bộ khuếch tán, tăng khoảng cách đèn, hoặc dùng flat-field correction.',
      },
      {
        type: 'formula', title: 'Flat-field correction (bù không đều bằng phần mềm)',
        expr: 'I_corr = (I_raw − I_dark) × mean(I_white − I_dark) / (I_white − I_dark)',
      },
      { type: 'callout', tone: 'warn', text: 'Đèn chạy điện AC 50 Hz nhấp nháy 100 Hz. Dùng nguồn DC/ bộ điều khiển đèn chuyên dụng, hoặc đặt exposure là bội số của 10 ms khi buộc phải dùng đèn môi trường.' },
    ],
  },

  {
    id: 'calib-pixel',
    title: 'Hiệu chuẩn tỉ lệ mm/pixel',
    category: CAT,
    moduleId: 'geocal',
    summary: 'Cách đơn giản nhất để quy đổi pixel ra mm bằng vật chuẩn, và cách ước lượng độ không đảm bảo.',
    blocks: [
      { type: 'p', text: 'Khi chỉ cần quy đổi kích thước trong mặt phẳng vật (camera vuông góc, lens méo thấp), có thể hiệu chuẩn bằng một **vật chuẩn đã biết kích thước** (thước kính, căn mẫu, bàn cờ). Với yêu cầu cao hơn, dùng hiệu chuẩn hình học đầy đủ.' },
      {
        type: 'formula', title: 'Hệ số tỉ lệ',
        expr: 'k (mm/px) = L_ref / d_px\nδk / k = √((δL / L)² + (δd / d)²)',
        where: [['L_ref', 'khoảng cách thật trên vật chuẩn (mm)'], ['d_px', 'khoảng cách đo được trên ảnh (px, dò biên sub-pixel)']],
      },
      {
        type: 'list', ordered: true,
        items: [
          'Đặt vật chuẩn **đúng mặt phẳng đo** (cùng độ cao với bề mặt vật thật).',
          'Đo khoảng cách lớn (≥ 50 % FOV) để giảm sai số tương đối.',
          'Đo ở nhiều vị trí (tâm, 4 góc) và hai trục X/Y; chênh lệch lớn → lens méo hoặc camera nghiêng.',
          'Lấy trung bình nhiều lần đo; ghi lại nhiệt độ và cấu hình lens.',
        ],
      },
      {
        type: 'example', title: 'Bàn cờ ô 5 mm',
        given: [['Khoảng cách 10 ô', '50.000 ± 0.002 mm'], ['Đo trên ảnh', '1274.3 px (sai số dò biên ±0.14 px)']],
        steps: [
          ['Hệ số tỉ lệ', 'k = 50 / 1274.3 = 0.039237 mm/px'],
          ['Sai số tương đối', '√((0.002/50)² + (0.14/1274.3)²) = 0.012 %'],
          ['Ảnh hưởng trên FOV 96 mm', '96 × 0.012 % ≈ 0.011 mm'],
        ],
        result: 'k = **0.03924 mm/px**. Module Hình học tự tính tỉ lệ này từ trung vị khoảng cách giữa các góc bàn cờ liền kề.',
      },
    ],
  },

  {
    id: 'calib-geometric',
    title: 'Hiệu chuẩn hình học camera',
    category: CAT,
    moduleId: 'geocal',
    summary: 'Mô hình pinhole, ma trận nội K, méo xuyên tâm/tiếp tuyến, phương pháp Zhang, quy trình chụp và sai số reprojection.',
    blocks: [
      { type: 'p', text: 'Hiệu chuẩn hình học tìm các **thông số nội** (tiêu cự theo pixel, tâm ảnh, hệ số méo) và **thông số ngoại** (vị trí, góc của tấm hiệu chuẩn) từ nhiều ảnh của một mẫu phẳng đã biết. Module **Hình học** dùng `cv2.calibrateCamera` (phương pháp Zhang).' },
      {
        type: 'formula', title: 'Mô hình pinhole',
        expr: 's · [u, v, 1]ᵀ = K · [R | t] · [X, Y, Z, 1]ᵀ\n\n    ⎡ fx  0  cx ⎤\nK = ⎢  0 fy  cy ⎥\n    ⎣  0  0   1 ⎦',
        where: [['fx, fy', 'tiêu cự tính bằng pixel ≈ f / p'], ['cx, cy', 'tâm quang trên ảnh (px)'], ['R, t', 'phép quay & tịnh tiến của tấm hiệu chuẩn']],
      },
      {
        type: 'formula', title: 'Mô hình méo',
        expr: 'x_d = x(1 + k1·r² + k2·r⁴ + k3·r⁶) + 2·p1·x·y + p2·(r² + 2x²)\ny_d = y(1 + k1·r² + k2·r⁴ + k3·r⁶) + p1·(r² + 2y²) + 2·p2·x·y',
        where: [['x, y', 'tọa độ chuẩn hóa (chia cho fx, fy)'], ['r²', 'x² + y²'], ['k1, k2, k3', 'méo xuyên tâm: k1 < 0 thùng (barrel), k1 > 0 gối (pincushion)'], ['p1, p2', 'méo tiếp tuyến (cảm biến không song song lens)']],
      },
      { type: 'h', text: 'Quy trình chụp' },
      {
        type: 'list', ordered: true,
        items: [
          'In bàn cờ hoặc lưới chấm tròn bất đối xứng trên tấm **phẳng, cứng** (kính, nhôm, acrylic); đo chính xác kích thước ô.',
          'Cố định tiêu cự, khẩu, WD đúng như khi sản xuất — thay đổi bất kỳ thông số nào phải hiệu chuẩn lại.',
          'Chụp **15–30 ảnh** với tấm nghiêng ±30–45° theo nhiều hướng, phủ kín **cả 4 góc** ảnh.',
          'Ảnh nét, sáng đều, không bão hòa; toàn bộ góc của mẫu phải nằm trong ảnh.',
          'Trong ứng dụng: nhập **số góc trong** (bàn cờ 10 × 7 ô có 9 × 6 góc trong) và kích thước ô (mm).',
        ],
      },
      {
        type: 'formula', title: 'Sai số reprojection',
        expr: 'RMS = √( Σ ‖x_i − π(K, dist, R, t, X_i)‖² / n )',
        note: 'Xuất sắc < 0.3 px · Tốt < 0.6 px · Chấp nhận < 1.0 px · Kém ≥ 1.0 px.',
      },
      {
        type: 'table',
        head: ['Kết quả', 'Ý nghĩa / cách dùng'],
        rows: [
          ['K, hệ số méo', 'Dùng `cv2.undistort` / `initUndistortRectifyMap` trước khi đo.'],
          ['Pose từng ảnh', 'Góc Euler & vị trí tấm — kiểm tra độ phủ góc nghiêng.'],
          ['Homography', 'Ánh xạ mặt phẳng vật → ảnh, dùng chỉnh phối cảnh.'],
          ['mm/pixel', 'Tỉ lệ ở mặt phẳng tấm hiệu chuẩn.'],
          ['WD ước tính', 'Trung bình t_z của các pose.'],
          ['fx vs fy', 'Chênh > 1 % → kiểm tra cài đặt binning/ tỉ lệ pixel.'],
        ],
      },
      {
        type: 'example', title: 'Kiểm tra kết quả hiệu chuẩn',
        given: [['Lens', '25 mm'], ['Pixel', '3.45 µm'], ['Ảnh', '2448 × 2048'], ['k1 đo được', '−0.05'], ['mm/px', '0.0392']],
        steps: [
          ['fx lý thuyết', '25 / 0.00345 = 7246 px (kết quả hiệu chuẩn nên gần giá trị này)'],
          ['Bán kính chuẩn hóa ở góc ảnh', 'r = √(1224² + 1024²) / 7246 = 0.220'],
          ['Dịch chuyển do méo ở góc', '|k1| × r³ × fx = 0.05 × 0.0107 × 7246 = 3.9 px'],
          ['Quy ra mm', '3.9 × 0.0392 = 0.15 mm'],
        ],
        result: 'Méo 0.15 mm ở góc ảnh — không đáng kể cho phát hiện lỗi nhưng **bắt buộc phải undistort** cho đo lường chính xác.',
      },
    ],
  },

  {
    id: 'calib-color',
    title: 'Hiệu chuẩn màu',
    category: CAT,
    moduleId: 'color',
    summary: 'Cân bằng trắng, nhiệt độ màu, cân bằng xám, ColorChecker & ΔE, gamma và độ đồng đều màu.',
    blocks: [
      { type: 'p', text: 'Hiệu chuẩn màu đảm bảo camera tái tạo màu **đúng và nhất quán** giữa các trạm, các ngày. Module **Màu sắc** phân tích ảnh tấm trắng/xám, ColorChecker 24 ô hoặc ảnh tổng quát.' },
      {
        type: 'formula', title: 'Cân bằng trắng (trên vùng trung tính)',
        expr: 'gain_R = Ḡ / R̄        gain_G = 1        gain_B = Ḡ / B̄',
        note: 'Điểm WB = 100 − 200 × CV(R̄, Ḡ, B̄); > 85 là cân bằng.',
      },
      {
        type: 'formula', title: 'Nhiệt độ màu (McCamy)',
        expr: 'RGB tuyến tính → XYZ (D65) → x = X/(X+Y+Z), y = Y/(X+Y+Z)\nn = (x − 0.3320) / (y − 0.1858)\nCCT = −449n³ + 3525n² − 6823.3n + 5520.33',
      },
      {
        type: 'table',
        head: ['Nguồn sáng', 'CCT'],
        rows: [['A (đèn sợi đốt)', '2700–3300 K'], ['F11 (huỳnh quang)', '3900–4300 K'], ['D50', '4800–5300 K'], ['D65 (ánh sáng ngày)', '5500–6800 K'], ['D75', '> 7000 K']],
      },
      {
        type: 'formula', title: 'Cân bằng xám',
        expr: 'dev_c (%) = (c̄ − mean(R̄,Ḡ,B̄)) / mean × 100\nerror = max |dev_c|',
        note: 'Trung tính < 2 % · Nhẹ < 5 % · Vừa < 10 % · Nặng ≥ 10 %.',
      },
      { type: 'h', text: 'Độ chính xác màu với ColorChecker' },
      {
        type: 'formula', title: 'Sai khác màu ΔE',
        expr: 'sRGB → tuyến tính → XYZ → CIELAB\nΔE76 = √(ΔL² + Δa² + Δb²)\nΔE2000: có trọng số theo độ sáng, độ bão hòa, sắc độ',
        note: 'Mỗi ô: Đạt ΔE2000 < 3 · Cảnh báo < 6 · Không đạt ≥ 6. Điểm chính xác = 100 − 8 × ΔE2000 trung bình.',
      },
      {
        type: 'table',
        head: ['ΔE', 'Cảm nhận'],
        rows: [['< 1', 'Không nhận ra'], ['1–2', 'Chỉ chuyên gia nhận ra khi so sát'], ['2–3.5', 'Nhận ra khi so sánh'], ['3.5–5', 'Khác biệt rõ'], ['> 5', 'Là màu khác']],
      },
      {
        type: 'example', title: 'Cân bằng trắng trên thẻ xám',
        given: [['R̄, Ḡ, B̄', '118, 130, 104'], ['Ô đo / tham chiếu (Lab)', '(52.1, 10.3, 14.2) / (51.0, 12.0, 15.5)']],
        steps: [
          ['Gain đỏ', '130 / 118 = 1.102'],
          ['Gain xanh dương', '130 / 104 = 1.250'],
          ['ΔE76 của ô', '√(1.1² + 1.7² + 1.3²) = 2.41'],
        ],
        result: 'Đặt gain R = 1.10, B = 1.25 (ảnh đang ám vàng). Ô màu sai ΔE ≈ 2.4 → nhận ra khi so sánh nhưng vẫn Đạt.',
      },
      { type: 'h', text: 'Quy trình' },
      {
        type: 'list', ordered: true,
        items: [
          'Khóa exposure/gain, tắt auto white balance; chiếu sáng đều, 45°/0° để tránh lóa.',
          'Cân bằng trắng trên ô trung tính (hàng dưới ColorChecker) hoặc thẻ xám.',
          'Chụp ColorChecker lấp ~ 1/2 ảnh → đo ΔE từng ô.',
          'Nếu nhiều ô không đạt: tính **ma trận hiệu chỉnh màu 3×3 (CCM)** bằng bình phương tối thiểu M = argmin ‖M·RGB_đo − RGB_chuẩn‖.',
          'Gamma: ứng dụng ước lượng γ ≈ log(0.5) / log(median độ sáng); dùng γ = 1 (tuyến tính) cho đo lường, 2.2 cho hiển thị.',
          'Kiểm tra đồng đều màu trên lưới 16 × 16: U = (1 − σ/μ) × 100 — xuất sắc > 95 %, tốt > 88 %, chấp nhận > 75 %.',
        ],
      },
    ],
  },

  {
    id: 'image-quality',
    title: 'Đánh giá chất lượng ảnh',
    category: CAT,
    moduleId: 'quality',
    summary: 'Độ nét (Laplacian, Tenengrad, Brenner, FFT), nhiễu, tương phản, SNR/CNR, phơi sáng và điểm tổng hợp.',
    blocks: [
      { type: 'p', text: 'Module **Chất lượng ảnh** đo các chỉ số khách quan trên một ảnh, dùng để chỉnh nét, chỉnh phơi sáng và so sánh cấu hình. Các chỉ số độ nét phụ thuộc nội dung ảnh — hãy so sánh **tương đối** trên cùng một cảnh.' },
      {
        type: 'formula', title: 'Độ nét',
        expr: 'Laplacian variance = var(∇²I)\nTenengrad = mean(Gx² + Gy²)      (Sobel)\nBrenner = mean((I(y+2) − I(y))²)\nFFT ratio = năng lượng tần số cao / tổng năng lượng',
        note: 'Laplacian (8 bit): ≥ 1000 nét · ≥ 100 chấp nhận · < 100 mờ. Ứng dụng phân biệt mờ chuyển động/ mất nét qua hướng phổ FFT.',
      },
      {
        type: 'formula', title: 'Nhiễu (ước lượng từ 1 ảnh)',
        expr: 'residual = |I − Gaussian(I)|\nσ ≈ 1.4826 × MAD(residual)',
      },
      {
        type: 'formula', title: 'Tương phản',
        expr: 'Michelson = (I_max − I_min) / (I_max + I_min)\nRMS = std(I / I_max)',
        note: 'RMS > 0.2 cao · > 0.08 trung bình · ≤ 0.08 thấp.',
      },
      {
        type: 'formula', title: 'SNR & CNR',
        expr: 'SNR (dB) = 20 × log₁₀(μ / σ)\nCNR (dB) = 20 × log₁₀(|μ_tâm − μ_góc| / σ_góc)',
      },
      {
        type: 'formula', title: 'Điểm tổng hợp',
        expr: 'Score = 0.25·Nét + 0.20·Nhiễu + 0.20·Tương phản + 0.20·Phơi sáng + 0.15·SNR',
        note: '≥ 85 Xuất sắc · ≥ 65 Tốt · ≥ 45 Chấp nhận · < 45 Kém. Ứng dụng cũng tính điểm riêng cho AI, OCR, đo lường, phát hiện lỗi… với trọng số khác nhau.',
      },
      {
        type: 'example', title: 'Chỉnh nét lens',
        given: [['Vòng 1', 'Laplacian = 420'], ['Vòng 2', 'Laplacian = 1350'], ['Vòng 3', 'Laplacian = 980']],
        steps: [
          ['Xoay vòng nét, chụp ảnh tại mỗi vị trí', 'giữ nguyên ánh sáng & cảnh'],
          ['Chọn vị trí có chỉ số lớn nhất', 'vòng 2: 1350 ≥ 1000 → "nét"'],
          ['Kiểm tra focus map', 'các ô ở góc không thấp hơn tâm quá nhiều'],
        ],
        result: 'Khóa vòng nét ở vị trí 2. Nếu góc mờ hơn tâm rõ rệt → lens nghiêng hoặc độ cong trường ảnh.',
      },
      {
        type: 'table',
        head: ['Phơi sáng', 'Tiêu chí'],
        rows: [['Đạt', 'Độ sáng 10–90 %, pixel < 3 % ít hơn 10 %, pixel > 97 % ít hơn 2 %'], ['Không đạt', '> 10 % pixel quá sáng, > 30 % quá tối, hoặc độ sáng < 5 % / > 95 %']],
      },
    ],
  },

  {
    id: 'image-comparison',
    title: 'So sánh ảnh (A/B)',
    category: CAT,
    moduleId: 'comparison',
    summary: 'Chọn cấu hình tốt nhất giữa nhiều ảnh: chuẩn hóa chỉ số, trọng số, MSE/PSNR/SSIM.',
    blocks: [
      { type: 'p', text: 'Khi thử nhiều phương án (đèn, góc chiếu, lens, F-number), chụp cùng một mẫu với từng phương án rồi đưa vào module **So sánh ảnh**. Các chỉ số được chuẩn hóa 0–100 **trong lô** ảnh và cộng theo trọng số để xếp hạng.' },
      {
        type: 'formula', title: 'Điểm tổng hợp',
        expr: 'Score = w_s·Nét + w_n·Nhiễu + w_c·Tương phản + w_b·Độ sáng + w_e·Entropy',
        note: 'Mặc định: 0.4 / 0.2 / 0.2 / 0.1 / 0.1. Độ sáng tốt nhất khi gần 50 %.',
      },
      {
        type: 'formula', title: 'So sánh từng cặp',
        expr: 'MSE = mean((I₁ − I₂)²)\nPSNR (dB) = 10 × log₁₀(I_max² / MSE)\nSSIM = (2μ₁μ₂ + C₁)(2σ₁₂ + C₂) / ((μ₁² + μ₂² + C₁)(σ₁² + σ₂² + C₂))',
        note: 'PSNR > 40 dB gần như giống hệt · 30–40 dB khá giống · < 20 dB khác nhiều. SSIM = 1 là giống hoàn toàn về cấu trúc.',
      },
      {
        type: 'example', title: 'Độ ổn định giữa 2 lần chụp',
        given: [['Ảnh 8 bit', 'I_max = 255'], ['MSE giữa 2 ảnh', '25']],
        steps: [['PSNR', '10 × log₁₀(255² / 25) = 34.2 dB']],
        result: 'Hai ảnh khá giống; nếu là cùng một cảnh tĩnh thì vẫn còn nhiễu/ nhấp nháy đáng kể — kiểm tra lại ở module Chiếu sáng.',
      },
    ],
  },

  {
    id: 'validation',
    title: 'Kiểm định hệ thống vision',
    category: CAT,
    moduleId: 'validation',
    summary: 'Độ lặp lại Cp/Cpk, độ chính xác, GR&R (ANOVA), chỉ số AI, OCR, thời gian xử lý và độ ổn định.',
    blocks: [
      { type: 'p', text: 'Trước khi đưa vào sản xuất, hệ thống phải chứng minh **đo lặp lại được, đúng và đủ nhanh**. Module **Kiểm định** nhận dữ liệu số (không cần ảnh) và tính các chỉ số theo chuẩn MSA/SPC.' },
      {
        type: 'formula', title: 'Độ lặp lại & năng lực',
        expr: 'Cp  = (USL − LSL) / (6σ)\nCpk = min(USL − μ, μ − LSL) / (3σ)',
        note: 'Đo cùng một mẫu ≥ 30 lần. Cpk ≥ 1.33 có năng lực · ≥ 1.0 biên · < 1.0 không đạt.',
      },
      {
        type: 'formula', title: 'Độ chính xác (so với thiết bị chuẩn, ví dụ CMM)',
        expr: 'Bias = mean(m − r)     MAE = mean|m − r|\nRMSE = √mean((m − r)²)    MAPE = mean(|m − r| / |r|) × 100',
      },
      {
        type: 'formula', title: 'GR&R (ANOVA)',
        expr: '%GRR = 5.15 × σ_GRR / Tolerance × 100   (có dung sai)\n%GRR = σ_GRR / σ_total × 100           (không có dung sai)\nσ²_GRR = σ²_EV (lặp lại) + σ²_AV (tái lập)\nndc = 1.41 × σ_parts / σ_GRR',
        note: 'Thiết kế điển hình: 3 người × 10 mẫu × 3 lần. %GRR < 10 % đạt · 10–30 % biên · > 30 % không đạt. ndc ≥ 5.',
      },
      {
        type: 'formula', title: 'AI / phân loại',
        expr: 'Precision = TP / (TP + FP)     Recall = TP / (TP + FN)\nF1 = 2 · P · R / (P + R)',
        note: 'F1 ≥ 0.95 xuất sắc · ≥ 0.85 tốt. Bài toán 2 lớp có điểm tin cậy → ROC-AUC và PR-AUC.',
      },
      {
        type: 'formula', title: 'OCR',
        expr: 'CER = Σ Levenshtein(ký tự) / tổng ký tự × 100\nWER = số từ sai / tổng từ × 100',
        note: 'Độ chính xác ký tự = 100 − CER: ≥ 99 % xuất sắc, ≥ 97 % tốt.',
      },
      {
        type: 'formula', title: 'Thời gian xử lý & độ ổn định',
        expr: 'fps = 1000 / mean(ms)       p95, p99 = phân vị thời gian\nPass rate = số lần đạt / tổng × 100',
        note: 'fps / fps_mục tiêu ≥ 1.2 xuất sắc, ≥ 1.0 tốt, ≥ 0.8 biên. Pass rate ≥ 99.9 % xuất sắc, ≥ 99 % tốt, ≥ 95 % chấp nhận. Luôn xét p99, không chỉ trung bình.',
      },
      {
        type: 'example', title: 'Đo đường kính 10 ± 0.05 mm',
        given: [['USL / LSL', '10.05 / 9.95'], ['μ, σ (30 lần đo)', '10.008, 0.009 mm'], ['σ_GRR', '0.002 mm'], ['Dung sai', '0.1 mm']],
        steps: [
          ['Cp', '0.1 / (6 × 0.009) = 1.85'],
          ['Cpk', 'min(0.042, 0.058) / (3 × 0.009) = 1.56 ≥ 1.33 ✓'],
          ['%GRR', '5.15 × 0.002 / 0.1 × 100 = 10.3 % → biên'],
        ],
        result: 'Quá trình có năng lực, nhưng hệ đo ở mức **biên** — cải thiện chiếu sáng/ cố định vật để σ_GRR < 0.0019 mm.',
      },
      {
        type: 'table',
        caption: 'Trọng số điểm tổng hợp (chuẩn hóa lại trên các mục có dữ liệu).',
        head: ['Mục', 'Trọng số'],
        rows: [['AI', '25 %'], ['Độ lặp lại', '15 %'], ['OCR', '15 %'], ['Độ ổn định', '15 %'], ['Độ chính xác', '10 %'], ['GR&R', '10 %'], ['Thời gian xử lý', '10 %']],
      },
    ],
  },
]
