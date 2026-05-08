export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  const { s, date } = req.query;
  if (!s) return res.status(400).json({ error: 'Missing symbol' });
  try {
    let url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(s)}`;
    if (date) url += `?date=${date}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!r.ok) return res.status(r.status).json({ error: `Yahoo returned ${r.status}` });
    const d = await r.json();
    if (!d.optionChain?.result?.[0]) return res.status(404).json({ error: 'No options data found' });
    const result = d.optionChain.result[0];
    const quote = result.quote || {};
    const expirations = result.expirationDates || [];
    const strikes = result.strikes || [];
    const options = result.options?.[0] || {};
    const mapOpt = (arr) => (arr || []).map(o => ({
      strike: o.strike,
      last: o.lastPrice,
      bid: o.bid,
      ask: o.ask,
      change: o.change,
      changePct: o.percentChange,
      vol: o.volume || 0,
      oi: o.openInterest || 0,
      iv: o.impliedVolatility,
      itm: o.inTheMoney,
      expiry: o.expiration,
      contract: o.contractSymbol,
      lastTrade: o.lastTradeDate
    }));
    res.json({
      sym: quote.symbol || s,
      price: quote.regularMarketPrice,
      prevClose: quote.regularMarketPreviousClose,
      name: quote.shortName || quote.longName || s,
      expirations,
      strikes,
      expiry: options.expirationDate,
      calls: mapOpt(options.calls),
      puts: mapOpt(options.puts)
    });
  } catch (e) {
    console.error('Options API Error:', e);
    res.status(500).json({ error: 'Internal server error: ' + e.message });
  }
}
