// api/generate-summary.js — Executive AI & Structured Summary Generator for Kognoz Work Reports
const { applyCors } = require('./_cors');
const { validateToken } = require('./_auth');

module.exports = async function handler(req, res) {
  applyCors(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Require valid session token
  const token = req.headers['x-session-token'];
  const auth = await validateToken(
    token,
    process.env.SESSION_SECRET,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!auth.valid) return res.status(401).json({ error: 'Unauthorized: valid session required' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { tasks = [], assigneeName = 'Team', timeframe = 'All Time' } = body || {};

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(200).json({
        success: true,
        summary: `No completed deliverables found for ${assigneeName} in this timeframe.`,
        keyOutcomes: [],
        model: 'default',
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, synthesize with Gemini AI
    if (geminiKey) {
      try {
        const taskDescriptions = tasks.map((t, idx) => {
          const comp = t.completed_at ? ` (Completed: ${t.completed_at.slice(0, 10)})` : '';
          const desc = t.description ? ` - Description/Deliverable: ${t.description}` : '';
          return `${idx + 1}. [${t.priority || 'Normal'} Priority] ${t.title}${comp}${desc}`;
        }).join('\n');

        const prompt = `You are an executive delivery lead at Kognoz Consulting, a premier management and strategy consulting firm.
Write a concise, polished executive summary report for ${assigneeName} covering the ${timeframe} timeframe based on these completed tasks:

${taskDescriptions}

Please format your response in valid JSON with exactly two fields:
1. "summary": A compelling, executive-level 2-3 sentence overview paragraph emphasizing business value, speed of delivery, and strategic momentum.
2. "keyOutcomes": An array of 3 to 5 concise bullet points summarizing the most impactful milestones and completed deliverables.

Do not wrap the JSON in codeblocks. Return only the raw JSON object.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return res.status(200).json({
              success: true,
              summary: parsed.summary || 'Summary generated.',
              keyOutcomes: parsed.keyOutcomes || [],
              model: 'gemini-1.5-flash',
            });
          }
        } else {
          console.warn('Gemini API responded with status:', geminiRes.status);
        }
      } catch (geminiErr) {
        console.warn('Gemini synthesis fallback:', geminiErr.message);
      }
    }

    // 2. High-Quality Deterministic Executive Synthesis (Fallback)
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const completedCount = tasks.length;
    const keyTitles = tasks.slice(0, 4).map(t => t.title);

    const summary = `${assigneeName} successfully completed ${completedCount} deliverable${completedCount > 1 ? 's' : ''} during this period, including ${highPriorityCount} critical high-priority milestone${highPriorityCount > 1 ? 's' : ''}. Key accomplishments demonstrate strong delivery discipline, cross-functional momentum, and measurable operational value.`;

    const keyOutcomes = tasks.map(t => {
      if (t.description && t.description.length > 10) {
        return `${t.title}: ${t.description.slice(0, 110)}${t.description.length > 110 ? '...' : ''}`;
      }
      return `${t.title} finalized and verified.`;
    }).slice(0, 5);

    return res.status(200).json({
      success: true,
      summary,
      keyOutcomes,
      model: 'structured-synthesis',
    });
  } catch (err) {
    console.error('generate-summary error:', err);
    return res.status(500).json({ error: 'Internal server error while generating summary' });
  }
};
