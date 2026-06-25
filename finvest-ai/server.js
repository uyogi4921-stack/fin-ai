/* ═══════════════════════════════════════════════════════════
   FINVEST AI — Backend Server
   Express server with user data storage and admin panel

   Usage:
     npm start          → Production (port 3000)
     npm run dev         → Development with auto-reload
═══════════════════════════════════════════════════════════ */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIG ─────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'finvest2024';
const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const ADMIN_TOKENS = new Set();

// ─── MIDDLEWARE ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, {
  index: 'index.html',
  extensions: ['html']
}));

// CORS for local development
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// ─── DATA HELPERS ────────────────────────────────────────
function readUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '{}');
    }
    var raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('Error reading users:', e.message);
    return {};
  }
}

function writeUsers(data) {
  try {
    var dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing users:', e.message);
  }
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

// ─── ADMIN AUTH ──────────────────────────────────────────
function adminAuth(req, res, next) {
  var token = req.headers.authorization;
  if (!token || !ADMIN_TOKENS.has(token)) {
    return res.status(401).json({ error: 'Unauthorized — admin login required' });
  }
  next();
}

// ─── API: ADMIN LOGIN ────────────────────────────────────
app.post('/api/admin/login', function(req, res) {
  var password = req.body.password;
  if (password === ADMIN_PASSWORD) {
    var token = crypto.randomBytes(32).toString('hex');
    ADMIN_TOKENS.add(token);
    // Clean old tokens (keep max 10)
    if (ADMIN_TOKENS.size > 10) {
      var arr = Array.from(ADMIN_TOKENS);
      ADMIN_TOKENS.delete(arr[0]);
    }
    res.json({ success: true, token: token });
  } else {
    res.status(403).json({ error: 'Invalid password' });
  }
});

// ─── API: USER SYNC ──────────────────────────────────────
// Users send their data to the server for admin visibility
app.post('/api/users/sync', function(req, res) {
  var data = req.body;
  if (!data || !data.profile || !data.profile.name) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  var users = readUsers();
  var userId = data.userId || generateId();

  users[userId] = {
    id: userId,
    profile: {
      name: data.profile.name,
      avatar: data.profile.avatar || '',
      goal: data.profile.goal || '',
      risk: data.profile.risk || 'moderate',
      createdAt: data.profile.createdAt || Date.now()
    },
    stats: {
      xp: data.xp || 0,
      level: data.level || 'Level 1',
      streak: data.streak || 0,
      lessonsCompleted: data.lessonsCompleted || 0,
      totalTrades: data.totalTrades || 0,
      holdingsCount: data.holdingsCount || 0,
      portfolioValue: data.portfolioValue || 0,
      walletBalance: data.walletBalance || 0
    },
    holdings: (data.holdings || []).map(function(h) {
      return { sym: h.sym, qty: h.qty, avgPrice: h.avgPrice };
    }),
    recentTrades: (data.recentTrades || []).slice(0, 20),
    lastActive: Date.now(),
    lastIP: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: (req.headers['user-agent'] || '').substring(0, 200)
  };

  writeUsers(users);
  res.json({ success: true, userId: userId });
});

// ─── API: ADMIN — GET ALL USERS ──────────────────────────
app.get('/api/admin/users', adminAuth, function(req, res) {
  var users = readUsers();
  var list = Object.values(users);

  // Sort by last active (most recent first)
  list.sort(function(a, b) { return (b.lastActive || 0) - (a.lastActive || 0); });

  // Compute summary stats
  var totalUsers = list.length;
  var activeToday = list.filter(function(u) {
    return (Date.now() - (u.lastActive || 0)) < 86400000;
  }).length;
  var totalXP = list.reduce(function(sum, u) { return sum + (u.stats.xp || 0); }, 0);
  var totalTrades = list.reduce(function(sum, u) { return sum + (u.stats.totalTrades || 0); }, 0);

  res.json({
    summary: {
      totalUsers: totalUsers,
      activeToday: activeToday,
      totalXP: totalXP,
      totalTrades: totalTrades
    },
    users: list
  });
});

// ─── API: ADMIN — GET SINGLE USER ────────────────────────
app.get('/api/admin/users/:id', adminAuth, function(req, res) {
  var users = readUsers();
  var user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ─── API: ADMIN — DELETE USER ────────────────────────────
app.delete('/api/admin/users/:id', adminAuth, function(req, res) {
  var users = readUsers();
  if (!users[req.params.id]) return res.status(404).json({ error: 'User not found' });
  delete users[req.params.id];
  writeUsers(users);
  res.json({ success: true });
});

// ─── API: ADMIN — DASHBOARD STATS ────────────────────────
app.get('/api/admin/stats', adminAuth, function(req, res) {
  var users = readUsers();
  var list = Object.values(users);

  var now = Date.now();
  var oneDay = 86400000;
  var oneWeek = 7 * oneDay;

  // Activity over time
  var activeToday = 0, activeWeek = 0;
  var sectorMap = {};
  var levelMap = {};
  var tradesByDay = {};

  list.forEach(function(u) {
    if (now - (u.lastActive || 0) < oneDay) activeToday++;
    if (now - (u.lastActive || 0) < oneWeek) activeWeek++;

    var lv = u.stats.level || 'Level 1';
    levelMap[lv] = (levelMap[lv] || 0) + 1;

    (u.holdings || []).forEach(function(h) {
      sectorMap[h.sym] = (sectorMap[h.sym] || 0) + 1;
    });

    (u.recentTrades || []).forEach(function(t) {
      var day = new Date(t.time).toDateString();
      tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });
  });

  // Top stocks held
  var topStocks = Object.keys(sectorMap).sort(function(a, b) {
    return sectorMap[b] - sectorMap[a];
  }).slice(0, 10).map(function(s) {
    return { sym: s, count: sectorMap[s] };
  });

  res.json({
    totalUsers: list.length,
    activeToday: activeToday,
    activeWeek: activeWeek,
    levelDistribution: levelMap,
    topStocks: topStocks,
    tradesByDay: tradesByDay
  });
});

// ─── API: ADMIN — CHANGE PASSWORD ────────────────────────
app.post('/api/admin/change-password', adminAuth, function(req, res) {
  var newPass = req.body.newPassword;
  if (!newPass || newPass.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  // Write to a config file
  var configFile = path.join(__dirname, 'data', 'config.json');
  var config = {};
  try {
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
  } catch(e) {}
  config.adminPassword = newPass;
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  res.json({ success: true, message: 'Password changed. Restart server to apply.' });
});

// ═══════════════════════════════════════════════════════════
//  MARKET DATA PROXY  — real OHLC for US/IN stocks + crypto
//  Binance (crypto) + Yahoo Finance (stocks). No API key.
//  Server-side fetch sidesteps browser CORS.
// ═══════════════════════════════════════════════════════════

// App symbol → Yahoo NSE ticker (India). Unmapped → synthetic fallback on client.
const IN_YF = {
  TCS:'TCS.NS', INFY:'INFY.NS', WIPRO:'WIPRO.NS', HCLT:'HCLTECH.NS', TECHM:'TECHM.NS',
  HDFC:'HDFCBANK.NS', ICICI:'ICICIBANK.NS', SBI:'SBIN.NS', AXIS:'AXISBANK.NS', KOTAK:'KOTAKBANK.NS',
  RELI:'RELIANCE.NS', ONGC:'ONGC.NS', BPCL:'BPCL.NS', IOC:'IOC.NS',
  TATAM:'TATAMOTORS.NS', MM:'M&M.NS', MARUTI:'MARUTI.NS', BAJAJ:'BAJAJ-AUTO.NS', HERO:'HEROMOTOCO.NS', EICH:'EICHERMOT.NS', TVSL:'TVSMOTOR.NS',
  HUL:'HINDUNILVR.NS', ITC:'ITC.NS', NEST:'NESTLEIND.NS', DABR:'DABUR.NS', BRIT:'BRITANNIA.NS', TITN:'TITAN.NS', APNT:'ASIANPAINT.NS',
  SUN:'SUNPHARMA.NS', DRL:'DRREDDY.NS', CIPLA:'CIPLA.NS', DIVI:'DIVISLAB.NS', APLS:'APOLLOHOSP.NS',
  BRTI:'BHARTIARTL.NS', IDEA:'IDEA.NS', TCOM:'TATACOMM.NS',
  LART:'LT.NS', ULTC:'ULTRACEMCO.NS', GRAS:'GRASIM.NS', ADNP:'ADANIPORTS.NS', ADNE2:'ADANIENT.NS', DLFC:'DLF.NS',
  TATA:'TATASTEEL.NS', JSWL:'JSWSTEEL.NS', HNDL:'HINDALCO.NS', VEDL:'VEDL.NS', COAL:'COALINDIA.NS',
  NTPC:'NTPC.NS', PWGR:'POWERGRID.NS', TPOW:'TATAPOWER.NS', GAIL:'GAIL.NS',
  BAFL:'BAJFINANCE.NS', BAFN:'BAJAJFINSV.NS', INDB:'INDUSINDBK.NS', BOB:'BANKBARODA.NS', PNB:'PNB.NS',
  ZOMM:'ZOMATO.NS', NYKA:'NYKAA.NS', PAYT:'PAYTM.NS', LICI:'LICI.NS', SICC:'SIEMENS.NS'
};

// US: app symbols are real tickers; only dotted classes need a tweak
const US_YF = { 'BRK.B':'BRK-B' };

// timeframe token → { binance:[interval,limit], yahoo:[interval,range] }
const TF = {
  '1D':  { bin:['5m', 78],   yf:['5m','1d'] },
  '1W':  { bin:['30m', 240], yf:['30m','5d'] },
  '1M':  { bin:['1d', 31],   yf:['1d','1mo'] },
  '3M':  { bin:['1d', 92],   yf:['1d','3mo'] },
  '1Y':  { bin:['1d', 365],  yf:['1d','1y'] },
  '5Y':  { bin:['1w', 260],  yf:['1wk','5y'] }
};

const _candleCache = new Map(); // key -> { t, data }
const CACHE_MS = 30000;

async function fetchBinance(symbol, tf) {
  const m = TF[tf] || TF['1D'];
  const pair = symbol.toUpperCase() + 'USDT';
  const url = 'https://api.binance.com/api/v3/klines?symbol=' + pair +
    '&interval=' + m.bin[0] + '&limit=' + m.bin[1];
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('binance ' + r.status);
  const rows = await r.json();
  return rows.map(function(k) {
    return { t: Math.floor(k[0] / 1000), o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] };
  });
}

async function fetchYahoo(ticker, tf) {
  const m = TF[tf] || TF['1D'];
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(ticker) + '?interval=' + m.yf[0] + '&range=' + m.yf[1];
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = await r.json();
  const res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res || !res.timestamp) throw new Error('yahoo empty');
  const q = res.indicators.quote[0];
  const out = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    if (q.close[i] == null || q.open[i] == null) continue;
    out.push({ t: res.timestamp[i], o: +q.open[i], h: +q.high[i], l: +q.low[i], c: +q.close[i], v: +(q.volume[i] || 0) });
  }
  return out;
}

app.get('/api/candles', async function(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const symbol = (req.query.symbol || '').toUpperCase();
  const tf = TF[req.query.tf] ? req.query.tf : '1D';
  if (!symbol) return res.status(400).json({ ok: false, error: 'symbol required' });

  const key = market + ':' + symbol + ':' + tf;
  const hit = _candleCache.get(key);
  if (hit && Date.now() - hit.t < CACHE_MS) {
    return res.json({ ok: true, source: hit.source, cached: true, candles: hit.data });
  }

  try {
    let data, source;
    if (market === 'CRYPTO') {
      data = await fetchBinance(symbol, tf); source = 'binance';
    } else {
      const ticker = market === 'IN'
        ? (IN_YF[symbol] || (symbol + '.NS'))
        : (US_YF[symbol] || symbol);
      data = await fetchYahoo(ticker, tf); source = 'yahoo';
    }
    if (!data || !data.length) throw new Error('no data');
    _candleCache.set(key, { t: Date.now(), data: data, source: source });
    res.json({ ok: true, source: source, candles: data });
  } catch (e) {
    // Client falls back to synthetic candles seeded from base price.
    res.json({ ok: false, error: String(e.message || e) });
  }
});

function ynTicker(market, sym) {
  if (market === 'IN') return IN_YF[sym] || (sym + '.NS');
  return US_YF[sym] || sym;
}

// ─── API: BATCH QUOTES (keep prices nearby) ──────────────
const _quoteCache = new Map();
app.get('/api/quotes', async function(req, res) {
  const market = (req.query.market || 'US').toUpperCase();
  const syms = (req.query.symbols || '').split(',').map(function(s){return s.trim().toUpperCase();}).filter(Boolean);
  if (!syms.length) return res.json({ ok: true, quotes: {} });
  const key = market + ':' + syms.join(',');
  const hit = _quoteCache.get(key);
  if (hit && Date.now() - hit.t < 30000) return res.json({ ok: true, cached: true, quotes: hit.data });

  try {
    const quotes = {};
    if (market === 'CRYPTO') {
      const pairs = syms.map(function(s){ return '"' + s + 'USDT"'; }).join(',');
      const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=[' + encodeURIComponent(pairs) + ']', { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const arr = await r.json();
      (Array.isArray(arr) ? arr : []).forEach(function(d){
        const s = String(d.symbol).replace('USDT','');
        quotes[s] = { p: +d.lastPrice, chg: +d.priceChangePercent };
      });
    } else {
      const map = {}; // ticker -> appSym
      const tickers = syms.map(function(s){ const t = ynTicker(market, s); map[t] = s; return t; });
      const url = 'https://query1.finance.yahoo.com/v8/finance/spark?symbols=' + encodeURIComponent(tickers.join(',')) + '&range=1d&interval=15m';
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      const j = await r.json();
      Object.keys(j || {}).forEach(function(tk){
        const d = j[tk]; if (!d || !d.close) return;
        const closes = d.close.filter(function(x){ return x != null; });
        if (!closes.length) return;
        const last = closes[closes.length - 1];
        const base = d.chartPreviousClose || d.previousClose || closes[0];
        quotes[map[tk] || tk] = { p: +last, chg: +(((last - base) / base) * 100) };
      });
    }
    _quoteCache.set(key, { t: Date.now(), data: quotes });
    res.json({ ok: true, quotes: quotes });
  } catch (e) {
    res.json({ ok: false, error: String(e.message || e) });
  }
});

// ─── API: MARKET INDICES (ticker tape) ───────────────────
const INDEX_DEFS = [
  { name: 'NIFTY 50',   yf: '^NSEI' },
  { name: 'SENSEX',     yf: '^BSESN' },
  { name: 'BANKNIFTY',  yf: '^NSEBANK' },
  { name: 'FINNIFTY',   yf: 'NIFTY_FIN_SERVICE.NS' },
  { name: 'MIDCPNIFTY', yf: '^NSEMDCP50' },
  { name: 'NASDAQ',     yf: '^IXIC' },
  { name: 'S&P 500',    yf: '^GSPC' },
  { name: 'DOW',        yf: '^DJI' },
];
let _indexCache = null;
app.get('/api/indices', async function(req, res) {
  if (_indexCache && Date.now() - _indexCache.t < 45000) return res.json({ ok: true, cached: true, indices: _indexCache.data });
  const out = [];
  try {
    const tickers = INDEX_DEFS.map(function(d){ return d.yf; }).join(',');
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/spark?symbols=' + encodeURIComponent(tickers) + '&range=1d&interval=15m', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
    const j = await r.json();
    INDEX_DEFS.forEach(function(d){
      const q = j && j[d.yf];
      if (q && q.close) {
        const closes = q.close.filter(function(x){ return x != null; });
        const last = closes[closes.length - 1];
        const base = q.chartPreviousClose || q.previousClose || closes[0];
        out.push({ name: d.name, value: last, chg: +(((last - base) / base) * 100).toFixed(2), cur: d.name.indexOf('S&P') === 0 || d.name === 'NASDAQ' ? '' : '' });
      }
    });
  } catch (e) {}
  try {
    const b = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const bj = await b.json();
    if (bj && bj.lastPrice) out.push({ name: 'BTC', value: +bj.lastPrice, chg: +(+bj.priceChangePercent).toFixed(2), cur: '$' });
  } catch (e) {}
  if (out.length) _indexCache = { t: Date.now(), data: out };
  res.json({ ok: out.length > 0, indices: out });
});

// ─── API: NEWS (Bloomberg markets RSS) ───────────────────
let _newsCache = null;
function rssItems(xml, limit) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  const pick = function(block, tag) {
    const r = new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>').exec(block);
    if (!r) return '';
    return r[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
  };
  while ((m = re.exec(xml)) && items.length < limit) {
    const b = m[1];
    items.push({
      title: pick(b, 'title'),
      link: (/<link>([\s\S]*?)<\/link>/.exec(b) || [, ''])[1].trim(),
      time: pick(b, 'pubDate'),
      summary: pick(b, 'description').slice(0, 180)
    });
  }
  return items;
}
app.get('/api/news', async function(req, res) {
  if (_newsCache && Date.now() - _newsCache.t < 300000) return res.json({ ok: true, cached: true, news: _newsCache.data });
  const feeds = [
    { src: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { src: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' }
  ];
  for (const f of feeds) {
    try {
      const r = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const xml = await r.text();
      const items = rssItems(xml, 12).map(function(it){ it.src = f.src; return it; }).filter(function(it){ return it.title; });
      if (items.length) { _newsCache = { t: Date.now(), data: items }; return res.json({ ok: true, news: items }); }
    } catch (e) {}
  }
  res.json({ ok: false, news: [] });
});

// ─── SERVE ADMIN PAGE ────────────────────────────────────
app.get('/admin', function(req, res) {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ─── FALLBACK — SPA ──────────────────────────────────────
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START SERVER ────────────────────────────────────────
app.listen(PORT, function() {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║   FINVEST AI — Server Running             ║');
  console.log('  ║                                           ║');
  console.log('  ║   App:   http://localhost:' + PORT + '             ║');
  console.log('  ║   Admin: http://localhost:' + PORT + '/admin       ║');
  console.log('  ║                                           ║');
  console.log('  ║   Admin Password: ' + ADMIN_PASSWORD + '          ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});
