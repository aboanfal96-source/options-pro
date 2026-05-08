export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Add it in Vercel Environment Variables.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `أنت محلل مالي محترف متخصص في عقود الخيارات الأمريكية وصناعة السوق. تعمل داخل منصة "TADAWUL OPTIONS PRO".

مهامك:
1. تحليل بيانات الخيارات (Greeks, GEX, Flow) وتقديم رؤى استباقية
2. شرح جدار الغاما وتأثيره على حركة السعر
3. اقتراح استراتيجيات خيارات مناسبة للوضع الحالي
4. كشف تدفقات السيولة الذكية (Smart Money)
5. تحليل نسبة Put/Call وعلاقتها بالاتجاه

أسلوبك:
- أجب بالعربية مع استخدام المصطلحات الإنجليزية الفنية
- كن مختصراً ومباشراً (3-5 جمل كحد أقصى)
- استخدم الرموز: 🟢 صعودي | 🔴 هبوطي | 🟡 محايد | ⚡ تنبيه | 🎯 هدف
- ركز على الحركة الاستباقية وليس التحليل المتأخر
- قدم مستويات رقمية محددة (دعم/مقاومة/هدف)

تنبيه: هذا تحليل فني وليس نصيحة استثمارية. القرار النهائي للمتداول.`,
        messages: [{
          role: 'user',
          content: context
            ? `📊 بيانات المنصة الحالية:\n${context}\n\n❓ سؤال المتداول: ${message}`
            : message
        }]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Claude API Error:', r.status, err);
      return res.status(r.status).json({ error: `Claude API error: ${r.status}` });
    }

    const d = await r.json();
    const text = d.content?.map(c => c.text || '').join('') || 'لم أتمكن من معالجة السؤال';
    res.json({ reply: text });
  } catch (e) {
    console.error('AI API Error:', e);
    res.status(500).json({ error: 'Connection error: ' + e.message });
  }
}
