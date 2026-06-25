/* Shared market-data helpers for the Vercel serverless functions.
   Files prefixed with "_" are not exposed as routes. */

// App symbol → Yahoo NSE ticker (India). Unmapped → "<SYM>.NS".
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
const US_YF = { 'BRK.B': 'BRK-B' };

const TF = {
  '1D': { bin: ['5m', 78],  yf: ['5m', '1d'] },
  '1W': { bin: ['30m', 240], yf: ['30m', '5d'] },
  '1M': { bin: ['1d', 31],  yf: ['1d', '1mo'] },
  '3M': { bin: ['1d', 92],  yf: ['1d', '3mo'] },
  '1Y': { bin: ['1d', 365], yf: ['1d', '1y'] },
  '5Y': { bin: ['1w', 260], yf: ['1wk', '5y'] }
};

const INDEX_DEFS = [
  { name: 'NIFTY 50',   yf: '^NSEI' },
  { name: 'SENSEX',     yf: '^BSESN' },
  { name: 'BANKNIFTY',  yf: '^NSEBANK' },
  { name: 'FINNIFTY',   yf: 'NIFTY_FIN_SERVICE.NS' },
  { name: 'MIDCPNIFTY', yf: '^NSEMDCP50' },
  { name: 'NASDAQ',     yf: '^IXIC' },
  { name: 'S&P 500',    yf: '^GSPC' },
  { name: 'DOW',        yf: '^DJI' }
];

const UA = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

function ynTicker(market, sym) {
  if (market === 'IN') return IN_YF[sym] || (sym + '.NS');
  return US_YF[sym] || sym;
}

async function fetchBinance(symbol, tf) {
  const m = TF[tf] || TF['1D'];
  const url = 'https://api.binance.com/api/v3/klines?symbol=' + symbol.toUpperCase() + 'USDT&interval=' + m.bin[0] + '&limit=' + m.bin[1];
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error('binance ' + r.status);
  const rows = await r.json();
  return rows.map(function (k) { return { t: Math.floor(k[0] / 1000), o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }; });
}

async function fetchYahoo(ticker, tf) {
  const m = TF[tf] || TF['1D'];
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?interval=' + m.yf[0] + '&range=' + m.yf[1];
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = await r.json();
  const res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res || !res.timestamp) throw new Error('yahoo empty');
  const q = res.indicators.quote[0], out = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    if (q.close[i] == null || q.open[i] == null) continue;
    out.push({ t: res.timestamp[i], o: +q.open[i], h: +q.high[i], l: +q.low[i], c: +q.close[i], v: +(q.volume[i] || 0) });
  }
  return out;
}

function rssItems(xml, limit) {
  const items = [], re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  const pick = function (block, tag) {
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

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
}

module.exports = { IN_YF, US_YF, TF, INDEX_DEFS, UA, ynTicker, fetchBinance, fetchYahoo, rssItems, cors };
