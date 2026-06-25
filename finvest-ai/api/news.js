const { rssItems, cors } = require('./_data');

module.exports = async function (req, res) {
  cors(res);
  const feeds = [
    { src: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { src: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' }
  ];
  for (const f of feeds) {
    try {
      const r = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const xml = await r.text();
      const items = rssItems(xml, 12).map(function (it) { it.src = f.src; return it; }).filter(function (it) { return it.title; });
      if (items.length) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.json({ ok: true, news: items });
        return;
      }
    } catch (e) {}
  }
  res.json({ ok: false, news: [] });
};
