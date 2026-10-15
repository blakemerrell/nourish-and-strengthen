/* The toast, and the voice it speaks with: made once, at boot (mToastEls),
 * held while a finger is on it, and said with an Undo when there is one to
 * offer (mToast). The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.toast(app) once, as it starts, and keeps what it gives back
 * under the same names. Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).toast = function (app) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* The toast, and the voice it speaks with, both made once, at boot.
   *
     The toast used to be built by its own first message, role=status and
     all, and a live region that arrives WITH its words is a region nobody
     was listening to yet: a screen reader announces changes to a region it
     already knows about, so the first "won't be suggested" of a session was
     never read out, and every one after it was. The box that is drawn comes
     and goes with `hidden`; the words go to a region that is always there
     and never drawn, so the voice does not depend on the paint. */
  function mToastEls() {
    var el = $('mToast');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'mToast'; el.className = 'm-toast no-print'; el.hidden = true;
    /* Six seconds is a long time to read and a short time to reach for Undo
       with a thumb, or with Tab from the far end of the page. While it is
       being pointed at or holds the focus it stays; let go, and it leaves a
       little after. */
    el.addEventListener('mouseenter', mToastHold);
    el.addEventListener('focusin', mToastHold);
    el.addEventListener('mouseleave', mToastLet);
    el.addEventListener('focusout', mToastLet);
    document.body.appendChild(el);
    var say = document.createElement('div');
    say.id = 'mToastSay'; say.className = 'sr-only'; say.setAttribute('role', 'status');
    document.body.appendChild(say);
    return el;
  }
  function mToastHold() { clearTimeout(mToast.t); }
  function mToastLet(ev) {
    var el = $('mToast');
    if (!el || el.hidden) return;
    // still inside: focus moved between its own parts, or the pointer is over it
    if (ev && ev.type === 'focusout' && ev.relatedTarget && el.contains(ev.relatedTarget)) return;
    if (ev && ev.type === 'mouseleave' && el.contains(document.activeElement)) return;
    clearTimeout(mToast.t);
    mToast.t = setTimeout(function () { el.hidden = true; }, 3000);
  }
  /* `attr` names what Undo does elsewhere than Nourish's own (Plan my week's
     picks use data-pwundo). */
  function mToast(text, undo, attr) {
    var el = mToastEls();
    el.innerHTML = '<span>' + text + '</span>' +
      (undo ? '<button type="button" ' + (attr || 'data-mallow') + '="' + esc(String(undo)) + '">Undo</button>' : '');
    el.hidden = false;
    /* A tap on the message itself (not its Undo) puts it away early. */
    el.onclick = function (ev) { if (!ev.target.closest('[data-mallow], [data-pwundo], [data-mmoveundo], [data-mexplodeundo]')) el.hidden = true; };
    /* Emptied first, so the same words twice are two announcements. */
    var say = $('mToastSay');
    if (say) {
      var words = el.firstChild.textContent;
      say.textContent = '';
      setTimeout(function () { say.textContent = words; }, 60);
    }
    clearTimeout(mToast.t);
    mToast.t = setTimeout(function () { el.hidden = true; }, 6000);
  }

  return { mToastEls: mToastEls, mToast: mToast };
};
