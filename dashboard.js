/**
 * Astra Grid — Dashboard JavaScript Engine
 * Controls tab switching, live telemetry streams, AI action dispatches,
 * equipment diagnostics, CSV reports generation, and configuration persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Toast Notification System
  // --------------------------------------------------------------------------
  const toastContainer = document.getElementById('toast-container');
  
  function showToast(message, type = 'normal', duration = 3500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-item ${type === 'orange' ? 'toast-orange' : ''}`;
    const icon = type === 'orange' ? '⚠' : '✦';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --------------------------------------------------------------------------
  // 2. Tab Navigation & Hash Routing
  // --------------------------------------------------------------------------
  const validTabs = ['overview', 'consumption', 'insights', 'equipment', 'reports', 'settings'];
  const sideNavLinks = document.querySelectorAll('.side-nav a, .sidebar-footer a[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');

  function switchTab(targetTab, updateHash = true) {
    if (!validTabs.includes(targetTab)) {
      targetTab = 'overview';
    }

    // Update active class on tab sections
    tabViews.forEach(view => {
      if (view.getAttribute('data-tab') === targetTab) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update active class on sidebar navigation
    sideNavLinks.forEach(link => {
      if (link.getAttribute('data-tab') === targetTab) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Sync URL hash
    if (updateHash && window.location.hash.replace('#', '') !== targetTab) {
      window.history.pushState(null, '', `#${targetTab}`);
    }

    // Scroll main viewport to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle sidebar navigation clicks
  sideNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const tab = link.getAttribute('data-tab');
      if (tab) {
        e.preventDefault();
        switchTab(tab);
      }
    });
  });

  // Handle in-page tab shortcut links
  document.querySelectorAll('.tab-link-btn, .clickable-action').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = el.getAttribute('data-target') || (el.getAttribute('href') || '').replace('#', '');
      if (target && validTabs.includes(target)) {
        e.preventDefault();
        switchTab(target);
      }
    });
  });

  // Handle browser back/forward and initial URL hash
  function handleHashChange() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash && validTabs.includes(hash)) {
      switchTab(hash, false);
    } else {
      switchTab('overview', false);
    }
  }

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange(); // Run on initial load

  // --------------------------------------------------------------------------
  // 3. User Profile & Name Settings Dialog
  // --------------------------------------------------------------------------
  const profileDialog = document.querySelector('#profile-dialog');
  const nameInput = document.querySelector('#name-input');
  const displayName = document.querySelector('#display-name');
  const profileName = document.querySelector('#profile-name');
  const initials = document.querySelector('#profile-initials');
  const savedName = localStorage.getItem('astra-name');

  function setName(name) {
    const clean = name.trim() || 'Alex';
    if (displayName) displayName.textContent = `${clean.split(' ')[0]}.`;
    if (profileName) profileName.textContent = clean;
    if (initials) {
      initials.textContent = clean.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();
    }
    if (nameInput) nameInput.value = clean;
  }

  setName(savedName || 'Alex Morgan');

  const profileBtn = document.querySelector('#profile-button');
  if (profileBtn && profileDialog) {
    profileBtn.addEventListener('click', () => profileDialog.showModal());
  }

  if (profileDialog) {
    const profileForm = profileDialog.querySelector('form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredName = nameInput.value.trim() || 'Alex';
        localStorage.setItem('astra-name', enteredName);
        setName(enteredName);
        profileDialog.close();
        showToast(`Profile name updated to ${enteredName}`);
      });
    }

    const closeBtn = profileDialog.querySelector('.close-dialog');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => profileDialog.close());
    }
  }

  // --------------------------------------------------------------------------
  // 4. Real-time Live Demand & Micro Charts Simulation
  // --------------------------------------------------------------------------
  let baseDemand = 42.8;
  const demandEl = document.querySelector('#demand');
  const eqTotalKw = document.querySelector('#eq-total-kw');
  const liveBars = document.querySelectorAll('#live-energy-bars i');

  setInterval(() => {
    baseDemand += (Math.random() - 0.5) * 0.45;
    if (baseDemand < 38.0) baseDemand = 38.0;
    if (baseDemand > 46.5) baseDemand = 46.5;

    const formatted = baseDemand.toFixed(1);
    if (demandEl) demandEl.innerHTML = `${formatted} <small>kW</small>`;
    if (eqTotalKw) eqTotalKw.textContent = `${formatted} kW`;

    // Dynamic random fluctuation on live bars
    if (liveBars.length > 0) {
      const randomIdx = Math.floor(Math.random() * (liveBars.length - 1));
      const currentHeight = parseInt(liveBars[randomIdx].style.height || '50%');
      const newHeight = Math.min(95, Math.max(25, currentHeight + (Math.random() - 0.5) * 15));
      liveBars[randomIdx].style.height = `${newHeight}%`;
    }
  }, 1800);

  // --------------------------------------------------------------------------
  // 5. Site Switcher Interactive Popover
  // --------------------------------------------------------------------------
  const siteSwitchTrigger = document.getElementById('site-switch-trigger');
  const siteDropdown = document.getElementById('site-dropdown');
  const activeSiteDisplay = document.getElementById('active-site-display');
  const siteLabels = document.querySelectorAll('.site-label-current');
  const costToday = document.getElementById('cost-today');
  const carbonVal = document.getElementById('carbon-val');

  if (siteSwitchTrigger && siteDropdown) {
    siteSwitchTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      siteDropdown.classList.toggle('open');
    });

    document.querySelectorAll('.site-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.site-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        const siteName = option.getAttribute('data-site');
        const demand = option.getAttribute('data-demand');
        const cost = option.getAttribute('data-cost');
        const carbon = option.getAttribute('data-carbon');

        if (activeSiteDisplay) activeSiteDisplay.textContent = siteName;
        siteLabels.forEach(lbl => lbl.textContent = siteName);
        if (costToday) costToday.innerHTML = cost.replace('.', '<span>.') + '</span>';
        if (carbonVal) carbonVal.innerHTML = `${carbon} <small>gCO₂/kWh</small>`;
        if (demandEl) demandEl.innerHTML = `${demand} <small>kW</small>`;
        baseDemand = parseFloat(demand);

        siteDropdown.classList.remove('open');
        showToast(`Active site switched to ${siteName}`);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 6. Notification Bell Dropdown & Badges
  // --------------------------------------------------------------------------
  const bellBtn = document.getElementById('bell-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  const markAllReadBtn = document.getElementById('mark-all-read');
  const bellBadge = document.getElementById('bell-badge');
  const unreadCount = document.getElementById('unread-count');
  const insightsCountBadge = document.getElementById('insights-count-badge');

  if (bellBtn && notifDropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        document.querySelectorAll('.notif-item').forEach(item => {
          item.classList.remove('unread');
          item.classList.add('read');
        });
        if (bellBadge) bellBadge.style.display = 'none';
        if (unreadCount) unreadCount.textContent = '0 unread';
        showToast('All notifications marked as read');
      });
    }
  }

  // Global click listener to dismiss popovers
  document.addEventListener('click', (e) => {
    if (siteDropdown && !siteSwitchTrigger.contains(e.target)) {
      siteDropdown.classList.remove('open');
    }
    if (notifDropdown && !bellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.remove('open');
    }
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterBtn = document.getElementById('time-filter-btn');
    if (filterDropdown && filterBtn && !filterBtn.contains(e.target)) {
      filterDropdown.classList.remove('open');
    }
  });

  // --------------------------------------------------------------------------
  // 7. Date Range Filter in Overview
  // --------------------------------------------------------------------------
  const timeFilterBtn = document.getElementById('time-filter-btn');
  const filterDropdown = document.getElementById('filter-dropdown');

  if (timeFilterBtn && filterDropdown) {
    timeFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle('open');
    });

    document.querySelectorAll('.filter-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const rangeText = btn.textContent;
        timeFilterBtn.innerHTML = `${rangeText} <span>⌄</span>`;
        filterDropdown.classList.remove('open');
        showToast(`Filtered dashboard view to: ${rangeText}`);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. Consumption Tab Interval Pills
  // --------------------------------------------------------------------------
  document.querySelectorAll('#tab-consumption .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-consumption .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`Consumption interval updated: ${btn.textContent}`);
    });
  });

  // --------------------------------------------------------------------------
  // 9. AI Insights Filter & Action Dispatches
  // --------------------------------------------------------------------------
  const insightCards = document.querySelectorAll('.insight-detail-card');
  const filterPills = document.querySelectorAll('#tab-insights .pill-btn');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-filter');

      insightCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Action dispatches for AI recommendations
  document.querySelectorAll('.action-apply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'precool') {
        btn.innerHTML = '✓ Applied';
        btn.style.background = '#54903f';
        btn.disabled = true;
        showToast('✓ Building A Pre-cooling schedule approved & active');
      } else if (action === 'ahu') {
        btn.innerHTML = '✓ Ticket #4821';
        btn.style.background = '#54903f';
        btn.disabled = true;
        const anomalyCountEl = document.getElementById('kpi-anomaly-count');
        const statusAnomalyCount = document.getElementById('status-anomaly-count');
        if (anomalyCountEl) anomalyCountEl.innerHTML = '0 <small>active</small>';
        if (statusAnomalyCount) statusAnomalyCount.textContent = '0';
        showToast('✓ Maintenance work order #4821 created for AHU-04');
      } else if (action === 'solar') {
        btn.innerHTML = '✓ Dispatched';
        btn.style.background = '#54903f';
        btn.disabled = true;
        showToast('✓ Campus EV fleet charging scheduled for peak solar window');
      } else if (action === 'baseload') {
        btn.innerHTML = '✓ Smart Sleep Active';
        btn.style.background = '#54903f';
        btn.disabled = true;
        showToast('✓ Smart Sleep policy applied to Building B (23:00–05:00)');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 10. AI Recommendation Review Dialog Modal
  // --------------------------------------------------------------------------
  const reviewDialog = document.getElementById('review-dialog');
  const closeReviewBtn = document.getElementById('close-review-dialog');
  const cancelReviewBtn = document.getElementById('btn-cancel-review');
  const approveReviewBtn = document.getElementById('btn-approve-review');
  const heroReviewBtn = document.getElementById('hero-review-btn');

  function openReviewDialog() {
    if (reviewDialog) reviewDialog.showModal();
  }

  document.querySelectorAll('.review-trigger-btn').forEach(btn => {
    btn.addEventListener('click', openReviewDialog);
  });

  if (closeReviewBtn) closeReviewBtn.addEventListener('click', () => reviewDialog.close());
  if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', () => reviewDialog.close());

  if (approveReviewBtn) {
    approveReviewBtn.addEventListener('click', () => {
      reviewDialog.close();
      const heroAction = document.getElementById('hero-ai-action');
      if (heroAction) {
        heroAction.style.background = '#f1f8ea';
        heroAction.style.borderLeftColor = '#54903f';
        if (heroReviewBtn) {
          heroReviewBtn.innerHTML = '✓ Active';
          heroReviewBtn.style.color = '#54903f';
          heroReviewBtn.disabled = true;
        }
      }
      const precoolBtn = document.querySelector('.action-apply-btn[data-action="precool"]');
      if (precoolBtn) {
        precoolBtn.innerHTML = '✓ Applied';
        precoolBtn.style.background = '#54903f';
        precoolBtn.disabled = true;
      }
      showToast('✓ Pre-cool schedule executed. Chiller setpoint adjusting to 20.5°C.');
    });
  }

  // --------------------------------------------------------------------------
  // 11. Equipment Tab Search, Filters & Diagnostics Modal
  // --------------------------------------------------------------------------
  const eqSearchInput = document.getElementById('equipment-search');
  const eqCards = document.querySelectorAll('.equipment-card');
  const eqFilterBtns = document.querySelectorAll('[data-eq-filter]');

  if (eqSearchInput) {
    eqSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      eqCards.forEach(card => {
        const text = (card.getAttribute('data-name') || card.textContent).toLowerCase();
        card.style.display = text.includes(term) ? 'flex' : 'none';
      });
    });
  }

  eqFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      eqFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-eq-filter');

      eqCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Diagnostics Dialog
  const diagDialog = document.getElementById('diagnostics-dialog');
  const closeDiagBtn = document.getElementById('close-diag-dialog');
  const btnCloseDiag = document.getElementById('btn-close-diag');
  const btnDiagAction = document.getElementById('btn-diag-action');
  const diagTitle = document.getElementById('diag-title');
  const diagSubtitle = document.getElementById('diag-subtitle');
  const diagConsole = document.getElementById('diag-console');

  document.querySelectorAll('[data-diag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const asset = btn.getAttribute('data-diag');
      if (diagTitle) diagTitle.textContent = asset;
      if (diagSubtitle) diagSubtitle.textContent = `Telemetry stream from ${asset}`;
      if (diagDialog) diagDialog.showModal();
    });
  });

  if (closeDiagBtn) closeDiagBtn.addEventListener('click', () => diagDialog.close());
  if (btnCloseDiag) btnCloseDiag.addEventListener('click', () => diagDialog.close());

  if (btnDiagAction) {
    btnDiagAction.addEventListener('click', () => {
      diagDialog.close();
      showToast('✓ Maintenance work order generated & queued in Facilities ERP');
    });
  }

  document.querySelectorAll('[data-ticket]').forEach(btn => {
    btn.addEventListener('click', () => {
      const asset = btn.getAttribute('data-ticket');
      btn.innerHTML = '✓ Ticket #4822';
      btn.disabled = true;
      showToast(`✓ Ticket created for ${asset}`);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Reports Tab: Genuine CSV Export & Print Summary
  // --------------------------------------------------------------------------
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnPrintReport = document.getElementById('btn-print-report');
  const templateCards = document.querySelectorAll('.template-card');
  const tableReportTitle = document.getElementById('table-report-title');

  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      templateCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const title = card.querySelector('h4').textContent;
      if (tableReportTitle) {
        tableReportTitle.textContent = `${title} — Northstar Campus`;
      }
      showToast(`Active statement preview: ${title}`);
    });
  });

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const csvContent = [
        ['Date', 'Facility', 'Peak Demand (kW)', 'Grid Energy (kWh)', 'Solar Generation (kWh)', 'Carbon Intensity (g/kWh)', 'Gross Cost (INR)', 'AI Savings (INR)', 'Status'],
        ['2026-04-16', 'Northstar Campus', '42.8', '441.0', '156.0', '218', '286.40', '84.20', 'Live'],
        ['2026-04-15', 'Northstar Campus', '56.1', '612.0', '148.0', '224', '4120.00', '92.40', 'Verified'],
        ['2026-04-14', 'Northstar Campus', '58.4', '638.0', '135.0', '231', '4285.00', '76.00', 'Verified'],
        ['2026-04-13', 'Northstar Campus', '41.2', '390.0', '168.0', '198', '2540.00', '110.50', 'Verified'],
        ['2026-04-12', 'Northstar Campus', '38.9', '345.0', '172.0', '192', '2280.00', '114.00', 'Verified'],
        ['2026-04-11', 'Northstar Campus', '57.3', '625.0', '142.0', '226', '4195.00', '88.50', 'Verified'],
        ['2026-04-10', 'Northstar Campus', '59.0', '644.0', '139.0', '229', '4310.00', '95.00', 'Verified'],
        ['2026-04-09', 'Northstar Campus', '58.1', '630.0', '145.0', '225', '4210.00', '89.00', 'Verified'],
        ['2026-04-08', 'Northstar Campus', '57.8', '622.0', '141.0', '227', '4180.00', '86.50', 'Verified'],
        ['2026-04-07', 'Northstar Campus', '56.9', '615.0', '150.0', '222', '4100.00', '91.20', 'Verified'],
        ['TOTAL/AVG', 'Northstar Campus', '59.0 Max', '18420.0', '4680.0', '216 Avg', '124500.00', '14250.00', 'Reconciled']
      ].map(e => e.map(item => `"${item}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'AstraGrid_Energy_Report_April_2026.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('✓ AstraGrid_Energy_Report_April_2026.csv generated & downloaded');
    });
  }

  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      window.print();
    });
  }

  // --------------------------------------------------------------------------
  // 13. Settings Tab Persistence
  // --------------------------------------------------------------------------
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const campusNameInput = document.getElementById('set-campus-name');
  const facilityTypeInput = document.getElementById('set-facility-type');
  const grossAreaInput = document.getElementById('set-gross-area');
  const operatingHoursInput = document.getElementById('set-operating-hours');
  const offPeakRateInput = document.getElementById('set-offpeak-rate');
  const peakRateInput = document.getElementById('set-peak-rate');
  const monthlyBudgetInput = document.getElementById('set-monthly-budget');
  const alertEmailInput = document.getElementById('set-alert-email');
  const togglePrecool = document.getElementById('toggle-precool');
  const toggleSolar = document.getElementById('toggle-solar');

  // Load saved settings if any
  const savedSettings = localStorage.getItem('astra-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (campusNameInput && parsed.campusName) campusNameInput.value = parsed.campusName;
      if (facilityTypeInput && parsed.facilityType) facilityTypeInput.value = parsed.facilityType;
      if (grossAreaInput && parsed.grossArea) grossAreaInput.value = parsed.grossArea;
      if (operatingHoursInput && parsed.operatingHours) operatingHoursInput.value = parsed.operatingHours;
      if (offPeakRateInput && parsed.offPeakRate) offPeakRateInput.value = parsed.offPeakRate;
      if (peakRateInput && parsed.peakRate) peakRateInput.value = parsed.peakRate;
      if (monthlyBudgetInput && parsed.monthlyBudget) monthlyBudgetInput.value = parsed.monthlyBudget;
      if (alertEmailInput && parsed.alertEmail) alertEmailInput.value = parsed.alertEmail;
      if (togglePrecool && typeof parsed.precool === 'boolean') togglePrecool.checked = parsed.precool;
      if (toggleSolar && typeof parsed.solar === 'boolean') toggleSolar.checked = parsed.solar;
    } catch (e) {
      console.warn('Error loading settings', e);
    }
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const config = {
        campusName: campusNameInput ? campusNameInput.value : 'Northstar Campus',
        facilityType: facilityTypeInput ? facilityTypeInput.value : '',
        grossArea: grossAreaInput ? grossAreaInput.value : '45000',
        operatingHours: operatingHoursInput ? operatingHoursInput.value : '',
        offPeakRate: offPeakRateInput ? offPeakRateInput.value : '6.50',
        peakRate: peakRateInput ? peakRateInput.value : '9.80',
        monthlyBudget: monthlyBudgetInput ? monthlyBudgetInput.value : '320000',
        alertEmail: alertEmailInput ? alertEmailInput.value : '',
        precool: togglePrecool ? togglePrecool.checked : true,
        solar: toggleSolar ? toggleSolar.checked : true,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('astra-settings', JSON.stringify(config));
      if (activeSiteDisplay && config.campusName) {
        activeSiteDisplay.textContent = config.campusName;
        siteLabels.forEach(lbl => lbl.textContent = config.campusName);
      }
      showToast('✓ Facility settings and tariff configuration saved');
    });
  }
});
