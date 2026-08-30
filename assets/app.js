/* ============================================================
   NLHSE project defence — site behaviour
   Vanilla JS, no build step. The only network dependency is
   Pyodide, fetched from jsDelivr the first time a cell is run.
   ============================================================ */
(function () {
  "use strict";

  var NS = "nlhse.";
  var root = document.documentElement;

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(NS + k, v); } catch (e) {} }
  };

  /* Fallback only — the inline script in each <head> applies these before the
     first paint. Repeating them here keeps the file self-contained. */
  var savedTheme = store.get("theme", null);
  if (savedTheme === "dark" || savedTheme === "light") root.setAttribute("data-theme", savedTheme);
  if (store.get("nav", "") === "collapsed") root.setAttribute("data-nav", "collapsed");

  /* ---------------------------------------------------------
     1. The one place the site structure is written down
     --------------------------------------------------------- */
  var NAV = [
    ["Orientation", [
      ["index.html", "00", "Start here"],
      ["report.html", "01", "The report, chapter by chapter"]
    ]],
    ["The mathematics", [
      ["theory.html", "02", "What the equation is"],
      ["beta.html", "03", "The beta fractional derivative"],
      ["method.html", "04", "The Unified Technique"],
      ["derivation.html", "05", "The derivation, line by line"],
      ["results.html", "06", "The eleven figures"]
    ]],
    ["The interview", [
      ["qa-project.html", "07", "Q&A — your project"],
      ["qa-math.html", "08", "Q&A — general mathematics"],
      ["qa-weakspots.html", "09", "Hard questions & honest gaps"],
      ["cheatsheet.html", "10", "Cheat sheet"]
    ]],
    ["Programming", [
      ["lab.html", "11", "Python lab — run the solutions"],
      ["qa-python.html", "12", "Q&A — programming & numerics"]
    ]]
  ];

  var FOLD_KEY = "folded";

  function loadFolded() {
    try { return JSON.parse(store.get(FOLD_KEY, "[]")); } catch (e) { return []; }
  }
  function saveFolded(list) { store.set(FOLD_KEY, JSON.stringify(list)); }

  function here() { return location.pathname.split("/").pop() || "index.html"; }

  function renderNav() {
    var mount = document.querySelector(".sidebar");
    if (!mount) return;
    var cur = here();
    var folded = loadFolded();

    var html =
      '<a class="brand" href="index.html">' +
        '<span class="brand-sub">M.S. project defence</span>' +
        '<span class="brand-name">Traveling Wave Solutions of the Nonlinear Hyperbolic Schrödinger Equation</span>' +
      "</a>";

    NAV.forEach(function (group) {
      var title = group[0];
      var hasCurrent = group[1].some(function (i) { return i[0] === cur; });
      var isFolded = !hasCurrent && folded.indexOf(title) !== -1;
      html += '<div class="navgroup' + (isFolded ? " is-folded" : "") +
              '" data-group="' + title.replace(/"/g, "&quot;") + '">' +
              '<button class="navlabel" type="button" aria-expanded="' + (!isFolded) + '">' +
                "<span>" + title + "</span><span class=\"fold\" aria-hidden=\"true\">&#9662;</span>" +
              "</button>";
      group[1].forEach(function (item) {
        html += '<a class="navlink" href="' + item[0] + '"' +
                (item[0] === cur ? ' aria-current="page"' : "") + ">" +
                '<span class="n">' + item[1] + "</span><span>" + item[2] + "</span></a>";
      });
      html += "</div>";
    });

    html += '<div class="sidebar-foot">' +
              '<button class="btn" type="button" data-theme-toggle></button>' +
              '<button class="btn" type="button" data-nav-collapse ' +
                'title="Hide the menu (press [ )">&#8676; Hide menu</button>' +
            "</div>";
    mount.innerHTML = html;
  }

  /* the floating button that brings the rail back once it is hidden */
  function renderNavShow() {
    if (document.querySelector(".navshow")) return;
    var b = document.createElement("button");
    b.className = "btn navshow";
    b.type = "button";
    b.setAttribute("data-nav-expand", "");
    b.setAttribute("title", "Show the menu (press [ )");
    b.setAttribute("aria-label", "Show navigation");
    b.innerHTML = "&#9776; Menu";
    document.body.appendChild(b);
  }

  function setRail(collapsed) {
    if (collapsed) root.setAttribute("data-nav", "collapsed");
    else root.removeAttribute("data-nav");
    store.set("nav", collapsed ? "collapsed" : "open");
  }

  function renderPageNav() {
    var mount = document.querySelector("[data-pagenav]");
    if (!mount) return;
    var flat = [];
    NAV.forEach(function (g) { g[1].forEach(function (i) { flat.push(i); }); });
    var cur = here();
    var idx = -1;
    for (var i = 0; i < flat.length; i++) if (flat[i][0] === cur) { idx = i; break; }
    if (idx < 0) return;
    var html = "";
    if (idx > 0) {
      html += '<a href="' + flat[idx - 1][0] + '"><span class="dir">← Previous</span>' +
              '<span class="ttl">' + flat[idx - 1][2] + "</span></a>";
    } else { html += "<span></span>"; }
    if (idx < flat.length - 1) {
      html += '<a class="next" href="' + flat[idx + 1][0] + '"><span class="dir">Next →</span>' +
              '<span class="ttl">' + flat[idx + 1][2] + "</span></a>";
    }
    mount.className = "pagenav";
    mount.innerHTML = html;
  }

  /* ---------------------------------------------------------
     2. Theme, drawer, folding — one delegated listener
     --------------------------------------------------------- */
  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function paintThemeButtons() {
    var t = currentTheme();
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (b) {
      b.textContent = t === "dark" ? "☀ Light" : "☾ Dark";
      b.setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " theme");
    });
  }

  function closeDrawer() {
    var side = document.querySelector(".sidebar");
    if (side) side.classList.remove("open");
    var btn = document.querySelector("[data-menu]");
    if (btn) btn.setAttribute("aria-expanded", "false");
    var scrim = document.querySelector(".scrim");
    if (scrim) scrim.remove();
  }

  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-theme-toggle]")) {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      paintThemeButtons();
      document.dispatchEvent(new CustomEvent("themechange"));
      return;
    }

    var m = ev.target.closest("[data-menu]");
    if (m) {
      var side = document.querySelector(".sidebar");
      if (!side) return;
      if (side.classList.contains("open")) { closeDrawer(); return; }
      side.classList.add("open");
      m.setAttribute("aria-expanded", "true");
      var scrim = document.createElement("div");
      scrim.className = "scrim";
      scrim.addEventListener("click", closeDrawer);
      document.body.appendChild(scrim);
      return;
    }

    if (ev.target.closest(".scrim")) { closeDrawer(); return; }

    if (ev.target.closest("[data-nav-collapse]")) { setRail(true); return; }
    if (ev.target.closest("[data-nav-expand]")) { setRail(false); return; }

    var lab = ev.target.closest(".navlabel");
    if (lab) {
      var grp = lab.closest(".navgroup");
      var nowFolded = grp.classList.toggle("is-folded");
      lab.setAttribute("aria-expanded", nowFolded ? "false" : "true");
      var name = grp.getAttribute("data-group");
      var list = loadFolded().filter(function (n) { return n !== name; });
      if (nowFolded) list.push(name);
      saveFolded(list);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); return; }
    /* "[" toggles the rail — but never while typing in a code cell or the search box */
    if (e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setRail(root.getAttribute("data-nav") !== "collapsed");
    }
  });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onScheme = function () { if (!root.getAttribute("data-theme")) paintThemeButtons(); };
  mq.addEventListener ? mq.addEventListener("change", onScheme) : mq.addListener(onScheme);

  /* The pages are written with real Greek letters, but nobody types ω into a
     search box — they type "omega". Index both. */
  var GREEK = {
    "α": "alpha", "β": "beta", "γ": "gamma", "Γ": "gamma", "δ": "delta", "Δ": "delta",
    "ε": "epsilon", "ζ": "zeta", "θ": "theta", "λ": "lambda", "μ": "mu", "ξ": "xi",
    "π": "pi", "ρ": "rho", "σ": "sigma", "τ": "tau", "υ": "upsilon", "φ": "phi",
    "χ": "chi", "ψ": "psi", "ω": "omega", "Ω": "omega"
  };

  function haystack(el) {
    if (el.__hay) return el.__hay;
    var text = el.textContent;
    var extra = [];
    for (var ch in GREEK) {
      if (text.indexOf(ch) !== -1 && extra.indexOf(GREEK[ch]) === -1) extra.push(GREEK[ch]);
    }
    el.__hay = (text + " " + extra.join(" ")).toLowerCase();
    return el.__hay;
  }

  /* ---------------------------------------------------------
     3. Q&A — quiz mode, search, reviewed-count
     --------------------------------------------------------- */
  function wireQA() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".qa"));
    if (!cards.length) return;

    var pageKey = "done-" + (document.body.dataset.page || here());
    var done = {};
    try { done = JSON.parse(store.get(pageKey, "{}")) || {}; } catch (e) { done = {}; }

    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-qa-sec]"));
    function refreshSections() {
      sections.forEach(function (sec) {
        var any = false, n = sec.nextElementSibling;
        while (n && !n.hasAttribute("data-qa-sec")) {
          if (n.classList.contains("qa") && !n.classList.contains("hidden")) { any = true; break; }
          n = n.nextElementSibling;
        }
        sec.hidden = !any;
      });
    }

    var counter = document.querySelector("[data-counter]");
    function refreshCount() {
      if (!counter) return;
      var visible = cards.filter(function (c) { return !c.classList.contains("hidden"); });
      var n = visible.filter(function (c) { return c.dataset.done === "1"; }).length;
      counter.textContent = n + " / " + visible.length + " reviewed";
    }

    cards.forEach(function (card) {
      var id = card.id || "";
      if (done[id]) card.dataset.done = "1";
      var box = card.querySelector(".qa-done");
      if (box) {
        box.checked = card.dataset.done === "1";
        box.addEventListener("change", function () {
          card.dataset.done = box.checked ? "1" : "0";
          done[id] = box.checked;
          store.set(pageKey, JSON.stringify(done));
          refreshCount();
        });
        box.addEventListener("click", function (e) { e.stopPropagation(); });
      }
      var head = card.querySelector(".qa-head");
      if (head) {
        head.addEventListener("click", function () {
          if (document.body.classList.contains("quiz")) card.classList.toggle("revealed");
        });
      }
    });

    var quizBtn = document.querySelector("[data-quiz]");
    if (quizBtn) {
      var on = store.get("quiz", "0") === "1";
      var applyQuiz = function () {
        document.body.classList.toggle("quiz", on);
        quizBtn.setAttribute("aria-pressed", on ? "true" : "false");
        quizBtn.textContent = on ? "✓ Quiz mode" : "Quiz mode";
        if (!on) cards.forEach(function (c) { c.classList.remove("revealed"); });
      };
      applyQuiz();
      quizBtn.addEventListener("click", function () {
        on = !on; store.set("quiz", on ? "1" : "0"); applyQuiz();
      });
    }

    var revealAll = document.querySelector("[data-reveal-all]");
    if (revealAll) {
      revealAll.addEventListener("click", function () {
        var anyHidden = cards.some(function (c) { return !c.classList.contains("revealed"); });
        cards.forEach(function (c) { c.classList.toggle("revealed", anyHidden); });
      });
    }

    var search = document.querySelector("[data-search]");
    if (search) {
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var hit = !q || haystack(card).indexOf(q) !== -1;
          card.classList.toggle("hidden", !hit);
        });
        refreshSections();
        refreshCount();
      });
    }

    refreshSections();
    refreshCount();
  }

  /* ---------------------------------------------------------
     4. Pyodide — one interpreter per page, shared by every cell
     --------------------------------------------------------- */
  var PYODIDE_VERSION = "0.26.4";
  var PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

  var pyodide = null;
  var pyodidePromise = null;
  var mplReady = false;
  var listeners = [];

  function announce(msg, state) { listeners.forEach(function (fn) { fn(msg, state); }); }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Could not download Python. Check the internet connection.")); };
      document.head.appendChild(s);
    });
  }

  function bootPython() {
    if (pyodidePromise) return pyodidePromise;
    announce("Downloading Python…", "loading");
    pyodidePromise = loadScript(PYODIDE_URL + "pyodide.js")
      .then(function () { return globalThis.loadPyodide({ indexURL: PYODIDE_URL }); })
      .then(function (py) { pyodide = py; announce("Python ready", "ready"); return py; })
      .catch(function (err) {
        pyodidePromise = null;
        announce("Python could not load — offline?", "error");
        throw err;
      });
    return pyodidePromise;
  }

  var MPL_SETUP = [
    "import matplotlib",
    "matplotlib.use('AGG')",
    "import matplotlib.pyplot as plt",
    "plt.show = lambda *a, **k: None",
    "matplotlib.rcParams.update({",
    "    'figure.figsize': (7.4, 4.5),",
    "    'figure.dpi': 110,",
    "    'font.size': 11,",
    "    'axes.grid': True,",
    "    'grid.alpha': 0.25,",
    "    'axes.spines.top': False,",
    "    'axes.spines.right': False,",
    "    'lines.linewidth': 2.0,",
    "    'figure.autolayout': True,",
    "})"
  ].join("\n");

  /* Re-applied before every run: the theme can be flipped mid-session and a
     white rectangle in a dark page is unpleasant. */
  function themeRc() {
    var dark = currentTheme() === "dark";
    var p = dark
      ? { bg: "#141827", fg: "#E5E8F2", grid: "#3A4058",
          cycle: "['#A5B4FC','#F2999D','#7DD3B0','#DFA65B','#C4A5F5']" }
      : { bg: "#FFFFFF", fg: "#161A2C", grid: "#C9CDE0",
          cycle: "['#4338CA','#B4232B','#0B7A5C','#8A5A06','#6B4EA8']" };
    return [
      "import matplotlib as _m",
      "from cycler import cycler as _cy",
      "_m.rcParams.update({",
      "  'figure.facecolor': '" + p.bg + "', 'axes.facecolor': '" + p.bg + "',",
      "  'savefig.facecolor': '" + p.bg + "',",
      "  'text.color': '" + p.fg + "', 'axes.labelcolor': '" + p.fg + "',",
      "  'axes.titlecolor': '" + p.fg + "',",
      "  'xtick.color': '" + p.fg + "', 'ytick.color': '" + p.fg + "',",
      "  'axes.edgecolor': '" + p.grid + "', 'grid.color': '" + p.grid + "',",
      "  'legend.facecolor': '" + p.bg + "', 'legend.edgecolor': '" + p.grid + "',",
      "  'axes.prop_cycle': _cy(color=" + p.cycle + "),",
      "})"
    ].join("\n");
  }

  var FIG_CAPTURE = [
    "def __grab_figures():",
    "    import sys, io, base64",
    "    out = []",
    "    if 'matplotlib.pyplot' in sys.modules:",
    "        plt = sys.modules['matplotlib.pyplot']",
    "        for n in plt.get_fignums():",
    "            f = plt.figure(n)",
    "            buf = io.BytesIO()",
    "            f.savefig(buf, format='png', dpi=140, bbox_inches='tight')",
    "            out.append(base64.b64encode(buf.getvalue()).decode())",
    "        plt.close('all')",
    "    return out",
    "__grab_figures()"
  ].join("\n");

  /* --- friendly error translation ------------------------- */
  var HINTS = [
    [/NameError: name '(.+?)' is not defined/, function (m) {
      return "Python has not seen “" + m[1] + "” yet.\n" +
             "• If it is defined in an earlier cell on this page, run that cell first — all cells share one interpreter.\n" +
             "• Otherwise check the spelling; Python is case-sensitive.";
    }],
    [/ModuleNotFoundError: No module named '(.+?)'/, function (m) {
      return "The library “" + m[1] + "” is not in this browser Python. numpy, matplotlib, scipy, sympy and pandas are available.";
    }],
    [/IndentationError|TabError/, function () {
      return "A spacing problem, not a maths problem. Every line inside a def / if / for starts with the same number of spaces (use 4).";
    }],
    [/SyntaxError: expected ':'/, function () {
      return "A colon is missing at the end of that line.";
    }],
    [/invalid value encountered|divide by zero encountered/, function () {
      return "NumPy hit 0/0 or √(negative) in real arithmetic. For these solutions that is expected — cast to complex first (np.emath.sqrt, or .astype(complex)).";
    }],
    [/TypeError: can't convert complex to float|ComplexWarning/, function () {
      return "These solutions are genuinely complex-valued. Plot np.abs(U) rather than U itself.";
    }],
    [/ValueError: operands could not be broadcast/, function () {
      return "Two arrays have different shapes. Print x.shape and y.shape — for a surface you usually want np.meshgrid first.";
    }],
    [/ZeroDivisionError/, function () {
      return "Something divided by zero. For the χ < 0 branch the denominator P + S·sinh(…) genuinely passes through zero — those are the poles.";
    }]
  ];

  function friendlyHint(text) {
    for (var i = 0; i < HINTS.length; i++) {
      var m = text.match(HINTS[i][0]);
      if (m) return HINTS[i][1](m);
    }
    return null;
  }

  function trimTraceback(text) {
    var lines = String(text).replace(/\s+$/, "").split("\n");
    var lastExec = -1;
    for (var i = 0; i < lines.length; i++) if (lines[i].indexOf("<exec>") !== -1) lastExec = i;
    var keep = lastExec >= 0 ? lines.slice(lastExec) : lines.slice(-5);
    keep = keep.filter(function (l) {
      return !/CodeRunner|coroutine = eval|self\.code|_pyodide|site-packages\/pyodide|importlib\._bootstrap/.test(l);
    }).map(function (l) {
      return l.replace(/^\s*File "<exec>", line (\d+).*$/, "In your code, line $1:");
    });
    keep = keep.filter(function (l, i) {
      if (!/^[\s^~]+$/.test(l) || !l.trim()) return true;
      return i > 0 && !/^In your code, line/.test(keep[i - 1]);
    });
    if (keep.length > 10) keep = keep.slice(-10);
    return keep.join("\n");
  }

  /* Every cell shares one interpreter and therefore one stdout buffer, so two
     runs in flight at once interleave their output into the wrong cell. Queue
     them instead, and grey out every Run button while any run is active. */
  var queue = Promise.resolve();
  var runButtons = [];

  function setRunnersBusy(busy) {
    runButtons.forEach(function (b) { b.disabled = busy; });
  }

  /* --- wire one .runner ----------------------------------- */
  function setupRunner(box) {
    var editor = box.querySelector(".editor");
    var runBtn = box.querySelector(".btn-run");
    var out = box.querySelector(".out");
    var figs = box.querySelector(".figs");
    if (!editor || !runBtn) return;
    var original = editor.value;

    function autoGrow() {
      editor.style.height = "auto";
      editor.style.height = (editor.scrollHeight + 4) + "px";
    }
    autoGrow();
    editor.addEventListener("input", autoGrow);

    editor.addEventListener("keydown", function (ev) {
      if (ev.key === "Tab") {
        ev.preventDefault();
        var s = editor.selectionStart, e = editor.selectionEnd;
        editor.value = editor.value.slice(0, s) + "    " + editor.value.slice(e);
        editor.selectionStart = editor.selectionEnd = s + 4;
        autoGrow();
      } else if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        run();
      }
    });

    var resetBtn = box.querySelector("[data-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        editor.value = original;
        autoGrow();
        out.textContent = "";
        out.className = "out";
        figs.innerHTML = "";
      });
    }

    function say(text, cls) {
      out.textContent = text;
      out.className = "out" + (cls ? " " + cls : "");
    }

    function run() {
      var code = editor.value;
      figs.innerHTML = "";
      setRunnersBusy(true);
      say("queued…", "is-wait");

      var wait = pyodide
        ? Promise.resolve(pyodide)
        : (say("Starting Python for the first time — about 15 seconds.\nAfter this every cell on the page runs instantly.", "is-wait"), bootPython());

      return wait.then(function (py) {
        var buffer = [];
        py.setStdout({ batched: function (s) { buffer.push(s); } });
        py.setStderr({ batched: function (s) { buffer.push(s); } });
        say("running…", "is-wait");

        return py.loadPackagesFromImports(code)
          .then(function () {
            if (!/matplotlib/.test(code)) return;
            if (mplReady) return py.runPythonAsync(themeRc());
            return py.runPythonAsync(MPL_SETUP)
              .then(function () { mplReady = true; })
              .then(function () { return py.runPythonAsync(themeRc()); });
          })
          .then(function () { return py.runPythonAsync(code); })
          .then(function (result) {
            var text = buffer.join("\n");
            if (result !== undefined && result !== null) {
              var repr = "";
              try { repr = result.toString(); } catch (e) { repr = ""; }
              if (result && typeof result.destroy === "function") result.destroy();
              if (repr) text += (text ? "\n" : "") + repr;
            }
            return py.runPythonAsync(FIG_CAPTURE).then(function (pngs) {
              var arr = pngs && pngs.toJs ? pngs.toJs() : (pngs || []);
              if (pngs && pngs.destroy) pngs.destroy();
              arr.forEach(function (b64) {
                var img = new Image();
                img.src = "data:image/png;base64," + b64;
                img.alt = "figure produced by this code";
                figs.appendChild(img);
              });
              if (!text && arr.length) say("", "");
              else say(text || "✓ ran without errors — nothing printed. Add a print(…) to see a value.", "");
            });
          })
          .catch(function (err) {
            var raw = (err && err.message) ? err.message : String(err);
            say(trimTraceback(raw), "is-err");
            var hint = friendlyHint(raw);
            if (hint) {
              var span = document.createElement("span");
              span.className = "hint-fix";
              span.textContent = hint;
              out.appendChild(span);
            }
          });
      }).catch(function (err) {
        say(String(err && err.message ? err.message : err), "is-err");
      }).then(function () {
        setRunnersBusy(false);
      });
    }

    runButtons.push(runBtn);
    runBtn.addEventListener("click", function () {
      /* chain onto the queue so runs never overlap */
      queue = queue.then(run, run);
    });
  }

  /* ---------------------------------------------------------
     5. Hero canvas — the report's own two solution branches
        plotted along xi, from Eqs. (19) and (20).
     --------------------------------------------------------- */
  function wireHero() {
    var cv = document.querySelector("[data-wave]");
    if (!cv) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var raf = null, safety = null, t0 = null;

    /* Both branches on real xi, where the solutions are bounded. P=3, S=2, R=3.
       chi = -5: delta itself, a kink running from +sqrt(5) to -sqrt(5). The
       denominator's zero at xi = -3.2672 is removable — the numerator vanishes
       there too — so the curve passes straight through it. */
    function tau(xi) {
      var P = 3, S = 2, R = 3, k = 2 * Math.sqrt(5);
      var a = k * (xi + R);
      var den = P + S * Math.sinh(a);
      var num = Math.sqrt(5 * (P * P + S * S)) - S * Math.sqrt(5) * Math.cosh(a);
      if (Math.abs(den) < 1e-7) return -S * Math.sqrt(5) * Math.sinh(a) / (S * Math.cosh(a));
      return num / den;
    }
    /* chi = +5: |delta|, periodic. sqrt(5(S^2-P^2)) is imaginary for P > S,
       so take the modulus of (i*q - S*sqrt(5)*cos(a)). Scaled to sit on the
       same axis as tau. */
    function ups(xi) {
      var P = 3, S = 2, R = 3, k = 2 * Math.sqrt(5);
      var a = k * (xi + R);
      var q = Math.sqrt(Math.abs(5 * (S * S - P * P)));
      var re = -S * Math.sqrt(5) * Math.cos(a);
      return 0.42 * Math.sqrt(q * q + re * re) / Math.abs(P + S * Math.sin(a));
    }

    function draw(progress) {
      var dpr = window.devicePixelRatio || 1;
      var w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      var g = cv.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      var cs = getComputedStyle(root);
      var cU = cs.getPropertyValue("--accent").trim() || "#4338CA";
      var cV = cs.getPropertyValue("--accent-2").trim() || "#B4232B";
      var cAx = cs.getPropertyValue("--border").trim() || "#D5D8E6";

      var padX = 10, padTop = 12, padBot = 18;
      var xiMin = -4.6, xiMax = -1.9, vMin = -2.5, vMax = 2.5;
      var X = function (xi) { return padX + (xi - xiMin) / (xiMax - xiMin) * (w - 2 * padX); };
      var Y = function (v) { return padTop + (vMax - v) / (vMax - vMin) * (h - padTop - padBot); };

      g.strokeStyle = cAx; g.lineWidth = 1; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(padX, Y(0)); g.lineTo(w - padX, Y(0)); g.stroke();
      g.setLineDash([]);

      var N = 900, cut = Math.floor(N * progress);
      [[ups, cV, 1.7], [tau, cU, 2.2]].forEach(function (spec) {
        g.strokeStyle = spec[1]; g.lineWidth = spec[2];
        g.lineJoin = "round"; g.lineCap = "round";
        g.beginPath();
        var pen = false;
        for (var i = 0; i <= cut; i++) {
          var xi = xiMin + (xiMax - xiMin) * i / N;
          var v = spec[0](xi);
          if (!isFinite(v) || v > vMax || v < vMin) { pen = false; continue; }
          var px = X(xi), py = Y(v);
          pen ? g.lineTo(px, py) : g.moveTo(px, py);
          pen = true;
        }
        g.stroke();
      });
    }

    function finish() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (safety) { clearTimeout(safety); safety = null; }
      draw(1);
    }
    function animate(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 900);
      if (p >= 1) { finish(); return; }
      draw(1 - Math.pow(1 - p, 3));
      raf = requestAnimationFrame(animate);
    }
    function start() {
      if (raf) cancelAnimationFrame(raf);
      if (safety) clearTimeout(safety);
      t0 = null;
      if (reduce || document.hidden) { draw(1); return; }
      safety = setTimeout(finish, 1500);
      raf = requestAnimationFrame(animate);
    }

    start();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) finish(); });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { draw(1); }, 120); });
    document.addEventListener("themechange", function () { draw(1); });
  }

  /* ---------------------------------------------------------
     6. Boot
     --------------------------------------------------------- */
  function init() {
    renderNav();
    renderNavShow();
    renderPageNav();
    paintThemeButtons();
    wireQA();
    wireHero();

    var runners = document.querySelectorAll(".runner");
    Array.prototype.forEach.call(runners, setupRunner);

    var status = document.querySelector("[data-py-status]");
    if (status) {
      listeners.push(function (msg, state) {
        status.textContent = msg;
        status.className = "chip " + (state === "ready" ? "chip-accent" : state === "error" ? "chip-warn" : "chip-2");
      });
    }

    /* Start fetching Python quietly so the first Run feels instant. */
    if (runners.length) {
      var kick = function () { bootPython().catch(function () {}); };
      if (window.requestIdleCallback) requestIdleCallback(kick, { timeout: 3000 });
      else setTimeout(kick, 1500);
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
