function $(id) { return document.getElementById(id); }

function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function fmtKwh(x) { return `${x.toFixed(1)} kWh`; }
function fmtWon(x) { return `${Math.round(x).toLocaleString("ko-KR")} 원`; }

function calculate() {
  const capacityKw = Number($("capacityKw").value);
  const sunHours = Number($("sunHours").value);
  const eff = clamp01(Number($("eff").value));
  const selfUseRatio = clamp01(Number($("selfUseRatio").value));
  const kwhPrice = Number($("kwhPrice").value);
  const smpPrice = Number($("smpPrice").value);
  const recPerKwh = Number($("recPerKwh").value);
  const daysInMonth = Number($("daysInMonth").value);

  const dailyKwh = capacityKw * sunHours * eff;
  const monthlyKwh = dailyKwh * daysInMonth;

  const selfUseKwh = monthlyKwh * selfUseRatio;
  const surplusKwh = monthlyKwh - selfUseKwh;

  const savingWon = selfUseKwh * kwhPrice;
  const smpWon = surplusKwh * smpPrice;
  const recWon = monthlyKwh * recPerKwh;

  const totalWon = savingWon + smpWon + recWon;

  $("dailyKwh").textContent = fmtKwh(dailyKwh);
  $("monthlyKwh").textContent = fmtKwh(monthlyKwh);
  $("savingWon").textContent = fmtWon(savingWon);
  $("smpWon").textContent = fmtWon(smpWon);
  $("recWon").textContent = fmtWon(recWon);
  $("totalWon").textContent = fmtWon(totalWon);

  localStorage.setItem("solar_pwa_state", JSON.stringify({
    capacityKw, sunHours, eff, selfUseRatio, kwhPrice, smpPrice, recPerKwh, daysInMonth
  }));
}

function resetDefaults() {
  $("capacityKw").value = 20;
  $("sunHours").value = 3.6;
  $("eff").value = 0.90;
  $("selfUseRatio").value = 0.30;
  $("kwhPrice").value = 180;
  $("smpPrice").value = 110;
  $("recPerKwh").value = 70;
  $("daysInMonth").value = 30;
  calculate();
}

function restoreState() {
  const raw = localStorage.getItem("solar_pwa_state");
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (typeof s.capacityKw === "number") $("capacityKw").value = s.capacityKw;
    if (typeof s.sunHours === "number") $("sunHours").value = s.sunHours;
    if (typeof s.eff === "number") $("eff").value = s.eff;
    if (typeof s.selfUseRatio === "number") $("selfUseRatio").value = s.selfUseRatio;
    if (typeof s.kwhPrice === "number") $("kwhPrice").value = s.kwhPrice;
    if (typeof s.smpPrice === "number") $("smpPrice").value = s.smpPrice;
    if (typeof s.recPerKwh === "number") $("recPerKwh").value = s.recPerKwh;
    if (typeof s.daysInMonth === "number") $("daysInMonth").value = s.daysInMonth;
  } catch (e) {}
}

window.addEventListener("DOMContentLoaded", () => {
  restoreState();

  const calcBtn = $("calcBtn");
  const resetBtn = $("resetBtn");

  if (calcBtn) calcBtn.addEventListener("click", calculate);
  if (resetBtn) resetBtn.addEventListener("click", resetDefaults);

  ["capacityKw","sunHours","eff","selfUseRatio","kwhPrice","smpPrice","recPerKwh","daysInMonth"]
    .forEach(id => $(id)?.addEventListener("input", calculate));

  calculate();
});
