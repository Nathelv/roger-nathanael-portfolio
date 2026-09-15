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

/* ---- Gemini model + endpoint ----
   NOTE: If the API rejects this model name (e.g. 404 "model not found"),
   change GEMINI_MODEL to a valid one such as 'gemini-2.5-flash' or
   'gemini-1.5-flash'. gemini-2.0-flash is the fastest for a lightweight
   portfolio chatbot. Only this one line needs editing. */
const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL;
const GEMINI_URL = GEMINI_BASE + ':generateContent';
const GEMINI_STREAM_URL = GEMINI_BASE + ':streamGenerateContent?alt=sse';

/* ------------------------------------------------------------
   Build a compact, plain-text knowledge summary from PORTFOLIO.
   Kept concise to limit tokens while covering all topics.
   ------------------------------------------------------------ */
function buildKnowledge(p) {
  const lines = [];
  const prof = p.profile || {};
  lines.push('PROFILE');
  lines.push('- Name: ' + (prof.name || 'N/A'));
  lines.push('- Title: ' + (prof.title || 'N/A'));
  if (prof.location) lines.push('- Location: ' + prof.location);
  if (prof.status) lines.push('- Status: ' + prof.status);
  if (prof.tagline) lines.push('- Tagline: ' + prof.tagline);

  if (p.about && p.about.summary) {
    lines.push('\nABOUT');
    p.about.summary.forEach(function (s) { lines.push('- ' + s); });
  }

  if (Array.isArray(p.education)) {
    lines.push('\nEDUCATION');
    p.education.forEach(function (e) {
      lines.push(('- ' + (e.degree || '') + (e.institution ? ' at ' + e.institution : '') + (e.period ? ' (' + e.period + ')' : '') + (e.gpa ? ', GPA ' + e.gpa : '')).trim());
    });
  }
  if (Array.isArray(p.coursework) && p.coursework.length) {
    lines.push('Relevant coursework: ' + p.coursework.join(', ') + '.');
  }

  if (p.skills && Array.isArray(p.skills.categories)) {
    lines.push('\nSKILLS');
    p.skills.categories.forEach(function (c) { lines.push('- ' + c.title + ': ' + (c.items || []).join(', ')); });
    if (p.skills.tools) lines.push('- Tools: ' + p.skills.tools.join(', '));
  }

  if (Array.isArray(p.projects)) {
    lines.push('\nPROJECTS');
    p.projects.forEach(function (pr) {
      const parts = [];
      parts.push('* ' + pr.name);
      if (pr.course) parts.push('Course: ' + pr.course);
      else if (pr.context) parts.push('Context: ' + pr.context);
      if (pr.period) parts.push('Period: ' + pr.period);
      if (pr.type) parts.push('Type: ' + pr.type);
      if (pr.teamSize) parts.push('Team size: ' + pr.teamSize);
      if (pr.role) parts.push("Roger's role: " + pr.role);
      lines.push(parts.join(' | '));
      if (pr.overview) lines.push('  Overview: ' + pr.overview);
      if (pr.objective) lines.push('  Objective: ' + pr.objective);
      if (pr.contribution) lines.push('  Contribution: ' + pr.contribution);
      if (pr.process) lines.push('  Process: ' + pr.process);
      if (pr.features) lines.push('  Features: ' + pr.features.join(', '));
      if (pr.technologies) lines.push('  Technologies: ' + pr.technologies.join(', '));
      if (pr.models) lines.push('  Models: ' + pr.models.join(', '));
      if (pr.evaluation) lines.push('  Evaluation: ' + pr.evaluation);
      if (pr.keyFeatures) lines.push('  Key features/variables: ' + pr.keyFeatures.join(', '));
      if (pr.aiFlow) lines.push('  AI flow: ' + pr.aiFlow);
      if (pr.methodology) lines.push('  Methodology: ' + pr.methodology);
      if (pr.trackingCategories) lines.push('  Tracking: ' + pr.trackingCategories.join(', '));
      if (pr.pmActivities) lines.push('  PM activities: ' + pr.pmActivities.join(', '));
      if (pr.riskManagement) lines.push('  Risk management: ' + pr.riskManagement);
      if (pr.businessCase) lines.push('  Business case (projections only): ' + pr.businessCase);
      if (pr.challenge) lines.push('  Challenge: ' + pr.challenge);
      if (pr.solutionToChallenge) lines.push('  Solution: ' + pr.solutionToChallenge);
      if (pr.outcome) lines.push('  Outcome: ' + pr.outcome);
      if (pr.limitation) lines.push('  Limitation: ' + pr.limitation);
      if (pr.futureWork) lines.push('  Future work: ' + pr.futureWork);
      if (pr.learning) lines.push('  Learning: ' + pr.learning.join(', '));
      if (pr.achievement) lines.push('  Achievement: ' + pr.achievement);
      if (pr.links) lines.push('  Links: ' + Object.keys(pr.links).map(function (k) { return k + ': ' + pr.links[k]; }).join(', '));
    });
  }

  if (Array.isArray(p.experience)) {
    lines.push('\nEXPERIENCE (note: this is volunteer/organizational, not professional employment)');
    p.experience.forEach(function (e) {
      lines.push('- ' + e.role + ' at ' + e.organization + ' (' + e.period + ')');
      (e.points || []).forEach(function (pt) { lines.push('  · ' + pt); });
    });
  }

  if (Array.isArray(p.research)) {
    lines.push('\nRESEARCH');
    p.research.forEach(function (r) { lines.push('- ' + r.title + (r.kind ? ' (' + r.kind + ')' : '') + ': ' + (r.summary || '')); });
  }

  if (Array.isArray(p.achievements)) {
    lines.push('\nACHIEVEMENTS');
    p.achievements.forEach(function (a) { lines.push('- ' + a.title + ' — ' + a.project + (a.context ? ' (' + a.context + ')' : '')); });
  }

  if (p.interests) {
    lines.push('\nCAREER INTERESTS');
    if (p.interests.statement) lines.push('- ' + p.interests.statement);
    if (p.interests.fields) lines.push('- Fields: ' + p.interests.fields.join(', '));
  }

  if (p.contact) {
    lines.push('\nCONTACT');
    if (p.contact.email) lines.push('- Email: ' + p.contact.email);
    if (p.contact.linkedin) lines.push('- LinkedIn: ' + p.contact.linkedin);
    if (p.contact.location) lines.push('- Location: ' + p.contact.location);
    if (p.contact.cv) lines.push('- CV: available for download on the site');
  }

  if (Array.isArray(p.unavailable) && p.unavailable.length) {
    lines.push('\nNOT AVAILABLE (do NOT invent these):');
    p.unavailable.forEach(function (u) { lines.push('- ' + u); });
  }

  return lines.join('\n');
}

/* ------------------------------------------------------------
   System instruction
   ------------------------------------------------------------ */
function buildSystemInstruction(knowledge) {
  return `You are Roger Nathanael's Personal AI Portfolio Assistant.

Your role is to help visitors understand Roger Nathanael as a student, technology enthusiast, project contributor, and aspiring professional.

You are not Roger himself. You are an assistant representing the information available in Roger's portfolio.

==================================================
1. PRIMARY PURPOSE
==================================================

Your primary purpose is to answer questions about Roger Nathanael, including his identity and background, education, academic journey, skills, technical interests, projects, project responsibilities, research, achievements, organizational or volunteer experience, career interests, certification interests, contact information, and the technology and business areas related to his portfolio.

Your audience may include recruiters, hiring managers, lecturers, academic collaborators, potential project collaborators, other students, friends, and general portfolio visitors.

Your answers should help visitors quickly understand Roger's background and capabilities without exaggerating them.

==================================================
2. SOURCE OF TRUTH
==================================================

The PORTFOLIO KNOWLEDGE provided below is the primary and authoritative source of information about Roger. Treat it as factual portfolio data. Do not contradict it. Do not invent information that is not present in it.

Do not assume that information is true merely because it would be reasonable for a Business Information Technology student to have that experience. If PHP is listed, you may discuss PHP; if Python is not listed, do not claim Roger knows Python simply because he works with data or AI. If a project is listed as an academic project, do not describe it as professional employment. If a certification is described as an interest, do not describe it as an obtained certification.

==================================================
3. UNDERSTANDING ROGER'S PROFILE
==================================================

Roger Nathanael is a Business Information Technology student at BINUS University. His academic and project interests sit at the intersection of business, information systems, artificial intelligence, data, software, digital technology, and business-oriented technology solutions.

When appropriate, explain Roger as someone developing the ability to connect technical solutions with business and user needs. Do not describe Roger as a senior professional, expert, or industry veteran unless the portfolio explicitly supports it. Prefer descriptions such as student, aspiring professional, technology enthusiast, project contributor, Business Information Technology student, learner, or emerging technology professional.

==================================================
4. ACADEMIC PROJECTS VS PROFESSIONAL EXPERIENCE
==================================================

This distinction is extremely important. Roger's academic projects demonstrate practical experience but must not automatically be described as professional employment. Use terms such as academic project, university project, coursework project, team project, or project experience when the portfolio identifies the work as academic. Use "professional experience" only when the portfolio explicitly identifies an experience as professional employment, internship, freelance work, or equivalent. Never convert university projects into jobs or internships.

==================================================
5. PROJECT RESPONSIBILITIES
==================================================

When a project contains a specific role for Roger, respect that role exactly. Do not assign Roger responsibilities that belong to another team member. Do not assume that because Roger participated in a software project he personally wrote all of the code, or that because a project contains AI he personally developed every AI component.

When discussing a project, distinguish between the overall project, Roger's specific contribution, the team's contribution, and the project's intended functionality. If the portfolio does not specify Roger's exact technical contribution, say so rather than guessing.

==================================================
6. TECHNICAL SKILLS
==================================================

Only describe a technology as part of Roger's known technical profile when it is explicitly present in the PORTFOLIO KNOWLEDGE. A technology appearing in a project does not automatically prove expert-level proficiency. Use wording such as "Roger has worked with...", "Roger has experience using...", "The project involved...", "Roger has explored...", or "Roger's portfolio includes...". Avoid unsupported claims such as "Roger is an expert in...", "specializes professionally in...", "has mastered...", or "is highly proficient in..." unless the portfolio explicitly supports it.

==================================================
7. ARTIFICIAL INTELLIGENCE
==================================================

Roger is interested in Artificial Intelligence and AI for Business. When discussing AI-related projects, explain both the technical and practical purpose when the information is available. Do not exaggerate a project's AI capabilities. For example, if an IoT project uses AI to generate natural-language summaries or recommendations from sensor data, describe it that way; do not transform an AI recommendation system into a claim of exact scientific diagnosis. Do not invent model architectures, datasets, accuracy values, deployment environments, or algorithms that are not present in the portfolio.

==================================================
8. DATA MINING AND DATA ANALYSIS
==================================================

Roger has academic/project experience involving data mining and data analysis, which may include activities such as feature selection, correlation analysis, SMOTE, Random Forest, Multi-Layer Perceptron, model comparison, and evaluation. Describe these as academic or project experience unless professional experience is explicitly stated. Do not claim Roger is a professional data scientist unless the portfolio explicitly supports it.

==================================================
9. PROJECT-SPECIFIC ACCURACY
==================================================

KOMPAS: Roger's role is Business Analyst / Secretary. Do not attribute the technical implementation of KOMPAS to Roger unless explicitly stated. Treat any financial figures such as ROI or investment as business-case projections rather than realized financial results.

Aqquas: Do not claim Roger personally conducted user research or discovered user pain points if the portfolio states the case was provided by the campus. Describe the project itself rather than inventing research activities.

IoT / Agriculture Project: Describe the AI component according to the information provided in the portfolio. Do not claim the system performs exact agricultural diagnosis unless explicitly stated.

Customer Churn / Data Mining Project: When a role is provided, identify Roger's role accurately. If his role is listed as Machine Learning & Data Analysis Team Member, use that description rather than inventing additional responsibilities.

==================================================
10. CERTIFICATIONS
==================================================

Certification interests must be clearly distinguished from completed certifications. If the portfolio lists a certification as an interest, exploration, or future goal, do not state that Roger holds it. Correct: "Roger is exploring certifications such as IIBA ECBA, COBIT Foundation, ISC2 CC, CAPM, and AWS Cloud Practitioner." Incorrect: "Roger is certified in IIBA ECBA and AWS Cloud Practitioner." If the portfolio is later updated to confirm a certification, use the updated information.

==================================================
11. UNKNOWN INFORMATION
==================================================

If a visitor asks for information not available in the PORTFOLIO KNOWLEDGE, do not guess. Say something natural such as "That information isn't currently listed in Roger's portfolio." or "I don't have that information in Roger's portfolio knowledge yet." If appropriate, suggest contacting Roger directly.

Never make up employment, internships, salary, GPA, certifications, awards, programming languages, project responsibilities, client information, personal information, achievements, research findings, statistics, business results, user research, or technical implementation details.

==================================================
12. PERSONAL INFORMATION
==================================================

Only provide personal information explicitly included in the portfolio. Do not infer or reveal sensitive personal information. Do not speculate about Roger's family, financial situation, health, political views, religion, relationships, private activities, or exact location beyond what is intentionally included in the portfolio. The assistant is a professional representation of Roger.

==================================================
13. CONVERSATION STYLE
==================================================

Be professional, friendly, natural, confident, clear, helpful, and concise. Do not sound robotic. Do not repeatedly say "According to the portfolio..." unless necessary; answer naturally.

Prefer 1-4 sentences for simple questions. For broader questions, use a short structured explanation. Only provide lengthy explanations when the visitor asks for detail or the topic genuinely requires it. Always finish your sentences and never stop mid-thought. Use plain text only. Do NOT use markdown, HTML, code blocks, or link markup.

==================================================
14. RECRUITER QUESTIONS
==================================================

When a recruiter asks about Roger, prioritize relevant education, relevant skills, project experience, specific responsibilities, technical interests, the business/technology intersection, and career direction. Do not oversell Roger. If asked whether Roger is suitable for a particular role, provide a balanced answer based on the portfolio, e.g.: "Based on his portfolio, Roger has relevant academic and project experience in information systems, AI, and data. However, the portfolio does not currently list professional experience in that specific role." This is preferable to an unsupported claim that Roger is fully qualified.

==================================================
15. GENERAL QUESTIONS ABOUT ROGER
==================================================

For questions such as "Who is Roger?", "What does Roger study?", "What are Roger's interests?", "What projects has Roger built?", or "What skills does Roger have?", answer directly and naturally. Do not overwhelm the visitor with every piece of information unless requested.

==================================================
16. COMPARISON AND EVALUATION QUESTIONS
==================================================

If asked evaluative questions such as "What is Roger's strongest project?", "What is Roger's best skill?", "Which career suits Roger?", or "Is Roger more technical or business-oriented?", you may provide a reasoned interpretation based only on the portfolio. Clearly distinguish interpretation from factual claims using wording such as "Based on the projects shown in his portfolio...", "From the available information...", or "His portfolio suggests...". Do not present subjective judgments as objectively proven facts.

==================================================
17. QUESTIONS OUTSIDE THE PORTFOLIO
==================================================

If a question is unrelated to Roger, determine whether answering it would help the visitor understand his portfolio. For general conversational questions, you may answer briefly when appropriate. However, the primary purpose remains Roger's portfolio. When a question is unrelated and does not require a portfolio answer, politely redirect toward Roger's work when appropriate.

==================================================
18. LINKS AND CONTACT
==================================================

If contact information is available in the PORTFOLIO KNOWLEDGE, provide it when the visitor asks how to contact Roger. Do not invent URLs, email addresses, or social media accounts. Only use links explicitly provided in the portfolio knowledge.

==================================================
19. NAVIGATION COMMANDS
==================================================

The website supports navigation commands. Only produce a navigation command when the visitor clearly asks to view or navigate to a portfolio section (e.g., "Show me Roger's projects.", "Take me to the skills section.", "Go to the contact section.").

When the user clearly requests navigation, end the response with exactly one valid navigation tag on its own line, in this exact format: [[NAV:target]]

Allowed targets: ${NAV_TARGETS.join(', ')}.

Do not produce a navigation tag for normal informational questions. Do not expose the navigation mechanism to the visitor. Do not produce any other bracketed commands.

==================================================
20. RESPONSE QUALITY
==================================================

Before answering, internally determine: (1) what the visitor is actually asking; (2) whether the information is available in the portfolio; (3) whether it is a fact, interpretation, or unknown; (4) whether the question is about Roger personally or about one of his projects; (5) whether the answer needs to distinguish academic from professional experience; and (6) whether the visitor wants information or website navigation. Then provide the shortest accurate answer that satisfies the question.

==================================================
21. ABSOLUTE RULE
==================================================

Accuracy is more important than making Roger appear impressive. If information is missing, admit that it is missing. Never fabricate information to make Roger appear more experienced, more skilled, more successful, or more qualified than the portfolio supports.

==================================================
22. PORTFOLIO KNOWLEDGE
==================================================

The following PORTFOLIO KNOWLEDGE contains the actual information about Roger Nathanael. Use it as the authoritative factual source for answering questions.

===== BEGIN PORTFOLIO KNOWLEDGE =====

${knowledge}

===== END PORTFOLIO KNOWLEDGE =====`;
}

/* ------------------------------------------------------------
   Extract a safe navigation action from the model text.
   Parses a trailing [[NAV:target]] tag, validates against the
   allowlist, and strips it from the visible reply.
   ------------------------------------------------------------ */
function extractNavigation(text) {
  const actions = [];
  const re = /\[\[NAV:\s*([a-z]+)\s*\]\]/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const target = (m[1] || '').toLowerCase();
    if (NAV_TARGETS.indexOf(target) !== -1 && !actions.some(function (a) { return a.target === target; })) {
      actions.push({ type: 'navigate', target: target });
    }
  }
  const reply = text.replace(re, '').trim();
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

  // --- Parse body defensively ---
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

  // --- Validate + trim history (newest kept, within a char budget) ---
  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter(function (h) { return h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string'; })
    .slice(-MAX_HISTORY_TURNS);
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
    console.error('GEMINI_API_KEY is not configured.');
    return res.status(500).json({ success: false, error: 'The assistant is not configured yet.' });
  }

  // --- Build Gemini request ---
  const knowledge = buildKnowledge(PORTFOLIO);
  const systemInstruction = buildSystemInstruction(knowledge);

  const contents = [];
  trimmedHistory.forEach(function (h) {
    contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
  });
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: contents,
    generationConfig: {
      temperature: 0.4,
      // Enough for a complete answer, but small enough to keep replies fast.
      // (The MAX_TOKENS handler below still trims cleanly if it's ever hit.)
      maxOutputTokens: 800,
      topP: 0.9
    }
  };

  // --- Call Gemini's STREAMING endpoint (SSE) ---
  // We stream text chunks straight to the browser so the reply appears
  // token-by-token instead of after the whole answer is ready.
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, 25000);
  let geminiRes;
  try {
    geminiRes = await fetch(GEMINI_STREAM_URL, {
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

  if (!geminiRes.ok || !geminiRes.body) {
    clearTimeout(timeout);
    console.error('Gemini responded with status', geminiRes.status);
    const status = geminiRes.status === 429 ? 429 : 502;
    const msg = status === 429
      ? "I'm getting a lot of requests right now. Please try again shortly."
      : "I'm having trouble connecting right now. Please try again in a moment.";
    return res.status(status).json({ success: false, error: msg });
  }

  // Stream plain UTF-8 text to the client. (NAV tag stays in the text and is
  // parsed/stripped on the client, which already has the same allowlist.)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');

  const decoder = new TextDecoder();
  let buffer = '';
  let sentAny = false;

  try {
    const reader = geminiRes.body.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      // SSE frames are separated by blank lines; each data line is JSON.
      let sep;
      while ((sep = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, sep).trim();
        buffer = buffer.slice(sep + 1);
        if (!line || line.indexOf('data:') !== 0) continue;
        const jsonStr = line.slice(5).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const obj = JSON.parse(jsonStr);
          const cand = obj && obj.candidates && obj.candidates[0];
          const parts = cand && cand.content && cand.content.parts;
          if (Array.isArray(parts)) {
            const piece = parts.map(function (pt) { return pt.text || ''; }).join('');
            if (piece) { res.write(piece); sentAny = true; }
          }
        } catch (e) { /* ignore partial/non-JSON keep-alive lines */ }
      }
    }
  } catch (err) {
    console.error('Gemini stream error:', err && err.name);
  } finally {
    clearTimeout(timeout);
    // Only write a fallback line if the stream produced nothing at all.
    if (!sentAny) {
      res.write("I'm not able to answer that from Roger's portfolio right now. You can explore the sections or contact Roger directly.");
    }
    res.end();
  }
};
