// =========================================================================
// HỆ THỐNG BẤT ĐỘNG SẢN, SHOWROOM XE & TÍCH HỢP TIỆM TRÀ MƠ ƯỚC
// =========================================================================

(function() {
  // -----------------------------------------------------------------------
  // 1. DỮ LIỆU & STORAGE
  // -----------------------------------------------------------------------
  const ESTATE_KEY = 'dcvh_real_estate_v1';
  const VEHICLE_KEY = 'dcvh_vehicles_v1';

  let estateData = {
    owned: [],        // danh sách id nhà sở hữu
    lastRentDay: 0,   // ngày kết toán tiền thuê gần nhất
    totalRentEarned: 0
  };

  let vehicleData = {
    owned: ['xedap'], // tặng sẵn xe đạp cho người chơi trải nghiệm
    active: 'xedap',
    riding: false
  };

  try {
    const sE = localStorage.getItem(ESTATE_KEY);
    if (sE) estateData = Object.assign(estateData, JSON.parse(sE));
    const sV = localStorage.getItem(VEHICLE_KEY);
    if (sV) vehicleData = Object.assign(vehicleData, JSON.parse(sV));
  } catch(e) {}

  function saveEstate() {
    try { localStorage.setItem(ESTATE_KEY, JSON.stringify(estateData)); } catch(e) {}
  }
  function saveVehicle() {
    try { localStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicleData)); } catch(e) {}
  }

  // -----------------------------------------------------------------------
  // 2. DANH MỤC BẤT ĐỘNG SẢN & SHOWROOM XE
  // -----------------------------------------------------------------------
  const REAL_ESTATES = [
    {
      id: 'nhatro',
      name: 'Nhà trọ / Gác lửng sinh viên',
      icon: '🏚️',
      price: 500, // 500k = 500.000đ
      rentPerDay: 25, // 25k/ngày
      desc: 'Gác lửng bình dân, người làm thuê & sinh viên thuê ở ổn định mỗi ngày.'
    },
    {
      id: 'nhapho',
      name: 'Nhà phố 2 tầng mặt tiền Hoa Sữa',
      icon: '🏡',
      price: 2500, // 2.500.000đ
      rentPerDay: 120, // 120k/ngày
      desc: 'Mặt tiền đắc địa kinh doanh sầm uất, khách qua lại đông đúc.'
    },
    {
      id: 'bietthu',
      name: 'Biệt thự sân vườn phố Hoa Sữa',
      icon: '🏰',
      price: 10000, // 10.000.000đ
      rentPerDay: 500, // 500k/ngày
      buff: 'Tăng +20% kiên nhẫn toàn bộ khách trên phố',
      desc: 'Dinh thự vườn cây xanh mát, nâng tầm đẳng cấp ông trùm vỉa hè.'
    },
    {
      id: 'penthouse',
      name: 'Tòa Penthouse & Khách sạn Đế Chế',
      icon: '🏙️',
      price: 50000, // 50.000.000đ
      rentPerDay: 2500, // 2.500k = 2.500.000đ/ngày
      buff: 'Thu nhập khổng lồ & miễn nhiễm phạt quy hoạch',
      desc: 'Biểu tượng vương quyền phố Hoa Sữa, thu nhập thụ động khủng mỗi ngày.'
    }
  ];

  const VEHICLES = [
    {
      id: 'xedap',
      name: 'Xe đạp Phượng Hoàng cổ điển',
      icon: '🚲',
      price: 150, // 150k
      speedMult: 1.6,
      sound: 'Keng keng! Xe đạp Phượng Hoàng tới nè! 🔔',
      desc: 'Nồi đồng cối đá, chở đồ siêu khỏe, bấm chuông keng keng vui tai.'
    },
    {
      id: 'cub50',
      name: 'Honda Super Cub 50 huyền thoại',
      icon: '🛵',
      price: 450, // 450k
      speedMult: 2.2,
      sound: 'Tạch tạch bành bành! Cub 50 bon bon! 💨',
      desc: 'Bền bỉ tiết kiệm xăng số một, luồn lách mọi con hẻm phố xá.'
    },
    {
      id: 'wave',
      name: 'Honda Wave Alpha đỏ quốc dân',
      icon: '🏍️',
      price: 1200, // 1.2M
      speedMult: 3.0,
      sound: 'Vroooom! Wave đỏ lướt gió! 🚀',
      desc: 'Chiến mã đường phố của dân vỉa hè, vít ga là lướt vèo vèo.'
    },
    {
      id: 'sh150',
      name: 'Xe ga Honda SH 150i sang xịn',
      icon: '✨🛵',
      price: 5000, // 5M
      speedMult: 4.0,
      sound: 'Bípp píp! SH 150i chủ tịch xuất chiêu! 🌟',
      desc: 'Xe chủ tịch đi thị sát, hào quang sáng loáng thu hút mọi ánh nhìn.'
    },
    {
      id: 'porsche',
      name: 'Siêu xe Thể Thao Porsche 911 Vỉa Hè',
      icon: '🏎️',
      price: 25000, // 25M
      speedMult: 6.0,
      sound: 'Gầm rú gầm rú! Siêu xe Porsche gầm vang phố Hoa Sữa! 🔥',
      desc: 'Đẳng cấp thượng lưu tột đỉnh, khách trầm trồ tự động kéo vào ủng hộ quán.'
    }
  ];

  function formatMoney(k) {
    return (k * 1000).toLocaleString('vi-VN') + 'đ';
  }

  function getSim() {
    return window.__game?.p || window.sim;
  }

  // -----------------------------------------------------------------------
  // 3. TỰ ĐỘNG KẾT TOÁN TIỀN THUÊ NHÀ HÀNG NGÀY
  // -----------------------------------------------------------------------
  function checkDailyRent() {
    const sim = getSim();
    if (!sim || sim.demo || !sim.day) return;

    if (estateData.lastRentDay === 0) {
      estateData.lastRentDay = sim.day;
      saveEstate();
      return;
    }

    if (sim.day > estateData.lastRentDay) {
      const daysPassed = sim.day - estateData.lastRentDay;
      let totalDailyRent = 0;
      const collectedNames = [];

      estateData.owned.forEach(id => {
        const est = REAL_ESTATES.find(e => e.id === id);
        if (est) {
          totalDailyRent += est.rentPerDay;
          collectedNames.push(est.name);
        }
      });

      if (totalDailyRent > 0) {
        const totalCoins = totalDailyRent * daysPassed;
        sim.coins = (sim.coins || 0) + totalCoins;
        estateData.totalRentEarned = (estateData.totalRentEarned || 0) + totalCoins;

        if (typeof sim.book === 'function') {
          sim.book('thu', 'rent', `Thu tiền thuê ${collectedNames.length} BĐS (${daysPassed} ngày)`, totalCoins, 0, void 0, sim.playerName || 'Chủ nhà');
        }

        const toastMsg = `🏡 Thu tiền thuê nhà (${daysPassed} ngày): +${formatMoney(totalCoins)} vào ví!`;
        if (window.__game?.m?.hud?.toast) {
          window.__game.m.hud.toast(toastMsg);
        } else {
          console.log(toastMsg);
        }
      }

      estateData.lastRentDay = sim.day;
      saveEstate();
    }
  }

  // -----------------------------------------------------------------------
  // 4. CƠ CHẾ CƯỠI XE & TỐC ĐỘ DI CHUYỂN
  // -----------------------------------------------------------------------
  let rideInterval = null;

  function updateHeroSpeed() {
    const sim = getSim();
    if (!sim || !sim.hero) return;

    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];

    if (vehicleData.riding) {
      sim.hero.speedMult = currentVeh.speedMult;
      sim.hero.ridingVehicle = currentVeh.name;
    } else {
      sim.hero.speedMult = 1.0;
      sim.hero.ridingVehicle = null;
    }
  }

  function toggleRide() {
    if (!vehicleData.owned || vehicleData.owned.length === 0) {
      alert('Bạn chưa sở hữu xe nào! Hãy vào Showroom Phương Tiện để sắm xe nhé.');
      return;
    }

    vehicleData.riding = !vehicleData.riding;
    saveVehicle();
    updateFloatingRideBtn();
    updateHeroSpeed();

    const sim = getSim();
    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];

    if (vehicleData.riding) {
      if (sim && sim.hero) {
        sim.hero.say = currentVeh.sound;
        sim.hero.sayTimer = 3.5;
        if (sim.hero.react) sim.hero.react = { kind: 'happy', t: 3.0, t0: 3.0 };
      }
      if (window.__game?.m?.hud?.toast) {
        window.__game.m.hud.toast(`🛵 Đang cưỡi ${currentVeh.name} lướt phố! (Tốc độ x${currentVeh.speedMult})`);
      }
    } else {
      if (sim && sim.hero) {
        sim.hero.say = 'Dừng xe xuống đi bộ thong thả.';
        sim.hero.sayTimer = 2.5;
      }
      if (window.__game?.m?.hud?.toast) {
        window.__game.m.hud.toast('🚶 Đã xuống xe, chuyển sang đi bộ.');
      }
    }
  }

  function updateFloatingRideBtn() {
    let btn = document.getElementById('btn-floating-ride');
    const sim = getSim();
    const isPlaying = window.__inGame === true || (sim && !sim.demo && sim.day >= 1);

    if (!isPlaying || !vehicleData.owned || vehicleData.owned.length === 0) {
      if (btn) btn.style.display = 'none';
      return;
    }

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-floating-ride';
      btn.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 14px;
        z-index: 9998;
        background: linear-gradient(135deg, #f77f00, #d62828);
        color: #fff;
        border: 2px solid #fff;
        border-radius: 30px;
        padding: 8px 16px;
        font: 700 13px system-ui, sans-serif;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.15s ease;
      `;
      btn.addEventListener('click', toggleRide);
      document.body.appendChild(btn);
    }

    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];
    if (vehicleData.riding) {
      btn.innerHTML = `<span>${currentVeh.icon}</span> <span>Đang Lái: ${currentVeh.name.split(' ')[0]}</span> <span style="background:#4ade80;color:#000;border-radius:10px;padding:1px 6px;font-size:10px;">BẬT</span>`;
      btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
    } else {
      btn.innerHTML = `<span>🚶</span> <span>Lên Xe (${currentVeh.name.split(' ')[0]})</span> <span style="background:#fff3;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;">TẮT</span>`;
      btn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
    }
    btn.style.display = 'flex';
  }

  // Hook lặp kiểm tra
  setInterval(() => {
    checkDailyRent();
    updateFloatingRideBtn();
    updateHeroSpeed();
  }, 1000);

  // -----------------------------------------------------------------------
  // 5. MODAL SÀN GIAO DỊCH BẤT ĐỘNG SẢN (MUA NHÀ)
  // -----------------------------------------------------------------------
  function openRealEstateModal() {
    let modal = document.getElementById('estate-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'estate-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10000;
        background: rgba(18, 12, 8, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      document.body.appendChild(modal);
    }

    renderRealEstateUI();
    modal.style.display = 'flex';
  }

  function closeRealEstateModal() {
    const modal = document.getElementById('estate-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderRealEstateUI() {
    const modal = document.getElementById('estate-modal');
    if (!modal) return;

    const sim = getSim();
    const currentCoins = sim ? sim.coins || 0 : 0;

    let dailyRentTotal = 0;
    estateData.owned.forEach(id => {
      const e = REAL_ESTATES.find(item => item.id === id);
      if (e) dailyRentTotal += e.rentPerDay;
    });

    let itemsHtml = REAL_ESTATES.map(item => {
      const isOwned = estateData.owned.includes(item.id);
      const canBuy = currentCoins >= item.price;

      return `
        <div style="background:#2a1f18;border:1px solid ${isOwned ? '#4ade80' : '#594433'};border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:24px;">${item.icon}</span>
              <div>
                <b style="color:${isOwned ? '#4ade80' : '#fef08a'};font-size:14px;">${item.name}</b>
                <div style="font-size:11px;color:#cbd5e1;">Tiền thuê: <b style="color:#38bdf8;">+${formatMoney(item.rentPerDay)}/ngày</b></div>
              </div>
            </div>
            <div>
              ${isOwned ? `
                <span style="background:#22c55e22;border:1px solid #22c55e;color:#4ade80;font-size:11px;padding:4px 8px;border-radius:20px;font-weight:700;">ĐÃ SỞ HỮU</span>
              ` : `
                <button class="btn-buy-estate" data-id="${item.id}" style="background:${canBuy ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#4b5563'};color:#fff;border:none;padding:6px 14px;border-radius:8px;font-weight:bold;cursor:${canBuy ? 'pointer' : 'not-allowed'};font-size:12px;">
                  Mua ${formatMoney(item.price)}
                </button>
              `}
            </div>
          </div>
          <div style="font-size:12px;color:#d1d5db;line-height:1.4;">${item.desc}</div>
          ${item.buff ? `<div style="font-size:11px;color:#fbbf24;font-style:italic;">⭐ Đặc quyền: ${item.buff}</div>` : ''}
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div style="background:#1c140e;border:2px solid #e07a5f;border-radius:20px;width:min(92vw,560px);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.8);overflow:hidden;color:#fff;">
        <div style="padding:14px 18px;background:#2b1d14;border-bottom:1px solid #4a3424;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="margin:0;color:#f4a261;font-size:17px;display:flex;align-items:center;gap:6px;">
              <span>🏡</span> Sàn Giao Dịch Bất Động Sản Phố Hoa Sữa
            </h3>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Mua nhà đất mặt tiền, hưởng tiền thuê phòng mỗi ngày</div>
          </div>
          <button id="btn-close-estate" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;padding:0 4px;">✕</button>
        </div>

        <div style="padding:12px 18px;background:#38271b;display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid #4a3424;">
          <div>Tiền mặt hiện có: <b style="color:#4ade80;">${formatMoney(currentCoins)}</b></div>
          <div>Thu nhập thuê: <b style="color:#38bdf8;">+${formatMoney(dailyRentTotal)}/ngày</b></div>
        </div>

        <div style="padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
          ${itemsHtml}
        </div>
      </div>
    `;

    modal.querySelector('#btn-close-estate')?.addEventListener('click', closeRealEstateModal);

    modal.querySelectorAll('.btn-buy-estate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = REAL_ESTATES.find(i => i.id === id);
        if (!item) return;

        const sim = getSim();
        if (!sim || (sim.coins || 0) < item.price) {
          alert('Bạn không đủ tiền mặt trong két để mua bất động sản này!');
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn chi ${formatMoney(item.price)} để mua ${item.name} không?`)) {
          sim.coins -= item.price;
          estateData.owned.push(item.id);
          estateData.lastRentDay = sim.day || 1;
          saveEstate();

          if (typeof sim.book === 'function') {
            sim.book('chi', 'estate', `Mua ${item.name}`, item.price, 0, void 0, sim.playerName || 'Chủ nhà');
          }

          if (window.__game?.m?.hud?.toast) {
            window.__game.m.hud.toast(`🎉 Chúc mừng bạn đã sở hữu ${item.name}!`);
          }
          renderRealEstateUI();
        }
      });
    });
  }

  // -----------------------------------------------------------------------
  // 6. MODAL SHOWROOM PHƯƠNG TIỆN (MUA XE & CHỌN XE)
  // -----------------------------------------------------------------------
  function openVehicleShowroomModal() {
    let modal = document.getElementById('vehicle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'vehicle-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10000;
        background: rgba(18, 12, 8, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      document.body.appendChild(modal);
    }

    renderVehicleUI();
    modal.style.display = 'flex';
  }

  function closeVehicleShowroomModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderVehicleUI() {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;

    const sim = getSim();
    const currentCoins = sim ? sim.coins || 0 : 0;

    let itemsHtml = VEHICLES.map(item => {
      const isOwned = vehicleData.owned.includes(item.id);
      const isSelected = vehicleData.active === item.id;
      const canBuy = currentCoins >= item.price;

      return `
        <div style="background:#2a1f18;border:2px solid ${isSelected ? '#38bdf8' : isOwned ? '#4ade80' : '#594433'};border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:26px;">${item.icon}</span>
              <div>
                <b style="color:${isSelected ? '#38bdf8' : isOwned ? '#4ade80' : '#fef08a'};font-size:14px;">${item.name}</b>
                <div style="font-size:11px;color:#cbd5e1;">Tốc độ di chuyển: <b style="color:#f59e0b;">x${item.speedMult}</b></div>
              </div>
            </div>
            <div>
              ${isOwned ? `
                ${isSelected ? `
                  <span style="background:#0284c7;color:#fff;font-size:11px;padding:5px 10px;border-radius:20px;font-weight:700;">ĐANG CHỌN</span>
                ` : `
                  <button class="btn-select-vehicle" data-id="${item.id}" style="background:#16a34a;color:#fff;border:none;padding:5px 12px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:12px;">
                    Cưỡi Ngay
                  </button>
                `}
              ` : `
                <button class="btn-buy-vehicle" data-id="${item.id}" style="background:${canBuy ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#4b5563'};color:#fff;border:none;padding:6px 14px;border-radius:8px;font-weight:bold;cursor:${canBuy ? 'pointer' : 'not-allowed'};font-size:12px;">
                  Mua ${formatMoney(item.price)}
                </button>
              `}
            </div>
          </div>
          <div style="font-size:12px;color:#d1d5db;line-height:1.4;">${item.desc}</div>
          <div style="font-size:11px;color:#38bdf8;font-style:italic;">🔊 Tiếng còi/bô: ${item.sound}</div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div style="background:#1c140e;border:2px solid #38bdf8;border-radius:20px;width:min(92vw,560px);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.8);overflow:hidden;color:#fff;">
        <div style="padding:14px 18px;background:#2b1d14;border-bottom:1px solid #4a3424;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="margin:0;color:#38bdf8;font-size:17px;display:flex;align-items:center;gap:6px;">
              <span>🏍️</span> Showroom Phương Tiện Phố Hoa Sữa
            </h3>
            <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Sắm xe máy, siêu xe & cưỡi xe tốc độ cao trên vỉa hè</div>
          </div>
          <button id="btn-close-vehicle" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;padding:0 4px;">✕</button>
        </div>

        <div style="padding:12px 18px;background:#38271b;display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid #4a3424;">
          <div>Tiền mặt hiện có: <b style="color:#4ade80;">${formatMoney(currentCoins)}</b></div>
          <div>Trạng thái: <b style="color:${vehicleData.riding ? '#4ade80' : '#f59e0b'};">${vehicleData.riding ? 'Đang Cưỡi Xe' : 'Đang Đi Bộ'}</b></div>
        </div>

        <div style="padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
          ${itemsHtml}
        </div>
      </div>
    `;

    modal.querySelector('#btn-close-vehicle')?.addEventListener('click', closeVehicleShowroomModal);

    modal.querySelectorAll('.btn-select-vehicle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        vehicleData.active = id;
        vehicleData.riding = true;
        saveVehicle();
        updateFloatingRideBtn();
        updateHeroSpeed();
        renderVehicleUI();

        const v = VEHICLES.find(item => item.id === id);
        const sim = getSim();
        if (sim && sim.hero && v) {
          sim.hero.say = v.sound;
          sim.hero.sayTimer = 3.5;
        }
        if (window.__game?.m?.hud?.toast) {
          window.__game.m.hud.toast(`🏍️ Đã chọn cưỡi ${v?.name}!`);
        }
      });
    });

    modal.querySelectorAll('.btn-buy-vehicle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = VEHICLES.find(i => i.id === id);
        if (!item) return;

        const sim = getSim();
        if (!sim || (sim.coins || 0) < item.price) {
          alert('Bạn không đủ tiền mặt trong két để mua xe này!');
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn chi ${formatMoney(item.price)} để mua ${item.name} không?`)) {
          sim.coins -= item.price;
          vehicleData.owned.push(item.id);
          vehicleData.active = item.id;
          vehicleData.riding = true;
          saveVehicle();
          updateFloatingRideBtn();
          updateHeroSpeed();

          if (typeof sim.book === 'function') {
            sim.book('chi', 'vehicle', `Mua ${item.name}`, item.price, 0, void 0, sim.playerName || 'Chủ xe');
          }

          if (window.__game?.m?.hud?.toast) {
            window.__game.m.hud.toast(`🎉 Chúc mừng bạn đã tậu ${item.name}!`);
          }
          renderVehicleUI();
        }
      });
    });
  }

  // -----------------------------------------------------------------------
  // 7. THẦN MÈO KARIN BAN PHƯỚC (TIỆM TRÀ MƠ ƯỚC)
  // -----------------------------------------------------------------------
  function triggerKarinBlessing() {
    const sim = getSim();
    if (!sim) {
      alert('Vui lòng đợi game tải xong và bấm Bắt đầu!');
      return;
    }

    // 1. Tăng +30s kiên nhẫn cho toàn bộ khách hàng trên phố
    let buffCount = 0;
    const allPeople = Array.isArray(sim.people) ? sim.people : [];
    allPeople.forEach(p => {
      if (!p.species && p.state !== 'gone' && p.patience != null) {
        p.patience = Math.min(120, (p.patience || 30) + 30);
        p.patienceMax = Math.max(p.patienceMax || 60, p.patience);
        p.react = { kind: 'happy', t: 3.5, t0: 3.5 };
        buffCount++;
      }
    });

    // 2. Lì xì tiền vía may mắn
    const luckyMoney = Math.floor(Math.random() * 80) + 20; // 20k - 100k
    sim.coins = (sim.coins || 0) + luckyMoney;

    if (typeof sim.book === 'function') {
      sim.book('thu', 'karin', 'Lì xì lộc vía từ Thần Mèo Karin', luckyMoney, 0, void 0, 'Thần Mèo Karin');
    }

    if (sim.hero) {
      sim.hero.say = `🐾 Cảm ơn Thần Mèo Karin đã ban phước kiên nhẫn và lộc vía ${formatMoney(luckyMoney)}!`;
      sim.hero.sayTimer = 4.0;
    }

    const toastMsg = `🐾 Thần Mèo Karin: Đã ban +30s kiên nhẫn cho ${buffCount} khách hàng & lì xì ${formatMoney(luckyMoney)} lộc vía!`;
    if (window.__game?.m?.hud?.toast) {
      window.__game.m.hud.toast(toastMsg);
    } else {
      alert(toastMsg);
    }
  }

  // -----------------------------------------------------------------------
  // 8. CỬA SỔ CHƠI TRỰC TIẾP TIỆM TRÀ MƠ ƯỚC (IFRAME MODAL)
  // -----------------------------------------------------------------------
  function openTeaShopDirectModal() {
    let modal = document.getElementById('teashop-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'teashop-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10001;
        background: #000;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      modal.innerHTML = `
        <div style="background:#2b1d14;border-bottom:2px solid #e07a5f;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;color:#fff;z-index:2;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:22px;">🧋</span>
            <div>
              <b style="color:#f4a261;font-size:15px;">TIỆM TRÀ MƠ ƯỚC</b>
              <span style="font-size:11px;color:#94a3b8;margin-left:8px;">tiemtramouoc.tensorship.tech</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="btn-reload-teashop" style="background:#457b9d;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:bold;">
              🔄 Tải lại
            </button>
            <button id="btn-close-teashop" style="background:linear-gradient(135deg, #e76f51, #d62828);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
              🧋 Về Phố Hoa Sữa
            </button>
          </div>
        </div>
        <div style="flex:1;position:relative;width:100%;height:100%;overflow:hidden;background:#fdf3e4;">
          <iframe id="teashop-iframe" src="https://tiemtramouoc.tensorship.tech/index.html" style="width:100%;height:100%;border:none;" allow="autoplay; accelerometer; gyroscope"></iframe>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#btn-close-teashop')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#btn-reload-teashop')?.addEventListener('click', () => {
        const iframe = modal.querySelector('#teashop-iframe');
        if (iframe) iframe.src = 'https://tiemtramouoc.tensorship.tech/index.html?_t=' + Date.now();
      });
    }

    modal.style.display = 'flex';
  }

  // -----------------------------------------------------------------------
  // 9. EXPORT GLOBAL APIS
  // -----------------------------------------------------------------------
  window.openRealEstateModal = openRealEstateModal;
  window.closeRealEstateModal = closeRealEstateModal;
  window.openVehicleShowroomModal = openVehicleShowroomModal;
  window.closeVehicleShowroomModal = closeVehicleShowroomModal;
  window.triggerKarinBlessing = triggerKarinBlessing;
  window.openTeaShopDirectModal = openTeaShopDirectModal;
  window.toggleRide = toggleRide;

})();
