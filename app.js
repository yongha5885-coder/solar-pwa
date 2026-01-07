(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    capKw: $("capKw"),
    psh: $("psh"),
    eff: $("eff"),
    selfRatio: $("selfRatio"),
    tariff: $("tariff"),
    smp: $("smp"),
    rec: $("rec"),
    days: $("days"),
    calcBtn: $("calcBtn"),
    resetBtn: $("resetBtn"),

    outDayKwh: $("outDayKwh"),
    outMonKwh: $("outMonKwh"),
    outSave: $("outSave"),
    outSmp: $("outSmp"),
    outRec: $("outRec"),
    outTotal: $("outTotal"),
  };

  const defaults = {
    capKw: 20,
    psh: 3.6,
    eff: 0.9,
    selfRatio: 0.3,
    tariff: 180,
    smp: 110,
    rec: 70,
    days: 30,
  };

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp01(v) {
    if (!Number.isFinite(v)) return NaN;
    return Math.min(1, Math.max(0, v));
  }

  function fmtKwh(v) {
    if (!Number.isFinite(v)) return "-";
    return `${v.toFixed(1)} kWh`;
  }

  function fmtWon(v) {
    if (!Number.isFinite(v)) return "-";
    const rounded = Math.round(v);
    return `${rounded.toLocaleString("ko-KR")} 원`;
  }

  function calc() {
    const capKw = num(els.capKw.value);
    const psh = num(els.psh.value);
    const eff = clamp01(num(els.eff.value));
    const selfRatio = clamp01(num(els.selfRatio.value));
    const tariff = num(els.tariff.value);
    const smp = num(els.smp.value);
    const rec = num(els.rec.value);
    const days = num(els.days.value);

    // 필수값 검증
    const must = [capKw, psh, eff, selfRatio, tariff, smp, rec, days];
    if (must.some((x) => !Number.isFinite(x)) || capKw <= 0 || psh <= 0 || days <= 0) {
      // 값이 이상하면 결과를 비움
      els.outDayKwh.textContent = "-";
      els.outMonKwh.textContent = "-";
      els.outSave.textContent = "-";
      els.outSmp.textContent = "-";
      els.outRec.textContent = "-";
      els.outTotal.textContent = "-";
      alert("입력값을 확인해주세요. (숫자/범위 오류)");
      return;
    }

    // 발전량(kWh) = 설비용량(kW) * 일사량(시간/일) * 효율
    const dayKwh = capKw * psh * eff;
    const monKwh = dayKwh * days;

    const selfKwh = monKwh * selfRatio;
    const exportKwh = monKwh - selfKwh;

    const saveWon = selfKwh * tariff;         // 자가소비 절감
    const smpWon = exportKwh * smp;           // 잉여 판매(SMP)
    const recWon = monKwh * rec;              // REC는 단순 환산(추정)
    const totalWon = saveWon + smpWon + recWon;

    els.outDayKwh.textContent = fmtKwh(dayKwh);
    els.outMonKwh.textContent = fmtKwh(monKwh);
    els.outSave.textContent = fmtWon(saveWon);
    els.outSmp.textContent = fmtWon(smpWon);
    els.outRec.textContent = fmtWon(recWon);
    els.outTotal.textContent = fmtWon(totalWon);
  }

  function reset() {
    els.capKw.value = defaults.capKw;
    els.psh.value = defaults.psh;
    els.eff.value = defaults.eff.toFixed(2);
    els.selfRatio.value = defaults.selfRatio.toFixed(2);
    els.tariff.value = defaults.tariff;
    els.smp.value = defaults.smp;
    els.rec.value = defaults.rec;
    els.days.value = defaults.days;
    calc();
  }

  // 이벤트 연결
  window.addEventListener("DOMContentLoaded", () => {
    els.calcBtn?.addEventListener("click", calc);
    els.resetBtn?.addEventListener("click", reset);

    // 엔터 눌러도 계산되게
    ["capKw","psh","eff","selfRatio","tariff","smp","rec","days"].forEach((id) => {
      $(id)?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") calc();
      });
    });

    // 초기 1회 계산
    calc();
  });
})();


