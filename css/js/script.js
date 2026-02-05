// ===== helper =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Intro animation (shows once per session) =====
(function introOnce(){
  const intro = $("#intro");
  if (!intro) return;
  const seen = sessionStorage.getItem("bmwIntroSeen");
  if (seen) {
    intro.classList.add("hide");
    return;
  }
  setTimeout(() => {
    intro.classList.add("hide");
    sessionStorage.setItem("bmwIntroSeen","yes");
  }, 1200);
})();

// ===== Active nav link =====
(function activeNav(){
  const file = location.pathname.split("/").pop() || "index.html";
  $$(".nav-link").forEach(a=>{
    const href = a.getAttribute("href");
    if (href === file) a.classList.add("active");
  });
})();

// ===== Contact form: validate + store message =====
(function contactForm(){
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const name = $("#fullName").value.trim();
    const email = $("#email").value.trim();
    const topic = $("#topic").value;
    const msg = $("#message").value.trim();
    const agree = $("#agree").checked;

    if (!name || !email || !topic || !msg || !agree){
      alert("Please complete all fields and accept the policy.");
      return;
    }

    const payload = {
      name,
      email,
      topic,
      msg,
      time: new Date().toLocaleString()
    };

    const old = JSON.parse(localStorage.getItem("bmwMessages") || "[]");
    old.push(payload);
    localStorage.setItem("bmwMessages", JSON.stringify(old));

    $("#formStatus").textContent = "✅ Message saved. Thank you!";
    form.reset();
  });
})();

// ===== Compare: filter table by category =====
(function compareFilter(){
  const filter = $("#categoryFilter");
  if (!filter) return;

  filter.addEventListener("change", ()=>{
    const val = filter.value;
    $$("#compareTable tbody tr").forEach(row=>{
      const cat = row.dataset.cat;
      row.style.display = (val === "all" || val === cat) ? "" : "none";
    });
  });
})();

// ===== Add-to-compare (from Models page) =====
(function addToCompare(){
  const buttons = $$(".add-compare");
  if (!buttons.length) return;

  buttons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const model = btn.dataset.model;
      const pick = JSON.parse(localStorage.getItem("bmwCompare") || "[]");
      if (!pick.includes(model)) pick.push(model);
      localStorage.setItem("bmwCompare", JSON.stringify(pick));
      alert(model + " added to Compare. Open Compare page.");
    });
  });
})();

// ===== Simple calculator (Tools page) =====
(function calc(){
  const form = $("#calcForm");
  if (!form) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const price = Number($("#price").value);
    const deposit = Number($("#deposit").value);
    const months = Number($("#months").value);

    if (price <= 0 || deposit < 0 || months <= 0){
      $("#calcOut").textContent = "Please enter valid numbers.";
      return;
    }

    const loan = Math.max(price - deposit, 0);
    const perMonth = loan / months;

    $("#calcOut").textContent =
      `Estimated monthly payment: ${perMonth.toFixed(2)} (currency units). Loan amount: ${loan.toFixed(2)}.`;
  });
})();
// ===== BMW Calculator (runs only if calculator exists) =====
(function () {
  const main = document.getElementById("calcMain");
  const mini = document.getElementById("calcMini");
  const badge = document.getElementById("calcMemoryBadge");
  const grid = document.querySelector(".calc-grid");

  if (!main || !mini || !grid) return; // only run on calculator page

  let current = "0";
  let memory = Number(localStorage.getItem("bmw_calc_memory") || "0");
  updateBadge();

  function updateBadge() {
    badge.textContent = `MEM: ${memory === 0 ? "—" : memory}`;
  }

  function setMain(value) {
    current = value;
    main.textContent = current;
  }

  function setMini(value) {
    mini.textContent = value;
  }

  function safeEval(expr) {
    // basic protection: allow digits, operators, dot, spaces
    const ok = /^[0-9+\-*/().\s]+$/.test(expr);
    if (!ok) return null;

    try {
      const result = Function(`"use strict"; return (${expr})`)();
      if (!isFinite(result)) return null;
      return result;
    } catch {
      return null;
    }
  }

  function inputValue(v) {
    if (v === ".") {
      // prevent multiple dots in last number
      const parts = current.split(/[\+\-\*\/]/);
      const last = parts[parts.length - 1];
      if (last.includes(".")) return;
    }

    if (current === "0" && "0123456789".includes(v)) {
      setMain(v);
    } else {
      setMain(current + v);
    }
  }

  function clearAll() {
    setMain("0");
    setMini("Ready");
  }

  function backspace() {
    if (current.length <= 1) return setMain("0");
    setMain(current.slice(0, -1));
  }

  function percent() {
    const val = safeEval(current);
    if (val === null) return setMini("Invalid input");
    setMini(`${val} ÷ 100`);
    setMain(String(val / 100));
  }

  function equals() {
    const val = safeEval(current);
    if (val === null) {
      setMini("Invalid input");
      return;
    }
    setMini(current);
    setMain(String(Number(val.toFixed(10))));
  }

  function addMemory() {
    const val = safeEval(current);
    if (val === null) return setMini("Nothing to store");
    memory += Number(val);
    localStorage.setItem("bmw_calc_memory", String(memory));
    setMini(`Stored: +${val}`);
    updateBadge();
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const v = btn.getAttribute("data-value");
    const action = btn.getAttribute("data-action");

    if (v) return inputValue(v);

    if (action === "clear") return clearAll();
    if (action === "backspace") return backspace();
    if (action === "percent") return percent();
    if (action === "equals") return equals();
    if (action === "memory") return addMemory();
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    const key = e.key;

    if ("0123456789".includes(key)) return inputValue(key);
    if (["+","-","*","/","."].includes(key)) return inputValue(key);

    if (key === "Enter" || key === "=") {
      e.preventDefault();
      return equals();
    }
    if (key === "Backspace") return backspace();
    if (key === "Escape") return clearAll();
  });

  // start
  setMini("Ready");
  setMain("0");
})();
