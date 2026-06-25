# Finvest AI 🚀
### Gamified Investing Platform for Gen Z — Indian Markets

---

## Project Structure

```
finvest/
├── index.html          ← Main entry point
├── css/
│   ├── main.css        ← Core layout, sidebar, topbar, pages
│   ├── components.css  ← Cards, modals, buttons, logos
│   └── animations.css  ← Keyframes, transitions
├── js/
│   ├── data.js         ← Stock data, index data, SEBI content
│   ├── market.js       ← Market page, logos, B/S buttons, price ticks
│   ├── learn.js        ← Lessons data, quiz logic, XP system
│   ├── ai.js           ← AI Advisor (Fin) - offline response engine
│   ├── ui.js           ← Navigation, toast, modals, community, leaderboard
│   └── app.js          ← App init, ties everything together
├── assets/
│   └── favicon.svg     ← App icon
├── package.json
└── README.md
```

---

## Features

| Feature | Status |
|---|---|
| 📊 Dashboard with live portfolio | ✅ |
| 📈 Market screen (24 NSE stocks) | ✅ |
| 🏦 Stock logos via Clearbit API | ✅ |
| 🟢 B/S Buy & Sell buttons | ✅ |
| 🎓 15 lessons with quiz + XP | ✅ |
| 🏆 Leaderboard | ✅ |
| 👥 Community rooms | ✅ |
| 📚 SEBI booklet inline reader | ✅ |
| 🤖 AI Advisor (Fin) - offline | ✅ |
| 📱 Fully responsive / mobile | ✅ |

---

## Quick Start

```bash
# Option 1 — just open the file
open index.html

# Option 2 — serve locally (recommended)
npm install
npm start
# → http://localhost:3000

# Option 3 — live reload dev mode
npm run dev
```

---

## How to Extend

### Add a new stock
In `js/data.js`, add to the `ST` array:
```js
{ s:'ZOMATO', n:'Zomato Ltd.', sec:'FMCG', p:220, c:'#e23744', d:'zomato.com' }
```

### Add a new lesson
In `js/learn.js`, add to the `LESSONS` array with the lesson object structure shown.

### Upgrade AI Advisor to use Claude API
In `js/ai.js`, replace `getReply()` with a real `fetch()` call to `https://api.anthropic.com/v1/messages`.
The system prompt and portfolio context are already prepared — see `PORTFOLIO_CONTEXT` in `ai.js`.

### Deploy to Vercel / Netlify
Just drag and drop the entire `finvest/` folder. No build step needed.

---

## Tech Stack
- Pure HTML5 + CSS3 + Vanilla JS (zero dependencies, zero frameworks)
- Google Fonts: Syne + DM Sans
- Logos: Clearbit Logo API (free, no key needed)
- AI: Built-in offline response engine (upgrade to Claude API anytime)

---

## Design System
| Token | Value |
|---|---|
| Background | `#060912` |
| Card | `#0d1221` |
| Green (gains) | `#00e5a0` |
| Red (losses) | `#ff4d6a` |
| Gold (XP) | `#ffb547` |
| Blue | `#4d9fff` |
| Purple | `#9b6dff` |
| Font Heading | Syne 600-800 |
| Font Body | DM Sans 400-600 |
