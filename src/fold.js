/* My Day's readout, folding with the scroll: once the Nourish page has
 * scrolled, the week and the four bars give way to one row of pills, at
 * the speed of the scroll, the card's bottom edge held still. The long
 * account of how, and of the two rules that keep it from shaking, is with
 * the code below.
 *
 * A part of app.js in a file of its own. app.js calls HiveParts.fold(app)
 * once, as it starts, handing over the one thing of its own it reads, the
 * app's state S, and keeps what it gives back under the same names for the
 * Nourish drawing and the scroll and resize handlers there (mFoldForget,
 * mReduced, syncShrunk, onScrollShrink, onResizeFold). Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).fold = function (app) {
  'use strict';

  // what it reads of the app's
  var S = app.S;

  function $(id) { return document.getElementById(id); }

  /* ---- My Day's readout, folding with the scroll ----

     Once the page has scrolled, the week and the four bars give way to one
     row of pills, so the card stops eating a third of a phone while you are
     down among the plates.

     It used to be a switch. At a threshold the open half was set to
     display:none and the pills appeared in its place — which is a hard
     on/off that nothing can animate, and which needed a second threshold
     lower down so that the fold and the unfold could not chase each other
     across the same line.

     It is a fraction now. `p` is how far shut the card is, taken straight
     from the scroll position: 0 at the top, 1 once you have scrolled one
     readout's worth. The card closes under the finger at the speed of the
     scroll, and since p is a pure function of scrollY — the same y always
     gives the same card — there is no threshold left anywhere for the two
     states to flap across.

     The distance is the height the fold takes out, which is what makes the
     card's bottom edge sit still: for every pixel you scroll the card loses
     a pixel, so the first plate stays glued to the underside of it the
     whole way down instead of sliding out from behind it.

     Two things make it safe to do this on every frame.

     THE PAGE MUST NOT MOVE. The height the fold takes out of the card goes
     into the card's bottom margin, so everything below keeps its page
     position and nothing has to be compensated for. Margin is the right
     place for it because margin has no background and takes no taps: the
     plates scroll up through that gap and can be read and pressed there.

     AND NOTHING IS MEASURED DURING A FRAME. The geometry is taken once,
     while the card is open and still, and every frame after that is four
     writes and no reads. Chromium's scroll anchoring answers a height
     change above the anchor by moving the scroll position; a measurement
     taken between two writes sees that compensation and reports a lie,
     which is how the old fold ended up chasing its own tail. Nothing is
     read, so there is nothing to be lied to about. */
  var foldRaf = 0;
  var foldGeo = null;   // the two heights; thrown away when the card is rebuilt
  var foldGap = -1;     // the room under the card; a fact about the stylesheet

  function mFoldForget() { foldGeo = null; }

  /* Someone who has asked for less motion gets the switch back. The fold
     still happens — it is what makes the card small — but it happens all at
     once, with the two thresholds that keep an instant fold from chasing
     itself. */
  function mReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mFoldGeo() {
    if (foldGeo) return foldGeo;
    var fold = $('macroFold'), pills = $('macroPills');
    if (!fold || !pills) return null;
    /* Measured at the fold's NATURAL height, fractions and all. scrollHeight
       and offsetHeight are whole numbers, and a box whose real height is
       174.5 measures as 175 — half a pixel the lock never gives back, which
       is a pixel of page appearing and disappearing under the finger in the
       middle of a fold. So ask the layout, not the content.
     *
       If the box happens to be clipped right now, uncover it for the reading
       and put it straight back. Nothing is painted in between: this is one
       synchronous burst inside a single task, and it happens once per
       rebuild rather than once per frame. */
    var was = fold.style.height;
    if (was) fold.style.height = '';
    var open = fold.getBoundingClientRect().height;
    var shut = pills.getBoundingClientRect().height;
    if (was) fold.style.height = was;
    /* A tab that is not on screen measures nothing. Don't remember that as
       the size of the card — a span of zero folds it shut on the first
       pixel of the next scroll.
     *
       And nothing bigger than the screen is a reading either. This card is a
       header: it is a couple of hundred pixels on the tallest phone, and a
       measurement claiming otherwise was taken of something that was not the
       card — mid-layout, mid-rotation, or mid-whatever a browser does that
       this code has not met yet. The number goes into a margin, and a margin
       taken from a bad number is a screenful of blank paper with the day
       somewhere above it. Refusing to remember it costs one frame unfolded;
       believing it costs the tab. */
    if (open <= 0 || open > window.innerHeight) return null;
    foldGeo = { open: open, shut: shut,
      span: Math.max(1, Math.min(open - shut, window.innerHeight)) };
    return foldGeo;
  }

  /* `.shrunk` marks the far end of the fold, and is written only when it
     actually changes: a class attribute set to the value it already had is
     still a change to anything watching the card, and this runs on every
     frame of every scroll. */
  function mMarkShut(st, on) {
    if (on !== st.classList.contains('shrunk')) st.classList.toggle('shrunk', on);
  }

  function mSetFold(st, p) {
    var fold = $('macroFold'), pills = $('macroPills');
    if (!fold || !pills) return;
    if (p <= 0) {
      /* Open: hand every inline value back, so the card is laid out by the
         stylesheet again and whatever we measure next is a clean number.
         Only when there is something to hand back, though: at the top of the
         page this runs on every scroll event, and writing the same class and
         the same styles over and over is work nobody asked for — and a class
         written to the value it already had still counts as a change to
         anything watching the card. The margin stands for the set: all four
         are written together and cleared together. */
      mMarkShut(st, false);
      if (st.style.marginBottom) {
        st.style.removeProperty('--fold');
        st.style.marginBottom = '';
        fold.style.height = '';
      }
      /* The room under the card: its own bottom margin collapses with the
         top margin of the card below it, so the 4px in the stylesheet is not
         what actually stands between them — and the margin we write from it
         is never smaller, so from then on it is ours that wins the collapse.
       *
         It has to be measured rather than read off the two margins, because
         what collapses here is not just those two — the card below hands its
         own child's top margin outward — so the space that ends up between
         them is not a number written anywhere in the stylesheet.
       *
         But it is only measurable AT THE TOP OF THE PAGE, and that guard is
         the whole point of this block. The card is position:sticky: the
         moment the page has scrolled it is pinned to the top of the screen
         and nowhere near its place in the flow, so "the distance down to the
         next card" stops being a margin and becomes most of the page. Blake
         got a blank My Day out of exactly that — a resize handler re-measured
         this while he was scrolled, and each wrong gap went into a margin
         that made the next reading wronger still: 12px became 2164px in two
         resizes, and the day became two thousand pixels of blank paper below
         the plates. A phone resizes constantly while you scroll, because iOS
         collapses the URL bar.
       *
         So: only at the top, only while none of our own inline margin is on
         the card to be read back, once, and clamped — a gap is a margin, so
         it is small or it is wrong. */
      if (foldGap < 0 && !st.style.marginBottom &&
          (window.scrollY || window.pageYOffset || 0) <= 0) {
        /* Whatever actually follows the card, rather than a card named here:
           the plan card that used to sit there has been folded into the
           weigh-in, and a gap measured against a node that no longer renders
           is a gap of zero and an eight-pixel step on every fold. */
        var next = st.nextElementSibling;
        // a tab that is not on screen has no gap to read; wait for one that has
        if (next && st.getBoundingClientRect().height > 0) {
          foldGap = Math.max(0, Math.min(64,
            next.getBoundingClientRect().top - st.getBoundingClientRect().bottom));
        }
      }
      return;
    }
    var g = mFoldGeo();
    if (!g) return;
    /* No honest gap, no fold. This line used to fall back to the card's own
       computed bottom margin, which is THE MARGIN THIS CODE WROTE ON THE LAST
       FRAME — so once the app opened already scrolled, and the gap therefore
       never got its one honest reading at the top, every frame read back its
       own output and added to it. 183px became 37,691px in under two seconds,
       the page grew with it, and My Day was a screenful of blank paper with
       the day far above. That is the bug Blake saw on a phone and then on a
       MacBook: "it was like the app had scrolled WAY WAY WAY far away".
     *
       There is no safe fallback here, because every number within reach at
       this moment is downstream of something we wrote. So there is none: the
       card simply stays open until the top of the page has been seen once,
       which takes one scroll and costs nothing but a fold that waits. */
    if (foldGap < 0) return;
    var gap = foldGap;
    st.style.setProperty('--fold', String(p));
    /* The box loses `p * span` and the margin below gives back exactly that
       much. The sum is the same at every p, which is the whole trick: the
       page is one height all the way down, so nothing under the card moves
       and there is nothing for scroll anchoring to answer. */
    /* Unrounded, and paired: what the box gives up, the margin takes back, so
       the two always add to the same number. Rounding either one on its own
       is what puts them a pixel apart. */
    var give = g.span * p;
    /* The last gate before it reaches the page. Everything above bounds the
       measurement; this bounds the CONSEQUENCE, because the failure this
       guards against has now happened twice and both times it looked the
       same from the outside: a My Day of blank paper with the day scrolled
       off the top of it. A fold that hands back more than a screen has got
       its sums wrong whatever the reason, and the honest answer to a sum
       this code cannot trust is to stop folding and show the day. */
    if (!(give >= 0) || give > window.innerHeight) {
      foldGeo = null;
      mMarkShut(st, false);
      st.style.removeProperty('--fold');
      st.style.marginBottom = '';
      fold.style.height = '';
      return;
    }
    fold.style.height = (g.open - give) + 'px';
    st.style.marginBottom = (gap + give) + 'px';
    mMarkShut(st, p >= 1);
  }

  function syncShrunk() {
    foldRaf = 0;
    var st = document.querySelector('.mday-stick');
    if (!st) return;
    /* Leaving My Day or opening the week-of-pills detail tray unfolds its
       readout, so the open tray scrolls naturally with the page and coming
       back starts at the top with the card open. */
    if (S.view !== 'macros' || S.mPillTrayOpen) { mSetFold(st, 0); return; }
    var g = mFoldGeo();
    if (!g) return;
    var y = window.scrollY || window.pageYOffset || 0;
    var p = y / g.span;
    if (p < 0) p = 0; else if (p > 1) p = 1;
    if (mReduced()) p = st.classList.contains('shrunk') ? (y < 60 ? 0 : 1) : (y > g.open ? 1 : 0);
    mSetFold(st, p);
  }

  function onScrollShrink() {
    if (foldRaf) return;
    foldRaf = requestAnimationFrame(syncShrunk);
  }

  /* A resize changes the two heights — a narrower card wraps to more rows —
     and it can arrive without a scroll to follow it.
   *
     It does NOT touch the gap. The gap is two margins in the stylesheet, and
     those do not move when the window does; throwing it away here is what
     made a phone re-measure it mid-scroll, which is the whole story written
     against the reading of it above. A resize on a phone is usually not even
     a resize: it is the URL bar collapsing while you scroll. */
  function onResizeFold() {
    if (!document.querySelector('.mday-stick')) return;
    foldGeo = null;
    syncShrunk();
  }

  return { mFoldForget: mFoldForget, mReduced: mReduced, syncShrunk: syncShrunk, onScrollShrink: onScrollShrink, onResizeFold: onResizeFold };
};
