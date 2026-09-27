// AI 도우미 — 작성 중 언제든 물어보는 대화창
// claude.ai에서는 Claude를 직접, 구글/파이어베이스 배포본에서는 window.AI_BACKEND(중계)를 사용
(function () {
  var A = window.APP_ACTIONS, esc = window.esc, P = window.PYP;
  var turns = [], busy = false, ctl = null;

  var RULES = "당신은 IB PYP 코디네이터이자 초등 교사 멘토입니다. 한국 IB 준비학교(낙성초) 선생님이 탐구단원(UOI)을 처음 설계하고 있습니다.\n" +
    "원칙: 1) 쉬운 한국어로 짧게 답합니다(기본 5문장 이내). 2) 전문 용어는 한 번 풀어 설명합니다. 3) 바로 쓸 수 있는 예문을 함께 줍니다. " +
    "4) 2025 PYP 개편 용어를 씁니다(명시된 개념, 추가 개념). 5) 단원 자료에 없는 내용은 지어내지 않고, 모르면 모른다고 말합니다. " +
    "6) 마크다운 기호(#, **) 없이 줄바꿈과 번호만 씁니다.";

  var QUICK = {
    overview: ["이 단계에서 뭘 해야 하나요?", "초학문적 주제는 어떻게 고르나요?", "우리 학교 지역 맥락 예시를 알려 주세요"],
    concept: ["중심 아이디어가 뭔가요?", "제 중심 아이디어 봐 주세요", "명시된 개념은 몇 개가 적당한가요?"],
    subjects: ["성취기준은 몇 개가 적당한가요?", "교과를 어떻게 엮나요?", "시수는 어떻게 나누나요?"],
    assess: ["성공 기준 예시를 보여 주세요", "GRASPS와 RAFT 중 뭘 고를까요?", "루브릭을 쉽게 쓰는 법"],
    lessons: ["차시 흐름이 자연스러운지 봐 주세요", "탐구열기 활동 아이디어", "학생 질문을 어디에 넣나요?"],
    reflect: ["학생 실천이 뭔가요?", "성찰은 무엇을 적나요?", "학부모 성찰은 어떻게 받나요?"],
    coach: ["다음에 뭘 하면 될까요?", "지금 단원의 약한 부분은?"],
    poi: ["POI가 뭔가요?", "우리 학교 자원으로 어떤 단원을 만들 수 있을까요?", "학년별 주제 배정은 어떻게 하나요?"],
    ref: ["명시된 개념과 추가 개념의 차이", "2025 개편에서 달라진 점"]
  };

  function ctxOf() {
    var school = window.SCHOOL ? SCHOOL.promptBlock() + "\n\n" : "";
    return school + unitCtx();
  }
  function unitCtx() {
    var u = APP.cur && APP.cur();
    if (!u || (APP.state && APP.state().view !== "unit")) return "지금 화면: 탐구 프로그램(POI)이나 자료실 화면입니다.";
    var t = themeOf(u.theme);
    return "지금 작성 중인 단원 요약:\n" + JSON.stringify({
      학년: u.grade, 주제: t ? t.ko : "", 세부주제: u.subs, 제목: u.title, 중심아이디어: u.centralIdea,
      명시된개념: u.concepts, 추가개념: u.related, LOI: u.lois, 학생질문: u.studentQs,
      학습자상: u.lp, ATL: u.atl, 교과: u.subjects.map(function (s) { return s.subject + " " + s.code; }),
      성공기준: u.criteria, 총괄과제: u.summativeTool, 실천: u.action,
      차시수: u.lessons.length
    }).slice(0, 6000);
  }

  function bubbles() {
    var box = document.getElementById("chatBody"); if (!box) return;
    box.innerHTML = turns.map(function (t) {
      return '<div class="msg ' + t.role + '">' + esc(t.content).replace(/\n/g, "<br>") +
        (t.role === "assistant" && !t.pending ? '<button class="btn ghost copy" data-act="chatCopy" data-i="' + turns.indexOf(t) + '">복사</button>' : "") + "</div>";
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  function quickChips() {
    var s = APP.state ? APP.state() : {};
    var tab = s.view === "unit" ? s.tab : s.view === "ref" ? "ref" : "poi";
    var list = QUICK[tab] || QUICK.concept;
    return list.map(function (q) { return '<button class="chip" data-act="chatQuick" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("");
  }

  window.renderChat = function () {
    var w = document.getElementById("chat");
    var open = w.classList.contains("open");
    w.innerHTML = '<button class="chat-tab" data-act="chatToggle">' + (open ? "✕ 닫기" : "💬 AI 도우미") + "</button>" +
      (open ? '<div class="chat-inner"><div class="chat-head">무엇이든 물어보세요<small>지금 작성 중인 단원 내용을 함께 봅니다</small></div>' +
        '<div class="chat-body" id="chatBody"></div>' +
        '<div class="chips quick">' + quickChips() + "</div>" +
        '<form class="chat-form" data-act="chatSend"><input type="text" id="chatInput" placeholder="예: 중심 아이디어 이렇게 써도 될까요?" autocomplete="off">' +
        '<button class="btn primary" type="submit" id="chatSendBtn">보내기</button></form></div>' : "");
    if (open) bubbles();
  };

  A.chatToggle = function () {
    var w = document.getElementById("chat");
    w.classList.toggle("open");
    renderChat();
    if (w.classList.contains("open")) { var i = document.getElementById("chatInput"); if (i) i.focus(); }
    return false;
  };
  A.chatQuick = function (u, el) { ask(el.dataset.q); return false; };
  A.chatCopy = function (u, el) {
    var t = turns[Number(el.dataset.i)];
    if (t && navigator.clipboard) navigator.clipboard.writeText(t.content).then(function () { toast("복사했습니다. 원하는 칸에 붙여 넣으세요."); },
      function () { toast("복사할 수 없습니다. 글을 직접 선택해 주세요."); });
    return false;
  };

  function ask(q) {
    if (busy || !q) return;
    turns.push({ role: "user", content: q });
    turns.push({ role: "assistant", content: "생각하는 중…", pending: true });
    bubbles();
    var input = document.getElementById("chatInput"); if (input) input.value = "";
    busy = true;
    var slot = turns[turns.length - 1];
    var msgs = [{ role: "user", content: RULES + "\n\n" + ctxOf() }];
    turns.slice(0, -1).forEach(function (t) { if (!t.pending) msgs.push({ role: t.role, content: t.content }); });
    AI.get().then(function (sample) {
      if (!sample) {
        slot.content = "AI 도우미는 claude.ai에서 열었을 때, 또는 학교 배포본에 AI 중계가 연결되었을 때 쓸 수 있습니다. 그 전까지는 각 단계의 안내와 ‘설계 점검’을 참고해 주세요.";
        slot.pending = false; busy = false; bubbles(); return;
      }
      ctl = new AbortController();
      var opts = { signal: ctl.signal, cache: false, modelTier: "quick", onText: function (x) { slot.content = x.text; bubbles(); } };
      var p = window.AI_BACKEND ? window.AI_BACKEND.chat(msgs, opts) : sample(msgs, opts);
      p.then(function (r) { slot.content = (r && r.text) || slot.content; })
        .catch(function (e) { slot.content = e.text || AI.errorText(e) || "답을 받지 못했습니다. 다시 보내 주세요."; })
        .then(function () { slot.pending = false; busy = false; bubbles(); });
    });
  }

  A.chatSend = function () {
    var i = document.getElementById("chatInput");
    if (i) ask(i.value.trim());
    return false;
  };
  // 폼 제출(엔터)도 같은 동작
  document.addEventListener("submit", function (e) {
    if (e.target.dataset && e.target.dataset.act === "chatSend") { e.preventDefault(); A.chatSend(); }
  });
})();
