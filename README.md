# 🏪 Đế Chế Vỉa Hè (Bản Chạy Offline / Local)

Trò chơi mô phỏng kinh doanh vỉa hè Sài Gòn — từ một tủ vé số ở góc ngã tư, gây dựng chuỗi quán xôi, nước mía, cà phê, bánh mì... và khám phá những bí mật trong xóm phố Hoa Sữa.

---

## 🚀 Cách khởi động và chơi game

### Cách 1: Chạy bằng file `start.bat` (Nhanh nhất trên Windows)
- Nhấp đúp chuột vào file **`start.bat`** trong thư mục này. Trình duyệt sẽ tự động mở game.

### Cách 2: Chạy bằng dòng lệnh Node.js
```bash
# Cài đặt hoặc chạy trực tiếp bằng Node.js có sẵn:
node server.js
```
hoặc
```bash
npm start
```

Sau khi chạy lệnh, mở trình duyệt truy cập:
- 🎯 **Chơi game ngay:** [http://localhost:3000/play/](http://localhost:3000/play/)
- 🏠 **Trang chủ & Giới thiệu:** [http://localhost:3000/](http://localhost:3000/)
- 📖 **Cẩm nang & Hướng dẫn chơi:** [http://localhost:3000/huong-dan/](http://localhost:3000/huong-dan/)

---

## 📁 Cấu trúc thư mục

- `/play/`: Mã nguồn & tài nguyên game chính:
  - `index.html`: File khởi chạy canvas game
  - `assets/`: Toàn bộ engine Pixi.js, SQLite WASM, Web Worker và logic game
  - `fonts/`: Phông chữ Mali, Baloo 2, Be Vietnam Pro
  - `gate/`, `icons/`, `khoa-ke-toan/`, `tam-su/`: Toàn bộ hình ảnh, đồ họa và spritesheets
  - `sw.js`: Service worker hỗ trợ chơi offline
- `/huong-dan/`: Cẩm nang hướng dẫn đầy đủ từ bài 1 đến bài 13
- `/cai/`, `/gioi-thieu/`, `/chuyen-nha/`, `/about/`, `/tam-su/`: Các trang thông tin, giới thiệu và lưu trữ dữ liệu
- `server.js`: Web server nhẹ viết bằng Node.js tích hợp sẵn hỗ trợ đầy đủ MIME types (WASM, Manifest, Fonts, Scripts) và HTTP Range streaming.
- `start.bat`: File chạy nhanh một chạm cho người dùng Windows.
