/* ═══════════════════════════════════════════════════════════
   FINVEST AI — ui.js
   Navigation, toast, leaderboard, community, SEBI reader,
   profile system, SIP calculator, glossary
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── NAVIGATION ──────────────────────────────────────────
var PAGE_TITLES = {
  dashboard:   'Dashboard',
  market:      'Live Market',
  learn:       'Learn & Earn',
  leaderboard: 'Leaderboard',
  resources:   'Resources',
  profile:     'My Profile',
};

function navTo(id, tnBtn, mbBtn) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('on'); });
  var pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('on');

  // Top navbar links
  document.querySelectorAll('.tn-link').forEach(function(n) { n.classList.remove('on'); });
  if (tnBtn && tnBtn.classList.contains('tn-link')) {
    tnBtn.classList.add('on');
  } else {
    // Find matching top nav link by data-page
    var match = document.querySelector('.tn-link[data-page="' + id + '"]');
    if (match) match.classList.add('on');
  }

  // Mobile sidebar links
  document.querySelectorAll('.sb-mobile .ni').forEach(function(n) { n.classList.remove('on'); });
  var sbMatch = document.querySelector('.sb-mobile .ni[data-page="' + id + '"]');
  if (sbMatch) sbMatch.classList.add('on');

  // Bottom nav
  document.querySelectorAll('.bni').forEach(function(n) { n.classList.remove('on'); });
  if (mbBtn) mbBtn.classList.add('on');
  var bn = document.getElementById('bn-' + id);
  if (bn) bn.classList.add('on');

  curPage = id;
  closeSB();
  document.body.style.overflow = ''; // unlock scroll in case an overlay left it locked
  window.scrollTo(0, 0);

  // Refresh data when navigating
  if (id === 'dashboard') {
    renderHoldingsTable();
    updateDashboardStats();
    if (typeof renderTicker === 'function') renderTicker();
    if (typeof renderNews === 'function') renderNews();
  }
  if (id === 'leaderboard') renderLB();
  if (id === 'profile') renderProfile();
  if (id === 'market' && typeof termEnsure === 'function') termEnsure();
}

function toggleSB() {
  var sb = document.getElementById('sb');
  var ov = document.getElementById('sbov');
  if (sb) sb.classList.toggle('on');
  if (ov) ov.classList.toggle('on');
}
function closeSB() {
  var sb = document.getElementById('sb');
  var ov = document.getElementById('sbov');
  if (sb) sb.classList.remove('on');
  if (ov) ov.classList.remove('on');
}

// ─── TOAST ────────────────────────────────────────────────
var toastTmr = null;
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  if (toastTmr) clearTimeout(toastTmr);
  toastTmr = setTimeout(function() { t.classList.remove('on'); }, 2800);
}

// ─── PROFILE SYSTEM ─────────────────────────────────────
// \u2500\u2500\u2500 ONBOARDING / PROFILE FLOW (premium, 3-step) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
var _ob = { step: 1, mode: 'onboard', goal: null, risk: null, accent: '#4d9fff' };

function showProfilePrompt() {
  _ob.step = 1;
  obGoto(1);
  document.getElementById('profModal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  document.getElementById('profModal').classList.remove('on');
  document.body.style.overflow = '';
}

function obGoto(n) {
  _ob.step = n;
  document.querySelectorAll('#profModal .ob-step').forEach(function(s) {
    s.classList.toggle('on', +s.getAttribute('data-step') === n);
  });
  var dots = document.querySelectorAll('#obSteps .ob-dot');
  dots.forEach(function(d, i) { d.classList.toggle('on', i < n); });
  if (n === 3) {
    var cashEl = document.getElementById('obCash');
    var m = window.MKT || MARKETS[currentMarket];
    if (cashEl) cashEl.textContent = m.cur + Math.round(m.startCash).toLocaleString(m.locale);
  }
}

function obNext() {
  if (_ob.step === 1) {
    var name = document.getElementById('profName').value.trim();
    if (!name) { showToast('Please enter your name'); return; }
    if (!_ob.goal) { showToast('Pick an investing goal'); return; }
    obGoto(2);
  } else if (_ob.step === 2) {
    if (!_ob.risk) { showToast('Choose your risk appetite'); return; }
    obGoto(3);
  }
}
function obBack() { if (_ob.step > 1) obGoto(_ob.step - 1); }

function obPickGoal(el) {
  _ob.goal = el.getAttribute('data-val');
  document.querySelectorAll('#obGoals .ob-choice').forEach(function(b) { b.classList.toggle('sel', b === el); });
}
function obPickRisk(el) {
  _ob.risk = el.getAttribute('data-val');
  document.querySelectorAll('#obRisks .ob-choice').forEach(function(b) { b.classList.toggle('sel', b === el); });
}
function obPickAccent(el) {
  _ob.accent = el.getAttribute('data-c');
  document.querySelectorAll('#obAccents .ob-accent').forEach(function(b) { b.classList.toggle('sel', b === el); });
  var mono = document.getElementById('obMonogram');
  if (mono) mono.style.setProperty('--accent', _ob.accent);
}
function obSyncMonogram() {
  var name = document.getElementById('profName').value.trim();
  var mono = document.getElementById('obMonogram');
  if (mono) mono.textContent = (name.charAt(0) || 'A').toUpperCase();
}

function saveProfile() {
  var name = document.getElementById('profName').value.trim();
  if (!name) { showToast('Please enter your name'); obGoto(1); return; }
  var goal = _ob.goal || (userProfile && userProfile.goal) || 'Learn the basics';
  var risk = _ob.risk || (userProfile && userProfile.risk) || 'medium';
  var initial = name.charAt(0).toUpperCase();

  window.userProfile = {
    name: name,
    avatar: initial,            // monogram initial \u2014 no emojis
    accent: _ob.accent || '#4d9fff',
    goal: goal,
    risk: risk,
    createdAt: (userProfile && userProfile.createdAt) || Date.now(),
    placement: userProfile ? userProfile.placement : undefined,
    totalTrades: tradeHistory.length
  };
  Store.set('profile', userProfile);

  // Brand-new user \u2192 clean slate: full virtual cash, no pre-seeded holdings.
  var firstTime = totalXP === 0 && tradeHistory.length === 0 && !Store.get('onboarded', false);
  if (firstTime) {
    Object.keys(MARKETS).forEach(function(mk) {
      Store.set('holds_' + mk, []);
      Store.set('wallet_' + mk, { balance: MARKETS[mk].startCash, transactions: [] });
    });
    Store.set('onboarded', true);
    applyMarket();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    if (typeof renderHoldingsTable === 'function') renderHoldingsTable();
    if (typeof renderWallet === 'function') renderWallet();
    if (typeof updateHealthScore === 'function') updateHealthScore();
  }

  closeProfileModal();
  updateProfileUI();
  if (typeof renderProfile === 'function') renderProfile();
  if (totalXP === 0) addXP(50, '+50 XP Welcome Bonus');

  // End of onboarding \u2192 drop the user into the Market to make their first trade.
  if (_ob.mode === 'onboard') {
    showToast('Welcome, ' + name + '! Your virtual ' + MKT.cur + Math.round(MKT.startCash).toLocaleString(MKT.locale) + ' is ready.');
    if (typeof navTo === 'function') {
      navTo('market', document.querySelector('.tn-link[data-page=market]'));
    }
  } else {
    showToast('Profile updated');
  }
}

function updateProfileUI() {
  if (!userProfile) return;

  // Update avatar in topbar
  var avi = document.getElementById('topAvi');
  if (avi) {
    avi.textContent = userProfile.avatar || userProfile.name.charAt(0).toUpperCase();
  }

  // Update top nav XP
  var tnXp = document.getElementById('tnXp');
  if (tnXp) tnXp.innerHTML = '&#9889; ' + totalXP + ' XP';

  // Update streak
  var streakEl = document.getElementById('streakText');
  if (streakEl) streakEl.textContent = streakData.count + ' Day Streak';
}

function renderProfile() {
  if (!userProfile) return;

  var accent = userProfile.accent || '#4d9fff';
  var el = document.getElementById('profAvatar');
  if (el) {
    el.textContent = (userProfile.name || 'U').charAt(0).toUpperCase();
    el.style.background = 'linear-gradient(135deg, ' + accent + ', color-mix(in oklab, ' + accent + ' 55%, #000))';
    el.style.color = '#fff';
  }

  el = document.getElementById('profDisplayName');
  if (el) el.textContent = userProfile.name;

  el = document.getElementById('profGoalDisplay');
  if (el) el.textContent = 'Goal: ' + (userProfile.goal || 'Learn the basics');

  el = document.getElementById('profRiskDisplay');
  if (el) {
    var risk = userProfile.risk || 'medium';
    el.textContent = 'Risk: ' + risk.charAt(0).toUpperCase() + risk.slice(1);
  }

  var lv = getLv(totalXP);
  el = document.getElementById('profLevel');
  if (el) el.textContent = 'Lv ' + lv.num;

  el = document.getElementById('profXP');
  if (el) el.textContent = totalXP;

  el = document.getElementById('profTrades');
  if (el) el.textContent = tradeHistory.length;

  el = document.getElementById('profStreak');
  if (el) el.textContent = streakData.count + 'd';

  el = document.getElementById('profJoined');
  if (el) {
    var d = new Date(userProfile.createdAt || Date.now());
    el.textContent = 'Member since ' + d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  updateThemeUI();
  renderAchievements();
  renderWallet();
}

// Clean monochrome SVG badge for achievements (no emojis — premium look).
function _achSvg(path) {
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
}

function renderAchievements() {
  var el = document.getElementById('achievementsList');
  if (!el) return;

  var port = calcPortfolio();
  var achievements = [
    { icon: _achSvg('M3 17l6-6 4 4 8-8M17 7h4v4'),                                  title: 'First Trade',      desc: 'Place a buy or sell order',  done: tradeHistory.length > 0 },
    { icon: _achSvg('M7 4h10v5a5 5 0 01-10 0zM5 9a3 3 0 01-3-3V5h3M19 9a3 3 0 003-3V5h-3M8 21h8M12 17v4'), title: 'Active Trader', desc: 'Complete 5 trades', done: tradeHistory.length >= 5 },
    { icon: _achSvg('M2 7l10-4 10 4-10 4zM6 9v5c0 1.5 3 3 6 3s6-1.5 6-3V9'),         title: 'Curious Mind',     desc: 'Finish your first lesson',   done: completedL.size >= 1 },
    { icon: _achSvg('M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2zM8 3v14'),                title: 'Knowledge Seeker', desc: 'Finish 3 lessons',           done: completedL.size >= 3 },
    { icon: _achSvg('M12 3c1 3-1 4-1 6a3 3 0 006 0c0-1 0-2-1-3 2 1 4 4 4 7a8 8 0 01-16 0c0-4 3-6 4-8 1 1 2 2 4-2z'), title: 'On a Roll', desc: '3-day learning streak', done: streakData.count >= 3 },
    { icon: _achSvg('M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z'),               title: 'Level 3 Investor', desc: 'Reach Level 3',              done: getLv(totalXP).num >= 3 },
    { icon: _achSvg('M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z'), title: 'Diversified', desc: 'Hold 4+ different assets', done: HOLDS.length >= 4 },
  ];

  var unlocked = achievements.filter(function(a) { return a.done; }).length;
  var countEl = document.getElementById('achCount');
  if (countEl) countEl.textContent = unlocked + '/' + achievements.length + ' unlocked';

  el.innerHTML = achievements.map(function(a) {
    return '<div class="ach-card ' + (a.done ? 'ach-done' : 'ach-locked') + '">'
      + '<div class="ach-icon">' + a.icon + '</div>'
      + '<div class="ach-title">' + a.title + '</div>'
      + '<div class="ach-desc">' + a.desc + '</div>'
      + '</div>';
  }).join('');
}

// \u2500\u2500\u2500 THEME \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function setTheme(t) {
  document.documentElement.classList.toggle('light', t === 'light');
  Store.set('theme', t);
  updateThemeUI();
}

function updateThemeUI() {
  var light = document.documentElement.classList.contains('light');
  document.querySelectorAll('.theme-card').forEach(function(c) {
    c.classList.toggle('on', c.getAttribute('data-theme') === (light ? 'light' : 'dark'));
  });
  var navBtn = document.querySelector('.tn-theme');
  if (navBtn) navBtn.textContent = light ? '\u263e' : '\u2600';
  // Re-tint sector donut for the active theme
  if (typeof updateDashboardStats === 'function' && curPage === 'dashboard') updateDashboardStats();
  // Recolor chart workspace
  if (typeof termApplyTheme === 'function') termApplyTheme();
}

function editProfile() {
  if (!userProfile) { _ob.mode = 'onboard'; showProfilePrompt(); return; }
  _ob.mode = 'edit';
  _ob.goal = userProfile.goal || null;
  _ob.risk = userProfile.risk || 'medium';
  _ob.accent = userProfile.accent || '#4d9fff';

  var nameInp = document.getElementById('profName');
  if (nameInp) nameInp.value = userProfile.name || '';
  obSyncMonogram();

  // Pre-select goal / risk / accent cards
  document.querySelectorAll('#obGoals .ob-choice').forEach(function(b) {
    b.classList.toggle('sel', b.getAttribute('data-val') === _ob.goal);
  });
  document.querySelectorAll('#obRisks .ob-choice').forEach(function(b) {
    b.classList.toggle('sel', b.getAttribute('data-val') === _ob.risk);
  });
  document.querySelectorAll('#obAccents .ob-accent').forEach(function(b) {
    b.classList.toggle('sel', b.getAttribute('data-c') === _ob.accent);
  });
  var mono = document.getElementById('obMonogram');
  if (mono) mono.style.setProperty('--accent', _ob.accent);

  showProfilePrompt();
}

function resetProfile() {
  if (!confirm('This will reset ALL your data \u2014 XP, holdings, trades, profile. Are you sure?')) return;
  Store.remove('profile');
  Store.remove('xp');
  Store.remove('completedLessons');
  Store.remove('holdings');
  Store.remove('trades');
  Store.remove('watchlist');
  Store.remove('challenges');
  Store.remove('streak');
  window.location.reload();
}

// ─── LEADERBOARD ─────────────────────────────────────────
// Leaderboard roster \u2014 global traders with trades / win-rate / P&L
window.LB_PLAYERS = [
  { f:'\uD83C\uDDEE\uD83C\uDDF3', nm:'Aarav Mehta',   trades:142, win:71, pnl:38.4, xp:4820, bot:false },
  { f:'\uD83C\uDDEE\uD83C\uDDF9', nm:'Sofia Rossi',   trades:118, win:68, pnl:31.2, xp:4310, bot:false },
  { f:'\uD83C\uDDF8\uD83C\uDDEC', nm:'Marcus Chen',   trades:99,  win:65, pnl:27.0, xp:3940, bot:false },
  { f:'\uD83C\uDDEE\uD83C\uDDF3', nm:'Priya Sharma',  trades:87,  win:64, pnl:22.8, xp:3510, bot:false },
  { f:'\uD83C\uDDE6\uD83C\uDDFA', nm:'Quant_Quokka',  trades:220, win:58, pnl:19.4, xp:3210, bot:true  },
  { f:'\uD83C\uDDFA\uD83C\uDDF8', nm:'Jordan Bailey', trades:76,  win:62, pnl:17.6, xp:2980, bot:false },
  { f:'\uD83C\uDDEE\uD83C\uDDEA', nm:"Liam O'Connor", trades:65,  win:60, pnl:14.9, xp:2710, bot:false },
  { f:'\uD83C\uDDEF\uD83C\uDDF5', nm:'Yuki Tanaka',   trades:58,  win:59, pnl:12.1, xp:2440, bot:false },
  { f:'\uD83C\uDDE9\uD83C\uDDEA', nm:'Mia Schmidt',   trades:51,  win:57, pnl:10.3, xp:2180, bot:false },
  { f:'\uD83C\uDDFA\uD83C\uDDF8', nm:'AlphaBot_3000', trades:310, win:55, pnl:8.7,  xp:1950, bot:true  },
  { f:'\uD83C\uDDEB\uD83C\uDDF7', nm:'Chlo\u00E9 Martin',  trades:47,  win:56, pnl:7.2,  xp:1720, bot:false },
  { f:'\uD83C\uDDEC\uD83C\uDDE7', nm:'Noah Williams', trades:42,  win:54, pnl:5.9,  xp:1510, bot:false },
  { f:'\uD83C\uDDEA\uD83C\uDDF8', nm:'Luc\u00EDa Garc\u00EDa',  trades:33,  win:53, pnl:4.8,  xp:1290, bot:false },
  { f:'\uD83C\uDDE6\uD83C\uDDEA', nm:'Omar Haddad',   trades:28,  win:52, pnl:3.5,  xp:980,  bot:false },
  { f:'\uD83C\uDDE7\uD83C\uDDF7', nm:'Lucas Silva',   trades:21,  win:51, pnl:2.1,  xp:640,  bot:false },
];

window.lbTab = 'week';

function setLBTab(tab, btn) {
  lbTab = tab;
  document.querySelectorAll('.lb-tab').forEach(function(b) { b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  renderLB();
}

function renderLB() {
  var userName = userProfile ? userProfile.name : 'You';
  var userAvatar = userProfile ? userProfile.avatar : '&#128100;';

  // All-Time scales scores up; This Week uses base; Humans Only drops bots
  var scale = lbTab === 'all' ? 7.4 : 1;
  var roster = LB_PLAYERS.filter(function(p) { return lbTab === 'humans' ? !p.bot : true; });

  var all = roster.map(function(p) {
    return {
      e: p.f, nm: p.nm, bot: p.bot, demo: true, you: false,
      trades: Math.round(p.trades * (lbTab === 'all' ? 4.2 : 1)),
      win: p.win,
      pnl: +(p.pnl * (lbTab === 'all' ? 1.6 : 1)).toFixed(1),
      pts: Math.round(p.xp * scale)
    };
  });

  // Estimate the user's win-rate / P&L from their portfolio
  var port = (typeof calcPortfolio === 'function') ? calcPortfolio() : { gainPct: 0 };
  all.push({
    e: userAvatar, nm: userName, bot: false, demo: false, you: true,
    trades: tradeHistory.length,
    win: tradeHistory.length ? Math.min(95, 50 + Math.round(port.gainPct)) : 0,
    pnl: +(port.gainPct || 0).toFixed(1),
    pts: totalXP
  });

  all.sort(function(a, b) { return b.pts - a.pts; });
  all.forEach(function(u, i) { u.r = i + 1; });

  var maxPnl = Math.max.apply(null, all.map(function(u) { return Math.abs(u.pnl); }).concat([1]));

  // \u2500\u2500 Rank badge \u2500\u2500
  var userEntry = all.find(function(u) { return u.you; });
  var sampleCount = all.filter(function(u) { return u.demo; }).length;
  var badge = document.getElementById('lbRankBadge');
  if (badge && userEntry) {
    badge.innerHTML = "You have <b>" + userEntry.pts.toLocaleString() + " XP</b> &middot; rank <b>#" + userEntry.r + "</b>"
      + (userEntry.pts === 0 ? ' &middot; complete a lesson to start climbing' : '');
  }
  var countEl = document.getElementById('lbCount');
  if (countEl) countEl.textContent = (all.length - sampleCount) + ' real + ' + sampleCount + ' sample';

  // \u2500\u2500 Podium (2nd \u00B7 1st \u00B7 3rd) \u2500\u2500
  var top3 = all.slice(0, 3);
  var podOrder = [1, 0, 2];
  var medals = ['&#129352;', '&#128081;', '&#129353;']; // silver wreath, crown, bronze
  var podiumEl = document.getElementById('podium');
  if (podiumEl) {
    podiumEl.innerHTML = podOrder.map(function(oi) {
      var u = top3[oi];
      if (!u) return '';
      var barW = Math.min(100, Math.round(Math.abs(u.pnl) / maxPnl * 100));
      return '<div class="lb-pod' + (u.r === 1 ? ' lb-pod-1' : '') + (u.you ? ' you' : '') + '">'
        + '<div class="lb-pod-rank">' + medals[oi] + ' RANK #' + u.r + '</div>'
        + '<div class="lb-pod-user"><span class="lb-pod-av">' + u.e + '</span>'
        + '<div><div class="lb-pod-nm">' + u.nm + (u.you ? ' <span class="lb-you">(You)</span>' : '') + '</div>'
        + '<div class="lb-pod-sub">' + u.trades + ' trades &middot; ' + u.win + '% win</div></div></div>'
        + '<div class="lb-pod-xp">' + u.pts.toLocaleString() + ' XP</div>'
        + '<div class="lb-pod-pnl">' + (u.pnl >= 0 ? '+' : '') + u.pnl + '% P&L</div>'
        + '<div class="lb-pod-bar"><div style="width:' + barW + '%"></div></div>'
        + '</div>';
    }).join('');
  }

  // \u2500\u2500 Full ranking table \u2500\u2500
  var el = document.getElementById('lblist');
  if (!el) return;
  var header = '<div class="lb-row lb-row-head">'
    + '<span class="lb-c-rank">#</span><span class="lb-c-name">TRADER</span>'
    + '<span class="lb-c-num">TRADES</span><span class="lb-c-num">WIN RATE</span>'
    + '<span class="lb-c-num">P&L</span><span class="lb-c-num">XP</span></div>';
  el.innerHTML = header + all.map(function(u) {
    return '<div class="lb-row' + (u.you ? ' you' : '') + '">'
      + '<span class="lb-c-rank">#' + u.r + '</span>'
      + '<span class="lb-c-name"><span class="lb-flag">' + u.e + '</span>'
      + '<span class="lb-tname">' + u.nm + '</span>'
      + (u.bot ? '<span class="lb-bot">&#129302; bot</span>' : '')
      + (u.demo ? '<span class="lb-bot" style="background:rgba(77,159,255,.15);color:var(--bl)">Sample</span>' : '')
      + (u.you ? '<span class="lb-you">You</span>' : '') + '</span>'
      + '<span class="lb-c-num">' + u.trades + '</span>'
      + '<span class="lb-c-num">' + u.win + '%</span>'
      + '<span class="lb-c-num ' + (u.pnl >= 0 ? 'pos' : 'neg') + '">' + (u.pnl >= 0 ? '&#8599; +' : '&#8600; ') + u.pnl + '%</span>'
      + '<span class="lb-c-num lb-xp">' + u.pts.toLocaleString() + '</span>'
      + '</div>';
  }).join('');
}


// ─── SIP CALCULATOR ──────────────────────────────────────
function calcSIP() {
  var curEl = document.getElementById('sipCur');
  if (curEl) curEl.textContent = (window.MKT || MARKETS[currentMarket]).cur;

  var monthly = parseFloat(document.getElementById('sipAmount').value) || 0;
  var rate = parseFloat(document.getElementById('sipRate').value) || 12;
  var years = parseFloat(document.getElementById('sipYears').value) || 5;

  if (monthly <= 0) {
    document.getElementById('sipInvested').textContent = fINR(0);
    document.getElementById('sipReturns').textContent = fINR(0);
    document.getElementById('sipTotal').textContent = fINR(0);
    return;
  }

  var r = rate / 100 / 12;
  var n = years * 12;
  var invested = monthly * n;
  var futureValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  var returns = futureValue - invested;

  document.getElementById('sipInvested').textContent = fINR(invested);
  document.getElementById('sipReturns').textContent = fINR(returns);
  document.getElementById('sipTotal').textContent = fINR(futureValue);

  // Update progress bar
  var pct = invested / futureValue * 100;
  var bar = document.getElementById('sipBar');
  if (bar) {
    bar.innerHTML = '<div style="width:' + pct + '%;background:var(--teal);height:100%;border-radius:4px;transition:width .5s"></div>'
      + '<div style="width:' + (100 - pct) + '%;background:var(--gr);height:100%;border-radius:0 4px 4px 0;transition:width .5s"></div>';
  }
}

// ─── LUMPSUM CALCULATOR ──────────────────────────────────
function calcLumpsum() {
  var curEl = document.getElementById('lsCur');
  if (curEl) curEl.textContent = (window.MKT || MARKETS[currentMarket]).cur;

  var principal = parseFloat(document.getElementById('lsAmount').value) || 0;
  var rate = parseFloat(document.getElementById('lsRate').value) || 12;
  var years = parseFloat(document.getElementById('lsYears').value) || 5;

  if (principal <= 0) {
    document.getElementById('lsInvested').textContent = fINR(0);
    document.getElementById('lsReturns').textContent = fINR(0);
    document.getElementById('lsTotal').textContent = fINR(0);
    return;
  }

  var futureValue = principal * Math.pow(1 + rate / 100, years);
  var returns = futureValue - principal;

  document.getElementById('lsInvested').textContent = fINR(principal);
  document.getElementById('lsReturns').textContent = fINR(returns);
  document.getElementById('lsTotal').textContent = fINR(futureValue);
}

// ─── GLOSSARY ────────────────────────────────────────────
function renderGlossary(query) {
  var el = document.getElementById('glossaryList');
  if (!el) return;

  var q = (query || '').toLowerCase();
  var list = GLOSSARY.filter(function(g) {
    if (!q) return true;
    return g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
  });

  el.innerHTML = list.map(function(g) {
    var t = g.term.replace(/'/g, "\\'");
    return '<button class="gloss-item" onclick="askGloss(\'' + t + '\')">'
      + '<div class="gloss-term">' + g.term + ' <span class="gloss-ask">Ask Fin &#8594;</span></div>'
      + '<div class="gloss-def">' + g.def + '</div>'
      + '</button>';
  }).join('');
}

// ─── SEBI INLINE BOOKLET ──────────────────────────────────
function showSC(i, el) {
  document.querySelectorAll('.stab').forEach(function(t) { t.classList.remove('on'); });
  if (el) el.classList.add('on');
  var c = document.getElementById('sc');
  if (c && SEBI_CHAPS[i]) {
    c.innerHTML = SEBI_CHAPS[i];
    c.scrollTop = 0;
  }
}

// ─── WALLET UI ───────────────────────────────────────────
var walletAction = 'deposit';

function renderWallet() {
  var balEl = document.getElementById('walletBal');
  if (balEl) balEl.textContent = fINR(wallet.balance);

  var txnEl = document.getElementById('walletTxns');
  if (!txnEl) return;

  var txns = wallet.transactions.slice(0, 8);
  if (txns.length === 0) {
    txnEl.innerHTML = '<div class="wallet-txn-empty">No transactions yet</div>';
    return;
  }

  txnEl.innerHTML = txns.map(function(t) {
    var isCredit = t.type === 'deposit' || t.type === 'sell';
    return '<div class="wallet-txn">'
      + '<div class="wallet-txn-icon"><span class="wtxn-dot ' + (isCredit ? 'pos' : 'neg') + '"></span></div>'
      + '<div class="wallet-txn-info"><div class="wallet-txn-desc">' + t.desc + '</div><div class="wallet-txn-time">' + getTimeAgo(t.time) + '</div></div>'
      + '<div class="wallet-txn-amt ' + (isCredit ? 'pos' : 'neg') + '">' + (isCredit ? '+' : '-') + fINR(t.amount) + '</div>'
      + '</div>';
  }).join('');
}

function showWalletModal(type) {
  walletAction = type;
  var title = type === 'deposit' ? 'Add Virtual Funds' : type === 'reset' ? 'Reset Virtual Balance' : 'Withdraw';
  document.getElementById('walletModalTitle').textContent = title;
  document.getElementById('walletModalBal').textContent = fINR(wallet.balance);
  var inp = document.getElementById('walletAmtInp');
  var amtField = inp.closest('.wallet-amt-field') || inp.parentElement;
  var btn = document.getElementById('walletConfirmBtn');
  // Reset is a confirmation, not an amount entry — hide the input + quick chips.
  var quick = document.querySelector('#walletModal .wallet-quick');
  if (type === 'reset') {
    inp.value = '';
    if (amtField) amtField.style.display = 'none';
    if (quick) quick.style.display = 'none';
    btn.textContent = 'Reset to ' + fINR((window.MKT || MARKETS[currentMarket]).startCash);
    btn.className = 'wallet-confirm-btn withdraw';
  } else {
    if (amtField) amtField.style.display = '';
    if (quick) quick.style.display = '';
    inp.value = '';
    btn.textContent = type === 'deposit' ? 'Add Virtual Funds' : 'Withdraw';
    btn.className = 'wallet-confirm-btn ' + type;
  }
  document.getElementById('walletModal').classList.add('on');
}

function closeWalletModal() {
  document.getElementById('walletModal').classList.remove('on');
}

function setWalletAmt(amt) {
  document.getElementById('walletAmtInp').value = amt;
}

function confirmWalletAction() {
  // Reset mode — restore the virtual balance to the market's starting cash.
  if (walletAction === 'reset') {
    var start = (window.MKT || MARKETS[currentMarket]).startCash;
    wallet.balance = start;
    wallet.transactions.unshift({ type: 'deposit', amount: start, time: Date.now(), desc: 'Reset virtual balance' });
    if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(0, 50);
    saveWallet();
    closeWalletModal();
    renderWallet();
    showToast('Virtual balance reset to ' + fINR(start));
    return;
  }

  var inp = document.getElementById('walletAmtInp');
  var raw = inp.value.trim();

  // Input validation
  if (!raw || raw === '') { showToast('Please enter an amount'); return; }
  var amt = parseInt(raw);
  if (isNaN(amt) || amt <= 0) { showToast('Enter a valid positive amount'); inp.value = ''; return; }
  if (amt < 100) { showToast('Minimum amount is \u20B9100'); return; }
  if (amt > 10000000) { showToast('Maximum amount is \u20B91,00,00,000'); return; }
  if (raw.includes('.') || raw.includes('-') || raw.includes('e')) { showToast('Enter a whole number without decimals'); inp.value = Math.abs(Math.floor(amt)); return; }

  if (walletAction === 'deposit') {
    walletDeposit(amt);
    showToast('&#128994; ' + fINR(amt) + ' added to wallet!');
  } else {
    if (amt > wallet.balance) { showToast('Insufficient balance! You have ' + fINR(wallet.balance)); return; }
    walletWithdraw(amt);
    showToast('&#128308; ' + fINR(amt) + ' withdrawn from wallet');
  }

  closeWalletModal();
  renderWallet();
}

// ─── FAB WELCOME BUBBLE ──────────────────────────────────
(function() {
  setTimeout(function() {
    var bubble = document.getElementById('fabBubble');
    if (bubble) bubble.classList.add('on');
    setTimeout(function() {
      if (bubble) bubble.classList.remove('on');
    }, 5000);
  }, 2000);
})();
