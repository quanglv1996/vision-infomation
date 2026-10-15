import type { DocArticle } from '../types'

const CAT = 'Nền tảng'

export const FUNDAMENTALS: DocArticle[] = [
  {
    id: 'overview',
    title: 'Tổng quan hệ thống machine vision',
    category: CAT,
    summary: 'Các thành phần của một hệ vision công nghiệp, quy trình thiết kế 7 bước và thuật ngữ cơ bản.',
    blocks: [
      { type: 'p', text: 'Một hệ thống machine vision thay mắt người kiểm tra sản phẩm trên dây chuyền: **chụp ảnh → xử lý → ra quyết định → gửi tín hiệu** cho PLC/robot. Chất lượng của cả hệ thống phụ thuộc trước hết vào **ảnh đầu vào** — thuật toán tốt không cứu được ảnh xấu. Vì vậy việc chọn camera, lens và chiếu sáng phải được **tính toán** chứ không phải chọn theo cảm tính.' },
      { type: 'h', text: 'Các thành phần chính' },
      {
        type: 'table',
        head: ['Thành phần', 'Vai trò', 'Thông số cần quan tâm'],
        rows: [
          ['Vật & đồ gá', 'Đưa vật vào vùng chụp ở vị trí lặp lại', 'Kích thước, dung sai vị trí, tốc độ, độ dày'],
          ['Chiếu sáng', 'Tạo tương phản giữa đặc trưng cần thấy và nền', 'Kỹ thuật chiếu, bước sóng, cường độ, strobe'],
          ['Lens', 'Chiếu ảnh vật lên cảm biến với độ phóng đại mong muốn', 'Tiêu cự, khẩu độ F, WD, vòng ảnh, méo'],
          ['Camera', 'Biến ảnh quang học thành ảnh số', 'Độ phân giải, kích thước pixel, shutter, FPS, giao tiếp'],
          ['Trigger & I/O', 'Đồng bộ thời điểm chụp với chuyển động', 'Cảm biến quang, encoder, độ trễ, jitter'],
          ['Xử lý', 'Phân tích ảnh và ra quyết định', 'Thuật toán, thời gian chu kỳ, độ lặp lại'],
        ],
      },
      { type: 'h', text: 'Quy trình thiết kế 7 bước' },
      {
        type: 'list', ordered: true,
        items: [
          '**Xác định yêu cầu**: vật cần chụp, chi tiết/khuyết tật nhỏ nhất, dung sai đo, tốc độ dây chuyền, thời gian chu kỳ.',
          '**Chọn kiểu chụp**: chụp tĩnh, chụp động (area scan) hay quét dòng (line scan).',
          '**Tính FOV và độ phân giải** → chọn camera (số pixel, kích thước pixel).',
          '**Tính độ phóng đại** → tiêu cự lens và khoảng cách làm việc (WD).',
          '**Kiểm tra giới hạn quang học**: độ sâu trường ảnh (DOF), nhiễu xạ, nhòe chuyển động.',
          '**Chọn chiếu sáng**: kỹ thuật, bước sóng, cường độ đủ cho thời gian phơi sáng.',
          '**Hiệu chuẩn và kiểm định**: hiệu chuẩn hình học/màu/chiếu sáng, đánh giá độ lặp lại và GR&R.',
        ],
      },
      { type: 'h', text: 'Chọn bài toán phù hợp' },
      {
        type: 'table',
        head: ['Bài toán', 'Khi nào dùng', 'Thông số then chốt'],
        rows: [
          ['Chụp ảnh tĩnh', 'Vật dừng khi chụp (bàn xoay, robot gắp đặt)', 'FOV, mm/pixel, DOF'],
          ['Chụp ảnh động', 'Vật chạy liên tục trên băng tải', 'Phơi sáng tối đa, nhòe, FPS, strobe'],
          ['Line scan', 'Vật liệu cuộn, tấm lớn, vật trụ xoay', 'Line rate, encoder, cường độ sáng'],
          ['Đo kích thước', 'Đo đường kính, khoảng cách, vị trí với dung sai chặt', 'Quy tắc 10:1, sub-pixel, lens telecentric'],
          ['Đọc mã / OCR', 'Barcode, QR, DataMatrix, ký tự in', 'Số pixel / module, độ tương phản'],
        ],
      },
      { type: 'h', text: 'Thuật ngữ' },
      {
        type: 'table',
        head: ['Thuật ngữ', 'Ý nghĩa'],
        rows: [
          ['FOV (Field of View)', 'Vùng nhìn thấy trên mặt phẳng vật, đơn vị mm.'],
          ['WD (Working Distance)', 'Khoảng cách từ mặt trước lens đến vật.'],
          ['mm/pixel', 'Kích thước thật mà 1 pixel đại diện — "độ phân giải không gian".'],
          ['M (Magnification)', 'Độ phóng đại = kích thước ảnh trên cảm biến / kích thước vật.'],
          ['F-number (N)', 'Tiêu cự / đường kính khẩu. N lớn → khẩu nhỏ → tối hơn, DOF sâu hơn.'],
          ['DOF (Depth of Field)', 'Khoảng dịch chuyển theo Z mà ảnh vẫn đủ nét.'],
          ['Exposure', 'Thời gian cảm biến tích lũy ánh sáng cho 1 ảnh (µs).'],
          ['Sub-pixel', 'Thuật toán xác định biên/tâm chính xác hơn 1 pixel (1/3 – 1/10 px).'],
          ['Telecentric', 'Lens có độ phóng đại không đổi theo khoảng cách — không có sai số phối cảnh.'],
        ],
      },
      { type: 'callout', tone: 'tip', title: 'Bắt đầu nhanh', text: 'Mở **Thiết kế hệ vision → Theo bài toán**, chọn bài toán gần nhất với ứng dụng của bạn. Mọi ô nhập đều có danh sách giá trị phổ biến; chọn **Khác…** để nhập giá trị riêng.' },
    ],
  },

  {
    id: 'sensor',
    title: 'Cảm biến & camera',
    category: CAT,
    summary: 'Độ phân giải, kích thước pixel, định dạng cảm biến, global/rolling shutter và băng thông giao tiếp.',
    blocks: [
      { type: 'p', text: 'Cảm biến là một ma trận pixel. Hai thông số quyết định mọi tính toán phía sau là **số pixel** (N_x × N_y) và **kích thước pixel** p (µm). Từ đó suy ra kích thước vật lý của cảm biến — thông số dùng để chọn lens.' },
      {
        type: 'formula', title: 'Kích thước cảm biến',
        expr: 'W = N_x × p / 1000\nH = N_y × p / 1000\nD = √(W² + H²)',
        where: [['W, H', 'chiều rộng, chiều cao cảm biến (mm)'], ['N_x, N_y', 'số pixel ngang, dọc'], ['p', 'kích thước pixel (µm)'], ['D', 'đường chéo (mm) — lens phải có vòng ảnh ≥ D']],
      },
      {
        type: 'table',
        caption: 'Định dạng "inch" là quy ước lịch sử (≈ 2/3 đường kính ống vidicon), không phải kích thước thật — luôn tính từ N × p.',
        head: ['Định dạng', 'Kích thước (mm)', 'Đường chéo', 'Ví dụ cảm biến'],
        rows: [
          ['1/2.9"', '4.97 × 3.73', '6.2 mm', 'IMX287 (0.4 MP), IMX273 (1.6 MP)'],
          ['1/1.8"', '7.07 × 5.30', '8.8 mm', 'IMX252 (3.2 MP)'],
          ['2/3"', '8.45 × 7.07', '11.0 mm', 'IMX264 / IMX250 (5 MP)'],
          ['1"', '13.1 × 8.8', '15.8 mm', 'IMX183 (20 MP)'],
          ['1.1"', '14.1 × 10.4', '17.5 mm', 'IMX304 / IMX253 (12 MP)'],
          ['APS-C', '≈ 22 × 15', '≈ 27 mm', 'Cảm biến 24–45 MP'],
        ],
      },
      { type: 'h', text: 'Global shutter hay rolling shutter' },
      {
        type: 'list',
        items: [
          '**Global shutter**: mọi pixel phơi sáng cùng lúc → bắt buộc cho vật chuyển động.',
          '**Rolling shutter**: phơi sáng lần lượt từng dòng → vật chạy bị xiên/méo. Chỉ dùng cho vật tĩnh hoặc kết hợp đèn flash ngắn trong cửa sổ "global reset".',
        ],
      },
      { type: 'h', text: 'Mono hay màu' },
      { type: 'p', text: 'Camera màu dùng lọc Bayer: mỗi pixel chỉ thu 1 màu và phải nội suy, nên **độ nét thực tế thấp hơn** và **độ nhạy thấp hơn** khoảng 2–3 lần so với mono cùng cảm biến. Chỉ chọn camera màu khi quyết định thực sự dựa trên màu sắc; nếu chỉ cần tách màu, thường có thể dùng camera mono + đèn đúng bước sóng.' },
      { type: 'h', text: 'Băng thông giao tiếp' },
      {
        type: 'formula', title: 'Tốc độ dữ liệu',
        expr: 'Data rate (MB/s) = N_x × N_y × (bit/8) × fps / 10⁶',
        where: [['bit', 'độ sâu bit truyền (8, 10, 12)'], ['fps', 'số ảnh/giây']],
        note: 'Nếu data rate vượt băng thông cổng, FPS thực tế bị giới hạn: fps_max ≈ băng thông / (N_x × N_y × bit/8).',
      },
      {
        type: 'table',
        head: ['Giao tiếp', 'Băng thông thực tế', 'Cáp tối đa'],
        rows: [
          ['GigE', '≈ 115 MB/s', '100 m'],
          ['5GigE', '≈ 580 MB/s', '100 m'],
          ['10GigE', '≈ 1100 MB/s', '100 m (cáp Cat6a)'],
          ['USB3 Vision', '≈ 380 MB/s', '3–5 m (cáp chủ động dài hơn)'],
          ['Camera Link (Full)', '≈ 680–850 MB/s', '10 m'],
          ['CoaXPress 2.0 (4 × CXP-12)', '≈ 5000 MB/s', '35–40 m'],
        ],
      },
      {
        type: 'example', title: 'Camera 5 MP IMX264 qua GigE',
        given: [['N_x × N_y', '2448 × 2048'], ['p', '3.45 µm'], ['Yêu cầu', '35 fps, 8 bit']],
        steps: [
          ['Chiều rộng cảm biến', 'W = 2448 × 3.45 / 1000 = 8.45 mm'],
          ['Chiều cao cảm biến', 'H = 2048 × 3.45 / 1000 = 7.07 mm'],
          ['Đường chéo', 'D = √(8.45² + 7.07²) = 11.0 mm  → lens định dạng 2/3"'],
          ['Tốc độ dữ liệu cần', '2448 × 2048 × 1 × 35 / 10⁶ = 175.5 MB/s'],
          ['FPS tối đa qua GigE', '115 / 5.01 ≈ 23 fps'],
        ],
        result: 'GigE không đủ cho 35 fps ở độ phân giải đầy đủ. Chọn **USB3 / 5GigE**, hoặc giảm ROI theo chiều dọc.',
      },
    ],
  },

  {
    id: 'fov-resolution',
    title: 'FOV & độ phân giải không gian',
    category: CAT,
    summary: 'Tính vùng nhìn (FOV), mm/pixel và số pixel cần cho chi tiết nhỏ nhất — bước đầu tiên để chọn camera.',
    blocks: [
      { type: 'p', text: 'FOV phải chứa trọn vật **cộng biên dư** cho sai lệch vị trí. Sau đó, số pixel của camera chia đều FOV thành các ô; kích thước mỗi ô (mm/pixel) quyết định chi tiết nhỏ nhất thấy được.' },
      {
        type: 'formula', title: 'Vùng nhìn cần thiết',
        expr: 'FOV_x = L_x × (1 + margin / 100)',
        where: [['L_x', 'kích thước vật theo chiều ngang ảnh (mm)'], ['margin', 'biên dư (%): 0–10 % có đồ gá tốt, 20 % tiêu chuẩn, 30–50 % vật thả tự do']],
      },
      {
        type: 'formula', title: 'Độ phân giải không gian',
        expr: 'mm/px = FOV_x / N_x          px/mm = 1 / (mm/px)\nFOV_y = N_y × mm/px',
        note: 'Pixel vuông nên FOV dọc bị ràng buộc bởi tỉ lệ cảm biến. Nếu vật dài theo chiều dọc, hãy xoay camera 90°.',
      },
      {
        type: 'formula', title: 'Số pixel trên chi tiết & độ phân giải tối thiểu',
        expr: 'px/feature = d_min / (mm/px)   ≥ k\nN_x,min = FOV_x × k / d_min',
        where: [['d_min', 'chi tiết nhỏ nhất cần thấy (mm)'], ['k', 'số pixel tối thiểu trên chi tiết (bảng dưới)']],
      },
      {
        type: 'table',
        head: ['Nhiệm vụ', 'k tối thiểu', 'Khuyến nghị'],
        rows: [
          ['Phát hiện khuyết tật, tương phản tốt', '3 px', '3–4 px'],
          ['Khuyết tật tương phản thấp', '4 px', '5–6 px'],
          ['Barcode 1D (vạch hẹp)', '1.5 px', '2–3 px'],
          ['QR / DataMatrix (module)', '3 px', '4–6 px'],
          ['OCR (nét chữ / chiều cao ký tự)', '2 px / 16 px', '3 px / 20–30 px'],
          ['Đo lường (sub-pixel)', '—', 'mm/px ≤ 3 × độ chính xác yêu cầu'],
        ],
      },
      {
        type: 'example', title: 'Kiểm tra vết xước trên nắp nhựa',
        given: [['Vật', '80 × 60 mm'], ['Biên dư', '20 %'], ['Vết xước nhỏ nhất', '0.2 mm'], ['Camera', '2448 × 2048']],
        steps: [
          ['FOV ngang', 'FOV_x = 80 × 1.2 = 96 mm'],
          ['Độ phân giải tối thiểu (k = 3)', 'N_x,min = 96 × 3 / 0.2 = 1440 px'],
          ['mm/pixel với camera 5 MP', '96 / 2448 = 0.0392 mm/px'],
          ['FOV dọc', '2048 × 0.0392 = 80.3 mm ≥ 60 mm ✓'],
          ['Số pixel trên vết xước', '0.2 / 0.0392 = 5.1 px ≥ 3 ✓'],
        ],
        result: 'Camera 1.6 MP (1440 px) vừa đủ tối thiểu; camera **5 MP** cho 5.1 px/vết xước — dư an toàn cho vết xước tương phản thấp.',
      },
      { type: 'callout', tone: 'warn', text: 'Không chọn độ phân giải "càng cao càng tốt": pixel nhỏ nhạy sáng kém hơn, dễ bị giới hạn nhiễu xạ, ảnh lớn làm chậm xử lý và giảm FPS.' },
    ],
  },

  {
    id: 'lens',
    title: 'Chọn lens: tiêu cự & khoảng cách làm việc',
    category: CAT,
    summary: 'Mô hình thấu kính mỏng, độ phóng đại, tiêu cự, WD, góc nhìn, vòng ảnh, extension tube và lens telecentric.',
    blocks: [
      { type: 'p', text: 'Lens chiếu FOV lên cảm biến. Tỉ lệ thu nhỏ đó là **độ phóng đại M**. Biết M, chỉ cần thêm một trong hai đại lượng (tiêu cự f hoặc WD) để tính đại lượng còn lại theo mô hình thấu kính mỏng.' },
      {
        type: 'formula', title: 'Độ phóng đại',
        expr: 'M = W_sensor / FOV_x',
      },
      {
        type: 'formula', title: 'Thấu kính mỏng',
        expr: 'f  = WD × M / (1 + M)\nWD = f × (1 + 1/M)\nM  = f / (WD − f)',
        where: [['f', 'tiêu cự (mm)'], ['WD', 'khoảng cách làm việc (mm)']],
        note: 'Mô hình thấu kính mỏng sai lệch vài % so với lens thật (mặt phẳng chính không trùng mặt trước lens). Sau khi chọn lens, đối chiếu với datasheet hoặc công cụ tính của hãng.',
      },
      {
        type: 'formula', title: 'Góc nhìn',
        expr: 'AOV = 2 × atan(W_sensor / (2 × f))',
      },
      {
        type: 'table',
        caption: 'Góc nhìn ngang với cảm biến 2/3" (W = 8.45 mm).',
        head: ['Tiêu cự', 'Góc nhìn ngang', 'Ứng dụng điển hình'],
        rows: [
          ['8 mm', '55.7°', 'FOV lớn ở khoảng cách gần'],
          ['12 mm', '38.8°', 'Kiểm tra tổng thể, robot'],
          ['16 mm', '29.6°', 'Đọc mã, kiểm tra nhãn'],
          ['25 mm', '19.2°', 'Kiểm tra chi tiết, phổ biến nhất'],
          ['35 mm', '13.8°', 'WD xa, FOV nhỏ'],
          ['50 mm', '9.7°', 'Chi tiết nhỏ, đo lường'],
        ],
      },
      { type: 'h', text: 'Các ràng buộc khác' },
      {
        type: 'list',
        items: [
          '**Vòng ảnh (image circle)** của lens ≥ đường chéo cảm biến, nếu không ảnh bị tối/ mờ góc.',
          '**Ngàm**: C-mount (17.526 mm) cho cảm biến ≤ 1.1", F-mount/M42/M72 cho cảm biến lớn và line scan.',
          '**MOD (khoảng lấy nét tối thiểu)**: nếu WD < MOD, thêm extension tube dài ≈ f × M.',
          '**Độ phân giải lens** (MTF) phải tương xứng với pixel: lens "5 MP" cho pixel ≥ 3.45 µm, lens "12 MP+" cho pixel 2.4–2.74 µm.',
          '**Méo hình**: lens FA thường < 0.5 %, lens góc rộng có thể > 2 % — cần hiệu chuẩn khi đo.',
        ],
      },
      { type: 'h', text: 'Lens telecentric' },
      { type: 'p', text: 'Lens telecentric chỉ nhận tia song song trục quang, nên **độ phóng đại không đổi** khi vật dịch theo Z và không có sai số phối cảnh. Đây là lựa chọn chuẩn cho đo kích thước. Hạn chế: FOV ≤ đường kính thấu kính trước, lens lớn, đắt; độ phóng đại cố định (0.1×, 0.3×, 0.5×, 1×…) nên FOV = W_sensor / M.' },
      {
        type: 'example', title: 'Chọn lens cho FOV 96 mm',
        given: [['Cảm biến', '8.45 mm (2/3")'], ['FOV_x', '96 mm'], ['WD mong muốn', '300 mm']],
        steps: [
          ['Độ phóng đại', 'M = 8.45 / 96 = 0.0880'],
          ['Tiêu cự lý thuyết', 'f = 300 × 0.0880 / 1.0880 = 24.3 mm'],
          ['Chọn lens chuẩn gần nhất', 'f = 25 mm'],
          ['Giữ FOV 96 mm → WD mới', 'WD = 25 × (1 + 1/0.0880) = 309 mm'],
          ['Hoặc giữ WD 300 mm → FOV mới', 'M = 25 / 275 = 0.0909 → FOV = 8.45 / 0.0909 = 92.9 mm'],
          ['Góc nhìn', 'AOV = 2 × atan(8.45 / 50) = 19.2°'],
        ],
        result: 'Dùng **lens 25 mm**, lắp cách vật ≈ 309 mm (hoặc giữ 300 mm và chấp nhận biên dư còn 16 %). Lens cần vòng ảnh ≥ 11 mm (2/3").',
      },
    ],
  },

  {
    id: 'dof-diffraction',
    title: 'Độ sâu trường ảnh (DOF) & nhiễu xạ',
    category: CAT,
    summary: 'Cân bằng giữa DOF và độ nét: công thức DOF, đĩa Airy, giới hạn nhiễu xạ và cách chọn F-number tối ưu.',
    blocks: [
      { type: 'p', text: 'Đóng khẩu (tăng N) làm **DOF sâu hơn** nhưng đồng thời làm **đĩa nhiễu xạ Airy lớn hơn** và ảnh tối hơn. Chọn F-number là tìm điểm cân bằng: DOF đủ cho độ dày vật mà nhiễu xạ chưa làm mờ quá 2 pixel.' },
      {
        type: 'formula', title: 'Độ sâu trường ảnh',
        expr: 'DOF ≈ 2 × N × c × (1 + M) / M²',
        where: [['N', 'F-number'], ['c', 'vòng tròn nhòe cho phép (mm) — ứng dụng dùng c = 1 pixel = p/1000'], ['M', 'độ phóng đại']],
        note: 'DOF tỉ lệ nghịch với M²: phóng đại gấp đôi thì DOF giảm gần 4 lần.',
      },
      {
        type: 'formula', title: 'Nhiễu xạ',
        expr: 'd_Airy = 2.44 × λ × N          (µm, λ tính bằng µm)\nν_limit = 1 / (1.22 × λ × N)     (lp/mm, tiêu chuẩn Rayleigh)',
        where: [['λ', 'bước sóng ánh sáng: 0.47 µm (xanh dương), 0.525 µm (xanh lá), 0.625 µm (đỏ)']],
      },
      {
        type: 'formula', title: 'F-number tối ưu (Airy ≈ 2 pixel)',
        expr: 'N_max ≈ 2 × p / (2.44 × λ)',
        note: 'Ở khoảng cách gần, F-number hiệu dụng tăng: N_eff = N × (1 + M). Với M nhỏ (< 0.1) có thể bỏ qua.',
      },
      {
        type: 'table',
        head: ['Pixel', 'λ = 470 nm', 'λ = 525 nm', 'λ = 625 nm'],
        caption: 'N_max theo kích thước pixel và bước sóng.',
        rows: [
          ['2.4 µm', 'F4.2', 'F3.7', 'F3.1'],
          ['3.45 µm', 'F6.0', 'F5.4', 'F4.5'],
          ['5.5 µm', 'F9.6', 'F8.6', 'F7.2'],
          ['7 µm', 'F12', 'F11', 'F9.2'],
        ],
      },
      {
        type: 'example', title: 'Vật dày 5 mm, camera 3.45 µm',
        given: [['M', '0.088'], ['p', '3.45 µm'], ['λ', '525 nm'], ['Độ dày vật', '5 mm']],
        steps: [
          ['DOF ở F5.6', '2 × 5.6 × 0.00345 × 1.088 / 0.088² = 5.43 mm ≥ 5 ✓'],
          ['Airy ở F5.6', '2.44 × 0.525 × 5.6 = 7.17 µm ≈ 2.1 px (chấp nhận được)'],
          ['DOF ở F8', '7.76 mm'],
          ['Airy ở F8', '10.2 µm ≈ 3.0 px → ảnh mờ rõ rệt'],
          ['N_max', '2 × 3.45 / (2.44 × 0.525) = F5.4'],
        ],
        result: 'Chọn **F5.6** (hoặc F4 nếu vật mỏng hơn). Nếu cần DOF lớn hơn mà không tăng N: giảm độ phóng đại, dùng pixel lớn hơn, hoặc chuyển sang ánh sáng xanh dương.',
      },
      { type: 'callout', tone: 'tip', text: 'Ánh sáng **xanh dương** cho đĩa Airy nhỏ hơn ~20 % so với đỏ — một cách "miễn phí" để tăng độ nét khi pixel nhỏ.' },
    ],
  },

  {
    id: 'lighting',
    title: 'Chiếu sáng trong machine vision',
    category: CAT,
    summary: 'Các kỹ thuật chiếu sáng, chọn bước sóng, strobe và ngân sách ánh sáng cho phơi sáng ngắn.',
    blocks: [
      { type: 'p', text: 'Chiếu sáng quyết định phần lớn thành công của một ứng dụng vision. Mục tiêu không phải "sáng" mà là **tạo tương phản tối đa giữa đặc trưng cần thấy và nền**, đồng thời ổn định theo thời gian.' },
      {
        type: 'table',
        head: ['Kỹ thuật', 'Nguyên lý', 'Ứng dụng'],
        rows: [
          ['Backlight', 'Đèn phía sau vật, vật thành bóng đen', 'Đo biên dạng, đếm lỗ, kiểm tra kích thước'],
          ['Ring light (bright field)', 'Đèn vòng đồng trục với camera', 'Kiểm tra chung, bề mặt nhám'],
          ['Low-angle / dark field', 'Ánh sáng chiếu xiên gần như song song bề mặt', 'Vết xước, dập nổi, khắc laser, bụi'],
          ['Dome (diffuse)', 'Ánh sáng tán xạ đều mọi hướng', 'Bề mặt bóng, cong, giấy bạc, mã DPM'],
          ['Coaxial', 'Ánh sáng đi qua gương bán mạ trùng trục quang', 'Bề mặt phẳng phản xạ gương, wafer, khắc'],
          ['Bar light', 'Thanh LED chiếu từ một hoặc nhiều phía', 'Vật lớn, nhãn, chiếu xiên tránh lóa'],
          ['Line light', 'Vạch sáng hội tụ cường độ cao', 'Camera line scan'],
          ['Structured / laser line', 'Chiếu vạch/lưới đã biết lên vật', 'Đo 3D, biên dạng chiều cao'],
        ],
      },
      { type: 'h', text: 'Chọn bước sóng' },
      {
        type: 'list',
        items: [
          '**Cùng màu → sáng, màu bù → tối**: đèn đỏ làm vật đỏ sáng lên và vật xanh lá tối đi.',
          '**Xanh dương 450–470 nm**: độ nét cao nhất, tốt cho kim loại và đo lường.',
          '**Đỏ 625–660 nm**: phổ biến, rẻ; xuyên tốt hơn qua lớp nhựa trong.',
          '**IR 850/940 nm**: giảm khác biệt màu in, xuyên qua một số lớp mực, không gây chói cho người vận hành.',
          '**UV 365–405 nm**: kích thích huỳnh quang (keo, dầu, mực UV).',
          'Dùng **kính lọc band-pass** cùng bước sóng đèn để loại ánh sáng môi trường.',
        ],
      },
      { type: 'h', text: 'Ngân sách ánh sáng & strobe' },
      {
        type: 'formula', title: 'Độ sáng ảnh',
        expr: 'Mức xám ∝ I × t × QE × gain / N²',
        where: [['I', 'cường độ sáng trên vật'], ['t', 'thời gian phơi sáng'], ['QE', 'hiệu suất lượng tử cảm biến'], ['N', 'F-number']],
        note: 'Giảm phơi sáng 10 lần cần tăng ánh sáng 10 lần; tăng N từ F4 lên F8 cần gấp 4 lần ánh sáng.',
      },
      { type: 'p', text: 'Đèn **strobe overdrive** có thể phát sáng gấp 5–10 lần định mức trong xung ngắn (vài chục µs) với chu kỳ làm việc thấp — giải pháp tiêu chuẩn cho chụp ảnh động.' },
      {
        type: 'example', title: 'Chuyển từ chụp tĩnh sang chụp động',
        given: [['Phơi sáng hiện tại', '2000 µs (ảnh đủ sáng)'], ['Phơi sáng tối đa khi vật chạy', '78 µs']],
        steps: [
          ['Hệ số ánh sáng cần tăng', '2000 / 78 ≈ 25.6 lần'],
          ['Strobe overdrive ×10', 'còn thiếu 2.6 lần'],
          ['Bù bằng khẩu: F5.6 → F4', 'ánh sáng tăng (5.6/4)² ≈ 2 lần'],
          ['Phần còn lại bằng gain', '+2.3 dB (≈ 1.3×)'],
        ],
        result: 'Kết hợp **strobe overdrive + mở khẩu + gain nhẹ**; kiểm tra lại DOF sau khi mở khẩu.',
      },
      { type: 'callout', tone: 'tip', text: 'Luôn thử chiếu sáng với **mẫu tốt và mẫu lỗi thật** trước khi chốt camera/lens. Sau khi lắp đặt, dùng module **Hiệu chuẩn → Chiếu sáng** để đo độ đồng đều và nhấp nháy.' },
    ],
  },
]
