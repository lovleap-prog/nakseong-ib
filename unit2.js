// 탐구단원 편집기 (2부: 평가 · 차시 · 실천·성찰 · AI 코칭 · 화면 조립)
(function () {
  var P = window.PYP, H = window.H, R = window.UnitTabs, esc = window.esc;

  R.assess = function (u) {
    var prod = u.productType && P.products[u.productType];
    var tool = u.summativeTool === "RAFT" ? P.raft : P.grasps, src = u.summativeTool === "RAFT" ? u.raft : u.grasps, pre = u.summativeTool === "RAFT" ? "raft." : "grasps.";
    return H.guide("assess") +
      '<section class="sec">' + H.secH("성공 기준", "Success criteria", H.prompt("criteria") + H.ai("criteria", "AI 제안"), "성공 기준") +
      H.field("", H.ta("criteria", u.criteria, "‘나는 ~할 수 있다’ 형태로 한 줄에 하나씩. 학생과 함께 다듬으면 더 좋습니다.", 4), "", "req") + H.aiOut("criteria") + "</section>" +

      '<section class="sec">' + H.secH("배움 살피기", "Monitoring · Documenting · Measuring") +
      '<p class="note">PYP 평가는 세 가지가 이어집니다. <b>모니터링</b>(배우는 동안 살피고 피드백) → <b>기록</b>(배움의 증거 남기기) → <b>측정</b>(정해진 시점에 도달 정도 확인). 아래 총괄 과제는 ‘측정’에 해당합니다.</p>' +
      '<div class="row">' + H.field("사전 지식 확인", H.ta("prior", u.prior, "탐구열기에서 이미 아는 것과 오개념을 확인할 방법", 3), "", "opt") +
      H.field("모니터링", H.ta("formative", u.formative, "관찰, 대화, 출구 카드, 즉시 피드백 등", 3), "", "opt") + "</div>" +
      H.more("assessMore", "기록과 자기·동료 평가 계획하기",
        '<div class="row">' + H.field("기록", H.ta("documenting", u.documenting, "포트폴리오, 사진·영상, 학습일지 등 배움의 증거", 3)) +
        H.field("자기·동료 평가", H.ta("selfPeer", u.selfPeer, "성공 기준 체크리스트, 두 별과 소원 한 가지 등", 3)) + "</div>") + "</section>" +

      '<section class="sec">' + H.secH("총괄 과제", "Summative task", H.prompt("grasps") + H.ai("summative", "AI 제안"), "GRASPS") +
      H.field("설계 도구", '<div class="seg" role="radiogroup">' + ["GRASPS", "RAFT", "직접 작성"].map(function (t) {
        return '<button role="radio" data-act="tool" data-v="' + t + '" aria-checked="' + (u.summativeTool === t) + '">' + t + "</button>";
      }).join("") + "</div>", u.summativeTool === "RAFT" ? "RAFT는 글쓰기·말하기 중심 과제에 알맞습니다 (Santa, 1988)." : u.summativeTool === "GRASPS" ? "GRASPS는 실제 상황 속 수행 과제를 짤 때 씁니다 (Wiggins & McTighe, 백워드 설계). IB 고유 도구는 아니며 학년에서 고르면 됩니다." : "", "req") +
      (u.summativeTool === "직접 작성" ? H.field("과제 설명", H.ta("grasps.p", u.grasps.p, "학생이 중심 아이디어에 대한 이해를 보여 줄 과제", 4)) :
        '<div class="grasps">' + tool.map(function (x) {
          var body = pre + x[0] === "grasps.p" ? '<div class="pgrid">' + H.sel("productType", u.productType, Object.keys(P.products), "산출물 종류") + H.inp("grasps.p", u.grasps.p, "예: 그림책, 인형극") + "</div>" +
            (prod ? '<span class="hint">예시: ' + prod + "</span>" : "") : H.ta(pre + x[0], src[x[0]], x[3], 2);
          return '<span class="L">' + x[1] + '</span><span class="N">' + x[2].split(" · ")[1] + "<small>" + x[2].split(" · ")[0] + '</small></span><div class="field">' + body + "</div>";
        }).join("") + "</div>") + H.aiOut("summative") + "</section>" +

      '<section class="sec">' + H.secH("루브릭", "Rubric", H.prompt("rubric") + '<button class="btn" data-act="rubricFromStd">성취수준(A·B·C)에서</button><button class="btn" data-act="rubricConcept">＋ 개념적 이해</button><button class="btn" data-act="rubricFromCriteria">성공 기준에서</button><button class="btn" data-act="addRubric">＋ 기준</button>', "성취수준") +
      (UI.guided ? '<p class="note">처음에는 <b>개념적 이해</b> 기준 하나와 교과 기준 하나, 두 줄이면 충분합니다. 영역은 2022 개정 교육과정의 지식·이해 / 과정·기능 / 가치·태도와 맞출 수 있습니다.</p>' : "") +
      '<div class="tbl-wrap"><table style="min-width:820px"><thead><tr><th style="width:150px">평가 요소</th><th style="width:120px">영역</th>' + P.rubricLevels.map(function (l) { return "<th>" + l + "</th>"; }).join("") + '<th style="width:40px"></th></tr></thead><tbody>' +
      (u.rubric.length ? u.rubric.map(function (r, i) {
        return "<tr><td>" + H.ta("rubric." + i + ".name", r.name, "요소", 2) + "</td><td>" + H.sel("rubric." + i + ".domain", r.domain, P.rubricDomains, "영역") + "</td>" +
          r.levels.map(function (lv, j) { return "<td>" + H.ta("rubric." + i + ".levels." + j, lv, "", 2) + "</td>"; }).join("") +
          '<td><button class="btn ghost" data-act="delRubric" data-i="' + i + '" aria-label="삭제">✕</button></td></tr>';
      }).join("") : '<tr><td colspan="7" style="color:var(--faint);padding:14px">‘＋ 개념적 이해 기준’부터 눌러 보세요.</td></tr>') + "</tbody></table></div></section>";
  };

  R.lessons = function (u) {
    var stages = P.models[u.model];
    return H.guide("lessons") +
      '<section class="sec">' + H.secH("차시 운영 계획", "Lesson sequence",
        H.prompt("lessons") + H.ai("lessons", "AI 제안") + '<button class="btn" data-act="scaffold">모형 흐름으로 채우기</button><button class="btn" data-act="addLesson">＋ 차시</button>') +
      '<div class="row">' + H.field("탐구 모형", H.sel("model", u.model, Object.keys(P.models)), "모형을 바꾸면 각 차시의 탐구단계가 같은 순서의 단계로 바뀝니다. 두 모형 모두 IB 공식 모형이 아닌 참고 모형입니다.") +
      '<div class="field"><span class="label">단계 분포</span><div class="chips">' + stages.map(function (s) {
        var n = u.lessons.filter(function (l) { return l.stage === s[0]; }).length;
        return '<span class="pill ' + (n ? "" : "warn") + '" title="' + esc(s[2]) + '">' + s[0] + ' <b class="mono">' + n + "</b></span>";
      }).join("") + "</div></div></div>" +
      (UI.guided ? '<p class="note">★ 성찰은 마지막 한 차시가 아니라 모든 단계에서 일어납니다. ‘전이하기’(일반화를 새 상황에 적용)와 학생 ‘실천’은 서로 다른 것이며, 실천은 실천·성찰 탭에서 계획합니다.</p>' : "") +
      '<div class="tbl-wrap"><table style="min-width:' + (UI.guided ? 860 : 1240) + 'px"><thead><tr><th style="width:44px">차시</th><th style="width:118px">탐구의 흐름</th><th style="width:140px">탐구단계</th><th style="width:130px" title="2025 탐구 학습 발달 단계">탐구 기능</th><th>교수학습방법 및 전략</th>' +
      (UI.guided ? "" : '<th style="width:170px">비고</th><th style="width:190px">차시별 성찰</th><th style="width:150px">학생 성찰</th><th style="width:150px">학생 활동 결과</th>') + '<th style="width:78px"></th></tr></thead><tbody>' +
      (u.lessons.length ? u.lessons.map(function (l, i) {
        var p = "lessons." + i + ".";
        return '<tr><td class="mono" style="padding-top:12px">' + (i + 1) + "</td><td>" + H.sel(p + "flow", l.flow, P.flows) + "</td><td>" + H.sel(p + "stage", l.stage, stages.map(function (s) { return s[0]; }), "—") +
          "</td><td>" + H.sel(p + "ilp", l.ilp, P.ilp.map(function (x) { return x[0]; }), "—") + "</td><td>" + H.ta(p + "method", l.method, "", 2) + "</td>" +
          (UI.guided ? "" : "<td>" + H.ta(p + "note", l.note, "", 2) + "</td><td>" + H.ta(p + "reflection", l.reflection, "의도와 달랐던 점, 아이들 반응", 2) + "</td><td>" + H.ta(p + "studentRefl", l.studentRefl, "", 2) + "</td><td>" + H.ta(p + "studentWork", l.studentWork, "", 2) + "</td>") +
          '<td style="white-space:nowrap"><button class="btn ghost" data-act="moveLesson" data-i="' + i + '" aria-label="위로">↑</button><button class="btn ghost" data-act="delLesson" data-i="' + i + '" aria-label="삭제">✕</button></td></tr>';
      }).join("") : '<tr><td colspan="10" style="color:var(--faint);padding:14px">‘모형 흐름으로 채우기’를 누르면 계획 차시 수에 맞춰 뼈대가 만들어집니다.</td></tr>') +
      "</tbody></table></div>" + H.aiOut("lessons") +
      (UI.guided ? '<p class="note">차시별 성찰·학생 성찰·결과물 칸은 단원을 운영하면서 채웁니다. 왼쪽 아래 ‘전체 보기’로 바꾸면 나타납니다.</p>' : "") + "</section>";
  };

  R.reflect = function (u) {
    return H.guide("reflect") +
      '<section class="sec">' + H.secH("학생 실천", "Student-initiated action", H.prompt("action") + H.ai("action", "AI 제안"), "실천") +
      H.field("예상되는 실천 유형", H.chips(P.actionTypes.map(function (a) { return { v: a[0], label: a[0] + "<small>" + a[1] + "</small>", d: a[2] }; }), "actionTypes", u.actionTypes), "학생이 배움에서 스스로 시작할 법한 실천을 미리 떠올려 봅니다.", "req") +
      H.field("교사는 학생 실천을 어떻게 지원할까?", H.ta("action", u.action, "시간·공간·자료·연결할 사람 등 실천의 기회를 여는 방법", 3), "", "req") +
      H.more("studentAction", "학생이 실제로 제안한 실천 기록하기", H.field("", H.ta("studentAction", u.studentAction, "운영 중 학생들이 제안하거나 실행한 실천", 3))) + H.aiOut("action") + "</section>" +

      '<section class="sec">' + H.secH("교사 성찰", "Before · During · After") +
      '<div class="row">' + H.field("운영 전", H.ta("reflect.before", u.reflect.before, "예상되는 어려움, 학생 실태, 협의한 결정", 5), "", "req") +
      H.field("운영 중", H.ta("reflect.during", u.reflect.during, "계획과 달라진 점, 학생 질문으로 바뀐 방향", 5)) +
      H.field("운영 후", H.ta("reflect.teacher", u.reflect.teacher, "중심 아이디어 이해가 어떻게 드러났나? 다음에 바꿀 점은?", 5)) + "</div></section>" +

      '<section class="sec">' + H.secH("학습 공동체 성찰", "Students · Families") +
      '<div class="row">' + H.field("학생 성찰", H.ta("reflect.student", u.reflect.student, "학생들의 성찰에서 드러난 배움과 질문", 4)) +
      H.field("학부모 성찰", H.ta("reflect.parent", u.reflect.parent, "가정에서 관찰한 변화, 학부모 피드백", 4)) + "</div></section>" +

      '<section class="sec">' + H.secH("협력적 계획 회의", "Collaborative planning", '<button class="btn" data-act="addMeeting">＋ 회의 기록</button>') +
      (u.meetings.length ? '<div class="tbl-wrap"><table><thead><tr><th style="width:130px">날짜</th><th style="width:200px">참석</th><th>협의 내용</th><th style="width:40px"></th></tr></thead><tbody>' +
        u.meetings.map(function (m, i) {
          return "<tr><td>" + H.inp("meetings." + i + ".date", m.date, "2026. 3. 18.") + "</td><td>" + H.inp("meetings." + i + ".who", m.who, "") + "</td><td>" + H.ta("meetings." + i + ".note", m.note, "결정한 것, 맡은 일", 2) +
            '</td><td><button class="btn ghost" data-act="delMeeting" data-i="' + i + '" aria-label="삭제">✕</button></td></tr>';
        }).join("") + "</tbody></table></div>" : '<p class="note">학년 협의회에서 정한 것을 짧게 남겨 두면 다음 해 단원 수정에 큰 도움이 됩니다.</p>') + "</section>";
  };

  R.coach = function (u) {
    return '<section class="sec">' + H.secH("내 AI에 물어보기", "Copy & paste", H.prompt("review")) +
      '<p class="note">AI 연결이 없어도 쓸 수 있는 방법입니다. <b>📋 프롬프트</b>를 눌러 나온 글을 복사해, 선생님이 쓰시는 AI 채팅창(ChatGPT · 제미나이 · 클로드 등)에 붙여 넣으세요. ' +
      '받은 답은 <b>📥 붙여넣기</b>로 다시 가져올 수 있습니다. 단계마다 같은 단추가 있습니다. 프롬프트에는 학생 이름 같은 개인정보를 넣지 마세요.</p></section>' +
      '<section class="sec">' + H.secH("AI 설계 코칭", "Claude") +
      '<p class="note">이 앱 안에서 바로 검토받는 방법입니다(claude.ai에서 열었을 때). 요청은 보는 사람의 Claude 계정 사용량으로 처리되고, 처음 한 번 허용을 묻습니다.</p>' +
      '<div class="chips"><button class="btn primary" data-act="coach" data-mode="full">단원 전체 피드백</button><button class="btn" data-act="coach" data-mode="beginner">처음 설계자용: 다음에 할 일 3가지</button><button class="btn" data-act="coach" data-mode="lessons">차시 흐름 점검</button><button class="btn ghost" data-act="coachStop" id="coachStop" hidden>중지</button></div>' +
      '<div class="coach" id="coachOut" hidden></div></section>';
  };

  var RESET = window.RESET_FIELDS = {
    overview: { name: "개요", keys: ["title", "subs", "period", "lessonsPlanned", "team", "resources", "status", "context"], note: "학년과 초학문적 주제는 POI 칸 위치라서 초기화해도 남습니다." },
    concept: { name: "개념 · 탐구", keys: ["centralIdea", "concepts", "related", "lois", "teacherQs", "studentQs", "agency", "lp", "atl", "teaching"], note: "개념, 중심 아이디어, LOI, 질문, 학습자상, ATL을 비웁니다." },
    subjects: { name: "교과 · 성취기준", keys: ["subjects", "goals"], note: "교과·시수·성취기준 표와 학습 목표를 비웁니다." },
    assess: { name: "평가", keys: ["criteria", "prior", "formative", "documenting", "selfPeer", "summativeTool", "grasps", "raft", "productType", "rubric"], note: "성공 기준, 배움 살피기, 총괄 과제, 루브릭을 비웁니다." },
    lessons: { name: "차시 운영", keys: ["lessons", "model"], note: "차시표 전체를 비우고 탐구 모형을 기본값으로 돌립니다." },
    reflect: { name: "실천 · 성찰", keys: ["action", "actionTypes", "studentAction", "reflect", "meetings"], note: "실천 계획, 성찰, 협력적 계획 회의 기록을 비웁니다." }
  };
  var TABS = window.UNIT_TABS = [["overview", "개요"], ["concept", "개념 · 탐구"], ["subjects", "교과 · 성취기준"], ["assess", "평가"], ["lessons", "차시 운영"], ["reflect", "실천 · 성찰"], ["coach", "AI 도움"]];

  // 여러 선생님이 함께 쓸 때: 누가 마지막으로 고쳤는지
  function lastEdit(u) {
    if (!u.editedBy || Store.mode !== "shared") return "";
    var d = u.editedAt ? new Date(u.editedAt) : null;
    var when = d ? (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "";
    return ' <span style="color:var(--faint);font-weight:400">· 마지막 수정 ' + esc(u.editedBy) + (when ? " (" + when + ")" : "") + "</span>";
  }

  window.renderUnit = function (u, tab, all) {
    var t = themeOf(u.theme), checks = checkUnit(u, all), sc = scoreOf(checks);
    var counts = {}; checks.forEach(function (c) { if (c.level !== "ok" && (!UI.guided || c.core)) counts[c.tab] = (counts[c.tab] || 0) + 1; });
    var idx = TABS.findIndex(function (x) { return x[0] === tab; }), next = TABS[idx + 1];
    return '<div class="topbar"><button class="btn menu-btn" data-act="menu">☰</button><div><div class="label" style="color:' + (t ? "var(--" + t.color + ")" : "var(--muted)") + '">' +
      u.grade + "학년 · " + (t ? t.ko : "주제 미정") + (u.semester ? " · " + u.semester : "") + (u.example ? ' <span class="pill ex">예시</span>' : "") +
      (u.fromStarter ? ' <button class="lnk" data-act="starterPeek">추천 예시에서 시작함 · 비교하기</button>' : "") + lastEdit(u) +
      "</div><h2>" + esc(u.title || "제목 없는 탐구단원") + '</h2><div class="sub">' + esc(u.centralIdea || "중심 아이디어를 아직 적지 않았습니다.") + "</div></div>" +
      '<div class="actions"><button class="btn" data-act="printUnit">🖨 인쇄·결재용 보기</button>' +
      '<details class="aimenu right"><summary class="btn">더보기 ▾</summary><div class="aimenu-list">' +
      '<button data-act="xlsxUnit"><b>엑셀로 내보내기</b><small>원래 엑셀 플래너와 같은 양식</small></button>' +
      '<button data-act="unitFile"><b>단원 파일로 저장</b><small>다른 선생님께 보내거나 다른 컴퓨터로 옮길 때</small></button>' +
      '<button data-act="dupUnit"><b>단원 복사</b><small>다른 학년·주제로 옮겨 만들기</small></button>' +
      '<button data-act="resetUnit"><b>단원 전체 초기화</b><small>학년·주제만 남기고 비우기</small></button>' +
      '<button class="danger" data-act="delUnit"><b>단원 삭제</b><small>삭제 전에 한 번 더 묻습니다</small></button>' +
      "</div></details></div></div>" +
      '<div class="work"><div><div class="tabs" role="tablist">' + TABS.map(function (x, i) {
        return '<button role="tab" data-tab="' + x[0] + '" aria-selected="' + (x[0] === tab) + '">' + (UI.guided && i < 6 ? '<span class="step">' + (i + 1) + "</span>" : "") + x[1] + (counts[x[0]] ? '<span class="n">' + counts[x[0]] + "</span>" : "") + "</button>";
      }).join("") + '</div><div id="tabBody">' +
      (RESET[tab] ? '<div class="tabbar"><span>' + RESET[tab].note + '</span><button class="btn" data-act="resetTab">이 단계 초기화</button></div>' : "") +
      R[tab](u) +
      (next && UI.guided ? '<div class="nextbar"><button class="btn primary" data-tab="' + next[0] + '">다음 단계: ' + next[1] + " →</button></div>" : "") +
      "</div></div>" + '<aside class="panel" id="checkPanel">' + renderChecks(checks, sc) + "</aside></div>";
  };

  var renderChecks = window.renderChecks = function (checks, sc) {
    function li(c) {
      return '<li data-l="' + c.level + '" data-goto="' + c.tab + '"><span class="ic">' + (c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "·") + "</span><span>" + c.text + (c.tip ? "<small>" + esc(c.tip) + "</small>" : "") + "</span></li>";
    }
    if (UI.guided) {
      var core = checks.filter(function (c) { return c.core; }), todo = core.filter(function (c) { return c.level !== "ok"; });
      var done = core.length - todo.length, extra = checks.filter(function (c) { return !c.core && c.level !== "ok"; });
      return '<div class="label">꼭 할 일</div><div class="score"><b>' + done + '</b><span style="color:var(--muted)">/ ' + core.length + ' 완료</span></div><div class="meter"><i style="width:' + Math.round(done / core.length * 100) + '%"></i></div>' +
        (todo.length ? '<ul class="checks">' + todo.slice(0, 4).map(li).join("") + "</ul>" + (todo.length > 4 ? '<p class="note">그 밖에 ' + (todo.length - 4) + "개가 남았습니다. 한 단계씩 채우면 됩니다.</p>" : "")
          : '<p class="note" style="color:var(--ok)">기본 설계를 모두 마쳤습니다. 아래 항목으로 단원을 더 단단하게 만들어 보세요.</p>') +
        (extra.length ? '<details class="more"><summary>더 좋게 만들기 <span class="need opt">' + extra.length + "</span></summary><ul class=\"checks\">" + extra.map(li).join("") + "</ul></details>" : "");
    }
    return '<div class="label">설계 점검</div><div class="score"><b>' + sc + '</b><span style="color:var(--muted)">/ 100</span></div><div class="meter"><i style="width:' + sc + '%"></i></div>' +
      '<ul class="checks">' + checks.map(li).join("") + "</ul>";
  };
})();
