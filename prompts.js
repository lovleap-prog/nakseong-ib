// 외부 생성형 AI(ChatGPT·제미나이·클로드 등)에 붙여 넣을 프롬프트 모음
// 각 프롬프트 = 역할 + 우리 학교 맥락 + 지금 단원 내용 + IB 기준 + 출력 형식
(function () {
  var P = window.PYP;

  var ROLE = "당신은 IB PYP 교육과정 코디네이터입니다. 한국 초등학교(전남 보성 낙성초, IB 관심학교)의 선생님이 탐구단원(UOI)을 처음 설계하고 있습니다.\n" +
    "다음을 지켜 주세요.\n" +
    "· 쉬운 한국어로 쓰고, 전문 용어는 처음 나올 때 한 번 풀어 씁니다.\n" +
    "· 2025 개편 PYP 용어를 씁니다: 명시된 개념(형태·기능·인과관계·변화·연결·관점·책임), 추가 개념.\n" +
    "· 아래에 주어진 단원 자료에 근거해서 쓰고, 모르는 것은 지어내지 않습니다.\n" +
    "· 해당 학년 학생이 이해할 수 있는 수준으로 씁니다.";

  var FORMAT_HEAD = "\n\n[출력 형식]\n아래 형식만 그대로 출력하세요. 설명이나 인사말은 쓰지 마세요. 항목 이름을 바꾸지 마세요.\n";

  // 지금 단원 내용을 사람이 읽는 형태로 정리
  function unitBlock(u, opt) {
    opt = opt || {};
    var t = themeOf(u.theme);
    var L = [];
    L.push("[단원 자료]");
    L.push("학년: " + u.grade + "학년");
    if (t) {
      L.push("초학문적 주제: " + t.ko + " (" + t.en + ")");
      L.push("주제 설명: " + t.desc + " — " + t.subs.join(" / "));
    }
    if (u.subs.length) L.push("이 단원이 다루는 세부 주제: " + u.subs.join(" / "));
    if (u.title) L.push("단원 제목: " + u.title);
    if (u.period) L.push("기간: " + u.period + " / 계획 차시: " + (u.lessonsPlanned || "") + "차시");
    if (u.concepts.length) L.push("명시된 개념: " + u.concepts.join(", "));
    if (u.related) L.push("추가 개념: " + u.related);
    if (u.centralIdea) L.push("중심 아이디어: " + u.centralIdea);
    var lois = u.lois.filter(function (l) { return l.text; });
    if (lois.length) L.push("탐구 목록(LOI): " + lois.map(function (l, i) { return (i + 1) + ") " + l.text + (l.concept ? " [" + l.concept + "]" : ""); }).join(" / "));
    if (u.studentQs) L.push("학생 질문: " + u.studentQs.split("\n").join(" / "));
    if (u.teacherQs && opt.teacherQs !== false) L.push("교사 질문: " + u.teacherQs.split("\n").join(" / "));
    if (u.agency) L.push("학생이 선택하는 것: " + u.agency);
    if (u.lp.length) L.push("학습자상: " + u.lp.join(", "));
    if (u.atl.length) L.push("학습 접근 방법(ATL): " + u.atl.join(", "));
    var subj = u.subjects.filter(function (s) { return s.subject; });
    if (subj.length) L.push("연계 교과와 성취기준:\n" + subj.map(function (s) { return "  · " + s.subject + " " + (s.hours || "?") + "시간 " + (s.code || "") + " " + (s.content || ""); }).join("\n"));
    var ctx = [];
    if (u.context.local) ctx.push("지역: " + u.context.local);
    if (u.context.global) ctx.push("세계: " + u.context.global);
    if (u.context.nature) ctx.push("인간·자연: " + u.context.nature);
    if (ctx.length) L.push("맥락 — " + ctx.join(" / "));
    if (u.criteria && opt.criteria !== false) L.push("성공 기준:\n" + u.criteria.split("\n").map(function (x) { return "  · " + x; }).join("\n"));
    if (opt.lessons && u.lessons.length) {
      L.push("차시 계획:");
      u.lessons.forEach(function (l, i) { L.push("  " + (i + 1) + "차시 [" + l.flow + " · " + l.stage + (l.ilp ? " · " + l.ilp : "") + "] " + (l.method || "(비어 있음)")); });
    }
    if (opt.assess) {
      if (u.prior) L.push("사전 지식 확인: " + u.prior);
      if (u.formative) L.push("모니터링: " + u.formative);
      var tool = u.summativeTool === "RAFT" ? u.raft : u.grasps;
      var filled = Object.keys(tool).filter(function (k) { return tool[k]; });
      if (filled.length) L.push("총괄 과제(" + u.summativeTool + "): " + filled.map(function (k) { return k + "=" + tool[k]; }).join(" / "));
    }
    if (opt.action) {
      if (u.actionTypes.length) L.push("예상 실천 유형: " + u.actionTypes.join(", "));
      if (u.action) L.push("교사 지원 계획: " + u.action);
    }
    // 학교교육과정에서 뽑은 우리 학교 맥락을 맨 앞에 둠
    return (window.SCHOOL ? SCHOOL.promptBlock() + "\n\n" : "") + L.join("\n");
  }

  // kind: {name, desc, build(u), parse(text) → {label, apply(u)} 목록}
  var K = window.PROMPTS = {
    ci: {
      name: "중심 아이디어 만들기",
      where: "개념 · 탐구",
      build: function (u) {
        return ROLE + "\n\n[요청]\n이 단원의 중심 아이디어(Central idea) 후보 3개를 만들어 주세요.\n" +
          "중심 아이디어는 다음을 만족해야 합니다.\n" +
          "1) 명시된 개념 2~3개를 엮은 한 문장의 진술문 (질문이 아님)\n" +
          "2) ‘~할 수 있다’ 같은 학습 목표 표현이 아님\n" +
          "3) 이 단원을 넘어 다른 상황에도 옮겨 쓸 수 있는 이해\n" +
          "4) 초학문적 주제와 세부 주제에 맞음\n" +
          "5) 해당 학년 학생이 이해할 수 있는 낱말\n\n" + unitBlock(u) +
          FORMAT_HEAD +
          "중심아이디어1: (한 문장)\n이유1: (왜 좋은지 한 줄)\n중심아이디어2: (한 문장)\n이유2: (한 줄)\n중심아이디어3: (한 문장)\n이유3: (한 줄)";
      },
      parse: function (m) {
        var out = [];
        [1, 2, 3].forEach(function (i) {
          var v = m["중심아이디어" + i];
          if (v) out.push({ label: v, note: m["이유" + i] || "", apply: function (u) { u.centralIdea = v; } });
        });
        return out;
      }
    },

    loi: {
      name: "탐구 목록(LOI) 만들기",
      where: "개념 · 탐구",
      build: function (u) {
        return ROLE + "\n\n[요청]\n중심 아이디어를 풀어 가는 탐구 목록(Lines of inquiry) 3개를 만들어 주세요.\n" +
          "1) 질문이 아니라 짧은 구절로 씁니다 (예: 이야기를 구성하는 요소와 형식)\n" +
          "2) 세 갈래가 서로 다른 명시된 개념 하나씩과 연결됩니다\n" +
          "3) 고른 명시된 개념이 있으면 그 안에서 고릅니다\n" +
          "4) 셋을 순서대로 탐구하면 중심 아이디어에 이르도록 배열합니다\n\n" + unitBlock(u) +
          FORMAT_HEAD +
          "LOI1: 구절 | 연결 개념\nLOI2: 구절 | 연결 개념\nLOI3: 구절 | 연결 개념";
      },
      parse: function (m) {
        if (!m.LOI1 && !m.LOI2 && !m.LOI3) return [];
        var set = [1, 2, 3].map(function (i) {
          var raw = m["LOI" + i] || "", p = raw.split("|");
          return { text: (p[0] || "").trim(), concept: (p[1] || "").trim().replace(/[\[\]]/g, "") };
        });
        return [{ label: set.map(function (s, i) { return (i + 1) + ". " + s.text + (s.concept ? " (" + s.concept + ")" : ""); }).join("\n"),
          apply: function (u) { u.lois = set; } }];
      }
    },

    questions: {
      name: "교사 질문 만들기",
      where: "개념 · 탐구",
      build: function (u) {
        return ROLE + "\n\n[요청]\n이 단원에서 쓸 교사 질문을 만들어 주세요.\n" +
          "1) 개념 질문에서 시작합니다 (형태=어떻게 생겼는가, 기능=어떻게 작동하는가, 인과관계=왜 그런가, 변화=어떻게 변하는가, 연결=어떻게 이어지는가, 관점=여러 관점은 무엇인가, 책임=우리의 의무는 무엇인가)\n" +
          "2) LOI마다 2개씩, 모두 6개를 만듭니다\n" +
          "3) 예/아니오로 답할 수 없는 열린 질문으로 씁니다\n" +
          "4) 탐구를 여는 도발(provocation) 아이디어도 2개 제안합니다\n\n" + unitBlock(u, { teacherQs: false }) +
          FORMAT_HEAD +
          "교사질문: (한 줄에 하나씩, 6줄)\n도발: (한 줄에 하나씩, 2줄)";
      },
      parse: function (m) {
        var out = [];
        if (m["교사질문"]) out.push({ label: m["교사질문"], apply: function (u) { u.teacherQs = m["교사질문"]; } });
        if (m["도발"]) out.push({ label: "도발 아이디어를 교사 질문 아래에 덧붙이기\n" + m["도발"], apply: function (u) { u.teacherQs = (u.teacherQs ? u.teacherQs.trim() + "\n" : "") + m["도발"]; } });
        return out;
      }
    },

    criteria: {
      name: "성공 기준 만들기",
      where: "평가",
      build: function (u) {
        return ROLE + "\n\n[요청]\n학생이 읽고 스스로 점검할 수 있는 성공 기준을 만들어 주세요.\n" +
          "1) ‘나는 ~할 수 있다’ 형태로 3~4줄\n" +
          "2) 중심 아이디어에 대한 개념적 이해를 보는 줄을 1줄 이상 넣습니다\n" +
          "3) 연계 교과의 성취기준과 이어지는 줄을 1줄 이상 넣습니다\n" +
          "4) 학생이 읽을 문장이므로 짧고 쉬운 말로 씁니다\n\n" + unitBlock(u, { criteria: false }) +
          FORMAT_HEAD + "성공기준: (한 줄에 하나씩)";
      },
      parse: function (m) {
        return m["성공기준"] ? [{ label: m["성공기준"], apply: function (u) { u.criteria = m["성공기준"]; } }] : [];
      }
    },

    grasps: {
      name: "총괄 과제(GRASPS) 만들기",
      where: "평가",
      build: function (u) {
        return ROLE + "\n\n[요청]\n학생이 중심 아이디어에 대한 이해를 보여 줄 총괄 과제를 GRASPS 틀로 설계해 주세요.\n" +
          "1) 교실 밖 실제 상황과 실제 청중이 있는 과제로 만듭니다\n" +
          "2) 우리 지역(전남 보성군 벌교, 작은 학교) 맥락을 활용합니다\n" +
          "3) 산출물은 해당 학년이 3~5차시 안에 만들 수 있는 것이어야 합니다\n" +
          "4) 기준(Standard)에는 개념적 이해와 교과 기능이 함께 드러나게 씁니다\n\n" + unitBlock(u, { assess: true }) +
          FORMAT_HEAD +
          "목적: (학생이 해결할 문제나 도달할 목표)\n역할: (학생이 맡는 역할)\n대상: (결과물을 보거나 듣는 사람)\n상황: (과제가 놓인 맥락과 조건)\n산출물: (학생이 만드는 결과물)\n기준: (평가 기준)";
      },
      parse: function (m) {
        var map = { g: "목적", r: "역할", a: "대상", s: "상황", p: "산출물", st: "기준" };
        var any = Object.keys(map).some(function (k) { return m[map[k]]; });
        if (!any) return [];
        return [{ label: Object.keys(map).map(function (k) { return map[k] + ": " + (m[map[k]] || "-"); }).join("\n"),
          apply: function (u) { u.summativeTool = "GRASPS"; Object.keys(map).forEach(function (k) { if (m[map[k]]) u.grasps[k] = m[map[k]]; }); } }];
      }
    },

    rubric: {
      name: "루브릭 만들기",
      where: "평가",
      build: function (u) {
        var std = u.subjects.filter(function (s) { return s.code; }).map(function (s) {
          var r = window.STD_API && STD_API.find(u.grade, s.code.replace(/[\[\]\s]/g, ""));
          return r && r.A ? "· " + r.code + " 성취수준 — C(시작): " + r.C + " / B(도달): " + r.B + " / A(우수): " + r.A : "";
        }).filter(Boolean).join("\n");
        return ROLE + "\n\n[요청]\n총괄 과제를 평가할 루브릭을 만들어 주세요.\n" +
          "1) 평가 요소 3개: ① 중심 아이디어에 대한 개념적 이해 ② 교과 지식·기능 ③ 학습 접근 방법(ATL) 또는 학습자상\n" +
          "2) 수준은 시작 / 발전 / 도달 / 확장 네 단계이며, 학생이 실제로 보이는 모습으로 씁니다\n" +
          "3) ‘잘함, 보통’ 같은 막연한 말 대신 관찰할 수 있는 행동으로 씁니다\n" +
          "4) 아래 성취수준 자료가 있으면 그 표현을 참고합니다\n\n" + unitBlock(u, { assess: true }) +
          (std ? "\n\n[교육부 성취수준 참고]\n" + std : "") +
          FORMAT_HEAD +
          "평가요소1: (이름) | 영역(개념적 이해/지식·이해/과정·기능/가치·태도/ATL·학습자상)\n시작1: \n발전1: \n도달1: \n확장1: \n평가요소2: (이름) | 영역\n시작2: \n발전2: \n도달2: \n확장2: \n평가요소3: (이름) | 영역\n시작3: \n발전3: \n도달3: \n확장3: ";
      },
      parse: function (m) {
        var rows = [];
        [1, 2, 3, 4, 5].forEach(function (i) {
          var head = m["평가요소" + i]; if (!head) return;
          var p = head.split("|");
          rows.push({ name: (p[0] || "").trim(), domain: (p[1] || "").trim(),
            levels: [m["시작" + i] || "", m["발전" + i] || "", m["도달" + i] || "", m["확장" + i] || ""] });
        });
        if (!rows.length) return [];
        return [{ label: rows.map(function (r) { return "· " + r.name + (r.domain ? " [" + r.domain + "]" : ""); }).join("\n"),
          apply: function (u) { u.rubric = u.rubric.concat(rows); } }];
      }
    },

    lessons: {
      name: "차시 흐름 만들기",
      where: "차시 운영",
      build: function (u) {
        var stages = P.models[u.model].map(function (s) { return s[0] + "(" + s[2] + ")"; }).join(" / ");
        return ROLE + "\n\n[요청]\n이 단원의 차시별 활동을 설계해 주세요.\n" +
          "1) 계획 차시 수에 맞춰, 차시마다 활동을 한 줄로 씁니다 (한 단원은 보통 20~30차시)\n" +
          "2) 단원 전체는 탐구 열기 → LOI마다 작은 탐구 순환 → 전이·마무리로 짭니다. LOI 하나 안에서도 조사 → 정리 → 공유·일반화가 한 바퀴 돌게 합니다\n" +
          "3) 큰 종이·붙임쪽지를 쓰는 생각 루틴(보고–생각하고–궁금해하기, 질문 벽, 묶고 이름 붙이기, 갤러리 워크, 주장–근거–질문, 예전엔… 지금은… 등)을 알맞은 차시에 넣습니다\n" +
          "4) 학생이 질문하고 선택하는 자리와, 배움을 살피는 시점(관찰·대화·출구 카드 등)을 넣습니다\n" +
          "5) 이미 활동이 적혀 있는 차시는 그대로 두고, 비어 있는 차시만 채웁니다\n\n" +
          "[탐구 모형] " + u.model + " — " + stages + "\n\n" + unitBlock(u, { lessons: true }) +
          FORMAT_HEAD + "차시1: 활동\n차시2: 활동\n(계획한 차시 수만큼 이어서)";
      },
      parse: function (m) {
        var rows = [];
        Object.keys(m).forEach(function (k) {
          var g = k.match(/^차시\s*(\d+)$/); if (g) rows.push({ n: Number(g[1]), text: m[k] });
        });
        if (!rows.length) return [];
        rows.sort(function (a, b) { return a.n - b.n; });
        return [{ label: rows.slice(0, 6).map(function (r) { return r.n + "차시: " + r.text; }).join("\n") + (rows.length > 6 ? "\n… 모두 " + rows.length + "차시" : ""),
          apply: function (u) { rows.forEach(function (r) { var l = u.lessons[r.n - 1]; if (l) l.method = r.text; }); } }];
      }
    },

    action: {
      name: "학생 실천 아이디어",
      where: "실천 · 성찰",
      build: function (u) {
        return ROLE + "\n\n[요청]\n이 단원에서 학생이 스스로 시작할 법한 실천(Action) 아이디어를 제안해 주세요.\n" +
          "1) PYP의 실천은 교사가 시키는 과제가 아니라 학생이 배움에서 시작하는 행동입니다\n" +
          "2) 유형은 참여, 옹호, 사회정의, 사회적 기업가정신, 생활방식 선택 중에서 고릅니다\n" +
          "3) 우리 지역(보성 벌교, 작은 학교)에서 실제로 할 수 있는 것으로 제안합니다\n" +
          "4) 교사가 시간·공간·자료·사람을 어떻게 열어 주면 되는지도 한 줄로 씁니다\n\n" + unitBlock(u, { action: true }) +
          FORMAT_HEAD +
          "실천유형: (쉼표로 구분, 2개)\n학생실천: (한 줄에 하나씩, 4줄)\n교사지원: (한 줄에 하나씩, 3줄)";
      },
      parse: function (m) {
        var out = [];
        if (m["학생실천"]) out.push({ label: m["학생실천"], apply: function (u) { u.studentAction = (u.studentAction ? u.studentAction.trim() + "\n" : "") + m["학생실천"]; } });
        if (m["교사지원"]) out.push({ label: m["교사지원"], apply: function (u) { u.action = (u.action ? u.action.trim() + "\n" : "") + m["교사지원"]; } });
        if (m["실천유형"]) out.push({ label: "실천 유형: " + m["실천유형"], apply: function (u) {
          m["실천유형"].split(/[,·/]/).forEach(function (t) { t = t.trim(); if (t && u.actionTypes.indexOf(t) < 0 && P.actionTypes.some(function (a) { return a[0] === t; })) u.actionTypes.push(t); }); } });
        return out;
      }
    },

    review: {
      name: "단원 전체 점검받기",
      where: "AI 코칭",
      build: function (u) {
        return ROLE + "\n\n[요청]\n작성 중인 탐구단원을 IB PYP 기준으로 검토해 주세요.\n" +
          "1) 잘된 점 2가지\n" +
          "2) 먼저 고칠 점 3가지 — 무엇을, 왜, 어떻게 고칠지와 고쳐 쓴 예문\n" +
          "3) 중심 아이디어 → LOI → 성공 기준 → 총괄 과제 → 실천이 서로 맞물리는지 진단\n" +
          "4) 학생 주도성과 인간·자연의 연결이 드러나는지\n" +
          "5) 비어 있는 항목은 비어 있다고만 말하고 지어내지 않기\n\n" + unitBlock(u, { lessons: true, assess: true, action: true }) +
          "\n\n[출력 형식]\n자유롭게 쓰되, 마크다운 기호(#, **) 없이 번호와 줄바꿈만 사용하세요.";
      },
      parse: function () { return []; }
    }
  };

  // AI 답에서 "항목: 값" 꼴을 읽어 들인다 (여러 줄 값도 모음)
  window.parsePromptReply = function (text) {
    var m = {}, key = null;
    String(text || "").replace(/\r/g, "").split("\n").forEach(function (line) {
      var t = line.replace(/^[\s*·\-]+/, "").replace(/\*\*/g, "").trim();
      if (!t) { return; }
      var g = t.match(/^([가-힣A-Za-z]+\s?\d*)\s*[:：]\s*(.*)$/);
      if (g && g[1].length <= 12) {
        key = g[1].replace(/\s/g, "");
        m[key] = g[2].trim();
      } else if (key) {
        m[key] = (m[key] ? m[key] + "\n" : "") + t;
      }
    });
    Object.keys(m).forEach(function (k) { m[k] = m[k].replace(/^\((.*)\)$/, "$1").trim(); });
    return m;
  };
})();
