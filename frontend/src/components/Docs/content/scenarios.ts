import type { DocArticle } from '../types'

const CAT = 'Bài toán vision'

export const SCENARIO_DOCS: DocArticle[] = [
  {
    id: 'scenario-static',
    title: 'Bài toán chụp ảnh tĩnh',
    category: CAT,
    scenarioId: 'static',
    summary: 'Vật đứng yên khi chụp: thiết kế trọn vẹn từ yêu cầu tới camera, lens, F-number — kèm ví dụ đầy đủ.',
    blocks: [
      { type: 'p', text: 'Vật được dừng lại khi chụp (bàn xoay index, băng tải dừng, robot đặt vật). Vì không có chuyển động, thời gian phơi sáng có thể dài (1–20 ms) và chiếu sáng dễ dàng. Trọng tâm là **FOV, độ phân giải và độ sâu trường ảnh**.' },
      { type: 'h', text: 'Trình tự tính toán' },
      {
        type: 'list', ordered: true,
        items: [
          'FOV_x = L_x × (1 + margin) — xem bài **FOV & độ phân giải**.',
          'Chọn camera sao cho N_x ≥ FOV_x × k / d_min (k = 3 cho phát hiện lỗi).',
          'M = W_sensor / FOV_x; kiểm tra FOV_y = N_y × mm/px ≥ chiều cao vật.',
          'Biết WD → f = WD × M / (1 + M); biết f → WD = f × (1 + 1/M). Làm tròn về lens chuẩn.',
          'Chọn F-number: DOF ≥ độ dày vật và đĩa Airy ≤ 2 pixel.',
          'Chọn chiếu sáng theo bề mặt vật.',
        ],
      },
      {
        type: 'example', title: 'Kiểm tra vết xước nắp nhựa (thiết kế đầy đủ)',
        given: [['Vật', '80 × 60 × 5 mm'], ['Vết xước nhỏ nhất', '0.2 mm'], ['Biên dư', '20 %'], ['WD lắp đặt', '≈ 300 mm'], ['Đèn', 'xanh lá 525 nm']],
        steps: [
          ['FOV ngang', '80 × 1.2 = 96 mm'],
          ['Độ phân giải tối thiểu', '96 × 3 / 0.2 = 1440 px → chọn IMX264 2448 × 2048, 3.45 µm'],
          ['Kích thước cảm biến', '2448 × 3.45 / 1000 = 8.45 mm (2/3")'],
          ['mm/pixel và pixel/vết xước', '96 / 2448 = 0.0392 mm/px → 0.2 / 0.0392 = 5.1 px'],
          ['FOV dọc', '2048 × 0.0392 = 80.3 mm ≥ 60 mm ✓'],
          ['Độ phóng đại', 'M = 8.45 / 96 = 0.088'],
          ['Tiêu cự', 'f = 300 × 0.088 / 1.088 = 24.3 mm → lens 25 mm, WD ≈ 309 mm'],
          ['DOF ở F5.6', '2 × 5.6 × 0.00345 × 1.088 / 0.088² = 5.4 mm ≥ 5 mm ✓'],
          ['Nhiễu xạ ở F5.6', '2.44 × 0.525 × 5.6 = 7.2 µm ≈ 2.1 px ✓'],
        ],
        result: 'Camera **5 MP 2/3"** + lens **25 mm F5.6**, WD ≈ 309 mm. Mở bài toán "Chụp ảnh tĩnh" trong ứng dụng để xem các bước tính tự động.',
      },
      { type: 'callout', tone: 'tip', title: 'Checklist trước khi đặt hàng', text: 'Vòng ảnh lens ≥ đường chéo cảm biến · Ngàm lens khớp camera · WD ≥ MOD của lens · Độ phân giải lens phù hợp kích thước pixel · Không gian lắp đặt đủ cho WD + chiều dài lens + camera.' },
    ],
  },

  {
    id: 'scenario-dynamic',
    title: 'Bài toán chụp ảnh động (vật chuyển động)',
    category: CAT,
    scenarioId: 'dynamic',
    summary: 'Vật chạy trên băng tải: nhòe chuyển động, phơi sáng tối đa, FPS cần thiết, trigger và strobe.',
    blocks: [
      { type: 'p', text: 'Khi vật chuyển động trong lúc phơi sáng, ảnh bị **nhòe theo hướng chuyển động**. Độ nhòe phải nhỏ hơn mức cho phép (thường ≤ 1 pixel). Đồng thời camera phải chụp đủ nhanh để không bỏ sót vật hoặc vùng nào.' },
      {
        type: 'formula', title: 'Nhòe chuyển động',
        expr: 'blur (mm) = v × t × 10⁻⁶\nblur (px) = v × t × 10⁻⁶ / (mm/px)',
        where: [['v', 'tốc độ vật (mm/s); 1 m/phút = 16.67 mm/s'], ['t', 'thời gian phơi sáng (µs)']],
      },
      {
        type: 'formula', title: 'Phơi sáng tối đa',
        expr: 't_max (µs) = B × (mm/px) / v × 10⁶',
        where: [['B', 'nhòe cho phép (px): 0.25–0.5 đo lường, 1 phát hiện lỗi, 2 kiểm tra có/không']],
      },
      {
        type: 'formula', title: 'FPS cần thiết khi chụp liên tục',
        expr: 'fps_req = v / (FOV_y × (1 − overlap/100))\nfps_req ≥ số vật/phút / 60   (khi trigger theo vật)',
        note: 'Giả sử vật chạy theo trục dọc (Y) của ảnh. Nếu vật chạy theo X, thay FOV_y bằng FOV_x.',
      },
      {
        type: 'example', title: 'Băng tải 30 m/phút',
        given: [['v', '500 mm/s (30 m/phút)'], ['mm/px', '0.0392'], ['FOV_y', '80.3 mm'], ['Phơi sáng hiện tại', '100 µs'], ['Nhòe cho phép', '1 px'], ['Chồng lấn', '20 %']],
        steps: [
          ['Nhòe thực tế', '500 × 100 × 10⁻⁶ = 0.05 mm = 0.05 / 0.0392 = 1.28 px ✗'],
          ['Phơi sáng tối đa', '1 × 0.0392 / 500 × 10⁶ = 78 µs'],
          ['FPS cần khi chụp liên tục', '500 / (80.3 × 0.8) = 7.8 fps'],
          ['Khoảng cách trigger tối đa', '80.3 × 0.8 = 64 mm'],
        ],
        result: 'Giảm phơi sáng xuống **≤ 78 µs** (dùng strobe), camera 30 fps là đủ. Sai số vị trí do jitter trigger 100 µs = 500 × 100 × 10⁻⁶ = 0.05 mm.',
      },
      { type: 'h', text: 'Trigger & đồng bộ' },
      {
        type: 'list',
        items: [
          '**Cảm biến quang (photo-eye)**: phát hiện vật → trễ = khoảng cách cảm biến–tâm FOV / v → trigger camera.',
          '**Encoder**: trigger theo quãng đường, không phụ thuộc tốc độ thay đổi — chính xác nhất.',
          'Dùng **global shutter**. Rolling shutter làm vật chạy bị xiên.',
          'Đèn strobe đồng bộ với tín hiệu exposure của camera (Exposure Active / Strobe Out).',
          'Thời gian xử lý mỗi ảnh phải < chu kỳ giữa 2 vật, nếu không cần xử lý song song/ hàng đợi.',
        ],
      },
      { type: 'callout', tone: 'warn', text: 'Thời gian phơi sáng ngắn làm ảnh tối — ước lượng ngân sách ánh sáng (bài **Chiếu sáng**) trước khi chốt tốc độ dây chuyền.' },
    ],
  },

  {
    id: 'scenario-linescan',
    title: 'Bài toán quét dòng (line scan)',
    category: CAT,
    scenarioId: 'linescan',
    summary: 'Line rate, chu kỳ dòng, bộ chia encoder và chiếu sáng cho camera line scan.',
    blocks: [
      { type: 'p', text: 'Camera line scan có 1 (hoặc vài) dòng pixel rất dài (2k–16k). Ảnh 2D được ghép từ các dòng liên tiếp khi vật chạy qua. Chiều ngang ảnh do cảm biến quyết định; chiều dọc do **tần số quét dòng so với tốc độ vật** quyết định. Phù hợp cho vật liệu cuộn (giấy, vải, màng, thép tấm), vật rất dài hoặc mặt trụ xoay.' },
      {
        type: 'formula', title: 'Pixel vuông',
        expr: 'mm/px = FOV_x / N\nline_rate (Hz) = v / (mm/px)\nT_line (µs) = 10⁶ / line_rate',
        note: 'Line rate thấp hơn → ảnh bị kéo giãn; cao hơn → bị nén. Thời gian phơi sáng mỗi dòng phải ≤ T_line.',
      },
      {
        type: 'formula', title: 'Encoder',
        expr: 'xung/mm = PPR × 4 / (π × D_bánh)\nxung/dòng = (xung/mm) × (mm/px)',
        where: [['PPR', 'số xung/vòng của encoder (×4 khi đếm cả 2 sườn kênh A/B)'], ['D_bánh', 'đường kính bánh đo (mm)']],
        note: 'Bộ chia (divider) trên frame grabber/camera phải là số nguyên; nếu xung/dòng < 1 thì encoder quá thô.',
      },
      {
        type: 'example', title: 'Kiểm tra màng nhựa rộng 500 mm',
        given: [['Camera', '4k × 7 µm (28.7 mm)'], ['Bề rộng', '500 mm + 10 %'], ['v', '1000 mm/s (60 m/phút)'], ['Encoder', '1000 PPR, bánh chu vi 200 mm'], ['Line rate tối đa', '40 kHz']],
        steps: [
          ['mm/pixel', '550 / 4096 = 0.134 mm/px'],
          ['Line rate cần', '1000 / 0.134 = 7447 Hz = 7.45 kHz ≤ 40 kHz ✓'],
          ['Chu kỳ dòng', '10⁶ / 7447 = 134 µs → phơi sáng ≤ 134 µs'],
          ['Độ phân giải encoder', '1000 × 4 / 200 = 20 xung/mm'],
          ['Xung mỗi dòng', '20 × 0.134 = 2.69 → bộ chia 3 → pixel dọc 0.15 mm (dài hơn 11.7 %)'],
          ['Độ phóng đại & tiêu cự (WD 600 mm)', 'M = 28.7 / 550 = 0.052 → f = 600 × 0.052 / 1.052 = 29.7 mm'],
        ],
        result: 'Line rate 7.45 kHz dư thừa so với camera. Để pixel vuông hơn, dùng encoder **2500 PPR** (50 xung/mm → 6.7 ≈ 7 xung/dòng, lệch 4 %) hoặc bộ chia phân số của frame grabber. Lens cần vòng ảnh ≥ 28.7 mm (ngàm F/M42).',
      },
      { type: 'callout', tone: 'warn', text: 'Thời gian phơi sáng mỗi dòng rất ngắn (vài chục µs) nên cần **đèn line LED công suất cao, hội tụ** đúng vạch quét. Với ánh sáng yếu, cân nhắc camera **TDI** (cộng dồn nhiều dòng).' },
    ],
  },

  {
    id: 'scenario-measurement',
    title: 'Bài toán đo kích thước chính xác',
    category: CAT,
    scenarioId: 'measurement',
    summary: 'Quy tắc 10:1, sub-pixel, ngân sách sai số, sai số phối cảnh và khi nào cần lens telecentric.',
    blocks: [
      { type: 'p', text: 'Đo bằng camera là bài toán khắt khe nhất: hệ thống phải có **độ phân giải đo** nhỏ hơn nhiều lần dung sai, ổn định theo thời gian, và được hiệu chuẩn. Ứng dụng giả định thuật toán dò biên sub-pixel đạt sai số ≈ 1/3 pixel và độ lặp lại ≈ 1/10 pixel.' },
      {
        type: 'formula', title: 'Từ dung sai đến camera',
        expr: 'Độ chính xác yêu cầu  A = T / 10\nmm/px tối đa          = 3 × A\nN_x tối thiểu         = FOV_x / (3 × A)',
        where: [['T', 'dải dung sai = USL − LSL (mm)'], ['10', 'quy tắc 10:1 cho năng lực thiết bị đo']],
      },
      {
        type: 'formula', title: 'Sai số phối cảnh (lens thường)',
        expr: 'ΔL ≈ L × Δz / WD',
        where: [['L', 'kích thước đo (mm)'], ['Δz', 'độ lệch chiều cao vật so với mặt phẳng hiệu chuẩn (mm)']],
        note: 'Với lens telecentric, ΔL ≈ 0 trong phạm vi DOF.',
      },
      { type: 'h', text: 'Ngân sách sai số' },
      {
        type: 'list',
        items: [
          'Lượng tử hóa pixel và thuật toán dò biên (≈ 1/3 px).',
          'Méo lens — hiệu chuẩn hình học để loại bỏ (module **Hình học**).',
          'Phối cảnh khi vật thay đổi độ cao hoặc nghiêng.',
          'Chiếu sáng: biên mờ, phản xạ, bóng đổ dịch vị trí biên. Backlight cho biên sắc nhất.',
          'Nhiệt độ, rung động cơ khí, độ chính xác tấm hiệu chuẩn.',
        ],
      },
      {
        type: 'example', title: 'Đo đường kính 10 ± 0.025 mm',
        given: [['Dung sai', '0.05 mm'], ['Vùng đo', '40 × 30 mm, biên 10 %'], ['Lệch Z', '2 mm'], ['WD', '200 mm']],
        steps: [
          ['Độ chính xác yêu cầu', 'A = 0.05 / 10 = 0.005 mm'],
          ['mm/pixel tối đa', '3 × 0.005 = 0.015 mm/px'],
          ['Độ phân giải tối thiểu', '44 / 0.015 = 2934 px → chọn 12 MP (4096 × 3000, 3.45 µm)'],
          ['mm/pixel thực tế', '44 / 4096 = 0.0107 mm/px'],
          ['Sai số & độ lặp lại ước tính', '0.0107 / 3 = 0.0036 mm ✓; 0.0107 / 10 = 0.0011 mm'],
          ['Sai số phối cảnh', '40 × 2 / 200 = 0.4 mm ≫ 0.005 mm ✗'],
          ['DOF với lens thường ở F8', 'M = 0.321 → DOF = 0.71 mm < 2 mm ✗'],
        ],
        result: 'Camera 12 MP đủ độ phân giải, nhưng lens thường **không dùng được** vì sai số phối cảnh và DOF. Dùng **lens telecentric 0.3×** (FOV = 14.1 / 0.3 = 47 mm) hoặc cố định chính xác độ cao vật.',
      },
      { type: 'callout', tone: 'info', title: 'Sau khi lắp đặt', text: '1) Hiệu chuẩn méo + mm/pixel bằng bàn cờ (module **Hình học**). 2) Đo mẫu chuẩn ≥ 30 lần → Cp/Cpk. 3) Đánh giá **GR&R** (module **Kiểm định**): %GRR < 10 % là đạt.' },
    ],
  },

  {
    id: 'scenario-code',
    title: 'Bài toán đọc mã / OCR',
    category: CAT,
    scenarioId: 'code',
    summary: 'Số pixel trên mỗi module mã, chiều cao ký tự OCR và chiếu sáng cho mã in/khắc.',
    blocks: [
      { type: 'p', text: 'Đầu đọc mã cần đủ pixel trên **module** — ô vuông nhỏ nhất của mã 2D hoặc vạch hẹp nhất của mã 1D. FOV phải chứa mã ở mọi vị trí có thể xuất hiện, nên biên dư thường lớn (30–50 %).' },
      {
        type: 'formula', title: 'Điều kiện đọc',
        expr: 'mm/px ≤ module / k',
        where: [['module', 'kích thước ô (mm), ghi trong tiêu chuẩn in mã hoặc đo trên mẫu'], ['k', 'số pixel/module yêu cầu']],
      },
      {
        type: 'table',
        head: ['Loại mã', 'Tối thiểu', 'Khuyến nghị'],
        rows: [
          ['Barcode 1D (vạch hẹp)', '1.5 px', '2–3 px'],
          ['QR / DataMatrix in', '3 px', '4–6 px'],
          ['DataMatrix khắc/chấm (DPM)', '5 px', '6–8 px'],
          ['OCR', 'nét 2 px, cao 16 px', 'nét ≥ 3 px, cao 20–30 px'],
        ],
      },
      {
        type: 'example', title: 'DataMatrix 0.25 mm trên nhãn',
        given: [['Vùng nhãn', '30 × 20 mm, biên 30 %'], ['Module', '0.25 mm'], ['Camera', '1440 × 1080, 3.45 µm'], ['WD', '150 mm']],
        steps: [
          ['FOV ngang', '30 × 1.3 = 39 mm'],
          ['mm/pixel', '39 / 1440 = 0.0271 mm/px'],
          ['Pixel / module', '0.25 / 0.0271 = 9.2 px ≥ 4 ✓'],
          ['FOV dọc', '1080 × 0.0271 = 29.3 mm ≥ 20 ✓'],
          ['Tiêu cự', 'M = 4.97 / 39 = 0.127 → f = 150 × 0.127 / 1.127 = 16.9 mm → lens 16 mm'],
        ],
        result: 'Dư thừa độ phân giải (9 px/module) — có thể tăng biên dư hoặc dùng camera 0.4 MP rẻ hơn (720 px → 4.6 px/module).',
      },
      { type: 'h', text: 'Chiếu sáng cho mã' },
      {
        type: 'list',
        items: [
          'Nhãn giấy/nhựa bóng: đèn bar chiếu xiên 30–45° để tránh lóa, hoặc kính phân cực.',
          'Mã khắc laser/chấm (DPM) trên kim loại: **dome** hoặc **low-angle** để làm nổi chấm.',
          'Mã in mực đỏ/ cam: dùng đèn đỏ sẽ làm mã biến mất — chọn màu bù.',
          'Đánh giá chất lượng in theo ISO/IEC 15415 (2D) hoặc 15416 (1D) khi cần.',
        ],
      },
    ],
  },
]
