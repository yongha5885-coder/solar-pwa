(() => {
  const $ = (id) => document.getElementById(id);

  // 1) 지역×월 PSH 테이블(현재는 템플릿 숫자)
  const KMA_PSH_TABLE = {
    "전국(기본)": {1:3.0,2:3.4,3:4.2,4:5.0,5:5.3,6:4.8,7:4.3,8:4.6,9:4.7,10:4.2,11:3.4,12:2.9},
    "서울/경기":   {1:2.8,2:3.2,3:4.0,4:4.8,5:5.1,6:4.6,7:4.1,8:4.4,9:4.5,10:4.0,11:3.2,12:2.7},
    "충청":       {1:3.0,2:3.5,3:4.3,4:5.1,5:5.4,6:4.9,7:4.4,8:4.7,9:4.8,10:4.3,11:3.5,12:2.9},
    "전라":       {1:3.1,2:3.6,3:4.4,4:5.2,5:5.5,6:5.0,7:4.5,8:4.8,9:4.9,10:4.4,11:3.6,12:3.0},
    "경상":       {1:3.0,2:3.5,3:4.3,4:5.1,5:5.4,6:4.9,7:4.4,8:4.7,9:4.8,10:4.3,11:3.5,12:2.9},
    "강원":       {1:2.7,2:3.1,3:3.9,4:4.7,5:5.0,6:4.5,7:4.0,8:4.3,9:4.4,10:3.9,11:3.1,12:2.6},
    "제주":       {1:3.2,2:3.7,3:4.5,4:5.3,5:5.6,6:5.1,7:4.6,8:4.9,9:5.0,10:4.5,11:3.7,12:3.1}
  };

  const els = {
    region: $("region"),
    month: $("month"),
    psh: $("psh"),
    systemEff: $("systemEff"),
    capKw: $("capKw"),
    days: $("days"),
    selfRatio: $("selfRatio"),
    tariff: $("tariff"),
    smp: $("smp"),
    rec: $("rec"),
    calcBtn: $("calcBtn"),
    resetBtn: $("resetBtn"),
    basisNote: $("basisNote"),

    outDayKwh: $("outDayKwh"),
    outMonKwh: $("outMonKwh"),
    outSave: $("outSave"),
    outSmp: $("outSmp"),
    outRec: $("outRec"),
    outTotal: $("outTotal"),

    actualMonKwh: $("actualMonKwh"),
    errPct: $("errPct"),

    stn: $("stn"),
    dateRange: $("dateRange"),
    fetchObsBtn: $("fetchObsBtn"),
    apiStatus: $("apiStatus"),
  };

const defaults = {
  systemEff: 100,
  capKw: 20,
  days: 30,
  selfRatioPct: 0,
  tariff: 200,
  smp: 120,
  rec: 70,
  pshFallback: 3.6,
};


  function round(n, d=2){ const p = 10**d; return Math.round(n*p)/p; }
  function won(n){ return `${Math.round(n).toLocaleString("ko-KR")} 원`; }
  function kwh(n){ return `${round(n,1)} kWh`; }

  function initSelectors(){
    // region
    const regions = Object.keys(KMA_PSH_TABLE);
    els.region.innerHTML = regions.map(r => `<option value="${r}">${r}</option>`).join("");

    // month
    const nowM = new Date().getMonth()+1;
    els.month.innerHTML = Array.from({length:12}, (_,i)=>{
      const m=i+1;
      return `<option value="${m}">${m}월</option>`;
    }).join("");
    els.month.value = String(nowM);
  }

  function applyAutoPSH(){
    const region = els.region.value;
    const m = Number(els.month.value);
    const p = KMA_PSH_TABLE?.[region]?.[m];
    const psh = (typeof p === "number") ? p : defaults.pshFallback;
    els.psh.value = String(round(psh,1));
    els.basisNote.textContent = `기준: ${region} / ${m}월 월평균(기상 데이터 기반) PSH 자동 설정`;
  }

  function getInputs(){
    const capKw = Number(els.capKw.value);
    const psh = Number(els.psh.value);
    const eff = Number(els.systemEff.value) / 100;         // 0~1
    const days = Number(els.days.value);
    const selfRatio = Number(els.selfRatio.value) / 100;   // 0~1
    const tariff = Number(els.tariff.value);
    const smp = Number(els.smp.value);
    const rec = Number(els.rec.value);
    return {capKw, psh, eff, days, selfRatio, tariff, smp, rec};
  }

  function validate(v){
    if(!(v.capKw>0 && v.psh>0 && v.eff>0 && v.eff<=1 && v.days>0)) return false;
    if(!(v.selfRatio>=0 && v.selfRatio<=1)) return false;
    if(!(v.tariff>=0 && v.smp>=0 && v.rec>=0)) return false;
    return true;
  }

  function calc(){
    const v = getInputs();
    if(!validate(v)){
      alert("입력값을 확인해주세요(숫자/범위 오류).");
      return;
    }

    // 발전량
    const dayKwh = v.capKw * v.psh * v.eff;
    const monKwh = dayKwh * v.days;

    // 자가소비/잉여
    const selfKwh = monKwh * v.selfRatio;
    const exportKwh = monKwh - selfKwh;

    // 수익(단순 추정)
    const saveWon = selfKwh * v.tariff;
    const smpWon  = exportKwh * v.smp;
    const recWon  = monKwh * v.rec;
    const total   = saveWon + smpWon + recWon;

    els.outDayKwh.textContent = kwh(dayKwh);
    els.outMonKwh.textContent = kwh(monKwh);
    els.outSave.textContent   = won(saveWon);
    els.outSmp.textContent    = won(smpWon);
    els.outRec.textContent    = won(recWon);
    els.outTotal.textContent  = won(total);

    // 2) 검증(실측 오차율)
    updateError(monKwh);
  }

  function updateError(predMonKwh){
    const actual = Number(els.actualMonKwh.value);
    if(!(actual>0)){
      els.errPct.value = "-";
      return;
    }
    const err = (predMonKwh - actual) / actual * 100;
    const sign = err>0 ? "+" : "";
    els.errPct.value = `${sign}${round(err,1)} %`;
  }

  function reset(){
    els.systemEff.value = defaults.systemEff;
    els.capKw.value = defaults.capKw;
    els.days.value = defaults.days;
    els.selfRatio.value = defaults.selfRatioPct;
    els.tariff.value = defaults.tariff;
    els.smp.value = defaults.smp;
    els.rec.value = defaults.rec;
    els.actualMonKwh.value = "";
    applyAutoPSH();
    calc();
  }

  // 3) API 연동(준비): 프록시 URL이 있어야 실제 호출 가능
  // - 기상청 API Hub에는 일사/일조 일통계/평년값 API가 있습니다. :contentReference[oaicite:3]{index=3}
  // - data.go.kr ASOS 일자료 조회도 가능합니다. :contentReference[oaicite:4]{index=4}
  async function fetchObserved(){
    // ✅ 여기 URL은 "대표님 프록시(Cloudflare Worker/Apps Script)"로 바꿔야 합니다.
    // 예: https://your-worker.yourname.workers.dev/kma?stn=133&start=20260101&end=20260131
    const proxyUrl = ""; // <- 비워두면 안내만 띄웁니다.

    if(!proxyUrl){
      els.apiStatus.textContent = "연동 미설정: 프록시 URL이 필요합니다(Cloudflare Worker/Apps Script).";
      alert("API 연동은 '프록시 URL' 설정이 먼저 필요합니다.\n제가 바로 만들어드릴 수 있어요(아래 안내 참고).");
      return;
    }

    const stn = (els.stn.value || "").trim();
    const dr = (els.dateRange.value || "").trim(); // 20260101-20260131
    if(!stn || !dr.includes("-")){
      alert("지점코드(stn)와 기간(YYYYMMDD-YYYYMMDD)을 입력해주세요.");
      return;
    }
    const [start, end] = dr.split("-");

    els.apiStatus.textContent = "관측데이터 조회 중...";
    const url = `${proxyUrl}?stn=${encodeURIComponent(stn)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    const res = await fetch(url);
    if(!res.ok){
      els.apiStatus.textContent = `조회 실패: HTTP ${res.status}`;
      return;
    }
    const data = await res.json();

    // 여기서 data를 가공해 "기간 평균 PSH"로 변환해 els.psh에 반영하는 로직을 붙입니다.
    // 대표님이 어떤 API를 쓰는지에 따라 응답 구조가 달라서, 프록시 선택 후 제가 맞춰드릴게요.
    els.apiStatus.textContent = "조회 성공(가공 로직은 API 종류 확정 후 연결)";
  }

  function wire(){
    initSelectors();
    applyAutoPSH();

    els.region.addEventListener("change", () => { applyAutoPSH(); calc(); });
    els.month.addEventListener("change", () => { applyAutoPSH(); calc(); });
    els.psh.addEventListener("input", () => calc());
    els.systemEff.addEventListener("input", () => calc());
    ["capKw","days","selfRatio","tariff","smp","rec"].forEach(id => $(id).addEventListener("input", () => calc()));

    els.actualMonKwh.addEventListener("input", () => {
      const pred = Number(String(els.outMonKwh.textContent).replace(/[^\d.]/g,""));
      if(pred>0) updateError(pred);
    });

    els.calcBtn.addEventListener("click", calc);
    els.resetBtn.addEventListener("click", reset);
    els.fetchObsBtn.addEventListener("click", fetchObserved);

    calc();
  }

  window.addEventListener("DOMContentLoaded", wire);
})();




