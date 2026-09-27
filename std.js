// 성취기준 고르기 · 성취수준 루브릭 · 학년별 반영 현황
(function () {
  var A = window.APP_ACTIONS, esc = window.esc;
  var BAND = { 1: "1-2", 2: "1-2", 3: "3-4", 4: "3-4", 5: "5-6", 6: "5-6" };

  var S = window.STD_API = {
    band: function (g) { return BAND[g] || "3-4"; },
    row: function (r, grade) {
      var u = r.use && r.use[grade];
      return { code: r.code, subject: r.subj, strand: r.strand, text: r.text, partial: !!r.partial,
        A: r.lv.a, B: r.lv.b, C: r.lv.c, inPlan: !!u, sem: u ? u.sem : "", units: u ? u.units : [] };
    },
    list: function (grade) {
      return ((window.STANDARDS || {})[S.band(grade)] || []).map(function (r) { return S.row(r, grade); });
    },
    find: function (grade, code) {
      var hit = null;
      Object.keys(window.STANDARDS || {}).forEach(function (b) {
        (window.STANDARDS[b] || []).forEach(function (r) { if (r.code === code) hit = r; });
      });
      return hit ? S.row(hit, grade) : null;
    },
    subjects: function (grade) {
      var m = {}; S.list(grade).forEach(function (r) { m[r.subject] = (m[r.subject] || 0) + 1; });
      return Object.keys(m);
    },
    // 학년 전체에서 이미 다른 단원이 쓴 코드
    usedElsewhere: function (units, grade, selfId) {
      var m = {};
      units.forEach(function (u) {
        if (u.grade !== grade || u.id === selfId) return;
        u.subjects.forEach(function (s) { if (s.code) m[s.code.replace(/[\[\]]/g, "").trim()] = u.title || "제목 없음"; });
      });
      return m;
    }
  };

  // ───── 성취기준 고르기 창 ─────
  var state = { q: "", subject: "", onlyPlan: true, picked: {} };

  function norm(c) { return String(c || "").replace(/[\[\]\s]/g, ""); }

  function rowHTML(r, chosen, taken) {
    return '<label class="std-row' + (chosen ? " on" : "") + '"><input type="checkbox" data-std="' + r.code + '"' + (chosen ? " checked" : "") + ">" +
      '<span><b class="mono">[' + r.code + "]</b> " + esc(r.text) + "<small>" + esc(r.subject + (r.strand ? " · " + r.strand : "")) +
      (r.inPlan ? ' · <span class="pill ok">' + r.sem + "학기 " + esc((r.units[0] || "").slice(0, 18)) + "</span>" : ' · <span class="pill">올해 지도계획에 없음</span>') +
      (taken ? ' · <span class="pill warn">' + esc(taken) + " 단원이 사용</span>" : "") +
      (r.partial ? ' · <span class="pill warn">원문 일부만 추출됨 — 확인 필요</span>' : "") + "</small></span></label>";
  }

  function renderList(u, all) {
    var taken = S.usedElsewhere(all, u.grade, u.id);
    var mine = {}; u.subjects.forEach(function (s) { if (s.code) mine[norm(s.code)] = 1; });
    var rows = S.list(u.grade).filter(function (r) {
      if (state.onlyPlan && !r.inPlan) return false;
      if (state.subject && r.subject !== state.subject) return false;
      if (state.q) { var q = state.q.toLowerCase();
        return (r.code + r.text + r.subject + r.strand + (r.units || []).join(" ")).toLowerCase().indexOf(q) >= 0; }
      return true;
    });
    var box = document.getElementById("stdList");
    box.innerHTML = rows.length ? rows.map(function (r) { return rowHTML(r, state.picked[r.code] || mine[r.code], taken[r.code]); }).join("")
      : '<p class="note" style="padding:12px">조건에 맞는 성취기준이 없습니다. 검색어를 지우거나 ‘지도계획에 없는 것도 보기’를 켜 보세요.</p>';
    document.getElementById("stdCount").textContent = rows.length + "개";
  }

  A.pickStd = function (u) {
    var all = APP.units();
    state = { q: "", subject: "", onlyPlan: true, picked: {} };
    var subs = S.subjects(u.grade);
    var m = document.getElementById("modal");
    m.innerHTML = '<div class="modal-card wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
      '<h3 id="mTitle">' + u.grade + '학년 성취기준 고르기</h3>' +
      '<p class="note">2022 개정 교육과정 ' + S.band(u.grade) + '학년군 성취기준입니다. 올해 우리 학년 연간지도계획에 들어 있는 것부터 보여 줍니다. 여러 개를 고를 수 있습니다.</p>' +
      '<div class="std-bar"><input type="text" id="stdQ" placeholder="검색: 내용, 코드, 단원명" autocomplete="off">' +
      '<select id="stdSubject"><option value="">전체 교과</option>' + subs.map(function (s) { return '<option>' + s + "</option>"; }).join("") + "</select>" +
      '<label class="tick"><input type="checkbox" id="stdAll">지도계획에 없는 것도 보기</label><span class="pill" id="stdCount"></span></div>' +
      '<div class="std-list" id="stdList"></div>' +
      '<div class="modal-actions"><button class="btn" data-m="cancel">취소</button><button class="btn primary" data-m="ok">선택한 성취기준 넣기</button></div></div>';
    m.hidden = false;
    renderList(u, all);
    document.getElementById("stdQ").focus();

    function onInput(e) {
      if (e.target.id === "stdQ") { state.q = e.target.value.trim(); renderList(u, all); }
      if (e.target.id === "stdSubject") { state.subject = e.target.value; renderList(u, all); }
      if (e.target.id === "stdAll") { state.onlyPlan = !e.target.checked; renderList(u, all); }
      if (e.target.dataset && e.target.dataset.std) {
        state.picked[e.target.dataset.std] = e.target.checked;
        e.target.closest(".std-row").classList.toggle("on", e.target.checked);
      }
    }
    function onClick(e) {
      if (e.target === m) return close(false);
      var b = e.target.closest("[data-m]"); if (!b) return;
      close(b.dataset.m === "ok");
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(false); } }
    function close(ok) {
      m.hidden = true; m.innerHTML = "";
      m.removeEventListener("click", onClick); m.removeEventListener("input", onInput); m.removeEventListener("change", onInput);
      document.removeEventListener("keydown", onKey, true);
      if (!ok) return;
      var codes = Object.keys(state.picked).filter(function (c) { return state.picked[c]; });
      if (!codes.length) return;
      var mine = {}; u.subjects.forEach(function (s) { if (s.code) mine[norm(s.code)] = 1; });
      var added = 0;
      codes.forEach(function (c) {
        if (mine[c]) return;
        var r = S.find(u.grade, c); if (!r) return;
        u.subjects.push({ subject: r.subject, hours: "", code: "[" + r.code + "]", content: r.text });
        added++;
      });
      APP.save(u); APP.rerender();
      toast(added ? added + "개 성취기준을 넣었습니다. 시수를 채워 주세요." : "이미 들어 있는 성취기준입니다.");
    }
    m.addEventListener("click", onClick); m.addEventListener("input", onInput); m.addEventListener("change", onInput);
    document.addEventListener("keydown", onKey, true);
    return false;
  };

  // ───── 성취수준(A·B·C) → 루브릭 ─────
  A.rubricFromStd = function (u) {
    var rows = u.subjects.filter(function (s) { return s.code && STD_API.find(u.grade, norm(s.code)); });
    if (!rows.length) { toast("먼저 ‘교과 · 성취기준’ 탭에서 성취기준을 넣어 주세요."); return false; }
    var added = 0;
    rows.forEach(function (s) {
      var r = STD_API.find(u.grade, norm(s.code));
      if (!r || !r.A) return;
      u.rubric.push({ name: "[" + r.code + "] " + r.text.slice(0, 24), domain: "지식·이해",
        levels: [r.C.slice(0, 200), r.B.slice(0, 200), r.A.slice(0, 200), ""] });
      added++;
    });
    if (!added) { toast("성취수준 자료가 있는 성취기준이 없습니다."); return false; }
    toast(added + "개 성취기준의 C·B·A 수준을 루브릭에 넣었습니다. ‘확장’ 칸은 직접 채워 주세요.");
  };

  // ───── POI: 학년별 성취기준 반영 현황 ─────
  window.stdCoverage = function (all) {
    var h = '<div class="bars">';
    [1, 2, 3, 4, 5, 6].forEach(function (g) {
      var plan = S.list(g).filter(function (r) { return r.inPlan; });
      var used = {};
      all.forEach(function (u) { if (u.grade === g) u.subjects.forEach(function (s) { if (s.code) used[norm(s.code)] = 1; }); });
      var hit = plan.filter(function (r) { return used[r.code]; }).length;
      var pct = plan.length ? Math.round(hit / plan.length * 100) : 0;
      h += '<div class="bar"><span>' + g + '학년</span><span class="t"><i style="width:' + pct + '%"></i></span><span class="c">' + hit + "/" + plan.length + "</span></div>";
    });
    return h + '</div><p style="font-size:12px;color:var(--faint);margin:10px 0 0">올해 연간지도계획에 있는 성취기준 가운데 탐구단원에 연결된 비율입니다. 모든 성취기준을 UOI에 넣을 필요는 없습니다. 단원 밖에서 따로 가르치는 교과 학습도 PYP에서 인정합니다.</p>';
  };
})();
