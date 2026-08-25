// api/repolish-description.js — Rephrase & Expand Task Description into Professional Documentation Tone
const { applyCors } = require('./_cors');
const { validateToken } = require('./_auth');
const { safeError, serverError } = require('./_errors');

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
  if (!auth.valid) return safeError(res, 401, 'Unauthorized: valid session required');

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const { title = '', description = '', priority = 'normal' } = body || {};

    const rawTitle = String(title || '').trim();
    const rawDesc = String(description || '').trim();

    if (!rawTitle && !rawDesc) {
      return safeError(res, 400, 'Please provide a task title or draft notes in the description.');
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, synthesize with Gemini AI
    if (geminiKey) {
      try {
        const prompt = `You are a senior technical writer and delivery operations lead at Kognoz Consulting.
Transform the following task draft notes into a comprehensive, articulate, and professional deliverable documentation description.

Task Title: ${rawTitle || 'Deliverable Item'}
Priority: ${priority.toUpperCase()}
User Draft / Initial Notes:
${rawDesc || 'Draft a complete operational description based on the title.'}

Instructions:
1. Tone & Style: Executive consulting and enterprise-grade documentation tone. Use articulate, precise, and professional vocabulary.
2. Structure & Detail: Elaborate substantially to add characters, technical clarity, and depth.
   Include:
   - Scope & Core Objective: Clear definition of what is being built, resolved, or executed.
   - Implementation & Execution Details: Key methodologies, validation checks, and operational workflow steps.
   - Quality & Deliverable Impact: Verification criteria, performance assurances, and expected business outcome.
3. Length: 2 to 3 substantive paragraphs or clean bulleted blocks (approx 120-250 words).
4. Direct Output: Return ONLY the polished description text itself. Do not include markdown codeblocks, conversational preamble, or intros.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 10) {
            return res.status(200).json({
              success: true,
              polishedDescription: candidateText.trim(),
              model: 'gemini-1.5-flash',
            });
          }
        } else {
          console.warn('Gemini API responded with status:', geminiRes.status);
        }
      } catch (geminiErr) {
        console.warn('Gemini description polish fallback:', geminiErr.message);
      }
    }

    // 2. High-Quality Deterministic Structured Polish Engine (Fallback)
    const baseSubject = rawTitle || (rawDesc.length > 30 ? rawDesc.slice(0, 30) + '...' : rawDesc);
    const cleanedNotes = rawDesc ? rawDesc.replace(/\s+/g, ' ').trim() : 'Execution of scheduled milestones according to project specifications.';

    const paragraph1 = `**Objective & Scope:**\nExecute ${rawTitle ? `${rawTitle}` : 'assigned deliverable'} with comprehensive operational rigor and strategic precision. Ensure end-to-end alignment across core technical requirements, milestone deliverables, and enterprise standards.`;

    const paragraph2 = `**Implementation & Workflow:**\n${cleanedNotes.length > 5 ? `Initial specifications: ${cleanedNotes}. ` : ''}Perform systematic development, verification of dependent services, and detailed edge-case validation to ensure zero-defect delivery and frictionless integration into the active workflow.`;

    const paragraph3 = `**Deliverables & Acceptance Criteria:**\nDeliver finalized, production-ready assets with thorough verification against defined acceptance criteria. Ensure complete audit trail documentation, performance benchmarking, and seamless handoff to cross-functional stakeholders.`;

    const polishedDescription = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`;

    return res.status(200).json({
      success: true,
      polishedDescription,
      model: 'structured-synthesis',
    });
  } catch (err) {
    return serverError(res, err, 'repolish-description');
  }
};
