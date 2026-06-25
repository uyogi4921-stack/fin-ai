const { TF, US_YF, IN_YF, fetchBinance, fetchYahoo, cors } = require('./_data');

module.exports = async function (req, res) {
  cors(res);
  const market = String(req.query.market || 'US').toUpperCase();
  const symbol = String(req.query.symbol || '').toUpperCase();
  const tf = TF[req.query.tf] ? req.query.tf : '1D';
  if (!symbol) { res.status(400).json({ ok: false, error: 'symbol required' }); return; }

  try {
    let data, source;
    if (market === 'CRYPTO') {
      data = await fetchBinance(symbol, tf); source = 'binance';
    } else {
      const ticker = market === 'IN' ? (IN_YF[symbol] || (symbol + '.NS')) : (US_YF[symbol] || symbol);
      data = await fetchYahoo(ticker, tf); source = 'yahoo';
    }
    if (!data || !data.length) throw new Error('no data');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.json({ ok: true, source: source, candles: data });
  } catch (e) {
    res.json({ ok: false, error: String(e.message || e) });
  }
};
