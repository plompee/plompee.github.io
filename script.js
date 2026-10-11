(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#05070a" : "#f5f7fa");
    readCanvasColors();
  }

  themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
  });

  /* ---------- Mobile menu + nav state ---------- */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menu-toggle");
  var links = document.getElementById("nav-links");

  function setMenu(open) {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(!links.classList.contains("open"));
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  window.addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  /* ---------- Neural network background ---------- */
  var canvas = document.getElementById("neural");
  var ctx = canvas.getContext("2d");
  var nodes = [];
  var W = 0, H = 0;
  var nodeRGB = "61, 255, 168", linkRGB = "34, 211, 238";

  function readCanvasColors() {
    nodeRGB = cssVar("--node") || nodeRGB;
    linkRGB = cssVar("--link") || linkRGB;
    if (reduced) drawFrame();
  }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes() {
    nodes = [];
    var count = Math.min(70, Math.floor((W * H) / 18000));
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    var linkDist = 130;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      if (!reduced) {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
        if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < linkDist) {
          ctx.strokeStyle = "rgba(" + linkRGB + "," + ((1 - d / linkDist) * 0.16).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = "rgba(" + nodeRGB + ", 0.5)";
    for (var k = 0; k < nodes.length; k++) {
      ctx.beginPath();
      ctx.arc(nodes[k].x, nodes[k].y, nodes[k].r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (!document.hidden) drawFrame();
    requestAnimationFrame(loop);
  }

  sizeCanvas();
  initNodes();
  readCanvasColors();
  if (reduced) drawFrame(); else requestAnimationFrame(loop);
  window.addEventListener("resize", function () {
    sizeCanvas();
    initNodes();
    if (reduced) drawFrame();
  });

  /* ---------- Terminal boot sequence ---------- */
  var term = document.getElementById("term-body");
  var PROMPT = '<span class="t-prompt">dima@kent:~$</span> ';
  var OK = '<span class="t-ok">[ ok ]</span> ';
  var script = [
    { cmd: "plompee init --profile" },
    { out: OK + "loading degree        <span class=\"t-dim\">bsc-cs-ai@kent</span>" },
    { out: OK + "mounting experience   <span class=\"t-dim\">apex27/ai-automation</span>" },
    { out: OK + "starting runtimes     <span class=\"t-dim\">python, javascript</span>" },
    { out: OK + "demos online          <span class=\"t-dim\">3/3</span>" },
    { out: '<span class="t-key">plompee init...</span> <span class="t-ok">completed</span>' },
    { cmd: "whoami --json" },
    { out: "{" },
    { out: '  <span class="t-key">"name"</span>: <span class="t-str">"Dima Livak"</span>,' },
    { out: '  <span class="t-key">"location"</span>: <span class="t-str">"Canterbury, UK"</span>,' },
    { out: '  <span class="t-key">"skills"</span>: [<span class="t-str">"python"</span>, <span class="t-str">"javascript"</span>, <span class="t-str">"ai-automation"</span>],' },
    { out: '  <span class="t-key">"status"</span>: <span class="t-str">"open_to_remote_part_time"</span>,' },
    { out: '  <span class="t-key">"hours_per_week"</span>: <span class="t-num">20</span>' },
    { out: "}" }
  ];
  var runId = 0;

  function renderStatic() {
    var html = "";
    script.forEach(function (s) {
      html += s.cmd ? PROMPT + '<span class="t-cmd">' + s.cmd + "</span>\n" : s.out + "\n";
    });
    term.innerHTML = html + PROMPT + '<span class="cursor"></span>';
  }

  function runTerminal() {
    var id = ++runId;
    var done = "";
    var i = 0;

    function alive() { return id === runId; }
    function show(extra) { term.innerHTML = done + extra; }

    function next() {
      if (!alive()) return;
      if (i >= script.length) {
        show(PROMPT + '<span class="cursor"></span>');
        return;
      }
      var s = script[i++];
      if (s.out) {
        done += s.out + "\n";
        show("");
        setTimeout(next, 110 + Math.random() * 120);
        return;
      }
      var c = 0;
      (function type() {
        if (!alive()) return;
        if (c <= s.cmd.length) {
          show(PROMPT + '<span class="t-cmd">' + s.cmd.slice(0, c) + '</span><span class="cursor"></span>');
          c++;
          setTimeout(type, 45 + Math.random() * 55);
        } else {
          done += PROMPT + '<span class="t-cmd">' + s.cmd + "</span>\n";
          setTimeout(next, 320);
        }
      })();
    }

    done = "";
    show(PROMPT + '<span class="cursor"></span>');
    setTimeout(next, 600);
  }

  if (reduced) renderStatic(); else runTerminal();
  document.getElementById("term-replay").addEventListener("click", function () {
    if (reduced) renderStatic(); else runTerminal();
  });

  /* ---------- Typewriter role cycler ---------- */
  var roles = [
    "computer science & AI student",
    "AI automation builder",
    "3 yrs of customer service",
    "remote-work ready"
  ];
  var roleEl = document.getElementById("role-typed");

  if (!reduced) {
    var ri = 0, ci = roles[0].length, deleting = true;
    var tick = function () {
      var word = roles[ri];
      if (deleting) {
        ci--;
        roleEl.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          ri = (ri + 1) % roles.length;
          return setTimeout(tick, 350);
        }
        return setTimeout(tick, 32);
      }
      ci++;
      roleEl.textContent = word.slice(0, ci);
      if (ci === word.length) {
        deleting = true;
        return setTimeout(tick, 1900);
      }
      setTimeout(tick, 65 + Math.random() * 45);
    };
    setTimeout(tick, 2400);
  }

  /* ---------- Live UK clock ---------- */
  var clockEl = document.getElementById("clock");
  function updateClock() {
    try {
      clockEl.textContent = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/London"
      });
    } catch (e) {
      clockEl.textContent = "";
    }
  }
  updateClock();
  setInterval(updateClock, 15000);

  /* ---------- Cursor spotlight on cards and tags ---------- */
  document.addEventListener("pointermove", function (e) {
    var card = e.target.closest && e.target.closest(".glow-card");
    if (card) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }
    var tag = e.target.closest && e.target.closest(".tags li");
    if (tag) {
      var t = tag.getBoundingClientRect();
      tag.style.setProperty("--tx", (e.clientX - t.left) + "px");
      tag.style.setProperty("--ty", (e.clientY - t.top) + "px");
    }
  }, { passive: true });

  /* ---------- Scroll reveal, meters, active nav link ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var meterGroups = document.querySelectorAll(".meters");

  function fillMeters(group) {
    group.querySelectorAll(".meter-bar i").forEach(function (f, idx) {
      setTimeout(function () { f.style.width = f.getAttribute("data-w") + "%"; }, reduced ? 0 : idx * 120);
    });
  }

  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });

    var ioMeters = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          fillMeters(e.target);
          ioMeters.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    meterGroups.forEach(function (g) { ioMeters.observe(g); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
    meterGroups.forEach(fillMeters);
  }

  if ("IntersectionObserver" in window) {
    var navLinks = links.querySelectorAll("a");
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { ioNav.observe(s); });
  }
})();
