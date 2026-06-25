/* ═══════════════════════════════════════════════════════════
   FINVEST AI — market.js
   Market page: stock logos, B/S buttons, price simulation
   Holdings management with persistence
═══════════════════════════════════════════════════════════ */

'use strict';

window.prices  = {};
window.idxP    = {};
window.tabSec  = 'All';
window.curPage = 'dashboard';

// ─── HELPERS ─────────────────────────────────────────────
function rw(p) { return +(p + p * (Math.random() * .006 - .003)).toFixed(2); }
function fINR(n) {
  var m = window.MKT || MARKETS[currentMarket];
  // Sub-unit crypto prices need decimals; everything else rounds.
  var abs = Math.abs(n);
  if (abs > 0 && abs < 1) return m.cur + (+n).toLocaleString(m.locale, { maximumFractionDigits: 6 });
  if (abs < 100 && abs % 1 !== 0) return m.cur + (+n).toLocaleString(m.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return m.cur + Math.round(n).toLocaleString(m.locale);
}

// ─── STOCK LOGO ───────────────────────────────────────────
function mkLogo(sym, sz) {
  sz = sz || 34;
  var s = ST.find(function(x) { return x.s === sym; });
  var w = document.createElement('div');
  w.style.cssText = [
    'width:' + sz + 'px',
    'height:' + sz + 'px',
    'border-radius:8px',
    'flex-shrink:0',
    'background:' + (s ? s.c : '#333'),
    'position:relative',
    'overflow:hidden',
    'display:flex',
    'align-items:center',
    'justify-content:center',
  ].join(';');

  var fb = document.createElement('div');
  fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:9px;font-family:Inter,sans-serif;color:#fff;';
  fb.textContent = sym.slice(0, 4);
  w.appendChild(fb);

  if (s && s.d) {
    var img = document.createElement('img');
    img.src = 'https://logo.clearbit.com/' + s.d;
    img.alt = sym;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:3px;background:#fff;border-radius:8px;';
    img.onload  = function() { fb.style.display = 'none'; };
    img.onerror = function() { img.remove(); fb.style.display = 'flex'; };
    w.appendChild(img);
  }
  return w;
}

function mkHCell(sym, name, qty) {
  var w = document.createElement('div');
  w.className = 'hstk';
  w.appendChild(mkLogo(sym, 34));
  var i = document.createElement('div');
  i.innerHTML = '<div class="hnm">' + sym + '</div><div class="hqty">' + name + ' &middot; ' + qty + '</div>';
  w.appendChild(i);
  return w;
}

// ─── PORTFOLIO CALCULATIONS ──────────────────────────────
function calcPortfolio() {
  var totalValue = 0;
  var totalInvested = 0;
  var sectorAlloc = {};

  HOLDS.forEach(function(h) {
    var p = prices[h.sym] || ST.find(function(s) { return s.s === h.sym; }).p;
    var val = h.qty * p;
    var inv = h.qty * h.avgPrice;
    totalValue += val;
    totalInvested += inv;

    var stk = ST.find(function(s) { return s.s === h.sym; });
    var sec = stk ? stk.sec : 'Other';
    sectorAlloc[sec] = (sectorAlloc[sec] || 0) + val;
  });

  return {
    totalValue: totalValue,
    totalInvested: totalInvested,
    totalGain: totalValue - totalInvested,
    gainPct: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested * 100) : 0,
    sectorAlloc: sectorAlloc,
    stockCount: HOLDS.length,
    sectorCount: Object.keys(sectorAlloc).length
  };
}

// ─── HOLDINGS INIT ────────────────────────────────────────
function initHoldings() {
  renderHoldingsTable();
  updateDashboardStats();
}

function renderHoldingsTable() {
  var container = document.getElementById('holdingsBody');
  if (!container) return;
  container.innerHTML = '';

  if (HOLDS.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:28px;color:var(--mu);grid-column:1/-1;">No holdings yet. Go to Market to buy stocks!</div>';
    return;
  }

  HOLDS.forEach(function(h, i) {
    var stk = ST.find(function(s) { return s.s === h.sym; });
    var p = prices[h.sym] || (stk ? stk.p : 0);
    var val = h.qty * p;
    var inv = h.qty * h.avgPrice;
    var pnl = val - inv;
    var pnlPct = inv > 0 ? (pnl / inv * 100) : 0;
    var pos = pnl >= 0;

    var row = document.createElement('div');
    row.className = 'hr';
    row.innerHTML = '';

    var cell1 = document.createElement('div');
    cell1.className = 'hstk';
    cell1.appendChild(mkLogo(h.sym, 34));
    var info = document.createElement('div');
    info.innerHTML = '<div class="hnm">' + h.sym + '</div><div class="hqty">' + h.name + ' &middot; ' + h.qty + ' shares</div>';
    cell1.appendChild(info);

    var cell2 = document.createElement('div');
    cell2.className = 'hval';
    cell2.id = 'hp' + i;
    cell2.textContent = fINR(p);

    var cell3 = document.createElement('div');
    cell3.className = 'hval';
    cell3.textContent = fINR(val);

    var cell4 = document.createElement('div');
    cell4.className = 'hval ' + (pos ? 'pos' : 'neg');
    cell4.textContent = (pos ? '+' : '') + pnlPct.toFixed(1) + '%';

    row.appendChild(cell1);
    row.appendChild(cell2);
    row.appendChild(cell3);
    row.appendChild(cell4);
    container.appendChild(row);
  });
}

function updateDashboardStats() {
  var port = calcPortfolio();
  var pos = port.totalGain >= 0;

  var bal = document.getElementById('dashBal');
  if (bal) bal.textContent = fINR(port.totalValue);

  var chg = document.getElementById('dashChg');
  if (chg) {
    chg.className = 'h-chg ' + (pos ? '' : 'neg-chg');
    chg.innerHTML = (pos ? '&#8593; +' : '&#8595; ') + fINR(Math.abs(port.totalGain)) + ' (' + Math.abs(port.gainPct).toFixed(2) + '%) all-time';
  }

  var inv = document.getElementById('dashInvested');
  if (inv) inv.textContent = fINR(port.totalInvested);

  var invSub = document.getElementById('dashInvSub');
  if (invSub) invSub.textContent = 'Across ' + port.stockCount + ' stocks';

  var gain = document.getElementById('dashGain');
  if (gain) {
    gain.textContent = (pos ? '+' : '') + fINR(port.totalGain);
    gain.className = 'ds-val ' + (pos ? 'pos' : 'neg');
  }

  var gainSub = document.getElementById('dashGainSub');
  if (gainSub) {
    gainSub.textContent = (pos ? '+' : '') + port.gainPct.toFixed(2) + '% all-time';
    gainSub.className = 'ds-sub ' + (pos ? 'pos' : 'neg');
  }

  // Render sector chart
  renderSectorChart(port.sectorAlloc, port.totalValue);

  // Render recent activity
  renderRecentActivity();

  // "Your investments" sidebar card
  if (typeof renderInvestCard === 'function') renderInvestCard();

  // Keep the AI health score + quick-ask chip in sync with the live portfolio
  if (typeof updateHealthScore === 'function') updateHealthScore();
  if (typeof refreshAIChips === 'function') refreshAIChips();
}

// ─── SECTOR CHART (Canvas) ──────────────────────────────
function renderSectorChart(alloc, total) {
  var canvas = document.getElementById('sectorCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width = canvas.offsetWidth * 2;
  var h = canvas.height = canvas.offsetHeight * 2;
  ctx.clearRect(0, 0, w, h);

  var cx = w * 0.35, cy = h / 2, r = Math.min(cx, cy) - 20;
  // Canvas hidden (e.g. dashboard not visible) → no size, skip to avoid negative radius
  if (r <= 0 || w === 0) return;
  var colors = {
    // India sectors
    IT: '#2fe3a4', Banking: '#5cf0b8', Energy: '#1f9d72', Auto: '#4fd6c4', FMCG: '#7ef0c4', Pharma: '#13b886', Metals: '#0f9d6e', Infra: '#36c9a0', Telecom: '#65e0b0', Chemicals: '#1abc9c', Realty: '#2bbd92', Insurance: '#88f0cc', Consumer: '#3fd1aa', Logistics: '#0e8a63',
    // US sectors
    Technology: '#2fe3a4', Automotive: '#4fd6c4', Financials: '#5cf0b8', Media: '#13b886',
    // Crypto sectors
    'Layer 1': '#2fe3a4', DeFi: '#4fd6c4', Meme: '#7ef0c4', Payments: '#36c9a0', Stable: '#88f0cc'
  };
  var sectors = Object.keys(alloc);
  if (sectors.length === 0) return;

  var angle = -Math.PI / 2;
  sectors.forEach(function(sec) {
    var pct = alloc[sec] / total;
    var sweep = pct * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = colors[sec] || '#666';
    ctx.fill();
    angle += sweep;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = document.documentElement.classList.contains('light') ? '#f3f7f4' : '#0c1814';
  ctx.fill();

  // Center text
  ctx.fillStyle = document.documentElement.classList.contains('light') ? '#122019' : '#eafff6';
  ctx.font = '800 ' + (r * 0.22) + 'px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sectors.length + ' Sectors', cx, cy - 5);
  ctx.font = (r * 0.15) + 'px Inter, sans-serif';
  ctx.fillStyle = '#7f9a90';
  ctx.fillText(HOLDS.length + ' Stocks', cx, cy + r * 0.2);

  // Legend
  var legendEl = document.getElementById('sectorLegend');
  if (legendEl) {
    legendEl.innerHTML = sectors.map(function(sec) {
      var pct = (alloc[sec] / total * 100).toFixed(1);
      return '<div class="slg-item"><div class="slg-dot" style="background:' + (colors[sec] || '#666') + '"></div><span class="slg-name">' + sec + '</span><span class="slg-pct">' + pct + '%</span></div>';
    }).join('');
  }
}

// ─── RECENT ACTIVITY ────────────────────────────────────
function renderRecentActivity() {
  var el = document.getElementById('activityList');
  if (!el) return;

  var items = tradeHistory.slice(-5).reverse();
  if (items.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--mu);font-size:12px">No trades yet. Start trading in the Market!</div>';
    return;
  }

  el.innerHTML = items.map(function(t) {
    var isBuy = t.type === 'buy';
    var icon = isBuy ? '&#128994;' : '&#128308;';
    var label = isBuy ? 'Bought' : 'Sold';
    var timeAgo = getTimeAgo(t.time);
    return '<div class="act-item">'
      + '<div class="act-icon" style="color:' + (isBuy ? 'var(--gr)' : 'var(--rd)') + '">' + icon + '</div>'
      + '<div class="act-info"><div class="act-title">' + label + ' ' + t.qty + ' ' + t.sym + '</div><div class="act-sub">' + fINR(t.total) + ' &middot; ' + timeAgo + '</div></div>'
      + '</div>';
  }).join('');
}

function getTimeAgo(ts) {
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  var days = Math.floor(hrs / 24);
  return days + 'd ago';
}

// ─── INDEX STRIP ─────────────────────────────────────────
function renderIdx() {
  var el = document.getElementById('ixstrip');
  if (!el) return;
  el.innerHTML = IDX.map(function(x) {
    var v = idxP[x.n] || x.b, ch = ((v - x.b) / x.b * 100).toFixed(2), pos = ch >= 0;
    return '<div class="ixchip">'
      + '<div class="ixnm">' + x.n + '</div>'
      + '<div class="ixv" style="color:' + (pos ? 'var(--gr)' : 'var(--rd)') + '">'
      + v.toLocaleString(MKT.locale, { maximumFractionDigits: 0 }) + '</div>'
      + '<div class="ixc ' + (pos ? 'pos' : 'neg') + '">' + (pos ? '&#9650;' : '&#9660;') + ' ' + Math.abs(ch) + '%</div>'
      + '</div>';
  }).join('');
}

// ─── MARKET SWITCHING ────────────────────────────────────
// Renders the category filter chips for the active market.
function renderMarketTabs() {
  var el = document.getElementById('mtabs');
  if (!el) return;
  el.innerHTML = MKT.cats.map(function(c) {
    var on = (c === tabSec) || (tabSec === 'All' && c === 'All');
    return '<button class="mtab' + (on ? ' on' : '') + '" onclick="setTab(\'' + c + '\',this)">' + c + '</button>';
  }).join('');
}

// Renders the top market selector (US / India / Crypto).
function renderMarketSelector() {
  var el = document.getElementById('mktSel');
  if (!el) return;
  el.innerHTML = Object.keys(MARKETS).map(function(id) {
    var m = MARKETS[id];
    var on = id === currentMarket;
    var name = id === 'IN' ? 'India' : (id === 'US' ? 'US Markets' : 'Crypto');
    return '<button class="mksel-btn' + (on ? ' on' : '') + '" onclick="setMarket(\'' + id + '\')">' + m.flag + ' ' + name + '</button>';
  }).join('');
}

// Switches the active market: swaps data, portfolio, currency, re-renders.
function setMarket(mk) {
  if (!MARKETS[mk] || mk === currentMarket) {
    if (mk === currentMarket) return;
  }
  if (!MARKETS[mk]) return;
  currentMarket = mk;
  Store.set('market', mk);
  applyMarket();
  // Seed live prices from base prices of the new market
  ST.forEach(function(s) { prices[s.s] = s.p; });
  IDX.forEach(function(x) { idxP[x.n] = x.b; });
  tabSec = 'All';
  // Re-render everything market-dependent
  renderMarketSelector();
  renderMarketTabs();
  renderIdx();
  renderMkt(document.getElementById('mktQ') ? document.getElementById('mktQ').value : '');
  renderHoldingsTable();
  updateDashboardStats();
  if (typeof renderWallet === 'function') renderWallet();
  if (typeof renderRecentActivity === 'function') renderRecentActivity();
  if (typeof termOnMarketChange === 'function') termOnMarketChange();
  if (typeof refreshQuotes === 'function') refreshQuotes();
  if (typeof calcSIP === 'function') calcSIP();
  if (typeof calcLumpsum === 'function') calcLumpsum();
  if (typeof updateHealthScore === 'function') updateHealthScore();
  if (typeof refreshAIChips === 'function') refreshAIChips();
  if (typeof renderNews === 'function') renderNews();
  syncMarketUI();
  showToast(MKT.flag + ' Switched to ' + (mk === 'IN' ? 'India' : mk === 'US' ? 'US' : 'Crypto') + ' market');
}

// Reflects the active market across nav + dashboard labels.
function syncMarketUI() {
  document.querySelectorAll('.seg-btn').forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('data-mk') === currentMarket);
  });
  var lbl = document.querySelector('#page-dashboard .h-lbl');
  if (lbl) lbl.textContent = 'Total Net Worth (' + MKT.label + ')';
}

// ─── MARKET GRID ─────────────────────────────────────────
function renderMkt(q) {
  q = (q || '').toLowerCase();
  var grid = document.getElementById('mgrid');
  if (!grid) return;

  var list = ST.filter(function(s) {
    if (tabSec !== 'All' && s.sec !== tabSec) return false;
    if (q && !s.s.toLowerCase().includes(q)
          && !s.n.toLowerCase().includes(q)
          && !s.sec.toLowerCase().includes(q)) return false;
    return true;
  });

  if (!list.length) {
    grid.innerHTML = '<div style="color:var(--mu);padding:28px;text-align:center;grid-column:1/-1">No stocks found</div>';
    return;
  }

  grid.innerHTML = '';
  list.forEach(function(s) {
    var p   = prices[s.s] || s.p;
    var ch  = +((p - s.p) / s.p * 100).toFixed(2);
    var pos = ch >= 0;
    var inWL = watchlist.indexOf(s.s) !== -1;

    var card = document.createElement('div');
    card.className = 'scard';
    (function(sym) {
      card.onclick = function() { openStockDetail(sym); };
    })(s.s);

    var left = document.createElement('div');
    left.className = 'scl';
    left.appendChild(mkLogo(s.s, 36));
    var info = document.createElement('div');
    info.innerHTML = '<div class="scnm">' + s.s + (inWL ? ' <span style="color:var(--gd);font-size:10px">&#9733;</span>' : '') + '</div><div class="scsec">' + s.n + '</div>';
    left.appendChild(info);
    card.appendChild(left);

    var mid = document.createElement('div');
    mid.className = 'scm';
    mid.innerHTML = '<div class="scp">' + fINR(p) + '</div>'
      + '<div class="scc ' + (pos ? 'pos' : 'neg') + '">'
      + (pos ? '&#9650;' : '&#9660;') + ' ' + Math.abs(ch) + '%</div>';
    card.appendChild(mid);

    var btns = document.createElement('div');
    btns.className = 'scbtns';

    var bb = document.createElement('button');
    bb.className = 'btnb';
    bb.textContent = 'B';
    bb.title = 'Buy ' + s.s;
    (function(sym) {
      bb.onclick = function(e) { e.stopPropagation(); openBS(sym, 'buy'); };
    })(s.s);

    var sb = document.createElement('button');
    sb.className = 'btns';
    sb.textContent = 'S';
    sb.title = 'Sell ' + s.s;
    (function(sym) {
      sb.onclick = function(e) { e.stopPropagation(); openBS(sym, 'sell'); };
    })(s.s);

    btns.appendChild(bb);
    btns.appendChild(sb);
    card.appendChild(btns);
    grid.appendChild(card);
  });
}

function setTab(sec, btn) {
  tabSec = sec;
  document.querySelectorAll('.mtab').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderMkt(document.getElementById('mktQ').value || '');
}

function clearMkt() {
  document.getElementById('mktQ').value = '';
  document.getElementById('mktClr').style.display = 'none';
  if (typeof renderWatch === 'function') renderWatch('');
}

// ─── PRICE SIMULATION ────────────────────────────────────
function tickPrices() {
  ST.forEach(function(s) { prices[s.s] = rw(prices[s.s]); });
  IDX.forEach(function(x) { idxP[x.n] = rw(idxP[x.n]); });

  if (curPage === 'market') {
    renderIdx();
    renderMkt(document.getElementById('mktQ').value || '');
  }

  // Update dashboard dynamically
  if (curPage === 'dashboard') {
    renderHoldingsTable();
    updateDashboardStats();
  }

  // Update stock detail modal if open
  updateSDLive();
}

// ─── LIVE UPDATE STOCK DETAIL ────────────────────────────
function updateSDLive() {
  if (!sdCurrentSym) return;
  var sdov = document.getElementById('sdov');
  if (!sdov || !sdov.classList.contains('on')) return;

  var sym = sdCurrentSym;
  var s = ST.find(function(x) { return x.s === sym; });
  if (!s) return;
  var p = prices[sym] || s.p;
  var ch = +((p - s.p) / s.p * 100).toFixed(2);
  var pos = ch >= 0;

  // Update prices
  var topPrice = document.getElementById('sdTopPrice');
  if (topPrice) topPrice.textContent = fINR(p);
  var sdPrice = document.getElementById('sdPrice');
  if (sdPrice) sdPrice.textContent = fINR(p);
  var chEl = document.getElementById('sdChange');
  if (chEl) {
    chEl.textContent = (pos ? '\u25B2 +' : '\u25BC ') + Math.abs(ch) + '% today';
    chEl.className = 'sd-change ' + (pos ? 'sd-up' : 'sd-down');
  }

  // Update stats (Day High/Low move with price)
  var stats = getStockStats(sym, p, s);
  var dhEl = document.getElementById('sdDayHigh');
  var dlEl = document.getElementById('sdDayLow');
  if (dhEl) dhEl.textContent = fINR(stats.dayHigh);
  if (dlEl) dlEl.textContent = fINR(stats.dayLow);

  // Update order card price
  var orderPrice = document.getElementById('sdOrderPrice');
  if (orderPrice) orderPrice.textContent = fINR(p);

  // Update order total
  var qty = parseInt(document.getElementById('sdOrderQty').value) || 0;
  var orderTotal = document.getElementById('sdOrderTotal');
  if (orderTotal) orderTotal.textContent = fINR(qty * p);

  // Update holdings info
  var hold = HOLDS.find(function(h) { return h.sym === sym; });
  var holdInfo = document.getElementById('sdHoldInfo');
  if (holdInfo && hold) {
    var holdVal = hold.qty * p;
    var pnl = (p - hold.avgPrice) * hold.qty;
    holdInfo.innerHTML = '<div class="sd-hold-title">Your Holdings</div>'
      + '<div class="sd-hold-row"><span>Shares</span><span>' + hold.qty + '</span></div>'
      + '<div class="sd-hold-row"><span>Avg Price</span><span>' + fINR(hold.avgPrice) + '</span></div>'
      + '<div class="sd-hold-row"><span>Current Value</span><span>' + fINR(holdVal) + '</span></div>'
      + '<div class="sd-hold-row"><span>P&L</span><span class="' + (pnl >= 0 ? 'pos' : 'neg') + '">' + (pnl >= 0 ? '+' : '') + fINR(pnl) + '</span></div>';
  }
}

// ─── BUY / SELL MODAL ────────────────────────────────────
var BSC = { sym: '', type: '', price: 0 };

function openBS(sym, type) {
  if (!userProfile) {
    showProfilePrompt();
    return;
  }

  var s = ST.find(function(x) { return x.s === sym; });
  if (!s) return;

  BSC = { sym: sym, type: type, price: prices[sym] || s.p };

  document.getElementById('bssym').textContent   = sym;
  document.getElementById('bsnm').textContent    = s.n + ' \u00B7 ' + s.sec;
  document.getElementById('bsprice').textContent = fINR(BSC.price);

  var isBuy = type === 'buy';
  document.getElementById('bstype').innerHTML    = isBuy ? '&#128994; BUY ORDER' : '&#128308; SELL ORDER';
  document.getElementById('bstype').style.color  = isBuy ? 'var(--gr)' : 'var(--rd)';

  // Show current holding info for sell
  if (!isBuy) {
    var hold = HOLDS.find(function(h) { return h.sym === sym; });
    if (hold) {
      document.getElementById('bstype').innerHTML += ' <span style="font-size:10px;opacity:.7">(You own ' + hold.qty + ')</span>';
    }
  }

  var ok = document.getElementById('bsok');
  ok.textContent = isBuy ? 'Confirm Buy' : 'Confirm Sell';
  ok.style.background = isBuy
    ? 'linear-gradient(135deg,var(--gr),#00a87a)'
    : 'linear-gradient(135deg,var(--rd),#c41b3a)';
  ok.style.color = isBuy ? '#060912' : '#fff';

  var lw = document.getElementById('bslogo');
  lw.innerHTML = '';
  lw.style.cssText = 'width:44px;height:44px;border-radius:10px;flex-shrink:0;background:' + s.c + ';position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;';
  var fb2 = document.createElement('div');
  fb2.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;font-family:Syne,sans-serif;color:#fff;';
  fb2.textContent = sym.slice(0, 4);
  lw.appendChild(fb2);
  if (s.d) {
    var img2 = document.createElement('img');
    img2.src = 'https://logo.clearbit.com/' + s.d;
    img2.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:4px;background:#fff;border-radius:10px;z-index:1;';
    img2.onload  = function() { fb2.style.display = 'none'; };
    img2.onerror = function() { img2.remove(); fb2.style.display = 'flex'; };
    lw.appendChild(img2);
  }

  document.getElementById('bsqty').value = '1';
  updBS();

  // Show wallet balance
  var bsbal = document.getElementById('bsWalBal');
  if (bsbal) bsbal.textContent = 'Balance: ' + fINR(wallet.balance);

  document.getElementById('bsov').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function updBS() {
  var q = parseInt(document.getElementById('bsqty').value) || 0;
  document.getElementById('bstotal').textContent = fINR(q * BSC.price);
}

function confirmBS() {
  var q = parseInt(document.getElementById('bsqty').value) || 0;
  if (q < 1) { showToast('Enter at least 1 share'); return; }

  var isBuy = BSC.type === 'buy';
  var total = q * BSC.price;

  if (isBuy) {
    // Check wallet balance
    if (total > wallet.balance) {
      showToast('Insufficient balance! You have ' + fINR(wallet.balance));
      return;
    }
    // Deduct from wallet
    walletTrade('buy', BSC.sym, Math.round(total));

    // Add to holdings
    var existing = HOLDS.find(function(h) { return h.sym === BSC.sym; });
    if (existing) {
      var oldTotal = existing.qty * existing.avgPrice;
      var newTotal = q * BSC.price;
      existing.avgPrice = Math.round((oldTotal + newTotal) / (existing.qty + q));
      existing.qty += q;
    } else {
      var stk = ST.find(function(s) { return s.s === BSC.sym; });
      HOLDS.push({
        sym: BSC.sym,
        name: stk ? stk.n : BSC.sym,
        qty: q,
        avgPrice: Math.round(BSC.price)
      });
    }
  } else {
    // Remove from holdings
    var hold = HOLDS.find(function(h) { return h.sym === BSC.sym; });
    if (hold) {
      if (q > hold.qty) {
        showToast('You only own ' + hold.qty + ' shares of ' + BSC.sym);
        return;
      }
      // Add to wallet
      walletTrade('sell', BSC.sym, Math.round(total));

      hold.qty -= q;
      if (hold.qty <= 0) {
        HOLDS = HOLDS.filter(function(h) { return h.sym !== BSC.sym; });
        window.HOLDS = HOLDS;
      }
    } else {
      showToast('You don\'t own any ' + BSC.sym + ' shares');
      return;
    }
  }

  // Save holdings (per active market)
  Store.set('holds_' + currentMarket, HOLDS);

  // Record trade
  tradeHistory.push({
    sym: BSC.sym,
    type: BSC.type,
    qty: q,
    price: Math.round(BSC.price),
    total: Math.round(total),
    time: Date.now()
  });
  Store.set('trades', tradeHistory);

  showToast((isBuy ? '\uD83D\uDFE2 Bought ' : '\uD83D\uDD34 Sold ') + q + ' ' + BSC.sym + ' for ' + fINR(total));
  addXP(10, '\u26A1 +10 XP for ' + (isBuy ? 'buying' : 'selling') + '!');

  // Refresh dashboard
  renderHoldingsTable();
  updateDashboardStats();

  closeBSModal();
}

function closeBSModal() {
  document.getElementById('bsov').classList.remove('on');
  document.body.style.overflow = '';
}

// ─── WATCHLIST ──────────────────────────────────────────
function toggleWatchlist(sym) {
  var idx = watchlist.indexOf(sym);
  if (idx !== -1) {
    watchlist.splice(idx, 1);
    showToast(sym + ' removed from watchlist');
  } else {
    watchlist.push(sym);
    showToast(sym + ' added to watchlist');
  }
  Store.set('wl_' + currentMarket, watchlist);
  renderMkt(document.getElementById('mktQ') ? document.getElementById('mktQ').value : '');
}

// ─── STOCK DETAIL MODAL (TradingView Chart) ────────────
// NSE symbol mapping for TradingView
var TV_MAP = {
  TCS: 'NSE:TCS', INFY: 'NSE:INFY', WIPRO: 'NSE:WIPRO', HCLT: 'NSE:HCLTECH',
  TECHM: 'NSE:TECHM', HDFC: 'NSE:HDFCBANK', ICICI: 'NSE:ICICIBANK', SBI: 'NSE:SBIN',
  AXIS: 'NSE:AXISBANK', KOTAK: 'NSE:KOTAKBANK', RELI: 'NSE:RELIANCE', ONGC: 'NSE:ONGC',
  BPCL: 'NSE:BPCL', IOC: 'NSE:IOC', TATAM: 'NSE:TATAMOTORS', MM: 'NSE:M&M',
  MARUTI: 'NSE:MARUTI', BAJAJ: 'NSE:BAJAJ-AUTO', HUL: 'NSE:HINDUNILVR', ITC: 'NSE:ITC',
  NEST: 'NSE:NESTLEIND', SUN: 'NSE:SUNPHARMA', DRL: 'NSE:DRREDDY', CIPLA: 'NSE:CIPLA',
  LTIM: 'NSE:LTIM', MPHL: 'NSE:MPHASIS', COFO: 'NSE:COFORGE', PERS: 'NSE:PERSISTENT', ZENS: 'NSE:ZENSAR',
  INDB: 'NSE:INDUSINDBK', BNDH: 'NSE:BANDHANBNK', FED: 'NSE:FEDERALBNK', IDFC: 'NSE:IDFCFIRSTB',
  BOB: 'NSE:BANKBARODA', PNB: 'NSE:PNB', CNBK: 'NSE:CANBK', AUFI: 'NSE:AUBANK',
  BAFL: 'NSE:BAJFINANCE', BAFN: 'NSE:BAJAJFINSV', SBIN: 'NSE:SBILIFE', HDFL: 'NSE:HDFCLIFE',
  NTPC: 'NSE:NTPC', PWGR: 'NSE:POWERGRID', ADNE: 'NSE:ADANIENSO', ADNG: 'NSE:ADANIGREEN',
  TPOW: 'NSE:TATAPOWER', COAL: 'NSE:COALINDIA', GAIL: 'NSE:GAIL', PLNG: 'NSE:PETRONET',
  HERO: 'NSE:HEROMOTOCO', EICH: 'NSE:EICHERMOT', TVSL: 'NSE:TVSMOTOR', ASML: 'NSE:ASHOKLEY',
  MSMI: 'NSE:MOTHERSON', BORE: 'NSE:BOSCHLTD', EXID: 'NSE:EXIDEIND', MRF: 'NSE:MRF',
  DABR: 'NSE:DABUR', BRIT: 'NSE:BRITANNIA', GOCP: 'NSE:GODREJCP', MRCO: 'NSE:MARICO',
  COLP: 'NSE:COLPAL', TITN: 'NSE:TITAN', UNSP: 'NSE:UNITDSPR',
  DIVI: 'NSE:DIVISLAB', LURD: 'NSE:LUPIN', APLS: 'NSE:APOLLOHOSP', TORR: 'NSE:TORNTPHARM',
  BIOT: 'NSE:BIOCON', ALKE: 'NSE:ALKEM', MAXH: 'NSE:MAXHEALTH', AUPH: 'NSE:AUROPHARMA', ZCAD: 'NSE:ZYDUSLIFE',
  TATA: 'NSE:TATASTEEL', JSWL: 'NSE:JSWSTEEL', HNDL: 'NSE:HINDALCO', VEDL: 'NSE:VEDL',
  NMDC: 'NSE:NMDC', SAIL: 'NSE:SAIL', APNT: 'NSE:ASIANPAINT',
  LART: 'NSE:LT', ULTC: 'NSE:ULTRACEMCO', SHRC: 'NSE:SHREECEM', AMBC: 'NSE:AMBUJACEM',
  DLFC: 'NSE:DLF', GODR: 'NSE:GODREJPROP', OBRO: 'NSE:OBEROIRLTY', PRES: 'NSE:PRESTIGE',
  GRAS: 'NSE:GRASIM', SICC: 'NSE:SIEMENS', ABBC: 'NSE:ABB',
  BRTI: 'NSE:BHARTIARTL', JIOT: 'NSE:JIOFIN', IDEA: 'NSE:IDEA', TCOM: 'NSE:TATACOMM',
  PIIL: 'NSE:PIIND', SRF: 'NSE:SRF', ATUL: 'NSE:ATUL', NFIL: 'NSE:NAVINFLUOR', DEEP: 'NSE:DEEPAKNTR', CLGR: 'NSE:CLEANSCI',
  ADNP: 'NSE:ADANIPORTS', ADNE2: 'NSE:ADANIENT',
  ICIL: 'NSE:ICICIGI', LICI: 'NSE:LICI',
  INFO: 'NSE:NAUKRI', ZOMM: 'NSE:ZOMATO', PAYT: 'NSE:PAYTM', PLCY: 'NSE:POLICYBZR', NYKA: 'NSE:NYKAA', DMRT: 'NSE:DELHIVERY'
};

var sdCurrentSym = '';
var sdCurrentTab = 'buy';

// ─── DETERMINISTIC STOCK STATS (not random on each open) ─
function hashSym(sym) {
  var h = 0;
  for (var i = 0; i < sym.length; i++) {
    h = ((h << 5) - h) + sym.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Sector-specific P/E ranges (realistic)
var SECTOR_PE = {
  IT: [22, 38], Banking: [10, 22], Energy: [8, 18], Auto: [15, 35],
  FMCG: [40, 75], Pharma: [20, 40], Metals: [6, 15], Infra: [18, 35],
  Telecom: [25, 60], Chemicals: [25, 50], Realty: [12, 30],
  Insurance: [50, 90], Consumer: [100, 300], Logistics: [40, 80]
};

function getStockStats(sym, currentPrice, stk) {
  var h = hashSym(sym);
  var sec = stk.sec;
  var baseP = stk.p;

  // P/E — sector-specific, fixed per stock
  var peRange = SECTOR_PE[sec] || [15, 35];
  var pe = peRange[0] + (h % 100) / 100 * (peRange[1] - peRange[0]);

  // Volume — inversely proportional to price (cheaper stocks trade more), fixed per stock
  var volBase = Math.max(2, 80 - (baseP / 200));
  var vol = volBase + (h % 50) * 0.4;

  // Day High/Low — based on current price with a fixed spread per stock
  var spread = 0.005 + (h % 30) / 3000; // 0.5% to 1.5% spread
  var dayHigh = Math.round(currentPrice * (1 + spread));
  var dayLow = Math.round(currentPrice * (1 - spread * 0.8));

  // 52-week High/Low — based on base price with stock-specific offsets
  var highMult = 1.08 + (h % 40) / 100;  // 8% to 48% above base
  var lowMult = 0.55 + (h % 35) / 100;   // 55% to 90% of base
  var w52High = Math.round(baseP * highMult);
  var w52Low = Math.round(baseP * lowMult);

  // Market Cap (approx, in Cr)
  var mcap = Math.round(baseP * (500 + (h % 5000)) / 10);

  return {
    dayHigh: dayHigh, dayLow: dayLow,
    volume: vol.toFixed(1), pe: pe.toFixed(1),
    w52High: w52High, w52Low: w52Low, mcap: mcap
  };
}

function renderSDStats(stats, stk) {
  document.getElementById('sdStats').innerHTML =
    '<div class="sd-stat"><div class="sd-stat-lbl">Day High</div><div class="sd-stat-val" id="sdDayHigh">' + fINR(stats.dayHigh) + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">Day Low</div><div class="sd-stat-val" id="sdDayLow">' + fINR(stats.dayLow) + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">Volume</div><div class="sd-stat-val">' + stats.volume + ' L</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">P/E Ratio</div><div class="sd-stat-val">' + stats.pe + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">Sector</div><div class="sd-stat-val">' + stk.sec + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">52W High</div><div class="sd-stat-val">' + fINR(stats.w52High) + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">52W Low</div><div class="sd-stat-val">' + fINR(stats.w52Low) + '</div></div>'
    + '<div class="sd-stat"><div class="sd-stat-lbl">Mkt Cap</div><div class="sd-stat-val">' + fINR(stats.mcap) + ' Cr</div></div>';
}

function openStockDetail(sym) {
  var s = ST.find(function(x) { return x.s === sym; });
  if (!s) return;
  sdCurrentSym = sym;
  sdCurrentTab = 'buy';
  var p = prices[sym] || s.p;
  var ch = +((p - s.p) / s.p * 100).toFixed(2);
  var pos = ch >= 0;

  // Top bar
  document.getElementById('sdSym').textContent = sym;
  var topPrice = document.getElementById('sdTopPrice');
  if (topPrice) topPrice.textContent = fINR(p);

  // Hero row
  document.getElementById('sdName').textContent = s.n + ' \u00B7 ' + s.sec;
  var lw = document.getElementById('sdLogo');
  lw.innerHTML = '';
  lw.appendChild(mkLogo(sym, 52));

  // Price
  document.getElementById('sdPrice').textContent = fINR(p);
  var chEl = document.getElementById('sdChange');
  chEl.textContent = (pos ? '\u25B2 +' : '\u25BC ') + Math.abs(ch) + '% today';
  chEl.className = 'sd-change ' + (pos ? 'sd-up' : 'sd-down');

  // Watchlist
  var wlBtn = document.getElementById('sdWlBtn');
  if (wlBtn) {
    wlBtn.innerHTML = watchlist.indexOf(sym) !== -1 ? '&#9733;' : '&#9734;';
    wlBtn.className = 'sd-wl-btn' + (watchlist.indexOf(sym) !== -1 ? ' active' : '');
  }

  // Stats grid — deterministic per stock using symbol hash
  var hold = HOLDS.find(function(h) { return h.sym === sym; });
  var holdQty = hold ? hold.qty : 0;
  var holdVal = hold ? hold.qty * p : 0;
  var stats = getStockStats(sym, p, s);

  renderSDStats(stats, s);

  // Order card
  document.getElementById('sdOrderPrice').textContent = fINR(p);
  document.getElementById('sdOrderQty').value = '1';
  document.getElementById('sdOrderTotal').textContent = fINR(p);
  sdSetTab('buy');

  // Holdings info
  var holdInfo = document.getElementById('sdHoldInfo');
  if (holdInfo) {
    if (hold) {
      var pnl = (p - hold.avgPrice) * hold.qty;
      holdInfo.innerHTML = '<div class="sd-hold-title">Your Holdings</div>'
        + '<div class="sd-hold-row"><span>Shares</span><span>' + hold.qty + '</span></div>'
        + '<div class="sd-hold-row"><span>Avg Price</span><span>' + fINR(hold.avgPrice) + '</span></div>'
        + '<div class="sd-hold-row"><span>Current Value</span><span>' + fINR(holdVal) + '</span></div>'
        + '<div class="sd-hold-row"><span>P&L</span><span class="' + (pnl >= 0 ? 'pos' : 'neg') + '">' + (pnl >= 0 ? '+' : '') + fINR(pnl) + '</span></div>';
    } else {
      holdInfo.innerHTML = '<div class="sd-hold-empty">You don\'t own this stock yet</div>';
    }
  }

  // Interval buttons
  document.querySelectorAll('.sd-int').forEach(function(btn) {
    btn.classList.remove('active');
    btn.onclick = function() {
      document.querySelectorAll('.sd-int').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      loadSDChart(sym, btn.getAttribute('data-int'));
    };
  });
  var firstInt = document.querySelector('.sd-int[data-int="1"]');
  if (firstInt) firstInt.classList.add('active');

  // Load chart
  loadSDChart(sym, 'D');

  document.getElementById('sdov').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function loadSDChart(sym, interval) {
  var chartEl = document.getElementById('sdChart');
  var tvSym = TV_MAP[sym] || 'NSE:' + sym;
  chartEl.innerHTML = '';

  // Map interval buttons to TradingView intervals
  var intMap = { '1': 'D', 'D': 'D', 'W': 'W', 'M': 'M', '3M': '3M', '12M': '12M', '60M': '60M', 'All': 'ALL' };
  var tvInterval = intMap[interval] || 'D';

  // Use TradingView widget URL with symbol as query param — unique real-time chart per stock
  var params = [
    'symbol=' + encodeURIComponent(tvSym),
    'interval=' + tvInterval,
    'theme=dark',
    'style=1',
    'locale=en',
    'timezone=Asia%2FKolkata',
    'hide_top_toolbar=0',
    'hide_legend=0',
    'hide_volume=0',
    'hideideas=1',
    'saveimage=0',
    'calendar=0',
    'hide_side_toolbar=1',
    'allow_symbol_change=0',
    'referral_id=43547',
    '_=ts' + Date.now()
  ].join('&');

  var iframe = document.createElement('iframe');
  iframe.src = 'https://s.tradingview.com/widgetembed/?' + params;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('scrolling', 'no');
  chartEl.appendChild(iframe);
}

function sdSetTab(tab) {
  sdCurrentTab = tab;
  var buyTab = document.getElementById('sdBuyTab');
  var sellTab = document.getElementById('sdSellTab');
  var btn = document.getElementById('sdOrderBtn');

  if (tab === 'buy') {
    buyTab.classList.add('active');
    sellTab.classList.remove('active');
    btn.textContent = 'Buy';
    btn.className = 'sd-order-btn buy';
  } else {
    buyTab.classList.remove('active');
    sellTab.classList.add('active');
    btn.textContent = 'Sell';
    btn.className = 'sd-order-btn sell';
  }
}

function updateSDTotal() {
  var qty = parseInt(document.getElementById('sdOrderQty').value) || 0;
  var s = ST.find(function(x) { return x.s === sdCurrentSym; });
  var p = prices[sdCurrentSym] || (s ? s.p : 0);
  document.getElementById('sdOrderTotal').textContent = fINR(qty * p);
}

function sdPlaceOrder() {
  if (!userProfile) { closeSD(); showProfilePrompt(); return; }
  var qty = parseInt(document.getElementById('sdOrderQty').value) || 0;
  if (qty < 1) { showToast('Enter at least 1 share'); return; }
  closeSD();
  openBS(sdCurrentSym, sdCurrentTab);
  document.getElementById('bsqty').value = qty;
  updBS();
}

function toggleSDWatchlist() {
  toggleWatchlist(sdCurrentSym);
  var wlBtn = document.getElementById('sdWlBtn');
  if (wlBtn) {
    var inWL = watchlist.indexOf(sdCurrentSym) !== -1;
    wlBtn.innerHTML = inWL ? '&#9733;' : '&#9734;';
    wlBtn.className = 'sd-wl-btn' + (inWL ? ' active' : '');
  }
}

function closeSD() {
  document.getElementById('sdov').classList.remove('on');
  document.body.style.overflow = '';
  var chartEl = document.getElementById('sdChart');
  if (chartEl) chartEl.innerHTML = '';
}
