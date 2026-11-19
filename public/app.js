/* Cloud Deploy — interactions: console run, reveal, greeting, copy. */
document.documentElement.classList.add("js");

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky header ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length > 0) {
    var groups = new Map();
    reveals.forEach(function (el) {
      var parent = el.parentElement;
      var index = groups.get(parent) || 0;
      groups.set(parent, index + 1);
      el.style.transitionDelay = Math.min(index * 45, 180) + "ms";
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
      );
      reveals.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---------- deployment console ---------- */
  var consoleEl = document.querySelector(".console");
  var stageEls = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));
  var logEl = document.getElementById("log");
  var stateEl = document.getElementById("consoleState");
  var replayBtn = document.getElementById("replay");
  var copyBtn = document.getElementById("copyBuild");

  var steps = [
    { log: "✓ repository checked out" },
    { log: "✓ npm ci — 0 vulnerabilities" },
    { log: "✓ smoke test passed" },
    { log: "✓ image built from nginx:alpine" },
    { log: "✓ pushed pbl-clg:latest" },
    { log: "✓ container live on :80" }
  ];

  var timers = [];
  var started = false;

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }

  function appendLog(text, className) {
    if (!logEl) return;
    var line = document.createElement("span");
    line.className = "log-line" + (className ? " " + className : "");
    line.textContent = text;
    logEl.appendChild(line);
  }

  function setStage(index, state) {
    var el = stageEls[index];
    if (!el) return;
    el.classList.remove("is-running", "is-done");
    if (state) el.classList.add("is-" + state);
    var status = el.querySelector(".stage-status");
    if (status) {
      status.textContent = state === "done" ? "done" : state === "running" ? "running" : "waiting";
    }
  }

  function finishInstantly() {
    stageEls.forEach(function (_, index) { setStage(index, "done"); });
    if (logEl) logEl.innerHTML = "";
    appendLog("$ git push origin pbl", "log-dim");
    steps.forEach(function (step) { appendLog(step.log, "log-ok"); });
    if (stateEl) {
      stateEl.textContent = "live";
      stateEl.classList.remove("is-running");
      stateEl.classList.add("is-live");
    }
  }

  function runConsole() {
    clearTimers();
    stageEls.forEach(function (_, index) { setStage(index, null); });
    if (logEl) logEl.innerHTML = "";
    if (stateEl) {
      stateEl.textContent = "running";
      stateEl.classList.remove("is-live");
      stateEl.classList.add("is-running");
    }

    if (reduceMotion) {
      finishInstantly();
      return;
    }

    appendLog("$ git push origin pbl", "log-dim");
    setStage(0, "running");

    var elapsed = 420;
    steps.forEach(function (step, index) {
      timers.push(
        setTimeout(function () {
          stageEls.forEach(function (_, i) {
            if (i < index) setStage(i, "done");
          });
          setStage(index, "running");
        }, elapsed)
      );

      elapsed += 560 + index * 40;
      timers.push(
        setTimeout(function () {
          setStage(index, "done");
          appendLog(step.log, "log-ok");
          if (index === steps.length - 1 && stateEl) {
            stateEl.textContent = "live";
            stateEl.classList.remove("is-running");
            stateEl.classList.add("is-live");
          }
        }, elapsed)
      );
    });
  }

  function startOnce() {
    if (started) return;
    started = true;
    runConsole();
  }

  if (consoleEl && "IntersectionObserver" in window && !reduceMotion) {
    var consoleObserver = new IntersectionObserver(
      function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          startOnce();
          consoleObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    consoleObserver.observe(consoleEl);
    timers.push(setTimeout(startOnce, 1600));
  } else {
    startOnce();
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", function () {
      started = true;
      runConsole();
    });
  }

  /* ---------- copy build command ---------- */
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var command = "docker build -t pbl-clg .";
      var codeEl = copyBtn.parentElement && copyBtn.parentElement.parentElement
        ? copyBtn.parentElement.parentElement.querySelector("code")
        : null;
      var original = copyBtn.textContent;

      function feedback(text) {
        copyBtn.textContent = text;
        setTimeout(function () { copyBtn.textContent = original; }, 1400);
      }

      function selectCommand() {
        if (!codeEl) return feedback("copy failed");
        var range = document.createRange();
        range.selectNodeContents(codeEl);
        var selection = window.getSelection();
        if (!selection) return feedback("copy failed");
        selection.removeAllRanges();
        selection.addRange(range);
        feedback("selected");
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(command).then(
          function () { feedback("copied"); },
          selectCommand
        );
      } else {
        selectCommand();
      }
    });
  }

  /* ---------- hello form ---------- */
  var form = document.getElementById("helloForm");
  var input = document.getElementById("name");
  var greeting = document.getElementById("greeting");
  var greetingText = document.getElementById("greetingText");

  if (form && input && greeting && greetingText) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = input.value.trim().replace(/\s+/g, " ");
      greetingText.textContent = name
        ? "Hello, " + name + ". Welcome to the deployed site."
        : "Hello, world. Welcome to the deployed site.";
      greeting.classList.remove("is-answered");
      void greeting.offsetWidth;
      greeting.classList.add("is-answered");
      input.value = name;
      input.focus();
    });
  }
})();
