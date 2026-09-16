/* ============================================================
   About — scrollytelling (GSAP + ScrollTrigger)
   ------------------------------------------------------------
   Pinned fullscreen stage; scrolling scrubs a timeline through:
     1) About Me  — blinking caret (idle), then title types out per letter,
                    sentences appear per line, KPIs pop, then fade out
     2) transition — blinking caret, then "From a curious kid..." types out
     3) "My Journey" heading rises (slightly) into place
     4) 3 chapters — photo FLIPS in/out, text words ROLL in/out
     5) Steve Jobs quote reveals word by word
   Fails safe to a static readable layout without GSAP / reduced motion.
   ============================================================ */
(function () {
  'use strict';

  // Typewriter host: text is set once, revealed by animating the host width
  // (overflow hidden). The caret sits inline right after it, so it TRAVELS
  // left-to-right with the text — like typing on a laptop.
  function setTypeText(host, text) {
    host.textContent = text;
    return host;
  }

  // Split text into per-word spans, each wrapped so it can "roll" from below.
  function buildRollWords(host, text) {
    host.textContent = '';
    var frag = document.createDocumentFragment();
    text.split(' ').forEach(function (w, i) {
      var wrap = document.createElement('span');
      wrap.className = 'roll-word';
      var inner = document.createElement('span');
      inner.className = 'roll-inner';
      inner.textContent = (i ? ' ' : '') + w;
      wrap.appendChild(inner);
      frag.appendChild(wrap);
    });
    host.appendChild(frag);
    return host.querySelectorAll('.roll-inner');
  }

  // Simple per-word reveal (quote).
  function buildWords(el, text) {
    el.textContent = '';
    text.split(' ').forEach(function (w, i) {
      var span = document.createElement('span');
      span.className = 'qword';
      span.textContent = (i ? ' ' : '') + w;
      el.appendChild(span);
    });
    return el.querySelectorAll('.qword');
  }

  function initStatic(stage) {
    stage.classList.add('about-static');
    var title = stage.querySelector('#aboutTitle .tw-text');
    if (title) title.textContent = 'Bridging business, technology & people';
    var trans = stage.querySelector('#transitionLine .tw-text');
    if (trans) trans.textContent = 'From a curious kid to a future technologist.';
    var q = stage.querySelector('#quoteEl');
    if (q && q.dataset.quote) q.textContent = q.dataset.quote;
  }

  function init() {
    var stage = document.getElementById('about-stage');
    var fixed = document.getElementById('stageFixed');
    if (!stage || !fixed) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined' || reduce || small) {
      initStatic(stage);
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var sAbout = stage.querySelector('.scene-about');
    var aboutTitleHost = stage.querySelector('#aboutTitle .tw-text');
    var aboutCaret = stage.querySelector('#aboutTitle .tw-caret');
    var aboutLines = gsap.utils.toArray('.scene-about .about-line');
    var kpis = gsap.utils.toArray('.scene-about .kpi');

    var sTrans = stage.querySelector('.scene-transition');
    var transHost = stage.querySelector('#transitionLine .tw-text');
    var transCaret = stage.querySelector('#transitionLine .tw-caret');

    var sHead = stage.querySelector('.scene-journey-head');
    var sHeadInner = sHead ? sHead.querySelector('.scene-inner') : null;
    var chapters = gsap.utils.toArray('.scene-chapter');
    var sQuote = stage.querySelector('.scene-quote');
    var quoteEl = stage.querySelector('#quoteEl');
    var quoteCite = stage.querySelector('.quote-cite');

    // Typewriter lines (width-reveal so the caret follows the text)
    var titleText = (aboutTitleHost && aboutTitleHost.closest('[data-text]')) ? aboutTitleHost.closest('[data-text]').dataset.text : 'Bridging business, technology & people';
    setTypeText(aboutTitleHost, titleText);
    setTypeText(transHost, 'From a curious kid to a future technologist.');
    var quoteWords = buildWords(quoteEl, quoteEl.dataset.quote || '');

    // Measure full text width so we can reveal 0 -> full.
    function fullWidth(host) {
      var prev = host.style.width;
      host.style.width = 'auto';
      var w = host.scrollWidth;
      host.style.width = prev;
      return w;
    }

    // Per-chapter split: title + paragraph roll word-by-word; the year badge
    // rises as a whole (a styled pill would clip if split per word); photo flips.
    var chapterData = chapters.map(function (c) {
      var photo = c.querySelector('.jchapter-photo');
      var flip = c.querySelector('.jphoto-flip');
      var yearEl = c.querySelector('.jchapter-year');
      var h3 = c.querySelector('.jchapter-body h3');
      var pEl = c.querySelector('.jchapter-body p');
      return {
        el: c, photo: photo, flip: flip, year: yearEl,
        titleRolls: buildRollWords(h3, h3.textContent),
        pRolls: buildRollWords(pEl, pEl.textContent)
      };
    });

    // Initial states
    gsap.set([sTrans, sHead].concat(chapters).concat([sQuote]), { autoAlpha: 0 });
    gsap.set(sAbout, { autoAlpha: 1 });
    // typewriter hosts start at width 0 (nothing typed yet)
    gsap.set([aboutTitleHost, transHost], { width: 0 });
    gsap.set(aboutLines, { autoAlpha: 0, y: 24 });
    gsap.set(kpis, { autoAlpha: 0, y: 20, scale: 0.9 });
    gsap.set(quoteWords, { autoAlpha: 0 });
    gsap.set(quoteCite, { autoAlpha: 0 });
    chapterData.forEach(function (d) {
      gsap.set(d.flip, { rotationY: -90, autoAlpha: 0 });
      gsap.set(d.year, { autoAlpha: 0, y: 20 });
      gsap.set(gsap.utils.toArray(d.titleRolls).concat(gsap.utils.toArray(d.pRolls)), { yPercent: 110 });
    });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: '+=7200',
        pin: '#stageFixed',
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // --- Scene 1: About Me ---
    // The caret blinks (idle), then the title "types" by revealing width so
    // the caret travels left-to-right along the text.
    tl.to({}, { duration: 0.6 })                                    // idle beat (caret blinks)
      .to(aboutTitleHost, { width: function () { return fullWidth(aboutTitleHost); }, duration: 1.2, ease: 'steps(28)' })
      .to(aboutLines, { autoAlpha: 1, y: 0, duration: 1, stagger: 1.1 }, '>-0.1')
      .to(kpis, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.3 }, '>-0.2')
      .to(aboutCaret, { autoAlpha: 0, duration: 0.3 }, '<')          // hide caret once done
      .to({}, { duration: 0.8 })
      .to(sAbout, { autoAlpha: 0, y: -40, duration: 1 });

    // --- Scene 2: transition typing (idle caret then type) ---
    tl.set(sTrans, { autoAlpha: 1 })
      .set(transCaret, { autoAlpha: 1 })
      .to({}, { duration: 0.6 })                                    // idle beat (caret blinks)
      .to(transHost, { width: function () { return fullWidth(transHost); }, duration: 1.1, ease: 'steps(30)' })
      .to({}, { duration: 0.6 })
      .to(sTrans, { autoAlpha: 0, duration: 0.6 });

    // --- Scene 3: "My Journey" appears centred, then RISES to dock as a header
    // at the top and STAYS visible while the chapters play below it. ---
    // Move to the top: shift the inner up by ~38% of the viewport and shrink it.
    tl.fromTo(sHead, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8 })
      .to({}, { duration: 0.5 })                                                                // hold centred
      .to(sHeadInner, { y: '-38vh', scale: 0.78, duration: 0.9, ease: 'power2.inOut' });        // dock to top (stays)

    // --- Scenes 4-6: chapters (photo flip, words roll). The header stays put;
    // each chapter fades fully before the next so only one chapter shows. ---
    chapterData.forEach(function (d) {
      var rolls = gsap.utils.toArray(d.titleRolls).concat(gsap.utils.toArray(d.pRolls));
      tl.set(d.el, { autoAlpha: 1 })
        .to(d.flip, { rotationY: 0, autoAlpha: 1, duration: 0.7, ease: 'power2.out' })          // flip photo in
        .to(d.year, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '<0.1')          // year rises in
        .to(rolls, { yPercent: 0, duration: 0.6, stagger: 0.03, ease: 'power3.out' }, '<0.05')  // words roll up in
        .to({}, { duration: 0.9 })                                                              // hold to read
        .to(d.flip, { rotationY: 90, autoAlpha: 0, duration: 0.6, ease: 'power2.in' })          // flip photo out
        .to(d.year, { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, '<')            // year leaves
        .to(rolls, { yPercent: -110, duration: 0.5, stagger: 0.02, ease: 'power3.in' }, '<')    // words roll out
        .set(d.el, { autoAlpha: 0 });
    });

    // Header leaves before the quote.
    tl.to(sHead, { autoAlpha: 0, duration: 0.5 });

    // --- Scene 7: quote word by word ---
    tl.set(sQuote, { autoAlpha: 1 })
      .to(quoteWords, { autoAlpha: 1, duration: 0.4, stagger: 0.18 })
      .to(quoteCite, { autoAlpha: 1, duration: 0.6 }, '>-0.2')
      .to({}, { duration: 1 });

    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
