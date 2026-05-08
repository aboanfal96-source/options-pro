export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { s, date } = req.query;
  if (!s) return res.status(400).json({ error: 'Missing symbol' });
  try {
    let url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(s)}`;
    if (date) url += `?date=${date}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const d = await r.json();
    if (!d.optionChain?.result?.[0]) return res.status(404).json({ error: 'No options data' });
    const result = d.optionChain.result[0];
    const quote = result.quote;
    const expirations = result.expirationDates || [];
    const options = result.options?.[0] || {};
    const mapOpt = (arr) => (arr || []).map(o => ({
      strike: o.strike, last: o.lastPrice, bid: o.bid, ask: o.ask,
      change: o.change, changePct: o.percentChange,
      vol: o.volume || 0, oi: o.openInterest || 0,
      iv: o.impliedVolatility, itm: o.inTheMoney,
      expiry: o.expiration, contract: o.contractSymbol
    }));
    res.json({
      sym: quote.symbol, price: quote.regularMarketPrice,
      expirations, expiry: options.expirationDate,
      calls: mapOpt(options.calls), puts: mapOpt(options.puts)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
