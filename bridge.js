// 내 AI에 물어보기 — 프롬프트 복사 → 각자 쓰는 AI에 붙여넣기 → 답을 다시 앱으로
(function () {
  var A = window.APP_ACTIONS, esc = window.esc;
  var lastKind = null, parsed = [];

  function copyToClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    done(false);
  }

  // 프롬프트 보여 주고 복사하기
  A.prompt = function (u, el) {
    var kind = el.dataset.kind, K = window.PROMPTS[kind];
    if (!K || !u) return false;
    var text = K.build(u);
    var m = document.getElementById("modal");
    m.innerHTML = '<div class="modal-card wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
      '<h3 id="mTitle">' + esc(K.name) + ' — 내 AI에 물어보기</h3>' +
      '<p class="note">아래 글을 복사해서 <b>선생님이 쓰시는 AI 채팅창</b>(ChatGPT · 제미나이 · 클로드 등)에 그대로 붙여 넣으세요. ' +
      '답이 나오면 그 답을 복사해 <b>[AI 답 붙여넣기]</b>로 가져오면 각 칸에 넣어 드립니다.</p>' +
      '<textarea id="promptText" class="prompt-box" rows="14" readonly>' + esc(text) + "</textarea>" +
      '<div class="modal-actions"><button class="btn" data-m="cancel">닫기</button>' +
      '<button class="btn" data-act="pasteOpen" data-kind="' + kind + '">AI 답 붙여넣기 →</button>' +
      '<button class="btn primary" id="copyBtn">프롬프트 복사</button></div></div>';
    m.hidden = false;
    var ta = document.getElementById("promptText");
    ta.focus(); ta.setSelectionRange(0, 0);
    document.getElementById("copyBtn").onclick = function () {
      copyToClipboard(text, function (ok) {
        if (ok) { toast("복사했습니다. AI 채팅창에 붙여 넣으세요."); }
        else { ta.select(); toast("전체 선택했습니다. Ctrl+C로 복사하세요."); }
      });
    };
    bindClose(m);
    return false;
  };

  // AI가 준 답 붙여넣기 → 미리 보고 적용
  A.pasteOpen = function (u, el) {
    var kind = el.dataset.kind || lastKind, K = window.PROMPTS[kind];
    if (!K || !u) return false;
    lastKind = kind;
    var m = document.getElementById("modal");
    m.innerHTML = '<div class="modal-card wide" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
      '<h3 id="mTitle">' + esc(K.name) + ' — AI 답 붙여넣기</h3>' +
      '<p class="note">AI가 준 답을 통째로 붙여 넣고 <b>[읽어 오기]</b>를 누르세요. 형식이 조금 달라도 항목 이름(예: 중심아이디어1, LOI1)만 있으면 찾아냅니다.</p>' +
      '<textarea id="pasteText" class="prompt-box" rows="10" placeholder="여기에 AI 답을 붙여 넣으세요"></textarea>' +
      '<div id="pasteResult"></div>' +
      '<div class="modal-actions"><button class="btn" data-m="cancel">닫기</button><button class="btn primary" id="readBtn">읽어 오기</button></div></div>';
    m.hidden = false;
    var ta = document.getElementById("pasteText"); ta.focus();
    document.getElementById("readBtn").onclick = function () {
      var items = K.parse(parsePromptReply(ta.value));
      parsed = items;
      var box = document.getElementById("pasteResult");
      if (!items.length) {
        box.innerHTML = '<p class="note" style="color:var(--bad)">항목을 찾지 못했습니다. AI에게 “아까 준 출력 형식 그대로 다시 써 줘”라고 요청한 뒤 다시 붙여 넣어 보세요.</p>';
        return;
      }
      box.innerHTML = '<div class="ai-out">' + '<div class="ai-head">읽어 온 내용 — 넣을 것을 고르세요</div>' +
        items.map(function (it, i) {
          return '<div class="ai-item"><b>' + esc(it.label).replace(/\n/g, "<br>") + "</b>" + (it.note ? "<small>" + esc(it.note) + "</small>" : "<small></small>") +
            '<button class="btn" data-act="pasteApply" data-i="' + i + '">넣기</button></div>';
        }).join("") + "</div>";
    };
    bindClose(m);
    return false;
  };

  A.pasteApply = function (u, el) {
    var it = parsed[Number(el.dataset.i)]; if (!it || !u) return false;
    var before = JSON.parse(JSON.stringify(u));
    it.apply(u);
    APP.save(u);
    document.getElementById("modal").hidden = true; document.getElementById("modal").innerHTML = "";
    APP.rerender();
    toast("AI 답을 넣었습니다.", "되돌리기", function () { window.Store.save(before, true); APP.rerender(); });
    return false;
  };

  function bindClose(m) {
    function onClick(e) {
      if (e.target === m) return close();
      var b = e.target.closest('[data-m="cancel"]'); if (b) close();
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    function close() { m.hidden = true; m.innerHTML = ""; m.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey, true); }
    m.addEventListener("click", onClick); document.addEventListener("keydown", onKey, true);
  }

  // 참고자료 화면의 ‘프롬프트 모음’
  window.promptLibrary = function () {
    var K = window.PROMPTS;
    return '<div class="box" style="grid-column:1/-1"><h3>내 AI에 붙여 넣는 프롬프트 모음</h3>' +
      '<p class="note" style="margin-bottom:10px">단원 화면의 각 단계에서 <b>📋 프롬프트</b> 단추를 누르면, 지금 작성한 내용이 채워진 프롬프트가 만들어집니다. ' +
      'ChatGPT · 제미나이 · 클로드 등 <b>선생님이 쓰시는 어떤 AI</b>에 붙여 넣어도 됩니다. 답을 받아 <b>AI 답 붙여넣기</b>로 가져오면 칸에 자동으로 들어갑니다.</p>' +
      '<dl>' + Object.keys(K).map(function (k) {
        return "<dt>" + esc(K[k].name) + '<br><span class="mono" style="color:var(--faint);font-weight:400;font-size:11px">' + esc(K[k].where) + " 단계</span></dt><dd>" +
          ({ ci: "개념 2~3개를 엮은 중심 아이디어 후보 3개와 각각의 이유",
            loi: "서로 다른 개념에 연결된 탐구 목록 3개",
            questions: "LOI마다 2개씩 교사 질문 6개와 도발 아이디어 2개",
            criteria: "‘나는 ~할 수 있다’ 형태의 성공 기준 3~4줄",
            grasps: "지역 맥락을 살린 GRASPS 총괄 과제 초안",
            rubric: "개념적 이해·교과·ATL 세 요소의 4수준 루브릭",
            lessons: "탐구 모형 단계에 맞춘 차시별 활동",
            action: "학생이 스스로 시작할 실천 아이디어와 교사 지원",
            review: "단원 전체를 IB 기준으로 점검한 피드백" }[k] || "") + "</dd>";
      }).join("") + "</dl>" +
      '<p class="note" style="margin-top:10px">※ 프롬프트에는 학생 이름 같은 개인정보를 넣지 마세요. 외부 AI 서비스로 전송되는 내용입니다.</p></div>';
  };
})();
