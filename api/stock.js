export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  const { s, range = '1mo', interval = '15m' } = req.query;
  if (!s) return res.status(400).json({ error: 'Missing symbol parameter' });
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=${range}&interval=${interval}&includePrePost=false`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!r.ok) return res.status(r.status).json({ error: `Yahoo returned ${r.status}` });
    const d = await r.json();
    if (!d.chart?.result?.[0]) return res.status(404).json({ error: 'Symbol not found' });
    const result = d.chart.result[0];
    const meta = result.meta;
    const ts = result.timestamp || [];
    const q = result.indicators.quote[0];
    const candles = [];
    for (let i = 0; i < ts.length; i++) {
      if (q.open[i] != null && q.high[i] != null && q.low[i] != null && q.close[i] != null) {
        candles.push({
          t: ts[i] * 1000,
          o: +q.open[i].toFixed(4),
          h: +q.high[i].toFixed(4),
          l: +q.low[i].toFixed(4),
          c: +q.close[i].toFixed(4),
          v: q.volume[i] || 0
        });
      }
    }
    res.json({
      sym: meta.symbol,
      name: meta.shortName || meta.longName || meta.symbol,
      price: meta.regularMarketPrice,
      prevClose: meta.previousClose || meta.chartPreviousClose,
      change: +(meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)).toFixed(4),
      changePct: +(((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100).toFixed(2),
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      vol: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      candles
    });
  } catch (e) {
    console.error('Stock API Error:', e);
    res.status(500).json({ error: 'Internal server error: ' + e.message });
  }
}
