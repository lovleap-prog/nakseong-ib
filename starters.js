// 추천 주제(예시안)를 ‘산만하지 않게’ 쓰는 장치
//  1) 새 단원을 시작하는 순간에만 보인다 (편집 화면에는 없음)
//  2) 고른 학년 × 주제에 맞는 예시 1개만 보인다 (전체 36개는 참고자료의 ‘추천 주제 지도’에만)
//  3) 복사가 아니라 출발점이다 — 예시 문장을 그대로 두면 점검 패널이 알려 준다
(function () {
  var P = window.PYP, esc = window.esc;
  var list = window.STARTERS || [];
  list.forEach(function (s) { s.id = "st-" + s.g + "-" + s.th; });

  var API = window.STARTER_API = {
    all: function () { return list; },
    find: function (g, th) { return list.find(function (s) { return s.g === Number(g) && s.th === th; }) || null; },
    byId: function (id) { return list.find(function (s) { return s.id === id; }) || null; },
    // 예시 → 새 단원 초안 (개념·중심 아이디어·LOI·성취기준·지역 맥락까지만 채우고 나머지는 선생님 몫)
    toUnit: function (s, title) {
      var u = newUnit(s.g, s.th);
      u.title = title || s.title;
      u.semester = s.sem;
      u.concepts = s.cc.slice();
      u.centralIdea = s.ci;
      u.lois = s.lois.map(function (l) { return { text: l[0], concept: l[1] }; });
      u.context.local = s.local;
      u.studentAction = "(예상) " + s.act;
      u.subjects = s.codes.map(function (c) {
        var r = window.STD_API && STD_API.find(s.g, c);
        return { subject: r ? r.subject : "", hours: "", code: "[" + c + "]", content: r ? r.text : "" };
      });
      u.fromStarter = { id: s.id, ci: s.ci, title: s.title };
      return u;
    }
  };

  function themeKo(id) { var t = themeOf(id); return t ? t.ko : ""; }

  // 예시 카드 (새 단원 창과 추천 주제 지도에서 같이 씀)
  function card(s, compact) {
    var t = themeOf(s.th);
    var std = s.codes.map(function (c) {
      var r = window.STD_API && STD_API.find(s.g, c);
      var mark = r && r.inPlan ? '<span class="pill ok" title="올해 ' + s.g + '학년 지도계획에 있음">' + r.sem + "학기</span>" : '<span class="pill" title="올해 지도계획에는 없음">계획 밖</span>';
      return '<li><b class="mono">[' + c + "]</b> " + esc(r ? r.text : "") + " " + mark + "</li>";
    }).join("");
    return '<div class="starter" style="--tc:var(--' + (t ? t.color : "faint") + ')">' +
      '<div class="st-head"><span class="label">' + s.g + "학년 · " + themeKo(s.th) + " · 추천 " + s.sem + '</span><h4>' + esc(s.title) + "</h4>" +
      '<span class="st-lead">중심 교과: ' + s.lead.join(", ") + "</span></div>" +
      '<p class="st-ci">“' + esc(s.ci) + '”</p>' +
      '<div class="chips">' + s.cc.map(function (c) { return '<span class="cc">' + c + "</span>"; }).join("") + "</div>" +
      (compact ? "" :
        '<ol class="st-loi">' + s.lois.map(function (l) { return "<li>" + esc(l[0]) + ' <span class="cc">' + l[1] + "</span></li>"; }).join("") + "</ol>" +
        '<ul class="st-std">' + std + "</ul>" +
        '<p class="note"><b>우리 학교 연계</b> ' + esc(s.local) + "<br><b>실천 예</b> " + esc(s.act) + "</p>") +
      "</div>";
  }
  window.starterCard = card;

  // ───── 새 단원 시작 창: 학년·주제를 고르면 맞는 예시 1개만 보여 줌 ─────
  window.openStart = function (g, th, done) {
    var m = document.getElementById("modal");
    var st = { g: Number(g) || 3, th: th || "" };
    function body() {
      var s = st.th ? API.find(st.g, st.th) : null;
      return '<div class="modal-card wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
        '<h3 id="mTitle">새 탐구단원 시작하기</h3>' +
        '<div class="row"><label class="field"><span class="label">학년</span><select id="stG">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '"' + (n === st.g ? " selected" : "") + ">" + n + "학년</option>"; }).join("") + "</select></label>" +
        '<label class="field"><span class="label">초학문적 주제</span><select id="stT"><option value="">고르세요</option>' + P.themes.map(function (t) { return '<option value="' + t.id + '"' + (t.id === st.th ? " selected" : "") + ">" + t.ko + "</option>"; }).join("") + "</select></label></div>" +
        (s ? '<p class="note">이 학년·주제의 <b>추천 예시</b>가 있습니다. 예시에서 시작하면 개념·중심 아이디어·탐구 목록·성취기준이 채워진 <b>초안</b>이 만들어집니다. 우리 반에 맞게 고쳐 쓰세요.</p>' + card(s)
          : st.th ? '<p class="note">이 학년·주제에는 추천 예시가 없습니다. 빈 단원으로 시작하세요.</p>'
            : '<p class="note">학년과 주제를 고르면, 그에 맞는 추천 예시가 여기에 하나 나옵니다.</p>') +
        '<div class="modal-actions"><button class="btn" data-m="cancel">취소</button><button class="btn" data-m="blank"' + (st.th ? "" : " disabled") + ">빈 단원으로 시작</button>" +
        (s ? '<button class="btn primary" data-m="starter">이 예시에서 시작</button>' : "") + "</div></div>";
    }
    function paint() { m.innerHTML = body(); }
    function close() { m.hidden = true; m.innerHTML = ""; m.removeEventListener("click", onClick); m.removeEventListener("change", onChange); document.removeEventListener("keydown", onKey, true); }
    function onChange(e) {
      if (e.target.id === "stG") st.g = Number(e.target.value);
      if (e.target.id === "stT") st.th = e.target.value;
      paint();
    }
    function onClick(e) {
      if (e.target === m) return close();
      var b = e.target.closest("[data-m]"); if (!b || b.disabled) return;
      var k = b.dataset.m; close();
      if (k === "blank") done(newUnit(st.g, st.th), "빈 단원을 만들었습니다.");
      if (k === "starter") done(API.toUnit(API.find(st.g, st.th)), "예시에서 초안을 만들었습니다. 우리 반에 맞게 고쳐 쓰세요.");
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    paint(); m.hidden = false;
    m.addEventListener("click", onClick); m.addEventListener("change", onChange); document.addEventListener("keydown", onKey, true);
  };

  // ───── 참고자료: 추천 주제 지도 (6학년 × 6주제 한 장) ─────
  window.starterMap = function () {
    var h = '<div class="box" style="grid-column:1/-1"><h3>추천 주제 지도</h3>' +
      '<p class="note" style="margin-bottom:12px">2022 개정 교육과정 성취기준과 우리 학교 연간지도계획을 바탕으로, 학년·주제마다 한 개씩 만든 <b>예시안</b>입니다. 국가 성취기준이 같아서 다른 학교와 주제가 비슷할 수 있지만, 풀어 가는 방법은 우리 학교 자원(갯벌·녹차밭·3보향 등)으로 달라집니다. 칸을 누르면 자세히 보고, 그 예시로 단원을 시작할 수 있습니다.</p>' +
      '<div class="poi-wrap"><div class="stmap"><div></div>' + P.themes.map(function (t) { return '<div class="th" style="--tc:var(--' + t.color + ')"><b>' + t.ko + "</b></div>"; }).join("");
    [1, 2, 3, 4, 5, 6].forEach(function (g) {
      h += '<div class="gh">' + g + "학년</div>";
      P.themes.forEach(function (t) {
        var s = API.find(g, t.id);
        h += s ? '<button class="stcell" data-act="starterView" data-id="' + s.id + '" style="--tc:var(--' + t.color + ')"><b>' + esc(s.title) + "</b><small>" + s.sem + " · " + s.lead.slice(0, 2).join("·") + "</small></button>" : "<div></div>";
      });
    });
    return h + "</div></div></div>";
  };

  var A = window.APP_ACTIONS;
  A.starterView = function (u, el) {
    var s = API.byId(el.dataset.id); if (!s) return false;
    APP.dialog({ title: "추천 예시 — " + esc(s.title), ok: "이 예시로 새 단원 만들기", body: card(s) }).then(function (v) {
      if (!v) return;
      var nu = API.toUnit(s); window.Store.save(nu, true); APP.open(nu.id);
      toast("예시에서 초안을 만들었습니다. 우리 반에 맞게 고쳐 쓰세요.");
    });
    return false;
  };
  A.starterPeek = function (u) {
    var s = u && u.fromStarter && API.byId(u.fromStarter.id); if (!s) return false;
    APP.dialog({ title: "출발한 예시 — " + esc(s.title), ok: "닫기", body: '<p class="note">이 단원은 아래 예시에서 시작했습니다. 지금 단원과 비교해 보세요.</p>' + card(s) });
    return false;
  };

  // 예시 문장을 그대로 두었는지 점검
  var baseCheck = window.checkUnit;
  window.checkUnit = function (u, all) {
    var out = baseCheck(u, all);
    if (u.fromStarter) {
      var same = (u.centralIdea || "").trim() === (u.fromStarter.ci || "").trim();
      out.splice(5, 0, { level: same ? "warn" : "ok", tab: "concept", core: true,
        text: "예시 문장을 우리 반에 맞게 고쳐 쓰기", tip: same ? "중심 아이디어가 추천 예시 그대로입니다. 우리 반 학생의 말과 경험으로 다듬어 보세요." : "" });
    }
    return out;
  };
})();
