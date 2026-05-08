export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `أنت محلل مالي خبير في عقود الخيارات والأسهم الأمريكية. تعمل داخل منصة تداول متقدمة.
قواعدك:
- أجب بالعربية دائماً إلا إذا طُلب غير ذلك
- كن مختصراً ومباشراً
- استخدم البيانات المقدمة لك في السياق
- لا تعطِ نصائح استثمارية مباشرة، بل حلل البيانات
- ركز على: تحليل Greeks، تدفق السيولة، مستويات Gamma، وأنماط الخيارات
- عند السؤال عن أفضل أسهم، حلل البيانات واذكر الأسباب الفنية
- تنبيه: هذه ليست نصيحة استثمارية`,
        messages: [{ role: 'user', content: context ? `سياق المنصة:\n${context}\n\nسؤال المستخدم: ${message}` : message }]
      })
    });
    const d = await r.json();
    const text = d.content?.map(c => c.text || '').join('') || 'لم أتمكن من الإجابة';
    res.json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
