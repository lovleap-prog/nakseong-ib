// 탐구단원 편집기 (1부: 공통 도구 · 개요 · 개념·탐구 · 교과)
(function () {
  var P = window.PYP;
  window.UI = window.UI || { guided: true };
  var esc = window.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var atlOptions = window.atlOptions = [];
  P.atl.forEach(function (g) { g.items.forEach(function (it) { atlOptions.push({ v: g.group.replace(" ", "") + " - " + it[0], group: g.group, name: it[0], d: it[1] }); }); });
  window.themeOf = function (id) { return P.themes.find(function (t) { return t.id === id; }); };

  var H = window.H = {
    inp: function (k, v, ph, type) { return '<input type="' + (type || "text") + '" id="f-' + k + '" data-k="' + k + '" value="' + esc(v) + '" placeholder="' + esc(ph || "") + '">'; },
    ta: function (k, v, ph, rows, cls) { return '<textarea id="f-' + k + '" data-k="' + k + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || "") + '"' + (cls ? ' class="' + cls + '"' : "") + ">" + esc(v) + "</textarea>"; },
    sel: function (k, v, opts, blank) {
      return '<select id="f-' + k + '" data-k="' + k + '">' + (blank != null ? '<option value="">' + esc(blank) + "</option>" : "") +
        opts.map(function (o) { var val = typeof o === "string" ? o : o[0], lab = typeof o === "string" ? o : o[1]; return '<option value="' + esc(val) + '"' + (val === v ? " selected" : "") + ">" + esc(lab) + "</option>"; }).join("") + "</select>";
    },
    chips: function (list, key, arr, max) {
      return '<div class="chips">' + list.map(function (o) {
        var v = typeof o === "string" ? o : o.v, lab = typeof o === "string" ? o : o.label;
        return '<span class="chip" role="button" tabindex="0" data-toggle="' + key + '" data-max="' + (max || 99) + '" data-v="' + esc(v) + '" aria-pressed="' + (arr.indexOf(v) >= 0) + '"' + (o.d ? ' title="' + esc(o.d) + '"' : "") + ">" + lab + "</span>";
      }).join("") + "</div>";
    },
    // 제목 옆 ? 단추 — 용어 사전 열기
    help: function (term) { return window.GLOSSARY[term] ? ' <button class="hlp" data-act="help" data-term="' + esc(term) + '" aria-label="' + esc(term) + ' 설명" title="' + esc(term) + ' 설명 보기">?</button>' : ""; },
    secH: function (title, en, tools, term) {
      return '<div class="sec-h"><h3>' + title + (term ? H.help(term) : "") + "</h3>" + (en ? '<span class="en">' + en + "</span>" : "") + (tools ? '<div class="tools">' + tools + "</div>" : "") + "</div>";
    },
    // need: "req"(필수) | "opt"(선택) — 안내 모드에서만 표시
    field: function (label, body, hint, need) {
      var badge = UI.guided && need ? ' <span class="need ' + need + '">' + (need === "req" ? "필수" : "선택") + "</span>" : "";
      return '<div class="field">' + (label ? '<span class="label">' + label + badge + "</span>" : "") + body + (hint ? '<span class="hint">' + hint + "</span>" : "") + "</div>";
    },
    // 안내 모드에서는 접어 두는 심화 영역
    more: function (id, title, inner) {
      if (!UI.guided) return inner;
      var open = UI.open && UI.open[id];
      return '<details class="more" data-more="' + id + '"' + (open ? " open" : "") + '><summary>' + title + ' <span class="need opt">선택</span></summary><div class="more-body">' + inner + "</div></details>";
    },
    guide: function (tab) {
      var g = P.guide[tab]; if (!UI.guided || !g) return "";
      return '<div class="guide"><div><span class="label">이 단계에서 할 일</span><ol>' + g.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ol></div>" +
        '<p><b>왜 필요할까요?</b> ' + g.why + "</p></div>";
    },
    // AI 관련 기능은 제목 옆 ‘AI 도움’ 메뉴 하나로 모음 (단추가 늘어나 산만해지지 않게)
    ai: function () { return ""; },
    prompt: function (kind) {
      var aiKind = { ci: "ci", loi: "loi", criteria: "criteria", grasps: "summative", lessons: "lessons", action: "action" }[kind];
      return '<details class="aimenu"><summary class="btn">AI 도움 ▾</summary><div class="aimenu-list">' +
        '<button data-act="prompt" data-kind="' + kind + '"><b>📋 내 AI용 프롬프트 복사</b><small>ChatGPT·제미나이·클로드 등에 붙여 넣기</small></button>' +
        '<button data-act="pasteOpen" data-kind="' + kind + '"><b>📥 AI 답 붙여넣기</b><small>받은 답을 이 칸에 자동으로 넣기</small></button>' +
        (aiKind ? '<button class="ai-only" data-act="ai" data-kind="' + aiKind + '"><b>✨ 바로 제안 받기</b><small>claude.ai에서 열었을 때만</small></button>' : "") +
        "</div></details>";
    },
    aiOut: function (kind) { return '<div class="ai-out" id="ai-' + kind + '" hidden></div>'; }
  };

  var R = window.UnitTabs = {};

  R.overview = function (u) {
    var t = themeOf(u.theme);
    return H.guide("overview") +
      '<section class="sec">' + H.secH("단원 개요", "Overview") +
      '<div class="row">' + H.field("탐구단원 제목", H.inp("title", u.title, "예: 이야기에 담긴 우리의 목소리"), "", "req") +
      H.field("학년", H.sel("grade", String(u.grade), [1, 2, 3, 4, 5, 6].map(function (g) { return [String(g), g + "학년"]; })), "", "req") +
      H.field("진행 상태", H.sel("status", u.status, ["초안", "검토 중", "확정", "운영 중", "운영 완료"])) + "</div>" +
      H.field("초학문적 주제" + H.help("초학문적 주제"), H.sel("theme", u.theme, P.themes.map(function (x) { return [x.id, x.ko + " · " + x.en]; }), "주제를 고르세요"), "", "req") +
      (t ? '<div class="theme-band" style="--tc:var(--' + t.color + ')"><div><b>' + t.ko + "</b><p>" + t.desc + "이 다음을 통해 이루어집니다. <span class=\"pill\">2024.12 개정 설명</span></p></div></div>" +
        H.field("세부 주제" + H.help("세부 주제"), H.chips(t.subs, "subs", u.subs), "이 단원이 초점을 두는 갈래를 고르세요. 여러 개 골라도 됩니다.", "req") : "") +
      '<div class="row">' + H.field("운영 학기", H.sel("semester", u.semester, ["1학기", "2학기", "1~2학기"], "고르세요"), "성취기준이 지도계획의 몇 학기에 있는지와 맞추면 좋습니다.", "req") +
      H.field("기간", H.inp("period", u.period, "2026. 4. 6. ~ 5. 8.")) +
      H.field("계획 차시", H.inp("lessonsPlanned", u.lessonsPlanned, "", "number"), "", "req") +
      H.field("협력적 계획 팀", H.inp("team", u.team, "담임, 교과전담, 사서교사 등")) + "</div></section>" +
      '<section class="sec">' + H.secH("맥락", "Local · Global · Nature") +
      H.more("context", "지역·세계 맥락과 인간·자연 연결 적기",
        (window.SCHOOL ? '<div class="field"><span class="label">우리 학교 지역 자원에서 고르기</span><div class="chips">' + SCHOOL.local.map(function (x) {
          return '<button class="chip" data-act="addLocal" data-v="' + esc(x[0]) + '" title="' + esc(x[1]) + '">＋ ' + esc(x[0]) + "</button>";
        }).join("") + '</div><span class="hint">누르면 ‘지역 맥락’ 칸에 더해집니다. 자세한 내용은 자료실 › 우리 학교에 있습니다.</span></div>' : "") +
        '<div class="row">' + H.field("지역 맥락", H.ta("context.local", u.context.local, "우리 학교·마을에서 만날 수 있는 사례나 사람", 2)) +
        H.field("세계 맥락", H.ta("context.global", u.context.global, "다른 나라·지구촌과 연결되는 지점", 2)) +
        H.field("인간·자연 연결", H.ta("context.nature", u.context.nature, "이 주제에서 사람과 자연은 어떻게 이어져 있나?", 2)) + "</div>" +
        '<p class="note">2025 개편에서 초학문적 주제 설명은 인간과 자연 세계의 상호연결을 함께 보도록 바뀌었습니다. 국제적 소양은 가까운 지역에서 세계로 넓혀 갈 때 자랍니다.</p>') +
      H.field("자료 · 자원", H.ta("resources", u.resources, "도서, 웹사이트, 지역 인사, 현장체험 장소", 2)) + "</section>";
  };

  R.concept = function (u) {
    var cOpts = P.concepts.map(function (c) { return { v: c.ko, label: c.ko + "<small>" + c.en + "</small>", d: c.q + " — " + c.rel }; });
    var loiOpts = u.concepts.length ? u.concepts : P.concepts.map(function (c) { return c.ko; });
    var tips = u.centralIdea ? ciTips(u.centralIdea.trim()) : [];
    return H.guide("concept") +
      '<section class="sec">' + H.secH("① 명시된 개념", "Specified concepts", '<span class="pill">' + u.concepts.length + "/3</span>", "명시된 개념") +
      H.field("", H.chips(cOpts, "concepts", u.concepts, 3), "", "req") +
      '<div class="cq">' + u.concepts.map(function (k) { var c = P.concepts.find(function (x) { return x.ko === k; }); return "<b>" + k + "</b> " + c.q + " <span style=\"color:var(--faint)\">함께 쓰는 추가 개념 예: " + c.rel + "</span>"; }).join("<br>") + "</div>" +
      H.field("추가 개념" + H.help("추가 개념"), H.inp("related", u.related, "쉼표로 구분 — 예: 의도, 해석, 구조"), "2025 개편 용어입니다(예전 ‘관련 개념’). 교과에 가까운 구체적인 개념을 적습니다.", "opt") + "</section>" +

      '<section class="sec">' + H.secH("② 중심 아이디어", "Central idea", H.prompt("ci") + H.ai("ci", "AI 제안"), "중심 아이디어") +
      (UI.guided ? '<div class="frames"><span class="label">문장 틀로 시작하기</span><div class="chips">' + P.ciFrames.map(function (f, i) { return '<button class="chip" data-act="frame" data-i="' + i + '">' + esc(f) + "</button>"; }).join("") + "</div></div>" : "") +
      H.field("", H.ta("centralIdea", u.centralIdea, "두 개 이상의 개념을 잇는, 다른 상황에도 옮겨 쓸 수 있는 진술문 한 문장", 3, "ci"), "", "req") +
      '<div class="ci-live" id="ciLive">' + ciLive(u.centralIdea, tips) + "</div>" + H.aiOut("ci") + "</section>" +

      '<section class="sec">' + H.secH("③ 탐구 목록", "Lines of inquiry", H.prompt("loi") + H.ai("loi", "AI 제안"), "탐구 목록") +
      u.lois.map(function (l, i) {
        return '<div class="loi"><span class="tag">LOI ' + (i + 1) + "</span>" + H.ta("lois." + i + ".text", l.text, i === 0 ? "예: 이야기를 구성하는 요소와 형식" : "중심 아이디어를 풀어 가는 탐구의 한 갈래 (질문이 아닌 구절)", 2) +
          H.sel("lois." + i + ".concept", l.concept, loiOpts, "연결 개념") + "</div>";
      }).join("") + H.aiOut("loi") + "</section>" +

      '<section class="sec">' + H.secH("④ 질문과 학생 주도성", "Questions & agency", H.prompt("questions")) +
      '<div class="row">' + H.field("교사 질문 · 도발", H.ta("teacherQs", u.teacherQs, "한 줄에 하나씩. 개념 질문에서 시작해 보세요 (예: 어떻게 변하는가?)", 4)) +
      H.field("학생 질문", H.ta("studentQs", u.studentQs, "탐구열기에서 학생들이 실제로 던진 궁금증을 모아 적습니다", 4), "학생 질문은 탐구 방향을 함께 정하는 출발점입니다.", "opt") + "</div>" +
      H.field("학생이 선택하는 것" + H.help("학생 주도성"), H.inp("agency", u.agency, "예: 발표 형식과 조사할 사례를 모둠이 고른다"), "학생의 목소리·선택·주인의식(agency)이 드러나는 지점을 한 줄로 적습니다.", "opt") + "</section>" +

      '<section class="sec">' + H.secH("⑤ 학습자상", "Learner profile", '<span class="pill">' + u.lp.length + "/3</span>", "학습자상") + H.field("", H.chips(P.learnerProfile, "lp", u.lp, 3), UI.guided ? "처음이라면 1~2개만 골라 깊게 다뤄도 충분합니다." : "", "req") + "</section>" +
      '<section class="sec">' + H.secH("⑥ 학습 접근 방법", "ATL skills", '<span class="pill">' + u.atl.length + "/3</span>", "학습 접근 방법") +
      P.atl.map(function (g) {
        return H.field(g.group, H.chips(atlOptions.filter(function (o) { return o.group === g.group; }).map(function (o) { return { v: o.v, label: o.name, d: o.d }; }), "atl", u.atl, 3));
      }).join("") + "</section>" +
      '<section class="sec">' + H.secH("교수 접근 방법", "Approaches to teaching") + H.more("teaching", "이 단원에서 강조할 교수 접근 고르기", H.chips(P.teaching, "teaching", u.teaching)) + "</section>";
  };

  var ciLive = window.ciLive = function (ci, tips) {
    if (!ci || !ci.trim()) return UI.guided ? '<span class="hint">문장을 쓰는 동안 여기에서 바로 점검해 드립니다.</span>' : "";
    tips = tips || ciTips(ci.trim());
    return tips.length ? tips.map(function (t) { return '<span class="pill warn">! ' + esc(t) + "</span>"; }).join(" ") : '<span class="pill ok">✓ 개념적 진술의 기본 형태를 갖췄습니다</span>';
  };

  R.subjects = function (u) {
    var hours = u.subjects.reduce(function (a, s) { return a + (Number(s.hours) || 0); }, 0);
    var diff = hours - Number(u.lessonsPlanned || 0);
    return H.guide("subjects") +
      '<section class="sec">' + H.secH("교과 · 시수 · 성취기준", "Subjects & standards",
        '<button class="btn primary" data-act="pickStd">＋ 우리 학년 성취기준에서 고르기</button><button class="btn" data-act="addSubject">직접 입력</button>', "성취기준") +
      (UI.guided ? '<p class="note">‘고르기’를 누르면 <b>' + (window.STD_API ? STD_API.band(u.grade) : "") + '학년군 2022 개정 성취기준</b>이 나옵니다. 올해 우리 학년 연간지도계획에 들어 있는 것부터 보여 주고, 같은 학년 다른 단원이 이미 쓴 성취기준도 표시합니다.</p>' : "") +
      '<div class="tbl-wrap"><table><thead><tr><th style="width:150px">교과</th><th style="width:80px">시수</th><th style="width:140px">성취기준 코드</th><th>성취기준 내용</th><th style="width:40px"></th></tr></thead><tbody>' +
      (u.subjects.length ? u.subjects.map(function (s, i) {
        var std = window.STD_API && s.code ? STD_API.find(u.grade, s.code.replace(/[\[\]\s]/g, "")) : null;
        var note = std ? '<span class="hint">' + (std.inPlan ? std.sem + "학기 · " + esc((std.units[0] || "").slice(0, 20)) : "올해 지도계획에 없는 성취기준") +
          (std.A ? ' · <button class="lnk" data-act="showLevels" data-code="' + std.code + '">성취수준 보기</button>' : "") + "</span>" : "";
        return "<tr><td>" + H.sel("subjects." + i + ".subject", s.subject, P.subjects, "교과") + "</td><td>" + H.inp("subjects." + i + ".hours", s.hours, "0", "number") +
          "</td><td>" + H.inp("subjects." + i + ".code", s.code, "[4국05-02]") + "</td><td>" + H.ta("subjects." + i + ".content", s.content, "성취기준 원문", 1) + note +
          '</td><td><button class="btn ghost" data-act="delSubject" data-i="' + i + '" aria-label="삭제">✕</button></td></tr>';
      }).join("") : '<tr><td colspan="5" style="color:var(--faint);padding:14px">‘우리 학년 성취기준에서 고르기’를 눌러 시작하세요.</td></tr>') +
      '</tbody><tfoot><tr><th>합계</th><th class="mono">' + hours + '</th><th colspan="3" style="font-weight:400">계획 차시 <span class="mono">' + (u.lessonsPlanned || 0) + "</span> " +
      (diff === 0 ? '<span class="pill ok">일치</span>' : '<span class="pill warn">' + (diff > 0 ? diff + "시간 초과" : -diff + "시간 부족") + "</span>") + "</th></tr></tfoot></table></div>" +
      '<p class="note">성취기준 원문: 교육부 「2022 개정 교육과정에 따른 성취수준」(초등) · 학년·학기·단원 연결: 낙성초 2026학년도 학년별 연간지도계획</p></section>' +
      '<section class="sec">' + H.secH("학습 목표", "Learning goals") + H.field("", H.ta("goals", u.goals, "이 단원을 마치면 학생은…", 3), "", "opt") + "</section>";
  };
})();
