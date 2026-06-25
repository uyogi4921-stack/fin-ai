/* ═══════════════════════════════════════════════════════════
   FINVEST AI — ai.js
   Fin — AI Portfolio Advisor
   Smart offline response engine with conversation memory
═══════════════════════════════════════════════════════════ */

'use strict';

var aiStarted = false;
var aiTyping  = false;
var chatHistory = Store.get('chatHistory', []); // persist conversation memory across sessions

// ─── DYNAMIC PORTFOLIO CONTEXT ──────────────────────────
function getPortfolioSummary() {
  var port = calcPortfolio();
  var sectors = Object.keys(port.sectorAlloc);
  var sectorStr = sectors.map(function(s) {
    return s + ' ' + (port.sectorAlloc[s] / port.totalValue * 100).toFixed(1) + '%';
  }).join(', ');
  return {
    value: port.totalValue,
    invested: port.totalInvested,
    gain: port.totalGain,
    gainPct: port.gainPct,
    stocks: port.stockCount,
    sectors: port.sectorCount,
    sectorStr: sectorStr || 'None',
    ownedSectors: sectors,
    holdings: HOLDS.map(function(h) { return h.sym + '(' + h.qty + ')'; }).join(', ') || 'None'
  };
}

// ─── MARKET-AWARE SECTOR HELPERS ────────────────────────
// Sectors that exist in the *currently active* market (US / India / Crypto),
// so the advisor never recommends Indian sectors while trading US equities.
function marketSectorList() {
  var m = window.MKT || MARKETS[currentMarket];
  if (m && m.cats) return m.cats.filter(function(c) { return c !== 'All'; });
  // Fallback: derive from the tradable universe.
  var seen = {};
  ST.forEach(function(s) { seen[s.sec] = 1; });
  return Object.keys(seen);
}
// Sectors in this market the user has NO exposure to yet.
function missingSectors(ownedSectors) {
  return marketSectorList().filter(function(sec) { return ownedSectors.indexOf(sec) === -1; });
}
// Goal-aware guidance — uses the goal chosen during onboarding to point the
// user at the most relevant next step (lessons, market, or AI topic).
function goalSuggestion(goal) {
  switch (goal) {
    case 'Understand crypto':
      return 'Since you want to <b>understand crypto</b>: switch to the <b>Crypto</b> market to explore BTC/ETH, and ask me <i>"how is crypto different from stocks?"</i>';
    case 'Beat the market':
      return 'To <b>beat the market</b>, start by understanding what the market returns — ask me about <i>index funds</i>, <i>P/E ratios</i>, or <i>diversification</i>.';
    case 'Grow my savings':
      return 'To <b>grow your savings</b> steadily, try the <b>SIP Calculator</b> in Resources and ask me about <i>compounding</i> and <i>SIPs</i>.';
    case 'Learn the basics':
    default:
      return 'Since you\'re here to <b>learn the basics</b>, start with the <b>Learn</b> path and ask me things like <i>"what is a stock?"</i> or <i>"how do I start investing?"</i>';
  }
}

// A real, tradable stock in a sector that the user doesn't already own.
function pickForSector(sec) {
  var owned = HOLDS.map(function(h) { return h.sym; });
  var inSec = ST.filter(function(s) { return s.sec === sec && owned.indexOf(s.s) === -1; });
  return inSec.length ? inSec[0] : (ST.filter(function(s) { return s.sec === sec; })[0] || null);
}

// ─── RESPONSE BANK — Multiple variants per topic ────────
var AI_BANK = {
  diversification: [
    function(p) {
      if (p.stocks === 0) {
        return '<b>Portfolio Diversification Analysis</b><br><br>'
          + 'You don\'t own any positions yet, so there\'s nothing to diversify across.<br><br>'
          + 'Head to the <b>Market</b> tab and start with 3-4 stocks from <i>different</i> sectors — '
          + marketSectorList().slice(0, 4).join(', ') + '.';
      }
      var allSec = marketSectorList();
      var missing = missingSectors(p.ownedSectors);
      return '<b>Portfolio Diversification Analysis</b><br><br>'
        + 'You have <b>' + p.stocks + ' stocks</b> across <b>' + p.sectors + '</b> of <b>' + allSec.length + '</b> available sectors.<br><br>'
        + '<b>Your sectors:</b> ' + p.sectorStr + '<br><br>'
        + (p.sectors < 3
          ? '<span class="r">Your portfolio is under-diversified.</span> Aim for at least 4-5 sectors to reduce risk.'
          : (p.sectors < 5
            ? '<span class="o">Getting better!</span> You cover ' + p.sectors + ' sectors. Adding 1-2 more would strengthen your portfolio.'
            : '<span class="g">Well diversified!</span> You cover ' + p.sectors + ' sectors — a solid spread.'))
        + (missing.length ? '<br><br><b>Not yet covered:</b> ' + missing.join(', ') + '.' : '')
        + '<hr><b>Tip:</b> No single sector should dominate your portfolio. Spread across ' + allSec.slice(0, 5).join(', ') + ' and more.';
    },
    function(p) {
      var allSec = marketSectorList();
      var missing = missingSectors(p.ownedSectors);
      return '<b>Diversification Score: ' + Math.min(100, Math.round(p.sectors / Math.max(1, allSec.length) * 100)) + '/100</b><br><br>'
        + 'Your portfolio spans ' + p.sectors + ' of ' + allSec.length + ' sector' + (allSec.length !== 1 ? 's' : '') + ' available in this market.<br>'
        + (missing.length > 0
          ? '<br><span class="r">Missing sectors:</span> ' + missing.join(', ') + '<br><br>Adding even one stock from a missing sector significantly reduces your portfolio risk.'
          : '<br><span class="g">All major sectors covered!</span> Great job building a balanced portfolio.')
        + '<hr><b>Rule of thumb:</b> No single sector should exceed 30% of your portfolio.';
    }
  ],
  missing: [
    function(p) {
      var missing = missingSectors(p.ownedSectors);
      if (missing.length === 0) return '<span class="g">You\'re covering all major sectors in this market!</span> Focus on rebalancing weights rather than adding new sectors.';
      return '<b>You\'re missing ' + missing.length + ' sector' + (missing.length > 1 ? 's' : '') + ' available in this market:</b><br><br>'
        + missing.map(function(s, i) {
          var pick = pickForSector(s);
          return '<b>' + (i+1) + '. ' + s + '</b><br>'
            + (pick ? 'e.g. <b>' + pick.n + ' (' + pick.s + ')</b> — tradable now in the Market tab.' : 'Consider adding exposure here.') + '<br>';
        }).join('<br>')
        + '<hr><span class="o">Priority:</span> Start with the sector that has the least correlation to your existing holdings.';
    }
  ],
  risk: [
    function(p) {
      var maxHold = null, maxVal = 0;
      HOLDS.forEach(function(h) {
        var val = h.qty * (prices[h.sym] || h.avgPrice);
        if (val > maxVal) { maxVal = val; maxHold = h; }
      });
      if (!maxHold) return 'You have no holdings yet. Start with a diversified approach — buy stocks from at least 3 different sectors.';
      var pct = (maxVal / p.value * 100).toFixed(1);
      return '<b>Risk Analysis for Your Portfolio</b><br><br>'
        + '<b>Biggest concentration:</b> ' + maxHold.sym + ' at <span class="' + (pct > 30 ? 'r' : 'o') + '">' + pct + '%</span> of your portfolio.<br><br>'
        + (pct > 30 ? '<span class="r">Warning:</span> Any single stock above 30% is considered concentrated. If ' + maxHold.sym + ' has a bad quarter, it disproportionately impacts your entire portfolio.<br><br>' : '')
        + '<b>Sector concentration:</b> ' + p.sectors + ' sector' + (p.sectors !== 1 ? 's' : '') + '<br>'
        + (p.sectors < 3 ? '<span class="r">High risk</span> — too few sectors' : (p.sectors < 5 ? '<span class="o">Moderate risk</span> — add more sectors' : '<span class="g">Low risk</span> — well spread'))
        + '<hr><b>Golden rule:</b> No single stock > 25%, no single sector > 35%.';
    },
    function(p) {
      return '<b>Portfolio Risk Score</b><br><br>'
        + 'Based on your ' + p.stocks + ' holdings across ' + p.sectors + ' sectors:<br><br>'
        + '<b>Concentration risk:</b> ' + (p.sectors < 3 ? '<span class="r">High</span>' : '<span class="g">Managed</span>') + '<br>'
        + '<b>Single stock risk:</b> Check if any holding exceeds 25-30% of total value<br>'
        + '<b>Market correlation:</b> ' + (p.sectors < 4 ? 'Your sectors may be correlated — a market event could hit multiple holdings simultaneously' : 'Reasonable sector spread reduces correlation risk') + '<br><br>'
        + '<b>How to reduce risk:</b><ol>'
        + '<li>Trim overweight positions above 25%</li>'
        + '<li>Add stocks from uncorrelated sectors</li>'
        + '<li>Consider index ETFs (Nifty 50) for instant diversification</li></ol>';
    }
  ],
  suggestions: [
    function(p) {
      var missing = missingSectors(p.ownedSectors);
      if (missing.length === 0) {
        return '<b>Your portfolio looks well-rounded!</b><br><br>Since you cover all major sectors in this market, focus on:<br>'
          + '<b>1.</b> Rebalancing — trim overweight positions<br>'
          + '<b>2.</b> Quality — ensure each holding is a sector leader<br>'
          + '<b>3.</b> Consider a low-cost index ETF for your core allocation';
      }
      var top3 = missing.slice(0, 3).map(function(s) { return { sec: s, pick: pickForSector(s) }; }).filter(function(x) { return x.pick; });
      if (!top3.length) return 'Your holdings already cover the tradable sectors here. Focus on rebalancing weights rather than adding names.';
      return '<b>Top picks to balance your portfolio:</b><br><br>'
        + top3.map(function(x, i) {
          return '<b>' + (i+1) + '. ' + x.pick.n + ' (' + x.pick.s + ')</b> <span class="pill pg">' + x.sec + '</span><br>'
            + 'Adds ' + x.sec + ' exposure you\'re currently missing. Tradable now in the Market tab.<br>';
        }).join('<br>')
        + '<hr><span class="o">Start with just one.</span> Adding ' + top3[0].pick.s + ' alone improves your diversification significantly.';
    }
  ],
  beginner: [
    function() {
      return '<b>Getting Started with Investing in India:</b><br><br>'
        + '<b>Step 1 — Open accounts:</b><ul>'
        + '<li>Bank account (savings)</li>'
        + '<li>Demat + Trading account (Zerodha, Groww, Angel One)</li></ul>'
        + '<b>Step 2 — Start simple:</b><ul>'
        + '<li>Begin with a Nifty 50 ETF or index fund SIP</li>'
        + '<li>Even ₹500/month builds the habit</li></ul>'
        + '<b>Step 3 — Learn as you go:</b><ul>'
        + '<li>Complete all 15 lessons here on Finvest AI</li>'
        + '<li>Read Zerodha Varsity (free, excellent)</li></ul>'
        + '<b>Step 4 — Graduate to stocks:</b><ul>'
        + '<li>Only after 3-6 months of learning</li>'
        + '<li>Start with large-cap blue chips (TCS, HDFC Bank, Reliance)</li></ul>';
    },
    function() {
      return '<b>Investing 101 — The Absolute Basics:</b><br><br>'
        + '<b>What is a stock?</b> A tiny piece of ownership in a company. If the company grows, your share grows in value.<br><br>'
        + '<b>What is NSE/BSE?</b> India\'s two stock exchanges where stocks are traded.<br><br>'
        + '<b>What is a Demat account?</b> A digital locker that holds your shares electronically.<br><br>'
        + '<b>How much money do I need?</b> You can start with as little as ₹100 through SIP (Systematic Investment Plan).<br><br>'
        + '<b>Is it risky?</b> Yes, but risk reduces over long time horizons (10+ years). Never invest money you\'ll need within 1-2 years.'
        + '<hr><b>Golden rule:</b> Time in the market beats timing the market. Start early, stay consistent.';
    }
  ],
  sip: [
    function() {
      return '<b>SIP — The Smartest Way to Start:</b><br><br>'
        + 'A Systematic Investment Plan invests a fixed amount every month, regardless of market conditions.<br><br>'
        + '<b>Why SIP works:</b><ul>'
        + '<li><b>Rupee cost averaging:</b> Buy more units when prices are low, fewer when high</li>'
        + '<li><b>No timing needed:</b> Removes emotion from investing</li>'
        + '<li><b>Power of compounding:</b> ₹5,000/month at 12% = ₹1.16 Cr in 25 years</li></ul>'
        + '<b>Best SIP options for beginners:</b><br>'
        + '1. Nifty 50 Index Fund<br>'
        + '2. Nifty Next 50 Fund<br>'
        + '3. Flexi-cap Fund from a top AMC'
        + '<hr>Try our <b>SIP Calculator</b> in the Resources section to see your projected returns!';
    }
  ],
  portfolio: [
    function(p) {
      var gainColor = p.gain >= 0 ? 'g' : 'r';
      var gainSign = p.gain >= 0 ? '+' : '';
      return '<b>Your Portfolio Snapshot:</b><br><br>'
        + '<b>Total Value:</b> ' + fINR(p.value) + '<br>'
        + '<b>Total Invested:</b> ' + fINR(p.invested) + '<br>'
        + '<b>P&L:</b> <span class="' + gainColor + '">' + gainSign + fINR(p.gain) + ' (' + gainSign + p.gainPct.toFixed(2) + '%)</span><br>'
        + '<b>Holdings:</b> ' + p.stocks + ' stocks across ' + p.sectors + ' sectors<br><br>'
        + '<b>Sector Breakdown:</b> ' + p.sectorStr + '<br><br>'
        + (p.stocks === 0
          ? 'You have no holdings yet! Head to the Market tab and start building your portfolio.'
          : (p.gain >= 0
            ? '<span class="g">Your portfolio is in profit.</span> Keep holding quality stocks and consider adding to weaker sectors.'
            : '<span class="r">Your portfolio is currently at a loss.</span> Don\'t panic — focus on holding quality companies. Losses are temporary if your fundamentals are strong.'));
    }
  ],
  market: [
    function() {
      return '<b>Current Market View:</b><br><br>'
        + 'The Indian equity market continues to be one of the world\'s best-performing markets over the long term.<br><br>'
        + '<b>Key things to watch:</b><ul>'
        + '<li>RBI interest rate decisions — affects banking stocks</li>'
        + '<li>Crude oil prices — impacts Energy sector and trade deficit</li>'
        + '<li>US Fed policy — global liquidity flow affects FII investments</li>'
        + '<li>India GDP growth — currently among the fastest globally</li></ul>'
        + '<b>For your portfolio:</b> Focus on companies with strong earnings growth, low debt, and sustainable competitive advantages.'
        + '<hr>Check the <b>Market</b> tab for live stock prices and charts!';
    }
  ],
  mutual_funds: [
    function() {
      return '<b>Mutual Funds vs Direct Stocks:</b><br><br>'
        + '<b>Mutual Funds are better if you:</b><ul>'
        + '<li>Don\'t have time for daily research</li>'
        + '<li>Want professional management</li>'
        + '<li>Prefer instant diversification</li></ul>'
        + '<b>Direct stocks are better if you:</b><ul>'
        + '<li>Enjoy researching companies</li>'
        + '<li>Want higher potential returns</li>'
        + '<li>Can handle more volatility</li></ul>'
        + '<b>Best approach:</b> Use both! Keep 60-70% in mutual funds/ETFs for stability, 30-40% in direct stocks for alpha.<br><br>'
        + '<b>Top fund categories for beginners:</b><br>'
        + '1. Nifty 50 Index Fund (lowest cost)<br>'
        + '2. Large-cap fund<br>'
        + '3. Balanced Advantage Fund (auto equity-debt mix)';
    }
  ],
  tax: [
    function() {
      return '<b>Tax on Stock Market Gains in India:</b><br><br>'
        + '<b>Short-Term Capital Gains (STCG):</b><br>'
        + 'Sold within 1 year → Taxed at <b>15%</b><br><br>'
        + '<b>Long-Term Capital Gains (LTCG):</b><br>'
        + 'Sold after 1 year → <b>10% on gains above ₹1 lakh</b> (no indexation)<br><br>'
        + '<b>Dividends:</b> Taxed at your income tax slab rate<br><br>'
        + '<b>Tax-saving tips:</b><ul>'
        + '<li>Hold quality stocks for 1+ year to get LTCG benefit</li>'
        + '<li>Harvest tax losses — sell losers to offset gains</li>'
        + '<li>ELSS mutual funds give Section 80C deduction (up to ₹1.5L)</li></ul>'
        + '<hr><b>Important:</b> Always consult a CA for personalized tax advice.';
    }
  ],
  ipo: [
    function() {
      return '<b>IPO Investing Guide:</b><br><br>'
        + '<b>What is an IPO?</b> When a private company lists on the stock exchange for the first time (Initial Public Offering).<br><br>'
        + '<b>Should you invest in IPOs?</b><br>'
        + '✅ Yes if: Strong company with proven profits, reasonable valuation<br>'
        + '❌ No if: Loss-making, hyped-up, overvalued, or you\'re just following the crowd<br><br>'
        + '<b>How to apply:</b><ul>'
        + '<li>Through your broker\'s app (Zerodha, Groww, etc.)</li>'
        + '<li>Using UPI — block funds via ASBA</li>'
        + '<li>Retail category: Up to ₹2 lakh application</li></ul>'
        + '<b>IPO allotment is a lottery</b> — don\'t count on getting shares. Never borrow money to apply.';
    }
  ],
  health_explain: [
    function(p) {
      var h = (typeof computeHealth === 'function') ? computeHealth() : null;
      var pct = function(v) { return Math.round(v * 100) + '%'; };
      var allSec = marketSectorList();
      var out = '<b>How your Portfolio Health Score works</b><br><br>'
        + 'It\'s a transparent 0-100 score from three weighted parts:<br><br>'
        + '<b>Health Score = Diversification (40%) + Volatility (30%) + Return Consistency (30%)</b><br><br>'
        + '<b>1. Diversification (40%)</b> — how many sectors you cover out of the <b>' + allSec.length + '</b> available here. Covering ~6 earns full marks.<br>'
        + '<b>2. Volatility (30%)</b> — how steady your mix is. A single holding above <b>25%</b> of your portfolio lowers this; holding several names raises it.<br>'
        + '<b>3. Return Consistency (30%)</b> — diversified, multi-name portfolios deliver steadier returns; a deep drawdown reduces it.<br>';
      if (h && h.hasHoldings) {
        out += '<hr><b>Your breakdown:</b><br>'
          + 'Diversification: <b>' + pct(h.sub.div) + '</b> · Volatility: <b>' + pct(h.sub.vol) + '</b> · Consistency: <b>' + pct(h.sub.cons) + '</b><br>'
          + '<b>Overall: ' + h.score + '/100 — ' + healthGrade(h.score).label + '</b>';
        if (h.suggestion) out += '<br><br><span class="o">Next step:</span> ' + h.suggestion;
      }
      var risk = (window.userProfile && userProfile.risk) || 'moderate';
      out += '<hr>Your score is calibrated to your <b>' + risk + '</b> risk profile — '
        + (risk === 'high' ? 'we\'re more tolerant of concentration for you.' : risk === 'low' ? 'we expect a steadier, well-spread mix.' : 'a balanced spread is expected.');
      return out;
    }
  ],
  greeting: [
    function(p) {
      var prof = window.userProfile || {};
      var name = prof.name ? ', ' + prof.name : '';
      return 'Hey' + name + '! 👋 I\'m Fin, your AI portfolio advisor.<br><br>'
        + (prof.goal ? 'Your goal is to <b>' + prof.goal.toLowerCase() + '</b> with a <b>' + (prof.risk || 'medium') + '</b> risk appetite — I\'ll tailor my advice to that.<br><br>' : '')
        + (p.stocks > 0
          ? 'You have <b>' + p.stocks + ' stocks</b> worth <b>' + fINR(p.value) + '</b> across ' + p.sectors + ' sectors. '
            + (p.gain >= 0 ? '<span class="g">Your portfolio is up ' + p.gainPct.toFixed(1) + '%!</span>' : 'Your portfolio is currently down — but stay focused on long-term fundamentals.')
          : 'You haven\'t started trading yet. Head to the <b>Market</b> tab to build your first portfolio!')
        + '<br><br>' + goalSuggestion(prof.goal);
    }
  ],
  thanks: [
    function() { return 'You\'re welcome! 😊 Always here to help. Ask me anything else about your portfolio or investing!'; },
    function() { return 'Happy to help! Remember — consistent learning is the key to great investing. Keep going! 💪'; },
    function() { return 'Anytime! Don\'t forget to complete the Learn modules too — they give you XP and real knowledge! 🎯'; }
  ],
  joke: [
    function() { return '😄 Here\'s an investing joke:<br><br><i>"The stock market is the only place where things go on sale and everyone runs out of the store screaming."</i> — Unknown<br><br>But seriously — buying quality stocks when they dip is one of the best strategies. Be greedy when others are fearful!'; },
    function() { return '😄 Investing humor:<br><br><i>"Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1."</i> — Warren Buffett<br><br>Translation: Protect your capital first. Only invest in companies you understand.'; }
  ],
  // ─── FINANCIAL CONCEPTS ──────────────────────────────────
  pe_ratio: [
    function() {
      return '<b>What is P/E Ratio?</b><br><br>'
        + '<b>Price-to-Earnings Ratio</b> = Current Stock Price / Earnings Per Share (EPS)<br><br>'
        + '<b>What it tells you:</b> How much investors are willing to pay for each rupee of earnings.<br><br>'
        + '<b>Example:</b> If TCS stock is ₹3,800 and EPS is ₹120, P/E = 31.7x<br>'
        + 'This means investors pay ₹31.7 for every ₹1 TCS earns.<br><br>'
        + '<b>General guidelines:</b><ul>'
        + '<li>< 15: Potentially undervalued (or low growth)</li>'
        + '<li>15-25: Fairly valued</li>'
        + '<li>25-40: Growth stock / premium valuation</li>'
        + '<li>> 40: Expensive — needs strong growth to justify</li></ul>'
        + '<b>Sector matters:</b> IT stocks (25-35 P/E) are naturally higher than Banking (10-20 P/E). Always compare within the same sector.';
    }
  ],
  dividend: [
    function() {
      return '<b>What is a Dividend?</b><br><br>'
        + 'A <b>dividend</b> is a portion of a company\'s profits distributed to shareholders — like getting rent from your investments.<br><br>'
        + '<b>Dividend Yield</b> = Annual Dividend per Share / Stock Price × 100<br><br>'
        + '<b>Top dividend stocks in India:</b><ul>'
        + '<li><b>ITC:</b> ~3.5% yield — consistent for decades</li>'
        + '<li><b>Coal India:</b> ~7% yield — high but cyclical</li>'
        + '<li><b>Power Grid:</b> ~4.5% yield — stable utility</li>'
        + '<li><b>ONGC:</b> ~4% yield — energy sector</li></ul>'
        + '<b>Key dates:</b><ul>'
        + '<li><b>Record Date:</b> You must own shares before this date to receive dividend</li>'
        + '<li><b>Ex-Dividend Date:</b> Share price adjusts down by dividend amount on this date</li></ul>'
        + '<b>Tax:</b> Dividends are taxed at your income tax slab rate. TDS of 10% if annual dividend exceeds ₹5,000.';
    }
  ],
  market_cap: [
    function() {
      return '<b>What is Market Capitalization?</b><br><br>'
        + '<b>Market Cap</b> = Current Stock Price × Total Outstanding Shares<br><br>'
        + 'It represents the total market value of a company.<br><br>'
        + '<b>SEBI Classification:</b><ul>'
        + '<li><b>Large Cap:</b> Top 100 companies (Reliance, TCS, HDFC Bank) — safest, most liquid</li>'
        + '<li><b>Mid Cap:</b> 101st to 250th (AU Bank, Persistent, Coforge) — growth + moderate risk</li>'
        + '<li><b>Small Cap:</b> 251st onwards — highest growth potential but also highest risk</li></ul>'
        + '<b>India\'s top 5 by market cap:</b><br>'
        + '1. Reliance Industries (~₹18L Cr)<br>'
        + '2. TCS (~₹14L Cr)<br>'
        + '3. HDFC Bank (~₹12L Cr)<br>'
        + '4. Infosys (~₹6L Cr)<br>'
        + '5. Bharti Airtel (~₹5L Cr)';
    }
  ],
  nifty: [
    function() {
      return '<b>What is NIFTY 50?</b><br><br>'
        + 'NIFTY 50 is an index of the <b>50 largest companies</b> listed on the National Stock Exchange (NSE).<br><br>'
        + '<b>Why it matters:</b> It\'s the benchmark of the Indian stock market — when people say "the market went up," they usually mean NIFTY went up.<br><br>'
        + '<b>Key facts:</b><ul>'
        + '<li>Managed by NSE Indices (formerly India Index Services)</li>'
        + '<li>Represents ~65% of free-float market cap of NSE stocks</li>'
        + '<li>Reviewed every 6 months — underperformers are replaced</li>'
        + '<li>Base date: Nov 3, 1995 with a base value of 1,000</li></ul>'
        + '<b>Other important indices:</b><br>'
        + '• SENSEX (BSE, 30 stocks) • BANK NIFTY (12 banking stocks)<br>'
        + '• NIFTY IT • NIFTY Midcap 100 • NIFTY Smallcap 250';
    }
  ],
  intraday: [
    function() {
      return '<b>Intraday vs Delivery Trading</b><br><br>'
        + '<b>Intraday:</b> Buy and sell the same stock on the same day. Position is squared off before market close (3:30 PM).<ul>'
        + '<li>Requires less capital (margin trading)</li>'
        + '<li>Higher risk — no time to recover from drops</li>'
        + '<li>Taxed as business income (your slab rate)</li>'
        + '<li>Brokerage is typically lower</li></ul>'
        + '<b>Delivery:</b> Buy and hold — shares are delivered to your Demat account.<ul>'
        + '<li>Lower risk — you can wait for recovery</li>'
        + '<li>STCG (15%) if sold within 1 year, LTCG (10% above ₹1L) if held longer</li>'
        + '<li>Better for beginners</li></ul>'
        + '<hr><b>Recommendation for beginners:</b> Avoid intraday completely. Focus on delivery trades with quality stocks for long-term wealth building.';
    }
  ],
  demat: [
    function() {
      return '<b>What is a Demat Account?</b><br><br>'
        + 'A <b>Demat (Dematerialized) Account</b> holds your shares in electronic form — like a digital locker for your investments.<br><br>'
        + '<b>How it works:</b><ul>'
        + '<li>Physical share certificates → Converted to electronic records</li>'
        + '<li>Managed by depositories: <b>NSDL</b> and <b>CDSL</b></li>'
        + '<li>You access it through a Depository Participant (DP) — your broker</li></ul>'
        + '<b>What you need to open one:</b><ul>'
        + '<li>PAN Card (mandatory)</li>'
        + '<li>Aadhaar Card (for e-KYC)</li>'
        + '<li>Bank account details</li>'
        + '<li>Address proof</li></ul>'
        + '<b>Popular brokers:</b> Zerodha, Groww, Angel One, Upstox, ICICI Direct<br><br>'
        + '<b>Tip:</b> Most brokers now offer free Demat account opening with zero AMC for the first year.';
    }
  ],
  bluechip: [
    function() {
      return '<b>What are Blue-Chip Stocks?</b><br><br>'
        + 'Blue-chip stocks are shares of <b>large, well-established, financially stable companies</b> with a history of consistent performance.<br><br>'
        + '<b>Characteristics:</b><ul>'
        + '<li>Large market cap (usually top 50-100 companies)</li>'
        + '<li>Strong brand recognition</li>'
        + '<li>Consistent dividend payments</li>'
        + '<li>Lower volatility compared to small/mid caps</li></ul>'
        + '<b>Indian Blue-Chips:</b><br>'
        + 'Reliance, TCS, Infosys, HDFC Bank, HUL, ITC, Bharti Airtel, L&T, Asian Paints, Titan<br><br>'
        + '<b>Why beginners should start here:</b> Blue-chips are less volatile, more liquid, and have proven track records. They\'re the safest entry point into direct stock investing.'
        + '<hr><b>Strategy:</b> Build a core portfolio of 5-7 blue-chips, then gradually add mid-caps for growth.';
    }
  ],
  stop_loss: [
    function() {
      return '<b>What is a Stop Loss?</b><br><br>'
        + 'A <b>stop loss</b> is a pre-set order to sell a stock if it falls below a certain price — it protects you from heavy losses.<br><br>'
        + '<b>Example:</b> You buy TCS at ₹3,800. You set a stop loss at ₹3,600.<br>'
        + 'If TCS drops to ₹3,600, your shares are automatically sold — limiting your loss to ₹200/share (5.3%).<br><br>'
        + '<b>How to set a good stop loss:</b><ul>'
        + '<li><b>Percentage-based:</b> 5-10% below buy price for delivery trades</li>'
        + '<li><b>Support-based:</b> Just below a key technical support level</li>'
        + '<li><b>ATR-based:</b> 2× Average True Range for volatility-adjusted stops</li></ul>'
        + '<b>Trailing Stop Loss:</b> Moves up as stock price rises, locking in profits while limiting downside.<br><br>'
        + '<b>Golden rule:</b> Always use a stop loss. The biggest mistake beginners make is holding onto losing stocks hoping they\'ll recover.';
    }
  ],

  // ── Expanded finance knowledge ──
  inflation: [ function() { return '<b>What is Inflation?</b><br><br>Inflation is the rate at which prices rise over time, shrinking what your money can buy.<br><br>• ₹100 today buys less in 10 years (~₹56 at 6% inflation).<br>• <b>Real return = your return − inflation.</b> Earn 7% with 6% inflation → just 1% real gain.<br><br><b>Why it matters:</b> Idle cash <span class="r">loses</span> value every year. Beating inflation is the whole point of investing — stocks and equity funds have historically done so over the long run.'; } ],
  compounding: [ function() { return '<b>The Power of Compounding</b><br><br>Compounding = your returns earning their own returns. It snowballs over time.<br><br>• <b>Rule of 72:</b> Years to double ≈ 72 ÷ return%. At 12%, money doubles in ~6 years.<br>• ₹10,000/month at 12% for 30 years → ~₹3.5 crore (you invested ₹36 lakh!).<br><br><b>Key:</b> Start early and stay invested. Time matters more than timing.'; } ],
  etf: [ function() { return '<b>What is an ETF?</b><br><br>An <b>Exchange-Traded Fund</b> holds a basket of stocks/bonds and trades on the exchange like a single stock.<br><br>• <b>Instant diversification</b> — one buy = many companies<br>• <b>Low cost</b> — tiny expense ratios vs active funds<br>• <b>Liquid</b> — buy/sell anytime markets are open<br><br><b>Example:</b> A NIFTY 50 ETF gives you all 50 top companies in one share.'; } ],
  bonds: [ function() { return '<b>Stocks vs Bonds</b><br><br>• <b>Stocks</b> = ownership in a company. Higher risk, higher long-term return (~10-12%).<br>• <b>Bonds</b> = lending money for fixed interest. Lower risk, lower return.<br><br>Most healthy portfolios hold both: stocks for growth, bonds for stability. Your mix depends on your goal and time horizon.'; } ],
  allocation: [ function() { return '<b>Asset Allocation 101</b><br><br>How you split money across <b>stocks</b> (growth), <b>bonds</b> (stability) and <b>cash</b> (safety). It drives most of your returns — more than stock picking.<br><br>• Young / long horizon → more stocks<br>• Near a goal → more bonds & cash<br>• Rough guide: stock % ≈ <b>110 − your age</b><br><br><b>Rebalance</b> once a year back to your target mix.'; } ],
  emergency: [ function() { return '<b>Build an Emergency Fund First</b><br><br>Before investing, keep <b>3–6 months of expenses</b> in a savings account or liquid fund.<br><br>Why? Investments can drop right when you need cash. A buffer stops you from selling at a loss in a crisis.<br><br><b>Order:</b> Emergency fund → clear high-interest debt → then invest.'; } ],
  volatility: [ function() { return '<b>What is Volatility?</b><br><br>Volatility measures how much a price swings up and down. Higher volatility = bigger swings = more risk (and opportunity).<br><br>• Short-term drops are <b>normal</b> — even great stocks fall 20-30% in bad years.<br>• Volatility ≠ loss unless you sell.<br><br><b>Tip:</b> Don\'t check prices hourly — it triggers panic decisions. Think in years, not days.'; } ],
  bullbear: [ function() { return '<b>Bull vs Bear Markets</b><br><br>• <b>Bull market</b> 🐂 — prices rising, optimism high (gains of 20%+ from lows).<br>• <b>Bear market</b> 🐻 — prices falling 20%+ from highs, fear high.<br><br>Both are normal parts of the cycle. The best investors stay calm: <i>"Be fearful when others are greedy, greedy when others are fearful."</i> — Buffett.'; } ],
  ratios: [ function() { return '<b>Key Stock Ratios</b><br><br>• <b>EPS</b> = Earnings ÷ shares. A company\'s profit per share.<br>• <b>P/E</b> = Price ÷ EPS. How expensive vs earnings.<br>• <b>P/B</b> = Price ÷ Book value. Below 1 can mean undervalued (or trouble).<br>• <b>ROE</b> = Net profit ÷ equity. How well it uses shareholder money (15%+ is strong).<br>• <b>Debt-to-Equity</b> = lower is safer.<br><br>Compare ratios <b>within the same sector</b> — they vary a lot across industries.'; } ],
  expense_ratio: [ function() { return '<b>Expense Ratio</b><br><br>The annual fee a fund charges, as a % of your money. It looks tiny but compounds against you.<br><br><b>1% vs 0.1%</b> on ₹10L over 30 years can cost <span class="r">lakhs</span> in lost returns.<br><br>Index funds & ETFs have very low expense ratios — a big reason they beat most active funds long-term. Always check it before buying a fund.'; } ],
  gold: [ function() { return '<b>Should You Invest in Gold?</b><br><br>Gold is a <b>hedge</b> — it tends to hold value during crises and high inflation, but it produces no income (no dividends/interest).<br><br>• Useful as 5-10% of a portfolio for diversification.<br>• In India: <b>Sovereign Gold Bonds</b> (pay 2.5% interest + gold price) or Gold ETFs beat physical gold (no making charges/storage).<br><br>Don\'t over-allocate — equities outperform gold over long horizons.'; } ],
  crypto_ai: [ function() { return '<b>Crypto: What\'s Different</b><br><br>• Trades <b>24/7</b>, extremely <b>volatile</b> (can swing 10%+ in a day).<br>• No company, earnings or dividends — value is driven by demand and adoption.<br>• Bitcoin & Ethereum are the largest; thousands of others are highly speculative.<br><br><b>Rule:</b> Only invest what you can afford to lose, keep it a small slice, and never use leverage as a beginner.'; } ],
  recession: [ function() { return '<b>Investing in a Downturn</b><br><br>Recessions and crashes are part of investing. What to do:<br><br>• <b>Don\'t panic-sell</b> — you only lock in losses.<br>• Keep your emergency fund so you\'re never forced to sell.<br>• Keep investing via <b>SIP</b> — you buy more units when prices are low.<br>• Markets have recovered from every crash in history.<br><br><i>Time in the market beats timing the market.</i>'; } ],

  specific_stock: function(sym) {
    var stk = ST.find(function(s) { return s.s === sym; });
    if (!stk) return null;
    var p = prices[sym] || stk.p;
    var hold = HOLDS.find(function(h) { return h.sym === sym; });
    return '<b>' + stk.n + ' (' + sym + ')</b><br>'
      + '<b>Sector:</b> ' + stk.sec + '<br>'
      + '<b>Current Price:</b> ' + fINR(p) + '<br>'
      + (hold
        ? '<b>You own:</b> ' + hold.qty + ' shares (Avg: ' + fINR(hold.avgPrice) + ')<br>'
          + '<b>Your P&L:</b> <span class="' + (p >= hold.avgPrice ? 'g' : 'r') + '">'
          + (p >= hold.avgPrice ? '+' : '') + fINR((p - hold.avgPrice) * hold.qty) + '</span><br>'
        : '<b>You don\'t own this stock yet.</b><br>')
      + '<br>Click on the stock in the <b>Market</b> tab to see its live TradingView chart and detailed stats!';
  }
};

// ─── STOCK MATCHER (whole-word only) ────────────────────
// Returns a ticker ONLY when the query mentions it as a standalone word or the
// company's distinctive name. This prevents single/double-letter tickers like
// F (Ford), V (Visa) or KO from matching letters inside ordinary words.
function matchStock(q) {
  // Generic finance words that should never be treated as a stock lookup, even
  // if a ticker happens to spell them.
  var STOPWORDS = { am:1, is:1, it:1, in:1, on:1, so:1, no:1, hi:1, my:1, me:1, we:1, go:1, do:1, or:1, an:1, at:1, be:1, by:1, of:1, to:1, up:1, us:1, pe:1, etf:1, sip:1, ipo:1 };
  for (var i = 0; i < ST.length; i++) {
    var s = ST[i];
    var sym = s.s.toLowerCase();
    if (STOPWORDS[sym]) continue;
    // Whole-word ticker match (escape '.' in tickers like BRK.B).
    var symRe = new RegExp('(^|[^a-z0-9])' + sym.replace(/\./g, '\\.') + '($|[^a-z0-9])');
    if (symRe.test(q)) return s.s;
    // Distinctive company name (strip generic corporate suffixes/words).
    var nm = s.n.toLowerCase()
      .replace(/[.,]/g, '')
      .replace(/\b(inc|ltd|limited|corp|corporation|co|company|the|inds|industries|platforms|group|holdings|nat|gas)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    if (nm.length >= 4 && q.indexOf(nm) !== -1) return s.s;
  }
  return null;
}

// ─── SMART REPLY ENGINE ─────────────────────────────────
function getReply(msg) {
  var q = msg.toLowerCase();
  var p = getPortfolioSummary();

  // Check for a specific stock — but ONLY as a whole word/ticker, never as a
  // substring. Previously "F" (Ford) matched the "f" inside "diversiFied",
  // hijacking portfolio questions with an irrelevant stock card.
  var stockMatch = matchStock(q);
  if (stockMatch && AI_BANK.specific_stock) {
    var resp = AI_BANK.specific_stock(stockMatch);
    if (resp) return resp;
  }

  // Topic detection with priority
  var topic = null;
  if (q.match(/^(hi|hey|hello|sup|yo|hola|namaste)/)) topic = 'greeting';
  else if (q.match(/health score|portfolio.*score|improve.*score|score.*calculat|how.*score/)) topic = 'health_explain';
  else if (q.match(/\b(thanks?|thank you|thx|ty|appreciate[ds]?)\b/)) topic = 'thanks';
  else if (q.match(/joke|funny|humor|laugh/)) topic = 'joke';
  // Specific finance concepts take priority over generic catch-alls
  else if (q.match(/market\s*cap|capitali[sz]ation|large.?cap|mid.?cap|small.?cap/)) topic = 'market_cap';
  else if (q.match(/inflation|cost of living|purchasing power/)) topic = 'inflation';
  else if (q.match(/compound|rule of 72|snowball/)) topic = 'compounding';
  else if (q.match(/\betf\b|exchange.?traded/)) topic = 'etf';
  else if (q.match(/\bbonds?\b|debenture|fixed income|g-?sec/)) topic = 'bonds';
  else if (q.match(/asset alloc|allocation|stock.*bond.*mix|portfolio mix|how much.*(stock|equity)/)) topic = 'allocation';
  else if (q.match(/emergency fund|rainy day|safety net/)) topic = 'emergency';
  else if (q.match(/volatil|fluctuat|ups and downs|price swing/)) topic = 'volatility';
  else if (q.match(/recession|crash|market fall|downturn|market dip|bear market/)) topic = 'recession';
  else if (q.match(/\bbull\b|\bbear\b|rally|correction/)) topic = 'bullbear';
  else if (q.match(/\beps\b|\broe\b|\bp\/?b\b|book value|debt.?to.?equity|return on equity|fundamental/)) topic = 'ratios';
  else if (q.match(/expense ratio|fund fee|\bter\b/)) topic = 'expense_ratio';
  else if (q.match(/\bgold\b|sovereign gold|precious metal/)) topic = 'gold';
  else if (q.match(/crypto|bitcoin|\bbtc\b|ethereum|\beth\b|blockchain/)) topic = 'crypto_ai';
  else if (q.match(/diversif|concentrated|spread|sector.*mix|balanced/)) topic = 'diversification';
  else if (q.match(/missing|sector.*add|which.*sector|what.*sector|gap/)) topic = 'missing';
  else if (q.match(/risk|dangerous|volatile|worst|safe|unsafe/)) topic = 'risk';
  else if (q.match(/suggest|recommend|which stock.*buy|add.*portfolio|pick|best stock/)) topic = 'suggestions';
  else if (q.match(/beginner|start.*invest|how.*invest|first.*invest|new.*invest|newbie/)) topic = 'beginner';
  else if (q.match(/sip|systematic|monthly.*invest|recurring/)) topic = 'sip';
  else if (q.match(/portfolio|holding|my stock|my invest|how.*doing|performance/)) topic = 'portfolio';
  else if (q.match(/market|nifty|sensex|bull|bear|crash|rally/)) topic = 'market';
  else if (q.match(/mutual fund|mf|etf|index fund|fund/)) topic = 'mutual_funds';
  else if (q.match(/tax|stcg|ltcg|capital gain|80c|elss/)) topic = 'tax';
  else if (q.match(/ipo|list|initial public/)) topic = 'ipo';
  else if (q.match(/p[\/ ]?e|price.*(to|\/)\s*earn|earning.*ratio|valuation/)) topic = 'pe_ratio';
  else if (q.match(/dividend|yield|payout|dps/)) topic = 'dividend';
  else if (q.match(/market\s*cap|capitali[sz]ation|large.?cap|mid.?cap|small.?cap/)) topic = 'market_cap';
  else if (q.match(/nifty|sensex|index|benchmark/)) topic = 'nifty';
  else if (q.match(/intraday|day.*trad|swing.*trad|delivery.*trad|short.*term.*trad/)) topic = 'intraday';
  else if (q.match(/demat|account|kyc|broker|open.*account/)) topic = 'demat';
  else if (q.match(/blue.?chip|safe.*stock|stable.*stock|reliable/)) topic = 'bluechip';
  else if (q.match(/stop.?loss|trailing|protect.*loss|limit.*loss/)) topic = 'stop_loss';

  if (!topic) {
    // No confident match — give a helpful menu instead of a random answer.
    return 'I\'m <b>Fin</b>, your finance tutor. I didn\'t quite catch that — try asking me about:<br><br>'
      + '<b>Basics:</b> what is a stock, ETF, bond, mutual fund, SIP, dividend, P/E ratio, market cap<br>'
      + '<b>Concepts:</b> inflation, compounding, volatility, diversification, asset allocation, risk<br>'
      + '<b>Markets:</b> NIFTY, bull/bear markets, IPOs, crypto, gold, recessions<br>'
      + '<b>Your money:</b> "how is my portfolio?", "what should I buy?", "am I diversified?"<br><br>'
      + 'Ask me anything financial — e.g. <i>"What is compounding?"</i> or <i>"Should I buy gold?"</i> 💡';
  }

  var bank = AI_BANK[topic];
  if (!bank) bank = AI_BANK.portfolio;

  // Pick a variant — avoid repeating the last used variant for this topic
  var variants = Array.isArray(bank) ? bank : [bank];
  var lastUsed = -1;
  for (var i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].topic === topic) {
      lastUsed = chatHistory[i].variant;
      break;
    }
  }
  var varIdx = 0;
  if (variants.length > 1) {
    varIdx = (lastUsed + 1) % variants.length;
  }

  chatHistory.push({ topic: topic, variant: varIdx, time: Date.now() });
  // Keep only last 50 entries and persist
  if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
  Store.set('chatHistory', chatHistory);

  var fn = variants[varIdx];
  return typeof fn === 'function' ? fn(p) : fn;
}

// ─── PORTFOLIO HEALTH SCORE (computed, transparent) ─────
// Score = Diversification (40%) + Volatility (30%) + Return Consistency (30%).
// Each sub-score is a 0..1 value; the formula is shown to the user on the card
// and explained in full by the "How is this scored?" answer.
function _healthSubScores(secCount, secTarget, maxW, nHold, gainPct) {
  // 1. Diversification — sectors covered vs a healthy target (~6).
  var divScore = Math.min(1, secCount / secTarget);
  // 2. Volatility — steadier when no position dominates and you hold several names.
  var concPenalty = Math.max(0, maxW - 0.25) / 0.75; // weight above 25% starts hurting
  var spreadBonus = Math.min(1, nHold / 5);
  var volScore = Math.max(0, (1 - concPenalty) * 0.6 + spreadBonus * 0.4);
  if (currentMarket === 'CRYPTO') volScore *= 0.7; // crypto is inherently volatile
  // 3. Return consistency — diversified, multi-name portfolios deliver steadier
  //    returns; a deep drawdown signals an inconsistent (risky) mix.
  var consistency = Math.min(1, (secCount / secTarget) * 0.5 + spreadBonus * 0.5);
  if (gainPct < -15) consistency *= 0.7;

  // Personalise to the user's stated risk appetite (set during onboarding).
  var risk = (window.userProfile && userProfile.risk) || 'moderate';
  if (risk === 'high') volScore = Math.min(1, volScore + 0.15);
  if (risk === 'low' && maxW > 0.4) volScore = Math.max(0, volScore - 0.1);

  return { div: divScore, vol: volScore, cons: consistency };
}

function computeHealth() {
  var port = (typeof calcPortfolio === 'function') ? calcPortfolio() : null;
  var allSec = marketSectorList();
  var ownedSec = port ? Object.keys(port.sectorAlloc || {}) : [];
  var secCount = ownedSec.length;
  var secTotal = Math.max(1, allSec.length);
  var secTarget = Math.min(6, secTotal);
  var nHold = HOLDS.length;
  var gainPct = port ? port.gainPct : 0;

  var maxW = 0, maxSym = null;
  if (port && port.totalValue > 0) {
    HOLDS.forEach(function(h) {
      var val = h.qty * (prices[h.sym] || h.avgPrice);
      var w = val / port.totalValue;
      if (w > maxW) { maxW = w; maxSym = h.sym; }
    });
  }

  var sub = _healthSubScores(secCount, secTarget, maxW, nHold, gainPct);
  var score = nHold ? Math.round((sub.div * 0.4 + sub.vol * 0.3 + sub.cons * 0.3) * 100) : 0;

  // Actionable suggestion: simulate adding one stock from the missing sector
  // that would help most, and report the real point gain.
  var suggestion = null;
  if (nHold) {
    var missing = missingSectors(ownedSec);
    if (missing.length) {
      var sec = missing[0];
      var pick = pickForSector(sec);
      var sub2 = _healthSubScores(secCount + 1, secTarget, maxW, nHold + 1, gainPct);
      var newScore = Math.round((sub2.div * 0.4 + sub2.vol * 0.3 + sub2.cons * 0.3) * 100);
      var delta = Math.max(1, newScore - score);
      suggestion = 'Add one ' + sec + ' stock' + (pick ? ' (e.g. ' + pick.n + ', ' + pick.s + ')' : '')
        + ' to improve your score by about <b>' + delta + ' points</b>.';
    } else if (maxW > 0.35 && maxSym) {
      suggestion = 'Trim <b>' + maxSym + '</b> (currently ' + Math.round(maxW * 100) + '% of your portfolio) below 30% to lift your volatility score.';
    } else {
      suggestion = 'Nicely balanced — keep adding quality names and rebalancing to hold your score.';
    }
  }

  return {
    score: score, sub: sub, secCount: secCount, secTotal: secTotal,
    maxW: maxW, maxSym: maxSym, hasHoldings: nHold > 0, suggestion: suggestion
  };
}

// Constructive, non-failing labels — a balanced beginner should feel "Room to Grow", not failed.
function healthGrade(score) {
  if (score >= 80) return { label: 'Excellent', color: 'var(--gr)' };
  if (score >= 65) return { label: 'Strong', color: 'var(--gr)' };
  if (score >= 50) return { label: 'Solid', color: 'var(--gd)' };
  if (score >= 35) return { label: 'Room to Grow', color: 'var(--gd)' };
  return { label: 'Just Getting Started', color: 'var(--bl)' };
}
function _subLabel(v) {
  if (v >= 0.75) return { t: 'Strong', c: 'var(--gr)' };
  if (v >= 0.5) return { t: 'Good', c: 'var(--gd)' };
  if (v >= 0.3) return { t: 'Fair', c: 'var(--or)' };
  return { t: 'Low', c: 'var(--rd)' };
}

function updateHealthScore() {
  var scoreEl = document.getElementById('hlScore');
  if (!scoreEl) return;
  var h = computeHealth();
  var gradeEl = document.getElementById('hlGrade');
  var divEl = document.getElementById('hlDiv');
  var volEl = document.getElementById('hlVol');
  var consEl = document.getElementById('hlCons');
  var explEl = document.getElementById('hlExplain');

  if (!h.hasHoldings) {
    scoreEl.textContent = '—/100';
    if (gradeEl) { gradeEl.textContent = 'Start building'; gradeEl.style.color = 'var(--bl)'; }
    [divEl, volEl, consEl].forEach(function(e) { if (e) { e.textContent = '—'; e.style.color = 'var(--mu)'; } });
    if (explEl) explEl.innerHTML = 'Make your first trade to generate your personalised health score.';
    return;
  }

  scoreEl.textContent = h.score + '/100';
  var g = healthGrade(h.score);
  if (gradeEl) { gradeEl.textContent = g.label; gradeEl.style.color = g.color; }

  var dl = _subLabel(h.sub.div), vl = _subLabel(h.sub.vol), cl = _subLabel(h.sub.cons);
  if (divEl) { divEl.textContent = dl.t; divEl.style.color = dl.c; }
  if (volEl) { volEl.textContent = vl.t; volEl.style.color = vl.c; }
  if (consEl) { consEl.textContent = cl.t; consEl.style.color = cl.c; }

  if (explEl) {
    explEl.innerHTML = (h.suggestion || '')
      + ' <span style="cursor:pointer;text-decoration:underline;white-space:nowrap" onclick="openAI();setTimeout(function(){qs(\'How is my portfolio health score calculated?\')},260)">See the math →</span>';
  }
}

// Point the dynamic quick-ask chip at the user's largest holding (or a
// market-appropriate default) so it never references a stock from another market.
function refreshAIChips() {
  var chip = document.getElementById('qpchipHold');
  if (!chip) return;
  var top = null, topVal = 0;
  HOLDS.forEach(function(h) {
    var val = h.qty * (prices[h.sym] || h.avgPrice);
    if (val > topVal) { topVal = val; top = h; }
  });
  if (top) {
    chip.textContent = top.sym + ' advice';
    chip.setAttribute('onclick', "qs('Should I hold or reduce " + top.sym + "?')");
  } else {
    chip.textContent = 'My portfolio';
    chip.setAttribute('onclick', "qs('How is my portfolio doing?')");
  }
}

// ─── CHAT UI ─────────────────────────────────────────────
function openAI() {
  document.getElementById('aipanel').classList.add('on');
  document.getElementById('aiov').classList.add('on');
  document.body.style.overflow = 'hidden';
  closeSB();

  // Hide FAB bubble when panel opens
  var bubble = document.getElementById('fabBubble');
  if (bubble) bubble.classList.remove('on');

  if (!aiStarted) {
    aiStarted = true;
    // Welcome message is already in HTML, no need to add another
  }
}

function closeAI() {
  document.getElementById('aipanel').classList.remove('on');
  document.getElementById('aiov').classList.remove('on');
  document.body.style.overflow = '';
  // If Fin was opened from inside a quiz ("Ask Fin for more"), return to the
  // quiz at the exact question the user left, instead of dropping them out.
  if (typeof resumeQuizIfSuspended === 'function') resumeQuizIfSuspended();
}

function addBot(html) {
  var a = document.getElementById('aichat');
  var d = document.createElement('div');
  d.className = 'aimsg ai';
  d.innerHTML = '<div class="aimav">💡</div><div class="aiml"><div class="aimb">' + html + '</div><div class="aimt">Just now</div></div>';
  a.appendChild(d);
  a.scrollTop = a.scrollHeight;
}

function addUser(text) {
  var a = document.getElementById('aichat');
  var d = document.createElement('div');
  d.className = 'aimsg user';
  var avatar = userProfile ? userProfile.avatar : '👤';
  d.innerHTML = '<div class="aiml user-ml"><div class="aimb user-b">' + text + '</div><div class="aimt">Just now</div></div><div class="aimav user-av">' + avatar + '</div>';
  a.appendChild(d);
  a.scrollTop = a.scrollHeight;
}

function showTyping() {
  var a = document.getElementById('aichat');
  var d = document.createElement('div');
  d.className = 'aimsg ai';
  d.id = 'typbub';
  d.innerHTML = '<div class="aimav">💡</div><div class="aiml"><div class="aimb"><div class="typic"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>';
  a.appendChild(d);
  a.scrollTop = a.scrollHeight;
}

function hideTyping() {
  var t = document.getElementById('typbub');
  if (t) t.remove();
}

function sendMsg() {
  if (aiTyping) return;
  var inp = document.getElementById('aiinp');
  var txt = inp.value.trim();
  if (!txt) return;

  inp.value = '';
  inp.style.height = 'auto';
  document.getElementById('qpwrap').style.display = 'none';

  addUser(txt);
  aiTyping = true;
  document.getElementById('aisend').disabled = true;
  showTyping();

  setTimeout(function() {
    hideTyping();
    addBot(getReply(txt));
    aiTyping = false;
    document.getElementById('aisend').disabled = false;
    document.getElementById('aichat').scrollTop = 99999;
  }, 700 + Math.random() * 600);
}

function qs(msg) {
  document.getElementById('aiinp').value = msg;
  sendMsg();
}

// Glossary term → open Fin and ask about it.
function askGloss(term) {
  openAI();
  setTimeout(function() { qs('Explain "' + term + '" in simple terms with an example.'); }, 260);
}
