export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const { s, range = '1mo', interval = '15m' } = req.query;
  if (!s) return res.status(400).json({ error: 'Missing symbol' });
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=${range}&interval=${interval}&includePrePost=false`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const d = await r.json();
    if (!d.chart?.result?.[0]) return res.status(404).json({ error: 'No data' });
    const result = d.chart.result[0];
    const meta = result.meta;
    const ts = result.timestamp || [];
    const q = result.indicators.quote[0];
    const candles = ts.map((t, i) => ({
      t: t * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i]
    })).filter(c => c.o && c.h && c.l && c.c);
    res.json({
      sym: meta.symbol, name: meta.shortName || meta.symbol,
      price: meta.regularMarketPrice, prevClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
      high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow,
      vol: meta.regularMarketVolume, candles
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
