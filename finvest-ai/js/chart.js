/* ═══════════════════════════════════════════════════════════
   FINVEST AI — chart.js
   Pro chart workspace for the Market page.
   Real OHLC via /api/candles (Yahoo / Binance) with a synthetic
   fallback so every symbol charts. Candles + volume + RSI + MACD
   rendered with TradingView lightweight-charts.
═══════════════════════════════════════════════════════════ */

'use strict';

window.termSym = null;
window.termTf  = '1D';
window.dayChange = {}; // sym -> real % change once charted (replaces fictional-base %)
var _term = { price: null, rsi: null, macd: null, ready: false, syncing: false, series: {} };
var TF_LIST = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

// ─── THEME PALETTE ───────────────────────────────────────
function termPalette() {
  var light = document.documentElement.classList.contains('light');
  return {
    bg: 'transparent',
    text: light ? '#5a7268' : '#7f9a90',
    grid: light ? 'rgba(15,32,25,.06)' : 'rgba(255,255,255,.05)',
    border: light ? 'rgba(15,32,25,.10)' : 'rgba(255,255,255,.08)',
    up: light ? '#0f9d6e' : '#2fe3a4',
    down: '#ff5c72',
    line: light ? '#0f9d6e' : '#4fd6c4',
    macd: light ? '#0f9d6e' : '#2fe3a4',
    signal: '#f5c451'
  };
}

function termChartOpts(h) {
  var p = termPalette();
  return {
    height: h,
    layout: { background: { type: 'solid', color: p.bg }, textColor: p.text, fontFamily: 'Inter, sans-serif', fontSize: 11 },
    grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
    rightPriceScale: { borderColor: p.border },
    timeScale: { borderColor: p.border, timeVisible: true, secondsVisible: false },
    crosshair: { mode: 0 },
    handleScale: { axisPressedMouseMove: true },
  };
}

// ─── INDICATOR MATH ──────────────────────────────────────
function ema(values, period) {
  var k = 2 / (period + 1), out = [], prev;
  for (var i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function computeRSI(closes, period) {
  period = period || 14;
  var out = [], gain = 0, loss = 0;
  for (var i = 1; i < closes.length; i++) {
    var ch = closes[i] - closes[i - 1];
    var g = ch > 0 ? ch : 0, l = ch < 0 ? -ch : 0;
    if (i <= period) {
      gain += g; loss += l;
      if (i === period) {
        gain /= period; loss /= period;
        out[i] = 100 - 100 / (1 + (loss === 0 ? 100 : gain / loss));
      }
    } else {
      gain = (gain * (period - 1) + g) / period;
      loss = (loss * (period - 1) + l) / period;
      out[i] = 100 - 100 / (1 + (loss === 0 ? 100 : gain / loss));
    }
  }
  return out; // index-aligned, undefined for warmup
}

function computeMACD(closes) {
  var e12 = ema(closes, 12), e26 = ema(closes, 26);
  var macd = closes.map(function(_, i) { return e12[i] - e26[i]; });
  var signal = ema(macd, 9);
  var hist = macd.map(function(m, i) { return m - signal[i]; });
  return { macd: macd, signal: signal, hist: hist };
}

// ─── SYNTHETIC FALLBACK CANDLES ──────────────────────────
function synthCandles(base, n) {
  n = n || 80;
  var out = [], price = base, now = Math.floor(Date.now() / 1000);
  var step = 5 * 60; // 5-min bars
  // Walk backwards then reverse so the last close ≈ base
  var seq = [];
  for (var i = 0; i < n; i++) {
    var drift = price * (Math.random() * 0.012 - 0.006);
    var o = price, c = price + drift;
    var hi = Math.max(o, c) * (1 + Math.random() * 0.004);
    var lo = Math.min(o, c) * (1 - Math.random() * 0.004);
    seq.push({ o: o, h: hi, l: lo, c: c, v: Math.round(1e5 + Math.random() * 9e5) });
    price = c;
  }
  // Normalize so last close lands on base
  var factor = base / price;
  for (var j = 0; j < n; j++) {
    var k = seq[j];
    out.push({
      t: now - (n - 1 - j) * step,
      o: +(k.o * factor).toFixed(4), h: +(k.h * factor).toFixed(4),
      l: +(k.l * factor).toFixed(4), c: +(k.c * factor).toFixed(4), v: k.v
    });
  }
  return out;
}

// ─── CHART CREATION ──────────────────────────────────────
function termCreate() {
  if (_term.ready || typeof LightweightCharts === 'undefined') return;
  var p = termPalette();

  var price = LightweightCharts.createChart(document.getElementById('termChart'), termChartOpts(360));
  _term.series.candle = price.addCandlestickSeries({
    upColor: p.up, downColor: p.down, borderUpColor: p.up, borderDownColor: p.down,
    wickUpColor: p.up, wickDownColor: p.down
  });
  _term.series.vol = price.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
  _term.series.vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

  var rsi = LightweightCharts.createChart(document.getElementById('termRSI'), termChartOpts(110));
  _term.series.rsi = rsi.addLineSeries({ color: p.line, lineWidth: 2, priceLineVisible: false });

  var macd = LightweightCharts.createChart(document.getElementById('termMACD'), termChartOpts(120));
  _term.series.macdHist = macd.addHistogramSeries({ priceLineVisible: false });
  _term.series.macdLine = macd.addLineSeries({ color: p.macd, lineWidth: 1, priceLineVisible: false });
  _term.series.macdSig = macd.addLineSeries({ color: p.signal, lineWidth: 1, priceLineVisible: false });

  _term.price = price; _term.rsi = rsi; _term.macd = macd;
  _term.ready = true;

  // Sync time scales across the three charts
  var charts = [price, rsi, macd];
  charts.forEach(function(src) {
    src.timeScale().subscribeVisibleLogicalRangeChange(function(range) {
      if (_term.syncing || !range) return;
      _term.syncing = true;
      charts.forEach(function(dst) { if (dst !== src) dst.timeScale().setVisibleLogicalRange(range); });
      _term.syncing = false;
    });
  });

  window.addEventListener('resize', termResize);
}

function termResize() {
  if (!_term.ready) return;
  ['termChart', 'termRSI', 'termMACD'].forEach(function(id, i) {
    var el = document.getElementById(id);
    var ch = [_term.price, _term.rsi, _term.macd][i];
    if (el && ch) ch.applyOptions({ width: el.clientWidth });
  });
}

function termApplyTheme() {
  if (!_term.ready) return;
  var p = termPalette();
  [_term.price, _term.rsi, _term.macd].forEach(function(c) { c.applyOptions(termChartOpts(c.options().height)); });
  _term.series.candle.applyOptions({ upColor: p.up, downColor: p.down, borderUpColor: p.up, borderDownColor: p.down, wickUpColor: p.up, wickDownColor: p.down });
  _term.series.rsi.applyOptions({ color: p.line });
  _term.series.macdLine.applyOptions({ color: p.macd });
  _term.series.macdSig.applyOptions({ color: p.signal });
  if (termSym) termLoad();
}

// ─── DATA LOAD ───────────────────────────────────────────
function termLoad() {
  if (!_term.ready || !termSym) return;
  var sym = termSym, tf = termTf, market = currentMarket;
  var stk = ST.find(function(s) { return s.s === sym; });
  var base = (prices[sym] || (stk ? stk.p : 100));

  var srcEl = document.getElementById('termSource');
  if (srcEl) srcEl.textContent = 'Loading…';

  fetch('/api/candles?market=' + market + '&symbol=' + encodeURIComponent(sym) + '&tf=' + tf)
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (sym !== termSym || tf !== termTf) return; // stale
      var candles, live;
      if (j && j.ok && j.candles && j.candles.length) {
        candles = j.candles;
        live = candles[candles.length - 1].c;
        prices[sym] = live; // sync app price to real close
        if (srcEl) srcEl.textContent = (j.source === 'binance' ? 'Binance' : 'Yahoo Finance') + ' · real data';
      } else {
        candles = synthCandles(base);
        live = candles[candles.length - 1].c;
        if (srcEl) srcEl.textContent = 'Simulated data (live feed unavailable)';
      }
      termRender(candles, stk);
    })
    .catch(function() {
      if (sym !== termSym) return;
      var candles = synthCandles(base);
      if (srcEl) srcEl.textContent = 'Simulated data (offline)';
      termRender(candles, stk);
    });
}

function termRender(candles, stk) {
  var p = termPalette();
  var cd = candles.map(function(k) { return { time: k.t, open: k.o, high: k.h, low: k.l, close: k.c }; });
  var vd = candles.map(function(k) { return { time: k.t, value: k.v, color: k.c >= k.o ? 'rgba(47,227,164,.35)' : 'rgba(255,92,114,.35)' }; });
  _term.series.candle.setData(cd);
  _term.series.vol.setData(vd);

  var closes = candles.map(function(k) { return k.c; });
  var rsi = computeRSI(closes, 14);
  _term.series.rsi.setData(candles.map(function(k, i) { return rsi[i] != null ? { time: k.t, value: +rsi[i].toFixed(2) } : null; }).filter(Boolean));

  var m = computeMACD(closes);
  _term.series.macdHist.setData(candles.map(function(k, i) { return { time: k.t, value: +m.hist[i].toFixed(4), color: m.hist[i] >= 0 ? 'rgba(47,227,164,.5)' : 'rgba(255,92,114,.5)' }; }));
  _term.series.macdLine.setData(candles.map(function(k, i) { return { time: k.t, value: +m.macd[i].toFixed(4) }; }));
  _term.series.macdSig.setData(candles.map(function(k, i) { return { time: k.t, value: +m.signal[i].toFixed(4) }; }));

  _term.price.timeScale().fitContent();

  // Header OHLCV + price
  var last = candles[candles.length - 1], first = candles[0];
  var chg = last.c - first.c, chgPct = (chg / first.c) * 100, pos = chg >= 0;
  window.dayChange[termSym] = chgPct; // real change for the watchlist (replaces fictional-base %)
  setText('thPrice', fINR(last.c));
  var chgEl = document.getElementById('thChg');
  if (chgEl) {
    chgEl.className = 'th-chg num ' + (pos ? 'pos' : 'neg');
    chgEl.innerHTML = (pos ? '&#9650; +' : '&#9660; ') + fINR(Math.abs(chg)) + ' (' + (pos ? '+' : '') + chgPct.toFixed(2) + '%)';
  }
  setText('thOHLC', 'O ' + fmtN(last.o) + '  H ' + fmtN(last.h) + '  L ' + fmtN(last.l) + '  C ' + fmtN(last.c) + '  V ' + fmtVol(last.v));
  var rsiNow = rsi[rsi.length - 1];
  setText('rsiLbl', 'RSI (14)  ' + (rsiNow != null ? rsiNow.toFixed(2) : '—'));
  setText('macdLbl', 'MACD (12, 26, 9)  ' + m.macd[m.macd.length - 1].toFixed(2) + '  ' + m.signal[m.signal.length - 1].toFixed(2));

  // Refresh watchlist prices + dashboard number
  renderWatch(document.getElementById('mktQ') ? document.getElementById('mktQ').value : '');
}

// ─── HEADER / WATCHLIST ──────────────────────────────────
function selectSym(sym) {
  termSym = sym;
  var stk = ST.find(function(s) { return s.s === sym; });
  setText('thSym', sym);
  setText('thName', stk ? stk.n : '');
  var logo = document.getElementById('thLogo');
  if (logo) { logo.innerHTML = ''; logo.appendChild(mkLogo(sym, 38)); }
  var buy = document.getElementById('thBuy'), sell = document.getElementById('thSell');
  if (buy) buy.onclick = function() { openBS(sym, 'buy'); };
  if (sell) sell.onclick = function() { openBS(sym, 'sell'); };
  renderWatch(document.getElementById('mktQ') ? document.getElementById('mktQ').value : '');
  termLoad();
}

function renderIvBar() {
  var el = document.getElementById('termIv');
  if (!el) return;
  el.innerHTML = TF_LIST.map(function(tf) {
    return '<button class="iv-btn' + (tf === termTf ? ' on' : '') + '" onclick="setTf(\'' + tf + '\')">' + tf + '</button>';
  }).join('');
}

function setTf(tf) {
  termTf = tf;
  renderIvBar();
  termLoad();
}

function renderWatch(filter) {
  var el = document.getElementById('termWatch');
  if (!el) return;
  filter = (filter || '').toLowerCase();
  var list = ST.filter(function(s) {
    if (!filter) return true;
    return s.s.toLowerCase().includes(filter) || s.n.toLowerCase().includes(filter) || s.sec.toLowerCase().includes(filter);
  });
  el.innerHTML = list.map(function(s) {
    var pr = prices[s.s] || s.p;
    var ch = (s.s in window.dayChange)
      ? +window.dayChange[s.s].toFixed(2)
      : +((pr - s.p) / s.p * 100).toFixed(2);
    var pos = ch >= 0;
    return '<button class="watch-row' + (s.s === termSym ? ' on' : '') + '" onclick="selectSym(\'' + s.s + '\')">'
      + '<div class="watch-l"><span class="watch-sym">' + s.s + '</span><span class="watch-nm">' + s.n + '</span></div>'
      + '<div class="watch-r"><span class="watch-px num">' + fINR(pr) + '</span>'
      + '<span class="watch-ch num ' + (pos ? 'pos' : 'neg') + '">' + (pos ? '+' : '') + ch + '%</span></div>'
      + '</button>';
  }).join('') || '<div class="watch-empty">No matches</div>';
}

// ─── ENTRY POINTS ────────────────────────────────────────
function termEnsure() {
  termCreate();
  if (!termSym && ST.length) termSym = ST[0].s;
  renderIvBar();
  if (termSym) selectSym(termSym);
  setTimeout(termResize, 30);
}

function termOnMarketChange() {
  termSym = ST.length ? ST[0].s : null;
  renderWatch('');
  if (_term.ready && termSym) selectSym(termSym);
}

// ─── LIVE QUOTES (keep prices nearby across the app) ─────
function refreshQuotes() {
  if (!window.MKT || !ST.length) return;
  var market = currentMarket;
  var syms = ST.slice(0, 50).map(function(s) { return s.s; });
  fetch('/api/quotes?market=' + market + '&symbols=' + encodeURIComponent(syms.join(',')))
    .then(function(r) { return r.json(); })
    .then(function(j) {
      if (!j || !j.ok || market !== currentMarket) return;
      Object.keys(j.quotes).forEach(function(s) {
        var q = j.quotes[s];
        if (q && isFinite(q.p)) {
          prices[s] = q.p;
          if (isFinite(q.chg)) window.dayChange[s] = q.chg;
        }
      });
      if (typeof renderWatch === 'function') renderWatch(document.getElementById('mktQ') ? document.getElementById('mktQ').value : '');
      if (curPage === 'dashboard') {
        if (typeof renderHoldingsTable === 'function') renderHoldingsTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
      }
    })
    .catch(function() {});
}

// ─── STATIC-HOST FALLBACK (no Node backend) ──────────────
// Try a couple of public CORS proxies so Yahoo / Bloomberg work
// when the app is served from a static host without /api/*.
function proxiedFetch(url) {
  var proxies = ['https://corsproxy.io/?url=', 'https://api.allorigins.win/raw?url='];
  function tryAt(i) {
    if (i >= proxies.length) return Promise.reject(new Error('no proxy'));
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, 7000); // never hang the UI
    return fetch(proxies[i] + encodeURIComponent(url), { signal: ctrl.signal }).then(function(r) {
      clearTimeout(to);
      if (!r.ok) throw new Error('proxy ' + r.status);
      return r.text();
    }).catch(function() { clearTimeout(to); return tryAt(i + 1); });
  }
  return tryAt(0);
}

var INDEX_DEFS_C = [
  ['NIFTY 50', '^NSEI'], ['SENSEX', '^BSESN'], ['BANKNIFTY', '^NSEBANK'],
  ['FINNIFTY', 'NIFTY_FIN_SERVICE.NS'], ['MIDCPNIFTY', '^NSEMDCP50'],
  ['NASDAQ', '^IXIC'], ['S&P 500', '^GSPC'], ['DOW', '^DJI']
];

function fetchIndicesDirect() {
  var ysym = INDEX_DEFS_C.map(function(d) { return d[1]; }).join(',');
  var yurl = 'https://query1.finance.yahoo.com/v8/finance/spark?symbols=' + encodeURIComponent(ysym) + '&range=1d&interval=15m';
  return Promise.all([
    proxiedFetch(yurl).then(function(t) { return JSON.parse(t); }).catch(function() { return null; }),
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT').then(function(r) { return r.json(); }).catch(function() { return null; })
  ]).then(function(res) {
    var yj = res[0], btc = res[1], out = [];
    if (yj) INDEX_DEFS_C.forEach(function(d) {
      var q = yj[d[1]]; if (!q || !q.close) return;
      var c = q.close.filter(function(x) { return x != null; });
      if (!c.length) return;
      var last = c[c.length - 1], base = q.chartPreviousClose || q.previousClose || c[0];
      out.push({ name: d[0], value: last, chg: +(((last - base) / base) * 100).toFixed(2), cur: '' });
    });
    if (btc && btc.lastPrice) out.push({ name: 'BTC', value: +btc.lastPrice, chg: +(+btc.priceChangePercent).toFixed(2), cur: '$' });
    return out;
  });
}

function getIndices() {
  return fetch('/api/indices').then(function(r) { return r.json(); }).then(function(j) {
    if (j && j.indices && j.indices.length) return j.indices;
    throw new Error('no api');
  }).catch(function() { return fetchIndicesDirect(); });
}

function parseRSS(xml, limit) {
  var items = [], re = /<item>([\s\S]*?)<\/item>/g, m;
  var pick = function(b, tag) {
    var r = new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>').exec(b);
    if (!r) return '';
    return r[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ').trim();
  };
  while ((m = re.exec(xml)) && items.length < limit) {
    var b = m[1];
    items.push({ title: pick(b, 'title'), link: (/<link>([\s\S]*?)<\/link>/.exec(b) || [, ''])[1].trim(), time: pick(b, 'pubDate'), summary: pick(b, 'description').slice(0, 180), src: 'Bloomberg' });
  }
  return items.filter(function(i) { return i.title; });
}

function fetchNewsDirect() {
  return proxiedFetch('https://feeds.bloomberg.com/markets/news.rss')
    .then(function(xml) { return parseRSS(xml, 12); });
}

function getNews() {
  return fetch('/api/news').then(function(r) { return r.json(); }).then(function(j) {
    if (j && j.news && j.news.length) return j.news;
    throw new Error('no api');
  }).catch(function() { return fetchNewsDirect(); });
}

// ─── INDEX TICKER (dashboard motion line) ────────────────
function renderTicker() {
  var el = document.getElementById('ticker');
  if (!el) return;
  getIndices().then(function(indices) {
    if (!indices || !indices.length) return;
    var items = indices.map(function(ix) {
      var pos = ix.chg >= 0;
      var val = ix.cur === '$'
        ? '$' + Math.round(ix.value).toLocaleString('en-US')
        : ix.value.toLocaleString('en-US', { maximumFractionDigits: 2 });
      var prev = ix.value / (1 + ix.chg / 100);
      var pts = (ix.value - prev);
      var ptsStr = (pos ? '+' : '-') + Math.abs(pts).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return '<span class="tk-item"><span class="tk-name">' + ix.name + '</span>'
        + '<span class="tk-val">' + val + '</span>'
        + '<span class="tk-chg ' + (pos ? 'pos' : 'neg') + '">' + ptsStr + ' (' + Math.abs(ix.chg) + '%)</span></span>';
    }).join('');
    // Duplicate the strip so the marquee loops seamlessly
    el.innerHTML = '<div class="tk-track">' + items + items + '</div>';
  }).catch(function() {});
}

// ─── "YOUR INVESTMENTS" CARD (dashboard sidebar) ─────────
function renderInvestCard() {
  var el = document.getElementById('investCard');
  if (!el || typeof calcPortfolio !== 'function') return;

  if (!HOLDS.length) {
    el.innerHTML = '<div class="iv-hd"><span>Your investments</span></div>'
      + '<div class="iv-empty"><div class="iv-empty-ic">&#128202;</div>'
      + '<div class="iv-empty-t">You haven’t invested yet</div>'
      + '<button class="iv-cta" onclick="navTo(\'market\',document.querySelector(\'.tn-link[data-page=market]\'))">Explore market &#8594;</button></div>';
    return;
  }

  var port = calcPortfolio();
  // Today's change weighted by holding value (uses real day-change where known)
  var todayAmt = 0;
  HOLDS.forEach(function(h) {
    var stk = ST.find(function(s) { return s.s === h.sym; });
    var pr = prices[h.sym] || (stk ? stk.p : 0);
    var val = h.qty * pr;
    var dc = (window.dayChange && (h.sym in window.dayChange)) ? window.dayChange[h.sym] : 0;
    todayAmt += val * dc / 100;
  });
  var todayPct = port.totalValue ? (todayAmt / port.totalValue * 100) : 0;
  var tPos = todayAmt >= 0, oPos = port.totalGain >= 0;

  var rows = HOLDS.slice().map(function(h) {
    var stk = ST.find(function(s) { return s.s === h.sym; });
    var pr = prices[h.sym] || (stk ? stk.p : 0);
    var val = h.qty * pr, inv = h.qty * h.avgPrice;
    var pl = inv ? ((val - inv) / inv * 100) : 0;
    return { sym: h.sym, name: stk ? stk.n : h.sym, val: val, pl: pl };
  }).sort(function(a, b) { return b.val - a.val; });

  el.innerHTML = '<div class="iv-hd"><span>Your investments</span>'
    + '<button class="iv-all" onclick="navTo(\'market\',document.querySelector(\'.tn-link[data-page=market]\'))">View all</button></div>'
    + '<div class="iv-value num">' + fINR(port.totalValue) + '</div>'
    + '<div class="iv-today num ' + (tPos ? 'pos' : 'neg') + '">' + (tPos ? '▲ +' : '▼ ') + fINR(Math.abs(todayAmt)) + ' (' + (tPos ? '+' : '') + todayPct.toFixed(2) + '%) today</div>'
    + '<div class="iv-stats">'
    + '<div><span class="iv-k">Invested</span><span class="iv-v num">' + fINR(port.totalInvested) + '</span></div>'
    + '<div><span class="iv-k">Total returns</span><span class="iv-v num ' + (oPos ? 'pos' : 'neg') + '">' + (oPos ? '+' : '') + fINR(port.totalGain) + ' (' + port.gainPct.toFixed(1) + '%)</span></div>'
    + '</div>'
    + '<div class="iv-list">' + rows.map(function(r) {
        var pos = r.pl >= 0;
        return '<button class="iv-row" onclick="navTo(\'market\',document.querySelector(\'.tn-link[data-page=market]\'));selectSym(\'' + r.sym + '\')">'
          + '<div class="iv-row-l"><span class="iv-row-sym">' + r.sym + '</span><span class="iv-row-nm">' + r.name + '</span></div>'
          + '<div class="iv-row-r"><span class="iv-row-val num">' + fINR(r.val) + '</span>'
          + '<span class="iv-row-pl num ' + (pos ? 'pos' : 'neg') + '">' + (pos ? '+' : '') + r.pl.toFixed(1) + '%</span></div></button>';
      }).join('') + '</div>';
}

// ─── BLOOMBERG NEWS TABLE (dashboard) ────────────────────
function renderNews() {
  var el = document.getElementById('newsList');
  if (!el) return;
  if (!el.dataset.loaded) el.innerHTML = '<div class="news-empty">Loading market news…</div>';
  getNews().then(function(news) {
    if (!news || !news.length) { el.innerHTML = '<div class="news-empty">News feed unavailable.</div>'; return; }
    el.dataset.loaded = '1';
    news = rankNewsByPortfolio(news);
    el.innerHTML = news.map(function(n) {
      return '<a class="news-row" href="' + n.link + '" target="_blank" rel="noopener noreferrer">'
        + '<div class="news-main"><div class="news-title">' + n.title
        + (n._match ? ' <span class="news-rel" style="font-size:10px;font-weight:700;background:rgba(0,200,150,.15);color:var(--gr);padding:1px 6px;border-radius:999px;white-space:nowrap;">' + n._match + '</span>' : '')
        + '</div>'
        + (n.summary ? '<div class="news-sum">' + n.summary + '</div>' : '') + '</div>'
        + '<div class="news-meta"><span class="news-src">' + (n.src || 'Bloomberg') + '</span>'
        + '<span class="news-time">' + relTime(n.time) + '</span></div></a>';
    }).join('');
  }).catch(function() { el.innerHTML = '<div class="news-empty">News feed unavailable.</div>'; });
}

// Rank news so stories relevant to the user's holdings / watchlist / sectors
// surface first. Each matched item is tagged so it's clear *why* it's shown.
function rankNewsByPortfolio(news) {
  var owned = (typeof HOLDS !== 'undefined' ? HOLDS : []).map(function(h) { return h.sym; });
  var watched = (typeof watchlist !== 'undefined' ? watchlist : []);
  var symbols = owned.concat(watched);
  if (!symbols.length) return news;

  // Build keyword → label map from the active market's stock list.
  var terms = [];
  symbols.forEach(function(sym) {
    var stk = ST.find(function(s) { return s.s === sym; });
    var label = owned.indexOf(sym) !== -1 ? 'Your holding' : 'Watchlist';
    // First word of the company name (e.g. "Apple", "NVIDIA"), plus the ticker.
    var nameWord = stk ? stk.n.split(/[\s.]/)[0] : sym;
    terms.push({ kw: sym.toLowerCase(), label: label, w: 3 });
    if (nameWord && nameWord.length >= 3) terms.push({ kw: nameWord.toLowerCase(), label: label, w: 3 });
    if (stk) terms.push({ kw: stk.sec.toLowerCase(), label: stk.sec, w: 1 });
  });

  news.forEach(function(n, i) {
    var hay = ((n.title || '') + ' ' + (n.summary || '')).toLowerCase();
    var best = 0, bestLabel = null;
    terms.forEach(function(t) {
      // word-boundary-ish match to avoid spurious substring hits
      var re = new RegExp('(^|[^a-z0-9])' + t.kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
      if (re.test(hay) && t.w > best) { best = t.w; bestLabel = t.label; }
    });
    n._score = best;
    n._origin = i; // stable order for ties
    n._match = best >= 3 ? bestLabel : null; // only badge strong (name/ticker) matches
  });

  return news.slice().sort(function(a, b) {
    if (b._score !== a._score) return b._score - a._score;
    return a._origin - b._origin;
  });
}

function relTime(s) {
  var d = new Date(s); if (isNaN(d)) return '';
  var diff = (Date.now() - d) / 60000;
  if (diff < 60) return Math.max(1, Math.round(diff)) + 'm ago';
  if (diff < 1440) return Math.round(diff / 60) + 'h ago';
  return Math.round(diff / 1440) + 'd ago';
}

// ─── HELPERS ─────────────────────────────────────────────
function setText(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; }
function fmtN(n) { return (+n).toLocaleString(MKT.locale, { maximumFractionDigits: n < 1 ? 5 : 2 }); }
function fmtVol(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return String(v);
}
