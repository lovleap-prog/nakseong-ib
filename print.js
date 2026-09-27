// 인쇄·결재용 보기 — 단원 계획을 A4 한 묶음 표로 정리해 화면에 보여 주고 인쇄
(function () {
  var P = window.PYP, esc = window.esc;
  var nl = function (s) { return esc(s || "").replace(/\n/g, "<br>"); };
  var row = function (k, v, span) { return "<tr><th>" + k + '</th><td colspan="' + (span || 3) + '">' + (v || '<span class="empty">—</span>') + "</td></tr>"; };

  function html(u) {
    var t = themeOf(u.theme);
    var tool = u.summativeTool === "RAFT" ? P.raft : P.grasps, src = u.summativeTool === "RAFT" ? u.raft : u.grasps;
    var h = '<div class="pv-page">' +
      '<div class="pv-head"><div><span>' + esc((window.SCHOOL && SCHOOL.name) || "") + " · " + u.grade + "학년 탐구단원(UOI) 계획</span><h1>" + esc(u.title || "제목 없는 탐구단원") + "</h1></div>" +
      '<table class="pv-sign"><tr><th>담임</th><th>교무</th><th>교감</th><th>교장</th></tr><tr><td></td><td></td><td></td><td></td></tr></table></div>';

    h += "<h2>1. 단원 개요</h2><table>" +
      "<tr><th>학년 · 학기</th><td>" + u.grade + "학년 " + esc(u.semester || "") + "</td><th>기간 · 차시</th><td>" + esc(u.period || "") + " / " + (u.lessonsPlanned || "") + "차시</td></tr>" +
      row("초학문적 주제", t ? "<b>" + t.ko + "</b> (" + t.en + ")<br>" + esc(t.desc) : "") +
      row("세부 주제", esc(u.subs.join(" / "))) +
      row("협력적 계획 팀", esc(u.team)) +
      row("맥락", ["지역: " + esc(u.context.local), "세계: " + esc(u.context.global), "인간·자연: " + esc(u.context.nature)].join("<br>")) + "</table>";

    h += "<h2>2. 개념과 탐구</h2><table>" +
      row("중심 아이디어", "<b>" + nl(u.centralIdea) + "</b>") +
      "<tr><th>명시된 개념</th><td>" + esc(u.concepts.join(", ")) + "</td><th>추가 개념</th><td>" + esc(u.related) + "</td></tr>" +
      u.lois.map(function (l, i) { return "<tr><th>탐구 목록 " + (i + 1) + "</th><td colspan=\"2\">" + esc(l.text) + "</td><td>" + esc(l.concept) + "</td></tr>"; }).join("") +
      "<tr><th>학습자상</th><td>" + esc(u.lp.join(", ")) + "</td><th>ATL</th><td>" + esc(u.atl.join(", ")) + "</td></tr>" +
      "<tr><th>교사 질문</th><td>" + nl(u.teacherQs) + "</td><th>학생 질문</th><td>" + nl(u.studentQs) + "</td></tr>" +
      row("학생 선택·주도성", esc(u.agency)) + "</table>";

    h += "<h2>3. 교과와 성취기준</h2><table><tr><th>교과</th><th>시수</th><th>성취기준</th><th>내용</th></tr>" +
      (u.subjects.length ? u.subjects.map(function (s) { return "<tr><td>" + esc(s.subject) + '</td><td class="c">' + esc(s.hours) + "</td><td>" + esc(s.code) + "</td><td>" + esc(s.content) + "</td></tr>"; }).join("") : '<tr><td colspan="4" class="empty">—</td></tr>') +
      row("학습 목표", nl(u.goals)) + "</table>";

    h += "<h2>4. 평가</h2><table>" + row("성공 기준", nl(u.criteria)) +
      "<tr><th>사전 지식 확인</th><td>" + nl(u.prior) + "</td><th>모니터링</th><td>" + nl(u.formative) + "</td></tr>" +
      "<tr><th>기록</th><td>" + nl(u.documenting) + "</td><th>자기·동료 평가</th><td>" + nl(u.selfPeer) + "</td></tr>" +
      tool.map(function (x) { return row("총괄 과제 · " + x[2].split(" · ")[1], nl(src[x[0]])); }).join("") + "</table>";
    if (u.rubric.length) {
      h += '<table class="pv-rubric"><tr><th>평가 요소</th><th>영역</th>' + P.rubricLevels.map(function (l) { return "<th>" + l + "</th>"; }).join("") + "</tr>" +
        u.rubric.map(function (r) { return "<tr><td><b>" + esc(r.name) + "</b></td><td>" + esc(r.domain) + "</td>" + r.levels.map(function (lv) { return "<td>" + esc(lv) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>";
    }

    h += "<h2>5. 차시 운영 (" + esc(u.model) + ")</h2><table><tr><th>차시</th><th>탐구의 흐름</th><th>탐구 단계</th><th>탐구 기능</th><th>교수학습 활동</th></tr>" +
      (u.lessons.length ? u.lessons.map(function (l, i) { return '<tr><td class="c">' + (i + 1) + "</td><td>" + esc(l.flow) + "</td><td>" + esc(l.stage) + "</td><td>" + esc(l.ilp) + "</td><td>" + esc(l.method) + "</td></tr>"; }).join("") : '<tr><td colspan="5" class="empty">—</td></tr>') + "</table>";

    h += "<h2>6. 실천과 성찰</h2><table>" + row("예상 실천 유형", esc(u.actionTypes.join(", "))) + row("학생 실천 지원", nl(u.action)) + row("학생이 제안한 실천", nl(u.studentAction)) +
      "<tr><th>교사 성찰(전)</th><td>" + nl(u.reflect.before) + "</td><th>교사 성찰(중)</th><td>" + nl(u.reflect.during) + "</td></tr>" +
      "<tr><th>교사 성찰(후)</th><td>" + nl(u.reflect.teacher) + "</td><th>학생·학부모</th><td>" + nl(u.reflect.student) + (u.reflect.parent ? "<br>" + nl(u.reflect.parent) : "") + "</td></tr></table>";
    return h + "</div>";
  }

  window.printUnit = function (u) {
    var box = document.getElementById("printView");
    box.innerHTML = '<div class="pv-bar"><b>인쇄·결재용 보기</b><span>A4 세로 기준입니다. 한글(HWP)로 옮길 때는 표를 복사해 붙여 넣으세요.</span>' +
      '<button class="btn primary" id="pvPrint">인쇄</button><button class="btn" id="pvClose">닫기</button></div>' + html(u);
    box.hidden = false; document.body.classList.add("pv-open"); window.scrollTo(0, 0);
    document.getElementById("pvClose").onclick = function () { box.hidden = true; box.innerHTML = ""; document.body.classList.remove("pv-open"); };
    document.getElementById("pvPrint").onclick = function () {
      try { window.print(); } catch (e) { toast("이 화면에서는 인쇄 창을 열 수 없습니다. Ctrl+P를 눌러 보세요."); }
    };
  };
})();
