// ===============================
// 1) 기상청 월평균 기반 "기본 일사량(PSH)" 표 (템플릿)
// ===============================
// ※ 여기 숫자는 예시/템플릿입니다.
//    대표님이 기상청 공개자료에서 지역별 월평균(PSH 또는 일사량→PSH 변환)을 확보하면
//    아래 값만 바꾸면 앱 전체 기본값이 즉시 정확해집니다.
//
// 구조: region -> month(1~12) -> psh(hours/day)
const KMA_PSH_TABLE = {
  "전국(기본)": { 1: 3.0, 2: 3.4, 3: 4.2, 4: 5.0, 5: 5.3, 6: 4.8, 7: 4.3, 8: 4.6, 9: 4.7, 10: 4.2, 11: 3.4, 12: 2.9 },
  "서울/경기":   { 1: 2.8, 2: 3.2, 3: 4.0, 4: 4.8, 5: 5.1, 6: 4.6, 7: 4.1, 8: 4.4, 9: 4.5, 10: 4.0, 11: 3.2, 12: 2.7 },
  "충청":       { 1: 3.0, 2: 3.5, 3: 4.3, 4: 5.1, 5: 5.4, 6: 4.9, 7: 4.4, 8: 4.7, 9: 4.8, 10: 4.3, 11: 3.5, 12: 2.9 },
  "전라":       { 1: 3.1, 2: 3.6, 3: 4.4, 4: 5.2, 5: 5.5, 6: 5.0, 7: 4.5, 8: 4.8, 9: 4.9, 10: 4.4, 11: 3.6, 12: 3.0 },
  "경상":       { 1: 3.0, 2: 3.5, 3: 4.3, 4: 5.1, 5: 5.4, 6: 4.9, 7: 4.4, 8: 4.7, 9: 4.8, 10: 4.3, 11: 3.5, 12: 2.9 },
  "강원":       { 1: 2.7, 2: 3.1, 3: 3.9, 4: 4.7, 5: 5.0, 6: 4.5, 7: 4.0, 8: 4.3, 9: 4.4, 10: 3.9, 11: 3.1, 12: 2.6 },
  "제주":       { 1: 3.2, 2: 3.7, 3: 4.5, 4: 5.3, 5: 5.6, 6: 5.1, 7: 4.6, 8: 4.9, 9: 5.0, 10: 4.5, 11: 3.7, 12: 3.1 }
};

// ===============================
// 2) 기본 입력값 (대표님 스타일에 맞게 보수/공격 조절 가능)
// ===============================
const DEFAULTS = {
  systemEff: 85,     // %
  pshFallback: 3.6   // 예전 대표님 기본값(평균 3.6h) - 표가 비어도 동작하도록
};

// ===============================
// 3) DOM
// ===============================
const $region = document.getElementById("region");
const $month = document.getElementById("month");
const $psh = document.getElementById("psh");
const $systemEff = document.getElementById("systemEff");
const $calcBtn = document.getElementById("calcBtn");
const $resetBtn = document.getElementById("resetBtn");
const $result = document.getElementById("result");
const $basisNote = document.getElementById("basisNote");

// ===============================
// 4) 초기화: 지역/월 옵션 채우기 + 현재월 선택 + 기본값 자동 반영
// ===============================
function init() {
  // 지역 옵션
  const regions = Object.keys(KMA_PSH_TABLE);
  $region.innerHTML = regions.map(r => `<option value="${r}">${r}</option>`).join("");

  // 월 옵션
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  $month.innerHTML = Array.from({length:12}, (_,i)=>{
    const m = i+1;
    return `<option value="${m}">${m}월</option>`;
  }).join("");
  $month.value = String(nowMonth);

  // 저장값 복원
  const saved = loadState();
  if (saved) {
    $region.value = saved.region || regions[0];
    $month.value = String(saved.month || nowMonth);
    $psh.value = saved.psh ?? "";
    $systemEff.value = saved.systemEff ?? DEFAULTS.systemEff;
  } else {
    $systemEff.value = DEFAULTS.systemEff;
    applyAutoPSH(); // 자동 일사량 적용
  }

  // 이벤트
  $region.addEventListener("change", () => {
    applyAutoPSH();
    saveState();
  });
  $month.addEventListener("change", () => {
    applyAutoPSH();
    saveState();
  });
  $psh.addEventListener("input", saveState);
  $systemEff.addEventListener("input", saveState);

  $calcBtn.addEventListener("click", onCalc);
  $resetBtn.addEventListener("click", onReset);

  renderBasisNote();
}

// 지역+월 기반 PSH 자동 입력
function applyAutoPSH() {
  const region = $region.value;
  const month = Number($month.value);
  const pshFromTable = KMA_PSH_TABLE?.[region]?.[month];

  // 값이 있으면 표 값 사용, 없으면 대표님 기본값 3.6으로 폴백
  const psh = (typeof pshFromTable === "number")
    ? pshFromTable
    : DEFAULTS.pshFallback;

  $psh.value = String(round1(psh));
  renderBasisNote();
}

// 안내 문구
function renderBasisNote() {
  const region = $region.value;
  const month = $month.value;
  $basisNote.textContent =
    `기준값: ${region} / ${month}월 월평균(기상청 공개자료 기반) 기본 일사량(PSH) 자동 설정`;
}

// ===============================
// 5) 계산 (현재는 샘플 계산 구조)
//    대표님 기존 수익 로직이 있으면 여기에 그대로 붙이면 됩니다.
// ===============================
function onCalc() {
  const psh = Number($psh.value);
  const eff = Number($systemEff.value) / 100;

  if (!isFinite(psh) || psh <= 0) {
    $result.textContent = "기본 일사량(PSH)을 올바르게 입력해 주세요.";
    return;
  }
  if (!isFinite(eff) || eff <= 0 || eff > 1) {
    $result.textContent = "시스템 효율(%)을 올바르게 입력해 주세요.";
    return;
  }

  // 예시: 1kW 기준 일 발전량(kWh/day) ≈ PSH * 효율
  const kwhPerDayPerKW = psh * eff;

  // 예시 출력 (대표님 수익 계산 로직이 있으면 여기서 연결)
  $result.innerHTML = `
    <b>기본 발전량(예시)</b><br/>
    1kW 기준 일 발전량 ≈ <b>${round2(kwhPerDayPerKW)} kWh/일</b><br/>
    <span class="muted tiny">※ 본 값은 PSH(피크일사시간) × 시스템효율 기반의 간이 예측이며, 현장 조건에 따라 달라질 수 있습니다.</span>
  `;
}

// ===============================
// 6) 리셋
// ===============================
function onReset() {
  localStorage.removeItem("solar_pwa_state");
  $systemEff.value = DEFAULTS.systemEff;
  applyAutoPSH();
  $result.textContent = "기본값으로 초기화되었습니다. 계산하기를 눌러 결과를 확인하세요.";
}

// ===============================
// 7) 상태 저장/복원
// ===============================
function saveState() {
  const state = {
    region: $region.value,
    month: Number($month.value),
    psh: $psh.value === "" ? null : Number($psh.value),
    systemEff: $systemEff.value === "" ? null : Number($systemEff.value)
  };
  localStorage.setItem("solar_pwa_state", JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem("solar_pwa_state");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ===============================
// util
// ===============================
function round1(n){ return Math.round(n*10)/10; }
function round2(n){ return Math.round(n*100)/100; }

// start
init();

