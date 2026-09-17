# DON DUONG VILLAGE — thay đổi chờ duyệt

Nhánh: `codex/complete-owner-tasks`. Chưa push, merge, chạy SQL hoặc triển khai Worker/GitHub Pages.

## Các task đã chuẩn bị trong mã nguồn

| Task | Thay đổi | Tệp chính |
|---|---|---|
| 1 | Lightbox, trước/sau, đóng, Escape/mũi tên, trả focus; gallery giữ thứ tự sau khi bỏ ảnh, nút đổi thứ tự trên điện thoại | `product.html`, `assets/js/gallery.js`, `assets/js/product.js`, `assets/js/admin.js`, `assets/css/style.css` |
| 1B | Chặn GET submit từ đầu, dùng Supabase Auth, xóa credential query của entry hiện tại, xóa mật khẩu trong form, chống bấm đăng nhập nhiều lần | `admin/index.html`, `assets/js/login-safety.js`, `assets/js/admin.js` |
| 3 | Giảm giá 0–100%, xem trước, giá dùng chung trên danh sách/chi tiết/giỏ; checkout tính giá tại DB và lưu đơn/chi tiết trong một transaction | `assets/js/pricing.js`, `common.js`, `home.js`, `products.js`, `product.js`, `cart.js`, `admin.js`, migrations `003`, `006` |
| 4 | Sửa tiêu đề sản phẩm nổi bật, nhãn câu chuyện, dòng trên ảnh; tiếp tục dùng `page_sections` cho nội dung/ảnh/nút câu chuyện | `index.html`, `assets/js/home.js`, `demo-data.js`, `admin.js` |
| 5 | Ẩn/hiện, thùng rác, khôi phục trong 14 ngày; giữ ảnh đến khi dọn quá hạn, xem trước và xác nhận từng sản phẩm, thử lại khi R2 lỗi | `assets/js/supabase.js`, `admin.js`, `admin-system.js`, migrations `005`, `007`, Worker extension |
| 6 | Mua ngay trên desktop/mobile, giữ Thêm vào giỏ; gộp sản phẩm thành một dòng, chuyển tới form checkout | `assets/js/product.js`, `common.js`, CSS |
| 7 | Counts/connectivity, dung lượng DB qua RPC có quyền, health Worker; liệt kê R2 phân trang, cộng dung lượng từ listing, cảnh báo ảnh có thể không được dùng | `assets/js/admin-system.js`, `admin/index.html`, migration `007`, `worker/admin-extension.mjs` |
| 8 | CSV sản phẩm/đơn/chi tiết/bài viết; JSON phục hồi 8 bảng; phân trang, BOM tiếng Việt, chống công thức Excel; không xóa dữ liệu sau export | `assets/js/admin-backup.js`, `admin-system.js`, `admin/index.html` |
| 9 | Favicon dùng logo thật có sẵn, trên 7 trang public và Admin | Tất cả HTML |

Không tạo `apple-touch-icon` từ logo ngang: repo chưa có biểu tượng vuông được duyệt. Không sửa logo/bao bì/ảnh thật. Keep-alive là tùy chọn, chưa bật.

## Kiểm tra đã chạy

- `node tests/check.cjs`: cú pháp tất cả JS/Worker, giá 0/20/100%, làm tròn, CSV escaping/formula injection, local assets, favicon.
- `node tests/browser.cjs`: Edge headless, tất cả backend giả lập; URL đăng nhập sạch và mật khẩu được xóa; lightbox 1/3/8 ảnh, mũi tên/keyboard/đóng; mua ngay và giá giỏ; viewport 320/390/1280 không tràn ngang; gallery Admin đổi thứ tự, xóa phụ/chính, sync primary/image_url, thêm ảnh mới lên đầu. Không gọi Supabase/R2 production.
- `node tests/worker.mjs`: auth, admin allowlist, CORS, OPTIONS, listing phân trang, xác nhận, chặn xóa ảnh dùng chung, R2 trước database.
- `git diff --check`: kiểm tra khoảng trắng.
- `tests/product-*.png`: ảnh kiểm tra giao diện, không đưa vào Git.

SQL chưa được chạy trên PostgreSQL/Supabase staging. Worker extension chưa được ghép với Worker production vì mã Worker hiện tại không có trong repo. Chưa xác nhận xóa object R2 thật hoặc browser history cũ của chủ shop.

## Thứ tự thao tác production — CHỦ SHOP DUYỆT VÀ THỰC HIỆN

1. Sao lưu database, policy hiện tại và object R2. Nên thử trên Supabase staging trước; không chạy lại `supabase_setup.sql` cũ sau migrations vì nó có policy rộng.
2. Đối chiếu schema thật: `product.id` và `product_images.product_id` là số tương thích bigint; bảng `product_images` đã tồn tại; tên cột theo handoff. Nếu khác, sửa migration trước.
3. Chạy `003_discount.sql`, rồi `005_product_lifecycle.sql`, `006_checkout.sql`, `007_admin_system.sql` trong SQL Editor. Mỗi migration chạy một lần.
4. Trong SQL Editor, thêm UUID tài khoản chủ shop vào `public.ddv_admin_users(user_id)`. Đây là ID ở Authentication, không phải email/mật khẩu. Kiểm tra RPC `ddv_is_admin` trả true cho tài khoản này trước bước tiếp theo.
5. Duyệt/chạy `010_admin_authorization.sql`. Rà soát policy khác: anonymous không được đọc đơn hàng, sản phẩm ẩn/trash hoặc ảnh của chúng; người đăng nhập không phải Admin không được quản trị. Restrictive policies bổ sung giới hạn, không tự gỡ policy chưa biết.
6. Ghép `worker/admin-extension.mjs` vào Worker đang chạy. Gọi `handleAdminRequest(request, env)` trước router cũ; nếu response khác null thì return response. Giữ các endpoint `/upload` và `/files/...` hiện tại. Rà soát để chúng cũng xác minh Supabase token và quyền chủ shop; frontend không thể thay thế kiểm tra phía Worker.
7. Worker bindings: giữ `DDV_IMAGES`; thêm `SUPABASE_URL`, `SUPABASE_PUBLIC_KEY` (khóa public), `ADMIN_USER_IDS` (UUID chủ shop, phân cách dấu phẩy), `ADMIN_ORIGINS` (origin thật của GitHub Pages, có scheme, không có path). Không đưa bất kỳ secret vào browser. Chủ shop triển khai Worker sau kiểm tra staging.
8. Kiểm tra các bước thủ công bên dưới, rồi mới duyệt merge và triển khai frontend. Frontend mới phụ thuộc migrations nên không phát hành trước SQL. API checkout mới khóa insert đơn trực tiếp; production frontend cũ sẽ không đặt đơn được giữa các bước, cần phối hợp thời điểm chuyển đổi.
9. Đổi mật khẩu Admin đã lộ trước đây. `replaceState` chỉ làm sạch entry hiện tại; không xóa toàn bộ history cũ, nhật ký server hoặc URL đã được sao chép.

## Kiểm thử thủ công trước khi phát hành

1. Đăng nhập sai/đúng, Enter, bấm sớm khi đang tải, chặn JavaScript, reload, token hết hạn, đăng xuất. Network/URL/history mới không có mật khẩu. Khi JS bị chặn form chỉ dùng POST, không có GET credential.
2. Với 1/3/8 ảnh: mở/đóng lightbox, trước/sau, keyboard, focus, màn hình điện thoại. Reorder cũ/mới rồi Save/reload; xóa phụ/chính; bỏ thay đổi không được xóa DB/R2. Sau Save, kiểm tra `sort_order=0..n-1`, một `is_primary`, `product.image_url` đúng và object đã xóa khỏi R2 thật.
3. Giảm giá 0/20/100%, nhập âm hoặc trên 100 bị chặn. Giá công khai/giỏ/đơn đồng nhất; sửa giá ở localStorage không thay đổi giá lưu trong đơn. Không có đơn nửa chừng nếu dòng chi tiết lỗi. RPC checkout kiểm tra tồn kho, chưa trừ/reserve tồn kho tự động.
4. Admin → Trang website: sửa tiêu đề sản phẩm nổi bật; ở Nhãn câu chuyện sửa Title và Body; ở Câu chuyện sửa title/subtitle/body/ảnh/nút. Reload public và kiểm tra tiếng Việt, xuống dòng và mobile.
5. Mua ngay với số lượng 2, sản phẩm đã có trong giỏ và giỏ trống: chỉ một dòng sản phẩm, tăng đúng số lượng; đến checkout. Bấm nhanh không thêm hai lần.
6. Ẩn/hiện/trash: không thấy trên public kể cả mở URL trực tiếp; Admin vẫn quản lý được. Khôi phục trước 14 ngày; sau hạn không được khôi phục. Trên staging đặt ngày xóa cũ để thử, xem trước và xác nhận dọn. Giả lập lỗi R2/DB rồi thử lại; ảnh dùng chung phải được giữ và báo lỗi. Không có cron dọn tự động.
7. Dashboard: không có quyền thì báo lỗi, không báo OK giả; R2 pagination lấy hết listing và cộng dung lượng; ảnh nghi orphan chỉ là gợi ý, không tự xóa. So sánh count với R2 thật.
8. Export > 1000 dòng, tiếng Việt, dấu phẩy, xuống dòng, giá trị bắt đầu `=`. JSON chứa đủ bảng và IDs, không có token/password. JSON không gồm file R2; phục hồi cần ảnh R2 được sao lưu riêng. Tránh chỉnh dữ liệu đồng thời trong lúc export vì các bảng không phải snapshot transaction.
9. Kiểm tra favicon public/Admin. Cần asset icon vuông chính thức nếu muốn Apple touch icon sắc nét.

## Giới hạn cần lưu ý khi duyệt

- Luồng gallery hiện có ghi nhiều request database: nếu mạng lỗi giữa Save có thể có trạng thái lưu một phần. Thay đổi giữ kiến trúc này; cần kiểm thử thất bại staging trước khi phát hành. Worker cleanup có retry nhưng không phải transaction chung với R2.
- Khóa phục hồi/gallery khi purge đang chạy để không khôi phục một sản phẩm đã mất ảnh. `finish_product_purge` chỉ dành cho Admin; không gọi nó thủ công trước khi R2 đã được dọn.
- R2 orphan detection kiểm tra tham chiếu ảnh sản phẩm, không khẳng định mọi ảnh không có row đều là rác.
- Export JSON không chứa Auth users, password hoặc object R2; là bản sao dữ liệu ứng dụng, không phải backup đầy đủ Supabase.
