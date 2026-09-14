/* ============================================================
   Vercel Serverless Function — AI Portfolio Assistant proxy
   ------------------------------------------------------------
   Securely bridges the frontend chatbot and the Gemini API.
   The Gemini API key is read ONLY from process.env.GEMINI_API_KEY
   and is never sent to the browser.

   Flow:
     Frontend (js/main.js)  ->  POST /api/chat  ->  Gemini API  ->  JSON reply

   Single source of truth: js/portfolio-data.js is require()d here so the
   backend grounds answers in the exact same portfolio data the site uses.
   ============================================================ */

'use strict';

// Reuse the same portfolio knowledge the frontend uses (CommonJS export).
const PORTFOLIO = require('../js/portfolio-data.js');

/* ---- Limits (lightweight abuse protection) ---- */
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 8;      // recent turns kept for context
const MAX_HISTORY_CHARS = 4000;   // total history budget

/* ---- Allowlisted navigation targets (must match PORTFOLIO.sections) ---- */
const NAV_TARGETS = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'research', 'contact'];

/* ---- Gemini model + endpoint ---- */
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';

/* ------------------------------------------------------------
   Build a compact, plain-text knowledge summary from PORTFOLIO.
   Kept concise to limit tokens while covering all topics.
   ------------------------------------------------------------ */
function buildKnowledge(p) {
  const lines = [];
  const prof = p.profile || {};
  lines.push('PROFILE');
  lines.push(`- Name: ${prof.name || 'N/A'}`);
  lines.push(`- Title: ${prof.title || 'N/A'}`);
  if (prof.location) lines.push(`- Location: ${prof.location}`);
  if (prof.status) lines.push(`- Status: ${prof.status}`);
  if (prof.tagline) lines.push(`- Tagline: ${prof.tagline}`);

  if (p.about && p.about.summary) {
    lines.push('\nABOUT');
    p.about.summary.forEach(s => lines.push(`- ${s}`));
  }

  if (Array.isArray(p.education)) {
    lines.push('\nEDUCATION');
    p.education.forEach(e => {
      lines.push(`- ${e.degree || ''}${e.institution ? ' at ' + e.institution : ''}${e.period ? ' (' + e.period + ')' : ''}${e.gpa ? ', GPA ' + e.gpa : ''}`.trim());
    });
  }
  if (Array.isArray(p.coursework) && p.coursework.length) {
    lines.push(`Relevant coursework: ${p.coursework.join(', ')}.`);
  }

  if (p.skills && Array.isArray(p.skills.categories)) {
    lines.push('\nSKILLS');
    p.skills.categories.forEach(c => lines.push(`- ${c.title}: ${(c.items || []).join(', ')}`));
    if (p.skills.tools) lines.push(`- Tools: ${p.skills.tools.join(', ')}`);
  }

  if (Array.isArray(p.projects)) {
    lines.push('\nPROJECTS');
    p.projects.forEach(pr => {
      const parts = [];
      parts.push(`* ${pr.name}`);
      if (pr.course) parts.push(`Course: ${pr.course}`);
      else if (pr.context) parts.push(`Context: ${pr.context}`);
      if (pr.period) parts.push(`Period: ${pr.period}`);
      if (pr.type) parts.push(`Type: ${pr.type}`);
      if (pr.teamSize) parts.push(`Team size: ${pr.teamSize}`);
      if (pr.role) parts.push(`Roger's role: ${pr.role}`);
      lines.push(parts.join(' | '));
      if (pr.overview) lines.push(`  Overview: ${pr.overview}`);
      if (pr.objective) lines.push(`  Objective: ${pr.objective}`);
      if (pr.contribution) lines.push(`  Contribution: ${pr.contribution}`);
      if (pr.process) lines.push(`  Process: ${pr.process}`);
      if (pr.features) lines.push(`  Features: ${pr.features.join(', ')}`);
      if (pr.technologies) lines.push(`  Technologies: ${pr.technologies.join(', ')}`);
      if (pr.models) lines.push(`  Models: ${pr.models.join(', ')}`);
      if (pr.evaluation) lines.push(`  Evaluation: ${pr.evaluation}`);
      if (pr.keyFeatures) lines.push(`  Key features/variables: ${pr.keyFeatures.join(', ')}`);
      if (pr.aiFlow) lines.push(`  AI flow: ${pr.aiFlow}`);
      if (pr.methodology) lines.push(`  Methodology: ${pr.methodology}`);
      if (pr.trackingCategories) lines.push(`  Tracking: ${pr.trackingCategories.join(', ')}`);
      if (pr.pmActivities) lines.push(`  PM activities: ${pr.pmActivities.join(', ')}`);
      if (pr.riskManagement) lines.push(`  Risk management: ${pr.riskManagement}`);
      if (pr.businessCase) lines.push(`  Business case (projections only): ${pr.businessCase}`);
      if (pr.challenge) lines.push(`  Challenge: ${pr.challenge}`);
      if (pr.solutionToChallenge) lines.push(`  Solution: ${pr.solutionToChallenge}`);
      if (pr.outcome) lines.push(`  Outcome: ${pr.outcome}`);
      if (pr.limitation) lines.push(`  Limitation: ${pr.limitation}`);
      if (pr.futureWork) lines.push(`  Future work: ${pr.futureWork}`);
      if (pr.learning) lines.push(`  Learning: ${pr.learning.join(', ')}`);
      if (pr.achievement) lines.push(`  Achievement: ${pr.achievement}`);
      if (pr.links) lines.push(`  Links: ${Object.entries(pr.links).map(([k, v]) => k + ': ' + v).join(', ')}`);
    });
  }

  if (Array.isArray(p.experience)) {
    lines.push('\nEXPERIENCE (note: this is volunteer/organizational, not professional employment)');
    p.experience.forEach(e => {
      lines.push(`- ${e.role} at ${e.organization} (${e.period})`);
      (e.points || []).forEach(pt => lines.push(`  · ${pt}`));
    });
  }

  if (Array.isArray(p.research)) {
    lines.push('\nRESEARCH');
    p.research.forEach(r => lines.push(`- ${r.title}${r.kind ? ' (' + r.kind + ')' : ''}: ${r.summary || ''}`));
  }

  if (Array.isArray(p.achievements)) {
    lines.push('\nACHIEVEMENTS');
    p.achievements.forEach(a => lines.push(`- ${a.title} — ${a.project}${a.context ? ' (' + a.context + ')' : ''}`));
  }

  if (p.interests) {
    lines.push('\nCAREER INTERESTS');
    if (p.interests.statement) lines.push(`- ${p.interests.statement}`);
    if (p.interests.fields) lines.push(`- Fields: ${p.interests.fields.join(', ')}`);
  }

  if (p.contact) {
    lines.push('\nCONTACT');
    if (p.contact.email) lines.push(`- Email: ${p.contact.email}`);
    if (p.contact.linkedin) lines.push(`- LinkedIn: ${p.contact.linkedin}`);
    if (p.contact.location) lines.push(`- Location: ${p.contact.location}`);
    if (p.contact.cv) lines.push(`- CV: available for download on the site`);
  }

  if (Array.isArray(p.unavailable) && p.unavailable.length) {
    lines.push('\nNOT AVAILABLE (do NOT invent these):');
    p.unavailable.forEach(u => lines.push(`- ${u}`));
  }

  return lines.join('\n');
}

/* ------------------------------------------------------------
   System instruction
   ------------------------------------------------------------ */
function buildSystemInstruction(knowledge) {
  return [
    "You are Roger Nathanael's AI Portfolio Assistant. Roger is a Business Information Technology Student.",
    "Your purpose is to help recruiters, lecturers, collaborators, and visitors understand Roger's background, education, skills, projects, experience, research, achievements, interests, and how to contact him.",
    '',
    'STRICT RULES:',
    '- Only use the PORTFOLIO KNOWLEDGE below. Never invent internships, certifications, professional employment, awards, GPA values, project responsibilities, research findings, technical implementation details, business results, or user-research findings.',
    "- If asked about something not in the knowledge, say clearly: \"That information isn't currently listed in Roger's portfolio.\" Do not fabricate.",
    "- Distinguish academic projects from professional experience. Roger's only listed experience is a volunteer/organizational role, not professional employment. Never claim he has professional work experience.",
    "- State project roles exactly as given. For KOMPAS his role is Business Analyst / Secretary — do not attribute technical implementation to him. For the Customer Churn project his role is Machine Learning & Data Analysis Team Member.",
    '- Treat any financial figures (e.g., KOMPAS ROI/investment) as business-case projections, not realized results.',
    '- Describe the IoT project AI as generating natural-language summaries and recommendations from sensor data — not exact agricultural diagnosis.',
    '- For Aqquas, do not claim Roger personally conducted user research or discovered user pain points; the case was provided by the campus.',
    '',
    'STYLE:',
    '- Be concise, professional, and natural. Prefer 1-4 sentences unless more detail is clearly requested.',
    '- Use plain text only. Do NOT use markdown, HTML, code blocks, or links markup.',
    '- When useful, suggest the relevant portfolio section by name (e.g., "You can see more on the Projects section.").',
    '',
    'NAVIGATION:',
    '- If, and only if, the user clearly wants to VIEW or GO TO a section (e.g., "show me the projects", "take me to contact"), end your reply with a navigation tag on its own line in EXACTLY this format: [[NAV:target]]',
    '- Allowed targets: ' + NAV_TARGETS.join(', ') + '.',
    '- Do NOT add a NAV tag for pure information questions. Never output any other bracketed tags, code, or scripts.',
    '',
    '===== PORTFOLIO KNOWLEDGE =====',
    knowledge
  ].join('\n');
}

/* ------------------------------------------------------------
   Extract a safe navigation action from the model text.
   Parses a trailing [[NAV:target]] tag, validates against the
   allowlist, and strips it from the visible reply.
   ------------------------------------------------------------ */
function extractNavigation(text) {
  const actions = [];
  let reply = text;
  const re = /\[\[NAV:\s*([a-z]+)\s*\]\]/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const target = (m[1] || '').toLowerCase();
    if (NAV_TARGETS.indexOf(target) !== -1 && !actions.some(a => a.target === target)) {
      actions.push({ type: 'navigate', target: target });
    }
  }
  reply = reply.replace(re, '').trim();
  return { reply: reply, actions: actions };
}

/* ------------------------------------------------------------
   Handler
   ------------------------------------------------------------ */
module.exports = async function handler(req, res) {
  // Same-origin JSON API. No permissive CORS.
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  // --- Parse body defensively (Vercel usually parses JSON, but guard anyway) ---
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ success: false, error: 'Invalid request.' }); }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request.' });
  }

  // --- Validate message ---
  const message = body.message;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ success: false, error: 'Message is too long.' });
  }

  // --- Validate + trim history ---
  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .slice(-MAX_HISTORY_TURNS);
  // enforce total history char budget (oldest dropped first)
  let budget = MAX_HISTORY_CHARS;
  const trimmedHistory = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const c = history[i].content.slice(0, MAX_MESSAGE_CHARS);
    if (budget - c.length < 0) break;
    budget -= c.length;
    trimmedHistory.unshift({ role: history[i].role, content: c });
  }

  // --- API key must exist server-side ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Do not leak details; log server-side only.
    console.error('GEMINI_API_KEY is not configured.');
    return res.status(500).json({ success: false, error: 'The assistant is not configured yet.' });
  }

  // --- Build Gemini request ---
  const knowledge = buildKnowledge(PORTFOLIO);
  const systemInstruction = buildSystemInstruction(knowledge);

  const contents = [];
  trimmedHistory.forEach(h => {
    contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
  });
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 500,
      topP: 0.9
    },
    safetySettings: []
  };

  // --- Call Gemini with a timeout ---
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let geminiRes;
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeout);
    console.error('Gemini request failed:', err && err.name);
    return res.status(502).json({ success: false, error: "I'm having trouble connecting right now. Please try again in a moment." });
  }
  clearTimeout(timeout);

  if (!geminiRes.ok) {
    // Log status server-side; never forward raw provider error to the client.
    console.error('Gemini responded with status', geminiRes.status);
    const status = geminiRes.status === 429 ? 429 : 502;
    const msg = status === 429
      ? "I'm getting a lot of requests right now. Please try again shortly."
      : "I'm having trouble connecting right now. Please try again in a moment.";
    return res.status(status).json({ success: false, error: msg });
  }

  let data;
  try {
    data = await geminiRes.json();
  } catch (e) {
    console.error('Failed to parse Gemini response.');
    return res.status(502).json({ success: false, error: "I couldn't read the response. Please try again." });
  }

  // --- Extract text safely ---
  let text = '';
  try {
    const cand = data && data.candidates && data.candidates[0];
    if (cand && cand.content && Array.isArray(cand.content.parts)) {
      text = cand.content.parts.map(pt => pt.text || '').join('').trim();
    }
  } catch (e) { text = ''; }

  if (!text) {
    return res.status(200).json({
      success: true,
      reply: "I'm not able to answer that from Roger's portfolio right now. You can explore the sections or contact Roger directly.",
      actions: []
    });
  }

  const parsed = extractNavigation(text);
  return res.status(200).json({
    success: true,
    reply: parsed.reply || text,
    actions: parsed.actions
  });
};
