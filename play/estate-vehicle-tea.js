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

  let isNitro = false;
  let nitroTimeout = null;

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
      shortName: 'Xe Đạp',
      icon: '🚲',
      price: 150, // 150k
      speedMult: 1.6,
      topSpeed: 25,
      sound: 'Keng keng! Xe đạp Phượng Hoàng tới nè! 🔔',
      desc: 'Nồi đồng cối đá, chở đồ siêu khỏe, bấm chuông keng keng vui tai.'
    },
    {
      id: 'cub50',
      name: 'Honda Super Cub 50 huyền thoại',
      shortName: 'Cub 50',
      icon: '🛵',
      price: 450, // 450k
      speedMult: 2.2,
      topSpeed: 50,
      sound: 'Tạch tạch bành bành! Cub 50 bon bon! 💨',
      desc: 'Bền bỉ tiết kiệm xăng số một, luồn lách mọi con hẻm phố xá.'
    },
    {
      id: 'wave',
      name: 'Honda Wave Alpha đỏ quốc dân',
      shortName: 'Wave Đỏ',
      icon: '🏍️',
      price: 1200, // 1.2M
      speedMult: 3.0,
      topSpeed: 80,
      sound: 'Vroooom! Wave đỏ lướt gió! 🚀',
      desc: 'Chiến mã đường phố của dân vỉa hè, vít ga là lướt vèo vèo.'
    },
    {
      id: 'sh150',
      name: 'Xe ga Honda SH 150i sang xịn',
      shortName: 'SH 150i',
      icon: '✨🛵',
      price: 5000, // 5M
      speedMult: 4.0,
      topSpeed: 110,
      sound: 'Bípp píp! SH 150i chủ tịch xuất chiêu! 🌟',
      desc: 'Xe chủ tịch đi thị sát, hào quang sáng loáng thu hút mọi ánh nhìn.'
    },
    {
      id: 'porsche',
      name: 'Siêu xe Thể Thao Porsche 911 Vỉa Hè',
      shortName: 'Porsche 911',
      icon: '🏎️',
      price: 25000, // 25M
      speedMult: 6.0,
      topSpeed: 240,
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
  // 4. ÂM THANH CÒI & ĐỘNG CƠ (WEB AUDIO API)
  // -----------------------------------------------------------------------
  function playHornSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window.__dcvhAudioCtx) window.__dcvhAudioCtx = new AudioCtx();
      const ctx = window.__dcvhAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      if (type === 'xedap') {
        // Chuông xe đạp leng keng (2 nhịp thanh thoát)
        [0, 0.12].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2200, t + delay);
          gain.gain.setValueAtTime(0.25, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + delay);
          osc.stop(t + delay + 0.35);
        });
      } else if (type === 'cub50') {
        // Còi xe Cub 50 cổ điển tạch bành
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(430, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      } else if (type === 'wave') {
        // Còi Wave Alpha đôi âm thanh vang
        [440, 490].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      } else if (type === 'sh150') {
        // Còi SH chủ tịch đanh thép sang trọng
        [520, 650].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.5);
        });
      } else if (type === 'porsche') {
        // Còi đôi thể thao Hella của siêu xe gầm vang
        [410, 515].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
      }
    } catch(e) {
      console.warn('Audio horn error:', e);
    }
  }

  // -----------------------------------------------------------------------
  // 5. CƠ CHẾ CƯỠI XE & TỐC ĐỘ DI CHUYỂN
  // -----------------------------------------------------------------------
  function updateHeroSpeed() {
    const sim = getSim();
    if (!sim || !sim.hero) return;

    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];

    if (vehicleData.riding) {
      const nitroMult = isNitro ? 1.6 : 1.0;
      sim.hero.speedMult = currentVeh.speedMult * nitroMult;
      sim.hero.ridingVehicle = currentVeh.name;
    } else {
      sim.hero.speedMult = 1.0;
      sim.hero.ridingVehicle = null;
    }
  }

  function triggerNitro() {
    if (!vehicleData.riding) return;
    if (isNitro) return;

    isNitro = true;
    updateHeroSpeed();

    const sim = getSim();
    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];
    if (sim && sim.hero) {
      sim.hero.say = `🚀 NITRO BOOST! VÚTTTTTT GA ${currentVeh.name.toUpperCase()}!`;
      sim.hero.sayTimer = 3.0;
      if (sim.hero.react) sim.hero.react = { kind: 'happy', t: 2.5, t0: 2.5 };
    }

    playHornSound('porsche');

    if (nitroTimeout) clearTimeout(nitroTimeout);
    nitroTimeout = setTimeout(() => {
      isNitro = false;
      updateHeroSpeed();
    }, 2800);
  }

  function toggleRide() {
    if (!vehicleData.owned || vehicleData.owned.length === 0) {
      alert('Bạn chưa sở hữu xe nào! Hãy vào Showroom Phương Tiện để sắm xe nhé.');
      return;
    }

    vehicleData.riding = !vehicleData.riding;
    saveVehicle();
    updateFloatingRideBtn();
    updateDrivingDashboard();
    updateHeroSpeed();

    const sim = getSim();
    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];

    if (vehicleData.riding) {
      playHornSound(currentVeh.id);
      if (sim && sim.hero) {
        sim.hero.say = currentVeh.sound;
        sim.hero.sayTimer = 3.5;
        if (sim.hero.react) sim.hero.react = { kind: 'happy', t: 3.0, t0: 3.0 };
      }
      if (window.__game?.m?.hud?.toast) {
        window.__game.m.hud.toast(`🛵 Đang cưỡi ${currentVeh.name} lướt phố! (Tốc độ x${currentVeh.speedMult})`);
      }
    } else {
      isNitro = false;
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
    const vehLabel = currentVeh.shortName || currentVeh.name.split(' ')[0];
    if (vehicleData.riding) {
      btn.innerHTML = `<span>${currentVeh.icon}</span> <span>Đang Lái: ${vehLabel}</span> <span style="background:#4ade80;color:#000;border-radius:10px;padding:1px 6px;font-size:10px;">BẬT</span>`;
      btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
    } else {
      btn.innerHTML = `<span>🚶</span> <span>Lên Xe (${vehLabel})</span> <span style="background:#fff3;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;">TẮT</span>`;
      btn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
    }
    btn.style.display = 'flex';
  }

  // -----------------------------------------------------------------------
  // 6. DASHBOARD ĐỒNG HỒ TỐC ĐỘ & BẢNG ĐIỀU KHIỂN LÁI XE (HUD)
  // -----------------------------------------------------------------------
  let drivingHud = null;

  function updateDrivingDashboard(currentSpeedKmh) {
    const sim = getSim();
    const isPlaying = window.__inGame === true || (sim && !sim.demo && sim.day >= 1);

    if (!drivingHud) {
      drivingHud = document.createElement('div');
      drivingHud.id = 'dcvh-driving-hud';
      drivingHud.style.cssText = `
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9997;
        background: rgba(15, 23, 42, 0.88);
        border: 2px solid #38bdf8;
        backdrop-filter: blur(10px);
        border-radius: 40px;
        padding: 6px 16px;
        display: none;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2);
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        user-select: none;
      `;

      drivingHud.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span id="hud-veh-icon" style="font-size:22px;">🛵</span>
          <div style="display:flex;flex-direction:column;">
            <b id="hud-veh-name" style="font-size:12px;color:#38bdf8;white-space:nowrap;line-height:1.2;">Honda Wave Alpha</b>
            <span id="hud-veh-state" style="font-size:10px;color:#4ade80;font-weight:700;">ĐANG LÁI XE</span>
          </div>
        </div>

        <div style="background:#090d16;border:1px solid #1e293b;border-radius:24px;padding:3px 12px;display:flex;align-items:baseline;gap:4px;min-width:76px;justify-content:center;">
          <span id="hud-speed-num" style="font-size:18px;font-weight:900;color:#facc15;font-variant-numeric:tabular-nums;">0</span>
          <span style="font-size:10px;color:#94a3b8;font-weight:700;">km/h</span>
        </div>

        <div style="display:flex;align-items:center;gap:6px;">
          <button id="hud-btn-honk" title="Bấm còi / chuông" style="background:linear-gradient(135deg, #0284c7, #0369a1);border:1px solid #38bdf8;color:#fff;border-radius:20px;padding:5px 11px;font-size:12px;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            <span>📢</span> Còi
          </button>
          <button id="hud-btn-nitro" title="Tăng tốc Nitro cực bốc" style="background:linear-gradient(135deg, #f59e0b, #dc2626);border:1px solid #fbbf24;color:#fff;border-radius:20px;padding:5px 11px;font-size:12px;font-weight:bold;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            <span>🚀</span> Nitro
          </button>
          <button id="hud-btn-dismount" title="Xuống xe đi bộ" style="background:#334155;border:1px solid #64748b;color:#cbd5e1;border-radius:20px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;">
            ✕ Xuống
          </button>
        </div>
      `;

      document.body.appendChild(drivingHud);

      drivingHud.querySelector('#hud-btn-honk')?.addEventListener('click', () => {
        const v = VEHICLES.find(item => item.id === vehicleData.active) || VEHICLES[0];
        playHornSound(v.id);
        const sim = getSim();
        if (sim && sim.hero) {
          sim.hero.say = v.sound;
          sim.hero.sayTimer = 3.0;
        }
      });

      drivingHud.querySelector('#hud-btn-nitro')?.addEventListener('click', () => {
        triggerNitro();
      });

      drivingHud.querySelector('#hud-btn-dismount')?.addEventListener('click', () => {
        toggleRide();
      });
    }

    if (!isPlaying || !vehicleData.riding) {
      drivingHud.style.display = 'none';
      return;
    }

    drivingHud.style.display = 'flex';
    const currentVeh = VEHICLES.find(v => v.id === vehicleData.active) || VEHICLES[0];
    const iconEl = drivingHud.querySelector('#hud-veh-icon');
    const nameEl = drivingHud.querySelector('#hud-veh-name');
    const stateEl = drivingHud.querySelector('#hud-veh-state');
    const speedEl = drivingHud.querySelector('#hud-speed-num');

    if (iconEl) iconEl.textContent = currentVeh.icon;
    if (nameEl) nameEl.textContent = currentVeh.name;
    if (stateEl) {
      stateEl.textContent = isNitro ? '🔥 NITRO BOOST ĐANG BẬT!' : 'ĐANG LÁI XE';
      stateEl.style.color = isNitro ? '#f87171' : '#4ade80';
    }
    if (speedEl && currentSpeedKmh != null) {
      speedEl.textContent = Math.round(currentSpeedKmh);
    }
  }

  // -----------------------------------------------------------------------
  // 7. BỘ HỌA SĨ VẼ XE TRỰC TIẾP TRÊN HERO (PIXI GRAPHICS RENDERER)
  // -----------------------------------------------------------------------
  function drawCircle(g, x, y, r, fill, stroke, strokeW) {
    if (g.circle) {
      g.circle(x, y, r);
      if (fill != null) g.fill(fill);
      if (stroke != null) g.stroke({ width: strokeW || 1.5, color: stroke });
    } else if (g.drawCircle) {
      if (stroke != null) g.lineStyle(strokeW || 1.5, stroke);
      if (fill != null) g.beginFill(fill);
      g.drawCircle(x, y, r);
      if (fill != null) g.endFill();
    }
  }

  function drawRect(g, x, y, w, h, fill, stroke, strokeW) {
    if (g.rect) {
      g.rect(x, y, w, h);
      if (fill != null) g.fill(fill);
      if (stroke != null) g.stroke({ width: strokeW || 1.5, color: stroke });
    } else if (g.drawRect) {
      if (stroke != null) g.lineStyle(strokeW || 1.5, stroke);
      if (fill != null) g.beginFill(fill);
      g.drawRect(x, y, w, h);
      if (fill != null) g.endFill();
    }
  }

  function drawRoundRect(g, x, y, w, h, radius, fill, stroke, strokeW) {
    if (g.roundRect) {
      g.roundRect(x, y, w, h, radius);
      if (fill != null) g.fill(fill);
      if (stroke != null) g.stroke({ width: strokeW || 1.5, color: stroke });
    } else if (g.drawRoundedRect) {
      if (stroke != null) g.lineStyle(strokeW || 1.5, stroke);
      if (fill != null) g.beginFill(fill);
      g.drawRoundedRect(x, y, w, h, radius);
      if (fill != null) g.endFill();
    }
  }

  function drawPoly(g, pts, fill, stroke, strokeW) {
    if (g.poly) {
      g.poly(pts);
      if (fill != null) g.fill(fill);
      if (stroke != null) g.stroke({ width: strokeW || 1.5, color: stroke });
    } else if (g.drawPolygon) {
      if (stroke != null) g.lineStyle(strokeW || 1.5, stroke);
      if (fill != null) g.beginFill(fill);
      g.drawPolygon(pts);
      if (fill != null) g.endFill();
    }
  }

  function drawLine(g, x1, y1, x2, y2, color, width) {
    if (g.moveTo && g.lineTo) {
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      if (g.stroke) {
        g.stroke({ width: width || 2, color: color });
      } else if (g.lineStyle) {
        g.lineStyle(width || 2, color);
      }
    }
  }

  function drawWheel(g, cx, cy, radius, wheelAngle, isSpoke, rimColor, spokeColor) {
    drawCircle(g, cx, cy, radius, 0x1f2937, 0x0f172a, 2);
    drawCircle(g, cx, cy, radius - 3, null, rimColor || 0xd1d5db, 1.5);
    drawCircle(g, cx, cy, 3, 0x9ca3af, 0x374151, 1);
    const spokes = isSpoke ? 6 : 4;
    for (let i = 0; i < spokes; i++) {
      const a = wheelAngle + (i * Math.PI * 2) / spokes;
      const sx = cx + Math.cos(a) * (radius - 3.5);
      const sy = cy + Math.sin(a) * (radius - 3.5);
      drawLine(g, cx, cy, sx, sy, spokeColor || (isSpoke ? 0xe2e8f0 : 0x4b5563), isSpoke ? 1 : 2.5);
    }
  }

  // 1. Xe Đạp Phượng Hoàng cổ điển
  function drawBicycle(g, time, isMoving, wheelAngle) {
    drawWheel(g, -28, -13, 13, wheelAngle, true);
    drawWheel(g, 26, -13, 13, wheelAngle, true);

    // Khung sườn xanh rêu Phượng Hoàng cổ
    drawLine(g, -2, -14, -10, -36, 0x14532d, 3);
    drawLine(g, -28, -13, -2, -14, 0x14532d, 2.5);
    drawLine(g, -28, -13, -10, -35, 0x14532d, 2.5);
    drawLine(g, -2, -14, 18, -34, 0x14532d, 3);
    drawLine(g, -10, -34, 18, -34, 0x14532d, 3);
    drawLine(g, 18, -34, 26, -13, 0x14532d, 2.5);

    // Ghi đông cổ điển & chuông vàng
    drawLine(g, 18, -34, 16, -45, 0xd1d5db, 2.5);
    drawLine(g, 16, -45, 10, -43, 0x111827, 3.5);
    drawCircle(g, 17, -46, 2.5, 0xfacc15, 0xca8a04, 1);

    // Yên lò xo & gác baga chở hàng
    drawRoundRect(g, -16, -40, 16, 6, 3, 0x1c1917, 0x78716c, 1);
    drawLine(g, -28, -31, -12, -31, 0x9ca3af, 2);
    drawLine(g, -22, -31, -28, -13, 0x9ca3af, 1.5);

    // Bàn đạp quay khi chạy
    drawCircle(g, -2, -14, 4, 0xd1d5db, 0x4b5563, 1);
    const pa = wheelAngle * 0.8;
    drawLine(g, -2, -14, -2 + Math.cos(pa) * 6, -14 + Math.sin(pa) * 6, 0x475569, 2);
  }

  // 2. Honda Super Cub 50 huyền thoại
  function drawCub50(g, time, isMoving, wheelAngle) {
    drawWheel(g, -30, -14, 14, wheelAngle, true);
    drawWheel(g, 28, -14, 14, wheelAngle, true);

    // Dè sau & khung sườn xanh Cub
    drawRoundRect(g, -34, -28, 20, 16, 8, 0x1e3a8a, 0x172554, 1.5);
    drawRoundRect(g, -20, -26, 28, 14, 6, 0x1e3a8a, 0x172554, 1.5);
    drawRoundRect(g, 22, -26, 12, 14, 6, 0x1e3a8a, 0x172554, 1.5);

    // Yếm trắng đặc trưng của xe Cub
    drawPoly(g, [8, -38, 20, -36, 16, -16, 6, -18], 0xf8fafc, 0xe2e8f0, 1.5);

    // Bô xe mạ crom xả khói
    drawLine(g, 0, -12, -34, -9, 0xe2e8f0, 3.5);
    drawCircle(g, -34, -9, 2.5, 0x94a3b8);

    // Yên đơn đen & gác ba ga inox
    drawRoundRect(g, -18, -36, 18, 8, 4, 0x27272a, 0x52525b, 1);
    drawLine(g, -32, -30, -18, -30, 0xd1d5db, 2.5);

    // Đầu đèn tròn & luồng sáng
    drawRoundRect(g, 18, -43, 10, 8, 3, 0x1e3a8a, 0x172554, 1);
    drawCircle(g, 27, -40, 4.5, 0xfef08a, 0xe2e8f0, 1.5);
    drawPoly(g, [28, -40, 75, -55, 75, -25], { color: 0xfef08a, alpha: 0.22 }, null);

    // Kính chiếu hậu tròn
    drawLine(g, 20, -43, 18, -49, 0xd1d5db, 1.5);
    drawCircle(g, 18, -49, 2.5, 0xe2e8f0, 0x94a3b8, 1);
  }

  // 3. Honda Wave Alpha đỏ quốc dân
  function drawWave(g, time, isMoving, wheelAngle) {
    drawWheel(g, -32, -15, 15, wheelAngle, false, 0xdc2626, 0x111827);
    drawWheel(g, 30, -15, 15, wheelAngle, false, 0xdc2626, 0x111827);

    // Khung yếm thể thao đỏ rực
    drawPoly(g, [-28, -26, -6, -26, 14, -32, 22, -26, 8, -14, -20, -15], 0xdc2626, 0x991b1b, 1.5);
    drawPoly(g, [-8, -26, 6, -26, 2, -16, -10, -16], 0x18181b, null);
    drawLine(g, -16, -23, 2, -25, 0xfacc15, 2); // tem Wave lượn sóng

    // Bô vểnh thể thao
    drawLine(g, -4, -12, -34, -16, 0x27272a, 4);
    drawLine(g, -20, -14, -34, -16, 0xe2e8f0, 2);

    // Yên dài 2 chỗ viền chỉ đỏ & tay dắt sau
    drawRoundRect(g, -26, -36, 28, 8, 3, 0x18181b, 0xdc2626, 1);
    drawLine(g, -30, -32, -24, -34, 0xd1d5db, 2);

    // Mặt nạ đầu đèn nhọn & luồng pha sáng
    drawPoly(g, [16, -42, 26, -38, 22, -32, 14, -34], 0xdc2626, 0x991b1b, 1);
    drawPoly(g, [22, -40, 27, -38, 24, -35], 0xffffff, 0x38bdf8, 1);
    drawPoly(g, [27, -38, 85, -55, 85, -20], { color: 0xffffff, alpha: 0.28 }, null);

    // Gương chiếu hậu
    drawLine(g, 18, -42, 16, -48, 0x18181b, 2);
  }

  // 4. Honda SH 150i sang xịn chủ tịch
  function drawSH150(g, time, isMoving, wheelAngle) {
    drawWheel(g, -34, -16, 16, wheelAngle, false, 0x475569, 0x94a3b8);
    drawWheel(g, 32, -16, 16, wheelAngle, false, 0x475569, 0x94a3b8);

    // Thân xe trắng ngọc trai cỡ lớn
    drawRoundRect(g, -30, -32, 54, 20, 8, 0xf8fafc, 0xcbd5e1, 1.5);
    drawRect(g, -2, -18, 18, 4, 0x1e293b, 0x475569, 1); // sàn để chân phẳng

    // Mặt nạ SH chữ V đèn LED ban ngày
    drawPoly(g, [12, -44, 28, -40, 26, -22, 12, -24], 0xf8fafc, 0xcbd5e1, 1.5);
    drawPoly(g, [18, -36, 25, -34, 20, -28], 0x38bdf8, 0x0284c7, 1); // LED demi xanh ngọc

    // Đèn pha kép projector & luồng sáng quý tộc
    drawPoly(g, [25, -42, 29, -40, 27, -36], 0xffffff, 0x38bdf8, 1);
    drawPoly(g, [29, -40, 95, -58, 95, -18], { color: 0xe0f2fe, alpha: 0.32 }, null);

    // Yên da nâu chocolate cao cấp có gờ tựa lưng
    drawRoundRect(g, -28, -40, 30, 9, 4, 0x451a03, 0x78350f, 1.5);

    // Ống xả to bản nẹp kim loại phay xước
    drawRoundRect(g, -34, -16, 26, 7, 3, 0x1e293b, 0x94a3b8, 1);

    // Phuộc đôi giảm xóc màu đỏ thể thao
    drawLine(g, -28, -26, -30, -16, 0xef4444, 3);
  }

  // 5. Siêu xe Thể Thao Porsche 911 Vỉa Hè
  function drawPorsche(g, time, isMoving, wheelAngle, nitroActive) {
    // 2 Bánh thể thao mâm vàng heo dầu đỏ Brembo
    drawWheel(g, -42, -13, 13, wheelAngle, false, 0xfacc15, 0x18181b);
    drawWheel(g, 38, -13, 13, wheelAngle, false, 0xfacc15, 0x18181b);
    drawCircle(g, -42, -13, 5, 0xef4444, null); // heo dầu đỏ
    drawCircle(g, 38, -13, 5, 0xef4444, null);

    // Khung gầm hạ thấp & cản khí động học carbon
    drawRoundRect(g, -50, -14, 94, 6, 2, 0x18181b, null);

    // Thân xe vuốt khí động học màu Vàng Porsche Racing Yellow
    drawPoly(g, [-52, -14, -50, -26, -32, -30, 10, -28, 36, -24, 46, -16, 44, -14], 0xeab308, 0xca8a04, 1.5);
    drawPoly(g, [18, -28, 42, -22, 46, -16, 32, -18], 0xfacc15, 0xeab308, 1);

    // Cánh gió đuôi thể thao Turbo spoiler
    drawRoundRect(g, -52, -32, 14, 3, 1, 0x18181b, 0xeab308, 1);

    // Kính chắn gió vát nghiêng thể thao
    drawPoly(g, [8, -40, 24, -28, 10, -28, 0, -38], { color: 0x38bdf8, alpha: 0.5 }, 0x0284c7, 1.5);

    // Vô lăng thể thao 3 chấu trong khoang lái
    drawCircle(g, 10, -32, 4, null, 0x18181b, 2);

    // Cặp đèn pha elip bọ cánh cứng đặc trưng Porsche & pha Xenon
    drawCircle(g, 40, -23, 4, 0xffffff, 0x38bdf8, 1.5);
    drawPoly(g, [43, -23, 110, -42, 110, -6], { color: 0xbae6fd, alpha: 0.35 }, null);

    // Pô kép thể thao
    drawRect(g, -54, -13, 5, 4, 0xd1d5db, 0x18181b, 1);

    // LỬA NITRO PHUN TỪ ỐNG XẢ 🔥
    if (nitroActive || (isMoving && Math.random() > 0.3)) {
      const flameLen = nitroActive ? 28 + Math.sin(time * 30) * 10 : 14 + Math.sin(time * 25) * 6;
      drawPoly(g, [-54, -14, -54 - flameLen, -12 + Math.cos(time * 20) * 3, -54, -9], 0xf97316, null);
      drawPoly(g, [-54, -13, -54 - flameLen * 0.65, -11, -54, -10], 0x38bdf8, null); // lõi lửa xanh
    }
  }

  // Khói bụi xả bô khi di chuyển
  function drawExhaustSmoke(g, x, y, time, isMoving) {
    if (!isMoving) return;
    for (let i = 0; i < 3; i++) {
      const progress = ((time * 16 + i * 8) % 24) / 24;
      const sx = x - 6 - progress * 24;
      const sy = y - 2 - Math.sin(time * 8 + i) * 3 - progress * 4;
      const sr = 3 + progress * 5;
      const sa = Math.max(0, 0.45 * (1 - progress));
      drawCircle(g, sx, sy, sr, { color: 0xd1d5db, alpha: sa }, null);
    }
  }

  // -----------------------------------------------------------------------
  // 8. HOOK CHÍNH ĐƯỢC GỌI MỖI FRAME TỪ GAME MAIN ENGINE
  // -----------------------------------------------------------------------
  window.__drawVehicleRider = function(gfx, hero, time, dist, rig, rp) {
    if (!vehicleData.riding || !gfx || !hero) {
      if (gfx) {
        if (gfx.context?.instructions?.length > 0) gfx.clear();
        gfx.visible = false;
      }
      updateDrivingDashboard(0);
      return;
    }

    gfx.visible = true;
    if (gfx.context?.instructions?.length > 0) gfx.clear();

    const isMoving = dist > 0.05 || hero.pose === 'walk';
    const vType = vehicleData.active || 'xedap';
    const currentVeh = VEHICLES.find(v => v.id === vType) || VEHICLES[0];

    // Căn chỉnh vị trí & hướng của sprite xe theo hero
    const scale = vType === 'porsche' ? 1.45 : 1.35;
    gfx.position.set(hero.x, hero.y);
    gfx.scale.set(hero.dir * scale, scale);
    gfx.zIndex = hero.y + 1;

    // Ngăn chặn chiếc ghế nhựa đỏ xuất hiện khi đang cưỡi xe
    if (rp && rp.chair) rp.chair.visible = false;

    // Căn chỉnh vị trí nhân vật ngồi trên yên xe
    if (rig) {
      if (vType === 'porsche') {
        rig.position.set(hero.x + hero.dir * 4, hero.y - 8);
      } else {
        rig.position.set(hero.x - hero.dir * 12, hero.y - 18);
      }
    }

    // Đưa nhân vật vào tư thế ngồi cầm lái khi di chuyển hoặc dừng xe
    if (!hero.chore && (!hero.work || hero.work.step >= hero.work.steps.length) && hero.pose !== 'brawl') {
      hero.pose = 'sit';
    }

    // Góc quay của bánh xe
    const wheelAngle = (hero.x * 0.18) % (Math.PI * 2);

    // Vẽ từng dòng xe
    switch (vType) {
      case 'xedap':
        drawBicycle(gfx, time, isMoving, wheelAngle);
        drawExhaustSmoke(gfx, -28, -13, time, isMoving);
        break;
      case 'cub50':
        drawCub50(gfx, time, isMoving, wheelAngle);
        drawExhaustSmoke(gfx, -34, -9, time, isMoving);
        break;
      case 'wave':
        drawWave(gfx, time, isMoving, wheelAngle);
        drawExhaustSmoke(gfx, -34, -16, time, isMoving);
        break;
      case 'sh150':
        drawSH150(gfx, time, isMoving, wheelAngle);
        drawExhaustSmoke(gfx, -34, -16, time, isMoving);
        break;
      case 'porsche':
        drawPorsche(gfx, time, isMoving, wheelAngle, isNitro);
        drawExhaustSmoke(gfx, -54, -11, time, isMoving);
        break;
    }

    // Cập nhật đồng hồ tốc độ trên HUD
    const nitroMult = isNitro ? 1.5 : 1.0;
    const currentSpeed = isMoving ? currentVeh.topSpeed * (0.8 + Math.sin(time * 5) * 0.15) * nitroMult : 0;
    updateDrivingDashboard(currentSpeed);
  };

  // Hook lặp kiểm tra
  setInterval(() => {
    checkDailyRent();
    updateFloatingRideBtn();
    updateHeroSpeed();
  }, 1000);

  // -----------------------------------------------------------------------
  // 9. MODAL SÀN GIAO DỊCH BẤT ĐỘNG SẢN (MUA NHÀ)
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
  // 10. MODAL SHOWROOM PHƯƠNG TIỆN (MUA XE & CHỌN XE)
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
                <div style="font-size:11px;color:#cbd5e1;">Tốc độ: <b style="color:#f59e0b;">x${item.speedMult} (${item.topSpeed} km/h)</b></div>
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
        updateDrivingDashboard();
        updateHeroSpeed();
        renderVehicleUI();

        const v = VEHICLES.find(item => item.id === id);
        playHornSound(id);
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
          updateDrivingDashboard();
          updateHeroSpeed();

          if (typeof sim.book === 'function') {
            sim.book('chi', 'vehicle', `Mua ${item.name}`, item.price, 0, void 0, sim.playerName || 'Chủ xe');
          }

          playHornSound(item.id);

          if (window.__game?.m?.hud?.toast) {
            window.__game.m.hud.toast(`🎉 Chúc mừng bạn đã tậu ${item.name}!`);
          }
          renderVehicleUI();
        }
      });
    });
  }

  // -----------------------------------------------------------------------
  // 11. THẦN MÈO KARIN BAN PHƯỚC (TIỆM TRÀ MƠ ƯỚC)
  // -----------------------------------------------------------------------
  function triggerKarinBlessing() {
    const sim = getSim();
    if (!sim) {
      alert('Vui lòng đợi game tải xong và bấm Bắt đầu!');
      return;
    }

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
  // 12. CỬA SỔ CHƠI TRỰC TIẾP TIỆM TRÀ MƠ ƯỚC (IFRAME MODAL)
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

  // Phím tắt bàn phím tiện lợi: V (lên/xuống xe), B (bấm còi), N (nitro)
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'v' || e.key === 'V') {
      toggleRide();
    } else if ((e.key === 'b' || e.key === 'B') && vehicleData.riding) {
      const v = VEHICLES.find(item => item.id === vehicleData.active) || VEHICLES[0];
      playHornSound(v.id);
      const sim = getSim();
      if (sim && sim.hero) {
        sim.hero.say = v.sound;
        sim.hero.sayTimer = 3.0;
      }
    } else if ((e.key === 'n' || e.key === 'N') && vehicleData.riding) {
      triggerNitro();
    }
  });

  // -----------------------------------------------------------------------
  // 13. EXPORT GLOBAL APIS
  // -----------------------------------------------------------------------
  window.openRealEstateModal = openRealEstateModal;
  window.closeRealEstateModal = closeRealEstateModal;
  window.openVehicleShowroomModal = openVehicleShowroomModal;
  window.closeVehicleShowroomModal = closeVehicleShowroomModal;
  window.triggerKarinBlessing = triggerKarinBlessing;
  window.openTeaShopDirectModal = openTeaShopDirectModal;
  window.toggleRide = toggleRide;
  window.triggerNitro = triggerNitro;
  window.playHornSound = playHornSound;

})();
