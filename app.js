/* ═══════════════════════════════════════════════════════════
   FINVEST AI — app.js
   Main entry point. Initialises everything.
═══════════════════════════════════════════════════════════ */

'use strict';

function initApp() {
  // Apply saved theme before first paint of dynamic content (light is default)
  if (Store.get('theme', 'light') === 'light') document.documentElement.classList.add('light');

  // Seed live prices from base prices in data.js
  ST.forEach(function(s) { prices[s.s] = s.p; });
  IDX.forEach(function(x) { idxP[x.n] = x.b; });

  // Check daily streak
  checkStreak();

  // Render all dynamic sections
  renderMarketSelector();
  renderMarketTabs();
  renderIdx();
  renderMkt('');
  syncMarketUI();
  if (typeof updateThemeUI === 'function') updateThemeUI();
  initHoldings();
  renderLessons();
  renderLB();
  updXP();
  renderGlossary('');
  if (typeof refreshAIChips === 'function') refreshAIChips();
  if (typeof updateHealthScore === 'function') updateHealthScore();

  // SEBI booklet — load first chapter
  setTimeout(function() {
    showSC(0, document.querySelector('.stab'));
  }, 150);

  // Market search
  var mktInput = document.getElementById('mktQ');
  if (mktInput) {
    mktInput.addEventListener('input', function() {
      var clr = document.getElementById('mktClr');
      if (clr) clr.style.display = this.value ? 'inline' : 'none';
      if (typeof renderWatch === 'function') renderWatch(this.value);
    });
  }

  // Glossary search
  var glossInput = document.getElementById('glossarySearch');
  if (glossInput) {
    glossInput.addEventListener('input', function() {
      renderGlossary(this.value);
    });
  }

  // Calculator defaults — compute on load so pre-filled inputs show results
  // immediately (previously Lumpsum stayed at 0 until the user typed).
  calcSIP();
  calcLumpsum();

  // Show profile prompt if no profile exists
  if (!userProfile) {
    setTimeout(function() {
      showProfilePrompt();
    }, 500);
  } else {
    updateProfileUI();
  }

  // Live market data — keep prices nearby, ticker + news
  if (typeof refreshQuotes === 'function') { refreshQuotes(); setInterval(refreshQuotes, 60000); }
  if (typeof renderTicker === 'function') { renderTicker(); setInterval(renderTicker, 60000); }
  if (typeof renderNews === 'function') renderNews();

  // Price simulation — tick every 8 seconds
  setInterval(tickPrices, 8000);

  // Leaderboard timer update every minute
  setInterval(function() {
    if (curPage === 'leaderboard') renderLB();
  }, 60000);

  // Sync user data to backend (every 30 seconds + on key actions)
  syncToServer();
  setInterval(syncToServer, 30000);
}

// ─── BACKEND SYNC ────────────────────────────────────────
// Sends user profile, stats, holdings, trades to server for admin visibility
var _syncUserId = Store.get('userId', null);

function syncToServer() {
  if (!userProfile) return;
  var port = calcPortfolio();
  var payload = {
    userId: _syncUserId,
    profile: userProfile,
    xp: totalXP,
    level: getLv(totalXP).l,
    streak: streakData.count,
    lessonsCompleted: completedL.size,
    totalTrades: tradeHistory.length,
    holdingsCount: HOLDS.length,
    portfolioValue: port.totalValue,
    walletBalance: wallet.balance,
    holdings: HOLDS,
    recentTrades: tradeHistory.slice(-20)
  };

  fetch('/api/users/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success && data.userId) {
      _syncUserId = data.userId;
      Store.set('userId', _syncUserId);
    }
  })
  .catch(function() {
    // Server not available — that's fine, app works offline
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
