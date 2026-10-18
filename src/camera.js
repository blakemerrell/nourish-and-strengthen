/* The camera held over a packet: started and stopped, the native
 * BarcodeDetector where a browser has one and the frame reader where it
 * does not (mScanStart, mScanStop); a code got, from the lens or typed
 * (mScanGot); and the form for a food nobody has heard of, drawn as a
 * Nutrition Facts panel that sums itself as you type (mNewFoodHTML,
 * mNfRefresh, mNfFill).
 * The longer account is with the code.
 *
 * A part of app.js (Nourish) in a file of its own. app.js calls
 * HiveParts.camera(app) once, as it starts, and keeps what it gives back
 * under the same names. Whether this visit to the lens is over (mCamDone)
 * stays declared in app.js; the part reaches it, and the lookups kept so
 * far, through LIVE (tests/scope.test.js holds the lists to each other).
 * Loaded before app.js.
 */
(window.HiveParts = window.HiveParts || {}).camera = function (app) {
  'use strict';

  // what it reads of the app's, and (LIVE) what the app replaces as it goes: MLOOKUP, mCamDone, mLookSeq
  var S = app.S;
  var mBarcodeLookup = app.mBarcodeLookup;
  var mDecodeFrame = app.mDecodeFrame;
  var mLookSay = app.mLookSay;
  var mLookupRows = app.mLookupRows;
  var mMealNowHTML = app.mMealNowHTML;
  var mOwnScan = app.mOwnScan;
  var renderModal = app.renderModal;
  var LIVE = app.LIVE;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }

  /* The camera, held over a packet. Native BarcodeDetector where a browser
     has one, because it is better at this than we are; the decoder above
     where it does not, which is every iPhone. */
  var mCam = null;
  /* Which opening of the lens is the current one, and whether this visit to
     scan has already got its answer.
   *
     The camera is asked for and arrives later — after a permission prompt,
     on a phone, seconds later. Everything that stops it in the meantime used
     to find nothing to stop, because mCam is only set once the stream is in
     hand, and the stream then arrived anyway and ran: on a video element
     already torn out of the page, with a frame loop behind it and the light
     on, until the app was closed. Typing the barcode did it every time
     (drawing scan mode opened the lens, and the typed number stopped it
     before permission came back), and so did leaving scan before answering
     the prompt. Each opening now carries a generation, every stop moves it
     on, and a stream that arrives for a generation that has passed is
     stopped the moment it lands.
   *
     And a scan that has found its barcode is finished. The sheet is drawn
     once in scan mode and left, but only while the video was in it — the
     scan removes the video, so the next redraw from anywhere (a sync
     arriving, a save elsewhere) drew the sheet again, wiped the result being
     read, and opened the lens a second time over the top of any stream
     still live. */
  var mCamGen = 0;

  function mScanStop() {
    mCamGen++;
    if (mCam && mCam.stream) mCam.stream.getTracks().forEach(function (t) { t.stop(); });
    if (mCam && mCam.raf) cancelAnimationFrame(mCam.raf);
    mCam = null;
    var el = $('scanRoot');
    if (el) el.innerHTML = '';
  }

  function mScanStart() {
    var root = $('scanRoot');
    if (!root) return;                  // the sheet moved on before we got here
    mScanStop();                        // one lens at a time, never a second over the first
    LIVE.mCamDone = false;
    var gen = mCamGen;
    root.innerHTML = '<div class="scan-wrap">' +
      '<video id="scanVid" playsinline muted></video>' +
      '<div class="scan-line"></div>' +
      '<div class="scan-say" id="scanSay">Hold the barcode across the line</div>' +
      '<button class="ghost scan-x" data-scan="stop">Stop</button>' +
      '</div>';
    var vid = $('scanVid');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var det = null;
    if (window.BarcodeDetector) {
      try { det = new window.BarcodeDetector({ formats: ['ean_13', 'upc_a', 'ean_8', 'upc_e'] }); }
      catch (e) { det = null; }
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
    }).then(function (stream) {
      // asked for by an opening that has since been stopped: let go at once
      if (gen !== mCamGen || !document.body.contains(vid)) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        return;
      }
      mCam = { stream: stream, raf: 0, gen: gen };
      vid.srcObject = stream;
      vid.play();
      var tick = function () {
        if (!mCam || mCam.gen !== gen) return;
        mCam.raf = requestAnimationFrame(tick);
        if (!vid.videoWidth) return;
        var w = Math.min(640, vid.videoWidth);
        var h = Math.round(vid.videoHeight * w / vid.videoWidth);
        canvas.width = w; canvas.height = h;
        ctx.drawImage(vid, 0, 0, w, h);
        var found = null;
        if (det) {
          det.detect(canvas).then(function (list) {
            if (list && list.length) mScanGot(list[0].rawValue);
          }, function () { det = null; });
        } else {
          try { found = mDecodeFrame(ctx.getImageData(0, 0, w, h).data, w, h); }
          catch (e) { found = null; }
          if (found) mScanGot(found);
        }
      };
      tick();
    }, function (err) {
      /* The answer can arrive after the question is gone. Scan opens the lens
         the moment the mode is chosen, so leaving the mode — or the sheet —
         before the permission prompt resolves tears this element out from
         under the reply, and writing to it then threw. */
      var say = $('scanSay');
      if (!say) return;
      say.textContent = err && err.name === 'NotAllowedError'
        ? 'The camera was not allowed. Type the number instead.'
        : 'No camera here. Type the number instead.';
    });
  }

  /* `typed` means a human handed this over rather than a camera frame
     decoding it.
   *
     The mCam guard is here to ignore a late decode arriving after the camera
     has been stopped, which is the only thing that can call this without
     being asked. A barcode typed into the picker is asked for — and it was
     being thrown away by that guard, because nothing had started a camera.
     Worse, it was thrown away even WITH one: the handler renders the scan
     sheet and calls straight through, while mScanStart only sets mCam once
     getUserMedia has resolved, so mCam is still null on the next line. That
     row has not worked since it was added. */
  function mScanGot(code, typed) {
    if (!code || (!typed && !mCam)) return;
    LIVE.mCamDone = true;
    mScanStop();
    // a packet you have saved a food for opens that food, and asks nobody (app.js)
    if (mOwnScan(code)) return;
    if ($('nfFind')) $('nfFind').value = code;
    var res = $('nfResults');
    if (res) res.innerHTML = '<div class="mslot-empty">Looking up ' + esc(code) + '&hellip;</div>';
    LIVE.MLOOKUP = {};
    // the same rule as the food tables: a slow answer to an older question is dropped
    var mine = ++LIVE.mLookSeq;
    mBarcodeLookup(String(code).replace(/\D/g, '')).then(function (list) {
      if (mine !== LIVE.mLookSeq) return;
      /* One answer is the packet in your hand, so its label opens straight
         away. Blake, 2026-10-08: "a scan needs to show me exactly what it
         scanned right away" — it used to land as a row under the lens, the
         same row a search draws, to be tapped before anything said what it
         was. Two answers that disagree (src/lookup.js, mTwoAnswers) stay two
         rows under their note, because which is right is yours to say
         (mockup E). The sheet goes back to its list underneath, so Back on
         the label returns to the meal rather than to a lens that has
         already been put away. */
      if (list.length === 1 && !list.clash && S.macroPick && !S.newFood) {
        var got = list[0];
        S.mpMode = 'home';
        S.newFood = { slot: S.macroPick.slot, pre: got, alg: got.alg || [], back: 1, size: 0, n: 1 };
        renderModal();
        return;
      }
      if ($('nfResults')) $('nfResults').innerHTML = mLookupRows(list);
    }, function (err) {
      if (mine !== LIVE.mLookSeq) return;
      if ($('nfResults')) {
        $('nfResults').innerHTML = '<div class="mslot-empty">' + esc(mLookSay(err, String(code))) + '</div>';
      }
    });
  }

  /* The form, drawn as the panel on the packet (Blake, 2026-10-07: "a
     better food label card when I do a scan"). It was six ledger lines —
     Called, One of them is, Calories, Protein, Fat, Carbs — which read as a
     form to fill rather than a food, and dropped the sodium and fiber every
     lookup had brought back with it.
   *
     Now it is a Nutrition Facts panel in the packet's own order and words
     (Total Fat, Sodium, Total Carbohydrate, Dietary Fiber, Protein: the
     American spelling because it is the American label, copied from one),
     so the eye goes down the packet and down the form together. Each figure
     is still a box you can type in; the label is how it looks, not a
     picture of one. The % Daily Value is the FDA's, worked out as you type
     (mNfRefresh), because a USDA answer arrives with no packet in hand to
     read it off. */
  var NF_DV = { nfF: 78, nfNa: 2300, nfC: 275, nfFib: 28 };
  function mNewFoodHTML() {
    /* Arriving with the numbers already known — off a barcode or a food
       table — or arriving empty, which is the same form either way. */
    var pre = (S.newFood && S.newFood.pre) || null;
    var val = function (v) { return v || v === 0 ? ' value="' + esc(String(v)) + '"' : ''; };
    /* A lookup that knows its food per 100 g and the sizes it comes in
       (src/foodsearch.js, src/lookup.js) opens on one of those sizes, and
       the panel is that size's label; otherwise it is the panel as given,
       or empty to type into. */
    var sized = mNfSized(pre);
    var at = sized ? mNfAt(pre, S.newFood.size || 0) : pre;
    /* The words on the left are the box's label, for= and all, so the
       numbers are read out as Calories and Protein rather than as unnamed
       boxes; a tap on the word puts the caret in the box too. */
    var row = function (id, label, unit, ph, v, sub) {
      // fiber, and since 2026-10-11 protein, fat and carbs, to a tenth (app.js keeps them so)
      var dec = /^nf(Fib|P|F|C)$/.test(id);
      /* Sodium and fiber are often missing from a lookup, and an example
         figure in grey in an empty box reads as the food's own. */
      return '<div class="nfl-row' + (sub ? ' sub' : '') + '">' +
        '<label for="' + id + '">' + label + '</label>' +
        '<input type="number" id="' + id + '" min="0" max="9999" step="' + (dec ? '0.1' : '1') + '" ' +
          'inputmode="' + (dec ? 'decimal' : 'numeric') + '"' + (ph ? ' placeholder="' + ph + '"' : '') + val(v) + '>' +
        '<span class="nfl-u">' + unit + '</span>' +
        (NF_DV[id] ? '<span class="nfl-dv" data-dv="' + id + '"></span>' : '') +
      '</div>';
    };
    /* The rest of a label, when the source gave it: read, not typed, since
       nothing the day counts is worked from them. Each has a place on the
       panel, so each is drawn where the packet prints it, or not at all. */
    var known = function (k) { return !!(sized && pre.per100[k] !== null && pre.per100[k] !== undefined); };
    var ro = function (k, label, unit, sub, top) {
      if (!known(k)) return '';
      return '<div class="nfl-row nfl-ro' + (sub ? ' sub' : '') + (top ? ' nfl-min' : '') + '"><span>' + label +
        ' <span id="nfx-' + k + '">' + mNfShow(at[k]) + '</span> ' + unit + '</span>' +
        '<span class="nfl-dv" id="nfx-' + k + '-dv">' + mNfDv(k, at[k]) + '</span></div>';
    };
    var minTop = known('ca') ? 'ca' : known('fe') ? 'fe' : 'k';
    var sizes = sized && pre.sizes.length > 1 ? '<div class="nfz" role="group" aria-label="Serving size">' +
        '<div class="nfz-h">Pick a size</div><div class="nfz-row">' +
        pre.sizes.map(function (z, i) {
          var u = (z && z.u) || (/ml/i.test(String(z.t || '')) ? 'mL' : 'g');
          return '<button class="nfz-b" data-nfsize="' + i + '" aria-pressed="' + (i === (S.newFood.size || 0)) + '">' +
            esc(z.t) + (/^\d+(?:\.\d+)?\s*(?:g|mL|ml)$/.test(z.t) ? '' : ' <span>' + mNfShow(z.g) + ' ' + u + '</span>') + '</button>';
        }).join('') + '</div></div>' : '';
    var panel = '<div class="nfl" role="group" aria-labelledby="nflH">' +
        '<div class="nfl-h" id="nflH">Nutrition Facts</div>' +
        '<div class="nfl-serv"><label for="nfUnit">Serving size</label>' +
          '<input type="text" id="nfUnit" placeholder="1 tamale"' + val(at && at.unit) + '></div>' +
        '<div class="nfl-aps">Amount per serving</div>' +
        '<div class="nfl-cal"><label for="nfKcal">Calories</label>' +
          '<input type="number" id="nfKcal" min="0" max="9999" step="1" inputmode="numeric" placeholder="250"' +
            val(at && at.kcal) + '></div>' +
        '<div class="nfl-dvh">% Daily Value*</div>' +
        row('nfF', 'Total Fat', 'g', '12', at && at.f) +
        ro('sat', 'Saturated Fat', 'g', true) +
        ro('chol', '<b>Cholesterol</b>', 'mg') +
        row('nfNa', 'Sodium', 'mg', '', at && at.na) +
        row('nfC', 'Total Carbohydrate', 'g', '25', at && at.c) +
        row('nfFib', 'Dietary Fiber', 'g', '', at && at.fib, true) +
        ro('sug', 'Total Sugars', 'g', true) +
        row('nfP', 'Protein', 'g', '10', at && at.p) +
        ro('ca', 'Calcium', 'mg', false, minTop === 'ca') +
        ro('fe', 'Iron', 'mg', false, minTop === 'fe') +
        ro('k', 'Potassium', 'mg', false, minTop === 'k') +
        '<div class="nfl-foot">* The % Daily Value tells you how much a nutrient in a serving ' +
          'contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</div>' +
      '</div>';
    if (sized) return mNfShortHTML(pre, sizes, panel);
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet" role="dialog" aria-modal="true" aria-label="Add a food">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">' + (pre ? 'How much?' : 'Type it in') + '</div>' +
          '<button class="sheet-x" data-close="1" aria-label="Close">&times;</button>' +
        '</div>' +
        (pre && pre.note
          ? '<div class="mt-cap">From ' + esc(pre.note) + '</div>' : '') +
        '<div id="nfOffPic">' + mOffPicHTML(pre && pre.off) + '</div>' +
        '<div class="mtl-row"><span class="mtl-lab">Called</span>' +
          '<span class="mtl-val"><input type="text" id="nfName" ' +
            'placeholder="Chicken tamale" aria-label="What it is called" value="' +
            esc((pre && pre.name) || '') + '"></span></div>' +
        '<div id="nfOffTop">' + mOffTopHTML(pre && pre.off) + '</div>' +
        '<div class="nfl-alg" id="nfAlg">' + mAlgHTML((S.newFood && S.newFood.alg) || []) + '</div>' +
        '<div id="nfOffMid">' + mOffMidHTML(pre && pre.off) + '</div>' +
        panel +
        '<div id="nfOffEnd">' + mOffEndHTML(pre && pre.off) + '</div>' +
        '<div class="mt-cap" id="nfCounts"></div>' +
        '<div class="mt-cap" id="nfNote"></div>' +
        '<div class="sync-row">' +
          '<button class="btn-primary" data-nf="save">' +
            (S.macroPick && S.macroPick.n ? 'Add to ' + esc(S.macroPick.n) : 'Add it to the day') + '</button>' +
          '<button class="ghost" data-nf="cancel">Cancel</button>' +
        '</div>' +
        '<div id="nfOffSrc">' + mOffSrcHTML(pre && pre.off, pre && pre.code) + '</div>' +
      '</div></div>';
  }

  /* A food looked up with its sizes (a scan, or a row from the food
     tables), drawn the way the app's own food page is (src/foodsheet.js).
   *
     Blake, 2026-10-18: "I don't like the fact I have to scroll down to the
     bottom to adjust the qty ... The nutritional box is cute. But I just
     need to see p f c and it's nice to see the nova and other stuff... But
     make it much shorter", and of the page as it was, "the styling of that
     card isn't like the others". It was the packet's whole Nutrition Facts
     panel with the two grades as cards over it, two phone screens tall, and
     How much and Add came after all of it.
   *
     Now: the name, what one of it is, the grades and allergens as a line of
     chips, then how much, the plate's macros and Add, all on the first
     screen; the figures for that amount as the food page's grid; and the
     panel, still every box you can type a correction into, with the photo,
     tags, ingredients and the meal's pills, folded under "Full label &
     ingredients". The boxes keep their ids, so saving reads them as it
     always did whether the fold is open or not. The amount is the − / +
     the page had, rather than the typed box of the mockup (2026-10-18): a
     thumb on a phone, and no keyboard over the page. */
  function mNfShortHTML(pre, sizes, panel) {
    var o = pre.off;
    var why = o && o.nova === 4 && o.why && o.why.length
      ? '<div class="nfs-sub nf-why">Ultra-processed (NOVA 4 of 4), for ' + esc(o.why.join(', ')) + '.</div>' : '';
    return '<div class="scrim no-print" data-close="1">' +
      '<div class="sheet mt-sheet mfs-sheet nf-sheet" role="dialog" aria-modal="true" aria-label="Add a food">' +
        '<div class="sheet-top">' +
          '<div class="sheet-eyebrow">' + (pre.code ? 'A food you scanned' : 'A food') + '</div>' +
          // back to the meal it was opened from, as Cancel was
          '<button class="sheet-x" data-nf="cancel" aria-label="Close">&times;</button>' +
        '</div>' +
        '<input type="text" id="nfName" class="mfs-name nf-name" placeholder="Name it" aria-label="What it is called" value="' +
          esc(pre.name || '') + '">' +
        '<div class="mfs-meta"><span class="mfs-one" id="nfOne"></span>' +
          (pre.note ? ' &middot; From ' + esc(pre.note) : '') + '</div>' +
        '<div class="nf-chips" id="nfOffTop">' + mOffTopHTML(o, true) + '</div>' +
        '<div class="nfl-alg" id="nfAlg">' + mAlgHTML((S.newFood && S.newFood.alg) || [], true) + '</div>' +
        '<div class="nfh">' +
          '<div class="nfh-row">' +
            '<button class="nfh-b" data-nfamt="-1" aria-label="Half a serving less">&minus;</button>' +
            '<div class="nfh-v" aria-live="polite" aria-label="How much"><b id="nfAmtN">1</b> &times; ' +
              '<span id="nfAmtU"></span><span class="nfh-g" id="nfAmtG"></span></div>' +
            '<button class="nfh-b" data-nfamt="1" aria-label="Half a serving more">+</button>' +
          '</div>' +
          sizes +
        '</div>' +
        '<div class="mfs-plate"><span class="mfs-k">On your plate</span><span class="mk-tot" id="nfPlate"></span></div>' +
        '<button class="btn-primary nf-add" data-nf="save">' +
          (S.macroPick && S.macroPick.n ? 'Add to ' + esc(S.macroPick.n) : 'Add it to the day') + '</button>' +
        '<div class="mt-cap" id="nfNote"></div>' +
        '<div class="mfs-nutr" id="nfNow"></div>' +
        '<details class="nf-more"><summary>Full label &amp; ingredients</summary>' +
          '<div id="nfOffPic">' + mOffPicHTML(o) + '</div>' +
          why +
          '<div id="nfOffMid">' + mOffMidHTML(o) + '</div>' +
          panel +
          '<div class="mt-cap" id="nfCounts"></div>' +
          '<div class="nfh-with"><div class="nfz-h" id="nfWithH">' + esc((S.macroPick && S.macroPick.n) || 'The meal') +
            ', with this</div><div id="nfWith"></div><div class="nfh-salt" id="nfSalt"></div></div>' +
          '<div id="nfOffEnd">' + mOffEndHTML(o) + '</div>' +
          '<div id="nfOffSrc">' + mOffSrcHTML(o, pre.code) + '</div>' +
        '</details>' +
      '</div></div>';
  }

  /* The sizes a looked-up food comes in, and the label for one of them
     (Blake picked the full panel with a size and an amount, mockups D and
     J, 2026-10-07). The label is per serving, as a packet's is; how many
     servings is the amount under it, which is what goes on the plate. The
     packet's own serving keeps the packet's own figures (`row`); the other
     sizes are worked from the label per 100 g. */
  var NFX_DV = { sat: 20, chol: 300, ca: 1300, fe: 18, k: 4700 };
  function mNfSized(pre) { return !!(pre && pre.per100 && pre.sizes && pre.sizes.length && S.newFood); }
  function mNfAt(pre, i) {
    var z = pre.sizes[i] || pre.sizes[0], h = pre.per100, x = z.g / 100;
    var r = function (v, to) { return typeof v === 'number' ? Math.round(v * x * (to || 1)) / (to || 1) : null; };
    var u = (z && z.u) || (/ml/i.test(String(z.t || '')) ? 'mL' : 'g');
    var at = { unit: /^\d+(?:\.\d+)?\s*(?:g|mL|ml)$|\(/.test(z.t) ? z.t : z.t + ' (' + mNfShow(z.g) + ' ' + u + ')', g: z.g, t: z.t,
      kcal: r(h.kcal), p: r(h.p, 10), f: r(h.f, 10), c: r(h.c, 10), na: r(h.na), fib: r(h.fib, 10),
      sat: r(h.sat, 2), chol: r(h.chol), sug: r(h.sug), ca: r(h.ca), fe: r(h.fe, 10), k: r(h.k) };
    if (z.row) ['unit', 'kcal', 'p', 'f', 'c', 'na', 'fib'].forEach(function (k) { at[k] = pre[k]; });
    return at;
  }
  function mNfShow(v) { return v === null || v === undefined ? '' : String(Math.round(v * 10) / 10); }
  function mNfDv(k, v) { return typeof v === 'number' && NFX_DV[k] ? Math.round(v / NFX_DV[k] * 100) + '%' : ''; }
  // halves of a serving, as a kitchen says them: ½, 1, 1½
  function mNfHalves(n) { var w = Math.floor(n), hf = n - w > 0.25; return (w ? String(w) : '') + (hf ? '\u00bd' : '') || '0'; }

  /* A size picked: the panel becomes that size's label. Anything typed
     over the figures is the source's again, since they were figures for
     the size before. */
  function mNfSize(i) {
    var pre = S.newFood && S.newFood.pre;
    if (!mNfSized(pre) || !pre.sizes[i]) return;
    S.newFood.size = i;
    var at = mNfAt(pre, i);
    var put = function (id, v) { if ($(id)) $(id).value = v || v === 0 ? v : ''; };
    put('nfUnit', at.unit); put('nfKcal', at.kcal); put('nfP', at.p); put('nfF', at.f); put('nfC', at.c);
    put('nfNa', at.na); put('nfFib', at.fib);
    Object.keys(NFX_DV).concat('sug').forEach(function (k) {
      if ($('nfx-' + k)) $('nfx-' + k).textContent = mNfShow(at[k]);
      if ($('nfx-' + k + '-dv')) $('nfx-' + k + '-dv').textContent = mNfDv(k, at[k]);
    });
    var bs = document.querySelectorAll('[data-nfsize]');
    for (var j = 0; j < bs.length; j++) bs[j].setAttribute('aria-pressed', String(Number(bs[j].dataset.nfsize) === i));
    mNfRefresh();
  }
  // half a serving more or less, never none: removing it is Cancel
  function mNfAmount(d) {
    if (!S.newFood) return;
    S.newFood.n = Math.max(0.5, Math.min(20, (S.newFood.n || 1) + d * 0.5));
    mNfRefresh();
  }

  /* What Open Food Facts adds beyond the label (src/lookup.js, mOffMore),
     in the order of the mockup Blake picked (2026-10-07, "D"): the two
     grades side by side, then what the ingredients say about it, then the
     traffic lights, the panel, and the ingredients under it. A packet the
     USDA answered for has none of it, and the form is as it was. Each grade
     is said in words beside its colours, so neither is colour alone. */
  /* The packet's photo, credited as its licence asks. With no signal it
     cannot load, and a broken image says nothing useful, so it goes
     (mNfPhotoWatch); nothing about the food depends on it. */
  function mOffPicHTML(o) {
    if (!o || !o.img || navigator.onLine === false) return '';
    return '<figure class="nfp"><img src="' + esc(o.img) + '" alt="The front of the packet" decoding="async">' +
      '<figcaption>Photo: Open Food Facts contributors, CC BY-SA</figcaption></figure>';
  }
  function mNfPhotoWatch() {
    var img = document.querySelector('.nfp img');
    if (!img || img.getAttribute('data-watched')) return;
    img.setAttribute('data-watched', '1');
    var gone = function () { var f = img.closest('.nfp'); if (f) f.hidden = true; };
    if (img.complete && !img.naturalWidth && img.src) gone();
    img.addEventListener('error', gone);
  }
  var NOVA_WORD = { 1: 'Unprocessed or minimally processed', 2: 'Processed culinary ingredient',
    3: 'Processed', 4: 'Ultra-processed' };
  function mOffTopHTML(o, small) {
    if (!o || !(o.ns || o.nova)) return '';
    /* On the short page, a line of chips: each grade's colour with its word
       beside it, the Nutri-Score's letter in the colour of its place on the
       scale, and NOVA's number in its own. What made a food ultra-processed
       is said in the fold, by its ingredients. */
    if (small) {
      return (o.ns ? '<span class="nfs-grade nf-chip" role="img" aria-label="Nutri-Score ' + o.ns.toUpperCase() +
          ', on a scale from A, the best, to E"><span class="nf-chip-b nfs-' + o.ns + '" aria-hidden="true">' +
          o.ns.toUpperCase() + '</span><span class="nfs-k" aria-hidden="true">Nutri-Score</span></span>' : '') +
        (o.nova ? '<span class="nfs-grade nf-chip"><span class="nf-chip-b nfs-n' + o.nova + '" aria-hidden="true">' + o.nova +
          '</span><span class="nfs-k">' + NOVA_WORD[o.nova] + '</span><span class="nf-sr"> (NOVA ' + o.nova + ' of 4)</span></span>' : '');
    }
    var ns = o.ns ? '<div class="nfs-grade"><span class="nfs-ns" role="img" aria-label="Nutri-Score ' +
        o.ns.toUpperCase() + ', on a scale from A, the best, to E">' +
        'abcde'.split('').map(function (l) {
          return '<span class="nfs-l nfs-' + l + (l === o.ns ? ' on' : '') + '">' + l.toUpperCase() + '</span>';
        }).join('') + '</span>' +
        '<span class="nfs-k">Nutri-Score <b>' + o.ns.toUpperCase() + '</b></span>' +
        '<span class="nfs-sub">How it compares in its aisle, per 100 g</span></div>' : '';
    var nova = o.nova ? '<div class="nfs-grade"><span class="nfs-nova nfs-n' + o.nova + '" aria-hidden="true">' + o.nova + '</span>' +
        '<span class="nfs-k">' + NOVA_WORD[o.nova] + '</span>' +
        '<span class="nfs-sub">NOVA ' + o.nova + ' of 4' +
          (o.why ? ', for ' + esc(o.why.join(', ')) : '') + '</span></div>' : '';
    return '<div class="nfs-grades">' + ns + nova + '</div>';
  }
  var LEVEL_NAME = [['fat', 'Fat'], ['saturated-fat', 'Sat. fat'], ['sugars', 'Sugars'], ['salt', 'Salt']];
  function mOffMidHTML(o) {
    if (!o) return '';
    var out = o.tags ? '<div class="nfs-tags">' + o.tags.map(function (t) {
      return '<span class="nfs-tag">' + esc(t) + '</span>';
    }).join('') + '</div>' : '';
    if (o.lv) {
      out += '<div class="nfs-lv">' + LEVEL_NAME.filter(function (n) { return o.lv[n[0]]; }).map(function (n) {
        var v = o.lv[n[0]];
        return '<span class="nfs-lvi lv-' + v + '"><span class="nfs-lvk">' + n[1] + '</span><b>' +
          v.charAt(0).toUpperCase() + v.slice(1) + '</b></span>';
      }).join('') + '</div><div class="nfs-sub nfs-lvc">Fat, salt and sugar per 100 g, by the UK\u2019s traffic-light bands</div>';
    }
    return out;
  }
  /* The ingredients, folded, with what made it ultra-processed marked where
     those words appear. Escaped first and marked after, so a marker can only
     ever wrap text, never markup. */
  function mOffEndHTML(o) {
    if (!o || !o.ingr) return '';
    var txt = esc(o.ingr);
    (o.why || []).forEach(function (w) {
      var re = new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      txt = txt.replace(re, '<mark>$1</mark>');
    });
    return '<details class="nfs-ingr"><summary>Ingredients</summary><p>' + txt + '</p>' +
      (o.adds ? '<p class="nfs-sub">Additives: ' + esc(o.adds.join(', ')) + '</p>' : '') + '</details>';
  }
  function mOffSrcHTML(o, code) {
    if (!o || !(o.ns || o.nova || o.tags || o.lv || o.ingr)) return '';
    return '<div class="nfs-src">Grades, tags and ingredients from Open Food Facts, written by volunteers.' +
      (code ? ' <a href="https://world.openfoodfacts.org/product/' + encodeURIComponent(code) +
        '" target="_blank" rel="noopener">Something wrong? Fix it there</a>' : '') + '</div>';
  }

  /* What the packet declares, said once above the panel where a label puts
     it. Only ever what Open Food Facts lists, and said as theirs: it is
     written by volunteers, and an empty list there means nobody has typed
     the allergens in, not that there are none — so no list says nothing at
     all rather than "no allergens". */
  function mAlgHTML(alg, small) {
    if (!alg || !alg.length) return '';
    // the short page says whose list it is in a few words; its source line, in the fold, says the rest
    return '<b>Contains</b> ' + esc(alg.join(', ')) + (small
      ? '<span class="nfl-alg-src"> \u00b7 as Open Food Facts lists it</span>'
      : '<span class="nfl-alg-src"> as Open Food Facts lists it. The packet has the last word.</span>');
  }

  /* The panel's sums, redrawn as the boxes change: each % Daily Value, and
     what the day will count. The day counts protein and carbs at four a
     gram and fat at nine (the long note at the save in app.js), so a
     packet's 110 kcal can go onto the day as 125 — beans with 6 g of fiber,
     which the label counts at less than four. That used to happen silently
     at the save; it is said here, under the figure it replaces. */
  function mNfRefresh() {
    if (!$('nfKcal')) return;
    mNfPhotoWatch();
    /* Each figure a label row's box holds is as wide as it is, so it reads
       "Total Fat 1 g" like the rows beside it that are only read
       ("Saturated Fat 0 g"), not a number adrift in a box sized for four
       digits (2026-10-07). The row is the thing to tap (app.js), so a
       narrow box costs no reach. */
    var ins = document.querySelectorAll('.nfl-row input');
    for (var q = 0; q < ins.length; q++) {
      ins[q].style.width = (Math.max(1, String(ins[q].value || ins[q].placeholder || '').length) + 1.2) + 'ch';
    }
    var num = function (id) { var v = Number(($(id) || {}).value); return isFinite(v) && v > 0 ? v : 0; };
    var cells = document.querySelectorAll('.nfl [data-dv]');
    for (var i = 0; i < cells.length; i++) {
      var id = cells[i].getAttribute('data-dv'), raw = String(($(id) || {}).value || '').trim();
      cells[i].textContent = raw === '' ? '' : Math.round(num(id) / NF_DV[id] * 100) + '%';
    }
    var say = $('nfCounts');
    if (!say) return;
    var tenth = function (id) { return Math.round(num(id) * 10) / 10; };
    var p = tenth('nfP'), f = tenth('nfF'), c = tenth('nfC');
    var typed = Math.round(num('nfKcal')), counts = Math.round(4 * p + 4 * c + 9 * f), fib = num('nfFib');
    say.textContent = (p || f || c) && typed && Math.abs(counts - typed) >= 5
      ? 'The day counts ' + counts + ' kcal, not ' + typed + ': protein and carbs at 4 a gram, fat at 9' +
        (fib && counts > typed ? ', where the label counts its ' + (Math.round(fib * 10) / 10) + ' g of fiber at less.' : '.')
      : '';
    /* How much, and the meal with it: the label times the servings, in the
       calories the day will count, on the meal's own pills. */
    var pre = S.newFood && S.newFood.pre;
    if (!mNfSized(pre) || !$('nfAmtN')) return;
    var n = S.newFood.n || 1, z = pre.sizes[S.newFood.size || 0] || pre.sizes[0];
    $('nfAmtN').textContent = mNfHalves(n);
    $('nfAmtU').textContent = z.t;
    $('nfAmtG').textContent = Math.round(z.g * n) + ' g';
    var kc = typed && !(p || f || c) ? typed : counts;
    /* No pills when the meal has no share to measure against (no targets
       yet): "69/0" was a fraction of nothing. */
    var pills = mMealNowHTML(S.newFood.slot, { kcal: kc * n, p: p * n, f: f * n, c: c * n });
    if ($('nfWith')) $('nfWith').innerHTML = pills;
    if ($('nfWithH')) $('nfWithH').hidden = !pills;
    var na = String(($('nfNa') || {}).value || '').trim() === '' ? null : num('nfNa') * n;
    if ($('nfSalt')) $('nfSalt').textContent = na === null ? '' :
      Math.round(na).toLocaleString() + ' mg of sodium: ' + Math.round(na / 2300 * 100) + '% of a day\u2019s 2,300 mg.';
    /* The short page (mNfShortHTML): what one of it is, the plate's macros
       at this amount in the calories the day will count, and the figures
       for that amount as the food page's grid, read from the boxes in the
       fold so a corrected figure shows here too. */
    if ($('nfOne')) $('nfOne').textContent = 'One of it: ' + (String(($('nfUnit') || {}).value || '').trim() || z.t);
    var cell = function (m, l, v) { return '<span class="mgc">' + Math.round(v) + '<i class="mb-' + m + '">' + l + '</i></span>'; };
    if ($('nfPlate')) {
      $('nfPlate').innerHTML = Math.round(kc * n) + ' kcal \u00b7 ' + cell('p', 'P', p * n) + ' \u00b7 ' +
        cell('f', 'F', f * n) + ' \u00b7 ' + cell('c', 'C', c * n);
    }
    if ($('nfNow')) {
      var raw = function (id) { return String(($(id) || {}).value || '').trim() !== ''; };
      var at = mNfAt(pre, S.newFood.size || 0);
      var g2 = [['Calories', kc * n, ''], ['Protein', p * n, 'g'], ['Fat', f * n, 'g'], ['Carbs', c * n, 'g']];
      if (raw('nfNa')) g2.push(['Sodium', num('nfNa') * n, 'mg']);
      if (raw('nfFib')) g2.push(['Fiber', num('nfFib') * n, 'g']);
      if (typeof at.sug === 'number') g2.push(['Sugars', at.sug * n, 'g']);
      if (typeof at.sat === 'number') g2.push(['Sat. fat', at.sat * n, 'g']);
      $('nfNow').innerHTML = '<div class="mfs-grid" role="group" aria-label="What this amount holds">' + g2.map(function (r, i) {
        var v = r[2] === 'g' && r[1] < 10 ? String(Math.round(r[1] * 10) / 10) : Math.round(r[1]).toLocaleString();
        return '<div class="mfs-nr' + (i < 4 ? ' key' : '') + '"><span>' + r[0] + '</span><b>' + v + (r[2] ? ' ' + r[2] : '') + '</b></div>';
      }).join('') + '</div>';
    }
  }

  /* A looked-up row poured into the form already open, rather than opening
     a second one over it. */
  function mNfFill(got) {
    if (!$('nfName') || !got) return;
    var put = function (id, v) { if ($(id)) $(id).value = v || v === 0 ? v : ''; };
    put('nfName', got.name); put('nfUnit', got.unit); put('nfKcal', got.kcal);
    put('nfP', got.p); put('nfF', got.f); put('nfC', got.c);
    put('nfNa', got.na); put('nfFib', got.fib);
    if (S.newFood) { S.newFood.alg = got.alg || []; S.newFood.pre = got; }
    if ($('nfAlg')) $('nfAlg').innerHTML = mAlgHTML(got.alg, !!document.querySelector('.nf-sheet'));
    if ($('nfOffPic')) $('nfOffPic').innerHTML = mOffPicHTML(got.off);
    if ($('nfOffTop')) $('nfOffTop').innerHTML = mOffTopHTML(got.off, !!document.querySelector('.nf-sheet'));
    if ($('nfOffMid')) $('nfOffMid').innerHTML = mOffMidHTML(got.off);
    if ($('nfOffEnd')) $('nfOffEnd').innerHTML = mOffEndHTML(got.off);
    if ($('nfOffSrc')) $('nfOffSrc').innerHTML = mOffSrcHTML(got.off, got.code);
    mNfRefresh();
  }

  return { mScanStop: mScanStop, mScanStart: mScanStart, mScanGot: mScanGot, mNewFoodHTML: mNewFoodHTML,
    mNfRefresh: mNfRefresh, mNfFill: mNfFill, mNfSize: mNfSize, mNfAmount: mNfAmount, mNfAt: mNfAt, mNfSized: mNfSized };
};
