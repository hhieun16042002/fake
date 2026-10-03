/* Service worker của Đế Chế Vỉa Hè — file này là KHUÔN, plugin trong vite.config.ts điền mã bản build + danh sách file.
 *
 * Luật phiên bản:
 * - Mỗi bản build có một BUILD_ID riêng → một cache riêng `dcvh-<BUILD_ID>`; bản mới cài xong là xoá sạch cache cũ.
 * - Trang (HTML) luôn hỏi mạng trước; chỉ khi mất mạng mới lấy bản đã lưu → vào lại game là bản mới nhất.
 * - File trong /assets/ có băm nội dung trong tên nên lấy từ cache thẳng (không bao giờ lẫn phiên bản).
 * - version.json không bao giờ đi qua cache: trang dùng nó để phát hiện bản mới.
 */
const BUILD_ID = "0.1.0+7853491.dirty.20261002-065139";
const CACHE = `dcvh-${BUILD_ID}`;
const PRECACHE = [
  "/play/",
  "/play/assets/index-DdpGnxCm.js",
  "/play/assets/BooksPage-DHQNpBaM.js",
  "/play/assets/BufferResource-C9G6EBvN.js",
  "/play/assets/CanvasRenderer-C3fLjDyj.js",
  "/play/assets/Geometry-Dgutr63m.js",
  "/play/assets/JournalPage-BureD2wM.js",
  "/play/assets/RenderTargetSystem-BkO1f-XN.js",
  "/play/assets/WebGLRenderer-B2IOAush.js",
  "/play/assets/WebGPURenderer-CWwqQRem.js",
  "/play/assets/about-BuPYaKEl.js",
  "/play/assets/app-BXTRB95G.js",
  "/play/assets/browserAll-BFjOBMX_.js",
  "/play/assets/canvasUtils-BIkoNiFJ.js",
  "/play/assets/core-CFox_exR.js",
  "/play/assets/dist-js-CJHRHlhO.js",
  "/play/assets/dist-js-x-r_bAJk.js",
  "/play/assets/external-BAHMqHfN.js",
  "/play/assets/getTextureBatchBindGroup-pbbHDkL7.js",
  "/play/assets/idb-VuGht4Fk.js",
  "/play/assets/init-4tw296pO.js",
  "/play/assets/init-D_iuFLIV.js",
  "/play/assets/jsx-runtime-B3UZ_S3J.js",
  "/play/assets/local-lMS2XXbR.js",
  "/play/assets/main-IFeIvpOB.js",
  "/play/assets/nativeUpdate-D4veTJRH.js",
  "/play/assets/notify-BQA5qUqa.js",
  "/play/assets/opfs-CcZVLOTJ.js",
  "/play/assets/pen-fCvgZElO.js",
  "/play/assets/qrcode-NlNzQT0f.js",
  "/play/assets/rolldown-runtime-hePW80VL.js",
  "/play/assets/tauri-CmqnJURr.js",
  "/play/assets/town-ChqImK7T.js",
  "/play/assets/webworkerAll-BNavMsDT.js",
  "/play/assets/worldJson-DSgq5HsZ.js",
  "/play/assets/sqlite.worker-BiVcH5qq.js",
  "/play/assets/sqlite3-Con_VOcu.wasm",
  "/play/about.html",
  "/play/fonts/Baloo2-Bold.ttf",
  "/play/fonts/Mali-Bold.ttf",
  "/play/fonts/Mali-SemiBold.ttf",
  "/play/fonts/bvp-500-ext.woff2",
  "/play/fonts/bvp-500-lat.woff2",
  "/play/fonts/bvp-500-vi.woff2",
  "/play/fonts/bvp-600-ext.woff2",
  "/play/fonts/bvp-600-lat.woff2",
  "/play/fonts/bvp-600-vi.woff2",
  "/play/fonts/bvp-700-ext.woff2",
  "/play/fonts/bvp-700-lat.woff2",
  "/play/fonts/bvp-700-vi.woff2",
  "/play/gate/girl-wave-a.png",
  "/play/gate/girl-wave-b.png",
  "/play/gate/hero-point-a.png",
  "/play/gate/hero-point-b.png",
  "/play/gate/kid-phone-a.png",
  "/play/gate/kid-phone-b.png",
  "/play/icons/apple-touch-icon.png",
  "/play/icons/icon-192.png",
  "/play/icons/icon-512.png",
  "/play/icons/logo.png",
  "/play/icons/maskable-512.png",
  "/play/khoa-ke-toan/bai-1.jpg",
  "/play/khoa-ke-toan/bai-10.jpg",
  "/play/khoa-ke-toan/bai-2.jpg",
  "/play/khoa-ke-toan/bai-3.jpg",
  "/play/khoa-ke-toan/bai-4.jpg",
  "/play/khoa-ke-toan/bai-5.jpg",
  "/play/khoa-ke-toan/bai-6.jpg",
  "/play/khoa-ke-toan/bai-7.jpg",
  "/play/khoa-ke-toan/bai-8.jpg",
  "/play/khoa-ke-toan/bai-9.jpg",
  "/play/manifest.webmanifest",
  "/play/mien-tru-trach-nhiem.html",
  "/play/tac-gia.jpg",
  "/play/tam-su/hang-xom.jpg",
  "/play/tam-su/hu-tieu.jpg",
  "/play/tam-su/nga-tu.jpg",
  "/play/tam-su/poster-hu-tieu.jpg",
  "/play/tam-su/poster-luong.jpg",
  "/play/tam-su/quay-xoi.jpg",
  "/play/tam-su/tren-lau.jpg",
  "/play/tam-su/tu-ve-so.jpg",
  "/play/tam-su.html"
];
// thư mục game ("/" hoặc "/play/") — trang chủ ở ngoài thư mục này không do service worker này lo
const BASE = new URL(self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // KHÔNG tự thay bản đang chạy: chờ người chơi bấm "Cập nhật" (trang gửi "skip-waiting")
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("dcvh-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

// Web Push từ máy chủ (src/platform/push.ts, cloud/src/webpush.ts): luôn hiện thông báo (iOS / Chrome bắt buộc).
// `tag` theo đợt gửi → nhận trùng (hiếm) cũng chỉ hiện một cái.
self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { body: event.data ? event.data.text() : "" };
  }
  const icon = `${BASE}icons/icon-192.png`;
  // tin đẩy = máy chủ có chuyện mới (bản mới / bản tin / quà): nhắn game đang mở hỏi lại ngay, game đang tắt thì để dấu
  // trong hộp thư → mở lên hỏi ngay (ngoài ra game chỉ tự hỏi máy chủ mỗi 6 giờ)
  event.waitUntil(
    (async () => {
      const box = await caches.open(MAILBOX);
      await box.put(`${BASE}__check`, new Response(String(Date.now())));
      for (const c of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) c.postMessage({ type: "dcvh-check" });
    })().catch(() => {}),
  );
  event.waitUntil(
    self.registration.showNotification(d.title || "Đế Chế Vỉa Hè", {
      body: d.body || "",
      icon,
      badge: icon,
      tag: d.tag || "dcvh-push",
      renotify: false,
      lang: "vi",
      data: { url: d.url || BASE, kind: d.kind || "ping", bulletin: d.bulletin || null },
    }),
  );
});

// chạm vào thông báo. Thông báo KÈM DỮ LIỆU (bản tin khu phố): bắt chắc bằng 3 đường cùng lúc — game đang mở thì nhắn
// thẳng (postMessage), game đã tắt thì mở kèm ?tin=<mã>, và luôn bỏ "hộp thư" vào Cache Storage (game mở lên đọc — phòng
// khi iOS / Android bỏ mất tham số hoặc tin nhắn). Tên cache KHÔNG bắt đầu bằng "dcvh-" để lúc cập nhật không bị xoá.
const MAILBOX = "mailbox-dcvh";
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const target = new URL(d.url || BASE, self.location.origin);
  if (d.bulletin) target.searchParams.set("tin", String(d.bulletin));
  event.waitUntil(
    (async () => {
      if (d.bulletin) {
        const box = await caches.open(MAILBOX);
        await box.put(`${BASE}__mailbox`, new Response(JSON.stringify({ bulletin: d.bulletin, at: Date.now() }), { headers: { "content-type": "application/json" } }));
      }
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = list.find((client) => "focus" in client);
      if (open) {
        open.postMessage({ type: "dcvh-open", kind: d.kind, bulletin: d.bulletin || null });
        return open.focus();
      }
      return self.clients.openWindow(target.href);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === `${BASE}version.json` || url.pathname === `${BASE}sw.js`) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          // chỉ lưu trang game làm bản offline (trang tĩnh như /about.html không được đè lên "/")
          if (url.pathname === BASE || url.pathname === `${BASE}index.html`) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(BASE, copy));
          }
          return response;
        })
        .catch(() => caches.match(url.pathname === BASE || url.pathname === `${BASE}index.html` ? BASE : request, { cacheName: CACHE }).then((hit) => hit || caches.match(BASE))),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { cacheName: CACHE }).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok && url.pathname.startsWith(`${BASE}assets/`)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
