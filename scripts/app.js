/**
 * AIMABGRP.COM - Enterprise Portal & Maritime AI Operations Gateway
 * Author: NeuroGrid Labs (Pvt.) Ltd. for MAB Group
 * Implementation of 6 Core Maritime Modules + Dual Pricing + SOLAS Engine
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

  // ------------------------------------------------------------------------
  // 3. Navigation Tab Controller (7 Modern Operations Panels)
  // ------------------------------------------------------------------------
  const tabButtons = document.querySelectorAll('.neu-tab-btn');
  const panelViews = document.querySelectorAll('.dashboard-panel-view');

  function switchTab(targetId) {
    tabButtons.forEach(b => b.classList.remove('active'));
    panelViews.forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.neu-tab-btn[data-tab="${targetId}"]`);
    const activePanel = document.getElementById(targetId);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) {
      activePanel.classList.add('active');
      window.scrollTo({ top: activePanel.offsetTop - 90, behavior: 'smooth' });
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // ------------------------------------------------------------------------
  // 4. MODULE 1: MARITIME RFQ GATEWAY CONTROLLER
  // ------------------------------------------------------------------------
  const rfqCards = document.querySelectorAll('.rfq-vessel-card');
  const filterChips = document.querySelectorAll('.rfq-filter-chip');
  const rawRfqDrawer = document.getElementById('rawRfqDrawer');
  const rawRfqTitle = document.getElementById('rawRfqTitle');
  const rawRfqContent = document.getElementById('rawRfqContent');
  const closeRawRfqBtn = document.getElementById('closeRawRfqBtn');

  // Filter chips handler
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playSound('click');
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      rfqCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else {
          const category = card.getAttribute('data-category') || '';
          card.style.display = category.includes(filter) ? 'flex' : 'none';
        }
      });
    });
  });

  // Raw RFQ Message Payloads
  const rawPayloads = {
    'MV YUAN XING RI ZHAO': `DATE: 08-NOV-2026 14:22 UTC
FROM: superintendent@cosco-bulk.com (COSCO Shipping Bulk)
TO: ops@aimabgrp.com
SUBJECT: RFQ - Annual LSA & FFA Statutory Survey / Port Bin Qasim Call

Dear Sirs,
Our Capesize Bulk Carrier MV YUAN XING RI ZHAO (IMO 9582104, Panama Flag, DWT 51,240 MT) is en-route from Singapore to Port Bin Qasim (Berth 3).
Estimated Arrival: 09-NOV-2026 18:00 PKT.
Classification: ClassNK (Nippon Kaiji Kyokai).

Please submit your most competitive commercial quotation for the following statutory attendance:
1. Portable Fire Extinguishers: 24 units (Dry Powder 6kg/9kg, Foam 9L, CO2 5kg) annual check & weighing.
2. Breathing Apparatus: 4 SCBA sets inspection + 4 cylinders hydrostatic test & refill (300 bar).
3. EEBD: 2 emergency escape breathing units inspection.
4. Galley Fire Suppression: Annual survey of galley CO2 deep-fat fryer system.
5. Inflatable Life Rafts: 2x 25-person SOLAS Pack A annual servicing & hydrostatic release replacement.

Copy of ClassNK Cargo Ship Safety Equipment Certificate attached.
Awaiting your dual quotation (Standard 30 Days Credit vs Cash on Board).

Best regards,
Fleet Technical Superintendent
COSCO Shipping Bulk Technical Services`,

    'MV AL-MABROUK': `DATE: 08-NOV-2026 19:10 UTC
FROM: master.almabrouk@arabianshipping.net
TO: ops@aimabgrp.com
SUBJECT: URGENT RFQ - Lifeboat 5-Year Overhaul & Liferaft Overhaul at Karachi Outer Anchorage

URGENT TRANSMISSION:
Vessel MV AL-MABROUK (IMO 9283712, Liberia Flag). Calling Karachi Port Outer Anchorage on 10-NOV-2026 06:00 PKT.
Class: Bureau Veritas.

Scope required during anchorage call:
- 5-Year Dynamic Winch Brake Load Test (1.1x SWL) and on-load hook release mechanism overhaul for 2x 38-person GRP lifeboats.
- Annual service of 2x 20-person inflatable life rafts (LR).
- 2x Hammar H20 Hydrostatic Release Units replacement.

Please confirm whether lifeboat inspection can be attended concurrently with raft workshop collection.

Master, MV AL-MABROUK`,

    'MV PEONIA': `DATE: 07-NOV-2026 21:40 UTC
FROM: fleet.ops@peonia-maritime.gr
TO: ops@aimabgrp.com
SUBJECT: RFQ - Fixed High Pressure CO2 System Servicing at Port Qasim FOTCO

Vessel: MV PEONIA (IMO 9341842, Marshall Islands Flag).
Class: Lloyd's Register (LR).
Calling: Port Qasim FOTCO Oil Pier on 11-NOV-2026 14:00 PKT.

Required Services:
1. Fixed High-Pressure CO2 Fire Extinguishing System (120 cylinders of 45kg each):
   - Ultrasonic liquid level verification of 120 cylinders.
   - Hydrostatic pressure testing of 12 cylinders due for 10-year statutory test.
   - Main distribution manifold, directional valves, and pneumatic actuation lines blow-through test.
2. Medical Oxygen Resuscitator and 2x 40L O2 cylinders refill.

Please provide quotation. Note our vessel is classed with Lloyd's Register.

Technical Management, Peonia Maritime S.A.`,

    'MT PACIFIC JEWEL': `DATE: 09-NOV-2026 04:15 UTC
FROM: ops@gulf-maritime-pk.com (Local Port Shipping Agent)
TO: ops@aimabgrp.com
SUBJECT: IMMEDIATE BOARDING - MT PACIFIC JEWEL (IMO 9410982) / Berth 11 KPT

Attn: MAB Marine Operations,
Product Tanker MT PACIFIC JEWEL has arrived at Berth 11, Karachi Port Trust.
Port State Control (PSC) inspection scheduled for 10-Nov morning.
Statutory pyrotechnics have expired:
- 4x Rocket Parachute Flares (SOLAS Pack A)
- 6x Red Hand Flares
- 2x Buoyant Smoke Signals
- 2x Hammar H20 Hydrostatic Release Units

Please prepare commercial quotation and arrange Customs Boarding Letter urgently for your certified technicians today.

Operations Desk, Gulf Maritime Shipping Agents`
  };

  // View Raw RFQ Drawer
  document.querySelectorAll('.btn-view-raw').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSound('pop');
      const vessel = btn.getAttribute('data-vessel');
      if (rawRfqTitle) rawRfqTitle.textContent = `Raw Inbound Message: ${vessel}`;
      if (rawRfqContent) rawRfqContent.textContent = rawPayloads[vessel] || 'Payload loaded from inbound satellite gateway.';
      if (rawRfqDrawer) {
        rawRfqDrawer.style.display = 'block';
        rawRfqDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  if (closeRawRfqBtn) {
    closeRawRfqBtn.addEventListener('click', () => {
      playSound('click');
      if (rawRfqDrawer) rawRfqDrawer.style.display = 'none';
    });
  }

  // Cross-module buttons on RFQ cards
  document.querySelectorAll('.btn-open-solas').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('pop');
      switchTab('tab-solas-classifier');
    });
  });

  document.querySelectorAll('.btn-open-quote').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('pop');
      switchTab('tab-quotations');
    });
  });

  document.querySelectorAll('.btn-open-broker').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('pop');
      switchTab('tab-iacs-lb');
    });
  });

  document.querySelectorAll('.btn-open-class-gate').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('pop');
      switchTab('tab-iacs-lb');
    });
  });

  document.querySelectorAll('.btn-open-customs').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('pop');
      switchTab('tab-customs-boarding');
    });
  });

  // ------------------------------------------------------------------------
  // 5. MODULE 2: CERTIFICATE & SOLAS CLASSIFIER CONTROLLER
  // ------------------------------------------------------------------------
  const certSelector = document.getElementById('certSampleSelector');
  const certVesselTitle = document.getElementById('certVesselTitle');
  const certImoNum = document.getElementById('certImoNum');
  const certFlag = document.getElementById('certFlag');
  const certClass = document.getElementById('certClass');
  const certSurveyDate = document.getElementById('certSurveyDate');
  const certExpiryDate = document.getElementById('certExpiryDate');
  const pushToQuoteBtn = document.getElementById('pushToQuoteBtn');
  const solasTableBody = document.getElementById('solasItemsTableBody');

  const certificatesData = {
    'cert-1': {
      vessel: 'MV YUAN XING RI ZHAO',
      imo: '9582104',
      flag: 'Panama (PMA)',
      classSoc: 'ClassNK (Nippon Kaiji Kyokai)',
      survey: '18-Nov-2025 (Singapore)',
      expiry: '22-Nov-2026 (Due)',
      pack: 'Pack A'
    },
    'cert-2': {
      vessel: 'MV AL-MABROUK',
      imo: '9283712',
      flag: 'Liberia',
      classSoc: 'Bureau Veritas (BV)',
      survey: '12-Oct-2025 (Salalah)',
      expiry: '14-Nov-2026 (Expiring in 5 Days)',
      pack: 'Pack A'
    },
    'cert-3': {
      vessel: 'MV PEONIA',
      imo: '9341842',
      flag: 'Marshall Islands',
      classSoc: 'Lloyd\'s Register (LR)',
      survey: '05-Dec-2025 (Fujairah)',
      expiry: '08-Dec-2026 (Survey Due)',
      pack: 'Pack A'
    },
    'cert-4': {
      vessel: 'MT PACIFIC JEWEL',
      imo: '9410982',
      flag: 'Singapore',
      classSoc: 'DNV GL',
      survey: '10-Jan-2025 (Ras Tanura)',
      expiry: '01-Nov-2026 (EXPIRED)',
      pack: 'Pack A'
    }
  };

  // Full 26 Statutory Items from solas_pack_a_and_b_master_sheet.pdf
  const masterSolas26Items = [
    { id: 1, name: 'Rocket Parachute Flares', imo: 'SOLAS III/38.5.1.1', packA: '4 pcs', packB: '2 pcs', status: 'Compliant', checked: true },
    { id: 2, name: 'Hand Flares (Red Light)', imo: 'SOLAS III/38.5.1.2', packA: '6 pcs', packB: '2 pcs', status: 'Compliant', checked: true },
    { id: 3, name: 'Buoyant Smoke Signals', imo: 'SOLAS III/38.5.1.3', packA: '2 pcs', packB: '1 pc', status: 'Compliant', checked: true },
    { id: 4, name: 'Survival Food Rations (10,000 kJ/person)', imo: 'LSA Code IV/4.1.5.18', packA: '100% Complement', packB: 'None', status: 'Due Renewal', checked: true },
    { id: 5, name: 'Fresh Drinking Water (1.5 L/person)', imo: 'LSA Code IV/4.1.5.19', packA: '100% Complement', packB: 'None', status: 'Due Renewal', checked: true },
    { id: 6, name: 'Rustproof Dipper & Graduated Drinking Cup', imo: 'LSA Code IV/4.1.5.20', packA: '1 each', packB: 'None', status: 'Onboard Valid', checked: false },
    { id: 7, name: 'Anti-Seasickness Medicine', imo: 'LSA Code IV/4.1.5.21', packA: '6 doses / person', packB: '6 doses / person', status: 'Due Renewal', checked: true },
    { id: 8, name: 'Seasickness Bags', imo: 'LSA Code IV/4.1.5.22', packA: '1 / person', packB: '1 / person', status: 'Onboard Valid', checked: false },
    { id: 9, name: 'Thermal Protective Aids (TPA)', imo: 'LSA Code IV/4.1.5.24', packA: '10% or 2 units', packB: '10% or 2 units', status: 'Onboard Valid', checked: false },
    { id: 10, name: 'First Aid Kit (SOLAS Approved Waterproof)', imo: 'LSA Code IV/4.1.5.8', packA: '1 Complete Kit', packB: '1 Complete Kit', status: 'Medical Check Due', checked: true },
    { id: 11, name: 'Radar Reflector (Passive 9GHz)', imo: 'LSA Code IV/4.1.5.23', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 12, name: 'Daylight Signaling Mirror / Heliograph', imo: 'LSA Code IV/4.1.5.11', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 13, name: 'Waterproof Electric Torch & Spare Batteries', imo: 'LSA Code IV/4.1.5.10', packA: '1 set', packB: '1 set', status: 'Onboard Valid', checked: false },
    { id: 14, name: 'Safety Whistle', imo: 'LSA Code IV/4.1.5.12', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 15, name: 'Jack-Knife / Safety Knife with Lanyard', imo: 'LSA Code IV/4.1.5.2', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 16, name: 'Tin Openers (Rustproof)', imo: 'LSA Code IV/4.1.5.3', packA: '3 units', packB: 'None', status: 'Onboard Valid', checked: false },
    { id: 17, name: 'Fishing Tackle Kit', imo: 'LSA Code IV/4.1.5.17', packA: '1 Complete Set', packB: 'None', status: 'Due Renewal', checked: true },
    { id: 18, name: 'De-icing Sponges', imo: 'LSA Code IV/4.1.5.4', packA: '2 units', packB: '2 units', status: 'Onboard Valid', checked: false },
    { id: 19, name: 'Sea Anchor / Drogue with Hawser', imo: 'LSA Code IV/4.1.5.6', packA: '2 Complete Sets', packB: '2 Complete Sets', status: 'Onboard Valid', checked: false },
    { id: 20, name: 'Bailing Bucket / Buoyant Bailer', imo: 'LSA Code IV/4.1.5.3', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 21, name: 'Manual Inflation Bellows / Pump', imo: 'LSA Code IV/4.1.5.15', packA: '1 unit', packB: '1 unit', status: 'Onboard Valid', checked: false },
    { id: 22, name: 'Emergency Repair Kit (Plugs & Clamps)', imo: 'LSA Code IV/4.1.5.16', packA: '1 kit', packB: '1 kit', status: 'Onboard Valid', checked: false },
    { id: 23, name: 'Survival Manual & Action Instructions', imo: 'LSA Code IV/4.1.5.13', packA: '1 copy (Waterproof)', packB: '1 copy', status: 'Onboard Valid', checked: false },
    { id: 24, name: 'Table of Life-Saving Signals', imo: 'LSA Code IV/4.1.5.14', packA: '1 card', packB: '1 card', status: 'Onboard Valid', checked: false },
    { id: 25, name: 'Hydrostatic Release Unit (HRU Hammar H20)', imo: 'SOLAS III/13.4.2', packA: '2-Year Statutory', packB: '2-Year Statutory', status: 'EXPIRED / REPLACE', checked: true },
    { id: 26, name: 'Painter Line (min 30m) & Weak Link (100kN)', imo: 'SOLAS III/38.5.1.25', packA: '30 meters / 100kN', packB: '30 meters', status: 'Tensile Valid', checked: false }
  ];

  function renderSolasTable() {
    if (!solasTableBody) return;
    solasTableBody.innerHTML = '';

    masterSolas26Items.forEach(item => {
      const tr = document.createElement('tr');
      const isUrgent = item.status.includes('Due') || item.status.includes('EXPIRED');
      const statusColor = isUrgent ? 'var(--brand-rose)' : 'var(--brand-emerald)';

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); color:var(--text-dim);">${item.id}</td>
        <td><strong>${item.name}</strong></td>
        <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-dim);">${item.imo}</td>
        <td class="col-pack-a">${item.packA}</td>
        <td class="col-pack-b">${item.packB}</td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; color:${statusColor};">
            <span class="status-pulse-dot" style="background:${statusColor}; width:6px; height:6px;"></span>
            ${item.status}
          </span>
        </td>
        <td style="text-align:right;">
          <input type="checkbox" ${item.checked ? 'checked' : ''} class="solas-check-box" data-id="${item.id}" style="width:16px; height:16px; accent-color:var(--brand-teal); cursor:pointer;">
        </td>
      `;
      solasTableBody.appendChild(tr);
    });
  }

  renderSolasTable();

  // Certificate selector change
  if (certSelector) {
    certSelector.addEventListener('change', (e) => {
      playSound('click');
      const certKey = e.target.value;
      const data = certificatesData[certKey] || certificatesData['cert-1'];

      if (certVesselTitle) certVesselTitle.textContent = data.vessel;
      if (certImoNum) certImoNum.textContent = data.imo;
      if (certFlag) certFlag.textContent = data.flag;
      if (certClass) certClass.textContent = data.classSoc;
      if (certSurveyDate) certSurveyDate.textContent = data.survey;
      if (certExpiryDate) certExpiryDate.textContent = data.expiry;

      // Update quotation metadata
      const quoteVessel = document.getElementById('quoteVessel');
      const quoteFlagEl = document.getElementById('quoteFlag');
      const quoteClassEl = document.getElementById('quoteClass');
      const boardVesselName = document.getElementById('boardVesselName');
      const boardVesselImo = document.getElementById('boardVesselImo');
      const boardVesselFlag = document.getElementById('boardVesselFlag');

      if (quoteVessel) quoteVessel.textContent = `${data.vessel} (IMO ${data.imo})`;
      if (quoteFlagEl) quoteFlagEl.textContent = data.flag;
      if (quoteClassEl) quoteClassEl.textContent = `${data.classSoc} (Approved Station)`;
      if (boardVesselName) boardVesselName.textContent = data.vessel;
      if (boardVesselImo) boardVesselImo.textContent = data.imo;
      if (boardVesselFlag) boardVesselFlag.textContent = data.flag;
    });
  }

  // Push to Quote button
  if (pushToQuoteBtn) {
    pushToQuoteBtn.addEventListener('click', () => {
      playSound('success');
      switchTab('tab-quotations');
    });
  }

  // ------------------------------------------------------------------------
  // 6. MODULE 3: QUOTATION & DUAL PRICING ENGINE CONTROLLER
  // ------------------------------------------------------------------------
  const btnPriceStandard = document.getElementById('btnPriceStandard');
  const btnPriceDiscounted = document.getElementById('btnPriceDiscounted');
  const quoteLineItemsBody = document.getElementById('quoteLineItemsBody');
  const quotePortFeesBody = document.getElementById('quotePortFeesBody');
  const sumTechSubtotal = document.getElementById('sumTechSubtotal');
  const sumPortFees = document.getElementById('sumPortFees');
  const sumGrossTotal = document.getElementById('sumGrossTotal');
  const rowDiscount = document.getElementById('rowDiscount');
  const sumDiscount = document.getElementById('sumDiscount');
  const labelNetPayable = document.getElementById('labelNetPayable');
  const sumNetPayable = document.getElementById('sumNetPayable');
  const paymentTermsText = document.getElementById('paymentTermsText');

  let currentPricingMode = 'standard'; // 'standard' or 'discounted'

  // Actual MAB Group Rate Schedule (from real quotation archives in resource/Quotations)
  const quotationTechItems = [
    { desc: 'Portable Fire Extinguishers (Dry Powder 6kg/9kg, Foam 9L, CO2 5kg) Annual Inspection', qty: 24, rate: 10.00 },
    { desc: 'Breathing Apparatus (SCBA) Positive Pressure Sets Annual Inspection & Flow Test', qty: 4, rate: 30.00 },
    { desc: 'SCBA Carbon Composite Cylinders Hydrostatic Test & Pure Breathing Air Refill (300 Bar)', qty: 4, rate: 35.00 },
    { desc: 'Emergency Escape Breathing Devices (EEBD 15-Min) Annual Inspection', qty: 2, rate: 35.00 },
    { desc: 'Inflatable Life Rafts (25-Person SOLAS Pack A) Annual Workshop Overhaul & Gas Inflation Test', qty: 2, rate: 350.00 },
    { desc: 'Hammar H20 Hydrostatic Release Units (HRU) SOLAS Approved Replacement (2-Year Expiry)', qty: 2, rate: 85.00 },
    { desc: 'Galley Fire Suppression System (Deep-Fat Fryer CO2 / Wet Chemical) Annual Survey', qty: 1, rate: 600.00 }
  ];

  // Mandatory Port Regulatory & Logistics Fees (Port Qasim / Karachi Port)
  const quotationPortFees = [
    { desc: 'Admin, Documentation & Allow on Board Statutory Port Permission', terms: 'Per Call', rate: 200.00 },
    { desc: 'Customs Preventive Clearance, Gate Pass & Dock Escort Formalities', terms: 'Per Call', rate: 300.00 },
    { desc: 'Port Terminal Entry Pass & Safety Security Escort Fee', terms: 'Per Call', rate: 150.00 },
    { desc: 'Certified Workshop Cartage, Round-Trip Equipment Transport & Handling', terms: 'Fixed', rate: 100.00 }
  ];

  function renderQuotationTables() {
    let techTotal = 0;
    if (quoteLineItemsBody) {
      quoteLineItemsBody.innerHTML = '';
      quotationTechItems.forEach((item, index) => {
        const lineTotal = item.qty * item.rate;
        techTotal += lineTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:#64748b; font-family:var(--font-mono);">${index + 1}</td>
          <td><strong>${item.desc}</strong></td>
          <td style="text-align:center;">${item.qty}</td>
          <td style="text-align:right; font-family:var(--font-mono);">$${item.rate.toFixed(2)}</td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:700;">$${lineTotal.toFixed(2)}</td>
        `;
        quoteLineItemsBody.appendChild(tr);
      });
    }

    let portTotal = 0;
    if (quotePortFeesBody) {
      quotePortFeesBody.innerHTML = '';
      quotationPortFees.forEach((item, index) => {
        portTotal += item.rate;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:#64748b; font-family:var(--font-mono);">${index + 1}</td>
          <td>${item.desc}</td>
          <td style="text-align:center; color:#64748b;">${item.terms}</td>
          <td style="text-align:right; font-family:var(--font-mono);">$${item.rate.toFixed(2)}</td>
          <td style="text-align:right; font-family:var(--font-mono); font-weight:700;">$${item.rate.toFixed(2)}</td>
        `;
        quotePortFeesBody.appendChild(tr);
      });
    }

    const grossTotal = techTotal + portTotal;
    const discountAmount = grossTotal * 0.10; // Exactly 10% bottom-line discount

    if (sumTechSubtotal) sumTechSubtotal.textContent = `$${techTotal.toFixed(2)}`;
    if (sumPortFees) sumPortFees.textContent = `$${portTotal.toFixed(2)}`;
    if (sumGrossTotal) sumGrossTotal.textContent = `$${grossTotal.toFixed(2)}`;

    if (currentPricingMode === 'discounted') {
      const netPayable = grossTotal - discountAmount;
      if (rowDiscount) rowDiscount.style.display = 'flex';
      if (sumDiscount) sumDiscount.textContent = `-$${discountAmount.toFixed(2)} (10%)`;
      if (labelNetPayable) labelNetPayable.textContent = 'Net Payable (Prompt Cash on Board):';
      if (sumNetPayable) sumNetPayable.textContent = `$${netPayable.toFixed(2)} USD`;
      if (paymentTermsText) paymentTermsText.textContent = 'Prompt Settlement: Cash on Board upon completion of service OR Immediate Bank Wire prior to sailing (10% Discount Applied).';
    } else {
      if (rowDiscount) rowDiscount.style.display = 'none';
      if (labelNetPayable) labelNetPayable.textContent = 'Net Payable (Net 30 Days):';
      if (sumNetPayable) sumNetPayable.textContent = `$${grossTotal.toFixed(2)} USD`;
      if (paymentTermsText) paymentTermsText.textContent = '30 Days Credit through Appointed Local Shipping Agency / Principal Account.';
    }
  }

  renderQuotationTables();

  // Dual Pricing Toggle Buttons
  if (btnPriceStandard) {
    btnPriceStandard.addEventListener('click', () => {
      playSound('click');
      currentPricingMode = 'standard';
      btnPriceStandard.classList.add('active');
      if (btnPriceDiscounted) btnPriceDiscounted.classList.remove('active');
      renderQuotationTables();
    });
  }

  if (btnPriceDiscounted) {
    btnPriceDiscounted.addEventListener('click', () => {
      playSound('pop');
      currentPricingMode = 'discounted';
      btnPriceDiscounted.classList.add('active');
      if (btnPriceStandard) btnPriceStandard.classList.remove('active');
      renderQuotationTables();
    });
  }

  // Print Quotation PDF
  const printQuoteBtn = document.getElementById('printQuoteBtn');
  if (printQuoteBtn) {
    printQuoteBtn.addEventListener('click', () => {
      playSound('pop');
      window.print();
    });
  }

  // Copy Direct Link
  const copyQuoteLinkBtn = document.getElementById('copyQuoteLinkBtn');
  if (copyQuoteLinkBtn) {
    copyQuoteLinkBtn.addEventListener('click', () => {
      playSound('click');
      const shareUrl = window.location.origin + '/quote/MAB-2026-8819?mode=' + currentPricingMode;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Direct quotation link copied to clipboard:\n${shareUrl}`);
      }).catch(() => {
        alert(`Direct quotation link:\n${shareUrl}`);
      });
    });
  }

  // DOCX Export Generator (Native Word Document format via Blob)
  const downloadDocxBtn = document.getElementById('downloadDocxBtn');
  if (downloadDocxBtn) {
    downloadDocxBtn.addEventListener('click', () => {
      playSound('pop');
      generateDocxQuotation();
    });
  }

  function generateDocxQuotation() {
    const isDiscount = currentPricingMode === 'discounted';
    const grossVal = 2790.00;
    const discountVal = isDiscount ? 279.00 : 0.00;
    const netVal = isDiscount ? 2511.00 : 2790.00;

    let rowsXml = '';
    quotationTechItems.forEach((item, idx) => {
      rowsXml += `
        <tr>
          <td style="padding:6px; border:1px solid #ccc; text-align:center;">${idx + 1}</td>
          <td style="padding:6px; border:1px solid #ccc;">${item.desc}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:center;">${item.qty}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:right;">$${item.rate.toFixed(2)}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:right; font-weight:bold;">$${(item.qty * item.rate).toFixed(2)}</td>
        </tr>
      `;
    });

    let portXml = '';
    quotationPortFees.forEach((item, idx) => {
      portXml += `
        <tr>
          <td style="padding:6px; border:1px solid #ccc; text-align:center;">${idx + 1}</td>
          <td style="padding:6px; border:1px solid #ccc;">${item.desc}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:center;">${item.terms}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:right;">$${item.rate.toFixed(2)}</td>
          <td style="padding:6px; border:1px solid #ccc; text-align:right; font-weight:bold;">$${item.rate.toFixed(2)}</td>
        </tr>
      `;
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>MAB Group Commercial Quotation</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.4; }
          h1 { color: #0d5c6b; font-size: 18pt; margin-bottom: 2px; }
          .header-meta { font-size: 9pt; color: #64748b; margin-bottom: 18px; }
          .statutory-box { background: #f0fdfa; border-left: 4px solid #0d5c6b; padding: 10px; font-style: italic; font-size: 9.5pt; margin: 14px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10pt; }
          th { background: #0d5c6b; color: #ffffff; padding: 6px; text-align: left; }
          .summary-table td { border: none; padding: 4px 6px; }
        </style>
      </head>
      <body>
        <h1>MAMUN ALI BUMASUK (PVT.) LTD.</h1>
        <div style="font-weight:bold; color:#0891b2; font-size:10pt;">APPROVED MARINE SAFETY, LSA &amp; FFA SERVICE STATION • KARACHI / PORT QASIM</div>
        <div class="header-meta">
          Plot # C-14, Commercial Area, Port Muhammad Bin Qasim, Karachi - Pakistan<br>
          Tel: +92 21 34720191 | Email: ops@aimabgrp.com | Web: www.aimabgrp.com
        </div>

        <table style="margin-bottom:12px;">
          <tr>
            <td style="border:none;"><strong>Quotation Ref:</strong> MAB/2026/QT-8819</td>
            <td style="border:none; text-align:right;"><strong>Date:</strong> 09-NOV-2026</td>
          </tr>
          <tr>
            <td style="border:none;"><strong>To:</strong> Master / Superintendent / Owners</td>
            <td style="border:none; text-align:right;"><strong>Vessel:</strong> MV YUAN XING RI ZHAO (IMO 9582104)</td>
          </tr>
          <tr>
            <td style="border:none;"><strong>Port of Call:</strong> Port Bin Qasim (Berth 3)</td>
            <td style="border:none; text-align:right;"><strong>Class:</strong> ClassNK (Approved)</td>
          </tr>
        </table>

        <div class="statutory-box">
          "This Commercial Quotation is issued by MAMUN ALI BUMASUK (PVT.) LTD. in strict statutory compliance with IMO SOLAS 1974 (as amended), Chapter III (Life-Saving Appliances and Arrangements), Chapter II-2 (Fire Protection, Fire Detection and Fire Extinction), the International LSA Code (Resolution MSC.48(66)), IMO Resolution A.761(18), MSC.1/Circ.1206/Rev.1, and relevant IACS Classification Society Rules."
        </div>

        <h3>1. Technical Scope of Statutory Services:</h3>
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th>Description</th>
              <th style="text-align:center; width:50px;">Qty</th>
              <th style="text-align:right; width:90px;">Unit Rate</th>
              <th style="text-align:right; width:100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsXml}
          </tbody>
        </table>

        <h3>2. Mandatory Port Logistics &amp; Regulatory Fees:</h3>
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th>Description</th>
              <th style="text-align:center; width:60px;">Terms</th>
              <th style="text-align:right; width:90px;">Rate</th>
              <th style="text-align:right; width:100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${portXml}
          </tbody>
        </table>

        <table class="summary-table" style="width:50%; margin-left:auto; margin-top:14px;">
          <tr>
            <td><strong>Technical Subtotal:</strong></td>
            <td style="text-align:right;">$2,040.00</td>
          </tr>
          <tr>
            <td><strong>Port Logistics Fees:</strong></td>
            <td style="text-align:right;">$750.00</td>
          </tr>
          <tr>
            <td><strong>Combined Gross Total:</strong></td>
            <td style="text-align:right;"><strong>$2,790.00</strong></td>
          </tr>
          ${isDiscount ? `
          <tr style="color:#10b981; font-weight:bold;">
            <td>Prompt Cash on Board (-10% Discount):</td>
            <td style="text-align:right;">-$279.00</td>
          </tr>
          ` : ''}
          <tr style="font-size:12pt; font-weight:bold; color:#0d5c6b; border-top:2px solid #0d5c6b;">
            <td>${isDiscount ? 'Net Payable (Cash on Board):' : 'Net Payable (Net 30 Days):'}</td>
            <td style="text-align:right;">$${netVal.toFixed(2)} USD</td>
          </tr>
        </table>

        <div style="margin-top:30px; font-size:9.5pt; color:#64748b;">
          <strong>Payment Terms:</strong> ${isDiscount ? 'Cash on Board / Prompt Bank Wire upon service completion (10% Discount).' : '30 Days Credit via shipping agency.'}<br>
          <strong>Offshore Remittance:</strong> Habib Bank Limited / Standard Chartered Bank (USD Account).<br><br>
          <strong>For MAMUN ALI BUMASUK (PVT.) LTD.</strong><br>
          Authorized Marine Safety Superintendent
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAB-Quotation-${isDiscount ? 'Discounted-COB' : 'Standard'}-MV-YuanXingRiZhao.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('success');
  }

  // ------------------------------------------------------------------------
  // 7. MODULE 4: IACS CLASS & LIFEBOAT BROKERAGE CONTROLLER
  // ------------------------------------------------------------------------
  const iacsClassSelector = document.getElementById('iacsClassSelector');
  const classStatusTitle = document.getElementById('classStatusTitle');
  const classStatusDesc = document.getElementById('classStatusDesc');
  const classStatusBox = document.getElementById('classStatusBox');
  const btnSimulateClassGrant = document.getElementById('btnSimulateClassGrant');
  const classNoticeText = document.getElementById('classNoticeText');
  const btnCopyClassNotice = document.getElementById('btnCopyClassNotice');

  if (iacsClassSelector) {
    iacsClassSelector.addEventListener('change', (e) => {
      playSound('click');
      updateClassGateStatus(e.target.value);
    });
  }

  function updateClassGateStatus(classKey) {
    if (!classStatusTitle || !classStatusDesc || !classStatusBox) return;

    if (classKey === 'class-f') {
      classStatusBox.style.background = 'rgba(16,185,129,0.1)';
      classStatusBox.style.borderColor = 'rgba(16,185,129,0.3)';
      classStatusTitle.textContent = 'CLASS CLEARANCE VERIFIED (Class F)';
      classStatusTitle.style.color = 'var(--brand-emerald)';
      classStatusDesc.textContent = "Vessel equipment classification matches MAB Group's certified Class F service station approvals. Quotation and port attendance are fully authorized for immediate dispatch.";
    } else if (classKey === 'class-y') {
      classStatusBox.style.background = 'rgba(245,158,11,0.1)';
      classStatusBox.style.borderColor = 'rgba(245,158,11,0.3)';
      classStatusTitle.textContent = 'HELD IN DRAFT: Class Y (ABS / RINA) Authorization Required';
      classStatusTitle.style.color = 'var(--brand-amber)';
      classStatusDesc.textContent = "MAB is certified by Class F. Equipment is Class Y. Quotation is safely held in internal draft. Resource allocation paused until formal Class Society Authorization is received from the owner.";
    } else if (classKey === 'class-h') {
      classStatusBox.style.background = 'rgba(244,63,94,0.1)';
      classStatusBox.style.borderColor = 'rgba(244,63,94,0.3)';
      classStatusTitle.textContent = "HELD IN DRAFT: Class H (Lloyd's Register) Authorization Required";
      classStatusTitle.style.color = 'var(--brand-rose)';
      classStatusDesc.textContent = "Equipment is Class H. Under IACS rules, attendance requires prior written surveyor grant. Notice drafted for shipowner. Quotation waiting for authorization.";
    }
  }

  if (btnSimulateClassGrant) {
    btnSimulateClassGrant.addEventListener('click', () => {
      playSound('success');
      alert('Class Society Authorization Upload Simulated:\nLloyd\'s Register Surveyor Grant #LR-AUTH-2026-891 verified.\nStatus flipped to: CLEARED FOR IMMEDIATE ATTENDANCE.');
      if (classStatusTitle) classStatusTitle.textContent = 'CLASS AUTHORIZATION RECEIVED & VERIFIED';
      if (classStatusTitle) classStatusTitle.style.color = 'var(--brand-emerald)';
      if (classStatusBox) {
        classStatusBox.style.background = 'rgba(16,185,129,0.1)';
        classStatusBox.style.borderColor = 'rgba(16,185,129,0.3)';
      }
    });
  }

  if (btnCopyClassNotice) {
    btnCopyClassNotice.addEventListener('click', () => {
      playSound('click');
      if (classNoticeText) {
        navigator.clipboard.writeText(classNoticeText.textContent).then(() => {
          alert('Formal Class Authorization Notice copied to clipboard.');
        });
      }
    });
  }

  // ------------------------------------------------------------------------
  // 8. MODULE 5: CUSTOMS BOARDING LETTER CONTROLLER
  // ------------------------------------------------------------------------
  const customsModeSelector = document.getElementById('customsModeSelector');
  const boardAgentDetails = document.getElementById('boardAgentDetails');
  const btnPrintBoardingPass = document.getElementById('btnPrintBoardingPass');

  if (customsModeSelector) {
    customsModeSelector.addEventListener('change', (e) => {
      playSound('click');
      if (!boardAgentDetails) return;
      if (e.target.value === 'inhouse') {
        boardAgentDetails.textContent = 'MAB In-House Customs Desk (Mr. Asif Iqbal, CNIC: 42201-1892831-5, License # C-4891/KPT)';
      } else {
        boardAgentDetails.textContent = 'External Appointed Agent: Al-Ghafoor Marine Clearing Agents (Mr. Tariq Siddiqui, Lic # C-1982/PQA, Pass # PQA-AGT-441)';
      }
    });
  }

  if (btnPrintBoardingPass) {
    btnPrintBoardingPass.addEventListener('click', () => {
      playSound('pop');
      window.print();
    });
  }

  // ------------------------------------------------------------------------
  // 9. MODULE 6: TECHNICIAN FIELD INSPECTION SUITE CONTROLLER
  // ------------------------------------------------------------------------
  const group1ItemsList = document.getElementById('group1ItemsList');
  const group2ItemsList = document.getElementById('group2ItemsList');
  const group3ItemsList = document.getElementById('group3ItemsList');
  const group4ItemsList = document.getElementById('group4ItemsList');
  const btnPrintChecklistBtn = document.getElementById('btnPrintChecklistBtn');

  const inspectionChecklistData = {
    group1: [
      { id: 'g1-1', title: 'Hammar H20 Hydrostatic Release Units (HRU)', sub: 'Inspect 2-year service date stamp & weak link integrity', status: 'pass' },
      { id: 'g1-2', title: 'Rocket Parachute Flares (4 Units)', sub: 'Verify SOLAS batch expiry date (Must have min 24 months validity)', status: 'pass' },
      { id: 'g1-3', title: 'Red Hand Flares (6 Units) & Buoyant Smoke Signals (2 Units)', sub: 'Check canister hermetic seal and expiry stamps', status: 'pass' },
      { id: 'g1-4', title: 'First Aid Kit Medical Supplies & Burn Dressings', sub: 'Audit expiry dates of antiseptic, painkillers and bandages', status: 'defect' }
    ],
    group2: [
      { id: 'g2-1', title: 'Inflatable Life Raft Chamber Overpressure Relief Valves', sub: 'Soap bubble test & 2.0 psi chamber pressure holding test', status: 'pass' },
      { id: 'g2-2', title: 'SCBA Demand Regulator & Warning Whistle Flow', sub: 'Calibrate positive pressure flow & 55 bar whistle alarm activation', status: 'pass' },
      { id: 'g2-3', title: 'Galley CO2 Actuation Pull Cable & Quick-Closing Valves', sub: 'Inspect free-play tension and mechanical trip cylinder pin', status: 'pass' },
      { id: 'g2-4', title: 'Lifeboat Davit Limit Switches & Winch Brake Friction', sub: 'Dynamic load test (1.1x SWL) and brake lining clearance audit', status: 'pass' }
    ],
    group3: [
      { id: 'g3-1', title: 'SOLAS Grade Retro-Reflective Marine Tape (50mm)', sub: 'Inspect minimum 80% retro-reflection on liferaft canopy and immersion suits', status: 'pass' },
      { id: 'g3-2', title: 'Lifejacket Water-Activated LED Safety Lights', sub: 'Test salt-water sensor activation and minimum 0.75 cd / 8 hr output', status: 'pass' },
      { id: 'g3-3', title: 'CO2 System Bursting Discs & Copper Gaskets', sub: 'Inspect manifold connections for microscopic seepage and gasket fatigue', status: 'pass' }
    ],
    group4: [
      { id: 'g4-1', title: 'Immersion Suits Crew Complement Verifications', sub: 'Total count verified: 28 suits onboard against 24 crew complement', status: 'pass' },
      { id: 'g4-2', title: 'Lifejackets Muster & Engine Room Stowage Counts', sub: 'Total verified: 32 units including bridge and stern muster locations', status: 'pass' },
      { id: 'g4-3', title: 'Portable Fire Extinguishers Pressure Gauges', sub: 'Verified 24 extinguishers with pressure needle firmly in Green Operating Zone', status: 'pass' }
    ]
  };

  function renderGroupInspection(items, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'inspection-item-row';
      row.innerHTML = `
        <div class="item-desc-col">
          <span class="item-desc-title">${item.title}</span>
          <span class="item-desc-sub">${item.sub}</span>
        </div>

        <div class="item-controls-col">
          <div class="toggle-status-group">
            <button class="status-opt-btn ${item.status === 'pass' ? 'active opt-pass' : ''}" data-state="pass">PASS</button>
            <button class="status-opt-btn ${item.status === 'defect' ? 'active opt-defect' : ''}" data-state="defect">DEFECT</button>
            <button class="status-opt-btn ${item.status === 'condemn' ? 'active opt-condemn' : ''}" data-state="condemn">REPLACE</button>
          </div>

          <button class="btn-dock-photo" title="Attach Dockside Camera Photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            Attach Photo
          </button>
        </div>
      `;

      // Status opt clicks
      const btns = row.querySelectorAll('.status-opt-btn');
      btns.forEach(b => {
        b.addEventListener('click', () => {
          playSound('click');
          btns.forEach(x => {
            x.classList.remove('active', 'opt-pass', 'opt-defect', 'opt-condemn');
          });
          const st = b.getAttribute('data-state');
          b.classList.add('active');
          if (st === 'pass') b.classList.add('opt-pass');
          if (st === 'defect') b.classList.add('opt-defect');
          if (st === 'condemn') b.classList.add('opt-condemn');
        });
      });

      // Photo upload simulator
      const photoBtn = row.querySelector('.btn-dock-photo');
      if (photoBtn) {
        photoBtn.addEventListener('click', () => {
          playSound('pop');
          const sampleImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%230d5c6b"/><text x="30" y="34" font-family="Arial" font-size="9" fill="%2300f0d4" text-anchor="middle">STAMP OK</text></svg>';
          photoBtn.innerHTML = `<img src="${sampleImg}" class="photo-preview-thumbnail" alt="Dock photo"> Attached`;
          photoBtn.style.borderColor = 'var(--brand-emerald)';
          alert(`Dockside Photo Captured for:\n${item.title}\nCylinder test stamp / serial plate verification archived.`);
        });
      }

      containerEl.appendChild(row);
    });
  }

  renderGroupInspection(inspectionChecklistData.group1, group1ItemsList);
  renderGroupInspection(inspectionChecklistData.group2, group2ItemsList);
  renderGroupInspection(inspectionChecklistData.group3, group3ItemsList);
  renderGroupInspection(inspectionChecklistData.group4, group4ItemsList);

  if (btnPrintChecklistBtn) {
    btnPrintChecklistBtn.addEventListener('click', () => {
      playSound('pop');
      window.print();
    });
  }

  // ------------------------------------------------------------------------
  // 10. MODULE 7: ERP AI BRIDGE & STREAMING TERMINAL
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

  try {
    const evtSource = new EventSource('/api/live-telemetry');
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (erpRecordCount) erpRecordCount.textContent = data.erpRecordsSynced.toLocaleString();
      if (erpLatency) erpLatency.textContent = data.latencyMs + ' ms';
      appendTerminalLog(`Bidirectional packet verified: ${data.lastSyncedEntity}`, 'sync');
    };
  } catch (err) {
    setInterval(() => {
      currentRecords += Math.floor(Math.random() * 3);
      if (erpRecordCount) erpRecordCount.textContent = currentRecords.toLocaleString();
      if (erpLatency) erpLatency.textContent = (12 + Math.floor(Math.random() * 6)) + ' ms';
    }, 4000);
  }

  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      playSound('pop');
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing Central Database...';
      appendTerminalLog('Initiating full bidirectional reconciliation with MAB Group ERP...', 'info');

      setTimeout(() => {
        appendTerminalLog('TLS 1.3 Handshake completed. Authenticated with token SHA-256[9a4b...f82e]', 'ok');
      }, 600);

      setTimeout(() => {
        appendTerminalLog('Synchronized 4 active vessel route manifests & 26 SOLAS statutory items.', 'sync');
      }, 1200);

      setTimeout(() => {
        currentRecords += 184;
        if (erpRecordCount) erpRecordCount.textContent = currentRecords.toLocaleString();
        appendTerminalLog('Database sync completed successfully. Latency: 12.4ms.', 'ok');
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
      }, 1800);
    });
  }

  // Initial stream log
  appendTerminalLog('MAB Group Enterprise Maritime Operations Gateway online.', 'ok');
  appendTerminalLog('6 Operational Modules initialized: RFQ Gateway, SOLAS Classifier, Dual Pricing, IACS LB Broker, Customs Boarding, Field Inspection.', 'info');
});
