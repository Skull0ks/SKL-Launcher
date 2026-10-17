/* =============================================
   CS2 UPGRADER — Main Application JavaScript
   ============================================= */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    user: null,
    inventory: [],
    shopItems: [],
    selectedItems: [],   // items from inventory
    targetItem: null,     // single target from shop
    chance: 0,
    isUpgrading: false,
  };

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    // Auth
    btnLogin: $('#btn-login'),
    userInfo: $('#user-info'),
    userAvatar: $('#user-avatar'),
    userName: $('#user-name'),
    btnLogout: $('#btn-logout'),
    navBalance: $('#nav-balance'),
    balanceAmount: $('#balance-amount'),

    // Inventory
    inventoryGrid: $('#inventory-grid'),
    inventoryEmpty: $('#inventory-empty'),
    inventoryCount: $('#inventory-count'),
    inventorySearch: $('#inventory-search'),

    // Shop
    shopGrid: $('#shop-grid'),
    shopLoading: $('#shop-loading'),
    shopCount: $('#shop-count'),
    shopSearch: $('#shop-search'),

    // Selected
    selectedItemsList: $('#selected-items-list'),
    btnClearSelected: $('#btn-clear-selected'),
    selectedTotal: $('#selected-total'),
    totalValue: $('#total-value'),

    // Target
    targetItemDisplay: $('#target-item-display'),
    targetValueDisplay: $('#target-value-display'),
    targetValue: $('#target-value'),

    // Spinner
    chanceValue: $('#chance-value'),
    winArc: $('#win-arc'),
    loseArc: $('#lose-arc'),
    spinnerSvg: $('#spinner-svg'),
    spinnerContainer: $('#spinner-container'),
    spinnerNeedle: $('#spinner-needle'),

    // Upgrade
    btnUpgrade: $('#btn-upgrade'),

    // Result
    resultOverlay: $('#result-overlay'),
    resultContent: $('#result-content'),
    resultIcon: $('#result-icon'),
    resultTitle: $('#result-title'),
    resultMessage: $('#result-message'),
    resultItem: $('#result-item'),
    btnResultClose: $('#btn-result-close'),

    // Other
    toastContainer: $('#toast-container'),
    particleCanvas: $('#particle-canvas'),
  };

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---- API Helpers ----
  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  // ---- Auth ----
  async function checkAuth() {
    try {
      const data = await apiFetch('/api/user');
      state.user = data.user || data;
      updateAuthUI();
      await loadInventory();
    } catch {
      state.user = null;
      updateAuthUI();
    }
  }

  function updateAuthUI() {
    if (state.user) {
      dom.btnLogin.style.display = 'none';
      dom.userInfo.style.display = 'flex';
      dom.userAvatar.src = state.user.avatar || '';
      dom.userName.textContent = state.user.displayName || state.user.username || 'Player';
      dom.navBalance.style.display = 'flex';
      dom.inventoryEmpty.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading your inventory...</p>
      `;
    } else {
      dom.btnLogin.style.display = 'flex';
      dom.userInfo.style.display = 'none';
      dom.navBalance.style.display = 'none';
      dom.inventoryEmpty.innerHTML = `
        <div class="empty-icon">🔒</div>
        <p>Sign in with Steam to load your inventory</p>
      `;
    }
  }

  // ---- Inventory ----
  async function loadInventory() {
    if (!state.user) return;
    try {
      const data = await apiFetch('/api/inventory');
      state.inventory = data.items || data || [];
      renderInventory();
      updateBalanceDisplay();
    } catch {
      dom.inventoryEmpty.innerHTML = `
        <div class="empty-icon">⚠️</div>
        <p>Failed to load inventory</p>
      `;
    }
  }

  function updateBalanceDisplay() {
    const total = state.inventory.reduce((sum, item) => sum + (item.price || 0), 0);
    dom.balanceAmount.textContent = formatPrice(total);
  }

  function renderInventory(filter = '') {
    // Clear grid but keep placeholder
    dom.inventoryGrid.innerHTML = '';

    let items = state.inventory;
    if (filter) {
      const q = filter.toLowerCase();
      items = items.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.weapon || '').toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      dom.inventoryGrid.innerHTML = `
        <div class="panel-empty">
          <div class="empty-icon">📦</div>
          <p>${state.inventory.length === 0 ? 'Your inventory is empty' : 'No matching items'}</p>
        </div>
      `;
      dom.inventoryCount.textContent = '0 items';
      return;
    }

    dom.inventoryCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

    items.forEach((item) => {
      const card = createSkinCard(item, 'inventory');
      dom.inventoryGrid.appendChild(card);
    });
  }

  // ---- Shop ----
  async function loadShop() {
    try {
      const data = await apiFetch('/api/shop');
      state.shopItems = data.items || data || [];
      renderShop();
    } catch {
      dom.shopGrid.innerHTML = `
        <div class="panel-empty">
          <div class="empty-icon">⚠️</div>
          <p>Failed to load shop items</p>
        </div>
      `;
    }
  }

  function renderShop(filter = '', rarityFilter = 'all') {
    dom.shopGrid.innerHTML = '';

    let items = state.shopItems;
    if (filter) {
      const q = filter.toLowerCase();
      items = items.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(q) ||
          (i.weapon || '').toLowerCase().includes(q)
      );
    }
    if (rarityFilter !== 'all') {
      items = items.filter((i) => normalizeRarity(i.rarity) === rarityFilter);
    }

    if (items.length === 0) {
      dom.shopGrid.innerHTML = `
        <div class="panel-empty">
          <div class="empty-icon">🏪</div>
          <p>No items match your filters</p>
        </div>
      `;
      dom.shopCount.textContent = '0 items';
      return;
    }

    dom.shopCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

    items.forEach((item) => {
      const card = createSkinCard(item, 'shop');
      dom.shopGrid.appendChild(card);
    });
  }

  // ---- Skin Card Component ----
  function createSkinCard(item, type) {
    const card = document.createElement('div');
    const rarity = normalizeRarity(item.rarity);
    card.className = `skin-card rarity-${rarity}`;
    card.dataset.id = item.id || item.assetid || '';
    card.dataset.type = type;

    // Check if selected
    if (type === 'inventory' && state.selectedItems.find((s) => s.id === item.id)) {
      card.classList.add('selected');
    }
    if (type === 'shop' && state.targetItem && state.targetItem.id === item.id) {
      card.classList.add('selected');
    }

    const imgSrc = item.image || item.icon_url || generatePlaceholderSkin(item.name);

    card.innerHTML = `
      <img class="skin-card-img" src="${imgSrc}" alt="${item.name || 'Skin'}" loading="lazy"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 75%22><rect fill=%22%23111136%22 width=%22100%22 height=%2275%22 rx=%225%22/><text x=%2250%22 y=%2242%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%2210%22>No Image</text></svg>'">
      <div class="skin-card-name" title="${item.name || ''}">${item.name || 'Unknown Skin'}</div>
      <div class="skin-card-weapon">${item.weapon || ''}</div>
      <div class="skin-card-price">${formatPrice(item.price)}</div>
      ${item.wear ? `<div class="skin-card-wear">${item.wear}</div>` : ''}
    `;

    card.addEventListener('click', () => {
      if (state.isUpgrading) return;
      if (type === 'inventory') {
        toggleInventoryItem(item);
      } else {
        selectTargetItem(item);
      }
    });

    return card;
  }

  // ---- Item Selection Logic ----
  function toggleInventoryItem(item) {
    const idx = state.selectedItems.findIndex((s) => s.id === item.id);
    if (idx >= 0) {
      state.selectedItems.splice(idx, 1);
    } else {
      state.selectedItems.push(item);
    }
    updateSelectedUI();
    updateChance();
    refreshCardSelections('inventory');
  }

  function selectTargetItem(item) {
    if (state.targetItem && state.targetItem.id === item.id) {
      state.targetItem = null;
    } else {
      state.targetItem = item;
    }
    updateTargetUI();
    updateChance();
    refreshCardSelections('shop');
  }

  function clearSelectedItems() {
    state.selectedItems = [];
    updateSelectedUI();
    updateChance();
    refreshCardSelections('inventory');
  }

  function removeSelectedItem(item) {
    state.selectedItems = state.selectedItems.filter((s) => s.id !== item.id);
    updateSelectedUI();
    updateChance();
    refreshCardSelections('inventory');
  }

  function removeTarget() {
    state.targetItem = null;
    updateTargetUI();
    updateChance();
    refreshCardSelections('shop');
  }

  function refreshCardSelections(type) {
    const cards = dom[type === 'inventory' ? 'inventoryGrid' : 'shopGrid'].querySelectorAll('.skin-card');
    cards.forEach((card) => {
      const id = card.dataset.id;
      if (type === 'inventory') {
        card.classList.toggle('selected', !!state.selectedItems.find((s) => String(s.id) === id));
      } else {
        card.classList.toggle('selected', state.targetItem && String(state.targetItem.id) === id);
      }
    });
  }

  // ---- UI Updates ----
  function updateSelectedUI() {
    if (state.selectedItems.length === 0) {
      dom.selectedItemsList.innerHTML = `<div class="selected-empty"><p>Click items from your inventory to add them</p></div>`;
      dom.btnClearSelected.style.display = 'none';
      dom.selectedTotal.style.display = 'none';
    } else {
      dom.selectedItemsList.innerHTML = '';
      state.selectedItems.forEach((item) => {
        const chip = document.createElement('div');
        chip.className = 'selected-skin-chip';
        const imgSrc = item.image || item.icon_url || '';
        chip.innerHTML = `
          <img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">
          <span>${truncate(item.name, 18)}</span>
          <span class="chip-remove">×</span>
        `;
        chip.addEventListener('click', () => removeSelectedItem(item));
        dom.selectedItemsList.appendChild(chip);
      });
      dom.btnClearSelected.style.display = 'block';
      dom.selectedTotal.style.display = 'flex';
      const total = state.selectedItems.reduce((sum, i) => sum + (i.price || 0), 0);
      dom.totalValue.textContent = formatPrice(total);
    }
  }

  function updateTargetUI() {
    if (!state.targetItem) {
      dom.targetItemDisplay.innerHTML = `
        <div class="target-empty">
          <div class="target-empty-icon">🎯</div>
          <p>Select a target skin from the shop</p>
        </div>
      `;
      dom.targetValueDisplay.style.display = 'none';
    } else {
      const item = state.targetItem;
      const imgSrc = item.image || item.icon_url || '';
      dom.targetItemDisplay.innerHTML = `
        <div class="target-skin-card">
          <img src="${imgSrc}" alt="${item.name}" onerror="this.style.display='none'">
          <div class="target-skin-info">
            <div class="skin-name">${item.name}</div>
            <div class="skin-weapon">${item.weapon || ''}</div>
            <div class="skin-price">${formatPrice(item.price)}</div>
          </div>
          <button class="target-remove" id="btn-remove-target">×</button>
        </div>
      `;
      dom.targetValueDisplay.style.display = 'flex';
      dom.targetValue.textContent = formatPrice(item.price);

      // Bind remove button
      const btnRemove = document.getElementById('btn-remove-target');
      if (btnRemove) {
        btnRemove.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTarget();
        });
      }
    }
  }

  // ---- Chance Calculation ----
  function updateChance() {
    const inputValue = state.selectedItems.reduce((s, i) => s + (i.price || 0), 0);
    const targetValue = state.targetItem ? state.targetItem.price || 0 : 0;

    let chance = 0;
    if (targetValue > 0 && inputValue > 0) {
      // chance = (input / target) * 100, capped at 95%
      chance = Math.min((inputValue / targetValue) * 100, 95);
      chance = Math.max(chance, 0.5); // min 0.5%
    }

    state.chance = chance;
    animateChanceValue(chance);
    updateSpinnerArc(chance);
    updateUpgradeButton();
  }

  function animateChanceValue(targetChance) {
    const el = dom.chanceValue;
    const current = parseFloat(el.textContent) || 0;
    const diff = targetChance - current;
    const steps = 30;
    let step = 0;

    function tick() {
      step++;
      const progress = easeOutCubic(step / steps);
      const val = current + diff * progress;
      el.textContent = val.toFixed(2);

      // Color based on chance
      if (val >= 50) {
        el.style.background = `linear-gradient(135deg, #00ff88, #00d4ff)`;
      } else if (val >= 25) {
        el.style.background = `linear-gradient(135deg, #e4ae39, #ffcc00)`;
      } else {
        el.style.background = `linear-gradient(135deg, #ff4444, #ff6b35)`;
      }
      el.style.webkitBackgroundClip = 'text';
      el.style.backgroundClip = 'text';

      if (step < steps) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  function updateSpinnerArc(chance) {
    const circumference = 2 * Math.PI * 140; // ~879.6
    const winLength = (chance / 100) * circumference;
    const loseLength = circumference - winLength;

    dom.winArc.setAttribute('stroke-dasharray', `${winLength} ${circumference - winLength}`);
    dom.loseArc.setAttribute('stroke-dasharray', `${loseLength} ${circumference - loseLength}`);
    dom.loseArc.setAttribute('stroke-dashoffset', `-${winLength}`);
  }

  function updateUpgradeButton() {
    const canUpgrade =
      state.selectedItems.length > 0 &&
      state.targetItem !== null &&
      state.chance > 0 &&
      !state.isUpgrading;
    dom.btnUpgrade.disabled = !canUpgrade;
  }

  // ---- Upgrade Process ----
  async function performUpgrade() {
    if (state.isUpgrading) return;
    if (state.selectedItems.length === 0 || !state.targetItem) {
      showToast('Select items and a target skin first', 'warning');
      return;
    }

    state.isUpgrading = true;
    dom.btnUpgrade.classList.add('upgrading');
    dom.btnUpgrade.querySelector('.btn-upgrade-text').textContent = 'UPGRADING...';
    updateUpgradeButton();

    // Start spinner animation
    startSpinnerAnimation();

    try {
      // Send upgrade request
      const result = await apiFetch('/api/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          selectedItemIds: state.selectedItems.map((i) => i.id),
          targetItemId: state.targetItem.id,
        }),
      });

      // Wait for spinner animation to finish (~3.5s total)
      await delay(3500);

      // Stop spinner
      stopSpinnerAnimation(result.won);

      // Flash + shake
      await delay(300);

      if (result.won) {
        showWinResult(result);
      } else {
        showLoseResult(result);
      }
    } catch (err) {
      stopSpinnerAnimation(false);
      showToast('Upgrade failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      state.isUpgrading = false;
      dom.btnUpgrade.classList.remove('upgrading');
      dom.btnUpgrade.querySelector('.btn-upgrade-text').textContent = 'UPGRADE';
      updateUpgradeButton();
    }
  }

  // ---- Spinner Animation ----
  let spinnerAnimFrame = null;
  let spinnerAngle = 0;

  function startSpinnerAnimation() {
    spinnerAngle = 0;
    let speed = 0;
    const maxSpeed = 15;
    const accelDuration = 800; // ms to reach full speed
    const startTime = Date.now();

    function animateSpinner() {
      const elapsed = Date.now() - startTime;

      // Accelerate
      if (elapsed < accelDuration) {
        speed = (elapsed / accelDuration) * maxSpeed;
      } else {
        speed = maxSpeed;
      }

      spinnerAngle = (spinnerAngle + speed) % 360;
      dom.spinnerSvg.style.transform = `rotate(${spinnerAngle}deg)`;

      spinnerAnimFrame = requestAnimationFrame(animateSpinner);
    }

    spinnerAnimFrame = requestAnimationFrame(animateSpinner);
  }

  function stopSpinnerAnimation(won) {
    if (spinnerAnimFrame) {
      cancelAnimationFrame(spinnerAnimFrame);
      spinnerAnimFrame = null;
    }

    // Decelerate smoothly to a final position
    const winAngle = state.chance * 3.6; // chance% of 360deg in win sector
    // If won, land in win sector (0 to winAngle), else in lose sector
    let targetAngle;
    if (won) {
      targetAngle = Math.random() * winAngle * 0.8 + winAngle * 0.1; // middle of win
    } else {
      const loseStart = winAngle;
      const loseRange = 360 - winAngle;
      targetAngle = loseStart + Math.random() * loseRange * 0.8 + loseRange * 0.1;
    }

    // Add extra rotations for effect
    const finalAngle = spinnerAngle + 720 + (targetAngle - (spinnerAngle % 360) + 360) % 360;

    // Animate deceleration
    const startAngle = spinnerAngle;
    const duration = 2000;
    const startTime = Date.now();

    function decel() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const currentAngle = startAngle + (finalAngle - startAngle) * eased;
      dom.spinnerSvg.style.transform = `rotate(${currentAngle}deg)`;

      if (progress < 1) {
        requestAnimationFrame(decel);
      }
    }

    requestAnimationFrame(decel);
  }

  // ---- Win / Lose Results ----
  function showWinResult(result) {
    document.body.classList.add('screen-flash-green');
    setTimeout(() => document.body.classList.remove('screen-flash-green'), 600);

    // Confetti!
    spawnConfetti();

    dom.resultContent.className = 'result-content result-win';
    dom.resultIcon.textContent = '🎉';
    dom.resultTitle.textContent = 'UPGRADE WON!';
    dom.resultMessage.textContent = 'Congratulations! You won the upgrade!';

    if (result.wonItem) {
      const imgSrc = result.wonItem.image || result.wonItem.icon_url || '';
      dom.resultItem.style.display = 'flex';
      dom.resultItem.innerHTML = `
        <img src="${imgSrc}" alt="${result.wonItem.name}" onerror="this.style.display='none'">
        <div class="result-item-info">
          <div class="ri-name">${result.wonItem.name || state.targetItem.name}</div>
          <div class="ri-price">${formatPrice(result.wonItem.price || state.targetItem.price)}</div>
        </div>
      `;
    } else {
      dom.resultItem.style.display = 'flex';
      dom.resultItem.innerHTML = `
        <div class="result-item-info">
          <div class="ri-name">${state.targetItem.name}</div>
          <div class="ri-price">${formatPrice(state.targetItem.price)}</div>
        </div>
      `;
    }

    dom.resultOverlay.style.display = 'flex';

    // Clear selections after win
    state.selectedItems = [];
    state.targetItem = null;
    updateSelectedUI();
    updateTargetUI();
    updateChance();
    refreshCardSelections('inventory');
    refreshCardSelections('shop');
    loadInventory(); // Refresh inventory
  }

  function showLoseResult(result) {
    document.body.classList.add('screen-shake', 'screen-flash-red');
    setTimeout(() => {
      document.body.classList.remove('screen-shake', 'screen-flash-red');
    }, 600);

    dom.resultContent.className = 'result-content result-lose';
    dom.resultIcon.textContent = '💀';
    dom.resultTitle.textContent = 'UPGRADE LOST';
    dom.resultMessage.textContent = 'Your items have been lost. Better luck next time!';
    dom.resultItem.style.display = 'none';

    dom.resultOverlay.style.display = 'flex';

    // Clear selections
    state.selectedItems = [];
    updateSelectedUI();
    updateChance();
    refreshCardSelections('inventory');
    loadInventory(); // Refresh inventory
  }

  function closeResult() {
    dom.resultOverlay.style.display = 'none';
  }

  // ---- Confetti Effect ----
  function spawnConfetti() {
    const colors = ['#00ff88', '#8847ff', '#d32ce6', '#00d4ff', '#e4ae39', '#ff4444', '#4b69ff', '#ffcc00'];
    const shapes = ['circle', 'square'];

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '-10px';
      piece.style.background = color;
      piece.style.borderRadius = shape === 'circle' ? '50%' : '2px';
      piece.style.width = (Math.random() * 8 + 4) + 'px';
      piece.style.height = (Math.random() * 8 + 4) + 'px';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';

      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }
  }

  // ---- Particle Canvas (ambient background particles) ----
  function initParticleCanvas() {
    const canvas = dom.particleCanvas;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const maxParticles = 30;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
        color: ['136,71,255', '0,212,255', '211,44,230'][Math.floor(Math.random() * 3)],
      };
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ---- Utility Functions ----
  function formatPrice(price) {
    if (price == null) return '$0.00';
    return '$' + parseFloat(price).toFixed(2);
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function normalizeRarity(rarity) {
    if (!rarity) return 'consumer';
    return rarity
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace('mil_spec', 'mil-spec')
      .replace('milspec', 'mil-spec')
      .replace('mil spec', 'mil-spec');
  }

  function generatePlaceholderSkin(name) {
    const text = encodeURIComponent((name || '?').substring(0, 2).toUpperCase());
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 75'><rect fill='%23111136' width='100' height='75' rx='5'/><text x='50' y='42' text-anchor='middle' fill='%23555577' font-size='14' font-family='Arial'>${text}</text></svg>`;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // ---- Event Listeners ----
  function setupEventListeners() {
    // Upgrade button
    dom.btnUpgrade.addEventListener('click', performUpgrade);

    // Clear selected
    dom.btnClearSelected.addEventListener('click', clearSelectedItems);

    // Close result
    dom.btnResultClose.addEventListener('click', closeResult);

    // Inventory search
    dom.inventorySearch.addEventListener('input', (e) => {
      renderInventory(e.target.value);
    });

    // Shop search
    dom.shopSearch.addEventListener('input', (e) => {
      const rarityFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      renderShop(e.target.value, rarityFilter);
    });

    // Shop filters
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const searchVal = dom.shopSearch.value;
        renderShop(searchVal, btn.dataset.filter);
      });
    });

    // Close result overlay on outside click
    dom.resultOverlay.addEventListener('click', (e) => {
      if (e.target === dom.resultOverlay) {
        closeResult();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeResult();
      }
    });
  }

  // ---- Initialize ----
  function init() {
    setupEventListeners();
    initParticleCanvas();
    checkAuth();
    loadShop();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
