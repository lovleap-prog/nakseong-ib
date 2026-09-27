// 칸별 AI 제안(적용 버튼) + 전체 코칭
(function () {
  var A = window.APP_ACTIONS, P = window.PYP, esc = window.esc;
  var results = {}, ctls = {};

  var ROLE = "당신은 IB PYP 코디네이터입니다. 한국의 IB 준비학교(초등) 교사가 탐구단원(UOI)을 처음 설계하고 있습니다. " +
    "2025 PYP 개편 용어를 따릅니다: 명시된 개념(형태·기능·인과관계·변화·연결·관점·책임), 추가 개념, 2024년 12월 개정 초학문적 주제 설명(인간과 자연 세계의 상호연결). " +
    "처음 하는 교사도 바로 쓸 수 있게 쉬운 한국어로, 학년 수준에 맞게 씁니다. 비어 있는 정보를 지어내지 말고 주어진 단원 자료에 근거합니다.";

  function data(u) {
    var t = themeOf(u.theme);
    return JSON.stringify({
      학년: u.grade, 초학문적주제: t ? t.ko + " — " + t.desc + ": " + t.subs.join(" / ") : "", 세부주제: u.subs, 제목: u.title,
      중심아이디어: u.centralIdea, 명시된개념: u.concepts, 추가개념: u.related, LOI: u.lois, 학생질문: u.studentQs, 학습자상: u.lp, ATL: u.atl,
      교과: u.subjects.map(function (s) { return s.subject + " " + s.code + " " + s.content; }), 맥락: u.context, 성공기준: u.criteria,
      총괄과제도구: u.summativeTool, GRASPS: u.grasps, RAFT: u.raft, 탐구모형: u.model,
      차시: u.lessons.map(function (l, i) { return (i + 1) + ". [" + l.flow + "/" + l.stage + "] " + l.method; }), 실천: u.action
    }).slice(0, 18000) + (window.SCHOOL ? "\n\n" + SCHOOL.promptBlock() : "");
  }

  var KINDS = {
    ci: {
      ask: "중심 아이디어를 다듬은 대안 3개를 주세요. 조건: 명시된 개념 2~3개가 드러남, 학습 목표(~할 수 있다)나 질문이 아닌 진술문, 다른 상황에도 옮겨 쓸 수 있음, 해당 학년이 이해할 수 있는 말, 초학문적 주제 설명과 연결. 지금 문장이 비어 있으면 단원 자료로 새로 만드세요.",
      shape: '[{"text":"중심 아이디어 한 문장","why":"지금보다 나은 점 한 문장"}]',
      show: function (x) { return [x.text, x.why]; },
      apply: function (u, x) { u.centralIdea = String(x.text || ""); }
    },
    loi: {
      ask: "중심 아이디어를 풀어 가는 탐구 목록(LOI) 세트 2개를 주세요. 각 세트는 LOI 3개, 질문이 아닌 짧은 구절, LOI마다 서로 다른 명시된 개념 하나씩 연결(고른 명시된 개념이 있으면 그 안에서).",
      shape: '[{"set":["LOI1 구절","LOI2 구절","LOI3 구절"],"concepts":["형태","관점","연결"],"why":"이 세트의 흐름 한 문장"}]',
      show: function (x) { return [(x.set || []).map(function (s, i) { return (i + 1) + ". " + s + " (" + ((x.concepts || [])[i] || "") + ")"; }).join("<br>"), x.why]; },
      apply: function (u, x) { u.lois = [0, 1, 2].map(function (i) { return { text: String((x.set || [])[i] || ""), concept: String((x.concepts || [])[i] || "") }; }); }
    },
    criteria: {
      ask: "학생 언어로 된 성공 기준 세트 2개를 주세요. 각 세트는 ‘나는 ~할 수 있다’ 3~4줄이고, 중심 아이디어의 개념적 이해 1줄 이상과 교과 기능 1줄 이상을 포함합니다.",
      shape: '[{"lines":["나는 ...할 수 있다.","..."],"why":"이 세트의 특징 한 문장"}]',
      show: function (x) { return [(x.lines || []).map(esc).join("<br>"), x.why]; },
      apply: function (u, x) { u.criteria = (x.lines || []).join("\n"); }
    },
    summative: {
      ask: function (u) {
        return u.summativeTool === "RAFT" ? "RAFT(Role, Audience, Format, Topic) 총괄 과제 초안 2개를 주세요. 학생이 중심 아이디어에 대한 이해를 보여 주는 실제적인 과제여야 합니다."
          : "GRASPS(Goal, Role, Audience, Situation, Product, Standard) 총괄 과제 초안 2개를 주세요. 학생이 중심 아이디어에 대한 이해를 보여 주고, 지역 맥락을 활용하는 실제적인 과제여야 합니다.";
      },
      shape: function (u) { return u.summativeTool === "RAFT" ? '[{"r":"","a":"","f":"","t":"","why":""}]' : '[{"g":"","r":"","a":"","s":"","p":"","st":"","why":""}]'; },
      show: function (x) {
        var keys = x.f !== undefined ? [["r", "역할"], ["a", "대상"], ["f", "형식"], ["t", "주제"]] : [["g", "목적"], ["r", "역할"], ["a", "대상"], ["s", "상황"], ["p", "산출물"], ["st", "기준"]];
        return [keys.map(function (k) { return "<span style=\"color:var(--muted)\">" + k[1] + "</span> " + esc(x[k[0]] || ""); }).join("<br>"), x.why];
      },
      apply: function (u, x) {
        if (u.summativeTool === "RAFT") ["r", "a", "f", "t"].forEach(function (k) { u.raft[k] = String(x[k] || ""); });
        else { if (u.summativeTool !== "GRASPS") u.summativeTool = "GRASPS"; ["g", "r", "a", "s", "p", "st"].forEach(function (k) { u.grasps[k] = String(x[k] || ""); }); }
      }
    },
    lessons: {
      pre: function (u) { return u.lessons.some(function (l) { return !l.method.trim(); }) ? "" : "활동이 비어 있는 차시가 없습니다. ‘모형 흐름으로 채우기’로 뼈대를 먼저 만들어 보세요."; },
      ask: "차시표에서 활동이 비어 있는 차시마다 구체적인 활동을 한 줄로 제안하세요. 각 차시의 탐구의 흐름·탐구단계에 맞추고, 학생 질문과 선택이 들어가게 하세요. 비어 있지 않은 차시는 제외합니다.",
      shape: '[{"n":차시번호,"text":"활동 한 줄"}]',
      show: function (x) { return [x.n + "차시 · " + esc(x.text || ""), ""]; },
      apply: function (u, x) { var l = u.lessons[Number(x.n) - 1]; if (l) l.method = String(x.text || ""); },
      all: true
    },
    action: {
      ask: "이 단원에서 학생이 스스로 시작할 법한 실천 아이디어 4개와, 교사가 그 기회를 여는 지원 방법을 주세요. 실천 유형은 참여, 옹호, 사회정의, 사회적 기업가정신, 생활방식 선택 중 하나입니다.",
      shape: '[{"type":"참여","idea":"학생 실천 예","support":"교사 지원 한 줄"}]',
      show: function (x) { return [esc(x.idea || "") + ' <span class="pill">' + esc(x.type || "") + "</span>", "지원: " + (x.support || "")]; },
      apply: function (u, x) {
        var t = String(x.type || ""); if (t && u.actionTypes.indexOf(t) < 0 && P.actionTypes.some(function (a) { return a[0] === t; })) u.actionTypes.push(t);
        u.action = (u.action ? u.action.trim() + "\n" : "") + "· " + (x.support || "");
        u.studentAction = (u.studentAction ? u.studentAction.trim() + "\n" : "") + "(예상) " + (x.idea || "");
      }
    }
  };

  function box(kind) { return document.getElementById("ai-" + kind); }

  A.ai = function (u, el) {
    var kind = el.dataset.kind, K = KINDS[kind], out = box(kind);
    if (!K || !out) return false;
    var blocked = K.pre && K.pre(u); if (blocked) { toast(blocked); return false; }
    AI.get().then(function (sample) {
      out.hidden = false;
      if (!sample) { out.innerHTML = '<span class="ai-wait">AI 제안은 claude.ai에서 이 앱을 열었을 때 쓸 수 있습니다.</span>'; return; }
      if (ctls[kind]) ctls[kind].abort();
      var ctl = ctls[kind] = new AbortController();
      out.innerHTML = '<div class="ai-head">✨ 생각하는 중… (보통 10~40초)<button class="btn ghost" data-act="aiStop" data-kind="' + kind + '">중지</button></div>';
      var ask = typeof K.ask === "function" ? K.ask(u) : K.ask, shape = typeof K.shape === "function" ? K.shape(u) : K.shape;
      sample.json(ROLE + "\n\n요청: " + ask + "\n\n답은 이 모양의 JSON 배열만: " + shape + "\n\n단원 자료(JSON):\n" + data(u), { signal: ctl.signal })
        .then(function (arr) {
          if (!Array.isArray(arr) || !arr.length) throw { code: "invalid_json" };
          results[kind] = arr;
          out.innerHTML = '<div class="ai-head">✨ AI 제안 — 마음에 드는 것을 적용한 뒤 우리 반에 맞게 고쳐 쓰세요' +
            (K.all ? '<button class="btn" data-act="aiApplyAll" data-kind="' + kind + '">모두 적용</button>' : "") + '<button class="btn ghost" data-act="aiClose" data-kind="' + kind + '">닫기</button></div>' +
            arr.map(function (x, i) {
              var s = K.show(x);
              return '<div class="ai-item"><b>' + (kind === "ci" ? esc(s[0]) : s[0]) + "</b>" + (s[1] ? "<small>" + esc(s[1]) + "</small>" : "<small></small>") +
                '<button class="btn" data-act="aiApply" data-kind="' + kind + '" data-i="' + i + '">적용</button></div>';
            }).join("");
        })
        .catch(function (e) { var m = AI.errorText(e); if (m) out.innerHTML = '<span class="ai-wait">' + m + "</span>"; else out.hidden = true; });
    });
    return false;
  };

  function applyItems(kind, items) {
    var u = APP.cur(); if (!u) return;
    var before = JSON.parse(JSON.stringify(u));
    items.forEach(function (x) { KINDS[kind].apply(u, x); });
    APP.save(u); APP.rerender();
    toast("AI 제안을 적용했습니다.", "되돌리기", function () { S_restore(before); });
  }
  function S_restore(before) { window.Store.save(before, true); APP.rerender(); }

  A.aiApply = function (u, el) {
    var kind = el.dataset.kind, x = (results[kind] || [])[Number(el.dataset.i)]; if (!x) return false;
    applyItems(kind, [x]); return false;
  };
  A.aiApplyAll = function (u, el) { var kind = el.dataset.kind; applyItems(kind, results[kind] || []); return false; };
  A.aiStop = function (u, el) { var c = ctls[el.dataset.kind]; if (c) c.abort(); return false; };
  A.aiClose = function (u, el) { var b = box(el.dataset.kind); if (b) b.hidden = true; return false; };

  // ───── 전체 코칭 ─────
  var coachCtl = null;
  A.coach = function (u, el) {
    var out = document.getElementById("coachOut"), stop = document.getElementById("coachStop");
    AI.get().then(function (sample) {
      out.hidden = false;
      if (!sample) { out.textContent = "AI 코칭은 claude.ai에서 이 앱을 열었을 때 쓸 수 있습니다."; return; }
      var ask = {
        full: "단원 설계 전체를 검토하세요. 1) 잘된 점 2가지 2) 가장 먼저 고칠 점 3가지(무엇을, 왜, 어떻게 — 고쳐 쓴 예문 포함) 3) 중심 아이디어-LOI-성공 기준-총괄 과제-실천 사이의 정렬 진단 4) 학생 주도성과 인간·자연 연결이 드러나는지.",
        beginner: "처음 설계하는 교사에게, 지금 단원에서 다음에 하면 좋을 일 딱 3가지만 우선순위대로 알려 주세요. 각 항목은 ‘무엇을’ 한 줄, ‘예시’ 한 줄. 칭찬 한 문장으로 시작하고, 전문 용어는 풀어서 쓰세요.",
        lessons: "차시 흐름을 검토하세요. 탐구 모형 단계의 순서와 배분, 학생 질문·선택이 들어갈 자리, 모니터링 시점, 탐구 기능 발달 단계(관찰·역할·질문·의사결정) 연결, 실천으로 이어지는 기회를 진단하고, 고쳐 쓸 차시를 번호로 짚어 구체적 활동을 제안하세요."
      }[el.dataset.mode];
      coachCtl = new AbortController(); out.textContent = "검토하는 중… (보통 20~60초)"; stop.hidden = false;
      document.querySelectorAll('[data-act="coach"]').forEach(function (b) { b.disabled = true; });
      sample(ROLE + "\n\n요청: " + ask + "\n마크다운 기호(#, **) 대신 번호와 줄바꿈만 사용하세요.\n\n단원 자료(JSON):\n" + data(u), { signal: coachCtl.signal, onText: function (x) { out.textContent = x.text; } })
        .then(function (r) { if (r.truncated) out.textContent += "\n\n(답변이 길어 중간에 끊겼습니다. 항목을 나누어 다시 요청해 보세요.)"; })
        .catch(function (e) { var m = AI.errorText(e); out.textContent = (e.text || "") + (m ? "\n\n" + m : ""); })
        .then(function () { stop.hidden = true; document.querySelectorAll('[data-act="coach"]').forEach(function (b) { b.disabled = false; }); });
    });
    return false;
  };
  A.coachStop = function () { if (coachCtl) coachCtl.abort(); return false; };
})();
