# Danh mục, sản phẩm liên quan và favicon — chờ duyệt

Branch `codex/categories-related-products-logo`, tạo từ `origin/main` commit `c27a3f4` (main đã có PR #1). Không merge/deploy/chạy SQL, không sửa Worker, cấu hình Auth, keys hoặc secret.

## Thay đổi

- Favicon trên cả 7 trang public và Admin dùng `assets/images/logo-mark.png`, sao chép nguyên file chủ shop cung cấp. SHA-256 `7cf8eb8d5a61bd774af0a8ff62b7a1693de893025643f9bbb5f65f66295b896c`; không crop/resize/generate. Logo ngang header/footer/sidebar/login không thay đổi. File gốc có nền và khoảng trống, nên biểu tượng nhỏ trên tab có thể không sắc nét như asset icon chuyên dụng; vẫn dùng nguyên bản được cung cấp.
- Xóa hẳn dòng “Dữ liệu cập nhật từ Admin” khỏi `products.html`, giữ tìm kiếm.
- Admin thêm tab Danh mục sản phẩm: CRUD name/slug/sort_order/is_active, confirm xóa, báo lỗi tiếng Việt. Slug có thể để trống để sinh từ tên; slug trùng bị chặn bởi database.
- Form sản phẩm có select Không phân loại và các danh mục từ DB (Admin thấy cả danh mục tắt), load/save `category_id`. Danh sách giữ thumbnail, Nổi bật, Trạng thái và thêm Danh mục. Nếu danh mục chưa tải được, field bị vô hiệu hóa và Save bỏ qua `category_id`, không tự xóa phân loại cũ.
- Public: sidebar desktop và nút lọc xuống dòng trên mobile. Category active sort theo `sort_order,id`; tìm kiếm và category kết hợp; sản phẩm không phân loại hoặc category tắt vẫn ở Tất cả nếu visible và không trash. Catalog/category đọc phân trang để không bị cắt ở giới hạn row mặc định của Supabase. Không có danh mục mẫu hard-code hoặc dữ liệu giả trong UI production.
- Sản phẩm liên quan dưới thông tin chi tiết: ưu tiên cùng category, bổ sung visible khác, loại current/hidden/trash, deduplicate, tối đa 4. Dùng chung `productCard` với trang chủ/catalog và pricing/discount helper hiện có. Nếu không có kết quả hoặc lỗi tải, không render dữ liệu giả và không chặn gallery/cart.

## Tệp thay đổi

- HTML: `index.html`, `products.html`, `product.html`, `about.html`, `article.html`, `blog.html`, `cart.html`, `admin/index.html`.
- Assets: `assets/images/logo-mark.png`, `assets/css/style.css`.
- JS: `assets/js/admin-categories.js` (mới), `product-card.js` (mới), `admin.js`, `home.js`, `products.js`, `product.js`, `supabase.js`.
- Migration mới: `migrations/011_product_categories.sql`.
- Backup: `assets/js/admin-backup.js` bổ sung `product_categories` vào JSON version 1, giữ toàn bộ bảng/format cũ. Admin có nút Danh mục CSV.
- Tests: `tests/check.cjs`, `browser.cjs`, `categories.cjs` (mới), `categories-browser.cjs` (mới), `backup.cjs` (mới).
- Tài liệu này. Không đổi logo ngang, Worker, checkout/lifecycle/auth migrations hoặc config/secrets.

## Database changes — chưa thực thi

`011_product_categories.sql` tạo bảng category identity bigint, timestamps, name, unique slug, sort_order, is_active; thêm `product.category_id bigint` nullable không default/backfill. FK `ON DELETE SET NULL` giữ product khi xóa category. Có index, trigger cập nhật `updated_at` và RLS. Anon chỉ đọc active. Authenticated thường được đọc active nhưng không ghi; ghi yêu cầu `ddv_is_admin() IS TRUE` ở permissive policy và restrictive write guards. Không thay product_images, checkout hoặc lifecycle. Khi chạy lại, pg_constraint guard dùng lại FK tương đương kể cả khác tên; FK sai định nghĩa hoặc trùng tên không tương đương làm transaction thất bại để chủ shop review. Trigger và các policy của migration được drop-if-exists rồi tạo lại trong cùng transaction; không có duplicate hoặc khoảng trống quyền giữa các transaction, không xóa/reset dữ liệu/identity/cột.

## Tests đã chạy

Tất cả dùng Node runtime và Edge headless có sẵn; backend giả lập. Không gửi request production.

1. `node tests/check.cjs` — syntax JS/Worker, pricing, CSV, asset references, favicon đúng mọi trang, hash logo nguyên bản.
2. `node tests/browser.cjs` — regression login URL/password, gallery/lightbox, 8 ảnh, reorder, xóa phụ/chính, primary sync, thêm ảnh, Mua ngay, giỏ giá giảm và mobile/desktop. Bảng Admin giữ thumbnail/Nổi bật/Trạng thái và thêm Không phân loại.
3. `node tests/worker.mjs` — regression auth/CORS/preflight/purge Worker, Worker source không đổi.
4. `node tests/migrations.cjs` — lifecycle authorization/order/grant kiểm tra tĩnh, không thực thi SQL.
5. `node tests/categories.cjs` — kiểm tra SQL tĩnh về nullable/FK SET NULL/RLS/additive; API giả lập kiểm tra category active/order/pagination, catalog visible/trash/limit/pagination, related ưu tiên/fallback/no-current/dedup/max4/không giả lập dữ liệu khi rỗng.
6. `node tests/categories-browser.cjs` — Admin create/edit/toggle/confirm/delete, form save/load numeric hoặc null, giữ classification khi DB query lỗi; public category/search/kết hợp, inactive/NULL/hidden/trash, related priority/discount/card link, không tràn ngang 320/390/1280. Fake FK/role rejection chỉ kiểm tra UI error paths, không chứng minh PostgreSQL RLS thực tế.
7. `git diff main --check` và `git diff origin/main --check` — qua; local main cũ không được chỉnh trực tiếp, base thực tế của branch là origin/main hiện tại.
8. `node tests/backup.cjs` — JSON format/version/8 bảng cũ nguyên vẹn, có bảng product_categories gồm active/inactive; CSV mọi bảng và Danh mục CSV; query category lỗi thì không tải full backup thiếu dữ liệu, nút được mở lại. `tests/categories.cjs` bổ sung kiểm tra tĩnh guards FK/trigger/toàn bộ policy khi rerun, không chạy SQL.

Kết quả: các kiểm tra trên qua. Screenshots `tests/categories-320.png`, `categories-390.png`, `categories-1280.png` được tạo để kiểm tra, không commit.

## Chủ shop thực hiện thủ công

1. Sao lưu DB và kiểm tra schema staging có `product` cùng `ddv_is_admin()`/admin allowlist đang hoạt động. Đọc `011_product_categories.sql`; nếu bảng/cột/constraint category đã có từ nguồn khác, cần đối chiếu trước. Trên staging, chủ shop có thể thử chạy lại migration: số FK/trigger/policy và dữ liệu/identity phải giữ nguyên. Codex chỉ kiểm tra SQL tĩnh, chưa thực thi lần đầu hoặc rerun trên PostgreSQL.
2. Trên staging, chạy migration sau khi duyệt. Xác nhận các product cũ giữ nguyên số lượng/nội dung và category_id null. Test FK thật: assign category vào product thử, xóa category, product giữ nguyên với category_id null.
3. Test RLS thật với anon, người đăng nhập thường và Admin: anon chỉ đọc active; non-admin không INSERT/UPDATE/DELETE; Admin manage và đọc inactive được. Kiểm tra product policy vẫn chặn hidden/trash.
4. Tạo danh mục thật từ Admin sau migration; không có danh mục mặc định được seed. Test thêm/sửa sản phẩm, category tùy chọn, discount/featured/stock/details, gallery 1/8 ảnh, upload/delete R2/reorder/save/reload và lifecycle/restore/checkout như hiện tại.
5. Sau staging, chủ shop chạy migration production khi đã duyệt, rồi mới duyệt merge/phát hành frontend. Codex không tự chạy các bước này. Không cần Worker deployment hoặc secret mới.
6. Kiểm tra favicon sau hard refresh hoặc tab mới vì trình duyệt có thể cache favicon cũ. Test catalog/related trên điện thoại thực tế, tìm kiếm và menu mobile, cart/checkout. Không có thay đổi logo ngang.

## Rủi ro và phần chưa test production

- Chưa chạy SQL hoặc xác minh RLS/FK/trigger trên PostgreSQL thật. `ON DELETE SET NULL` có thể bị product purge guard hiện có từ chối nếu category gắn với sản phẩm đang purge; trong trường hợp đó việc xóa category thất bại an toàn, không xóa product. Chờ purge hoàn tất rồi thử lại.
- Chưa thực hiện thao tác Auth, đơn hàng, gallery, R2 hoặc category trên production. Tests dữ liệu giả chỉ nằm trong `tests/` và không được load bởi HTML public/Admin.
- Category CRUD/API lỗi được báo hoặc fallback an toàn. Bảng/grid đọc phân trang không phải transactional snapshot nếu dữ liệu bị chỉnh đồng thời.
- Full JSON mới chứa cả `product_categories`, giữ format version 1. Nếu bảng category chưa có hoặc không đọc được, export báo lỗi và không tạo bản full backup thiếu bảng; các CSV bảng cũ vẫn hoạt động. JSON vẫn không gồm file ảnh R2 hoặc Auth users. Worker không đổi.
- Asset logo đã được dùng nguyên file theo yêu cầu; không làm icon phiên bản crop/sửa khác.

Favicon theo yêu cầu mới: assets/images/favicon.svg nhúng nguyên byte logo-mark.png, dùng viewBox vuông 120 0 455 455 để giảm nền trống ngang; preserveAspectRatio giữ tỉ lệ, không chỉnh màu hoặc vẽ lại. Kiểm tra thủ công: mở public/Admin, refresh favicon hoặc mở tab mới để tránh cache và xác nhận logo lớn hơn, đủ slogan.
