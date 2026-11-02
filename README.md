# SMART CLASS – QUẢN LÝ LỚP HỌC THÔNG MINH

Hệ thống quản lý lớp học số và đồng hành giáo dục thông minh đa vai trò (Multi-Role Education SaaS), phục vụ 4 đối tượng chính:
1. **Admin / Ban Giám Hiệu**
2. **Giáo viên**
3. **Học sinh**
4. **Phụ huynh**

---

## 1. TÀI KHOẢN TRẢI NGHIỆM DEMO (1-Click Test Accounts)

Hệ thống tích hợp thanh **Chuyển vai trò test (Demo Switcher)** ngay trên thanh trên cùng để bạn có thể chuyển đổi tức thì giữa 4 vai trò mà không cần đăng xuất/đăng nhập lại:

| Vai trò | Email đăng nhập | Họ và tên | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Giáo viên** | `gv.nguyenhuong@smartclass.edu.vn` | Cô Nguyễn Thị Mai Hương | Quản lý lớp, học sinh, điểm danh, bài tập, chấm điểm, công cụ lớp học |
| **Học sinh** | `hs.ducduy@smartclass.edu.vn` | Nguyễn Đức Duy | Xem lịch học, bài tập cần làm, làm quiz trắc nghiệm, xem điểm |
| **Phụ huynh**| `ph.nguyenan@smartclass.edu.vn` | Ông Nguyễn Thành An | Chuyển đổi xem nhiều con, xem điểm danh tức thời, trao đổi giáo viên |
| **Admin** | `admin@smartclass.edu.vn` | ThS. Trần Quang Huy | Quản trị trường, năm học, khối, tài khoản, audit logs, cấu hình hệ thống |

*Mật khẩu mặc định cho các tài khoản test:* `password123`

---

## 2. KIẾN TRÚC KỸ THUẬT & CƠ SỞ DỮ LIỆU

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Backend / Database:** 
  - Đã tích hợp sẵn adapter truy xuất dữ liệu với chế độ fallback lưu trữ cục bộ có tính toàn vẹn cao (Local Persistence Adapter).
  - Tệp SQL Migration hoàn chỉnh sẵn sàng cho PostgreSQL & Supabase tại: `/supabase/migrations/20260101_init.sql` (bao gồm đầy đủ bảng, RLS Policies, Triggers và Audit Log).
- **Phân quyền RBAC & RLS:** Bảo vệ nghiêm ngặt các route và dữ liệu theo vai trò. Phụ huynh chỉ xem được dữ liệu con được liên kết, học sinh chỉ xem dữ liệu của chính mình, giáo viên quản lý lớp phụ trách.

---

## 3. CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI HOÀN THIỆN

### Phase 0: Nền tảng (Foundation)
- Hệ thống Design System chuẩn SaaS giáo dục hiện đại.
- Typography: Plus Jakarta Sans & JetBrains Mono (Tabular numerals cho số điểm và thời gian).
- AppLayout linh hoạt cho Desktop (Sidebar 256px + Header 64px) và Mobile Drawer.
- Toast notifications và ConfirmDialog bảo vệ thao tác nguy hiểm.

### Phase 1 & 2: Nghiệp vụ Giáo viên & Quản lý Lớp (Core Teacher)
- **Teacher Dashboard:** 5 thẻ chỉ số KPI thời gian thực, dải thao tác nhanh (Quick Actions), lịch dạy hôm nay, danh sách lớp phụ trách, cảnh báo học sinh cần chú ý.
- **Quản lý lớp học:** CRUD đầy đủ, tạo lớp mới, nhân bản lớp, lưu trữ, lọc theo khối, mã mời QR tham gia lớp.
- **Workspace Lớp Học (Class Detail):** 8 Tab nghiệp vụ tích hợp:
  1. *Tổng quan:* Chỉ số sĩ số, chuyên cần, điểm TB, nhiệm vụ sắp tới.
  2. *Học sinh:* Danh sách học sinh, tìm kiếm, xem Hồ sơ 360°.
  3. *Điểm danh:* Điểm danh tức thì theo ngày/tiết, nút "Đánh dấu tất cả có mặt", lưu dữ liệu với nhật ký Audit.
  4. *Bài tập:* Danh sách bài tập, tiến độ nộp bài.
  5. *Điểm số:* Sổ điểm điện tử Spreadsheet tính điểm TB tự động.
  6. *Thi đua:* Bảng điểm tích lũy theo tổ, nhật ký biểu dương và nhắc nhở.
  7. *Thời khóa biểu:* Lịch học chi tiết trong tuần.
  8. *Báo cáo:* Thống kê học lực và tỷ lệ chuyên cần.

### Phase 3 & 4: Dạy học & Công cụ Lớp học (Tools Hub)
- **Công cụ lớp học tương tác:**
  - *Vòng quay may mắn / Gọi ngẫu nhiên:* Lấy danh sách thật của lớp, có chế độ chống lặp và hiệu ứng pháo hoa ăn mừng.
  - *Chia nhóm tự động:* Chia đều học sinh ngẫu nhiên theo số nhóm tùy chọn.
  - *Đồng hồ đếm ngược:* Đặt giờ làm bài (1p, 3p, 5p, 10p, 15p) với chuông báo kết thúc.
- **Bài tập & Chấm bài:** Giao bài tập, xem bài nộp, chấm điểm thang 10 và gửi nhận xét.
- **Kiểm tra / Quiz:** Ngân hàng đề thi trắc nghiệm có chấm điểm tự động.
- **Kho học liệu số:** Quản lý tài liệu PDF, Slide PowerPoint, Video theo từng chương bài.
- **Cảnh báo học tập thông minh:** Theo dõi học sinh nghỉ nhiều, chưa nộp bài, điểm giảm với luồng xử lý: `Mới` → `Đã xem` → `Đang xử lý` → `Đã giải quyết`.
- **Thông báo:** Soạn và phát hành thông báo theo cấp độ ưu tiên với thống kê số lượt đã xem.

### Phase 5: Cổng Học Sinh & Phụ Huynh (Portals)
- **Student Portal:** Xem lịch học, bài tập về nhà cần nộp, làm bài quiz, xem điểm số và điểm thi đua.
- **Parent Portal:** Bộ chuyển đổi con (Child Switcher), cập nhật điểm danh hôm nay của con, xem điểm thi và liên hệ Giáo viên chủ nhiệm.

### Phase 6: Quản trị Hệ thống (Admin Console)
- **Admin Dashboard:** Tổng quan toàn trường, danh sách tài khoản 4 vai trò, nhật ký kiểm toán (Audit Logs) bất biến, và trang cấu hình thông số hệ thống.

---

## 4. HƯỚNG DẪN TRIỂN KHAI VỚI SUPABASE (PRODUCTION)

1. Tạo một dự án mới trên [Supabase](https://supabase.com).
2. Vào **SQL Editor** trong Supabase Dashboard, copy toàn bộ nội dung tệp `/supabase/migrations/20260101_init.sql` và nhấn **Run** để khởi tạo cấu trúc bảng, RLS Policies và Triggers.
3. Cấu hình biến môi trường trong tệp `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Build và deploy frontend lên Vercel / Netlify:
   ```bash
   npm run build
   ```
