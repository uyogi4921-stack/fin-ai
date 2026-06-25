/* ═══════════════════════════════════════════════════════════
   FINVEST AI — data.js
   Stock data, index data, SEBI booklet chapters, persistence
   To add a new stock: push to ST array below.
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── STOCK DATA ───────────────────────────────────────────
// s=symbol, n=name, sec=sector, p=base price, c=brand color, d=clearbit domain
window.ST = [
  { s:'TCS',    n:'Tata Consultancy',   sec:'IT',      p:3812,  c:'#1a5fab', d:'tcs.com' },
  { s:'INFY',   n:'Infosys Ltd.',        sec:'IT',      p:1634,  c:'#007cc3', d:'infosys.com' },
  { s:'WIPRO',  n:'Wipro Ltd.',          sec:'IT',      p:488,   c:'#341b6b', d:'wipro.com' },
  { s:'HCLT',   n:'HCL Technologies',   sec:'IT',      p:1456,  c:'#0076ce', d:'hcltech.com' },
  { s:'TECHM',  n:'Tech Mahindra',       sec:'IT',      p:1298,  c:'#c8102e', d:'techmahindra.com' },
  { s:'HDFC',   n:'HDFC Bank',          sec:'Banking', p:1623,  c:'#004c8f', d:'hdfcbank.com' },
  { s:'ICICI',  n:'ICICI Bank',         sec:'Banking', p:1087,  c:'#e07b39', d:'icicibank.com' },
  { s:'SBI',    n:'State Bank India',   sec:'Banking', p:798,   c:'#22409a', d:'sbi.co.in' },
  { s:'AXIS',   n:'Axis Bank',          sec:'Banking', p:1134,  c:'#97144d', d:'axisbank.com' },
  { s:'KOTAK',  n:'Kotak Mahindra',     sec:'Banking', p:1876,  c:'#cc2027', d:'kotak.com' },
  { s:'RELI',   n:'Reliance Inds.',     sec:'Energy',  p:2941,  c:'#0f3cc9', d:'ril.com' },
  { s:'ONGC',   n:'Oil & Nat. Gas',     sec:'Energy',  p:263,   c:'#b8860b', d:'ongcindia.com' },
  { s:'BPCL',   n:'Bharat Petroleum',   sec:'Energy',  p:612,   c:'#e86000', d:'bharatpetroleum.com' },
  { s:'IOC',    n:'Indian Oil Corp.',    sec:'Energy',  p:167,   c:'#003893', d:'iocl.com' },
  { s:'TATAM',  n:'Tata Motors',        sec:'Auto',    p:943,   c:'#1b3b6f', d:'tatamotors.com' },
  { s:'MM',     n:'Mahindra & M.',      sec:'Auto',    p:2156,  c:'#c8102e', d:'mahindra.com' },
  { s:'MARUTI', n:'Maruti Suzuki',      sec:'Auto',    p:11240, c:'#003087', d:'marutisuzuki.com' },
  { s:'BAJAJ',  n:'Bajaj Auto',          sec:'Auto',    p:8923,  c:'#1e4694', d:'bajajauto.com' },
  { s:'HUL',    n:'Hindustan Unilever', sec:'FMCG',    p:2456,  c:'#1f36c7', d:'hul.co.in' },
  { s:'ITC',    n:'ITC Limited',        sec:'FMCG',    p:453,   c:'#1a3a5c', d:'itcportal.com' },
  { s:'NEST',   n:'Nestle India',        sec:'FMCG',    p:2234,  c:'#9b1a26', d:'nestle.in' },
  { s:'SUN',    n:'Sun Pharma',         sec:'Pharma',  p:1623,  c:'#d35400', d:'sunpharma.com' },
  { s:'DRL',    n:"Dr Reddy's Labs",    sec:'Pharma',  p:5678,  c:'#8b0000', d:'drreddys.com' },
  { s:'CIPLA',  n:'Cipla Ltd.',          sec:'Pharma',  p:1456,  c:'#00539f', d:'cipla.com' },

  // ── MORE IT ──
  { s:'LTIM',   n:'LTIMindtree',        sec:'IT',      p:5432,  c:'#0057a8', d:'ltimindtree.com' },
  { s:'MPHL',   n:'Mphasis Ltd.',        sec:'IT',      p:2456,  c:'#00558a', d:'mphasis.com' },
  { s:'COFO',   n:'Coforge Ltd.',        sec:'IT',      p:5890,  c:'#003366', d:'coforge.com' },
  { s:'PERS',   n:'Persistent Systems',  sec:'IT',      p:4567,  c:'#1e3a5f', d:'persistent.com' },
  { s:'ZENS',   n:'Zensar Tech',         sec:'IT',      p:634,   c:'#2f5496', d:'zensar.com' },

  // ── MORE BANKING & FINANCE ──
  { s:'INDB',   n:'IndusInd Bank',       sec:'Banking', p:1456,  c:'#003a70', d:'indusind.com' },
  { s:'BNDH',   n:'Bandhan Bank',        sec:'Banking', p:234,   c:'#e42313', d:'bandhanbank.com' },
  { s:'FED',    n:'Federal Bank',        sec:'Banking', p:167,   c:'#003882', d:'federalbank.co.in' },
  { s:'IDFC',   n:'IDFC First Bank',     sec:'Banking', p:78,    c:'#d22026', d:'idfcfirstbank.com' },
  { s:'BOB',    n:'Bank of Baroda',      sec:'Banking', p:256,   c:'#e35205', d:'bankofbaroda.in' },
  { s:'PNB',    n:'Punjab Natl. Bank',   sec:'Banking', p:112,   c:'#003d7c', d:'pnbindia.in' },
  { s:'CNBK',   n:'Canara Bank',         sec:'Banking', p:105,   c:'#1a3b6e', d:'canarabank.com' },
  { s:'AUFI',   n:'AU Small Finance',    sec:'Banking', p:678,   c:'#8b2252', d:'aubank.in' },
  { s:'BAFL',   n:'Bajaj Finance',       sec:'Banking', p:7234,  c:'#003a7d', d:'bajajfinserv.in' },
  { s:'BAFN',   n:'Bajaj Finserv',       sec:'Banking', p:1678,  c:'#003a7d', d:'bajajfinserv.in' },
  { s:'SBIN',   n:'SBI Life Insurance',  sec:'Insurance', p:1534, c:'#1a4e8a', d:'sbilife.co.in' },
  { s:'HDFL',   n:'HDFC Life Ins.',      sec:'Insurance', p:645,  c:'#004c8f', d:'hdfclife.com' },

  // ── MORE ENERGY ──
  { s:'NTPC',   n:'NTPC Limited',        sec:'Energy',  p:356,   c:'#1b4f72', d:'ntpc.co.in' },
  { s:'PWGR',   n:'Power Grid Corp',     sec:'Energy',  p:298,   c:'#1a3f6b', d:'powergrid.in' },
  { s:'ADNE',   n:'Adani Energy',        sec:'Energy',  p:1034,  c:'#003b5c', d:'adanienergy.com' },
  { s:'ADNG',   n:'Adani Green',         sec:'Energy',  p:1678,  c:'#228b22', d:'adanigreenenergy.com' },
  { s:'TPOW',   n:'Tata Power',          sec:'Energy',  p:423,   c:'#1b3b6f', d:'tatapower.com' },
  { s:'COAL',   n:'Coal India',          sec:'Energy',  p:445,   c:'#2c3e50', d:'coalindia.in' },
  { s:'GAIL',   n:'GAIL India',          sec:'Energy',  p:198,   c:'#c0392b', d:'gailonline.com' },
  { s:'PLNG',   n:'Petronet LNG',        sec:'Energy',  p:312,   c:'#2980b9', d:'petronetlng.in' },

  // ── MORE AUTO ──
  { s:'HERO',   n:'Hero MotoCorp',       sec:'Auto',    p:4234,  c:'#cc0000', d:'heromotocorp.com' },
  { s:'EICH',   n:'Eicher Motors',        sec:'Auto',    p:4567,  c:'#4a2511', d:'eichermotors.com' },
  { s:'TVSL',   n:'TVS Motor Co.',       sec:'Auto',    p:2134,  c:'#003f87', d:'tvsmotor.com' },
  { s:'ASML',   n:'Ashok Leyland',       sec:'Auto',    p:198,   c:'#d42a2a', d:'ashokleyland.com' },
  { s:'TUBM',   n:'Tube Investments',    sec:'Auto',    p:3456,  c:'#1a3b5c', d:'tiindia.com' },
  { s:'MSMI',   n:'Motherson Sumi',      sec:'Auto',    p:134,   c:'#1a6b3c', d:'motherson.com' },
  { s:'BORE',   n:'Bosch India',          sec:'Auto',    p:29340, c:'#003f72', d:'bosch.in' },
  { s:'EXID',   n:'Exide Industries',    sec:'Auto',    p:412,   c:'#d4001e', d:'exideindustries.com' },
  { s:'MRF',    n:'MRF Limited',          sec:'Auto',    p:124500,c:'#cc0000', d:'mrftyres.com' },

  // ── MORE FMCG ──
  { s:'DABR',   n:'Dabur India',         sec:'FMCG',    p:567,   c:'#006838', d:'dabur.com' },
  { s:'BRIT',   n:'Britannia Inds.',     sec:'FMCG',    p:5123,  c:'#1a3b6f', d:'britannia.co.in' },
  { s:'GOCP',   n:'Godrej Consumer',     sec:'FMCG',    p:1234,  c:'#003f72', d:'godrejcp.com' },
  { s:'MRCO',   n:'Marico Ltd.',         sec:'FMCG',    p:567,   c:'#003366', d:'marico.com' },
  { s:'COLP',   n:'Colgate-Palmolive',   sec:'FMCG',    p:2890,  c:'#d42a2a', d:'colgatepalmolive.co.in' },
  { s:'PGHH',   n:'P&G Hygiene',         sec:'FMCG',    p:15670, c:'#003399', d:'pg.com' },
  { s:'APNT',   n:'Asian Paints',        sec:'FMCG',    p:3234,  c:'#e8530e', d:'asianpaints.com' },
  { s:'TITN',   n:'Titan Company',       sec:'FMCG',    p:3456,  c:'#003f72', d:'titan.co.in' },
  { s:'UNSP',   n:'United Spirits',      sec:'FMCG',    p:1234,  c:'#1a2b3c', d:'diageo.com' },

  // ── MORE PHARMA / HEALTHCARE ──
  { s:'DIVI',   n:"Divi's Laboratories", sec:'Pharma',  p:3678,  c:'#4a0082', d:'divislabs.com' },
  { s:'LURD',   n:'Lupin Ltd.',          sec:'Pharma',  p:1456,  c:'#e8530e', d:'lupin.com' },
  { s:'APLS',   n:'Apollo Hospitals',    sec:'Pharma',  p:6234,  c:'#003f72', d:'apollohospitals.com' },
  { s:'TORR',   n:'Torrent Pharma',      sec:'Pharma',  p:2345,  c:'#003366', d:'torrentpharma.com' },
  { s:'BIOT',   n:'Biocon Ltd.',         sec:'Pharma',  p:312,   c:'#1a5fab', d:'biocon.com' },
  { s:'ALKE',   n:'Alkem Labs',          sec:'Pharma',  p:5123,  c:'#2980b9', d:'alkemlabs.com' },
  { s:'MAXH',   n:'Max Healthcare',      sec:'Pharma',  p:789,   c:'#c0392b', d:'maxhealthcare.in' },
  { s:'AUPH',   n:'Aurobindo Pharma',    sec:'Pharma',  p:1123,  c:'#003f72', d:'aurobindo.com' },
  { s:'ZCAD',   n:'Zydus Cadila',        sec:'Pharma',  p:678,   c:'#2c3e50', d:'zyduscadila.com' },

  // ── METALS & MINING ──
  { s:'TATA',   n:'Tata Steel',          sec:'Metals',  p:134,   c:'#1b3b6f', d:'tatasteel.com' },
  { s:'JSWL',   n:'JSW Steel',           sec:'Metals',  p:867,   c:'#003f72', d:'jswsteel.in' },
  { s:'HNDL',   n:'Hindalco Inds.',      sec:'Metals',  p:567,   c:'#c0392b', d:'hindalco.com' },
  { s:'VEDL',   n:'Vedanta Ltd.',        sec:'Metals',  p:423,   c:'#003366', d:'vedantalimited.com' },
  { s:'NMDC',   n:'NMDC Ltd.',           sec:'Metals',  p:234,   c:'#1a4e8a', d:'nmdc.co.in' },
  { s:'SAIL',   n:'Steel Auth. India',   sec:'Metals',  p:112,   c:'#003882', d:'sail.co.in' },
  { s:'NACL',   n:'Natl. Aluminium',     sec:'Metals',  p:178,   c:'#c0392b', d:'nalcoindia.com' },

  // ── INFRASTRUCTURE & CONSTRUCTION ──
  { s:'LART',   n:'Larsen & Toubro',     sec:'Infra',   p:3567,  c:'#003f72', d:'larsentoubro.com' },
  { s:'ULTC',   n:'UltraTech Cement',    sec:'Infra',   p:10234, c:'#1a3b6f', d:'ultratechcement.com' },
  { s:'SHRC',   n:'Shree Cement',        sec:'Infra',   p:26780, c:'#003366', d:'shreecement.com' },
  { s:'AMBC',   n:'Ambuja Cements',      sec:'Infra',   p:567,   c:'#228b22', d:'ambujacement.com' },
  { s:'DLFC',   n:'DLF Ltd.',            sec:'Realty',  p:789,   c:'#1a3b5c', d:'dlf.in' },
  { s:'GODR',   n:'Godrej Properties',   sec:'Realty',  p:2345,  c:'#003f72', d:'godrejproperties.com' },
  { s:'OBRO',   n:'Oberoi Realty',        sec:'Realty',  p:1678,  c:'#003366', d:'oberoirealty.com' },
  { s:'PRES',   n:'Prestige Estates',    sec:'Realty',  p:1234,  c:'#8b2252', d:'prestigeconstructions.com' },
  { s:'GRAS',   n:'Grasim Inds.',        sec:'Infra',   p:2345,  c:'#1a3b5c', d:'grasim.com' },
  { s:'SICC',   n:'Siemens India',       sec:'Infra',   p:5678,  c:'#009999', d:'siemens.co.in' },
  { s:'ABBC',   n:'ABB India',           sec:'Infra',   p:6234,  c:'#ff0000', d:'new.abb.com' },

  // ── TELECOM ──
  { s:'BRTI',   n:'Bharti Airtel',       sec:'Telecom', p:1456,  c:'#e42313', d:'airtel.in' },
  { s:'JIOT',   n:'Jio Financial',       sec:'Telecom', p:345,   c:'#0f3cc9', d:'jiofinancialservices.com' },
  { s:'IDEA',   n:'Vodafone Idea',       sec:'Telecom', p:14,    c:'#e60000', d:'myvi.in' },
  { s:'TCOM',   n:'Tata Comm.',          sec:'Telecom', p:1890,  c:'#1b3b6f', d:'tatacommunications.com' },

  // ── CHEMICALS ──
  { s:'PIIL',   n:'PI Industries',       sec:'Chemicals', p:3567, c:'#228b22', d:'piindustries.com' },
  { s:'SRF',    n:'SRF Limited',         sec:'Chemicals', p:2345, c:'#003f72', d:'srf.com' },
  { s:'ATUL',   n:'Atul Ltd.',           sec:'Chemicals', p:6789, c:'#1a5fab', d:'atul.co.in' },
  { s:'NFIL',   n:'Navin Fluorine',      sec:'Chemicals', p:3890, c:'#003366', d:'nfrind.com' },
  { s:'DEEP',   n:'Deepak Nitrite',      sec:'Chemicals', p:2234, c:'#1a3b5c', d:'deepaknitrite.com' },
  { s:'CLGR',   n:'Clean Science',       sec:'Chemicals', p:1456, c:'#228b22', d:'cleanscience.co.in' },

  // ── CONGLOMERATE / ADANI GROUP ──
  { s:'ADNP',   n:'Adani Ports',         sec:'Infra',   p:1234,  c:'#003b5c', d:'adaniports.com' },
  { s:'ADNE2',  n:'Adani Enterprises',   sec:'Infra',   p:2890,  c:'#003b5c', d:'adani.com' },

  // ── INSURANCE ──
  { s:'ICIL',   n:'ICICI Lombard',       sec:'Insurance', p:1567, c:'#e07b39', d:'icicilombard.com' },
  { s:'LICI',   n:'LIC of India',        sec:'Insurance', p:897,  c:'#003882', d:'licindia.in' },

  // ── IT SERVICES / DIGITAL ──
  { s:'INFO',   n:'Info Edge (Naukri)',   sec:'IT',      p:5234,  c:'#003f72', d:'infoedge.in' },
  { s:'ZOMM',   n:'Zomato Ltd.',         sec:'Consumer', p:189,  c:'#e23744', d:'zomato.com' },
  { s:'PAYT',   n:'Paytm (One97)',       sec:'IT',      p:567,   c:'#00baf2', d:'paytm.com' },
  { s:'PLCY',   n:'PolicyBazaar',        sec:'IT',      p:1345,  c:'#e8530e', d:'policybazaar.com' },
  { s:'NYKA',   n:'Nykaa (FSN)',         sec:'Consumer', p:178,  c:'#fc2779', d:'nykaa.com' },
  { s:'DMRT',   n:'Delhivery Ltd.',      sec:'Logistics', p:412, c:'#d42a2a', d:'delhivery.com' },
];

// ─── INDEX DATA (India) ──────────────────────────────────
window.IDX = [
  { n:'NIFTY 50',   b:22450 },
  { n:'SENSEX',     b:73810 },
  { n:'BANK NIFTY', b:48230 },
  { n:'NIFTY IT',   b:36120 },
  { n:'MIDCAP',     b:43560 },
];

// ═══════════════════════════════════════════════════════════
//  US MARKET
// ═══════════════════════════════════════════════════════════
window.US_ST = [
  { s:'AAPL',  n:'Apple Inc.',        sec:'Technology', p:230.10, c:'#0b0b0d', d:'apple.com' },
  { s:'MSFT',  n:'Microsoft',         sec:'Technology', p:435.30, c:'#0067b8', d:'microsoft.com' },
  { s:'NVDA',  n:'NVIDIA',            sec:'Technology', p:146.75, c:'#76b900', d:'nvidia.com' },
  { s:'GOOGL', n:'Alphabet',          sec:'Technology', p:179.60, c:'#4285f4', d:'abc.xyz' },
  { s:'META',  n:'Meta Platforms',    sec:'Technology', p:578.32, c:'#0866ff', d:'meta.com' },
  { s:'AMZN',  n:'Amazon',            sec:'Consumer',   p:193.39, c:'#ff9900', d:'amazon.com' },
  { s:'TSLA',  n:'Tesla',             sec:'Automotive', p:262.18, c:'#e82127', d:'tesla.com' },
  { s:'JPM',   n:'JPMorgan Chase',    sec:'Financials', p:230.60, c:'#117aca', d:'jpmorganchase.com' },
  { s:'BRK.B', n:'Berkshire Hath.',   sec:'Financials', p:473.45, c:'#1b4f8a', d:'berkshirehathaway.com' },
  { s:'V',     n:'Visa Inc.',         sec:'Financials', p:312.40, c:'#1a1f71', d:'visa.com' },
  { s:'XOM',   n:'Exxon Mobil',       sec:'Energy',     p:119.16, c:'#ee1c25', d:'exxonmobil.com' },
  { s:'CVX',   n:'Chevron',           sec:'Energy',     p:158.22, c:'#0066b2', d:'chevron.com' },
  { s:'DIS',   n:'Walt Disney',       sec:'Media',      p:97.31,  c:'#113ccf', d:'thewaltdisneycompany.com' },
  { s:'NFLX',  n:'Netflix',           sec:'Media',      p:734.14, c:'#e50914', d:'netflix.com' },
  { s:'AMD',   n:'AMD',               sec:'Technology', p:163.55, c:'#ed1c24', d:'amd.com' },
  { s:'INTC',  n:'Intel',             sec:'Technology', p:30.18,  c:'#0071c5', d:'intel.com' },
  { s:'KO',    n:'Coca-Cola',         sec:'Consumer',   p:62.84,  c:'#f40009', d:'coca-cola.com' },
  { s:'NKE',   n:'Nike',              sec:'Consumer',   p:78.55,  c:'#111111', d:'nike.com' },
  { s:'F',     n:'Ford Motor',        sec:'Automotive', p:11.02,  c:'#003478', d:'ford.com' },
  { s:'GM',    n:'General Motors',    sec:'Automotive', p:46.30,  c:'#0170ce', d:'gm.com' },

  // ── HEALTHCARE ──
  { s:'JNJ',   n:'Johnson & Johnson', sec:'Healthcare', p:162.50, c:'#d51900', d:'jnj.com' },
  { s:'UNH',   n:'UnitedHealth',      sec:'Healthcare', p:585.20, c:'#0d4f9c', d:'unitedhealthgroup.com' },
  { s:'LLY',   n:'Eli Lilly',         sec:'Healthcare', p:782.40, c:'#d52b1e', d:'lilly.com' },
  { s:'PFE',   n:'Pfizer',            sec:'Healthcare', p:28.10,  c:'#0093d0', d:'pfizer.com' },
  { s:'ABBV',  n:'AbbVie',            sec:'Healthcare', p:176.30, c:'#071d49', d:'abbvie.com' },

  // ── MORE FINANCIALS ──
  { s:'BAC',   n:'Bank of America',   sec:'Financials', p:39.85,  c:'#e31837', d:'bankofamerica.com' },
  { s:'MA',    n:'Mastercard',        sec:'Financials', p:486.10, c:'#eb001b', d:'mastercard.com' },
  { s:'GS',    n:'Goldman Sachs',     sec:'Financials', p:498.70, c:'#6b8ba4', d:'goldmansachs.com' },

  // ── CONSUMER STAPLES / RETAIL ──
  { s:'WMT',   n:'Walmart',           sec:'Consumer',   p:78.40,  c:'#0071ce', d:'walmart.com' },
  { s:'PG',    n:'Procter & Gamble',  sec:'Consumer',   p:168.20, c:'#003da5', d:'pg.com' },
  { s:'COST',  n:'Costco',            sec:'Consumer',   p:885.30, c:'#e31837', d:'costco.com' },
  { s:'MCD',   n:"McDonald's",        sec:'Consumer',   p:292.10, c:'#ffc72c', d:'mcdonalds.com' },

  // ── INDUSTRIALS ──
  { s:'CAT',   n:'Caterpillar',       sec:'Industrials', p:355.60, c:'#ffcd11', d:'caterpillar.com' },
  { s:'BA',    n:'Boeing',            sec:'Industrials', p:178.90, c:'#0039a6', d:'boeing.com' },
  { s:'HON',   n:'Honeywell',         sec:'Industrials', p:212.40, c:'#e31836', d:'honeywell.com' },
  { s:'GE',    n:'GE Aerospace',      sec:'Industrials', p:171.80, c:'#0072ce', d:'geaerospace.com' },
];
window.US_IDX = [
  { n:'S&P 500',    b:5565 },
  { n:'NASDAQ 100', b:20886 },
  { n:'DOW JONES',  b:44704 },
  { n:'RUSSELL 2K', b:2284 },
  { n:'VIX',        b:16 },
];

// ═══════════════════════════════════════════════════════════
//  CRYPTO MARKET (paper, USD)
// ═══════════════════════════════════════════════════════════
window.CR_ST = [
  { s:'BTC',  n:'Bitcoin',      sec:'Layer 1', p:64210,  c:'#f7931a', d:'bitcoin.org' },
  { s:'ETH',  n:'Ethereum',     sec:'Layer 1', p:2418,   c:'#627eea', d:'ethereum.org' },
  { s:'SOL',  n:'Solana',       sec:'Layer 1', p:146.30, c:'#14f195', d:'solana.com' },
  { s:'BNB',  n:'BNB',          sec:'Layer 1', p:592.10, c:'#f3ba2f', d:'bnbchain.org' },
  { s:'XRP',  n:'XRP',          sec:'Payments',p:0.52,   c:'#23292f', d:'ripple.com' },
  { s:'ADA',  n:'Cardano',      sec:'Layer 1', p:0.38,   c:'#0033ad', d:'cardano.org' },
  { s:'AVAX', n:'Avalanche',    sec:'Layer 1', p:27.84,  c:'#e84142', d:'avax.network' },
  { s:'DOGE', n:'Dogecoin',     sec:'Meme',    p:0.122,  c:'#c2a633', d:'dogecoin.com' },
  { s:'SHIB', n:'Shiba Inu',    sec:'Meme',    p:0.000018,c:'#ffa409', d:'shibatoken.com' },
  { s:'LINK', n:'Chainlink',    sec:'DeFi',    p:14.05,  c:'#2a5ada', d:'chain.link' },
  { s:'UNI',  n:'Uniswap',      sec:'DeFi',    p:7.65,   c:'#ff007a', d:'uniswap.org' },
  { s:'AAVE', n:'Aave',         sec:'DeFi',    p:152.40, c:'#b6509e', d:'aave.com' },
  { s:'MATIC',n:'Polygon',      sec:'Layer 1', p:0.55,   c:'#8247e5', d:'polygon.technology' },
  { s:'DOT',  n:'Polkadot',     sec:'Layer 1', p:4.28,   c:'#e6007a', d:'polkadot.network' },
  { s:'USDC', n:'USD Coin',     sec:'Stable',  p:1.00,   c:'#2775ca', d:'circle.com' },
];
window.CR_IDX = [
  { n:'TOTAL MCAP', b:2350 },
  { n:'BTC DOM %',  b:54 },
  { n:'ALT MCAP',   b:1080 },
  { n:'FEAR&GREED', b:62 },
];

// ─── DEFAULT HOLDINGS PER MARKET ─────────────────────────
window.DEFAULT_HOLDS_US = [
  { sym:'AAPL', name:'Apple Inc.', qty:4, avgPrice:204.20 },
  { sym:'MSFT', name:'Microsoft',  qty:3, avgPrice:398.79 },
  { sym:'NVDA', name:'NVIDIA',     qty:6, avgPrice:132.34 },
];
window.DEFAULT_HOLDS_CR = [
  { sym:'BTC', name:'Bitcoin',  qty:0.4, avgPrice:52000 },
  { sym:'ETH', name:'Ethereum', qty:5,   avgPrice:2100 },
];

// NOTE: MARKETS registry + applyMarket() are defined lower, after Store
// and DEFAULT_HOLDS exist (they depend on both).

// ─── DEFAULT HOLDINGS ────────────────────────────────────
window.DEFAULT_HOLDS = [
  { sym:'TCS',   name:'Tata Consultancy', qty:5,   avgPrice:3500 },
  { sym:'INFY',  name:'Infosys',          qty:10,  avgPrice:1400 },
  { sym:'ONGC',  name:'Oil & Nat. Gas',   qty:100, avgPrice:270 },
  { sym:'RELI',  name:'Reliance Inds.',   qty:15,  avgPrice:2300 },
  { sym:'WIPRO', name:'Wipro Ltd.',       qty:38,  avgPrice:492 },
];

// ─── XP LEVELS ────────────────────────────────────────────
window.LVLS = [
  { min:0,    l:'Level 1 \u2014 Beginner',     num:1 },
  { min:200,  l:'Level 2 \u2014 Learner',      num:2 },
  { min:400,  l:'Level 3 \u2014 Analyst',      num:3 },
  { min:700,  l:'Level 4 \u2014 Trader',       num:4 },
  { min:1100, l:'Level 5 \u2014 Sr. Trader',   num:5 },
  { min:1600, l:'Level 6 \u2014 Fund Manager', num:6 },
  { min:2200, l:'Level 7 \u2014 Legend',        num:7 },
];

// ─── PERSISTENCE LAYER ──────────────────────────────────
window.Store = {
  _key: 'finvest_',
  get: function(k, def) {
    try {
      var v = localStorage.getItem(this._key + k);
      return v !== null ? JSON.parse(v) : def;
    } catch(e) { return def; }
  },
  set: function(k, v) {
    try { localStorage.setItem(this._key + k, JSON.stringify(v)); } catch(e) {}
  },
  remove: function(k) {
    try { localStorage.removeItem(this._key + k); } catch(e) {}
  }
};

// ─── USER PROFILE ───────────────────────────────────────
window.userProfile = Store.get('profile', null);

// ─── MARKET REGISTRY (after Store + DEFAULT_HOLDS exist) ─
window.MARKETS = {
  US:     { id:'US',     label:'US',     flag:'🇺🇸', cur:'$', locale:'en-US', startCash:100000,  stocks:US_ST, indices:US_IDX, cats:['All','Technology','Healthcare','Financials','Consumer','Industrials','Automotive','Energy','Media'], def:DEFAULT_HOLDS_US },
  IN:     { id:'IN',     label:'IN',     flag:'🇮🇳', cur:'₹', locale:'en-IN', startCash:1000000, stocks:ST,    indices:IDX,    cats:['All','IT','Banking','Energy','Auto','FMCG','Pharma','Metals','Infra','Telecom','Chemicals','Realty','Insurance','Consumer'], def:DEFAULT_HOLDS },
  CRYPTO: { id:'CRYPTO', label:'Crypto', flag:'🌐', cur:'$', locale:'en-US', startCash:50000,   stocks:CR_ST, indices:CR_IDX, cats:['All','Layer 1','DeFi','Meme','Payments','Stable'], def:DEFAULT_HOLDS_CR },
};

window.currentMarket = Store.get('market', 'IN');
if (!MARKETS[currentMarket]) currentMarket = 'IN';

// One-time migration: legacy India portfolio → holds_IN / wallet_IN
(function migrateLegacy() {
  if (Store.get('migrated_v2', false)) return;
  var legacyHolds = Store.get('holdings', null);
  if (legacyHolds && legacyHolds.length) Store.set('holds_IN', legacyHolds);
  var legacyWallet = Store.get('wallet', null);
  if (legacyWallet) Store.set('wallet_IN', legacyWallet);
  var legacyWl = Store.get('watchlist', null);
  if (legacyWl) Store.set('wl_IN', legacyWl);
  Store.set('migrated_v2', true);
})();

// Apply a market: swaps active dataset + portfolio + wallet + watchlist + currency
window.applyMarket = function() {
  var m = MARKETS[currentMarket];
  window.MKT = m;
  window.ST = m.stocks;
  window.IDX = m.indices;
  window.HOLDS = Store.get('holds_' + currentMarket, m.def.slice());
  if (!window.HOLDS) window.HOLDS = m.def.slice();
  window.wallet = Store.get('wallet_' + currentMarket, { balance: m.startCash, transactions: [] });
  window.watchlist = Store.get('wl_' + currentMarket, []);
  window.prices = {};
  window.idxP = {};
  window.tabSec = 'All';
};

// ─── HOLDINGS / WALLET / WATCHLIST (per active market) ──
applyMarket();
// Seed the demo portfolio ONLY for visitors who haven't onboarded yet. Once a
// user completes onboarding they start with a clean slate, and an empty
// portfolio must stay empty across reloads (don't re-inject demo holdings).
if ((!HOLDS || HOLDS.length === 0) && !Store.get('onboarded', false)) {
  HOLDS = MKT.def.slice();
  Store.set('holds_' + currentMarket, HOLDS);
}

// ─── TRADE HISTORY (shared across markets) ──────────────
window.tradeHistory = Store.get('trades', []);

// ─── STREAK ─────────────────────────────────────────────
window.streakData = Store.get('streak', { count: 1, lastDate: new Date().toDateString() });

function checkStreak() {
  var today = new Date().toDateString();
  if (streakData.lastDate !== today) {
    var last = new Date(streakData.lastDate);
    var now = new Date(today);
    var diff = Math.floor((now - last) / 86400000);
    if (diff === 1) {
      streakData.count++;
    } else if (diff > 1) {
      streakData.count = 1;
    }
    streakData.lastDate = today;
    Store.set('streak', streakData);
  }
}

// ─── WALLET (per active market; set by applyMarket) ─────
function saveWallet() { Store.set('wallet_' + currentMarket, wallet); }

function walletDeposit(amount) {
  if (amount <= 0) return false;
  wallet.balance += amount;
  wallet.transactions.unshift({ type: 'deposit', amount: amount, time: Date.now(), desc: 'Added funds' });
  saveWallet();
  return true;
}

function walletWithdraw(amount) {
  if (amount <= 0 || amount > wallet.balance) return false;
  wallet.balance -= amount;
  wallet.transactions.unshift({ type: 'withdraw', amount: amount, time: Date.now(), desc: 'Withdrawn funds' });
  saveWallet();
  return true;
}

function walletTrade(type, sym, amount) {
  if (type === 'buy') {
    if (amount > wallet.balance) return false;
    wallet.balance -= amount;
    wallet.transactions.unshift({ type: 'buy', amount: amount, time: Date.now(), desc: 'Bought ' + sym });
  } else {
    wallet.balance += amount;
    wallet.transactions.unshift({ type: 'sell', amount: amount, time: Date.now(), desc: 'Sold ' + sym });
  }
  // Keep only last 50 transactions
  if (wallet.transactions.length > 50) wallet.transactions = wallet.transactions.slice(0, 50);
  saveWallet();
  return true;
}

// ─── SEBI BOOKLET CHAPTERS ────────────────────────────────
window.SEBI_CHAPS = [
  // 0 — Intro
  '<div class="sh1">&#128218; SEBI Securities Market Booklet</div><div class="sp">Jointly prepared by <b>SEBI, BSE, NSE, MSEI, NSDL and CDSL</b> to give Indian investors basic, reliable information about the securities market.</div><div class="sib bl"><b>Purpose:</b> Help you understand investing in shares, mutual funds and other securities so you can make informed decisions and protect yourself from fraud.</div><div class="sh2">What this booklet covers</div><ul class="sl"><li>Regulatory framework for Indian securities markets</li><li>What are securities: stocks, bonds, mutual funds, derivatives</li><li>How primary and secondary markets work</li><li>How to open Demat, Trading and Bank accounts (KYC process)</li><li>How to invest through IPOs and stock exchanges</li><li>Mutual Funds and ETFs explained</li><li>How to file a grievance with SEBI via SCORES portal</li><li>Do\'s and Don\'ts for every investor</li></ul><div class="sib go"><b>Note:</b> This booklet covers SEBI-regulated securities only. For RBI, IRDAI or PFRDA investments, refer to their respective regulators.</div>',

  // 1 — Regulatory Framework
  '<div class="sh1">1. Regulatory Framework</div><div class="sp">The buying, selling and dealing in securities is regulated by <b>SEBI (Securities and Exchange Board of India)</b> under the SEBI Act, 1992. Established April 12, 1992.</div><div class="sib gr"><b>SEBI mandate:</b> Protect investors in securities, promote development of the securities market, and regulate it.</div><div class="sh2">Four Main Laws</div><ul class="sl"><li><b>SEBI Act, 1992</b> &mdash; Empowers SEBI for investor protection, market development and regulation</li><li><b>Companies Act, 2013</b> &mdash; Regulations for issuance, allotment and transfer of securities in public issues</li><li><b>Securities Contracts (Regulation) Act, 1956</b> &mdash; Recognition and regulation of transactions in securities in a Stock Exchange</li><li><b>Depositories Act, 1996</b> &mdash; Electronic maintenance and transfer of ownership of dematerialized (demat) shares</li></ul><div class="sg"><div class="sc2"><b>&#127963; SEBI</b><span>Regulator. Established April 12, 1992. Protects investors and regulates markets.</span></div><div class="sc2"><b>&#127960; NSE &amp; BSE</b><span>Stock Exchanges where securities are bought and sold. NSE is largest by volume.</span></div><div class="sc2"><b>&#128203; NSDL &amp; CDSL</b><span>Depositories holding your shares in electronic (demat) form safely.</span></div><div class="sc2"><b>&#128202; SCORES Portal</b><span>File complaints with SEBI online at scores.gov.in</span></div></div>',

  // 2 — Securities
  '<div class="sh1">2. What are Securities?</div><div class="sp">A <b>security</b> is a financial instrument that holds monetary value and can be traded. The securities market lets companies raise funds and investors buy/sell those securities.</div><div class="sg"><div class="sc2"><b>&#128200; Equity Shares</b><span>Ownership in a company. Entitles you to dividends and voting rights at general meetings.</span></div><div class="sc2"><b>&#128195; Debt Securities</b><span>Bonds/debentures. Money borrowed by company from you. You receive interest + principal repayment.</span></div><div class="sc2"><b>&#128202; Derivatives</b><span>Value depends on an underlying asset (shares, commodities, currency). HIGH RISK. Not for beginners.</span></div><div class="sc2"><b>&#127793; Mutual Funds</b><span>Pool money from many investors and invest in stocks, bonds, and other assets.</span></div></div><div class="sh2">Two Segments of the Securities Market</div><div class="sg"><div class="sc2" style="border-color:rgba(0,229,160,.3)"><b style="color:var(--gr)">Primary Market</b><span>Companies issue NEW securities to the public (IPO). Objective: Raise capital.</span></div><div class="sc2" style="border-color:rgba(77,159,255,.3)"><b style="color:var(--bl)">Secondary Market</b><span>ALREADY ISSUED securities traded between investors on stock exchanges. Objective: Liquidity and capital appreciation.</span></div></div>',

  // 3 — Markets
  '<div class="sh1">3. Primary Market &amp; Secondary Market</div><div class="sh2">Primary Market &mdash; Types of Issues</div><ul class="sl"><li><b>IPO (Initial Public Offer)</b> &mdash; First-ever public offer of shares by a company</li><li><b>FPO (Follow-on Public Offer)</b> &mdash; Company that already did an IPO makes another fresh issue</li><li><b>Preferential Issue</b> &mdash; Securities issued to specific investors (promoters, strategic investors, employees)</li><li><b>Rights Issue</b> &mdash; Existing shareholders get right to subscribe to new shares in proportion to current holding</li><li><b>Bonus Issue</b> &mdash; Additional shares at no cost to existing shareholders, in proportion to holdings</li></ul><div class="sib gr"><b>IPO Timeline:</b> Shares are listed on recognized stock exchanges within <b>6 working days</b> of issue closure. Allotted shares go directly to your Demat account.</div><div class="sh2">Secondary Market</div><ul class="sl"><li><b>Cash Market</b> &mdash; Buy and sell actual shares. Settlement on T+2 basis (2 working days after trade)</li><li><b>Derivatives Market</b> &mdash; Futures and Options. High risk, mainly for hedging. NOT recommended for beginners</li></ul>',

  // 4 — Institutions
  '<div class="sh1">4. Market Infrastructure Institutions</div><div class="sg"><div class="sc2"><b>&#128202; Stock Exchanges</b><span>Nationwide computerised screen-based trading platforms. Major: NSE, BSE, MSE.</span></div><div class="sc2"><b>&#9878; Clearing Corporations</b><span>Guarantee every trade settles. Buyers get securities, sellers get money. NSE Clearing, ICCL (BSE).</span></div><div class="sc2"><b>&#128203; Depositories</b><span>Hold shares electronically. Two depositories: NSDL and CDSL. You access them via Depository Participants.</span></div><div class="sc2"><b>&#128202; Brokers</b><span>Execute buy/sell orders on exchanges. Must be SEBI-registered. Zerodha, Groww, Angel One etc.</span></div></div><div class="sh2">Key Market Intermediaries</div><ul class="sl"><li><b>Stock Brokers</b> &mdash; Execute orders on stock exchanges. Must be SEBI-registered</li><li><b>Investment Advisers</b> &mdash; Provide investment advice for a fee. Must be registered under SEBI (IA) Regulations 2013</li><li><b>Merchant Bankers</b> &mdash; Manage IPOs and public issues</li><li><b>Registrars &amp; Transfer Agents</b> &mdash; Maintain shareholder records, process transfers and dividends</li></ul><div class="sib re"><b>Caution:</b> Always deal with SEBI-registered intermediaries only. Check registration at sebi.gov.in/intermediaries.html</div>',

  // 5 — Risks
  '<div class="sh1">5. Basics of Investing &mdash; Risks</div><div class="sp">Before investing, understand your <b>investment goals</b>, <b>risk appetite</b>, and the <b>time period</b> for which you want to invest.</div><div class="sh2">Key Risks in Investing</div><ul class="sl"><li><b>Market Risk (Systematic Risk)</b> &mdash; Affects the overall market. Cannot be eliminated. COVID crash March 2020 &mdash; all stocks fell simultaneously</li><li><b>Unsystematic Risk</b> &mdash; Risk attached to a specific company or industry. Yes Bank crisis, DHFL collapse</li><li><b>Inflation Risk</b> &mdash; Returns may not beat inflation, losing purchasing power over time</li><li><b>Liquidity Risk</b> &mdash; Cannot buy or sell quickly enough without loss of value</li><li><b>Business Risk</b> &mdash; A company may be affected by unfavorable operational or financial situations</li><li><b>Volatility Risk</b> &mdash; Stock prices may fluctuate significantly over time</li></ul><div class="sh2">How to Mitigate Risk</div><div class="sib gr"><b>Asset Allocation and Diversification</b> &mdash; Spread investments across various companies and asset classes. Losses in one area are offset by gains in another. This is the most proven risk-mitigation strategy available to retail investors.</div>',

  // 6 — KYC
  '<div class="sh1">6. Account Opening &amp; KYC</div><div class="sp">To invest in equity shares, you need <b>three accounts</b>:</div><div class="sg"><div class="sc2" style="border-color:rgba(0,229,160,.3)"><b style="color:var(--gr)">1. Bank Account</b><span>For sending and receiving money related to all investments.</span></div><div class="sc2" style="border-color:rgba(77,159,255,.3)"><b style="color:var(--bl)">2. Trading Account</b><span>With a SEBI-registered stockbroker. Used to place buy and sell orders on the stock exchange.</span></div><div class="sc2" style="border-color:rgba(155,109,255,.3)"><b style="color:var(--pu)">3. Demat Account</b><span>With a Depository Participant (DP). Holds your shares in electronic form. Linked to NSDL or CDSL.</span></div><div class="sc2"><b>3-in-1 Account</b><span>Some brokers combine all three accounts together for convenience.</span></div></div><div class="sh2">KYC &mdash; Know Your Client</div><div class="sp">KYC is <b>mandatory</b> under the Prevention of Money Laundering Act, 2002. One-time process valid across all intermediaries.</div><ul class="sl"><li>Submit OVDs: PAN card, Aadhaar, Passport, Voter ID, or Driving License</li><li>A unique <b>KYC Identification Number (KIN)</b> is generated and sent by SMS/Email</li><li>E-KYC available using Aadhaar/DigiLocker — fill form online, complete video verification</li></ul><div class="sib go"><b>BSDA:</b> Basic Services Demat Account for individuals with holdings up to Rs 2 lakhs. No AMC for holdings up to Rs 50,000.</div>',

  // 7 — How to Invest
  '<div class="sh1">7. How to Invest in Securities</div><div class="sh2">Investment through Primary Market (IPO)</div><ul class="sl"><li>Apply through <b>ASBA</b> — money is blocked in your bank account, earns interest, debited only if shares are allotted</li><li>Apply via <b>UPI</b> as payment mechanism for retail investors (limit: Rs 2 lakh per transaction)</li><li>Shares credited to Demat account within 6 working days of issue closure</li><li>If not allotted, blocked funds are automatically released — no refund process needed</li></ul><div class="sib re"><b>Caution:</b> Read the Prospectus carefully before investing in any IPO. Analyse company financials — do not invest based on market sentiment alone.</div><div class="sh2">Investment through Secondary Market</div><ul class="sl"><li>Place orders via: Mobile trading app, online platform, Call and Trade, or physically at broker office</li><li>Settlement is on <b>T+2 rolling basis</b> — have funds ready before pay-in day</li><li>Contract note must be issued within <b>24 hours</b> of trade — preserve it for records</li><li>Non-availability of funds or securities for settlement may lead to penalties</li></ul><div class="sib bl"><b>Margin Money:</b> Required by exchanges before certain trades. Can be provided as cash, securities, fixed deposits, mutual fund units, or government securities in demat form.</div>',

  // 8 — Mutual Funds
  '<div class="sh1">8. Mutual Funds &amp; ETFs</div><div class="sp">A <b>Mutual Fund</b> pools money from many investors and invests in stocks, bonds, and other assets. All mutual funds must be registered with SEBI before launching any scheme.</div><div class="sh2">Types of Mutual Fund Schemes</div><ul class="sl"><li><b>Equity Schemes</b> — Principally invest in stocks/equities. Higher risk, higher potential return</li><li><b>Debt Schemes</b> — Principally invest in fixed income securities like bonds and treasury bills. Lower risk</li><li><b>Hybrid Schemes</b> — Invest in two or more asset classes (equities + fixed income + cash)</li><li><b>Solution Oriented Schemes</b> — Designed for specific goals like retirement or child planning</li><li><b>Other Schemes</b> — Index Funds, Sectoral funds, Fund of Funds</li></ul><div class="sh2">SIP — Systematic Investment Plan</div><div class="sib gr"><b>SIP</b> lets you invest a fixed amount at regular intervals (monthly). Rupee Cost Averaging automatically buys more units when markets fall. Also: SWP (Withdrawal Plan) and STP (Transfer Plan).</div><div class="sh2">ETF — Exchange Traded Fund</div><div class="sp">Tracks an index (NIFTY, SENSEX) or basket of assets. Traded on stock exchange like a regular stock. Higher daily liquidity and lower fees than mutual funds.</div><div class="sib re"><b>Derivatives Warning:</b> Futures and Options are high-risk products mainly used for hedging. <b>Not recommended for retail investors or beginners.</b></div>',

  // 9 — Grievance
  '<div class="sh1">9. Grievance Redressal</div><div class="sg"><div class="sc2"><b>Step 1</b><span>Approach the concerned intermediary (broker, DP, company) directly. They must resolve your complaint.</span></div><div class="sc2"><b>Step 2</b><span>If unresolved, approach the Stock Exchange or Depository. NSE has IGRP, BSE has IGRC.</span></div><div class="sc2"><b>Step 3</b><span>File on SCORES portal (scores.gov.in). Toll-free: 1800 22 7575. Track status online anytime.</span></div><div class="sc2"><b>Step 4</b><span>If still unsatisfied, use Arbitration Mechanism at the Stock Exchange for quasi-judicial settlement.</span></div></div><div class="sib gr"><b>SCORES Mobile App</b> available on Android and iOS. Lodge, follow up and track complaints from your phone.</div><div class="sh2">IEPF — Unclaimed Shares and Dividends</div><div class="sp">Dividends and shares unpaid or unclaimed for <b>7 consecutive years</b> are transferred to the <b>Investor Education and Protection Fund (IEPF)</b>. Claim them at <b>iepf.gov.in</b>.</div>',

  // 10 — Dos and Don'ts
  '<div class="sh1">10. Do\'s &amp; Don\'ts</div><div class="sg"><div class="sc2" style="border-color:rgba(0,229,160,.3)"><b style="color:var(--gr);font-size:13px">&#9989; DO\'s</b><ul class="sl" style="margin-top:7px"><li>Consult a SEBI registered Investment Adviser</li><li>Invest based on your objective and risk appetite</li><li>Insist on contract note within 24 hours of every trade</li><li>Read all documents carefully before signing</li><li>Keep records of all documents, statements and payments</li><li>Always pay via banking channels — no cash dealings</li><li>Keep contact details updated with all intermediaries</li><li>Avail nomination facility for all investments</li><li>Regularly check SMS and email alerts from exchanges</li><li>Get running account settled every 30 or 90 days</li></ul></div><div class="sc2" style="border-color:rgba(255,77,106,.3)"><b style="color:var(--rd);font-size:13px">&#10060; DON\'Ts</b><ul class="sl" style="margin-top:7px"><li>Don\'t borrow money for investment</li><li>Don\'t deal with unregistered brokers or intermediaries</li><li>Don\'t sign blank forms or Delivery Instruction Slips</li><li>Don\'t issue a general Power of Attorney</li><li>Don\'t share your online trading password with anyone</li><li>Don\'t fall prey to Ponzi schemes or unregistered chit funds</li><li>Don\'t invest based on hot tips — these are often illegal</li><li>Don\'t deal with unregistered Investment Advisers</li><li>Don\'t indulge in Dabba Trading — it is illegal</li><li>Don\'t fall for assured or guaranteed returns</li></ul></div></div><div class="sib go"><b>Red flags from unregistered Investment Advisers:</b> Promised assured returns, exorbitant fees, trading on your behalf, mis-selling products not matching your risk profile. Always verify SEBI registration at sebi.gov.in</div>',
];

// ─── INVESTMENT GLOSSARY ─────────────────────────────────
window.GLOSSARY = [
  { term:'IPO', def:'Initial Public Offering. First time a company sells shares to the public on a stock exchange.' },
  { term:'P/E Ratio', def:'Price-to-Earnings ratio. Current share price divided by earnings per share. Measures how expensive a stock is.' },
  { term:'Market Cap', def:'Total market value of a company. Calculated as Share Price x Total Number of Shares.' },
  { term:'Dividend', def:'A portion of company profits distributed to shareholders, usually quarterly or annually.' },
  { term:'NAV', def:'Net Asset Value. Per-unit value of a mutual fund scheme. Calculated daily.' },
  { term:'SIP', def:'Systematic Investment Plan. Investing a fixed amount at regular intervals in mutual funds.' },
  { term:'Demat Account', def:'Dematerialized account that holds shares electronically instead of physical certificates.' },
  { term:'Bull Market', def:'A market condition where prices are rising or expected to rise, typically 20%+ from recent lows.' },
  { term:'Bear Market', def:'A market condition where prices fall 20% or more from recent highs.' },
  { term:'Blue Chip', def:'Large, well-established companies with a history of reliable performance. Example: TCS, HDFC.' },
  { term:'Volatility', def:'The degree of variation in stock prices over time. Higher volatility = higher risk and potential reward.' },
  { term:'Portfolio', def:'Collection of financial investments like stocks, bonds, mutual funds held by an investor.' },
  { term:'SEBI', def:'Securities and Exchange Board of India. The regulatory body for securities markets in India.' },
  { term:'NSE', def:'National Stock Exchange of India. Largest stock exchange in India by trading volume.' },
  { term:'BSE', def:'Bombay Stock Exchange. Asia\'s oldest stock exchange, established 1875.' },
  { term:'ETF', def:'Exchange Traded Fund. A fund traded on stock exchanges that tracks an index, sector, or commodity.' },
  { term:'FPO', def:'Follow-on Public Offering. When an already-listed company issues new shares to raise more capital.' },
  { term:'Nifty 50', def:'Index tracking 50 of the largest Indian companies listed on NSE. India\'s benchmark index.' },
  { term:'Sensex', def:'Index tracking 30 of the largest companies on BSE. India\'s oldest stock market index.' },
  { term:'CAGR', def:'Compound Annual Growth Rate. The annual rate of return over a specified period assuming reinvestment.' },
  { term:'Stop Loss', def:'An order to automatically sell a stock when it reaches a certain price to limit losses.' },
  { term:'Rupee Cost Averaging', def:'Investing a fixed amount regularly regardless of price. Buy more units when prices are low.' },
  { term:'Liquidity', def:'How quickly and easily an asset can be converted to cash without significantly affecting its price.' },
  { term:'KYC', def:'Know Your Customer. Mandatory identity verification process required to open investment accounts.' },
];
