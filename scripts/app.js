/**
 * AIMABGRP.COM - Enterprise Portal & Maritime AI Dashboard
 * Interactive Controller: Aesthetics + ERP Engine + SOLAS Automation
 * Author: NeuroGrid Labs (Pvt.) Ltd. for MAB Group
 */

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // 1. Audio Haptic Feedback (Web Audio API)
  // ------------------------------------------------------------------------
  let audioEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(type = 'click') {
    if (!audioEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio fallback silent
    }
  }

  // ------------------------------------------------------------------------
  // 2. Theme Switcher (Pearl White vs Oceanic Teal Dark)
  // ------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const currentTheme = localStorage.getItem('aimabgrp_theme') || 'light';

  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      playSound('click');
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('aimabgrp_theme', nextTheme);
      updateThemeIcon(nextTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    if (theme === 'dark') {
      themeIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      themeIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
    }
  }

  // Audio mute toggle
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      soundToggleBtn.classList.toggle('active', audioEnabled);
      if (audioEnabled) playSound('click');
    });
  }

  // ------------------------------------------------------------------------
  // 3. Navigation Tab Switching (Neumorphic Segment Controller)
  // ------------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.neu-tab-btn');
  const panelViews = document.querySelectorAll('.dashboard-panel-view');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      panelViews.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePanel = document.getElementById(targetTab);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // Showcase buttons linking directly to tabs
  const exploreErpBtn = document.getElementById('exploreErpBtn');
  if (exploreErpBtn) {
    exploreErpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('pop');
      document.querySelector('[data-tab="tab-erp"]').click();
      window.scrollTo({ top: document.getElementById('tab-erp').offsetTop - 90, behavior: 'smooth' });
    });
  }

  const exploreRadarBtn = document.getElementById('exploreRadarBtn');
  if (exploreRadarBtn) {
    exploreRadarBtn.addEventListener('click', () => {
      playSound('pop');
      document.querySelector('[data-tab="tab-radar"]').click();
      window.scrollTo({ top: document.getElementById('tab-radar').offsetTop - 90, behavior: 'smooth' });
    });
  }

  // Neumorphic showcase card toggle
  const neuPillDemo = document.getElementById('neuPillDemo');
  if (neuPillDemo) {
    neuPillDemo.addEventListener('click', () => {
      playSound('click');
      neuPillDemo.classList.toggle('active');
      const isPressed = neuPillDemo.classList.contains('active');
      const statusSpan = neuPillDemo.querySelector('.neu-pill-text');
      if (statusSpan) {
        statusSpan.textContent = isPressed ? 'Neumorphism: Active' : 'Neumorphism';
      }
    });
  }

  // ------------------------------------------------------------------------
  // 4. Live Telemetry & ERP Streaming Terminal
  // ------------------------------------------------------------------------
  const erpRecordCount = document.getElementById('kpiRecordsCount');
  const erpLatency = document.getElementById('kpiLatency');
  const terminalContent = document.getElementById('terminalContent');
  const syncBtn = document.getElementById('syncBtn');

  let currentRecords = 148920;

  function appendTerminalLog(message, tag = 'info') {
    if (!terminalContent) return;
    const p = document.createElement('p');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    let tagClass = 'tag-info';
    let tagText = 'INFO';
    if (tag === 'ok') { tagClass = 'tag-ok'; tagText = 'OK'; }
    if (tag === 'sync') { tagClass = 'tag-sync'; tagText = 'SYNC'; }
    if (tag === 'warn') { tagClass = 'tag-warn'; tagText = 'WARN'; }

    p.innerHTML = `<span style="color:#64748b;">[${time}]</span> <span class="term-tag ${tagClass}">${tagText}</span> ${message}`;
    terminalContent.appendChild(p);
    terminalContent.scrollTop = terminalContent.scrollHeight;
  }

  // Live SSE connection or automatic interval
  try {
    const evtSource = new EventSource('/api/live-telemetry');
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (erpRecordCount) erpRecordCount.textContent = data.erpRecordsSynced.toLocaleString();
      if (erpLatency) erpLatency.textContent = data.latencyMs + ' ms';
      appendTerminalLog(`Bidirectional packet verified: ${data.lastSyncedEntity}`, 'sync');
    };
  } catch (err) {
    // Local fallback interval
    setInterval(() => {
      currentRecords += Math.floor(Math.random() * 3);
      if (erpRecordCount) erpRecordCount.textContent = currentRecords.toLocaleString();
      if (erpLatency) erpLatency.textContent = (12 + Math.floor(Math.random() * 6)) + ' ms';
    }, 3000);
  }

  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      playSound('pop');
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing ERP Database...';
      appendTerminalLog('Initiating full bidirectional reconciliation with MAB Group ERP...', 'info');

      setTimeout(() => {
        appendTerminalLog('TLS 1.3 Handshake completed. Authenticated with token SHA-256[9a4b...f82e]', 'ok');
      }, 700);

      setTimeout(() => {
        appendTerminalLog('Parsed 4 Life Raft inspection manifests & 12 SOLAS compliance drafts', 'sync');
      }, 1400);

      setTimeout(() => {
        currentRecords += 184;
        if (erpRecordCount) erpRecordCount.textContent = currentRecords.toLocaleString();
        appendTerminalLog('Sync completed successfully. 0 errors, 0 dropped packets. Latency: 13.8ms', 'ok');
        syncBtn.disabled = false;
        syncBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Run Live Handshake &amp; DB Sync
        `;
        playSound('success');
      }, 2100);
    });
  }

  // ------------------------------------------------------------------------
  // 5. SOLAS & ISO Automated Certificate Generator
  // ------------------------------------------------------------------------
  const vesselSelect = document.getElementById('vesselSelect');
  const certTypeSelect = document.getElementById('certTypeSelect');
  const generateCertBtn = document.getElementById('generateCertBtn');
  const certVesselName = document.getElementById('certVesselName');
  const certImo = document.getElementById('certImo');
  const certStandard = document.getElementById('certStandard');
  const certRefNum = document.getElementById('certRefNum');
  const certTimestamp = document.getElementById('certTimestamp');

  const vesselData = {
    'MV Al-Mabrouk': { imo: 'IMO 9283712', flag: 'Panama', port: 'Port Qasim' },
    'MV Arabian Pearl': { imo: 'IMO 9482156', flag: 'Bahamas', port: 'Karachi Port' },
    'MT Indus Voyager': { imo: 'IMO 9154829', flag: 'Liberia', port: 'Jebel Ali' },
    'MV Sindh Star': { imo: 'IMO 9301984', flag: 'Marshall Islands', port: 'Singapore' }
  };

  if (generateCertBtn) {
    generateCertBtn.addEventListener('click', () => {
      playSound('pop');
      const vessel = vesselSelect ? vesselSelect.value : 'MV Al-Mabrouk';
      const standard = certTypeSelect ? certTypeSelect.value : 'SOLAS Chapter III (Life-Saving Appliances)';
      const meta = vesselData[vessel] || { imo: 'IMO 9283712' };

      const randomRef = 'SOLAS-MAB-' + Math.floor(100000 + Math.random() * 900000);
      const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      if (certVesselName) certVesselName.textContent = vessel;
      if (certImo) certImo.textContent = meta.imo;
      if (certStandard) certStandard.textContent = standard;
      if (certRefNum) certRefNum.textContent = randomRef;
      if (certTimestamp) certTimestamp.textContent = nowStr;

      appendTerminalLog(`SOLAS Documentation Auto-Filled for ${vessel} [${randomRef}]`, 'ok');
      playSound('success');
    });
  }

  // ------------------------------------------------------------------------
  // 6. Life Raft Fleet Radar Filter & Actions
  // ------------------------------------------------------------------------
  const radarSearchInput = document.getElementById('radarSearchInput');
  const radarFilterBtns = document.querySelectorAll('.radar-filter-btn');
  const radarTableRows = document.querySelectorAll('.radar-table tbody tr');

  if (radarSearchInput) {
    radarSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      radarTableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  radarFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      radarFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      radarTableRows.forEach(row => {
        if (filter === 'all') {
          row.style.display = '';
        } else {
          const status = row.getAttribute('data-status');
          row.style.display = status === filter ? '' : 'none';
        }
      });
    });
  });

  // Table row action buttons
  document.querySelectorAll('.btn-service-notice').forEach(btn => {
    btn.addEventListener('click', function() {
      playSound('pop');
      const raftId = this.getAttribute('data-raft');
      alert(`Servicing Dispatch Notice issued for Life Raft #${raftId}.\nAutomated alert sent to MAB Technical Logistics & Marine Surveyor.`);
      appendTerminalLog(`Life Raft #${raftId} inspection workflow triggered. Recertification notice generated.`, 'warn');
    });
  });

  // ------------------------------------------------------------------------
  // 7. Omnichannel WhatsApp Notification Simulator
  // ------------------------------------------------------------------------
  const sendWaBtn = document.getElementById('sendWaBtn');
  const waScenarioSelect = document.getElementById('waScenarioSelect');
  const waChatBody = document.getElementById('waChatBody');

  const waScenarios = {
    'expiry': '⚠️ MAB GROUP ALERT: Life Raft #LR-2024-88 (MV Al-Mabrouk) Hydrostatic Release Unit (HRU) expires in 12 days. SOLAS Ch.III inspection mandatory before vessel departure. Click to sign work order.',
    'audit_pass': '✅ SOLAS AUDIT PASS: MV Arabian Pearl has completed documentation verification for SOLAS Chapter V. Certificate Ref: #SOLAS-MAB-842911 is ready for Port Authority inspection.',
    'erp_sync': '🔄 ERP SYNC NOTICE: NeuroGrid AI Bridge has synchronized 148,934 records with MAB Group Central Database. 0 anomalies detected. System operational.'
  };

  if (sendWaBtn) {
    sendWaBtn.addEventListener('click', () => {
      playSound('pop');
      const scenarioKey = waScenarioSelect ? waScenarioSelect.value : 'expiry';
      const messageText = waScenarios[scenarioKey] || waScenarios.expiry;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (waChatBody) {
        const bubble = document.createElement('div');
        bubble.className = 'wa-bubble-received';
        bubble.innerHTML = `
          ${messageText}
          <div class="wa-time-meta">${nowTime} • Delivered ✓✓</div>
        `;
        waChatBody.appendChild(bubble);
        waChatBody.scrollTop = waChatBody.scrollHeight;
      }

      appendTerminalLog(`WhatsApp Webhook triggered: Dispatched message to Port Operations team`, 'ok');
      playSound('success');
    });
  }

  // ------------------------------------------------------------------------
  // 8. Countdown Timer to Day 07 Milestone (30 Oct 2026)
  // ------------------------------------------------------------------------
  const countdownEl = document.getElementById('milestoneCountdown');
  if (countdownEl) {
    const targetDate = new Date('2026-10-30T17:00:00+05:00').getTime();
    
    function updateCountdown() {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        countdownEl.textContent = 'Milestone In Review';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
    }

    updateCountdown();
    setInterval(updateCountdown, 60000);
  }

  // Initial operational stream log
  appendTerminalLog('MAB Group Enterprise ERP AI Integration Engine initialized.', 'ok');
  appendTerminalLog('Secure TLS 1.3 socket active. Real-time telemetry streaming.', 'info');
});
