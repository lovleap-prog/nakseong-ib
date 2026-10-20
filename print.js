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

  // 성취기준 목록 인쇄 — 자료실 > 성취기준 자료의 학년별 수록 범위에서 엶
  function stdRows(grade, all) {
    return window.STD_API.list(grade).filter(function (r) { return all || r.inPlan; });
  }
  function stdHtml(grade, all, lv) {
    var rows = stdRows(grade, all), band = window.STD_API.band(grade), cols = lv ? 7 : 5, prev = null;
    var h = '<div class="pv-page pv-std"><div class="pv-head"><div><span>' + esc((window.SCHOOL && SCHOOL.name) || "") + " · 2022 개정 교육과정 성취기준</span><h1>" +
      grade + "학년 " + (all ? band + "학년군 전체" : "올해 지도계획") + "</h1></div><span>" + rows.length + "개</span></div>" +
      "<table><colgroup><col style=\"width:68px\"><col style=\"width:" + (lv ? 62 : 80) + "px\"><col><col style=\"width:38px\"><col style=\"width:" + (lv ? "16%" : "26%") + "\">" +
      (lv ? "<col style=\"width:20%\"><col style=\"width:20%\">" : "") + "</colgroup><thead><tr><th>코드</th><th>영역</th><th>성취기준</th>" + (all ? "<th>올해</th>" : "<th>학기</th>") + "<th>단원</th>" +
      (lv ? "<th>A</th><th>B · C</th>" : "") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      if (r.subject !== prev) { h += '<tr class="pv-subj"><td colspan="' + cols + '">' + esc(r.subject) + "</td></tr>"; prev = r.subject; }
      h += '<tr><td class="c nw">' + esc(r.code) + '</td><td>' + esc(r.strand) + "</td><td>" + esc(r.text) + (r.partial ? ' <span class="empty">(원문 확인 필요)</span>' : "") + "</td>" +
        (all ? '<td class="c">' + (r.inPlan ? "○" : "") + "</td>" : '<td class="c">' + esc(r.sem) + "</td>") +
        '<td class="pv-small">' + esc(r.units.join(", ")) + "</td>" +
        (lv ? '<td class="pv-small">' + esc(r.A) + '</td><td class="pv-small">B: ' + esc(r.B) + "<br>C: " + esc(r.C) + "</td>" : "") + "</tr>";
    });
    if (!rows.length) h += '<tr><td colspan="' + cols + '" class="empty">—</td></tr>';
    return h + "</tbody></table></div>";
  }
  function stdXlsx(grade, all) {
    if (!window.XLSX) { toast("엑셀 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."); return; }
    var aoa = [["교과", "코드", "영역", "성취기준", "올해 지도계획", "학기", "단원", "성취수준 A", "성취수준 B", "성취수준 C"]];
    stdRows(grade, all).forEach(function (r) { aoa.push([r.subject, r.code, r.strand, r.text, r.inPlan ? "○" : "", r.sem, r.units.join(", "), r.A, r.B, r.C]); });
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [8, 11, 14, 50, 8, 6, 30, 40, 40, 40].map(function (w) { return { wch: w }; });
    XLSX.utils.book_append_sheet(wb, ws, grade + "학년");
    XLSX.writeFile(wb, grade + "학년_성취기준_" + (all ? window.STD_API.band(grade) + "학년군전체" : "올해지도계획") + ".xlsx");
  }
  window.printStd = function (grade, all) {
    var box = document.getElementById("printView"), lv = false;
    function draw() {
      box.innerHTML = '<div class="pv-bar"><b>성취기준 인쇄</b><span>A4 세로 기준입니다. 교과별로 묶어 보여 줍니다.</span>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="pvLv"' + (lv ? " checked" : "") + "> 성취수준(A·B·C) 함께</label>" +
        '<button class="btn" id="pvXlsx">엑셀로 내려받기</button><button class="btn primary" id="pvPrint">인쇄</button><button class="btn" id="pvClose">닫기</button></div>' + stdHtml(grade, all, lv);
      document.getElementById("pvLv").onchange = function (e) { lv = e.target.checked; draw(); };
      document.getElementById("pvXlsx").onclick = function () { stdXlsx(grade, all); };
      document.getElementById("pvClose").onclick = function () { box.hidden = true; box.innerHTML = ""; document.body.classList.remove("pv-open"); };
      document.getElementById("pvPrint").onclick = function () {
        try { window.print(); } catch (e) { toast("이 화면에서는 인쇄 창을 열 수 없습니다. Ctrl+P를 눌러 보세요."); }
      };
    }
    draw(); box.hidden = false; document.body.classList.add("pv-open"); window.scrollTo(0, 0);
  };
})();
