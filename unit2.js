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

  // 한 흐름(LOI 등) 안에서 선생님이 고른 조각이 이어지는 순서 — 정답이 아니라 거울
  //  예: 지식·이해 → 조사 ×2 → 정리·분석 → 표현·공유 (같은 조각이 이어지면 ×n으로 묶음)
  function seqOf(u, flow) {
    var out = [];
    u.lessons.forEach(function (l) {
      if (l.flow !== flow) return;
      var r = stageRole(u.model, l.stage), label = r ? P.roleNames[r] : (l.stage || "미정");
      var last = out[out.length - 1];
      if (last && last.label === label) last.n++; else out.push({ r: r || "none", label: label, n: 1 });
    });
    return out;
  }
  function seqHtml(u, flow) {
    var s = seqOf(u, flow);
    if (!s.length) return '<span class="seq"><span class="none">차시 없음</span></span>';
    return '<span class="seq">' + s.map(function (x) {
      return '<span data-r="' + x.r + '">' + esc(x.label) + (x.n > 1 ? ' <i class="mono">×' + x.n + "</i>" : "") + "</span>";
    }).join('<span class="arr">→</span>') + "</span>";
  }
  function countOf(u, flow) { return u.lessons.filter(function (l) { return l.flow === flow; }).length; }

  // 단원 전체 흐름 한눈에 보기 — 각 칸은 선생님이 짠 흐름을 그대로 비춤 (색으로 좋고 나쁨을 가리지 않음)
  function flowMap(u) {
    var cells = [["탐구열기", "탐구 열기", ""], ["LOI1", "LOI 1", 0], ["LOI2", "LOI 2", 1], ["LOI3", "LOI 3", 2], ["탐구 마무리", "마무리", ""]];
    return '<div class="flowmap">' + cells.map(function (c) {
      var l = c[2] === "" ? null : (u.lois[c[2]] || {});
      return '<div class="' + (l ? "fm-loi" : "fm-end") + '"><b>' + c[1] + (l && l.concept ? ' <span class="cc">' + esc(l.concept) + "</span>" : "") +
        ' <span class="fm-n mono">' + countOf(u, c[0]) + "차시</span></b>" + (l && l.text ? "<small>" + esc(l.text) + "</small>" : "") + seqHtml(u, c[0]) + "</div>";
    }).join("") +
      '<p class="fm-note">정해진 순서는 없습니다. 차시마다 고른 <b>탐구 조각</b>이 어떤 순서로 이어지는지 비춰 보는 거울입니다.' + H.help("탐구 조각") + "</p></div>" +
      '<details class="more tip"><summary>설계 팁 · 작은 탐구 흐름 <span class="need opt">참고</span></summary><div class="more-body">' +
      "<p>LOI 하나 안에서도 <b>지식·이해 → 조사 → 정리·분석 → 표현·공유</b>가 이어지면, 학생이 자기 이해를 만들 시간이 생깁니다.</p>" +
      "<ul class=\"plain\"><li>국내 IB 학교 <b>컨설팅에서 나온 팁</b>이며, IB 공식 지침은 아닙니다.</li>" +
      "<li>배경지식을 교사가 먼저 안내할지(지식·이해), 학생이 조사로 알아가게 할지는 <b>학년과 단원에 맞게 선생님이 판단</b>합니다.</li>" +
      "<li>표현·공유는 말하기 발표만이 아닙니다. 그림, 영상(UCC), 전시, 연극, 모형, 노래 등 <b>주제와 청중에 맞는 방식</b>을 고르세요.</li>" +
      "<li>LOI마다 다른 모양이어도 좋습니다. ‘차시 뼈대 만들기’에서 <b>팁 예시로 채우기</b>를 고르면 이 흐름으로 시작한 뒤 자유롭게 고칠 수 있습니다.</li></ul>" +
      "</div></details>";
  }

  // 흐름(탐구열기·LOI·마무리)이 바뀌는 자리에 머리줄
  function blockHead(u, flow, cols) {
    var i = ["LOI1", "LOI2", "LOI3"].indexOf(flow), l = i >= 0 ? (u.lois[i] || {}) : null;
    return '<tr class="blk"><td colspan="' + cols + '"><div class="blk-in"><b>' + (i >= 0 ? "LOI " + (i + 1) : esc(flow || "흐름 미정")) + "</b>" +
      (l && l.text ? '<span class="blk-loi">' + esc(l.text) + "</span>" : "") + (l && l.concept ? '<span class="cc">' + esc(l.concept) + "</span>" : "") +
      seqHtml(u, flow) +
      (flow ? '<button class="btn ghost" data-act="addLessonIn" data-f="' + esc(flow) + '">＋ 이 흐름에 차시</button>' : "") + "</div></td></tr>";
  }

  // 사고 가시화 루틴 21 (『생각이 보이는 교실』) + 그 밖의 교실 활동
  function routineLib() {
    function card(x) {
      return '<div class="routine"><b>' + esc(x.name) + '</b><span class="en">' + esc(x.en) + "</span><p>" + esc(x.how) + '</p><span class="fit">' +
        x.fit.map(function (r) { return '<span data-r="' + r + '">' + P.roleNames[r] + "</span>"; }).join("") + "</span></div>";
    }
    return '<p class="note">학생의 생각을 말·글·그림으로 드러내는 루틴입니다. 하버드 Project Zero 연구를 정리한 『생각이 보이는 교실』(론 리치하트·마크 처치·캐린 모리슨)의 21가지를 책의 세 장으로 나누었고, 이름은 번역본 표기를 따랐습니다. 아래 색 표시는 <b>어울리는 탐구 조각</b>이며, 다른 조각에 써도 됩니다.' + H.help("사고 가시화 루틴") + "</p>" +
      P.vtrChapters.map(function (t, k) {
        return '<div class="rt-group"><span class="label">' + (k + 1) + ". " + t + '</span><div class="routines">' + P.vtr.filter(function (x) { return x.ch === k + 1; }).map(card).join("") + "</div></div>";
      }).join("") +
      '<div class="rt-group"><span class="label">그 밖에 IB 교실에서 자주 쓰는 활동 (책의 21가지는 아님)</span><div class="routines">' + P.classTools.map(card).join("") + "</div></div>";
  }

  R.lessons = function (u) {
    var stages = P.models[u.model], cols = UI.guided ? 6 : 10, free = u.model === P.freeModel;
    // 흐름 이름은 머리줄에 있으므로 칸에서는 짧게 (저장 값은 그대로)
    var FLOW_SHORT = P.flows.map(function (f) { return [f, f === "탐구열기" ? "열기" : f === "탐구 마무리" ? "마무리" : f.replace("LOI", "LOI ")]; });
    var rows = "", prev = null;
    u.lessons.forEach(function (l, i) {
      if (l.flow !== prev) { rows += blockHead(u, l.flow, cols); prev = l.flow; }
      var p = "lessons." + i + ".", role = stageRole(u.model, l.stage);
      rows += '<tr><td class="mono" style="padding-top:12px">' + (i + 1) + "</td><td>" + H.sel(p + "flow", l.flow, FLOW_SHORT) + '</td><td class="stg" data-r="' + role + '">' + H.sel(p + "stage", l.stage, stages.map(function (s) { return s[0]; }), free ? "조각 고르기" : "—") +
        "</td><td>" + H.sel(p + "ilp", l.ilp, P.ilp.map(function (x) { return x[0]; }), "—") + "</td><td>" + H.ta(p + "method", l.method, P.roleHint[role] || "", 2) + "</td>" +
        (UI.guided ? "" : "<td>" + H.ta(p + "note", l.note, "", 2) + "</td><td>" + H.ta(p + "reflection", l.reflection, "의도와 달랐던 점, 아이들 반응", 2) + "</td><td>" + H.ta(p + "studentRefl", l.studentRefl, "", 2) + "</td><td>" + H.ta(p + "studentWork", l.studentWork, "", 2) + "</td>") +
        '<td class="rowbtn"><button class="btn ghost" data-act="moveLesson" data-i="' + i + '" aria-label="위로">↑</button><button class="btn ghost" data-act="moveLesson" data-dir="down" data-i="' + i + '" aria-label="아래로">↓</button><button class="btn ghost" data-act="delLesson" data-i="' + i + '" aria-label="삭제">✕</button></td></tr>';
    });
    var n = Number(u.lessonsPlanned) || 0;
    return H.guide("lessons") +
      '<section class="sec">' + H.secH("차시 운영 계획", "Lesson sequence",
        H.prompt("lessons") + H.ai("lessons", "AI 제안") + '<button class="btn" data-act="scaffold">차시 뼈대 만들기</button><button class="btn" data-act="addLesson">＋ 차시</button>') +
      flowMap(u) +
      '<div class="row">' + H.field(free ? "차시에 고를 목록" : "탐구 모형", H.sel("model", u.model, Object.keys(P.models)),
        free ? "‘탐구 조각’은 순서 없이 골라 조합합니다. 개념 기반 탐구·머독 사이클 단계로 고르고 싶으면 바꾸세요(둘 다 IB 공식 모형이 아닌 참고 모형)." : "두 모형 모두 IB 공식 모형이 아닌 참고 모형이며, 한 번 도는 순서가 아니라 되풀이되는 순환입니다. 순서 없이 고르려면 ‘탐구 조각’으로 바꾸세요.") +
      '<div class="field"><span class="label">' + (free ? "조각" : "단계") + " 쓰임 · 차시표 " + u.lessons.length + " / 계획 " + n + '차시</span><div class="chips">' + stages.map(function (s) {
        var k = u.lessons.filter(function (l) { return l.stage === s[0]; }).length;
        return '<span class="pill' + (k ? "" : " zero") + '" title="' + esc(s[2]) + '">' + s[0] + ' <b class="mono">' + k + "</b></span>";
      }).join("") + "</div></div></div>" +
      (UI.guided ? '<p class="note">★ ‘적용·전이’(배운 것을 새 상황에 쓰기)와 학생 ‘실천’은 서로 다릅니다. 실천은 학생이 스스로 시작하며, 운영하면서 실천·성찰 탭에 기록합니다.</p>' : "") +
      '<div class="tbl-wrap"><table class="lessons" style="min-width:' + (UI.guided ? 900 : 1280) + 'px"><thead><tr><th style="width:44px">차시</th><th style="width:96px">흐름</th><th style="width:172px">' + (free ? "탐구 조각" : "탐구단계") + '</th><th style="width:164px" title="2025 탐구 학습 발달 단계">탐구 기능</th><th>교수학습방법 및 전략</th>' +
      (UI.guided ? "" : '<th style="width:170px">비고</th><th style="width:190px">차시별 성찰</th><th style="width:150px">학생 성찰</th><th style="width:150px">학생 활동 결과</th>') + '<th style="width:100px"></th></tr></thead><tbody>' +
      (u.lessons.length ? rows : '<tr><td colspan="' + cols + '" style="color:var(--faint);padding:14px">‘차시 뼈대 만들기’를 누르면 계획 차시 수에 맞춰 탐구 열기 · LOI 1~3 · 마무리에 차시가 나뉩니다. 탐구 조각은 직접 고르거나, 팁 예시로 채운 뒤 고칠 수 있습니다.</td></tr>') +
      "</tbody></table></div>" + H.aiOut("lessons") +
      (UI.guided ? '<p class="note">차시별 성찰·학생 성찰·결과물 칸은 단원을 운영하면서 채웁니다. 왼쪽 아래 ‘전체 보기’로 바꾸면 나타납니다.</p>' : "") + "</section>" +
      '<section class="sec">' + H.secH("사고 가시화 루틴", "Visible Thinking · 생각이 보이는 교실") + H.more("routines", "루틴 21가지와 교실 활동 보기", routineLib()) + "</section>";
  };

  R.reflect = function (u) {
    return H.guide("reflect") +
      '<section class="sec">' + H.secH("학생 실천", "Student-initiated action", H.prompt("action") + H.ai("action", "AI 제안"), "실천") +
      H.field("예상되는 실천 유형", H.chips(P.actionTypes.map(function (a) { return { v: a[0], label: a[0] + "<small>" + a[1] + "</small>", d: a[2] }; }), "actionTypes", u.actionTypes), "학생이 배움에서 스스로 시작할 법한 실천을 미리 떠올려 봅니다.", "opt") +
      H.field("교사는 학생 실천을 어떻게 지원할까?", H.ta("action", u.action, "시간·공간·자료·연결할 사람 등 실천의 기회를 여는 방법", 3), "", "opt") +
      H.more("studentAction", "학생이 실제로 제안한 실천 기록하기", H.field("", H.ta("studentAction", u.studentAction, "운영 중 학생들이 제안하거나 실행한 실천", 3))) + H.aiOut("action") + "</section>" +

      '<section class="sec">' + H.secH("교사 성찰", "Before · During · After") +
      '<div class="row">' + H.field("운영 전", H.ta("reflect.before", u.reflect.before, "예상되는 어려움, 학생 실태, 협의한 결정", 5), "", "opt") +
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
    var counts = {}; checks.forEach(function (c) { if (c.level !== "ok" && c.phase !== "run" && (!UI.guided || c.core)) counts[c.tab] = (counts[c.tab] || 0) + 1; });
    var idx = TABS.findIndex(function (x) { return x[0] === tab; }), next = TABS[idx + 1];
    // 설계는 차시 운영에서 끝남 — 실천·성찰은 운영하면서
    var nextBar = !UI.guided || !next ? "" : tab === "lessons"
      ? '<div class="nextbar"><span class="note" style="margin:0 auto 0 0">여기까지가 <b>단원 설계</b>입니다. 실천·성찰은 단원을 운영하면서 채웁니다.</span><button class="btn" data-tab="reflect">실천 · 성찰 미리 보기 →</button></div>'
      : '<div class="nextbar"><button class="btn primary" data-tab="' + next[0] + '">다음 단계: ' + next[1] + " →</button></div>";
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
        return '<button role="tab" data-tab="' + x[0] + '" aria-selected="' + (x[0] === tab) + '">' + (UI.guided && i < 5 ? '<span class="step">' + (i + 1) + "</span>" : "") + x[1] +
          (x[0] === "reflect" ? '<span class="run" title="단원을 운영하면서 채웁니다">운영</span>' : "") + (counts[x[0]] ? '<span class="n">' + counts[x[0]] + "</span>" : "") + "</button>";
      }).join("") + '</div><div id="tabBody">' +
      (RESET[tab] ? '<div class="tabbar"><span>' + RESET[tab].note + '</span><button class="btn" data-act="resetTab">이 단계 초기화</button></div>' : "") +
      R[tab](u) +
      nextBar +
      "</div></div>" + '<aside class="panel" id="checkPanel">' + renderChecks(checks, sc) + "</aside></div>";
  };

  var renderChecks = window.renderChecks = function (checks, sc) {
    function li(c) {
      return '<li data-l="' + c.level + '" data-goto="' + c.tab + '"><span class="ic">' + (c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "·") + "</span><span>" + c.text + (c.tip ? "<small>" + esc(c.tip) + "</small>" : "") + "</span></li>";
    }
    var plan = checks.filter(function (c) { return c.phase !== "run"; }), run = checks.filter(function (c) { return c.phase === "run"; });
    var runBox = run.length ? '<details class="more run-box"><summary>운영하면서 채울 것 <span class="need opt">' + run.filter(function (c) { return c.level !== "ok"; }).length + "</span></summary>" +
      '<p class="note" style="margin:6px 0">설계 점수에 들어가지 않습니다. 단원을 운영하는 동안이나 마친 뒤에 채우세요.</p><ul class="checks">' + run.map(li).join("") + "</ul></details>" : "";
    if (UI.guided) {
      var core = plan.filter(function (c) { return c.core; }), todo = core.filter(function (c) { return c.level !== "ok"; });
      var done = core.length - todo.length, extra = plan.filter(function (c) { return !c.core && c.level !== "ok"; });
      return '<div class="label">꼭 할 일 · 설계</div><div class="score"><b>' + done + '</b><span style="color:var(--muted)">/ ' + core.length + ' 완료</span></div><div class="meter"><i style="width:' + Math.round(done / core.length * 100) + '%"></i></div>' +
        (todo.length ? '<ul class="checks">' + todo.slice(0, 4).map(li).join("") + "</ul>" + (todo.length > 4 ? '<p class="note">그 밖에 ' + (todo.length - 4) + "개가 남았습니다. 한 단계씩 채우면 됩니다.</p>" : "")
          : '<p class="note" style="color:var(--ok)">기본 설계를 모두 마쳤습니다. 아래 항목으로 단원을 더 단단하게 만들어 보세요.</p>') +
        (extra.length ? '<details class="more"><summary>더 좋게 만들기 <span class="need opt">' + extra.length + "</span></summary><ul class=\"checks\">" + extra.map(li).join("") + "</ul></details>" : "") + runBox;
    }
    return '<div class="label">설계 점검</div><div class="score"><b>' + sc + '</b><span style="color:var(--muted)">/ 100</span></div><div class="meter"><i style="width:' + sc + '%"></i></div>' +
      '<ul class="checks">' + plan.map(li).join("") + "</ul>" + runBox;
  };
})();
