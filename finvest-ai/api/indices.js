const { INDEX_DEFS, UA, cors } = require('./_data');

module.exports = async function (req, res) {
  cors(res);
  const out = [];
  try {
    const tickers = INDEX_DEFS.map(function (d) { return d.yf; }).join(',');
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/spark?symbols=' + encodeURIComponent(tickers) + '&range=1d&interval=15m', { headers: UA });
    const j = await r.json();
    INDEX_DEFS.forEach(function (d) {
      const q = j && j[d.yf];
      if (q && q.close) {
        const closes = q.close.filter(function (x) { return x != null; });
        const last = closes[closes.length - 1];
        const base = q.chartPreviousClose || q.previousClose || closes[0];
        out.push({ name: d.name, value: last, chg: +(((last - base) / base) * 100).toFixed(2), cur: '' });
      }
    });
  } catch (e) {}
  try {
    const b = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', { headers: UA });
    const bj = await b.json();
    if (bj && bj.lastPrice) out.push({ name: 'BTC', value: +bj.lastPrice, chg: +(+bj.priceChangePercent).toFixed(2), cur: '$' });
  } catch (e) {}
  res.setHeader('Cache-Control', 's-maxage=45, stale-while-revalidate=90');
  res.json({ ok: out.length > 0, indices: out });
};
