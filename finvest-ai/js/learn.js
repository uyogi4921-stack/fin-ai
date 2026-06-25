/* ═══════════════════════════════════════════════════════════
   FINVEST AI — learn.js
   15 lessons, quiz system, XP levels with localStorage
═══════════════════════════════════════════════════════════ */

'use strict';

// Load persisted XP and completed lessons
window.totalXP    = Store.get('xp', 0);
window.completedL = new Set(Store.get('completedLessons', []));
var curCat    = 'all';
var curLesson = null;
var quizDone  = false;

// ─── XP / LEVEL HELPERS ──────────────────────────────────
function getLv(xp) {
  var l = LVLS[0];
  LVLS.forEach(function(x) { if (xp >= x.min) l = x; });
  return l;
}
function getNxt(xp) {
  var i = LVLS.findIndex(function(x) { return x === getLv(xp); });
  return LVLS[i + 1] || { min: getLv(xp).min + 1000 };
}

function addXP(amt, msg) {
  totalXP += amt;
  Store.set('xp', totalXP);
  updXP();
  renderLB();
  if (msg) showToast(msg);
}

function updXP() {
  var lv = getLv(totalXP), nx = getNxt(totalXP);
  var base = lv.min, top = nx.min;
  var pct = Math.min(100, Math.round((totalXP - base) / (top - base) * 100));

  ['sbFill', 'lFill'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.style.width = pct + '%';
  });
  ['sbLv', 'lLv'].forEach(function(id) {
    var e = document.getElementById(id); if (e) e.textContent = lv.l;
  });
  ['sbSub', 'lSub'].forEach(function(id) {
    var e = document.getElementById(id);
    if (e) e.textContent = (totalXP - base) + ' / ' + (top - base) + ' XP';
  });

  var e;
  e = document.getElementById('lsXp');   if (e) e.textContent = totalXP;
  e = document.getElementById('lsComp'); if (e) e.textContent = completedL.size;
  e = document.getElementById('dashXP'); if (e) e.textContent = totalXP + ' \u26A1';
  e = document.getElementById('tnXp');   if (e) e.innerHTML = '\u26A1 ' + totalXP + ' XP';

  // Update dashboard level text
  e = document.getElementById('dashLvl'); if (e) e.textContent = lv.l;

  // Update profile stats if on profile page
  e = document.getElementById('profXP');    if (e) e.textContent = totalXP;
  e = document.getElementById('profLevel'); if (e) e.textContent = lv.l;
  e = document.getElementById('profLessons'); if (e) e.textContent = completedL.size + '/15';

  // Update streak display
  var streakEls = document.querySelectorAll('.streak-count');
  streakEls.forEach(function(el) { el.textContent = streakData.count; });
}

// ─── LESSONS DATA ────────────────────────────────────────
window.LESSONS = [
  {
    id:0, cat:'basics', col:'cg', icon:'&#128640;',
    tag:'&#128214; App Basics', title:'Welcome to Finvest AI',
    desc:'Navigate the app, earn XP, and start your investing journey.',
    time:'3 min', xp:50, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>What is Finvest AI?</h3><p>Your gamified investing platform. Practice with simulated portfolios using real NSE market data. No real money at risk.</p><div class="ib"><b>Key idea:</b> Learn with real data, earn XP, build confidence before investing real money.</div></div><div class="ms"><h3>The 7 Sections</h3><ul><li><b>Dashboard</b> — Portfolio overview, live P&amp;L</li><li><b>Market</b> — 24 NSE stocks with logos, B/S buttons, live prices</li><li><b>Learn</b> — 15 lessons and quizzes for XP</li><li><b>Leaderboard</b> — Weekly XP challenges</li><li><b>Community</b> — Beginner and Intermediate rooms</li><li><b>Resources</b> — SEBI official booklet + trusted learning links</li><li><b>AI Advisor (Fin)</b> — Personalised portfolio analysis, works offline</li></ul></div><div class="ms"><h3>XP &amp; Levels</h3><p>Every lesson earns XP. Correct quiz answers earn bonus XP. Level up from Beginner to Legend.</p></div><div class="qsec"><div class="qq">What do the green B and red S buttons next to each stock do?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Bookmark and Search the stock</button><button class="qo" onclick="ansQ(this,true)">Open a Buy or Sell order</button><button class="qo" onclick="ansQ(this,false)">Show stock details and chart</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:1, cat:'basics', col:'cb', icon:'&#128202;',
    tag:'&#128214; App Basics', title:'Reading Your Dashboard',
    desc:'Understand every number on your portfolio screen.',
    time:'4 min', xp:60, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>Portfolio Value</h3><p>The big number at the top is your Total Portfolio Value — all holdings at current prices.</p></div><div class="ms"><h3>P&amp;L (Profit & Loss)</h3><p>Green = up, Red = down. Percentage shows growth relative to what you invested.</p><div class="wb"><b>Remember:</b> Short-term red is normal. Successful investors hold through dips.</div></div><div class="ms"><h3>Key Terms</h3><ul><li><b>Invested</b> — Total money put in</li><li><b>Current Value</b> — What it is worth now</li><li><b>Total Gain/Loss</b> — Current Value minus Invested</li></ul></div><div class="qsec"><div class="qq">Invested &#8377;10,000, portfolio now worth &#8377;11,500 — what is your gain?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">&#8377;1,000 (10%)</button><button class="qo" onclick="ansQ(this,true)">&#8377;1,500 (15%)</button><button class="qo" onclick="ansQ(this,false)">&#8377;500 (5%)</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:2, cat:'basics', col:'cp', icon:'&#128269;',
    tag:'&#128214; App Basics', title:'Using the Market Screen',
    desc:'Search stocks, filter by sector, use B/S buttons like a pro.',
    time:'3 min', xp:50, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>Search Bar</h3><p>Type any stock symbol (TCS, INFY), company name, or sector. Results filter instantly.</p></div><div class="ms"><h3>B and S Buttons</h3><p>Every stock card has a green <b>B</b> button (Buy) and red <b>S</b> button (Sell). Tap to open an order modal, enter shares, confirm.</p><div class="ib"><b>Tip:</b> The total is calculated automatically based on the current live price.</div></div><div class="ms"><h3>Sector Tabs</h3><ul><li><b>IT</b> — Reacts to US tech demand and INR/USD rates</li><li><b>Banking</b> — Moves with RBI interest rate decisions</li><li><b>Energy</b> — Follows global crude oil prices</li></ul></div><div class="qsec"><div class="qq">What does the red S button on each stock card do?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Show stock information</button><button class="qo" onclick="ansQ(this,false)">Search within the sector</button><button class="qo" onclick="ansQ(this,true)">Opens a Sell order for that stock</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:3, cat:'stocks', col:'cg', icon:'&#128200;',
    tag:'&#128200; Stocks', title:'What is a Stock?',
    desc:'The foundational concept every investor must know first.',
    time:'5 min', xp:75, qxp:20, level:'Beginner',
    body:'<div class="ms"><h3>Ownership Slices</h3><p>A stock = a tiny slice of ownership in a company. Buy 1 TCS share = you literally own a fraction of Tata Consultancy Services.</p></div><div class="ms"><h3>Why Companies Issue Stocks</h3><p>To raise capital without bank loans. Investors become co-owners.</p><div class="ib"><b>Real example:</b> Zomato IPO 2021 raised &#8377;9,375 crore selling shares to the public.</div></div><div class="ms"><h3>How You Make Money</h3><ul><li><b>Capital Appreciation</b> — Buy &#8377;100, sell &#8377;150. Profit &#8377;50</li><li><b>Dividends</b> — Some companies pay cash from profits to shareholders</li></ul></div><div class="wb" style="margin-top:10px"><b>Golden rule:</b> Never invest money you cannot afford to lock away for 3–5 years.</div><div class="qsec"><div class="qq">You own 10 out of 1,000 total shares. What percentage do you own?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">0.1%</button><button class="qo" onclick="ansQ(this,true)">1%</button><button class="qo" onclick="ansQ(this,false)">10%</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:4, cat:'stocks', col:'cb', icon:'&#127970;',
    tag:'&#128200; Stocks', title:'NSE, BSE & SEBI',
    desc:'How Indian stock exchanges work and who protects your money.',
    time:'4 min', xp:65, qxp:20, level:'Beginner',
    body:'<div class="ms"><h3>Exchanges</h3><p><b>NSE</b> and <b>BSE</b> are India\'s two main trading platforms. NSE is the largest by volume.</p></div><div class="ms"><h3>NIFTY &amp; SENSEX</h3><p>Market indices. <b>NIFTY 50</b> tracks India\'s top 50 on NSE. SENSEX tracks top 30 on BSE.</p><div class="ib"><b>NIFTY up 1%</b> = the average of top 50 companies rose 1% that day.</div></div><div class="ms"><h3>SEBI</h3><p>Securities and Exchange Board of India. Makes rules, catches fraud, ensures fair trading. All brokers must be SEBI-registered.</p></div><div class="qsec"><div class="qq">Which index tracks India\'s top 50 companies on NSE?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">SENSEX</button><button class="qo" onclick="ansQ(this,true)">NIFTY 50</button><button class="qo" onclick="ansQ(this,false)">BANK NIFTY</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:5, cat:'stocks', col:'co', icon:'&#128161;',
    tag:'&#128200; Stocks', title:'How to Read a Stock Price',
    desc:'Decode price movements, market cap, P/E ratio.',
    time:'5 min', xp:80, qxp:20, level:'Beginner',
    body:'<div class="ms"><h3>What Drives Price?</h3><p>Supply and demand. More buyers than sellers = price goes up. Simple.</p></div><div class="ms"><h3>Key Metrics</h3><ul><li><b>Market Cap</b> — Price x Total Shares = Company value</li><li><b>52-Week High/Low</b> — Highest and lowest price in the past year</li><li><b>Volume</b> — Shares traded today. High volume = high interest</li><li><b>P/E Ratio</b> — Price relative to earnings. Higher = more expensive</li></ul></div><div class="wb" style="margin-top:10px"><b>Trap:</b> Checking prices hourly leads to emotional panic decisions. Check weekly instead.</div><div class="qsec"><div class="qq">A high P/E ratio compared to peers generally means the stock is...</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">A bargain buy</button><button class="qo" onclick="ansQ(this,true)">Expensive / potentially overvalued</button><button class="qo" onclick="ansQ(this,false)">Paying high dividends</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:6, cat:'risk', col:'cr', icon:'&#128737;',
    tag:'&#128737; Risk', title:'Understanding Investment Risk',
    desc:'Learn to measure it, manage it, and never fear it.',
    time:'6 min', xp:90, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>Risk vs. Reward</h3><p>Higher potential returns = higher risk. FD: safe but 4%. Stocks: riskier but 12–15% annual average.</p><div class="ib"><b>Key insight:</b> Risk is not bad — unmanaged risk is bad.</div></div><div class="ms"><h3>Types of Risk</h3><ul><li><b>Market Risk</b> — Whole market falls (COVID crash March 2020)</li><li><b>Company Risk</b> — Specific company fails (Yes Bank, DHFL)</li><li><b>Liquidity Risk</b> — Cannot sell quickly without loss</li><li><b>Inflation Risk</b> — Returns do not beat inflation; real value shrinks</li></ul></div><div class="qsec"><div class="qq">Which type of risk affects ALL stocks simultaneously?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Company Risk</button><button class="qo" onclick="ansQ(this,true)">Market Risk</button><button class="qo" onclick="ansQ(this,false)">Liquidity Risk</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:7, cat:'risk', col:'co', icon:'&#127919;',
    tag:'&#128737; Risk', title:'Diversification',
    desc:'The single most powerful risk-reduction strategy.',
    time:'5 min', xp:80, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>What is Diversification?</h3><p>Spreading investments across different stocks, sectors, and asset classes so one bad performer cannot wipe your portfolio.</p></div><div class="ms"><h3>A Balanced Portfolio</h3><ul><li>30% IT (TCS, INFY)</li><li>25% Banking (HDFC, ICICI)</li><li>20% Defensive (FMCG + Pharma)</li><li>15% Energy/Auto</li><li>10% Mid-cap growth</li></ul><div class="ib"><b>Why it works:</b> When IT falls on US recession fears, FMCG stays stable — people still buy soap.</div></div><div class="qsec"><div class="qq">Which portfolio is MOST diversified?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">100% in TCS, INFY, Wipro, HCL</button><button class="qo" onclick="ansQ(this,true)">TCS + HDFC Bank + ITC + Sun Pharma + Reliance</button><button class="qo" onclick="ansQ(this,false)">50% TCS + 50% Infosys</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:8, cat:'strategy', col:'cp', icon:'&#9822;',
    tag:'&#9822; Strategy', title:'SIP — Invest Without Timing the Market',
    desc:'The systematic strategy that builds wealth slowly and surely.',
    time:'6 min', xp:100, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>What is SIP?</h3><p>Invest a fixed amount monthly regardless of market conditions. Removes emotion completely.</p></div><div class="ms"><h3>Power of &#8377;5,000/month at 12%/year</h3><ul><li>5 years → &#8377;4.12 lakh (invested &#8377;3L)</li><li>10 years → &#8377;11.6 lakh (invested &#8377;6L)</li><li>20 years → &#8377;49.9 lakh (invested &#8377;12L)</li></ul><div class="ib"><b>Rupee Cost Averaging:</b> When markets fall, &#8377;5,000 buys MORE units. When they rise, those units are worth more. You automatically buy low.</div></div><div class="wb" style="margin-top:10px"><b>Action:</b> Even &#8377;500/month builds the habit. Start now.</div><div class="qsec"><div class="qq">What is Rupee Cost Averaging?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Getting average returns always</button><button class="qo" onclick="ansQ(this,true)">Buying more units when prices fall, fewer when prices rise</button><button class="qo" onclick="ansQ(this,false)">Averaging cost in rupees vs dollars</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:9, cat:'strategy', col:'cg', icon:'&#128202;',
    tag:'&#9822; Strategy', title:'Fundamental vs Technical Analysis',
    desc:'Two schools of thought. Which should you follow?',
    time:'7 min', xp:110, qxp:30, level:'Intermediate',
    body:'<div class="ms"><h3>Fundamental Analysis</h3><p>Studies company health: revenue, profits, debt, management quality. Used by long-term investors like Buffett.</p><div class="ib"><b>Key metrics:</b> Revenue growth, P/E, Debt-to-Equity, ROE, Promoter holding %</div></div><div class="ms"><h3>Technical Analysis</h3><p>Looks only at price charts and volume. Assumes past patterns repeat. Used by short-term traders.</p><ul><li><b>Moving Averages</b> — Smooth out noise, show trends</li><li><b>RSI</b> — Signals overbought or oversold conditions</li></ul></div><div class="wb" style="margin-top:10px"><b>For beginners:</b> Start with fundamentals only. Technicals can mislead into over-trading.</div><div class="qsec"><div class="qq">Warren Buffett primarily uses which type of analysis?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Technical Analysis</button><button class="qo" onclick="ansQ(this,true)">Fundamental Analysis</button><button class="qo" onclick="ansQ(this,false)">Both equally</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:10, cat:'strategy', col:'cb', icon:'&#129504;',
    tag:'&#9822; Strategy', title:'Behavioural Finance',
    desc:'Why your brain is wired to make terrible investment decisions.',
    time:'6 min', xp:95, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>Loss Aversion</h3><p>Losing &#8377;1,000 feels twice as bad as gaining &#8377;1,000 feels good. This makes investors hold losers too long.</p></div><div class="ms"><h3>FOMO</h3><p>By the time a stock is viral on social media, smart money has already entered. You buy at the peak.</p><div class="wb"><b>Rule:</b> If your auto-driver is talking about a stock, it is probably overheated.</div></div><div class="ms"><h3>Anchoring Bias</h3><p>Bought TCS at &#8377;4,000, it fell to &#8377;3,800. You refuse to sell because you\'re anchored to &#8377;4,000. The market does not care what you paid.</p></div><div class="qsec"><div class="qq">Refusing to sell a losing stock because you paid more for it is called...</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">FOMO</button><button class="qo" onclick="ansQ(this,false)">Diversification</button><button class="qo" onclick="ansQ(this,true)">Anchoring Bias</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:11, cat:'advanced', col:'cp', icon:'&#128640;',
    tag:'&#128640; Advanced', title:'Mutual Funds & ETFs',
    desc:"Can't pick stocks? These vehicles do it for you.",
    time:'7 min', xp:120, qxp:30, level:'Advanced',
    body:'<div class="ms"><h3>Mutual Fund</h3><p>Pools money from thousands into a basket of stocks. Instant diversification.</p><div class="ib"><b>Example:</b> Mirae Asset Large Cap holds TCS, HDFC, Reliance + 50 more. &#8377;1,000 buys a slice of all.</div></div><div class="ms"><h3>ETF</h3><p>Exchange Traded Fund. Traded like a stock. Nifty BeES tracks NIFTY 50 passively with 0.05% fees.</p></div><div class="ms"><h3>MF vs ETF</h3><ul><li><b>Mutual Fund</b> — Active management, fees 1–2%</li><li><b>ETF</b> — Passive, ultra-low fees, matches market</li></ul><div class="wb"><b>Data:</b> 80% of active funds underperform their benchmark over 10 years.</div></div><div class="qsec"><div class="qq">A Nifty 50 ETF is best described as...</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">Managed by India\'s top analyst</button><button class="qo" onclick="ansQ(this,true)">A fund that passively mirrors the NIFTY 50 index</button><button class="qo" onclick="ansQ(this,false)">A fixed deposit with market-linked returns</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:12, cat:'advanced', col:'co', icon:'&#128201;',
    tag:'&#128640; Advanced', title:'Bull & Bear Markets',
    desc:"Know the cycle, never panic again.",
    time:'5 min', xp:90, qxp:25, level:'Advanced',
    body:'<div class="ms"><h3>Bull Market</h3><p>Market rising 20%+ from recent lows with optimism.</p><div class="ib"><b>India\'s last bull run:</b> NIFTY ~7,500 (March 2020) to ~22,000 (Jan 2024). 193% rise in under 4 years.</div></div><div class="ms"><h3>Bear Market</h3><p>Market falls 20%+ from highs. Most investors panic-sell. This is often the best time to buy.</p></div><div class="ms"><h3>The 4-Stage Cycle</h3><ul><li><b>Accumulation</b> — Smart money quietly buys post-crash</li><li><b>Markup</b> — Prices rise as more investors join</li><li><b>Distribution</b> — Smart money sells to excited retail buyers</li><li><b>Markdown</b> — Prices fall; retail investors panic-sell at losses</li></ul></div><div class="qsec"><div class="qq">A bear market is officially declared after falls of at least...</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">5%</button><button class="qo" onclick="ansQ(this,false)">10%</button><button class="qo" onclick="ansQ(this,true)">20%</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:13, cat:'advanced', col:'cr', icon:'&#129518;',
    tag:'&#128640; Advanced', title:'Compound Interest',
    desc:"Why starting at 19 beats working harder at 35.",
    time:'6 min', xp:100, qxp:30, level:'Advanced',
    body:'<div class="ms"><h3>Compounding</h3><p>Earning returns on your principal AND on previous returns. Money making money making money — exponential.</p></div><div class="ms"><h3>Rule of 72</h3><p>Divide 72 by your annual return = years to double your money.</p><ul><li>6% (FD): doubles in 12 years</li><li>12% (mutual funds): doubles in 6 years</li><li>18% (good stocks): doubles in 4 years</li></ul><div class="ib"><b>&#8377;1 lakh at 12% for 30 years</b> → &#8377;30 lakh. No extra deposits. Just time.</div></div><div class="wb" style="margin-top:10px"><b>The cost of waiting 1 year at age 20</b> is far greater than waiting 1 year at age 40.</div><div class="qsec"><div class="qq">Rule of 72: how long to double money at 9%/year?</div><div class="qopts"><button class="qo" onclick="ansQ(this,false)">9 years</button><button class="qo" onclick="ansQ(this,true)">8 years</button><button class="qo" onclick="ansQ(this,false)">6 years</button></div><div class="qfb"></div><div class="xppop"></div></div>'
  },
  {
    id:14, cat:'advanced', col:'cb', icon:'&#127757;',
    tag:'&#128640; Advanced', title:'Macro Economics & Markets',
    desc:'How RBI rates, inflation, and GDP affect your portfolio.',
    time:'8 min', xp:130, qxp:35, level:'Advanced',
    body:'<div class="ms"><h3>RBI &amp; Interest Rates</h3><ul><li><b>Rate Cut</b> → Cheaper loans → More spending → Stocks rise</li><li><b>Rate Hike</b> → Expensive loans → Less spending → Stocks fall</li></ul></div><div class="ms"><h3>Inflation</h3><p>High inflation → RBI raises rates → corporate margins squeezed → most stocks fall.</p><div class="ib"><b>Safe sectors during high inflation:</b> Energy, FMCG, Pharma</div></div><div class="ms"><h3>GDP</h3><p>India at 7%+ GDP = corporate revenues grow = stocks rise. Markets react to <em>expected</em> data, not past numbers.</p></div>'
  },

  // ── RESEARCHED ADDITIONS ──
  {
    id:15, cat:'basics', col:'cg', icon:'&#128176;',
    tag:'&#128214; App Basics', title:'What Is Investing?',
    desc:'Putting money to work so it grows faster than inflation.',
    time:'3 min', xp:50, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>Saving vs Investing</h3><p><b>Saving</b> keeps money safe but barely grows. <b>Investing</b> buys assets (stocks, funds) that can grow your wealth over time.</p></div><div class="ms"><h3>Why Invest?</h3><ul><li><b>Beat inflation</b> — prices rise ~5-6%/yr; idle cash loses value</li><li><b>Compounding</b> — returns earn their own returns</li><li><b>Goals</b> — retirement, home, education</li></ul><div class="ib"><b>Rule of 72:</b> Years to double ≈ 72 ÷ return%. At 12%, money doubles in ~6 years.</div></div><div class="wb"><b>Golden rule:</b> Only invest money you won’t need for 3–5 years.</div>'
  },
  {
    id:16, cat:'stocks', col:'cb', icon:'&#129534;',
    tag:'&#128200; Stocks', title:'Stocks vs Bonds',
    desc:'Ownership vs lending — the two core building blocks.',
    time:'4 min', xp:60, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>Stocks = Ownership</h3><p>Buy a share and you own a slice of the company. Higher risk, higher long-term return (~10-12% historically).</p></div><div class="ms"><h3>Bonds = Lending</h3><p>You lend money to a company/government and earn fixed interest. Lower risk, lower return.</p><div class="ib"><b>Trade-off:</b> Stocks for growth, bonds for stability. Most portfolios hold both.</div></div>'
  },
  {
    id:17, cat:'stocks', col:'co', icon:'&#129729;',
    tag:'&#128200; Stocks', title:'What Is an ETF?',
    desc:'One trade buys a whole basket of stocks.',
    time:'4 min', xp:65, qxp:20, level:'Beginner',
    body:'<div class="ms"><h3>Exchange-Traded Fund</h3><p>An <b>ETF</b> holds many stocks (or bonds) in one basket and trades on the exchange like a single stock.</p></div><div class="ms"><h3>Why investors love ETFs</h3><ul><li><b>Instant diversification</b> — one buy = dozens of companies</li><li><b>Low cost</b> — tiny expense ratios</li><li><b>Liquid</b> — buy/sell anytime markets are open</li></ul><div class="ib"><b>Example:</b> A NIFTY 50 ETF gives you all 50 top companies in one share.</div></div>'
  },
  {
    id:18, cat:'risk', col:'cr', icon:'&#128737;',
    tag:'&#128737; Risk', title:'Build an Emergency Fund First',
    desc:'Safety net before you ever invest a rupee.',
    time:'3 min', xp:55, qxp:15, level:'Beginner',
    body:'<div class="ms"><h3>Why it comes first</h3><p>Investments can drop right when you need cash. An emergency fund stops you from selling at a loss during a crisis.</p></div><div class="ms"><h3>How much?</h3><ul><li><b>3–6 months</b> of expenses</li><li>Keep it in a <b>savings account or liquid fund</b> — instant access</li><li>Only invest money <em>beyond</em> this buffer</li></ul><div class="wb"><b>Order:</b> Emergency fund → clear high-interest debt → then invest.</div></div>'
  },
  {
    id:19, cat:'strategy', col:'cg', icon:'&#128202;',
    tag:'&#9822; Strategy', title:'Index Funds & Expense Ratio',
    desc:'Why low-cost passive funds beat most active ones.',
    time:'5 min', xp:90, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>Index Funds</h3><p>They simply track an index (NIFTY 50, S&amp;P 500) instead of picking stocks. Low cost, low effort, and they beat most active funds over time.</p></div><div class="ms"><h3>Expense Ratio</h3><p>The annual fee a fund charges, as a % of your money. It looks tiny but compounds against you.</p><div class="wb"><b>1% vs 0.1% fee</b> on ₹10L over 30 years can cost <b>lakhs</b> in lost returns. Always check the expense ratio.</div></div>'
  },
  {
    id:20, cat:'risk', col:'cb', icon:'&#9878;',
    tag:'&#128737; Risk', title:'Asset Allocation 101',
    desc:'The mix of stocks, bonds & cash that drives most returns.',
    time:'5 min', xp:95, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>What is it?</h3><p>How you split money across asset classes — <b>stocks</b> (growth), <b>bonds</b> (stability), <b>cash</b> (safety). It matters more than picking individual stocks.</p></div><div class="ms"><h3>By goal &amp; age</h3><ul><li><b>Young / long horizon</b> → more stocks</li><li><b>Near goal / retirement</b> → more bonds &amp; cash</li><li>Rough guide: stock % ≈ <b>110 − your age</b></li></ul><div class="ib"><b>Rebalance</b> once a year to keep your target mix.</div></div>'
  },
  {
    id:21, cat:'risk', col:'co', icon:'&#128201;',
    tag:'&#128737; Risk', title:'Inflation & Real Returns',
    desc:'What your money actually earns after prices rise.',
    time:'4 min', xp:85, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>Nominal vs Real</h3><p><b>Real return = nominal return − inflation.</b> Earn 7% while inflation is 6%? Your real gain is just 1%.</p></div><div class="ms"><h3>Why cash is risky too</h3><p>Money sitting idle <em>loses</em> purchasing power every year. Beating inflation is the whole point of investing.</p><div class="ib"><b>₹100 today</b> buys what ~₹56 will in 10 years at 6% inflation.</div></div>'
  },
  {
    id:22, cat:'advanced', col:'cp', icon:'&#128181;',
    tag:'&#128640; Advanced', title:'Dividends & Yield',
    desc:'Getting paid just for holding a stock.',
    time:'5 min', xp:100, qxp:30, level:'Advanced',
    body:'<div class="ms"><h3>What’s a dividend?</h3><p>A share of profits a company pays its shareholders, usually quarterly. Not all companies pay them — growth firms often reinvest instead.</p></div><div class="ms"><h3>Dividend Yield</h3><p><b>Yield = annual dividend ÷ share price.</b> A ₹10 dividend on a ₹200 stock = 5% yield.</p><div class="wb"><b>Caution:</b> A very high yield can signal a falling price or an unsustainable payout — check the business first.</div></div><div class="ms"><h3>Reinvesting</h3><p>Reinvesting dividends supercharges compounding over decades.</p></div>'
  },
  {
    id:23, cat:'advanced', col:'cr', icon:'&#129504;',
    tag:'&#128640; Advanced', title:'Fear, Greed & Your Brain',
    desc:'The biggest threat to returns is the investor.',
    time:'5 min', xp:100, qxp:30, level:'Advanced',
    body:'<div class="ms"><h3>Behavioral traps</h3><ul><li><b>Herd mentality</b> — buying because everyone else is</li><li><b>Loss aversion</b> — panic-selling at the bottom</li><li><b>FOMO</b> — chasing hype after it has run up</li><li><b>Recency bias</b> — assuming the last trend continues</li></ul></div><div class="ms"><h3>How to win</h3><p>Automate investing (SIP), set rules, and ignore the noise. <b>Time in the market beats timing the market.</b></p><div class="ib"><b>Buffett:</b> “Be fearful when others are greedy, and greedy when others are fearful.”</div></div>'
  },

  // ── US MARKETS, CRYPTO & CHARTS ──
  {
    id:24, cat:'stocks', col:'cb', icon:'&#127482;&#127480;',
    tag:'&#128200; US Markets', title:'US Markets 101',
    desc:'NYSE, Nasdaq, and the big US indices explained.',
    time:'4 min', xp:70, qxp:20, level:'Beginner',
    body:'<div class="ms"><h3>The exchanges</h3><p>US stocks trade on the <b>NYSE</b> and <b>Nasdaq</b> (tech-heavy), in <b>US dollars ($)</b>, 9:30am–4:00pm ET.</p></div><div class="ms"><h3>The big indices</h3><ul><li><b>S&amp;P 500</b> — 500 large US companies, the main benchmark</li><li><b>Nasdaq 100</b> — 100 biggest non-financial Nasdaq names (very tech)</li><li><b>Dow Jones</b> — 30 large blue-chips</li></ul></div><div class="ms"><h3>Rules &amp; costs</h3><p>The <b>SEC</b> regulates US markets (like SEBI in India). Most US brokers now charge <b>zero commission</b> on stock trades. Company filings (10-K, 10-Q) are public on <b>SEC EDGAR</b>.</p><div class="ib"><b>Tip:</b> Switch the app to the US market to practise with AAPL, MSFT, NVDA and more.</div></div>'
  },
  {
    id:25, cat:'advanced', col:'co', icon:'&#9883;',
    tag:'&#127760; Crypto', title:'Crypto & Blockchain Basics',
    desc:'What crypto is, and why it behaves so differently.',
    time:'5 min', xp:90, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>Blockchain</h3><p>A <b>blockchain</b> is a shared, tamper-resistant ledger maintained by a network — no single bank or company controls it.</p></div><div class="ms"><h3>The big two</h3><ul><li><b>Bitcoin (BTC)</b> — digital money / store of value</li><li><b>Ethereum (ETH)</b> — a platform for smart contracts and apps</li></ul></div><div class="ms"><h3>Why it’s different</h3><ul><li>Trades <b>24/7</b>, including weekends</li><li><b>Very volatile</b> — 10%+ swings in a day are common</li><li>No earnings or dividends — value is driven by demand &amp; adoption</li></ul><div class="wb"><b>Rule:</b> Only put in what you can afford to lose, keep it a small slice, and never use leverage as a beginner.</div></div>'
  },
  {
    id:26, cat:'stocks', col:'cg', icon:'&#128367;',
    tag:'&#128200; Charts', title:'Reading Candlestick Charts',
    desc:'Decode the green and red candles on a price chart.',
    time:'5 min', xp:85, qxp:25, level:'Intermediate',
    body:'<div class="ms"><h3>One candle = one time period</h3><p>Each candle shows four prices for that period: <b>Open, High, Low, Close (OHLC)</b>.</p><ul><li><b>Body</b> — the open-to-close range</li><li><b>Wick/shadow</b> — the high and low extremes</li><li><b>Green</b> = closed up · <b>Red</b> = closed down</li></ul></div><div class="ms"><h3>Timeframes</h3><p>A 5-minute candle vs a daily candle tell very different stories. Zoom out for the trend, zoom in for entries.</p><div class="ib"><b>Try it:</b> Open the Market tab — the chart switches between 1D, 1W, 1M… candles for any stock.</div></div>'
  },
  {
    id:27, cat:'advanced', col:'cp', icon:'&#128201;',
    tag:'&#128640; Advanced', title:'Indicators: RSI & MACD',
    desc:'Two popular indicators — and their limits.',
    time:'6 min', xp:110, qxp:30, level:'Advanced',
    body:'<div class="ms"><h3>RSI (Relative Strength Index)</h3><p>A 0–100 momentum gauge. Above <b>70</b> = often "overbought", below <b>30</b> = often "oversold". It hints at extremes, not certainties.</p></div><div class="ms"><h3>MACD</h3><p>Tracks momentum by comparing two moving averages. A line crossing its signal line is read as a momentum shift.</p></div><div class="ms"><h3>The honest truth</h3><p>Indicators describe <b>past</b> price — they’re not crystal balls. Many traders combine them with fundamentals and risk rules.</p><div class="wb"><b>Never</b> trade on a single indicator alone, and always size positions for the risk.</div></div>'
  },
];

// ─── RENDER LESSONS ──────────────────────────────────────
function filterCat(cat, btn) {
  curCat = cat;
  document.querySelectorAll('.lcat').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderLessons();
}

// Three difficulty levels form the learning path.
window.LEVELS = [
  { name: 'Beginner',     level: 'Beginner' },
  { name: 'Intermediate', level: 'Intermediate' },
  { name: 'Advanced',     level: 'Advanced' }
];
var LEVEL_RANK = { Beginner: 0, Intermediate: 1, Advanced: 2 };

// Lessons ordered Beginner → Intermediate → Advanced (stable by id within).
function orderedLessons() {
  return LESSONS.slice().sort(function(a, b) {
    return (LEVEL_RANK[a.level] - LEVEL_RANK[b.level]) || (a.id - b.id);
  });
}

// Locked lessons open a PREVIEW (what you'll learn + reward) instead of a
// dead-end toast — this builds anticipation rather than just saying "no".
function previewLockedLesson(l) {
  // Pull section headings from the lesson body as a "what you'll learn" list.
  var topics = [];
  var re = /<h3>([\s\S]*?)<\/h3>/g, m;
  while ((m = re.exec(l.body)) !== null) { topics.push(m[1].replace(/<[^>]+>/g, '').trim()); }

  document.getElementById('mTag').innerHTML = l.tag + ' · ' + l.level;
  document.getElementById('mTit').textContent = l.title;
  document.getElementById('mMeta').innerHTML =
    '<span class="mmi">&#128274; Locked</span>'
    + '<span class="mmi">&#9201; ' + l.time + '</span>'
    + '<span class="mmi">&#9889; +' + l.xp + ' XP</span>'
    + '<span class="mmi">&#127775; +' + l.qxp + ' quiz bonus</span>';

  document.getElementById('mBody').innerHTML =
    '<div class="ms"><p>' + (l.desc || 'A guided lesson with a short quiz to earn XP.') + '</p></div>'
    + (topics.length
        ? '<div class="ms"><h3>What you\'ll learn</h3><ul>' + topics.map(function(t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>'
        : '')
    + '<div class="wb" style="margin-top:10px;display:flex;gap:8px;align-items:center;">'
    + '<span>&#128274;</span><span>Complete the earlier lessons on the path to unlock this one and earn <b>+' + (l.xp + l.qxp) + ' XP</b>.</span></div>';

  document.getElementById('mXpL').textContent = 'Unlock to earn +' + l.xp + ' XP';

  var btn = document.getElementById('btnDone');
  btn.textContent = '🔒 Locked — finish earlier lessons';
  btn.disabled = true;

  document.getElementById('modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

// Sequential unlock along the level-ordered path.
function firstIncompleteIndex() {
  var ord = orderedLessons();
  for (var i = 0; i < ord.length; i++) {
    if (!completedL.has(ord[i].id)) return i;
  }
  return ord.length;
}

// Placement test unlocks everything up to and including the user's level.
function placementRank() {
  if (window.userProfile && userProfile.placement != null && LEVEL_RANK[userProfile.placement] != null) {
    return LEVEL_RANK[userProfile.placement];
  }
  return -1;
}

function isLessonLocked(id) {
  var ord = orderedLessons();
  var idx = ord.findIndex(function(l) { return l.id === id; });
  if (idx === -1) return false;
  if (completedL.has(id)) return false;
  if (placementRank() >= LEVEL_RANK[ord[idx].level]) return false;
  return idx > firstIncompleteIndex();
}

function renderLessons() {
  var g = document.getElementById('lgrid');
  if (!g) return;

  var ord = orderedLessons();
  var activeIdx = firstIncompleteIndex();
  var orderIndex = {};
  ord.forEach(function(l, i) { orderIndex[l.id] = i; });

  // Course progress + header badges
  var totalTxt = document.getElementById('courseProgTxt');
  if (totalTxt) totalTxt.textContent = completedL.size + '/' + LESSONS.length;
  var fill = document.getElementById('courseFill');
  if (fill) fill.style.width = Math.round(completedL.size / LESSONS.length * 100) + '%';
  var lv = getLv(totalXP);
  var lvB = document.getElementById('lLvBadge'); if (lvB) lvB.textContent = 'Lv ' + lv.num;
  var xpB = document.getElementById('lXpBadge'); if (xpB) xpB.textContent = totalXP;

  // ── Duolingo-style learning PATH ──
  // Gentle left-right wave so nodes snake down the page.
  var WAVE = [0, 52, 78, 52, 0, -52, -78, -52];
  var unitTheme = ['u-green', 'u-teal', 'u-amber', 'u-violet'];
  var node = 0;

  g.className = 'path';
  g.innerHTML = LEVELS.map(function(sec, si) {
    var lessons = ord.filter(function(l) { return l.level === sec.level; });
    if (!lessons.length) return '';
    var doneCount = lessons.filter(function(l) { return completedL.has(l.id); }).length;

    var nodes = lessons.map(function(l) {
      var done = completedL.has(l.id);
      var i = orderIndex[l.id];
      var locked = !done && isLessonLocked(l.id);
      var active = !done && i === activeIdx;
      var state = done ? 'done' : (active ? 'active' : (locked ? 'locked' : 'open'));
      var off = WAVE[node % WAVE.length];
      node++;
      var inner = done ? '&#10003;' : (locked ? '&#128274;' : l.icon);
      return '<div class="pnode ' + state + '" style="transform:translateX(' + off + 'px)">'
        + (active ? '<div class="pnode-start">START</div>' : '')
        + '<button class="pnode-btn" onclick="openLesson(' + l.id + ')" aria-label="' + l.title + '">' + inner + '</button>'
        + '<div class="pnode-label">' + l.title + '</div>'
        + '<div class="pnode-meta" style="font-size:10px;opacity:.65;margin-top:2px;">&#9889; +' + l.xp + ' XP &middot; &#9201; ' + l.time + (locked ? ' &middot; tap to preview' : '') + '</div>'
        + '</div>';
    }).join('');

    return '<div class="unit-head ' + unitTheme[si % unitTheme.length] + '">'
      + '<div class="unit-k">Unit ' + (si + 1) + ' &middot; ' + doneCount + '/' + lessons.length + '</div>'
      + '<div class="unit-t">' + sec.name + '</div></div>'
      + '<div class="unit-nodes">' + nodes + '</div>';
  }).join('');
}

// ─── DYNAMIC QUIZ ENGINE ─────────────────────────────────
// Pool of questions per lesson category. A random one is drawn and its
// options shuffled each time a lesson opens, so quizzes are never static.
window.QUIZ_BANK = [
  // Foundations / basics
  { cat:'basics', q:'What do the green B and red S buttons on a stock card do?', correct:'Open a Buy or Sell order', wrong:['Bookmark the stock','Show the company news'], why:'B opens a Buy order, S opens a Sell order for that stock.',
    wrongWhy:{ 'Bookmark the stock':'Bookmarking is the star/watchlist icon, not the B/S buttons.', 'Show the company news':'News appears on the dashboard feed and the stock detail page, not via B/S.' },
    example:'Tap B on Apple, enter 2 shares, confirm — your virtual cash drops and Apple appears in Holdings.' },
  { cat:'basics', q:'Invested ₹10,000, portfolio now ₹11,500 — your gain is?', correct:'₹1,500 (15%)', wrong:['₹1,000 (10%)','₹500 (5%)'], why:'11,500 − 10,000 = ₹1,500, and 1,500 ÷ 10,000 = 15%.',
    wrongWhy:{ '₹1,000 (10%)':'10% of 10,000 would be only ₹1,000 — but the value rose by ₹1,500.', '₹500 (5%)':'₹500 is just 5%; your value actually climbed three times that.' },
    example:'Gain % = (Now − Invested) ÷ Invested × 100. It’s always measured against what you put in.',
    funFact:'Professionals call this your “return on investment” (ROI) — the single most-quoted number in finance.' },
  { cat:'basics', q:'What does "Total Portfolio Value" represent?', correct:'All holdings valued at current prices', wrong:['Only the cash in your wallet','The money you originally invested'], why:'It is every holding marked to its live price — not your cash or your cost.',
    wrongWhy:{ 'Only the cash in your wallet':'Cash is separate — portfolio value is your stocks priced live.', 'The money you originally invested':'That’s your cost basis (Invested); value moves with the market, cost doesn’t.' },
    example:'Own 10 shares now worth ₹120 each → portfolio value ₹1,200, even if you paid ₹100 each.' },
  { cat:'basics', q:'On a stock card, what does the percentage under the price show?', correct:'How much the price moved today', wrong:['The dividend yield','The broker commission'], why:'That % is the day change — how far the price moved from the previous close.',
    wrongWhy:{ 'The dividend yield':'Yield is annual dividend ÷ price and barely changes day to day.', 'The broker commission':'Commissions are flat fees, not shown as a live % on the card.' } },
  { cat:'basics', q:'Short-term red (losses) in a portfolio usually means?', correct:'Normal market movement — stay patient', wrong:['You must sell immediately','The app has a bug'], why:'Prices swing daily; short-term red is normal and not a reason to panic-sell.',
    wrongWhy:{ 'You must sell immediately':'Selling on every dip locks in losses — the classic beginner mistake.', 'The app has a bug':'Prices simply move both ways; red days are part of investing.' },
    funFact:'The S&P 500 has fallen on roughly 46% of all trading days in history — yet it has risen over almost every long stretch.' },
  // Stocks & markets
  { cat:'stocks', q:'You own 10 of 1,000 total shares. What % do you own?', correct:'1%', wrong:['0.1%','10%'], why:'10 ÷ 1,000 = 0.01 = 1%.',
    wrongWhy:{ '0.1%':'0.1% would be 1 share out of 1,000 — you own ten times that.', '10%':'10% would be 100 shares; you only hold 10.' },
    example:'Ownership % = your shares ÷ total shares. Big companies have billions of shares, so each one is a tiny slice.' },
  { cat:'stocks', q:'Which index tracks India’s top 50 NSE companies?', correct:'NIFTY 50', wrong:['SENSEX','BANK NIFTY'], why:'NIFTY 50 is the NSE benchmark of 50 large-caps; SENSEX is BSE’s 30.',
    wrongWhy:{ 'SENSEX':'SENSEX tracks 30 companies on the BSE, not 50 on the NSE.', 'BANK NIFTY':'BANK NIFTY is only the 12 largest banking stocks, not the broad top 50.' },
    funFact:'The US equivalent is the S&P 500; Japan has the Nikkei 225 — almost every market has a flagship index.' },
  { cat:'stocks', q:'A high P/E ratio versus peers generally signals the stock is?', correct:'Expensive / potentially overvalued', wrong:['A guaranteed bargain','Paying high dividends'], why:'A high P/E means you pay more per rupee of earnings — pricier, unless growth justifies it.',
    wrongWhy:{ 'A guaranteed bargain':'High P/E is the opposite of cheap — a low P/E is more bargain-like.', 'Paying high dividends':'P/E says nothing about dividends; that’s the dividend yield.' },
    example:'If a stock trades at ₹3,800 and earns ₹120/share, its P/E is ~32 — you pay ₹32 for every ₹1 of profit.' },
  { cat:'stocks', q:'Buying a share makes you a?', correct:'Part-owner of the company', wrong:['Lender to the company','Employee of the company'], why:'Shares are ownership; lending money to a company is a bond.',
    wrongWhy:{ 'Lender to the company':'Lending = buying a bond, which pays interest, not ownership.', 'Employee of the company':'Owning shares doesn’t make you staff — you just share in profits and votes.' } },
  { cat:'stocks', q:'Two main ways a stock makes you money are capital appreciation and?', correct:'Dividends', wrong:['Interest coupons','Loyalty points'], why:'Stocks pay you via price gains (appreciation) and dividends; coupons are for bonds.',
    wrongWhy:{ 'Interest coupons':'Coupons are fixed bond payments — stocks don’t pay them.', 'Loyalty points':'Shares aren’t a rewards card; returns come from price and dividends.' } },
  { cat:'stocks', q:'Market capitalisation is calculated as?', correct:'Share price × total shares', wrong:['Price ÷ earnings','Revenue − costs'], why:'Market cap = price × shares outstanding (Price ÷ earnings is the P/E).',
    wrongWhy:{ 'Price ÷ earnings':'That formula is the P/E ratio, a valuation multiple — not company size.', 'Revenue − costs':'Revenue minus costs is profit, which doesn’t equal market value.' },
    example:'A ₹500 share with 2 billion shares = ₹1 lakh crore market cap. Price alone doesn’t tell you company size — shares do too.' },
  // Risk & strategy
  { cat:'risk', q:'Which risk affects ALL stocks at once?', correct:'Market risk', wrong:['Company risk','Liquidity risk'], why:'Market (systematic) risk hits the whole market — e.g. a crash; company risk is specific to one firm.',
    wrongWhy:{ 'Company risk':'Company (unsystematic) risk hits one firm — diversification can cancel it out.', 'Liquidity risk':'Liquidity risk is about how easily you can sell, not a market-wide move.' },
    example:'In the March 2020 COVID crash, almost every stock fell together — that’s market risk in action.' },
  { cat:'risk', q:'The most proven way to reduce risk for retail investors is?', correct:'Diversification across sectors', wrong:['Putting everything in one hot stock','Borrowing to invest more'], why:'Spreading across sectors means one company’s fall doesn’t sink your whole portfolio.',
    wrongWhy:{ 'Putting everything in one hot stock':'Concentration multiplies risk — one bad quarter can wipe you out.', 'Borrowing to invest more':'Leverage amplifies losses as much as gains — it increases risk.' },
    funFact:'Nobel laureate Harry Markowitz called diversification “the only free lunch in investing.”' },
  { cat:'risk', q:'Higher potential returns usually come with?', correct:'Higher risk', wrong:['Zero risk','Guaranteed profit'], why:'Risk and reward move together — higher possible returns carry higher risk of loss.',
    wrongWhy:{ 'Zero risk':'Nothing offering high returns is risk-free — that combo is the #1 sign of a scam.', 'Guaranteed profit':'No real investment guarantees profit; “guaranteed” high returns are a red flag.' } },
  { cat:'risk', q:'Inflation risk means?', correct:'Returns may not beat rising prices', wrong:['Your broker raises fees','The market closes early'], why:'If your return is below inflation, your money loses real purchasing power.',
    wrongWhy:{ 'Your broker raises fees':'That’s a cost, not inflation — inflation is economy-wide rising prices.', 'The market closes early':'Trading hours have nothing to do with inflation risk.' },
    example:'Earn 5% in a year when inflation is 6%, and you’ve actually lost 1% in real buying power.' },
  { cat:'strategy', q:'A SIP (Systematic Investment Plan) means you?', correct:'Invest a fixed amount at regular intervals', wrong:['Sell everything each month','Trade options weekly'], why:'A SIP invests a set amount on a schedule (e.g. monthly), averaging your cost over time.',
    wrongWhy:{ 'Sell everything each month':'A SIP is about steadily buying, not monthly selling.', 'Trade options weekly':'Options trading is high-risk and the opposite of a calm, automatic SIP.' },
    example:'₹5,000 every month into an index fund — automatic, emotion-free, and it averages your buy price.' },
  { cat:'strategy', q:'Rupee/dollar-cost averaging automatically buys more units when prices?', correct:'Fall', wrong:['Rise','Stay flat'], why:'A fixed amount buys more units when prices are low and fewer when high — lowering average cost.',
    wrongWhy:{ 'Rise':'When prices rise, a fixed amount buys fewer units, not more.', 'Stay flat':'If prices never move, you’d buy the same number every time — no averaging benefit.' },
    example:'₹3,000 buys 30 units at ₹100, but 60 units at ₹50 — so dips quietly work in your favour.' },
  { cat:'strategy', q:'Long-term investing tends to win because of?', correct:'Compounding over time', wrong:['Daily market timing','Frequent trading fees'], why:'Compounding lets returns earn their own returns — it snowballs the longer you stay invested.',
    wrongWhy:{ 'Daily market timing':'Even pros rarely time the market well; it usually hurts returns.', 'Frequent trading fees':'Fees are a cost that drags returns down, not a reason long-term wins.' },
    funFact:'₹10,000/month at 12% for 30 years grows to ~₹3.5 crore — but you’d have invested only ₹36 lakh. The rest is compounding.' },
  { cat:'strategy', q:'Checking prices every hour usually leads to?', correct:'Emotional panic decisions', wrong:['Better returns','Lower taxes'], why:'Obsessive checking fuels fear/greed and impulsive trades — think in years, not hours.',
    wrongWhy:{ 'Better returns':'Studies show frequent traders usually underperform patient ones.', 'Lower taxes':'Trading more often tends to trigger more short-term tax, not less.' } },
  // Advanced
  { cat:'advanced', q:'An ETF is best described as?', correct:'A basket of assets traded like a stock', wrong:['A single company’s bond','A type of savings account'], why:'An ETF holds many securities in one basket and trades on the exchange like a share.',
    wrongWhy:{ 'A single company’s bond':'A bond is one issuer’s debt; an ETF spreads across many holdings.', 'A type of savings account':'A savings account is bank cash with fixed interest — an ETF holds market assets that fluctuate.' },
    example:'One share of a NIFTY 50 ETF gives you a slice of all 50 companies at once — instant diversification.' },
  { cat:'advanced', q:'Futures and options are mainly?', correct:'High-risk instruments, not for beginners', wrong:['Safe guaranteed-return products','Government savings bonds'], why:'Derivatives use leverage and can lose money fast — they’re not beginner products.',
    wrongWhy:{ 'Safe guaranteed-return products':'Derivatives are among the riskiest instruments — nothing guaranteed.', 'Government savings bonds':'Those are low-risk government debt — the opposite of derivatives.' },
    funFact:'SEBI data has shown the large majority of retail F&O traders lose money — a big reason they’re not for beginners.' },
  { cat:'advanced', q:'Crypto differs from stocks mainly because it?', correct:'Trades 24/7 and is highly volatile', wrong:['Pays fixed dividends','Is risk-free'], why:'Crypto trades around the clock with big swings, and pays no dividend or fixed return.',
    wrongWhy:{ 'Pays fixed dividends':'Crypto has no earnings or dividends — value comes from demand alone.', 'Is risk-free':'Crypto is among the most volatile assets there is — far from risk-free.' },
    example:'Bitcoin can move 10%+ in a single day, including weekends when stock markets are closed.' },

  // ── True / False ──
  { cat:'basics', type:'tf', q:'A stock’s price always reflects the company’s true value.', answer:false, why:'Prices reflect supply, demand and sentiment — not always fair value.' },
  { cat:'basics', type:'tf', q:'You can own a fraction of a company by buying one share.', answer:true, why:'A share is a small ownership slice of the company.' },
  { cat:'stocks', type:'tf', q:'A higher P/E ratio always means a better investment.', answer:false, why:'High P/E can mean overvalued — context and growth matter.' },
  { cat:'stocks', type:'tf', q:'The NIFTY 50 tracks 50 large companies on the NSE.', answer:true, why:'NIFTY 50 is the NSE’s benchmark of 50 large-caps.' },
  { cat:'risk', type:'tf', q:'Diversification can reduce company-specific risk.', answer:true, why:'Spreading across sectors cushions a single company’s fall.' },
  { cat:'risk', type:'tf', q:'A fixed deposit carries more risk than stocks.', answer:false, why:'FDs are low-risk; stocks carry higher risk for higher returns.' },
  { cat:'strategy', type:'tf', q:'Dollar-cost averaging buys more units when prices fall.', answer:true, why:'Fixed-amount investing buys more when prices are low.' },
  { cat:'strategy', type:'tf', q:'Timing the market daily reliably beats long-term investing.', answer:false, why:'Time in the market usually beats timing the market.' },
  { cat:'advanced', type:'tf', q:'An ETF can be bought and sold like a stock during market hours.', answer:true, why:'ETFs trade intraday on exchanges, unlike most mutual funds.' },
  { cat:'advanced', type:'tf', q:'Options and futures are beginner-friendly, low-risk products.', answer:false, why:'Derivatives are high-risk and not meant for beginners.' },

  // ── More multiple-choice (with explanations) ──
  { cat:'basics', q:'“Market cap” of a company is?', correct:'Share price × number of shares', wrong:['Yearly profit','Total debt'], why:'Market cap = price × shares outstanding.' },
  { cat:'stocks', q:'A dividend is?', correct:'A share of profits paid to shareholders', wrong:['A loan repayment','A trading fee'], why:'Companies distribute part of profits as dividends.' },
  { cat:'risk', q:'“Volatility” measures?', correct:'How much a price swings up and down', wrong:['Total dividends paid','The broker’s fee'], why:'Higher volatility = larger price swings = more risk.' },
  { cat:'strategy', q:'Compounding works best with?', correct:'Time — staying invested longer', wrong:['Frequent withdrawals','Daily trading'], why:'Returns earning returns snowball over long periods.' },

  // ── Researched additions ──
  { cat:'basics', q:'The main reason to invest instead of just saving is to?', correct:'Beat inflation and grow wealth', wrong:['Avoid all risk','Keep cash instantly available'], why:'Idle cash loses value to inflation; investing aims to outgrow it.' },
  { cat:'basics', q:'By the Rule of 72, money at 12% return roughly doubles in?', correct:'About 6 years', wrong:['About 2 years','About 20 years'], why:'72 ÷ 12 ≈ 6 years to double.' },
  { cat:'basics', type:'tf', q:'Idle cash keeps its purchasing power over many years.', answer:false, why:'Inflation erodes cash’s purchasing power every year.' },
  { cat:'stocks', q:'A bond represents?', correct:'Lending money for fixed interest', wrong:['Ownership of the company','A type of dividend'], why:'Bonds are loans; stocks are ownership.' },
  { cat:'stocks', q:'A key advantage of an ETF is?', correct:'Instant diversification at low cost', wrong:['Guaranteed returns','No risk at all'], why:'One ETF holds many securities cheaply.' },
  { cat:'stocks', type:'tf', q:'An ETF can be bought and sold during market hours like a stock.', answer:true, why:'ETFs trade intraday on the exchange.' },
  { cat:'risk', q:'Before investing, you should first build?', correct:'An emergency fund of 3–6 months expenses', wrong:['A portfolio of risky stocks','A margin trading account'], why:'A cash buffer prevents selling investments at a loss in a crisis.' },
  { cat:'risk', q:'“Real return” means?', correct:'Return after subtracting inflation', wrong:['Return before any fees','The highest possible return'], why:'Real return = nominal return − inflation.' },
  { cat:'risk', q:'A rough guide for stock allocation by age is?', correct:'About 110 minus your age, in %', wrong:['Always 100% stocks','Always 50/50'], why:'Younger investors can hold more stocks; shift to bonds nearer goals.' },
  { cat:'risk', type:'tf', q:'Asset allocation usually matters more than picking individual stocks.', answer:true, why:'The stock/bond/cash mix drives most of a portfolio’s outcome.' },
  { cat:'strategy', q:'A fund’s expense ratio is?', correct:'The annual fee charged as a % of your money', wrong:['Its yearly return','A one-time entry charge'], why:'Even small fees compound against you over decades.' },
  { cat:'strategy', q:'Index funds aim to?', correct:'Track an index at low cost', wrong:['Beat the market by trading fast','Avoid the market entirely'], why:'They mirror an index cheaply and beat most active funds long-term.' },
  { cat:'advanced', q:'Dividend yield is calculated as?', correct:'Annual dividend ÷ share price', wrong:['Share price ÷ earnings','Profit ÷ total shares'], why:'Yield = annual dividend / price.' },
  { cat:'advanced', q:'Panic-selling at the bottom is an example of?', correct:'A behavioral bias (loss aversion)', wrong:['Smart risk management','Diversification'], why:'Emotion-driven selling locks in losses — a classic behavioral trap.' },
  { cat:'advanced', type:'tf', q:'“Time in the market” generally beats “timing the market.”', answer:true, why:'Staying invested long-term tends to outperform trying to jump in and out.' },

  // ── US markets, crypto & charts ──
  { cat:'stocks', q:'The main US benchmark of 500 large companies is the?', correct:'S&P 500', wrong:['Nasdaq 100','Dow Jones'], why:'The S&P 500 tracks 500 large US companies; the Dow is just 30 and the Nasdaq 100 is tech-heavy.' },
  { cat:'stocks', q:'Who regulates the US stock market?', correct:'The SEC', wrong:['The SEBI','The RBI'], why:'The SEC regulates US markets; SEBI and RBI are Indian regulators.' },
  { cat:'stocks', type:'tf', q:'A red candlestick means the price closed lower than it opened.', answer:true, why:'Red = close below open (a down period); green = close above open.' },
  { cat:'stocks', q:'On a candlestick, the thin line above/below the body is the?', correct:'Wick (high/low extremes)', wrong:['Dividend marker','Volume bar'], why:'The wick (shadow) shows the high and low; the body shows open-to-close.' },
  { cat:'advanced', q:'An RSI reading above 70 is often described as?', correct:'Overbought', wrong:['Oversold','Guaranteed to rise'], why:'RSI > 70 = often "overbought", < 30 = "oversold" — hints at extremes, not certainties.' },
  { cat:'advanced', type:'tf', q:'Crypto markets trade 24/7, including weekends.', answer:true, why:'Unlike stock exchanges, crypto trades around the clock every day.' },
  { cat:'advanced', q:'Bitcoin and Ethereum differ in that Ethereum is mainly a?', correct:'Platform for smart contracts and apps', wrong:['Government currency','Fixed-income bond'], why:'Ethereum runs smart contracts/apps; Bitcoin is primarily digital money / store of value.' },
  { cat:'advanced', type:'tf', q:'Technical indicators like RSI and MACD can reliably predict future prices.', answer:false, why:'Indicators describe past price action — they are not crystal balls; combine them with risk rules.' }
];

function pickQuiz(cat) {
  var pool = QUIZ_BANK.filter(function(q) { return q.cat === cat; });
  if (!pool.length) pool = QUIZ_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderDynamicQuiz(lesson) {
  var q = pickQuiz(lesson.cat);
  var opts = [{ t: q.correct, c: true }].concat(q.wrong.map(function(w) { return { t: w, c: false }; }));
  for (var i = opts.length - 1; i > 0; i--) { // Fisher–Yates shuffle
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
  }
  return '<div class="qsec"><div class="qq">' + q.q + '</div><div class="qopts">'
    + opts.map(function(o) { return '<button class="qo" onclick="ansQ(this,' + (o.c ? 'true' : 'false') + ')">' + o.t + '</button>'; }).join('')
    + '</div><div class="qfb"></div><div class="xppop"></div></div>';
}

// ─── LESSON MODAL ────────────────────────────────────────
function openLesson(id) {
  var l = LESSONS.find(function(x) { return x.id === id; });
  if (!l) return;
  if (isLessonLocked(id)) {
    previewLockedLesson(l);
    return;
  }
  curLesson = l;
  quizDone = false;

  document.getElementById('mTag').innerHTML = l.tag + ' \u00B7 ' + l.level;
  document.getElementById('mTit').textContent = l.title;
  document.getElementById('mMeta').innerHTML =
    '<span class="mmi">&#9201; ' + l.time + '</span>'
    + '<span class="mmi">&#9889; +' + l.xp + ' XP</span>'
    + '<span class="mmi">&#127775; +' + l.qxp + ' quiz bonus</span>'
    + (completedL.has(id) ? '<span class="mmi" style="color:var(--gr)">&#10003; Done</span>' : '');

  // Strip the static in-body quiz; quiz now runs as a gamified session
  var bodyHtml = l.body.replace(/<div class="qsec">[\s\S]*$/, '');
  document.getElementById('mBody').innerHTML = bodyHtml
    + '<button class="quiz-cta" onclick="startQuiz(curLesson)">&#127919; Take the quiz'
    + '<span class="quiz-cta-sub">5 questions &middot; +' + l.qxp + ' bonus XP &middot; &#10084; 3 lives</span></button>';
  document.getElementById('mXpL').textContent = 'Earn +' + l.xp + ' XP';

  var btn  = document.getElementById('btnDone');
  var done = completedL.has(id);
  btn.textContent = done ? '\u2705 Already Completed' : 'Mark Complete \u2713';
  btn.disabled    = done;

  document.getElementById('modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('on');
  document.body.style.overflow = '';
  quizDone = false;
}

function completeLesson() {
  if (!curLesson || completedL.has(curLesson.id)) return;
  completedL.add(curLesson.id);
  Store.set('completedLessons', Array.from(completedL));
  addXP(curLesson.xp, '\uD83C\uDF89 +' + curLesson.xp + ' XP Earned!');
  renderLessons();
  closeModal();
}

// ─── QUIZ ─────────────────────────────────────────────────
function ansQ(btn, correct) {
  if (quizDone) return;
  quizDone = true;

  btn.closest('.qopts').querySelectorAll('.qo').forEach(function(o) { o.disabled = true; });

  var fb  = btn.closest('.qsec').querySelector('.qfb');
  var xpp = btn.closest('.qsec').querySelector('.xppop');

  if (correct) {
    btn.classList.add('ok');
    fb.textContent = '\u2705 Correct!';
    fb.className   = 'qfb on g';
    var bonus = curLesson ? curLesson.qxp : 15;
    xpp.textContent = '+' + bonus + ' XP quiz bonus! \u26A1';
    xpp.className   = 'xppop on';
    addXP(bonus, '\u2B50 +' + bonus + ' XP Quiz Bonus!');
  } else {
    btn.classList.add('no');
    fb.textContent = '\u274C Not quite \u2014 re-read above!';
    fb.className   = 'qfb on b';
  }
}
