DON DUONG VILLAGE — Website v1
=================================

Bản này đã có:
- Trang chủ responsive desktop / tablet / mobile
- Trang sản phẩm + chi tiết sản phẩm
- Giỏ hàng localStorage
- Checkout lưu đơn hàng vào Supabase khi kết nối
- Blog kiến thức sức khỏe
- Trang Về chúng tôi
- Footer có Facebook / TikTok / Shopee / Zalo
- Admin đăng nhập Supabase Auth
- Admin thêm / sửa / xóa sản phẩm + upload ảnh
- Admin quản lý đơn hàng
- Admin đăng bài sức khỏe + ảnh bìa + chèn ảnh trong bài
- Admin thay Hero Banner, Brand Story, Bottom Banner, Về chúng tôi
- Admin sửa số điện thoại, Gmail/email, địa chỉ và social link
- Giao diện mobile responsive
- Demo mode để xem website ngay cả khi chưa cấu hình Supabase

QUAN TRỌNG
----------
Website hiện đang DEMO_MODE=true vì chưa có Project URL và anon public key.

Bước tiếp theo:
1. Vào Supabase > SQL Editor.
2. Chạy file supabase_setup.sql.
3. Giữ tài khoản Admin trong Supabase Authentication.
4. Lấy Project URL và anon public key (KHÔNG lấy service_role key).
5. Mở assets/js/config.js và điền:
   SUPABASE_URL
   SUPABASE_ANON_KEY
   DEMO_MODE: false
6. Đưa toàn bộ thư mục lên GitHub Pages.

Admin:
   /admin/

Ảnh giao diện:
- Hero / Brand Story / Bottom Banner thay được từ Admin > Trang website.
- Ảnh sản phẩm thay từ Admin > Sản phẩm.
- Ảnh bài viết thay từ Admin > Bài viết.
- Layout được khóa để giữ đúng Brand Guidelines.

Backup đề xuất:
- GitHub: code
- Supabase: dữ liệu đang chạy
- Google Drive / máy tính: backup định kỳ database + ảnh quan trọng

Lưu ý: đơn hàng web dùng bảng web_orders và web_order_items để không xung đột với bảng orders cũ nếu bạn đã tạo trước đây.


CẬP NHẬT MỚI
------------
Website hiện đã được code sẵn ảnh mặc định:
- Hero Banner: assets/images/hero-main.png
- Banner phụ cạnh sản phẩm: assets/images/side-banner.png
- Ảnh Brand Story / Về chúng tôi: assets/images/story-main.png
- Banner cuối trang: assets/images/bottom-banner.png

Nguyên tắc hoạt động:
- Nếu trong Supabase chưa có ảnh mới, website dùng ảnh mặc định đã code sẵn.
- Khi bạn vào Admin và upload ảnh mới, website sẽ ưu tiên ảnh mới đó.

Ghi chú mới: đã sửa lỗi font tiếng Việt bằng cách dùng font web có hỗ trợ đầy đủ dấu tiếng Việt (Be Vietnam Pro + Playfair Display + Cormorant Garamond).

TYPOGRAPHY WEB ĐÃ CHỐT
----------------------
- Heading / Display: Lora (500–600)
- Body / Menu / CTA / Admin UI: Be Vietnam Pro (400–600)

Lý do: gần tinh thần TT Drugs + Glacial Indifference nhất trong nhóm font web miễn phí,
giữ cảm giác sang vừa đủ, giản dị, tinh tế và hỗ trợ tiếng Việt ổn định.
Khi sau này có file TT Drugs / Glacial Indifference hợp lệ, có thể thay font mà không cần đổi layout.

VỀ CHÚNG TÔI
-------------
- Đã thiết kế sẵn Câu chuyện doanh nghiệp, Sứ mệnh, Tầm nhìn.
- Có layout responsive riêng cho desktop và mobile.
- Nội dung Câu chuyện / Sứ mệnh / Tầm nhìn sửa được từ Admin -> Trang website.
- Logo lấy đúng file ngang từ Brand Guidelines hiện tại, không dùng logo AI.

QUY TẮC NỘI DUNG VỀ CHÚNG TÔI
------------------------------
- Phần Sứ mệnh và Tầm nhìn trên website dùng nguyên văn Brand Guidelines.
- Không thêm headline diễn giải, không viết lại câu chữ nếu chưa được duyệt.

RESPONSIVE DESKTOP + MOBILE (V2.2)
---------------------------------
Đây là 1 website responsive, không phải 2 website tách riêng.
Cùng một dữ liệu Supabase và cùng một Admin:
- Desktop: bố cục rộng, nhiều cột.
- Tablet: tự thu gọn.
- Mobile: menu hamburger, sản phẩm 2 cột, nội dung xếp dọc, form 1 cột.
- Chi tiết sản phẩm mobile có thanh Thêm vào giỏ hàng cố định phía dưới.
- Blog / bài viết / giỏ hàng / Về chúng tôi / Admin đều có layout mobile.
- Không thay đổi nội dung Sứ mệnh và Tầm nhìn đã chốt trong Brand Guidelines.

ADMIN VỀ CHÚNG TÔI - CRUD (V2.3)
--------------------------------
Admin có tab riêng “Về chúng tôi”:
- Thêm nội dung mới.
- Sửa nội dung.
- Xóa nội dung.
- Bật/tắt hiển thị.
- Đổi thứ tự.
- Upload ảnh.
- Loại nội dung: Câu chuyện doanh nghiệp / Sứ mệnh / Tầm nhìn / Giá trị / Nội dung thường.

Sứ mệnh và Tầm nhìn mặc định giữ nguyên câu chữ Brand Guidelines.
Nếu chủ shop chủ động sửa trong Admin thì website sẽ dùng nội dung mới đã lưu.

V2.4 - ABOUT IMAGES + ADMIN PRESETS
----------------------------------
- Không dùng ảnh trà.
- Có 3 ảnh thương hiệu mặc định cho trang Về chúng tôi:
  1) Câu chuyện thương hiệu
  2) Sứ mệnh
  3) Tầm nhìn
- Ảnh bám visual DNA: Lâm Đồng / cao nguyên / nông nghiệp / sương / ánh sáng tự nhiên.
- Admin có tab “Về chúng tôi” riêng.
- Trong form Về chúng tôi có 3 ảnh mẫu để chọn nhanh.
- Vẫn có thể upload ảnh riêng từ máy để thay thế.
- Sứ mệnh và Tầm nhìn giữ nguyên câu chữ Brand Guidelines.

V2.5 - FOOTER SLOGAN
--------------------
Slogan hiển thị dưới chân trang:
YOUR HEALTH, YOUR GREATEST WEALTH

Không dùng “Chọn điều phù hợp, sống điều mình yêu.” ở footer.

V2.6 - FULL ABOUT ADMIN
-----------------------
Trong Admin -> Về chúng tôi có thể sửa toàn bộ text và ảnh của trang:
- Phần mở đầu: breadcrumb, dòng nhỏ, tiêu đề, mô tả, ảnh nền.
- Câu chuyện: dòng nhỏ, tiêu đề, nội dung, slogan, ảnh.
- Sứ mệnh: tiêu đề, nội dung, ảnh.
- Tầm nhìn: tiêu đề, nội dung, ảnh.
- Giá trị cốt lõi: dòng nhỏ, tiêu đề giới thiệu, mô tả.
- Từng giá trị: tiêu đề + nội dung; có thể thêm/sửa/xóa.
- Khối kết trang: dòng nhỏ, câu kết, chữ nút, link nút.
- Nội dung bổ sung: có thể thêm/sửa/xóa và upload ảnh.

Mặc định dùng câu tự nhiên:
GIÁ TRỊ CỐT LÕI
Những giá trị chúng tôi luôn gìn giữ
“Chất lượng, minh bạch và sự tử tế là nền tảng trong từng sản phẩm và cách DON DUONG VILLAGE đồng hành cùng bạn.”


V2.7 - FINAL ABOUT CLOSING LINE
-------------------------------
Đã chốt câu kết trang “Về chúng tôi”:
“Chăm sóc sức khỏe hôm nay, gìn giữ yêu thương ngày mai”

Câu này là nội dung mặc định mới và vẫn có thể chỉnh trực tiếp trong Admin -> Về chúng tôi, không cần sửa code.


V2.8 - CLOSING LINE UPDATE
--------------------------
Câu kết trang “Về chúng tôi” được đổi thành:
“Chăm sóc sức khỏe hôm nay, gìn giữ yêu thương ngày mai”

Câu này vẫn có thể chỉnh trong Admin -> Về chúng tôi mà không cần sửa code.


V2.9 - MOBILE REFINEMENT
------------------------
Tối ưu giao diện điện thoại:
- Header thấp hơn và gọn hơn.
- Logo mobile nhỏ vừa phải, vẫn dễ nhận diện.
- Nút menu/giỏ hàng giữ vùng bấm dễ dùng.
- Giảm nhẹ kích thước các tiêu đề lớn trên mobile để giao diện thanh thoát hơn.
- Tối ưu khoảng cách phần Hero và trang Về chúng tôi.
- Không thay đổi giao diện desktop/tablet.
- Giữ nguyên câu kết: “Chăm sóc sức khỏe hôm nay, gìn giữ yêu thương ngày mai”.
