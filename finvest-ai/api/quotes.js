const { ynTicker, UA, cors } = require('./_data');

module.exports = async function (req, res) {
  cors(res);
  const market = String(req.query.market || 'US').toUpperCase();
  const syms = String(req.query.symbols || '').split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
  if (!syms.length) { res.json({ ok: true, quotes: {} }); return; }

  try {
    const quotes = {};
    if (market === 'CRYPTO') {
      const pairs = syms.map(function (s) { return '"' + s + 'USDT"'; }).join(',');
      const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=[' + encodeURIComponent(pairs) + ']', { headers: UA });
      const arr = await r.json();
      (Array.isArray(arr) ? arr : []).forEach(function (d) {
        quotes[String(d.symbol).replace('USDT', '')] = { p: +d.lastPrice, chg: +d.priceChangePercent };
      });
    } else {
      const map = {};
      const tickers = syms.map(function (s) { const t = ynTicker(market, s); map[t] = s; return t; });
      const url = 'https://query1.finance.yahoo.com/v8/finance/spark?symbols=' + encodeURIComponent(tickers.join(',')) + '&range=1d&interval=15m';
      const r = await fetch(url, { headers: UA });
      const j = await r.json();
      Object.keys(j || {}).forEach(function (tk) {
        const d = j[tk]; if (!d || !d.close) return;
        const closes = d.close.filter(function (x) { return x != null; });
        if (!closes.length) return;
        const last = closes[closes.length - 1];
        const base = d.chartPreviousClose || d.previousClose || closes[0];
        quotes[map[tk] || tk] = { p: +last, chg: +(((last - base) / base) * 100) };
      });
    }
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.json({ ok: true, quotes: quotes });
  } catch (e) {
    res.json({ ok: false, error: String(e.message || e) });
  }
};
