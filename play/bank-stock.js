// =========================================================================
// HỆ THỐNG NGÂN HÀNG & SÀN CHỨNG KHOÁN VỈA HÈ — HOA SUA INDEX
// =========================================================================

(function() {
  // Dữ liệu lưu trữ (Bank & Stocks)
  const STORAGE_KEY = 'dcvh_fin_data_v1';
  let finData = {
    agri: 0,           // Tiền gửi Ngân hàng Nhà Nước (3%/ngày)
    tindung: 0,        // Tiền gửi Quỹ Tín Dụng Vỉa Hè (18%/ngày, rủi ro 6%/ngày)
    lastDay: 1,        // Ngày tính lãi gần nhất
    lastClock: 0,      // Thời điểm tính lãi
    usd: 0,            // Số lượng $100 USD đang giữ
    usdRate: 2500,     // Tỷ giá quy đổi $100 USD (k)
    portfolio: {},     // Danh mục cổ phiếu: { [code]: { qty, avgPrice } }
    txHistory: []      // Lịch sử giao dịch
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      finData = Object.assign(finData, JSON.parse(saved));
    }
  } catch(e) {}

  function saveFinData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finData));
    } catch(e) {}
  }

  // Danh mục mã cổ phiếu trên sàn HOA SUA INDEX
  const STOCKS = [
    { code: 'VSO', name: 'CTCP Xổ Số Kiến Thiết', basePrice: 50, currentPrice: 50, refPrice: 50, history: [50, 50, 50], color: '#f4a261' },
    { code: 'NET', name: 'Cyber Game Nét Cỏ Corp', basePrice: 85, currentPrice: 85, refPrice: 85, history: [85, 85, 85], color: '#457b9d' },
    { code: 'FAN', name: 'CTCP OnlyFans Quạt Gió', basePrice: 120, currentPrice: 120, refPrice: 120, history: [120, 120, 120], color: '#e76f51' },
    { code: 'LOK', name: 'Loa Kẹo Kéo Holdings', basePrice: 65, currentPrice: 65, refPrice: 65, history: [65, 65, 65], color: '#dc2f02' },
    { code: 'XEM', name: 'Siêu Xe Vỉa Hè Auto', basePrice: 250, currentPrice: 250, refPrice: 250, history: [250, 250, 250], color: '#3d5a80' },
    { code: 'BAN', name: 'Chuỗi Bánh Xèo Miền Tây', basePrice: 40, currentPrice: 40, refPrice: 40, history: [40, 40, 40], color: '#2a9d8f' }
  ];

  let hsiIndex = 1250.5;
  let hsiChange = 0;

  // Cập nhật giá cổ phiếu thời gian thực (mỗi 2.5s)
  setInterval(() => {
    let totalPct = 0;
    STOCKS.forEach(stock => {
      // Biến động từ -4.5% đến +4.5%
      const deltaPct = (Math.random() - 0.48) * 0.07;
      let newPrice = Math.max(5, Math.round(stock.currentPrice * (1 + deltaPct) * 10) / 10);
      // Giới hạn biên độ trần/sàn +/- 7% so với refPrice
      const maxPrice = Math.round(stock.refPrice * 1.07 * 10) / 10;
      const minPrice = Math.round(stock.refPrice * 0.93 * 10) / 10;
      if (newPrice > maxPrice) newPrice = maxPrice;
      if (newPrice < minPrice) newPrice = minPrice;

      stock.currentPrice = newPrice;
      stock.history.push(newPrice);
      if (stock.history.length > 15) stock.history.shift();

      totalPct += (stock.currentPrice - stock.refPrice) / stock.refPrice;
    });

    hsiChange = Math.round(totalPct / STOCKS.length * 1000) / 10;
    hsiIndex = Math.max(500, Math.round((1250 + hsiChange * 15) * 10) / 10);

    // Render lại nếu bảng chứng khoán đang mở
    if (document.getElementById('stock-modal')?.style.display === 'flex') {
      renderStockBoard();
    }
  }, 2500);


  // Biến động tỷ giá USD chợ đen vỉa hè
  setInterval(() => {
    const delta = (Math.random() - 0.49) * 40;
    finData.usdRate = Math.max(2350, Math.min(2750, Math.round(finData.usdRate + delta)));
  }, 4000);

  // Hàm tính lãi ngân hàng chuẩn xác & tin cậy
  function calculateInterest(force = false) {
    const sim = window.__game?.p;
    if (!sim) return { agri: 0, tindung: 0, message: 'Game chưa kết nối!' };

    const currentDay = sim.day || 1;
    let daysPassed = currentDay - finData.lastDay;

    // Nếu người chơi bấm nút nhận lãi hoặc đã bước qua ngày mới
    if (daysPassed < 1 && force) {
      // Cho phép nhận lãi sớm nếu tài khoản có tiền gửi (tối thiểu 1 ngày lãi)
      daysPassed = 1;
    }

    if (daysPassed < 1) {
      return { agri: 0, tindung: 0, message: 'Chưa đủ chu kỳ ngày mới để nhận lãi thêm.' };
    }

    let agriGain = 0;
    let tdGain = 0;
    let broke = false;

    // 1. Tính lãi Ngân hàng Nhà Nước (3%/ngày)
    if (finData.agri > 0) {
      agriGain = Math.round(finData.agri * 0.03 * daysPassed);
      finData.agri += agriGain;
    }

    // 2. Tính lãi & rủi ro Quỹ Tín Dụng Vỉa Hè (18%/ngày, rủi ro bể 6%)
    if (finData.tindung > 0) {
      for (let i = 0; i < daysPassed; i++) {
        if (Math.random() < 0.06) {
          broke = true;
          break;
        }
      }
      if (broke) {
        const lost = finData.tindung;
        finData.tindung = 0;
        alert(`🚨 TIN SÉT ĐÁNH TẠI PHỐ HOA SỮA!\n\nChủ Quỹ Tín Dụng Đen đã ôm tiền bỏ trốn!\nBạn bị mất trắng ${lost.toLocaleString()}k tiền gửi!`);
      } else {
        tdGain = Math.round(finData.tindung * 0.18 * daysPassed);
        finData.tindung += tdGain;
      }
    }

    finData.lastDay = currentDay;
    saveFinData();

    if (agriGain > 0 || tdGain > 0) {
      const msg = `🏦 Đã nhận lãi ngày mới: +${(agriGain + tdGain).toLocaleString()}k (${agriGain > 0 ? 'Agri: +' + agriGain.toLocaleString() + 'k ' : ''}${tdGain > 0 ? 'Tín dụng: +' + tdGain.toLocaleString() + 'k' : ''})`;
      if (window.__game?.m?.hud) {
        window.__game.m.hud.toast(msg);
      }
      return { agri: agriGain, tindung: tdGain, message: msg };
    }

    return { agri: 0, tindung: 0, message: 'Số dư gửi hiện tại bằng 0, hãy gửi tiền để sinh lãi!' };
  }

  // Tự động kiểm tra và kết chuyển lãi mỗi 2.5s
  setInterval(() => {
    const sim = window.__game?.p;
    if (!sim || sim.demo) return;
    if (sim.day > finData.lastDay) {
      calculateInterest(false);
      renderBankUI();
    }
  }, 2500);

  // =========================================================================
  // SỰ KIỆN: CƯỚP QUẦY NGÂN HÀNG VỈA HÈ
  // =========================================================================
  window.__triggerBankRobbery = function() {
    if (typeof window.isHHieu === 'function' && !window.isHHieu()) {
      alert('Sự kiện chỉ mở cho người chơi HHieu!');
      return;
    }
    const sim = window.__game?.p;
    if (!sim) return;

    if (document.getElementById('robbery-modal')) {
      document.getElementById('robbery-modal').remove();
    }

    const modal = document.createElement('div');
    modal.id = 'robbery-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(180, 0, 0, 0.45); backdrop-filter: blur(10px);
      z-index: 10005; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, sans-serif; animation: alertFlash 0.6s infinite alternate;
    `;

    modal.innerHTML = `
      <div style="background: #1c1412; border: 2px solid #ff4444; border-radius: 20px; width: 460px; max-width: 92vw; padding: 24px; color: #fff; box-shadow: 0 0 50px rgba(255,0,0,0.8);">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 48px; margin-bottom: 4px;">🚨</div>
          <b style="color: #ff4444; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Báo Động Đỏ: Cướp Quầy Ngân Hàng!</b>
        </div>

        <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 14px; font-size: 13.5px; line-height: 1.6; color: #ffcccc; margin-bottom: 20px; border: 1px solid rgba(255,68,68,0.3);">
          Một tên cướp bịt mặt <b>"Tèo Xăm Trổ"</b> bất ngờ xông vào quầy ngân hàng vỉa hè, vung dao phay đe dọa đòi vét sạch tiền trong két! Khách rút tiền đang la hét hoảng loạn! Bạn sẽ làm gì?!
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="rob-btn-alarm" style="background: linear-gradient(135deg, #1f6feb, #0d47a1); color: #fff; border: 1px solid #388bfd; border-radius: 12px; padding: 12px; font-weight: bold; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;">
            <span style="font-size: 20px;">🚨</span>
            <div>
              <div>Bấm nút báo động đỏ ngầm gọi Công An Phường</div>
              <div style="font-size: 11px; color: #a5d6ff; font-weight: normal;">75% bắt được cướp + thưởng 500k · 25% cướp giật 50k chạy mất</div>
            </div>
          </button>

          <button id="rob-btn-fight" style="background: linear-gradient(135deg, #d29922, #9a6a1f); color: #fff; border: 1px solid #e3b341; border-radius: 12px; padding: 12px; font-weight: bold; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;">
            <span style="font-size: 20px;">🪑</span>
            <div>
              <div>Cầm ghế đẩu nhựa phang thẳng mặt cướp!</div>
              <div style="font-size: 11px; color: #ffe3a0; font-weight: normal;">60% hạ gục cướp + thưởng anh hùng 800k · 40% bị thương -100k</div>
            </div>
          </button>

          <button id="rob-btn-bribe" style="background: #30363d; color: #fff; border: 1px solid #484f58; border-radius: 12px; padding: 12px; font-weight: bold; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px; font-size: 13px;">
            <span style="font-size: 20px;">💵</span>
            <div>
              <div>Hòa hoãn ném tiền lẻ ra cửa câu giờ</div>
              <div style="font-size: 11px; color: #8b949e; font-weight: normal;">An toàn 100%, bảo vệ an toàn két sắt · Mất 30k tiền lẻ</div>
            </div>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#rob-btn-alarm').onclick = () => {
      modal.remove();
      if (Math.random() < 0.75) {
        sim.coins += 500;
        alert('👮 CHIẾN CÔNG XUẤT SẮC!\n\nCông an phường nghe chuông báo động ập tới kịp thời, quật ngã tên cướp thu hồi hung khí!\nChủ tịch phường trao tặng thưởng nóng +500,000đ!');
        if (window.__game?.m?.hud) window.__game.m.hud.toast('👮 Bắt gọn cướp ngân hàng! Nhận thưởng +500k!');
      } else {
        sim.coins = Math.max(0, sim.coins - 50);
        alert('🏃 Tên cướp nghe chuông hoảng hốt giật 50k trên bàn nhảy lên xe đồng bọn phóng mất dạng!');
      }
    };

    modal.querySelector('#rob-btn-fight').onclick = () => {
      modal.remove();
      if (Math.random() < 0.60) {
        sim.coins += 800;
        alert('🦸 ANH HÙNG ĐƯỜNG PHỐ!\n\nBạn tung cú phang ghế đẩu chuẩn xác khiến tên cướp choáng váng ngã lăn ra đất! Quần chúng nhân dân xúm lại trói chặt giao nộp!\nNgân hàng thưởng lớn +800,000đ!');
        if (window.__game?.m?.hud) window.__game.m.hud.toast('🦸 Hạ gục tên cướp! Thưởng nóng +800k!');
      } else {
        sim.coins = Math.max(0, sim.coins - 100);
        alert('💥 Bạn phang hụt và bị cướp xô ngã trầy tay, tốn 100k tiền băng bó thuốc men!');
      }
    };

    modal.querySelector('#rob-btn-bribe').onclick = () => {
      modal.remove();
      sim.coins = Math.max(0, sim.coins - 30);
      alert('🕊️ Bạn bình tĩnh ném 30k tiền lẻ ra ngoài cửa, tên cướp vơ vét rồi bỏ chạy. Toàn bộ tiền gửi của khách trong két được an toàn tuyệt đối!');
    };
  };

  // Ngẫu nhiên xảy ra cướp ngân hàng mỗi ngày khi mở quầy ngân hàng
  setInterval(() => {
    const sim = window.__game?.p;
    if (!sim || sim.demo || sim.phase !== 'open') return;
    const hasBankStall = sim.ownedSlots?.some(s => s.stallId === 'nganhang');
    if (hasBankStall && Math.random() < 0.05) {
      window.__triggerBankRobbery();
    }
  }, 45000);


  // =========================================================================
  // GIAO DIỆN MODAL NGÂN HÀNG
  // =========================================================================
  function createBankModal() {
    if (document.getElementById('bank-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'bank-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
      z-index: 10000; display: none; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: #1b1e23; border: 1px solid #30363d; border-radius: 20px; width: 440px; max-width: 92vw; padding: 22px; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #30363d; padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">🏦</span>
            <b style="font-size:17px; color:#58a6ff;">NGÂN HÀNG & TÍN DỤNG HOA SỮA</b>
          </div>
          <button id="bank-close-btn" style="background:none; border:none; color:#8b949e; font-size:20px; cursor:pointer;">✕</button>
        </div>

        <!-- Ví tiền mặt người chơi -->
        <div style="background:#0d1117; border-radius:12px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border:1px solid #21262d;">
          <span style="color:#8b949e; font-size:13px;">Tiền mặt trong ví:</span>
          <b id="bank-wallet-coins" style="font-size:17px; color:#3fb950;">0đ</b>
        </div>

        
        <!-- Nút Nhận Lãi Trực Tiếp & Kiểm Tra Ngày Mới -->
        <div style="background: linear-gradient(135deg, #1b382b, #0e2419); border: 1px solid #2ea043; border-radius: 12px; padding: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; font-size: 13px; color: #3fb950;">💰 Kết Chuyển Lãi Ngày Mới</div>
            <div style="font-size: 11px; color: #8b949e;">Lãi tích lũy tự động theo ngày</div>
          </div>
          <button id="btn-claim-interest" style="background: #238636; color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
            Nhận Lãi Ngay
          </button>
        </div>

        <!-- 2 Loại Ngân Hàng -->
        <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px;">
          <!-- 1. Ngân Hàng Nhà Nước -->
          <div style="background:#161b22; border:1px solid #238636; border-radius:14px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <b style="color:#3fb950; font-size:15px;">🏛️ Ngân Hàng Nhà Nước</b>
                <div style="font-size:12px; color:#8b949e; margin-top:2px;">Lãi suất <b>3%/ngày</b> · An toàn tuyệt đối 100%</div>
              </div>
              <span style="background:#23863633; color:#3fb950; border-radius:20px; font-size:11px; padding:3px 8px; font-weight:bold;">An Toàn</span>
            </div>
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#c9d1d9; font-size:13px;">Số dư đang gửi:</span>
              <b id="bank-agri-balance" style="font-size:16px; color:#fff;">0k</b>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
              <button id="btn-agri-deposit" style="flex:1; background:#238636; color:#fff; border:none; padding:8px 0; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">+ Gửi Tiền</button>
              <button id="btn-agri-withdraw" style="flex:1; background:#30363d; color:#fff; border:none; padding:8px 0; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">- Rút Tiền</button>
            </div>
          </div>

          <!-- 2. Quỹ Tín Dụng Vỉa Hè -->
          <div style="background:#161b22; border:1px solid #da3633; border-radius:14px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <b style="color:#f85149; font-size:15px;">💸 Quỹ Tín Dụng Đen Vỉa Hè</b>
                <div style="font-size:12px; color:#8b949e; margin-top:2px;">Lãi suất khủng <b>18%/ngày</b> · Rủi ro bể hụi <b>6%/ngày</b></div>
              </div>
              <span style="background:#da363333; color:#f85149; border-radius:20px; font-size:11px; padding:3px 8px; font-weight:bold;">Rủi Ro Cao</span>
            </div>
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#c9d1d9; font-size:13px;">Số dư đang gửi:</span>
              <b id="bank-tindung-balance" style="font-size:16px; color:#f85149;">0k</b>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px;">
              <button id="btn-td-deposit" style="flex:1; background:#da3633; color:#fff; border:none; padding:8px 0; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">+ Gửi Lãi Khủng</button>
              <button id="btn-td-withdraw" style="flex:1; background:#30363d; color:#fff; border:none; padding:8px 0; border-radius:8px; font-weight:bold; cursor:pointer; font-size:12px;">- Rút Tiền</button>
            </div>
          </div>
        </div>

        
        <!-- 3. Bàn Đổi Ngoại Tệ USD & Đổi Tiền Lẻ Vỉa Hè -->
        <div style="background:#161b22; border:1px solid #e3b341; border-radius:14px; padding:14px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <b style="color:#f0883e; font-size:14px;">💱 Bàn Đổi Ngoại Tệ & Đổi Tiền Lẻ</b>
            <span style="font-size:11px; color:#ffd33d;" id="bank-usd-rate-label">Tỷ giá: 2,500k / $100</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#c9d1d9; margin-bottom:10px;">
            <span>Đang sở hữu: <b id="bank-usd-balance" style="color:#58a6ff;">$0 USD</b></span>
            <span>Hoa hồng đổi tiền: <b style="color:#3fb950;">+10%</b></span>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <button id="btn-buy-usd" style="background:#1f6feb; color:#fff; border:none; padding:7px 0; border-radius:8px; font-weight:bold; font-size:11.5px; cursor:pointer;">💵 Mua $100 USD</button>
            <button id="btn-sell-usd" style="background:#238636; color:#fff; border:none; padding:7px 0; border-radius:8px; font-weight:bold; font-size:11.5px; cursor:pointer;">💰 Bán $100 USD</button>
          </div>
          <button id="btn-exchange-small" style="width:100%; margin-top:8px; background:#30363d; color:#e6edf3; border:1px solid #484f58; padding:7px 0; border-radius:8px; font-weight:bold; font-size:11.5px; cursor:pointer;">
            🔄 Đổi cọc 500k tiền lẻ mới (Thu phí +50k)
          </button>
        </div>

        <div style="font-size:11px; color:#8b949e; text-align:center;">
          💡 Tiền lãi được tự động kết chuyển vào số dư gửi mỗi khi bước sang ngày mới!
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#bank-close-btn').onclick = () => modal.style.display = 'none';

    // Xử lý gửi/rút
    modal.querySelector('#btn-agri-deposit').onclick = () => handleBankAction('deposit', 'agri');
    modal.querySelector('#btn-agri-withdraw').onclick = () => handleBankAction('withdraw', 'agri');
    modal.querySelector('#btn-td-deposit').onclick = () => handleBankAction('deposit', 'tindung');
    modal.querySelector('#btn-td-withdraw').onclick = () => handleBankAction('withdraw', 'tindung');

    // Nút nhận lãi
    modal.querySelector('#btn-claim-interest').onclick = () => {
      const res = calculateInterest(true);
      renderBankUI();
      alert(res.message);
    };

    // Đổi ngoại tệ USD
    modal.querySelector('#btn-buy-usd').onclick = () => {
      const sim = window.__game?.p;
      if (!sim) return;
      const cost = finData.usdRate || 2500;
      if ((sim.coins || 0) < cost) {
        alert(`Bạn không đủ tiền! Cần ${cost.toLocaleString()}k để mua $100 USD.`);
        return;
      }
      sim.coins -= cost;
      finData.usd = (finData.usd || 0) + 1;
      saveFinData();
      renderBankUI();
      if (window.__game?.m?.hud) window.__game.m.hud.toast(`Đã mua thành công $100 USD với giá ${cost.toLocaleString()}k!`);
    };

    modal.querySelector('#btn-sell-usd').onclick = () => {
      const sim = window.__game?.p;
      if (!sim) return;
      if ((finData.usd || 0) <= 0) {
        alert('Bạn không có đồng USD nào để bán!');
        return;
      }
      const revenue = finData.usdRate || 2500;
      sim.coins = (sim.coins || 0) + revenue;
      finData.usd -= 1;
      saveFinData();
      renderBankUI();
      if (window.__game?.m?.hud) window.__game.m.hud.toast(`Đã bán $100 USD thu về +${revenue.toLocaleString()}k tiền mặt!`);
    };

    // Đổi cọc 500k tiền lẻ mới
    modal.querySelector('#btn-exchange-small').onclick = () => {
      const sim = window.__game?.p;
      if (!sim) return;
      if ((sim.coins || 0) < 500) {
        alert('Cần có ít nhất 500k tiền mặt trong ví để đổi tiền lẻ!');
        return;
      }
      sim.coins += 50; // ăn hoa hồng 10%
      saveFinData();
      renderBankUI();
      alert('Đã đổi cọc 500k tiền chẵn lấy tiền lẻ mới seri đẹp cho khách đi lễ chùa! Thu tiền hoa hồng dịch vụ +50,000đ!');
      if (window.__game?.m?.hud) window.__game.m.hud.toast('Hoa hồng đổi tiền lẻ +50k!');
    };
  }

  function renderBankUI() {
    const sim = window.__game?.p;
    if (!sim) return;

    const coinsEl = document.getElementById('bank-wallet-coins');
    if (coinsEl) coinsEl.textContent = Math.round(sim.coins || 0).toLocaleString() + 'k';
    const agriEl = document.getElementById('bank-agri-balance');
    if (agriEl) agriEl.textContent = (finData.agri || 0).toLocaleString() + 'k';
    const tdEl = document.getElementById('bank-tindung-balance');
    if (tdEl) tdEl.textContent = (finData.tindung || 0).toLocaleString() + 'k';

    const usdEl = document.getElementById('bank-usd-balance');
    if (usdEl) usdEl.textContent = '$' + ((finData.usd || 0) * 100) + ' USD';
    const rateEl = document.getElementById('bank-usd-rate-label');
    if (rateEl) rateEl.textContent = 'Tỷ giá: ' + (finData.usdRate || 2500).toLocaleString() + 'k / $100';
  }

  function handleBankAction(action, type) {
    const sim = window.__game?.p;
    if (!sim) return;

    const bankName = type === 'agri' ? 'Ngân Hàng Nhà Nước' : 'Quỹ Tín Dụng Vỉa Hè';
    if (action === 'deposit') {
      const max = Math.floor(sim.coins || 0);
      if (max <= 0) {
        alert('Ví bạn không còn đồng nào để gửi!');
        return;
      }
      const valStr = prompt(`Nhập số tiền muốn gửi vào ${bankName} (Tối đa: ${max}k):`, Math.min(max, 500));
      const amount = parseInt(valStr, 10);
      if (!amount || amount <= 0 || amount > max) return;

      sim.coins -= amount;
      finData[type] += amount;
      saveFinData();
      renderBankUI();
      if (window.__game?.m?.hud) {
        window.__game.m.hud.toast(`Đã gửi thành công +${amount.toLocaleString()}k vào ${bankName}!`);
      }
    } else {
      const max = finData[type] || 0;
      if (max <= 0) {
        alert('Số dư tài khoản này đang bằng 0!');
        return;
      }
      const valStr = prompt(`Nhập số tiền muốn rút từ ${bankName} (Tối đa: ${max}k):`, max);
      const amount = parseInt(valStr, 10);
      if (!amount || amount <= 0 || amount > max) return;

      finData[type] -= amount;
      sim.coins += amount;
      saveFinData();
      renderBankUI();
      if (window.__game?.m?.hud) {
        window.__game.m.hud.toast(`Đã rút +${amount.toLocaleString()}k tiền mặt về ví!`);
      }
    }
  }

  // =========================================================================
  // GIAO DIỆN SÀN CHỨNG KHOÁN (HOA SUA INDEX)
  // =========================================================================
  function createStockModal() {
    if (document.getElementById('stock-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'stock-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
      z-index: 10000; display: none; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: #12151a; border: 1px solid #2d333b; border-radius: 20px; width: 680px; max-width: 95vw; max-height: 90vh; overflow-y:auto; padding: 22px; color: #fff; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2d333b; padding-bottom:12px; margin-bottom:14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:24px;">📈</span>
              <b style="font-size:18px; color:#58a6ff;">SÀN CHỨNG KHOÁN HOA SỮA INDEX</b>
            </div>
            <div id="hsi-stat-line" style="font-size:13px; margin-top:3px; color:#8b949e;">
              HSI: <b style="color:#3fb950; font-size:14px;">1,250.5</b> (+0.0%)
            </div>
          </div>
          <button id="stock-close-btn" style="background:none; border:none; color:#8b949e; font-size:22px; cursor:pointer;">✕</button>
        </div>

        <!-- Tiền mặt & Thống kê tài sản -->
        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <div style="flex:1; background:#1c2128; border-radius:12px; padding:10px 14px; border:1px solid #2d333b;">
            <div style="font-size:11px; color:#8b949e;">Tiền mặt khả dụng</div>
            <b id="stock-cash-available" style="font-size:16px; color:#3fb950;">0k</b>
          </div>
          <div style="flex:1; background:#1c2128; border-radius:12px; padding:10px 14px; border:1px solid #2d333b;">
            <div style="font-size:11px; color:#8b949e;">Giá trị danh mục cổ phiếu</div>
            <b id="stock-portfolio-val" style="font-size:16px; color:#58a6ff;">0k</b>
          </div>
        </div>

        <!-- Bảng điện tử cổ phiếu -->
        <div style="margin-bottom:16px;">
          <b style="font-size:13px; color:#8b949e; display:block; margin-bottom:8px;">BẢNG GIÁ THỜI GIAN THỰC:</b>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid #30363d; color:#8b949e; font-size:11px;">
                  <th style="padding:6px;">MÃ</th>
                  <th style="padding:6px;">TÊN DOANH NGHIỆP</th>
                  <th style="padding:6px; text-align:right;">THAM CHIẾU</th>
                  <th style="padding:6px; text-align:right;">GIÁ KHỚP</th>
                  <th style="padding:6px; text-align:right;">TĂNG/GIẢM</th>
                  <th style="padding:6px; text-align:center;">LỆNH</th>
                </tr>
              </thead>
              <tbody id="stock-table-body">
                <!-- Sẽ render động -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Danh mục sở hữu -->
        <div style="background:#161b22; border:1px solid #30363d; border-radius:14px; padding:14px;">
          <b style="font-size:13px; color:#f0f6fc; display:block; margin-bottom:8px;">💼 DANH MỤC CỔ PHIẾU ĐANG NẮM GIỮ:</b>
          <div id="stock-my-portfolio" style="font-size:12px; color:#8b949e;">
            Chưa sở hữu mã cổ phiếu nào. Hãy chọn mã ở trên để đặt lệnh Mua!
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#stock-close-btn').onclick = () => modal.style.display = 'none';
  }

  function renderStockBoard() {
    const sim = window.__game?.p;
    if (!sim) return;

    // Header stat
    const hsiEl = document.getElementById('hsi-stat-line');
    if (hsiEl) {
      const isUp = hsiChange >= 0;
      const color = isUp ? '#3fb950' : '#f85149';
      hsiEl.innerHTML = `Chỉ số HSI: <b style="color:${color}; font-size:15px;">${hsiIndex.toLocaleString()}</b> (<span style="color:${color};">${isUp ? '+' : ''}${hsiChange}%</span>)`;
    }

    // Cash stat
    const cashEl = document.getElementById('stock-cash-available');
    if (cashEl) cashEl.textContent = Math.round(sim.coins || 0).toLocaleString() + 'k';

    // Tính giá trị danh mục
    let portVal = 0;
    Object.keys(finData.portfolio).forEach(code => {
      const item = finData.portfolio[code];
      const stock = STOCKS.find(s => s.code === code);
      if (stock && item && item.qty > 0) {
        portVal += item.qty * stock.currentPrice;
      }
    });
    const portEl = document.getElementById('stock-portfolio-val');
    if (portEl) portEl.textContent = Math.round(portVal).toLocaleString() + 'k';

    // Bảng giá
    const tbody = document.getElementById('stock-table-body');
    if (tbody) {
      tbody.innerHTML = STOCKS.map(s => {
        const diff = Math.round((s.currentPrice - s.refPrice) * 10) / 10;
        const diffPct = Math.round((diff / s.refPrice) * 1000) / 10;

        let color = '#e3b341'; // Vàng tham chiếu
        let tag = '';
        if (diffPct >= 6.8) {
          color = '#d2a8ff'; // Tím trần
          tag = ' (TRẦN)';
        } else if (diffPct <= -6.8) {
          color = '#58a6ff'; // Xanh lơ sàn
          tag = ' (SÀN)';
        } else if (diff > 0) {
          color = '#3fb950'; // Xanh lá
        } else if (diff < 0) {
          color = '#f85149'; // Đỏ giảm
        }

        return `
          <tr style="border-bottom:1px solid #21262d;">
            <td style="padding:8px 6px;"><b style="color:${color}; font-size:14px;">${s.code}</b></td>
            <td style="padding:8px 6px; color:#c9d1d9; font-size:12px;">${s.name}</td>
            <td style="padding:8px 6px; text-align:right; color:#e3b341;">${s.refPrice}k</td>
            <td style="padding:8px 6px; text-align:right;"><b style="color:${color};">${s.currentPrice}k</b>${tag}</td>
            <td style="padding:8px 6px; text-align:right; color:${color}; font-weight:bold;">${diff >= 0 ? '+' : ''}${diffPct}%</td>
            <td style="padding:8px 6px; text-align:center;">
              <button onclick="window.__stockBuy('${s.code}')" style="background:#238636; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px; margin-right:4px;">MUA</button>
              <button onclick="window.__stockSell('${s.code}')" style="background:#da3633; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px;">BÁN</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Danh mục của tôi
    const portContainer = document.getElementById('stock-my-portfolio');
    if (portContainer) {
      const ownedKeys = Object.keys(finData.portfolio).filter(k => finData.portfolio[k]?.qty > 0);
      if (ownedKeys.length === 0) {
        portContainer.innerHTML = '<span style="color:#8b949e;">Bạn chưa mua cổ phiếu nào. Hãy bấm nút MUA ở trên!</span>';
      } else {
        portContainer.innerHTML = `
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="border-bottom:1px solid #30363d; color:#8b949e;">
                <th style="padding:4px;">MÃ</th>
                <th style="padding:4px; text-align:right;">SỐ LƯỢNG</th>
                <th style="padding:4px; text-align:right;">GIÁ MUA</th>
                <th style="padding:4px; text-align:right;">THỊ GIÁ</th>
                <th style="padding:4px; text-align:right;">LÃI/LỖ</th>
              </tr>
            </thead>
            <tbody>
              ${ownedKeys.map(k => {
                const item = finData.portfolio[k];
                const stock = STOCKS.find(s => s.code === k);
                const curPrice = stock ? stock.currentPrice : item.avgPrice;
                const profit = Math.round((curPrice - item.avgPrice) * item.qty);
                const profitPct = Math.round(((curPrice - item.avgPrice) / item.avgPrice) * 1000) / 10;
                const pColor = profit >= 0 ? '#3fb950' : '#f85149';
                return `
                  <tr style="border-bottom:1px solid #21262d;">
                    <td style="padding:6px 4px;"><b style="color:#58a6ff;">${k}</b></td>
                    <td style="padding:6px 4px; text-align:right;">${item.qty.toLocaleString()} cp</td>
                    <td style="padding:6px 4px; text-align:right;">${item.avgPrice}k</td>
                    <td style="padding:6px 4px; text-align:right;">${curPrice}k</td>
                    <td style="padding:6px 4px; text-align:right; color:${pColor}; font-weight:bold;">
                      ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}k (${profitPct}%)
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }
  }

  // Đặt lệnh MUA
  window.__stockBuy = function(code) {
    const sim = window.__game?.p;
    if (!sim) return;
    const stock = STOCKS.find(s => s.code === code);
    if (!stock) return;

    const maxAffordable = Math.floor((sim.coins || 0) / stock.currentPrice);
    if (maxAffordable <= 0) {
      alert(`Bạn không đủ tiền mua 1 cổ phiếu ${code} (Giá hiện tại: ${stock.currentPrice}k)!`);
      return;
    }

    const qtyStr = prompt(`Đặt lệnh MUA ${code}\nGiá khớp: ${stock.currentPrice}k\nSố lượng bạn có thể mua: tối đa ${maxAffordable} cổ phiếu\nNhập số lượng muốn mua:`, Math.min(maxAffordable, 10));
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0 || qty > maxAffordable) return;

    const totalCost = Math.round(qty * stock.currentPrice);
    sim.coins -= totalCost;

    if (!finData.portfolio[code]) {
      finData.portfolio[code] = { qty: 0, avgPrice: 0 };
    }
    const cur = finData.portfolio[code];
    const totalSpent = cur.qty * cur.avgPrice + totalCost;
    cur.qty += qty;
    cur.avgPrice = Math.round((totalSpent / cur.qty) * 10) / 10;

    saveFinData();
    renderStockBoard();
    if (window.__game?.m?.hud) {
      window.__game.m.hud.toast(`Khớp lệnh MUA: ${qty} cp ${code} với giá ${stock.currentPrice}k!`);
    }
  };

  // Đặt lệnh BÁN
  window.__stockSell = function(code) {
    const sim = window.__game?.p;
    if (!sim) return;
    const stock = STOCKS.find(s => s.code === code);
    const item = finData.portfolio[code];
    if (!stock || !item || item.qty <= 0) {
      alert(`Bạn không sở hữu cổ phiếu ${code} nào để bán!`);
      return;
    }

    const qtyStr = prompt(`Đặt lệnh BÁN ${code}\nGiá thị trường: ${stock.currentPrice}k (Giá mua TB: ${item.avgPrice}k)\nSố lượng đang giữ: ${item.qty} cp\nNhập số lượng muốn bán:`, item.qty);
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0 || qty > item.qty) return;

    const totalRevenue = Math.round(qty * stock.currentPrice);
    sim.coins += totalRevenue;
    const profit = Math.round((stock.currentPrice - item.avgPrice) * qty);

    item.qty -= qty;
    if (item.qty === 0) {
      delete finData.portfolio[code];
    }

    saveFinData();
    renderStockBoard();
    if (window.__game?.m?.hud) {
      const msg = profit >= 0 ? `Chốt lời +${profit.toLocaleString()}k!` : `Cắt lỗ ${profit.toLocaleString()}k!`;
      window.__game.m.hud.toast(`Khớp lệnh BÁN: ${qty} cp ${code}, thu về +${totalRevenue.toLocaleString()}k (${msg})`);
    }
  };

  // Mở Modals
  window.__openBank = function() {
    createBankModal();
    renderBankUI();
    document.getElementById('bank-modal').style.display = 'flex';
  };

  window.__openStocks = function() {
    createStockModal();
    renderStockBoard();
    document.getElementById('stock-modal').style.display = 'flex';
  };

  // Thêm 2 nút bấm nổi bật trên màn hình: CĂN GIỮA ĐỈNH MÀN HÌNH, THU NHỎ TRÊN MOBILE
  function addTopButtons() {
    if (document.getElementById('top-fin-bar')) return;

    if (!document.getElementById('fin-btn-styles')) {
      const style = document.createElement('style');
      style.id = 'fin-btn-styles';
      style.textContent = `
        #top-fin-bar {
          position: fixed;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9990;
          display: flex;
          gap: 8px;
          max-width: 95vw;
          justify-content: center;
          align-items: center;
          pointer-events: auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .top-fin-btn {
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.45);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: transform 0.15s, opacity 0.15s;
          user-select: none;
        }
        .top-fin-btn:hover {
          transform: translateY(-1px) scale(1.03);
        }
        .top-fin-btn:active {
          transform: translateY(1px) scale(0.97);
        }
        #top-btn-bank {
          background: linear-gradient(135deg, #1f6feb, #0d47a1);
          color: #fff;
          border: 1px solid #388bfd;
        }
        #top-btn-stocks {
          background: linear-gradient(135deg, #238636, #14532d);
          color: #fff;
          border: 1px solid #2ea043;
        }
        @media (max-width: 640px) {
          #top-fin-bar {
            top: 4px;
            gap: 4px;
          }
          .top-fin-btn {
            padding: 4px 8px;
            font-size: 11px;
            border-radius: 12px;
            gap: 4px;
          }
          .top-fin-btn .fin-sub {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const bar = document.createElement('div');
    bar.id = 'top-fin-bar';
    if (typeof window.isHHieu === 'function' && !window.isHHieu()) {
      bar.style.display = 'none';
    }
    bar.innerHTML = `
      <button id="top-btn-bank" class="top-fin-btn" title="Gửi tiền ngân hàng nhận lãi mỗi ngày">
        <span>🏦</span> <span>Gửi Tiền <span class="fin-sub">(Lãi 3-18%)</span></span>
      </button>
      <button id="top-btn-stocks" class="top-fin-btn" title="Sàn chứng khoán Hoa Sữa Index">
        <span>📈</span> <span>Chứng Khoán <span class="fin-sub">Index</span></span>
      </button>
    `;

    document.body.appendChild(bar);

    bar.querySelector('#top-btn-bank').onclick = () => window.__openBank();
    bar.querySelector('#top-btn-stocks').onclick = () => window.__openStocks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTopButtons);
  } else {
    addTopButtons();
  }

  // =========================================================================
  // GIAO DIỆN SÀN CHỨNG KHOÁN (HOA SUA INDEX)
  // =========================================================================
  function createStockModal() {
    if (document.getElementById('stock-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'stock-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
      z-index: 10000; display: none; align-items: center; justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
      <div style="background: #12151a; border: 1px solid #2d333b; border-radius: 20px; width: 680px; max-width: 95vw; max-height: 90vh; overflow-y:auto; padding: 22px; color: #fff; box-shadow: 0 25px 60px rgba(0,0,0,0.9);">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2d333b; padding-bottom:12px; margin-bottom:14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:24px;">📈</span>
              <b style="font-size:18px; color:#58a6ff;">SÀN CHỨNG KHOÁN HOA SỮA INDEX</b>
            </div>
            <div id="hsi-stat-line" style="font-size:13px; margin-top:3px; color:#8b949e;">
              HSI: <b style="color:#3fb950; font-size:14px;">1,250.5</b> (+0.0%)
            </div>
          </div>
          <button id="stock-close-btn" style="background:none; border:none; color:#8b949e; font-size:22px; cursor:pointer;">✕</button>
        </div>

        <!-- Tiền mặt & Thống kê tài sản -->
        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <div style="flex:1; background:#1c2128; border-radius:12px; padding:10px 14px; border:1px solid #2d333b;">
            <div style="font-size:11px; color:#8b949e;">Tiền mặt khả dụng</div>
            <b id="stock-cash-available" style="font-size:16px; color:#3fb950;">0k</b>
          </div>
          <div style="flex:1; background:#1c2128; border-radius:12px; padding:10px 14px; border:1px solid #2d333b;">
            <div style="font-size:11px; color:#8b949e;">Giá trị danh mục cổ phiếu</div>
            <b id="stock-portfolio-val" style="font-size:16px; color:#58a6ff;">0k</b>
          </div>
        </div>

        <!-- Bảng điện tử cổ phiếu -->
        <div style="margin-bottom:16px;">
          <b style="font-size:13px; color:#8b949e; display:block; margin-bottom:8px;">BẢNG GIÁ THỜI GIAN THỰC:</b>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid #30363d; color:#8b949e; font-size:11px;">
                  <th style="padding:6px;">MÃ</th>
                  <th style="padding:6px;">TÊN DOANH NGHIỆP</th>
                  <th style="padding:6px; text-align:right;">THAM CHIẾU</th>
                  <th style="padding:6px; text-align:right;">GIÁ KHỚP</th>
                  <th style="padding:6px; text-align:right;">TĂNG/GIẢM</th>
                  <th style="padding:6px; text-align:center;">LỆNH</th>
                </tr>
              </thead>
              <tbody id="stock-table-body">
                <!-- Sẽ render động -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Danh mục sở hữu -->
        <div style="background:#161b22; border:1px solid #30363d; border-radius:14px; padding:14px;">
          <b style="font-size:13px; color:#f0f6fc; display:block; margin-bottom:8px;">💼 DANH MỤC CỔ PHIẾU ĐANG NẮM GIỮ:</b>
          <div id="stock-my-portfolio" style="font-size:12px; color:#8b949e;">
            Chưa sở hữu mã cổ phiếu nào. Hãy chọn mã ở trên để đặt lệnh Mua!
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#stock-close-btn').onclick = () => modal.style.display = 'none';
  }

  function renderStockBoard() {
    const sim = window.__game?.p;
    if (!sim) return;

    // Header stat
    const hsiEl = document.getElementById('hsi-stat-line');
    if (hsiEl) {
      const isUp = hsiChange >= 0;
      const color = isUp ? '#3fb950' : '#f85149';
      hsiEl.innerHTML = `Chỉ số HSI: <b style="color:${color}; font-size:15px;">${hsiIndex.toLocaleString()}</b> (<span style="color:${color};">${isUp ? '+' : ''}${hsiChange}%</span>)`;
    }

    // Cash stat
    const cashEl = document.getElementById('stock-cash-available');
    if (cashEl) cashEl.textContent = Math.round(sim.coins || 0).toLocaleString() + 'k';

    // Tính giá trị danh mục
    let portVal = 0;
    Object.keys(finData.portfolio).forEach(code => {
      const item = finData.portfolio[code];
      const stock = STOCKS.find(s => s.code === code);
      if (stock && item && item.qty > 0) {
        portVal += item.qty * stock.currentPrice;
      }
    });
    const portEl = document.getElementById('stock-portfolio-val');
    if (portEl) portEl.textContent = Math.round(portVal).toLocaleString() + 'k';

    // Bảng giá
    const tbody = document.getElementById('stock-table-body');
    if (tbody) {
      tbody.innerHTML = STOCKS.map(s => {
        const diff = Math.round((s.currentPrice - s.refPrice) * 10) / 10;
        const diffPct = Math.round((diff / s.refPrice) * 1000) / 10;

        let color = '#e3b341'; // Vàng tham chiếu
        let tag = '';
        if (diffPct >= 6.8) {
          color = '#d2a8ff'; // Tím trần
          tag = ' (TRẦN)';
        } else if (diffPct <= -6.8) {
          color = '#58a6ff'; // Xanh lơ sàn
          tag = ' (SÀN)';
        } else if (diff > 0) {
          color = '#3fb950'; // Xanh lá
        } else if (diff < 0) {
          color = '#f85149'; // Đỏ giảm
        }

        return `
          <tr style="border-bottom:1px solid #21262d;">
            <td style="padding:8px 6px;"><b style="color:${color}; font-size:14px;">${s.code}</b></td>
            <td style="padding:8px 6px; color:#c9d1d9; font-size:12px;">${s.name}</td>
            <td style="padding:8px 6px; text-align:right; color:#e3b341;">${s.refPrice}k</td>
            <td style="padding:8px 6px; text-align:right;"><b style="color:${color};">${s.currentPrice}k</b>${tag}</td>
            <td style="padding:8px 6px; text-align:right; color:${color}; font-weight:bold;">${diff >= 0 ? '+' : ''}${diffPct}%</td>
            <td style="padding:8px 6px; text-align:center;">
              <button onclick="window.__stockBuy('${s.code}')" style="background:#238636; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px; margin-right:4px;">MUA</button>
              <button onclick="window.__stockSell('${s.code}')" style="background:#da3633; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:11px;">BÁN</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Danh mục của tôi
    const portContainer = document.getElementById('stock-my-portfolio');
    if (portContainer) {
      const ownedKeys = Object.keys(finData.portfolio).filter(k => finData.portfolio[k]?.qty > 0);
      if (ownedKeys.length === 0) {
        portContainer.innerHTML = '<span style="color:#8b949e;">Bạn chưa mua cổ phiếu nào. Hãy bấm nút MUA ở trên!</span>';
      } else {
        portContainer.innerHTML = `
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="border-bottom:1px solid #30363d; color:#8b949e;">
                <th style="padding:4px;">MÃ</th>
                <th style="padding:4px; text-align:right;">SỐ LƯỢNG</th>
                <th style="padding:4px; text-align:right;">GIÁ MUA</th>
                <th style="padding:4px; text-align:right;">THỊ GIÁ</th>
                <th style="padding:4px; text-align:right;">LÃI/LỖ</th>
              </tr>
            </thead>
            <tbody>
              ${ownedKeys.map(k => {
                const item = finData.portfolio[k];
                const stock = STOCKS.find(s => s.code === k);
                const curPrice = stock ? stock.currentPrice : item.avgPrice;
                const profit = Math.round((curPrice - item.avgPrice) * item.qty);
                const profitPct = Math.round(((curPrice - item.avgPrice) / item.avgPrice) * 1000) / 10;
                const pColor = profit >= 0 ? '#3fb950' : '#f85149';
                return `
                  <tr style="border-bottom:1px solid #21262d;">
                    <td style="padding:6px 4px;"><b style="color:#58a6ff;">${k}</b></td>
                    <td style="padding:6px 4px; text-align:right;">${item.qty.toLocaleString()} cp</td>
                    <td style="padding:6px 4px; text-align:right;">${item.avgPrice}k</td>
                    <td style="padding:6px 4px; text-align:right;">${curPrice}k</td>
                    <td style="padding:6px 4px; text-align:right; color:${pColor}; font-weight:bold;">
                      ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}k (${profitPct}%)
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }
  }

  // Đặt lệnh MUA
  window.__stockBuy = function(code) {
    const sim = window.__game?.p;
    if (!sim) return;
    const stock = STOCKS.find(s => s.code === code);
    if (!stock) return;

    const maxAffordable = Math.floor((sim.coins || 0) / stock.currentPrice);
    if (maxAffordable <= 0) {
      alert(`Bạn không đủ tiền mua 1 cổ phiếu ${code} (Giá hiện tại: ${stock.currentPrice}k)!`);
      return;
    }

    const qtyStr = prompt(`Đặt lệnh MUA ${code}\nGiá khớp: ${stock.currentPrice}k\nSố lượng bạn có thể mua: tối đa ${maxAffordable} cổ phiếu\nNhập số lượng muốn mua:`, Math.min(maxAffordable, 10));
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0 || qty > maxAffordable) return;

    const totalCost = Math.round(qty * stock.currentPrice);
    sim.coins -= totalCost;

    if (!finData.portfolio[code]) {
      finData.portfolio[code] = { qty: 0, avgPrice: 0 };
    }
    const cur = finData.portfolio[code];
    const totalSpent = cur.qty * cur.avgPrice + totalCost;
    cur.qty += qty;
    cur.avgPrice = Math.round((totalSpent / cur.qty) * 10) / 10;

    saveFinData();
    renderStockBoard();
    if (window.__game?.m?.hud) {
      window.__game.m.hud.toast(`Khớp lệnh MUA: ${qty} cp ${code} với giá ${stock.currentPrice}k!`);
    }
  };

  // Đặt lệnh BÁN
  window.__stockSell = function(code) {
    const sim = window.__game?.p;
    if (!sim) return;
    const stock = STOCKS.find(s => s.code === code);
    const item = finData.portfolio[code];
    if (!stock || !item || item.qty <= 0) {
      alert(`Bạn không sở hữu cổ phiếu ${code} nào để bán!`);
      return;
    }

    const qtyStr = prompt(`Đặt lệnh BÁN ${code}\nGiá thị trường: ${stock.currentPrice}k (Giá mua TB: ${item.avgPrice}k)\nSố lượng đang giữ: ${item.qty} cp\nNhập số lượng muốn bán:`, item.qty);
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0 || qty > item.qty) return;

    const totalRevenue = Math.round(qty * stock.currentPrice);
    sim.coins += totalRevenue;
    const profit = Math.round((stock.currentPrice - item.avgPrice) * qty);

    item.qty -= qty;
    if (item.qty === 0) {
      delete finData.portfolio[code];
    }

    saveFinData();
    renderStockBoard();
    if (window.__game?.m?.hud) {
      const msg = profit >= 0 ? `Chốt lời +${profit.toLocaleString()}k!` : `Cắt lỗ ${profit.toLocaleString()}k!`;
      window.__game.m.hud.toast(`Khớp lệnh BÁN: ${qty} cp ${code}, thu về +${totalRevenue.toLocaleString()}k (${msg})`);
    }
  };

  // Mở Modals
  window.__openBank = function() {
    if (typeof window.isHHieu === 'function' && !window.isHHieu()) {
      alert('Chức năng Ngân Hàng chỉ mở cho người chơi HHieu!');
      return;
    }
    createBankModal();
    renderBankUI();
    document.getElementById('bank-modal').style.display = 'flex';
  };

  window.__openStocks = function() {
    if (typeof window.isHHieu === 'function' && !window.isHHieu()) {
      alert('Chức năng Chứng Khoán chỉ mở cho người chơi HHieu!');
      return;
    }
    createStockModal();
    renderStockBoard();
    document.getElementById('stock-modal').style.display = 'flex';
  };
})();
