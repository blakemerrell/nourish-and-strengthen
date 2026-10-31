/* Progress photos for the Recomp tab (window.HHPhotos): a front and a side
 * a month, kept on this phone only, in IndexedDB, and never synced or sent
 * anywhere. Blake, 2026-10-30, choosing the full recomp check-in: weekly
 * measurements and a monthly photo, with the photos staying on the phone.
 *
 * Not a part of app.js. The Recomp tab draws the slots (slotsHTML), this
 * fills them once the sheet is on the page (fill), and a photo chosen or
 * removed is handled here with listeners on the document, so the sheet does
 * not have to be redrawn for a picture to appear.
 *
 * Why not localStorage, where everything else lives: a photo is megabytes,
 * localStorage is five of them for the whole app, and everything in it is
 * mirrored to the household's sync document. A photo must never be either.
 */
(function () {
  'use strict';

  var DB = 'hh-photos', STORE = 'p', MAX = 1080;
  var POSES = [['front', 'Front'], ['side', 'Side']];
  var MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var urls = [];                     // object URLs handed out, revoked on the next fill

  function open() {
    return new Promise(function (ok, no) {
      if (!window.indexedDB) { no(new Error('no indexedDB')); return; }
      var rq = window.indexedDB.open(DB, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
      rq.onsuccess = function () { ok(rq.result); };
      rq.onerror = function () { no(rq.error); };
    });
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (ok, no) {
        var t = db.transaction(STORE, mode), st = t.objectStore(STORE), out = fn(st);
        t.oncomplete = function () { db.close(); ok(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { db.close(); no(t.error); };
      });
    });
  }
  function all() {
    return open().then(function (db) {
      return new Promise(function (ok) {
        var out = {}, rq = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
        rq.onsuccess = function () {
          var c = rq.result;
          if (c) { out[c.key] = c.value; c.continue(); } else { db.close(); ok(out); }
        };
        rq.onerror = function () { db.close(); ok(out); };
      });
    }).catch(function () { return {}; });
  }

  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1); }
  function monthSay(mk) { var p = mk.split('-'); return MONS[Number(p[1]) - 1] + ' ' + p[0]; }

  /* Shrunk to 1080 pixels on its long side as JPEG before it is kept: a
     phone's photo is several megabytes, and a body against a wall needs
     none of them to be compared month to month. */
  function shrink(file) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), img = new window.Image();
      img.onload = function () {
        var k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        if (c.toBlob) c.toBlob(function (b) { ok(b || file); }, 'image/jpeg', 0.85);
        else ok(file);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(file); };
      img.src = url;
    });
  }

  function slot(key, label) {
    return '<div class="mc-ph-slot" data-photoslot="' + key + '">' +
      '<label class="mc-ph-pick">' +
        '<input type="file" accept="image/*" capture="user" data-photo="' + key + '" class="vis-hidden">' +
        '<span class="mc-ph-img"></span>' +
        '<span class="mc-ph-l">' + label + '</span>' +
      '</label>' +
      '<button type="button" class="mc-ph-del" data-photodel="' + key + '" hidden aria-label="Remove the ' + label.toLowerCase() + ' photo">Remove</button>' +
    '</div>';
  }
  /* This month's two slots, and a place for first-against-latest. */
  function slotsHTML() {
    var mk = monthKey();
    return '<section class="mc-ph" aria-label="Progress photos">' +
      '<div class="mc-rc-h"><span>Photos, ' + monthSay(mk) + '</span><span class="mc-ph-note">on this phone only</span></div>' +
      '<div class="mc-ph-row">' + POSES.map(function (p) { return slot(mk + ':' + p[0], p[1]); }).join('') + '</div>' +
      '<div class="mc-ph-cmp" id="mcPhCmp"></div>' +
    '</section>';
  }

  function setImg(el, blob) {
    var box = el && el.querySelector('.mc-ph-img');
    if (!box) return;
    if (!blob) { box.innerHTML = ''; el.classList.remove('has'); return; }
    var u = URL.createObjectURL(blob);
    urls.push(u);
    box.innerHTML = '<img alt="" src="' + u + '">';
    el.classList.add('has');
  }
  /* Fill the slots from what is kept, and set the first month beside the
     latest when there are two months to compare. */
  function fill(root) {
    root = root || document;
    if (!root.querySelector('.mc-ph')) return Promise.resolve();
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
    return all().then(function (ph) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-photoslot]'), function (s) {
        var key = s.getAttribute('data-photoslot');
        setImg(s, ph[key] || null);
        var del = s.querySelector('[data-photodel]');
        if (del) del.hidden = !ph[key];
      });
      var months = {};
      Object.keys(ph).forEach(function (k) { months[k.split(':')[0]] = 1; });
      var ms = Object.keys(months).sort();
      var cmp = root.querySelector('#mcPhCmp');
      if (!cmp) return;
      if (ms.length < 2) { cmp.innerHTML = ''; return; }
      var a = ms[0], b = ms[ms.length - 1];
      cmp.innerHTML = '<div class="mc-rc-h"><span>' + monthSay(a) + ' against ' + monthSay(b) + '</span></div>' +
        POSES.map(function (p) {
          return '<div class="mc-ph-row">' +
            '<div class="mc-ph-slot" data-photocmp="' + a + ':' + p[0] + '"><span class="mc-ph-img"></span><span class="mc-ph-l">' + p[1] + ', ' + monthSay(a) + '</span></div>' +
            '<div class="mc-ph-slot" data-photocmp="' + b + ':' + p[0] + '"><span class="mc-ph-img"></span><span class="mc-ph-l">' + p[1] + ', ' + monthSay(b) + '</span></div>' +
          '</div>';
        }).join('');
      Array.prototype.forEach.call(cmp.querySelectorAll('[data-photocmp]'), function (s) {
        setImg(s, ph[s.getAttribute('data-photocmp')] || null);
      });
    });
  }

  document.addEventListener('change', function (e) {
    var inp = e.target;
    if (!inp || !inp.getAttribute || !inp.getAttribute('data-photo')) return;
    var key = inp.getAttribute('data-photo'), f = inp.files && inp.files[0];
    if (!f) return;
    shrink(f).then(function (b) {
      return tx('readwrite', function (st) { return st.put(b, key); });
    }).then(function () { inp.value = ''; return fill(document); })
      .catch(function () { /* nothing kept: the slot stays as it was */ });
  });
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-photodel]');
    if (!b) return;
    var key = b.getAttribute('data-photodel');
    tx('readwrite', function (st) { return st.delete(key); })
      .then(function () { return fill(document); })
      .catch(function () { /* left as it was */ });
  });

  window.HHPhotos = { slotsHTML: slotsHTML, fill: fill, monthKey: monthKey };
})();
