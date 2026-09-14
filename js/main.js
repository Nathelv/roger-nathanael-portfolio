/* ============================================================
   Shared script for all portfolio pages (multi-page, SilverPalace-style)
   - Preloader with animated letters
   - Active nav link + header page-status
   - Skills grid, mobile menu, footer year
   - SCROLL-BOUNDARY page switching: when the user keeps scrolling
     past the bottom (or top) of a page, an animated transition
     overlay plays and the browser navigates to the next/prev page.
   - ENTER transition when a page loads (so it feels connected).
   ============================================================ */

const PAGES = [
  { file: 'index.html',      name: 'Home',       no: '01' },
  { file: 'about.html',      name: 'About',      no: '02' },
  { file: 'skills.html',     name: 'Skills',     no: '03' },
  { file: 'projects.html',   name: 'Projects',   no: '04' },
  { file: 'experience.html', name: 'Experience', no: '05' },
  { file: 'education.html',  name: 'Education',   no: '06' },
  { file: 'research.html',   name: 'Research',   no: '07' },
  { file: 'contact.html',    name: 'Contact',    no: '08' },
];

function currentFile() {
  let path = window.location.pathname.split('/').pop().toLowerCase();
  if (!path) path = 'index.html';
  return path;
}
function currentIndex() {
  const f = currentFile();
  const i = PAGES.findIndex(p => p.file === f);
  return i === -1 ? 0 : i;
}
// Deck pages take part in scroll-snap navigation; detail pages (project-*.html) do not.
function isDeckPage() {
  return PAGES.some(p => p.file === currentFile());
}

/* ---------- Preloader ----------
   Runs ONCE per session. When arriving via an in-site page switch we skip
   the preloader entirely and let playEnterTransition() control when the
   content is revealed (so the overlay can cover the screen first = no flash). */
function initPreloader() {
  const pre = document.getElementById('preloader');
  const arrivedViaTransition = sessionStorage.getItem('rn-transition');
  const alreadyLoaded = sessionStorage.getItem('rn-loaded');

  if (alreadyLoaded || arrivedViaTransition) {
    if (pre) pre.remove();
    document.body.classList.remove('loading');
    // If a transition is playing, playEnterTransition() will add 'ready'
    // at the right moment. Otherwise reveal immediately.
    if (!arrivedViaTransition) {
      requestAnimationFrame(() => document.body.classList.add('ready'));
    }
    return;
  }

  const logo = document.getElementById('preLogo');
  if (logo) logo.innerHTML = 'ROGER'.split('').map((c, i) => `<span style="animation-delay:${i * 0.09}s">${c}</span>`).join('');

  let started = false;
  function reveal() {
    if (started) return; started = true;
    setTimeout(() => {
      if (pre) pre.classList.add('done');
      document.body.classList.remove('loading');
      sessionStorage.setItem('rn-loaded', '1'); // mark: don't show again this session
      requestAnimationFrame(() => document.body.classList.add('ready'));
    }, 1400);
  }
  window.addEventListener('load', reveal);
  setTimeout(reveal, 2300);
}

/* ---------- Active nav + header status ---------- */
function initNavState() {
  const file = currentFile();
  const page = PAGES.find(p => p.file === file) || PAGES[0];
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
    a.classList.toggle('active', href === file);
  });
  const nameEl = document.getElementById('currentPageName');
  const noEl = document.getElementById('currentPageNo');
  if (nameEl) nameEl.textContent = page.name;
  if (noEl) noEl.textContent = page.no;
}

/* ---------- Skills grid ---------- */
function initSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  // Source of truth: PORTFOLIO.skills (js/portfolio-data.js). Fall back to
  // empty arrays if the data file failed to load, so the page never breaks.
  const skills = (window.PORTFOLIO && window.PORTFOLIO.skills) || { categories: [], tools: [] };
  const categories = skills.categories || [];
  const dot = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>';

  grid.innerHTML = categories.map((c, i) => `
    <div class="skill-cat reveal up s${(i % 4) + 1}">
      <div class="skill-cat-head"><span class="skill-cat-ico">${c.icon}</span><h3>${c.title}</h3></div>
      <ul>${c.items.map(it => `<li>${dot}<span>${it}</span></li>`).join('')}</ul>
    </div>
  `).join('');

  // Tools row (only tools actually used in projects)
  const tools = document.getElementById('toolsRow');
  if (tools) {
    tools.innerHTML = (skills.tools || []).map(t => `<span class="tool">${t}</span>`).join('');
  }
}

/* ---------- Mobile menu ---------- */
function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

function initYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ---------- Build transition overlay + edge hint (injected once) ---------- */
function buildTransitionDom() {
  if (!document.getElementById('transition')) {
    const t = document.createElement('div');
    t.id = 'transition';
    t.innerHTML = `
      <div class="panel p1"></div>
      <div class="panel p2"></div>
      <div class="panel p3"></div>
      <div class="cols"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="t-content">
        <div class="t-no" id="tNo"></div>
        <div class="t-name" id="tName"></div>
        <div class="t-line"></div>
      </div>`;
    document.body.appendChild(t);
  }
  if (!document.getElementById('edge-hint')) {
    const h = document.createElement('div');
    h.id = 'edge-hint';
    h.innerHTML = `<span id="edgeLabel"></span><span class="bar"><i id="edgeFill"></i></span>`;
    document.body.appendChild(h);
  }
}

/* ---------- Transition style variations ----------
   Each navigation picks a different style so page changes aren't monotone.
   The chosen style is stored so the incoming page replays the SAME style,
   making exit + enter feel like one continuous motion. */
const TRANSITIONS = ['tr-curtain', 'tr-slide', 'tr-iris', 'tr-split', 'tr-diagonal', 'tr-blocks'];

function pickTransition(targetIndex) {
  // Deterministic-but-varied: base it on the destination page so each
  // route has its own signature move, and rotate direction adds variety.
  return TRANSITIONS[targetIndex % TRANSITIONS.length];
}
function clearTransitionClasses() {
  TRANSITIONS.forEach(c => document.body.classList.remove(c));
}

/* ---------- ENTER transition on load ----------
   The overlay starts fully covering the screen, then retracts to reveal the
   new page. We hold the content (reveal animations) until the overlay begins
   retracting so there is no flash of un-transitioned content. */
function playEnterTransition() {
  const via = sessionStorage.getItem('rn-transition');
  if (!via) return false;
  sessionStorage.removeItem('rn-transition');

  const mode = sessionStorage.getItem('rn-tr-mode') || 'tr-curtain';
  sessionStorage.removeItem('rn-tr-mode');

  const page = PAGES[currentIndex()];
  const tNo = document.getElementById('tNo');
  const tName = document.getElementById('tName');
  if (tNo) tNo.textContent = page.no;
  if (tName) tName.textContent = page.name;

  // Apply mode + entering in the SAME tick. The entering rules define the
  // pre-animation state as "fully covered", so the browser paints the covered
  // overlay on the first frame (no flicker), then retracts to reveal.
  clearTransitionClasses();
  document.body.classList.add(mode, 'entering', 'ready');

  // Cleanup once the retract finishes.
  setTimeout(() => {
    document.body.classList.remove('entering');
    clearTransitionClasses();
  }, 1000);
  return true;
}

/* ---------- EXIT transition then navigate ---------- */
let navigating = false;
function goToPage(targetIndex) {
  if (navigating) return;
  if (targetIndex < 0 || targetIndex >= PAGES.length) return;
  navigating = true;

  const target = PAGES[targetIndex];
  const tNo = document.getElementById('tNo');
  const tName = document.getElementById('tName');
  if (tNo) tNo.textContent = target.no;
  if (tName) tName.textContent = target.name;

  const mode = pickTransition(targetIndex);
  clearTransitionClasses();
  document.body.classList.add(mode, 'leaving');
  sessionStorage.setItem('rn-transition', '1');
  sessionStorage.setItem('rn-tr-mode', mode); // enter page replays same style

  // Wait until the overlay fully covers the screen, then navigate.
  // (panel anim 0.85s + max stagger 0.16s ≈ 1.0s)
  setTimeout(() => { window.location.href = target.file; }, 950);
}

/* ---------- Scroll-boundary detection ---------- */
function initBoundaryNav() {
  if (!isDeckPage()) return; // detail pages scroll normally, no page switching
  const idx = currentIndex();
  const hint = document.getElementById('edge-hint');
  const edgeLabel = document.getElementById('edgeLabel');
  const edgeFill = document.getElementById('edgeFill');

  const THRESHOLD = 3;    // number of scroll "pushes" needed to change page
  let charge = 0;         // counts discrete pushes (0..THRESHOLD)
  let dir = 0;            // 1 = down/next, -1 = up/prev
  let resetTimer = null;
  let cooldown = false;   // prevents one continuous wheel spin from counting many times

  const nextIdx = idx + 1;
  const prevIdx = idx - 1;

  function atBottom() {
    return (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 2);
  }
  function atTop() {
    return window.scrollY <= 1;
  }

  function showHint(direction) {
    if (!hint) return;
    hint.classList.remove('top', 'bottom');
    if (direction === 1) {
      if (nextIdx >= PAGES.length) return;
      hint.classList.add('bottom');
      edgeLabel.textContent = 'Keep scrolling for ' + PAGES[nextIdx].name;
    } else {
      if (prevIdx < 0) return;
      hint.classList.add('top');
      edgeLabel.textContent = 'Keep scrolling for ' + PAGES[prevIdx].name;
    }
    hint.classList.add('show');
  }
  function hideHint() { if (hint) hint.classList.remove('show'); }
  function setFill(p) { if (edgeFill) edgeFill.style.width = Math.min(100, p * 100) + '%'; }

  // Register ONE discrete push in a direction.
  function push(direction) {
    if (navigating || document.body.classList.contains('loading')) return;

    // Only count when actually pressing against the correct boundary
    if (direction === 1 && (!atBottom() || nextIdx >= PAGES.length)) { resetCharge(); return; }
    if (direction === -1 && (!atTop() || prevIdx < 0)) { resetCharge(); return; }

    if (dir !== direction) { charge = 0; dir = direction; }
    charge += 1;
    showHint(direction);
    setFill(charge / THRESHOLD);

    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetCharge, 900); // pushes must come reasonably close together

    if (charge >= THRESHOLD) {
      hideHint();
      goToPage(direction === 1 ? nextIdx : prevIdx);
    }
  }
  function resetCharge() { charge = 0; dir = 0; setFill(0); hideHint(); }

  // Wheel (desktop): a continuous spin fires many events, so we debounce
  // each "push" with a short cooldown = one intentional scroll = one push.
  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 4) return;
    if (cooldown) return;
    cooldown = true;
    setTimeout(() => { cooldown = false; }, 220);
    push(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  // Touch (mobile): one deliberate swipe past a boundary = one push.
  let touchY = null;
  let swipeAccum = 0;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; swipeAccum = 0; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    const y = e.touches[0].clientY;
    const dy = touchY - y; // positive = scrolling down
    touchY = y;
    swipeAccum += dy;
    if (swipeAccum > 70) { swipeAccum = 0; push(1); }
    else if (swipeAccum < -70) { swipeAccum = 0; push(-1); }
  }, { passive: true });
  window.addEventListener('touchend', () => { touchY = null; swipeAccum = 0; }, { passive: true });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'PageDown'].includes(e.key) && atBottom()) { e.preventDefault(); goToPage(nextIdx); }
    if (['ArrowUp', 'PageUp'].includes(e.key) && atTop()) { e.preventDefault(); goToPage(prevIdx); }
  });
}

/* ---------- Pager buttons use the same animated transition ---------- */
function initPagerLinks() {
  document.querySelectorAll('.nav-links a, .logo').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      const targetIndex = PAGES.findIndex(p => p.file === href);
      if (targetIndex === -1) return; // external link (LinkedIn, mailto, pdf) -> default
      e.preventDefault();
      goToPage(targetIndex);
    });
  });
}

/* ---------- Idle scroll hint ----------
   On pages other than Home (which already shows a permanent hint), inject a
   "SCROLL TO CONTINUE" mouse indicator that appears only after the user has
   been idle for a few seconds, and disappears as soon as they scroll again.
   Skipped on the last page since there's nowhere further to scroll. */
function initIdleScrollHint() {
  if (!isDeckPage()) return; // no scroll-hint on detail pages
  const idx = currentIndex();
  const isHome = idx === 0;
  const isLast = idx >= PAGES.length - 1;
  if (isHome || isLast) return; // Home has a static one; last page has no next

  const hint = document.createElement('div');
  hint.className = 'scroll-hint idle';
  hint.innerHTML = '<div class="mouse"></div>SCROLL TO CONTINUE';
  document.body.appendChild(hint);

  const IDLE_MS = 2500;
  let idleTimer = null;

  function scheduleShow() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!navigating) hint.classList.add('show');
    }, IDLE_MS);
  }
  function onActivity() {
    hint.classList.remove('show');
    scheduleShow();
  }

  // Tied to scroll-intent only (not mouse move), so it reflects "not scrolling".
  ['wheel', 'touchmove', 'scroll', 'keydown'].forEach(ev =>
    window.addEventListener(ev, onActivity, { passive: true })
  );

  scheduleShow(); // start the idle countdown on load
}

/* ---------- Global moving decor on every section ----------
   Home already has a rich .hero-decor; every other section gets a lighter
   .page-decor layer so no page feels static. */
function initPageDecor() {
  const decorHtml = `
      <span class="orb orb-a"></span>
      <span class="orb orb-b"></span>
      <span class="ring ring-x"></span>
      <span class="particle"></span>
      <span class="particle"></span>
      <span class="particle"></span>`;

  // Deck sections (not Home, which already has hero-decor)
  document.querySelectorAll('main .section').forEach(section => {
    if (section.id === 'home') return;
    if (section.querySelector('.page-decor')) return;
    const decor = document.createElement('div');
    decor.className = 'page-decor';
    decor.setAttribute('aria-hidden', 'true');
    decor.innerHTML = decorHtml;
    section.prepend(decor);
  });

  // Detail pages (project-*.html): add a fixed decor layer behind the content
  const detail = document.querySelector('.detail-main');
  if (detail && !document.querySelector('.page-decor-fixed')) {
    const decor = document.createElement('div');
    decor.className = 'page-decor page-decor-fixed';
    decor.setAttribute('aria-hidden', 'true');
    decor.innerHTML = decorHtml;
    document.body.appendChild(decor);
  }
}

/* ---------- "AI suddenly appears" element (Home + Contact) ----------
   It can be minimized to a floating button so it never blocks the content,
   and it helps the user navigate the site (rule-based, no backend). */
function initChatbot() {
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V4M9 13h.01M15 13h.01M8 3h8"/></svg>';
  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>';

  // --- Floating launcher button ---
  const fab = document.createElement('button');
  fab.className = 'chat-fab has-unread';
  fab.setAttribute('aria-label', 'Open chat assistant');
  fab.innerHTML = `<span class="fab-ping"></span>${ICON}<span class="fab-badge">1</span>`;
  document.body.appendChild(fab);

  // --- Chat panel ---
  const bot = document.createElement('div');
  bot.className = 'chatbot';
  bot.innerHTML = `
    <div class="chat-head">
      <div class="chat-ava">${ICON}</div>
      <div class="chat-meta">
        <div class="chat-title"><span class="live"></span> Roger's AI Assistant</div>
        <div class="chat-sub">Ask about projects, skills & more</div>
      </div>
      <button class="chat-min" aria-label="Minimize"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg></button>
    </div>
    <div class="chat-body" id="chatBody"></div>
    <div class="chat-suggest" id="chatSuggest"></div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatInput" placeholder="Ask me anything…" autocomplete="off" />
      <button class="chat-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
    </form>`;
  document.body.appendChild(bot);

  const body = bot.querySelector('#chatBody');
  const suggestRow = bot.querySelector('#chatSuggest');
  const form = bot.querySelector('#chatForm');
  const input = bot.querySelector('#chatInput');

  // --- Navigation helper: uses the animated transition for deck pages ---
  function navTo(file) {
    const i = PAGES.findIndex(p => p.file === file);
    if (i !== -1 && typeof goToPage === 'function') { goToPage(i); }
    else { window.location.href = file; }
  }
  function openExternal(href) { window.open(href, '_blank', 'noopener'); }

  // Allowlisted section -> file map, derived from the single source of truth.
  // Used to safely translate AI navigation targets into the existing navTo().
  const SECTION_FILE = (function () {
    const map = {};
    const secs = (window.PORTFOLIO && window.PORTFOLIO.sections) || {};
    Object.keys(secs).forEach(k => { if (secs[k] && secs[k].file) map[k] = secs[k].file; });
    // Hard fallback so navigation still works even if data failed to load.
    const fallback = { home: 'index.html', about: 'about.html', skills: 'skills.html', projects: 'projects.html', experience: 'experience.html', education: 'education.html', research: 'research.html', contact: 'contact.html' };
    Object.keys(fallback).forEach(k => { if (!map[k]) map[k] = fallback[k]; });
    return map;
  })();
  const SECTION_LABEL = { home: 'Home', about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', education: 'Education', research: 'Research', contact: 'Contact' };

  // Turn AI actions ([{type:'navigate', target:'projects'}]) into safe buttons.
  function mapAiActions(actions) {
    if (!Array.isArray(actions)) return [];
    const out = [];
    actions.forEach(a => {
      if (a && a.type === 'navigate' && typeof a.target === 'string') {
        const target = a.target.toLowerCase();
        const file = SECTION_FILE[target];
        if (file) out.push({ label: 'Go to ' + (SECTION_LABEL[target] || target), run: () => navTo(file) });
      }
    });
    return out;
  }

  // --- Message rendering ---
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function addUser(text) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.textContent = text;
    body.appendChild(el); scrollDown();
  }
  function addBot(text, actions) {
    const el = document.createElement('div');
    el.className = 'msg bot';
    const span = document.createElement('span');
    el.appendChild(span);
    body.appendChild(el); scrollDown();
    // typing effect
    let i = 0;
    const caret = document.createElement('span'); caret.className = 'caret';
    el.appendChild(caret);
    (function type() {
      span.textContent = text.slice(0, i);
      if (i++ <= text.length) { scrollDown(); setTimeout(type, 14); }
      else { caret.remove(); if (actions && actions.length) renderActions(el, actions); scrollDown(); }
    })();
  }
  function renderActions(el, actions) {
    const wrap = document.createElement('div');
    wrap.className = 'msg-actions';
    actions.forEach(a => {
      const b = document.createElement('button');
      b.className = 'chip-btn';
      b.innerHTML = `${a.label} ${ARROW}`;
      b.addEventListener('click', a.run);
      wrap.appendChild(b);
    });
    el.appendChild(wrap);
  }
  function showTyping() {
    const t = document.createElement('div');
    t.className = 'typing'; t.id = 'typingDots';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t); scrollDown();
    return t;
  }

  // --- Knowledge base (single source of truth) ---
  const KB = window.PORTFOLIO || {};

  // --- The rule-based "brain": map intent -> reply + navigation actions ---
  // Answers are derived from the PORTFOLIO knowledge base so nothing is
  // duplicated or invented. Navigation reuses navTo()/goToPage().
  function respond(q) {
    const t = q.toLowerCase();
    const act = (label, fn) => ({ label, run: fn });

    if (/(project|portfolio|work|built|sawit|iot|healthy|aqquas|churn|kompas)/.test(t)) {
      const projs = KB.projects || [];
      const names = projs.map(p => p.achievement ? `${p.name} (${p.achievement})` : p.name).join(', ');
      const text = projs.length
        ? `I've got ${projs.length} featured projects — ${names}. Want to see them?`
        : "Roger's featured projects are on the Projects page.";
      const actions = [ act('View Projects', () => navTo('projects.html')) ];
      if (projs[0] && projs[0].page) actions.push(act('Open ' + projs[0].name, () => navTo(projs[0].page)));
      return { text: text, actions: actions };
    }
    if (/(skill|tech|stack|tool|figma|php|python|mysql)/.test(t)) {
      const cats = (KB.skills && KB.skills.categories) || [];
      const tools = (KB.skills && KB.skills.tools) || [];
      const catNames = cats.map(c => c.title).join(', ');
      const text = cats.length
        ? `Roger's skills span ${catNames}${tools.length ? ` — plus tools like ${tools.join(', ')}.` : '.'}`
        : "Roger's skills are listed on the Skills page.";
      return { text: text, actions: [ act('See Skills', () => navTo('skills.html')) ] };
    }
    if (/(about|who|background|story|journey)/.test(t)) {
      const p = KB.profile || {};
      const edu = (KB.education && KB.education[0]) || {};
      const text = (p.name && edu.institution)
        ? `${p.name} is a ${p.title} at ${edu.institution}${edu.gpa ? ` (GPA ${edu.gpa})` : ''} who bridges business, technology, and user-centered solutions.`
        : "Roger bridges business, technology, and user-centered solutions.";
      return { text: text, actions: [ act('Read About', () => navTo('about.html')) ] };
    }
    if (/(experience|volunteer|work experience|gbi|multimedia)/.test(t)) {
      const exp = (KB.experience && KB.experience[0]) || null;
      const text = exp
        ? `His experience includes being a ${exp.role} at ${exp.organization} (${exp.period}).`
        : "Roger's experience is listed on the Experience page.";
      return { text: text, actions: [ act('See Experience', () => navTo('experience.html')) ] };
    }
    if (/(education|study|university|binus|gpa|school|course)/.test(t)) {
      const edu = (KB.education && KB.education[0]) || {};
      const course = (KB.coursework || []).slice(0, 3).join(', ');
      const text = edu.institution
        ? `He studies ${edu.degree} at ${edu.institution}${edu.gpa ? ` (GPA ${edu.gpa})` : ''}${course ? `, with coursework in ${course}, and more.` : '.'}`
        : "Roger's education is on the Education page.";
      return { text: text, actions: [ act('See Education', () => navTo('education.html')) ] };
    }
    if (/(research|ai literacy|academic|achievement|award|1st|first place)/.test(t)) {
      const res = (KB.research && KB.research[0]) || null;
      const ach = (KB.achievements && KB.achievements[0]) || null;
      let text = '';
      if (res) text += `There's a research exploration on ${res.title}.`;
      if (ach) text += `${text ? ' ' : ''}He also earned ${ach.title} for the ${ach.project}.`;
      if (!text) text = "Roger's research and achievements are on the Research page.";
      return { text: text, actions: [ act('See Research', () => navTo('research.html')) ] };
    }
    if (/(cv|resume|download)/.test(t)) {
      const cv = (KB.contact && KB.contact.cv) || 'assets/Roger-Nathanael-CV.pdf';
      return { text: "You can download Roger's CV as a PDF.",
        actions: [ act('Download CV', () => openExternal(cv)) ] };
    }
    if (/(contact|email|reach|hire|intern|linkedin|connect)/.test(t)) {
      const c = KB.contact || {};
      return { text: "Reach out anytime — email or LinkedIn both work. Roger is open to internships.",
        actions: [ act('Go to Contact', () => navTo('contact.html')),
                   act('Email', () => openExternal('mailto:' + (c.email || 'naelnathel@gmail.com') + '?subject=Hello%20Roger')),
                   act('LinkedIn', () => openExternal(c.linkedin || 'https://www.linkedin.com/in/roger-nathanael')) ] };
    }
    if (/(home|start|top|beginning)/.test(t)) {
      return { text: "Sure — taking you home.", actions: [ act('Go Home', () => navTo('index.html')) ] };
    }
    if (/(hi|hello|hey|halo|help|what can|menu)/.test(t)) {
      return { text: "Hi! I'm Roger's assistant. I can guide you around the site — try asking about Projects, Skills, About, Experience, Education, Research, CV, or Contact." };
    }
    return { text: "I can help you navigate. Try: “show projects”, “skills”, “download CV”, or “contact”.",
      actions: [ act('Projects', () => navTo('projects.html')), act('Contact', () => navTo('contact.html')) ] };
  }

  // --- Conversation state ---
  const history = [];              // {role:'user'|'assistant', content}
  const MAX_HISTORY = 8;           // keep small to limit tokens
  let busy = false;                // prevents concurrent/duplicate sends
  const sendBtn = form ? form.querySelector('.chat-send') : null;

  function pushHistory(role, content) {
    history.push({ role: role, content: content });
    while (history.length > MAX_HISTORY) history.shift();
  }
  function setBusy(state) {
    busy = state;
    if (input) input.disabled = state;
    if (sendBtn) sendBtn.disabled = state;
    bot.classList.toggle('is-busy', state);
  }

  // Add a bot message that may include AI navigation actions.
  function addBotWithActions(text, aiActions) {
    addBot(text, mapAiActions(aiActions));
  }

  // Main entry: try the AI backend; gracefully fall back to the rule-based
  // engine on network/API failure so the assistant never hard-fails.
  async function handle(q) {
    if (busy) return;
    addUser(q);
    pushHistory('user', q);
    setBusy(true);
    const typing = showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: history.slice(0, -1) })
      });

      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }

      typing.remove();

      if (res.ok && data && data.success && typeof data.reply === 'string') {
        addBotWithActions(data.reply, data.actions);
        pushHistory('assistant', data.reply);
      } else if (data && data.error) {
        addBot(data.error);
      } else {
        addBot("I'm having trouble connecting right now. Please try again in a moment.");
      }
    } catch (err) {
      // Network failure / offline / API not deployed: use local fallback so
      // the chatbot still helps with navigation.
      typing.remove();
      const r = respond(q);
      addBot(r.text, r.actions);
      pushHistory('assistant', r.text);
    } finally {
      setBusy(false);
      if (input && document.body.classList.contains('chat-open')) input.focus();
    }
  }

  // --- Quick suggestion chips (premium, useful prompts) ---
  const suggestions = [
    'Tell me about Roger',
    'What projects has he worked on?',
    'What are his skills?',
    'Tell me about the IoT project',
    'How can I contact him?'
  ];
  suggestions.forEach(s => {
    const b = document.createElement('button');
    b.className = 'chip-btn'; b.type = 'button'; b.textContent = s;
    b.addEventListener('click', () => { if (!busy) handle(s); });
    suggestRow.appendChild(b);
  });

  // --- Input handling ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    handle(q);
  });

  // --- Open / minimize ---
  let greeted = false;
  function openChat() {
    document.body.classList.add('chat-open');
    fab.classList.remove('has-unread');
    if (!greeted) {
      greeted = true;
      setTimeout(() => addBot("👋 Hi! I'm Roger's assistant. I can help you find your way around — ask me about projects, skills, or how to get in touch."), 250);
    }
    setTimeout(() => input.focus(), 350);
  }
  function minimizeChat() { document.body.classList.remove('chat-open'); }

  fab.addEventListener('click', openChat);
  bot.querySelector('.chat-min').addEventListener('click', minimizeChat);

  // Gentle nudge: pulse the FAB badge shortly after load (does not block content)
  setTimeout(() => { if (!document.body.classList.contains('chat-open')) fab.classList.add('has-unread'); }, 3200);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  buildTransitionDom();
  initSkills();     // build content before it may be revealed
  playEnterTransition();  // must run before preloader so it owns the reveal
  initPreloader();
  initNavState();
  initMenu();
  initYear();
  initBoundaryNav();
  initPagerLinks();
  initIdleScrollHint();
  initPageDecor();
  initChatbot();
});
