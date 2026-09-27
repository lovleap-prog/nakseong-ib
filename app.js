(function () {
  var P = window.PYP, S = window.Store;
  var st = { view: "poi", unitId: null, tab: "overview" };
  try { var saved = JSON.parse(localStorage.getItem("nakseong-uoi-view") || "null"); if (saved) st = Object.assign(st, saved); } catch (e) {}
  var side = document.getElementById("side"), main = document.getElementById("main");
  var coachCtl = null;
  // 안내 모드(처음 설계) / 전체 보기 — 보는 사람마다 따로 기억
  try { var ui = JSON.parse(localStorage.getItem("nakseong-uoi-ui") || "null"); if (ui) { UI.guided = ui.guided !== false; UI.open = ui.open || {}; } } catch (e) {}
  UI.open = UI.open || {};
  function saveUI() { try { localStorage.setItem("nakseong-uoi-ui", JSON.stringify({ guided: UI.guided, open: UI.open })); } catch (e) {} }
  AI.get().then(function (s) { document.body.classList.toggle("no-ai", !s); });
  document.body.classList.add("no-ai");

  function remember() { try { localStorage.setItem("nakseong-uoi-view", JSON.stringify(st)); } catch (e) {} }
  function units() { return S.list(); }
  function cur() { return S.units[st.unitId]; }
  function themeIdx(id) { return P.themes.findIndex(function (t) { return t.id === id; }); }

  // ───── 사이드바 ─────
  function renderSide() {
    var list = units().sort(function (a, b) { return a.grade - b.grade || themeIdx(a.theme) - themeIdx(b.theme); });
    side.innerHTML = '<div class="brand"><h1>낙성 탐구 설계실</h1><p>IB PYP 탐구단원(UOI) 플래너</p></div>' +
      '<nav class="nav"><span class="label" style="padding:0 10px 4px">학교 전체</span>' +
      navBtn("poi", "탐구 프로그램 (POI)", units().length + "단원") + navBtn("manage", "탐구단원 관리") + navBtn("ref", "자료실") + "</nav>" +
      '<nav class="nav"><span class="label" style="padding:0 10px 4px">탐구단원</span>' +
      list.map(function (u) {
        var t = themeOf(u.theme);
        return '<button data-open="' + u.id + '" aria-current="' + (st.view === "unit" && st.unitId === u.id) + '"><span class="dot" style="background:' + (t ? "var(--" + t.color + ")" : "var(--faint)") + '"></span>' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(u.title || "제목 없음") + '</span><span class="meta">' + u.grade + "학년</span></button>";
      }).join("") +
      '<button data-act="newUnit" style="color:var(--accent)">＋ 새 탐구단원</button></nav>' +
      '<div class="side-foot"><span class="label">화면 방식</span><div class="seg" role="radiogroup" style="width:100%"><button role="radio" data-act="mode" data-v="guided" aria-checked="' + UI.guided + '" style="flex:1;text-align:center">안내 모드</button>' +
      '<button role="radio" data-act="mode" data-v="full" aria-checked="' + !UI.guided + '" style="flex:1;text-align:center">전체 보기</button></div>' +
      '<span style="font-size:11.5px;color:var(--faint);line-height:1.5">' + (UI.guided ? "처음 설계하는 선생님용. 필수 칸과 할 일 안내가 보이고 심화 칸은 접혀 있습니다." : "모든 칸과 전체 점검 항목이 보입니다.") + "</span>" +
      syncFoot() +
      '<button class="btn ghost" data-act="backup" style="justify-content:flex-start">💾 백업 파일로 저장</button>' +
      '<button class="btn ghost" data-act="import" style="justify-content:flex-start">📂 백업·단원 파일 불러오기</button>' +
      '<button class="btn ghost" data-act="xlsxAll" style="justify-content:flex-start">POI 전체 엑셀로 내보내기</button></div>';
  }
  // ───── 저장 상태 표시 (학교 공동 저장소 / claude.ai 공유 / 이 브라우저) ─────
  var CLOUD_LABEL = { connecting: "학교 서버에 연결 중…", live: "학교 공유 저장 중", cache: "저장됨 · 연결 확인 중",
    login: "구글 로그인이 필요합니다", error: "학교 서버에 연결 안 됨", off: "이 브라우저에만 저장됨" };
  function syncFoot() {
    if (S.backend !== "cloud") {
      return '<span class="sync" id="sync" data-s="' + S.status + '"><i></i>' + (S.mode === "shared" ? "팀 공유 저장 중" : "이 브라우저에만 저장됨") + "</span>" +
        (S.mode === "shared" ? "" : backupNote()) + pushNote();
    }
    var s = (S.cloud && S.cloud.state) || "connecting";
    var h = '<span class="sync" id="sync" data-s="' + (s === "live" ? "live" : s === "cache" ? "live" : s === "error" || s === "login" ? "err" : "saving") + '"><i></i>' +
      (CLOUD_LABEL[s] || s) + "</span>";
    if (S.cloud && S.cloud.msg) h += '<span class="backup-note warn">' + esc(S.cloud.msg) + "</span>";
    if (s === "login") h += '<button class="btn primary" data-act="cloudIn" style="justify-content:flex-start">구글 계정으로 로그인</button>' +
      '<button class="btn ghost" data-act="cloudInHere" style="justify-content:flex-start;font-size:11.5px">새 창이 안 열리면 · 이 창에서 로그인</button>';
    if (s === "error") h += '<button class="btn" data-act="cloudRetry" style="justify-content:flex-start">다시 연결해 보기</button>' + backupNote();
    if (window.CLOUD && CLOUD.user)
      h += '<span style="font-size:11.5px;color:var(--faint);line-height:1.5">' + esc(CLOUD.user.name) + ' 계정으로 접속 · ' +
        '<button class="btn ghost" data-act="cloudOut" style="padding:0;font-size:11.5px;text-decoration:underline">로그아웃</button></span>';
    return h + pushNote();
  }
  // 서버에 아직 없는 내 단원(다른 컴퓨터에서 쓰던 것 등)
  function pushNote() {
    var n = (S.localOnly || []).length;
    if (!n || S.mode !== "shared") return "";
    return '<button class="btn" data-act="cloudPush" style="justify-content:flex-start">⬆ 아직 공유되지 않은 단원 ' + n + "개 올리기</button>";
  }

  // 브라우저에만 저장될 때: 마지막 백업이 오래되면 알려 줌
  function backupNote() {
    var last = 0; try { last = Number(localStorage.getItem("nakseong-uoi-backup") || 0); } catch (e) {}
    var mine = units().filter(function (u) { return !u.example; }).length;
    if (!mine) return "";
    var days = last ? Math.floor((Date.now() - last) / 86400000) : null;
    var warn = days === null || days >= 7;
    return '<span class="backup-note' + (warn ? " warn" : "") + '">' + (days === null ? "아직 백업한 적이 없습니다. 다른 컴퓨터나 선생님과 나누려면 백업 파일로 저장하세요." :
      days === 0 ? "오늘 백업했습니다." : days + "일 전에 백업했습니다." + (warn ? " 새로 저장해 두세요." : "")) + "</span>";
  }
  function navBtn(v, label, meta) { return '<button data-view="' + v + '" aria-current="' + (st.view === v) + '">' + label + (meta ? '<span class="meta">' + meta + "</span>" : "") + "</button>"; }

  // ───── 처음 온 선생님을 위한 시작 안내 (닫으면 다시 안 보임) ─────
  function welcome() {
    var off = false; try { off = localStorage.getItem("nakseong-uoi-welcome") === "off"; } catch (e) {}
    if (off) return "";
    return '<div class="welcome"><div><h3>처음 오셨나요? 이렇게 시작해 보세요</h3><ol>' +
      "<li><b>예시 단원 둘러보기</b> — 3학년 ‘이야기에 담긴 우리의 목소리’가 끝까지 채워진 모습입니다.</li>" +
      "<li><b>빈 칸의 ＋ 단원</b>을 누르면, 그 학년·주제에 맞는 <b>추천 예시</b>가 하나 나옵니다. 예시에서 시작하면 초안이 만들어집니다.</li>" +
      "<li>단원 화면의 <b>1~5단계</b>를 차례로 채우고, 오른쪽 <b>꼭 할 일</b>이 모두 초록색이 되면 설계가 끝납니다. <b>실천·성찰</b>은 단원을 운영하면서 채웁니다.</li></ol>" +
      '<div class="chips"><button class="btn primary" data-open="example-hweo-3">예시 단원 보기</button><button class="btn" data-act="goStarters">추천 주제 지도</button><button class="btn" data-act="newUnit">새 단원 만들기</button></div></div>' +
      '<button class="btn ghost close" data-act="welcomeOff" aria-label="안내 닫기">✕</button></div>';
  }

  // ───── POI ─────
  function renderPOI() {
    var all = units();
    var grades = [1, 2, 3, 4, 5, 6];
    var h = '<div class="topbar"><button class="btn menu-btn" data-act="menu">☰</button><div><div class="label">' + new Date().getFullYear() + '학년도</div><h2>탐구 프로그램 계획표</h2>' +
      '<div class="sub">학년 × 초학문적 주제. 빈 칸을 눌러 단원을 만들고, 카드를 눌러 설계를 이어 가세요.</div></div></div>' + welcome();
    h += '<div class="poi-wrap"><div class="poi"><div></div>' + P.themes.map(function (t) {
      return '<div class="th" style="--tc:var(--' + t.color + ')" title="' + esc(t.subs.join(" / ")) + '"><b>' + t.ko + "</b><span>" + t.en + "</span></div>";
    }).join("");
    grades.forEach(function (g) {
      h += '<div class="gh">' + g + "학년</div>";
      P.themes.forEach(function (t) {
        var here = all.filter(function (u) { return u.grade === g && u.theme === t.id; });
        h += '<div class="cell">' + here.map(function (u) {
          var sc = scoreOf(checkUnit(u, all));
          return '<button class="ucard" data-open="' + u.id + '" style="--tc:var(--' + t.color + ')"><b>' + esc(u.title || "제목 없음") + "</b><p>" + esc(u.centralIdea) + '</p><div class="foot">' +
            (u.semester ? '<span class="cc sem">' + u.semester + "</span>" : "") +
            u.concepts.map(function (c) { return '<span class="cc">' + c + "</span>"; }).join("") +
            '<span class="pill ' + (sc >= 80 ? "ok" : sc >= 50 ? "warn" : "bad") + '" style="margin-left:auto">' + sc + "</span>" + (here.length > 1 ? "" : "") + "</div></button>";
        }).join("") + (here.length ? "" : '<button class="add" data-new="' + g + "|" + t.id + '">＋ 단원</button>') + "</div>";
      });
    });
    h += "</div></div>";

    // 균형 분석
    var heat = '<div class="heat" style="grid-template-columns:64px repeat(7,1fr)"><span></span>' + P.concepts.map(function (c) { return '<span class="h">' + c.ko + "</span>"; }).join("");
    grades.forEach(function (g) {
      heat += '<span class="rl">' + g + "학년</span>";
      P.concepts.forEach(function (c) {
        var n = all.filter(function (u) { return u.grade === g && u.concepts.indexOf(c.ko) >= 0; }).length;
        heat += '<span class="v" style="' + (n ? "background:color-mix(in srgb,var(--accent) " + Math.min(90, 22 + n * 22) + "%,var(--surface));color:" + (n > 2 ? "var(--accent-ink)" : "var(--ink)") : "") + '">' + (n || "") + "</span>";
      });
    });
    heat += "</div>";
    function atlHeat() {
      var h2 = '<div class="heat" style="grid-template-columns:64px repeat(5,1fr)"><span></span>' + P.atl.map(function (g) { return '<span class="h">' + g.group.replace(" 기능", "") + "</span>"; }).join("");
      grades.forEach(function (g) {
        h2 += '<span class="rl">' + g + "학년</span>";
        P.atl.forEach(function (cat) {
          var key = cat.group.replace(" ", "");
          var n = all.filter(function (u) { return u.grade === g; }).reduce(function (a, u) { return a + u.atl.filter(function (x) { return x.indexOf(key) === 0; }).length; }, 0);
          h2 += '<span class="v" style="' + (n ? "background:color-mix(in srgb,var(--accent) " + Math.min(90, 22 + n * 22) + "%,var(--surface));color:" + (n > 2 ? "var(--accent-ink)" : "var(--ink)") : "") + '">' + (n || "") + "</span>";
        });
      });
      return h2 + "</div>";
    }
    function bars(list, key) {
      var max = 1, rows = list.map(function (name) { var n = all.filter(function (u) { return u[key].indexOf(name) >= 0; }).length; max = Math.max(max, n); return [name, n]; });
      return '<div class="bars">' + rows.map(function (r) { return '<div class="bar"><span>' + r[0] + '</span><span class="t"><i style="width:' + (r[1] / max * 100) + '%"></i></span><span class="c">' + r[1] + "</span></div>"; }).join("") + "</div>";
    }
    var gaps = [];
    grades.forEach(function (g) {
      var have = all.filter(function (u) { return u.grade === g; });
      if (!have.length) return;
      var miss = P.themes.filter(function (t) { return !have.some(function (u) { return u.theme === t.id; }); });
      if (miss.length) gaps.push(g + "학년: " + miss.map(function (t) { return t.ko; }).join(", ") + " 미배정");
      P.themes.forEach(function (t) { var n = have.filter(function (u) { return u.theme === t.id; }).length; if (n > 1) gaps.push(g + "학년: ‘" + t.ko + "’ 단원 " + n + "개 중복"); });
    });
    h += '<div class="balance">' +
      '<div class="bal"><h3>학년별 명시된 개념 분포</h3>' + heat + '<p style="font-size:12px;color:var(--faint);margin:10px 0 0">한 학년 안에서 일곱 개념이 고르게 다뤄지는지 확인하세요.</p></div>' +
      '<div class="bal"><h3>학습자상 반영 횟수</h3>' + bars(P.learnerProfile, "lp") + "</div>" +
      '<div class="bal"><h3>학년별 ATL 기능 배치</h3>' + atlHeat() + '<p style="font-size:12px;color:var(--faint);margin:10px 0 0">2025 설계 도구의 ‘ATL 매핑’처럼, 학년마다 다섯 기능이 고르게 길러지는지 확인하세요.</p></div>' +
      '<div class="bal"><h3>ATL 세부 기능 반영 횟수</h3>' + bars(atlOptions.map(function (o) { return o.v; }), "atl").replace(/<span>(\S+기능) - /g, "<span title=\"$1\">") + "</div>" +
      '<div class="bal"><h3>학년별 성취기준 반영 현황</h3>' + (window.stdCoverage ? stdCoverage(all) : "") + "</div>" +
      '<div class="bal"><h3>POI 구성 점검</h3>' + (gaps.length ? '<ul class="checks">' + gaps.map(function (g) { return '<li data-l="warn"><span class="ic">!</span><span>' + g + "</span></li>"; }).join("") + "</ul>"
        : '<p style="margin:0;color:var(--muted)">단원이 있는 학년의 주제 배정에 빈칸이나 중복이 없습니다.</p>') +
      '<p style="font-size:12px;color:var(--faint);margin:10px 0 0">PYP는 3~6세 과정은 연 4개 이상, 그 이후 학년은 연 6개 주제를 모두 다루도록 권장합니다.</p></div></div>';
    main.innerHTML = h;
  }

  // ───── 탐구단원 관리 ─────
  function renderManage() {
    var all = units().sort(function (a, b) { return a.grade - b.grade || themeIdx(a.theme) - themeIdx(b.theme); });
    var h = '<div class="topbar"><button class="btn menu-btn" data-act="menu">☰</button><div><div class="label">Units</div><h2>탐구단원 관리</h2>' +
      '<div class="sub">단원을 새로 만들고, 다른 학년·주제로 복사하거나 삭제합니다. 삭제와 초기화는 한 번 더 확인한 뒤 진행되고, 직후에 되돌릴 수 있습니다.</div></div>' +
      '<div class="actions"><button class="btn primary" data-act="newUnit">＋ 새 탐구단원</button></div></div>';
    h += '<div class="tbl-wrap"><table class="mtable" style="min-width:760px"><thead><tr><th>학년</th><th>초학문적 주제</th><th>탐구단원 제목</th><th>상태</th><th>점검</th><th>최근 수정</th><th></th></tr></thead><tbody>' +
      (all.length ? all.map(function (u) {
        var t = themeOf(u.theme), sc = scoreOf(checkUnit(u, all)), d = new Date(u.updatedAt || Date.now());
        return "<tr><td class=\"mono\">" + u.grade + "학년</td><td>" + (t ? '<span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:var(--' + t.color + ')"></span>' + t.ko : '<span style="color:var(--faint)">미정</span>') +
          "</td><td><b>" + esc(u.title || "제목 없음") + "</b>" + (u.example ? ' <span class="pill ex">예시</span>' : "") + '</td><td><span class="pill">' + esc(u.status) + '</span></td><td><span class="pill ' + (sc >= 80 ? "ok" : sc >= 50 ? "warn" : "bad") + '">' + sc + '</span></td><td class="mono" style="color:var(--muted)">' + (d.getMonth() + 1) + "." + d.getDate() + "</td>" +
          '<td class="acts"><button class="btn ghost" data-open="' + u.id + '">열기</button><button class="btn ghost" data-act="dupUnit" data-id="' + u.id + '">복사</button><button class="btn ghost danger" data-act="delUnit" data-id="' + u.id + '">삭제</button></td></tr>';
      }).join("") : '<tr><td colspan="7" style="padding:24px;color:var(--faint)">아직 단원이 없습니다. ‘새 탐구단원’으로 시작하세요.</td></tr>') + "</tbody></table></div>";
    main.innerHTML = h;
  }

  // ───── 확인 창 · 되돌리기 ─────
  function dialog(o) {
    return new Promise(function (resolve) {
      var m = document.getElementById("modal"), prev = document.activeElement;
      m.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mTitle"><h3 id="mTitle">' + o.title + '</h3><div class="modal-body">' + (o.body || "") +
        '</div><div class="modal-actions"><button class="btn" data-m="cancel">취소</button><button class="btn ' + (o.danger ? "danger-solid" : "primary") + '" data-m="ok">' + (o.ok || "확인") + "</button></div></div>";
      m.hidden = false;
      (m.querySelector("input,select") || m.querySelector('[data-m="cancel"]')).focus();
      function close(v) { m.hidden = true; m.innerHTML = ""; m.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey, true); if (prev && prev.focus) prev.focus(); resolve(v); }
      function onClick(e) {
        if (e.target === m) return close(null);
        var b = e.target.closest("[data-m]"); if (!b) return;
        if (b.dataset.m !== "ok") return close(null);
        var vals = {}; m.querySelectorAll("[name]").forEach(function (i) { if ((i.type === "radio" || i.type === "checkbox") && !i.checked) return; vals[i.name] = i.value; }); close(vals);
      }
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); close(null); }
        if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); m.querySelector('[data-m="ok"]').click(); }
      }
      m.addEventListener("click", onClick); document.addEventListener("keydown", onKey, true);
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function unitFields(g, theme, title) {
    return '<label class="field"><span class="label">학년</span><select name="grade">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '"' + (n === g ? " selected" : "") + ">" + n + "학년</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span class="label">초학문적 주제</span><select name="theme"><option value="">나중에 정하기</option>' + P.themes.map(function (t) { return '<option value="' + t.id + '"' + (t.id === theme ? " selected" : "") + ">" + t.ko + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span class="label">탐구단원 제목</span><input type="text" name="title" value="' + esc(title || "") + '" placeholder="비워 두고 나중에 적어도 됩니다"></label>';
  }
  function createUnit(g, theme) {
    // 추천 예시가 있으면 학년·주제에 맞는 예시 1개를 함께 보여 주는 시작 창
    if (window.openStart) return openStart(g || 3, theme || "", function (u, msg) { S.save(u, true); open(u.id); toast(msg); });
    dialog({ title: "새 탐구단원 만들기", body: unitFields(g || 3, theme || "", ""), ok: "만들기" }).then(function (v) {
      if (!v) return;
      var u = newUnit(Number(v.grade), v.theme); u.title = v.title.trim();
      S.save(u, true); open(u.id); toast("단원을 만들었습니다.");
    });
  }
  // ───── 자료실: 탭으로 나누어 한 번에 한 가지만 보이게 ─────
  var REF_TABS = [["school", "우리 학교"], ["starters", "추천 주제 지도"], ["ib", "IB PYP 기본 틀"], ["words", "용어 사전"], ["prompts", "AI 프롬프트"], ["std", "성취기준 자료"]];
  function renderRef() {
    var tab = st.refTab || "school";
    var h = '<div class="topbar"><button class="btn menu-btn" data-act="menu">☰</button><div><div class="label">자료실</div><h2>' +
      REF_TABS.find(function (x) { return x[0] === tab; })[1] + '</h2><div class="sub">단원을 설계하다가 막힐 때 찾아보는 곳입니다.</div></div></div>' +
      '<div class="tabs" role="tablist">' + REF_TABS.map(function (x) { return '<button role="tab" data-reftab="' + x[0] + '" aria-selected="' + (x[0] === tab) + '">' + x[1] + "</button>"; }).join("") + "</div>";
    if (tab === "school") h += refSchool();
    else if (tab === "starters") h += '<div class="ref">' + (window.starterMap ? starterMap() : "") + "</div>";
    else if (tab === "ib") h += refIB();
    else if (tab === "words") h += refWords();
    else if (tab === "prompts") h += '<div class="ref">' + (window.promptLibrary ? promptLibrary() : "") + "</div>";
    else h += refStd();
    main.innerHTML = h;
  }
  function refSchool() {
    var S = window.SCHOOL; if (!S) return "";
    return '<div class="ref"><div class="box" style="grid-column:1/-1"><h3>' + esc(S.vision) + '</h3><p class="note">' + esc(S.name) + " · " + esc(S.region) + " · " + esc(S.size) + "<br>" + esc(S.indicator) + '</p>' +
      '<p class="note" style="margin-top:8px">이 내용은 AI 프롬프트의 <b>[우리 학교 맥락]</b>에 자동으로 들어가, AI가 우리 학교에서 실제로 할 수 있는 제안을 하도록 돕습니다.</p></div>' +
      '<div class="box"><h3>교육목표</h3><dl>' + S.goals.map(function (g) { return "<dt>" + g[0] + "</dt><dd>" + g[1] + "</dd>"; }).join("") + "</dl></div>" +
      '<div class="box"><h3>IB 교육과정 추진 계획</h3><dl>' + S.ibPlan.map(function (g) { return "<dt>" + g[0] + "</dt><dd>" + g[1] + "</dd>"; }).join("") + "</dl></div>" +
      '<div class="box wide"><h3>탐구단원에 연결할 지역 자원</h3><dl>' + S.local.map(function (g) { return "<dt>" + g[0] + "</dt><dd>" + g[1] + "</dd>"; }).join("") + "</dl></div>" +
      '<div class="box"><h3>특색 교육 · 학교자율시간</h3><ul class="plain">' + S.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul><dl style=\"margin-top:10px\">" +
      S.selfTime.map(function (g) { return "<dt>" + g[0] + "</dt><dd>" + g[1] + "</dd>"; }).join("") + "</dl></div>" +
      '<div class="box wide"><h3>단원 시기와 엮기 좋은 학교 행사</h3><dl>' + S.events.map(function (g) { return "<dt>" + g[0] + "</dt><dd>" + g[1] + "</dd>"; }).join("") + "</dl></div>" +
      '<div class="box"><h3>학교가 보완하려는 점 (실태 분석)</h3><ul class="plain">' + S.needs.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + '</ul><p class="note" style="margin-top:8px">탐구단원의 실천·총괄 과제를 이 방향과 연결하면 학교 교육과정 안에서 자연스럽게 자리 잡습니다.</p></div>' +
      (S.specialists ? '<div class="box"><h3>교과전담 과목</h3><p><b>' + S.specialists.map(esc).join(", ") + '</b></p><p class="note">IB 탐구단원은 담임이 주도합니다. 추천 예시는 이 과목이 중심이 아닌 <b>담임 주도안</b>을 먼저 보여 주고, 전담 교과는 협력으로 엮습니다. 전담 과목이 바뀌면 <code>school.js</code>의 <code>specialists</code>만 고치면 순서가 저절로 바뀝니다.</p></div>' : "") + "</div>";
  }
  function refWords() {
    return '<div class="ref"><div class="box" style="grid-column:1/-1"><p class="note" style="margin-bottom:10px">화면 곳곳의 <span class="hlp" aria-hidden="true">?</span> 단추를 눌러도 같은 설명이 나옵니다.</p><dl>' +
      Object.keys(GLOSSARY).map(function (k) { var g = GLOSSARY[k];
        return "<dt>" + k + '<br><span class="mono" style="color:var(--faint);font-weight:400;font-size:11px">' + esc(g.en) + "</span></dt><dd>" + esc(g.d) + (g.ex ? '<br><span style="color:var(--faint)">예: ' + esc(g.ex) + "</span>" : "") + "</dd>";
      }).join("") + "</dl></div></div>";
  }
  function refStd() {
    return '<div class="ref"><div class="box" style="grid-column:1/-1"><dl><dt>수록 범위</dt><dd>' +
      [1, 2, 3, 4, 5, 6].map(function (g) { var l = STD_API.list(g); return g + "학년: " + l.filter(function (r) { return r.inPlan; }).length + "개(올해 지도계획) / " + l.length + "개(" + STD_API.band(g) + "학년군 전체)"; }).join("<br>") +
      "</dd><dt>성취기준·성취수준</dt><dd>교육부 「2022 개정 교육과정에 따른 성취수준」(초등 1~2, 3~4, 5~6학년군)</dd>" +
      "<dt>학년·학기·단원 연결</dt><dd>낙성초 2026학년도 학년별 교과·창의적 체험활동 연간지도계획</dd>" +
      "<dt>확인이 필요한 항목</dt><dd>4도03-02, 4영01-06, 6도01-02, 6도03-03 — 원본 PDF 표가 겹쳐 문장 일부만 추출됨</dd></dl></div></div>";
  }
  function refIB() {
    var h = '<div class="ref">';
    h += '<div class="box" style="grid-column:1/-1"><h3>초학문적 주제</h3><div class="ref" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">' + P.themes.map(function (t) {
      return '<div class="theme-band" style="--tc:var(--' + t.color + ')"><div><b>' + t.ko + "</b><p>" + t.en + "</p><p>" + t.subs.map(function (s) { return "• " + s; }).join("<br>") + "</p></div></div>";
    }).join("") + "</div></div>";
    h += '<div class="box wide"><h3>명시된 개념 · 개념 질문</h3><dl>' + P.concepts.map(function (c) { return "<dt>" + c.ko + " <span class=\"mono\" style=\"color:var(--faint);font-weight:400\">" + c.en + "</span></dt><dd>" + c.q + "<br>함께 쓰는 추가 개념 예: " + c.rel + "</dd>"; }).join("") + "</dl></div>";
    h += '<div class="box wide"><h3>학습 접근 방법 (ATL)</h3><dl>' + P.atl.map(function (g) { return "<dt>" + g.group + "</dt><dd>" + g.items.map(function (i) { return "<b>" + i[0] + "</b> — " + i[1]; }).join("<br>") + "</dd>"; }).join("") + "</dl></div>";
    Object.keys(P.models).forEach(function (m) {
      h += '<div class="box"><h3>' + m + ' <span class="pill">' + (m.indexOf("Murdoch") >= 0 ? "Murdoch, 2015" : "Marschall & French, 2018") + "</span></h3>" + P.models[m].map(function (s, i) { return '<div class="stage"><span class="k">' + (i === 6 ? "★" : i + 1) + "</span><span><b>" + s[0] + '</b> <span class="mono" style="color:var(--faint)">' + s[1] + "</span><br>" + s[2] + "</span></div>"; }).join("") + "</div>";
    });
    h += '<div class="box" style="grid-column:1/-1;background:var(--accent-soft);border-color:transparent"><h3>2025 PYP 개편 핵심 (적용 기한 2027년 9월)</h3><dl>' +
      "<dt>초학문적 주제 설명</dt><dd>2024년 12월 개정. 인간 경험의 공통점 중심에서 인간과 자연 세계의 균형·상호연결로 초점 이동. 도입 문장 1개와 세부 항목 3개 형식. 주제 6개 이름은 그대로.</dd>" +
      "<dt>개념 용어</dt><dd>핵심 개념 → <b>명시된 개념</b>(specified concepts), 관련 개념 → <b>추가 개념</b>(additional concepts). 일곱 개념의 설명은 그대로.</dd>" +
      "<dt>교과 연속체</dt><dd>교과별 범위·계열표를 대신해, 개념적 이해 중심의 단계별 기대 수준을 제시 (2025년 4월).</dd>" +
      "<dt>탐구 학습 발달 단계</dt><dd>1차 영역: " + P.ilp.map(function (x) { return x[0] + "(" + x[1] + ")"; }).join(", ") + ". 각 영역의 성장 단계와 평가 예시 제공.</dd>" +
      "<dt>교육과정 설계 도구</dt><dd>POI 검토, ATL 매핑, 국가 교육과정 성취기준 연결, 비판적 성찰 도구 등.</dd></dl>" +
      '<p class="note" style="margin-top:10px">출처: Toddle·CASIE·Educationist 등 2025 개편 해설 자료를 대조해 정리했습니다. 원문은 IB 프로그램 자료 센터(MyIB)에서 확인하세요.</p></div>';
    h += '<div class="box"><h3>탐구 학습 발달 단계 (2025)</h3><dl>' + P.ilp.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[2] + "</dd>"; }).join("") + "</dl></div>";
    h += '<div class="box"><h3>학생 실천의 유형</h3><dl>' + P.actionTypes.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[2] + "</dd>"; }).join("") + '</dl><p class="note" style="margin-top:8px">실천은 학생이 배움에서 스스로 시작하며, 단원 중 언제든 나타날 수 있습니다.</p></div>';
    h += '<div class="box"><h3>PYP 평가의 흐름</h3><dl><dt>모니터링</dt><dd>배우는 동안 관찰·대화·피드백으로 살피기</dd><dt>기록</dt><dd>포트폴리오, 사진·영상, 학습일지로 배움의 증거 남기기</dd><dt>측정</dt><dd>정해진 시점에 도달 정도 확인 (총괄 과제·루브릭)</dd><dt>총괄 과제 도구</dt><dd>GRASPS(Wiggins & McTighe), RAFT(Santa, 1988) — IB 고유 도구가 아닌 참고 도구</dd></dl></div>';
    h += '<div class="box"><h3>GRASPS 수행과제</h3><dl>' + P.grasps.map(function (g) { return "<dt>" + g[1] + " " + g[2] + "</dt><dd>" + g[3] + "</dd>"; }).join("") + "</dl></div>";
    h += '<div class="box wide"><h3>프로젝트 결과물의 종류</h3><dl>' + Object.keys(P.products).map(function (k) { return "<dt>" + k + "</dt><dd>" + P.products[k] + "</dd>"; }).join("") + "</dl></div>";
    h += '<div class="box"><h3>학습자상 · 교수 접근 방법</h3><dl><dt>학습자상</dt><dd>' + P.learnerProfile.join(" · ") + "</dd><dt>교수 접근</dt><dd>" + P.teaching.join(" · ") + "</dd></dl></div>";
    return h + "</div>";
  }

  function render() {
    if (st.view === "unit" && !cur()) st.view = "poi";
    renderSide();
    if (st.view === "poi") renderPOI();
    else if (st.view === "ref") renderRef();
    else if (st.view === "manage") renderManage();
    else main.innerHTML = renderUnit(cur(), st.tab, units());
    if (window.renderChat) renderChat();
    remember();
  }
  function refreshChecks() {
    var u = cur(); if (!u) return;
    var checks = checkUnit(u, units());
    var panel = document.getElementById("checkPanel"); if (panel) panel.innerHTML = renderChecks(checks, scoreOf(checks));
  }
  function open(id, tab) { st.view = "unit"; st.unitId = id; st.tab = tab || "overview"; side.classList.remove("open"); render(); window.scrollTo(0, 0); }

  // ───── 값 바인딩 ─────
  function setPath(obj, path, val) {
    var ks = path.split("."), o = obj;
    for (var i = 0; i < ks.length - 1; i++) o = o[isNaN(ks[i]) ? ks[i] : Number(ks[i])];
    o[ks[ks.length - 1]] = val;
  }
  var STRUCT = { theme: 1, grade: 1, model: 1, productType: 1, lessonsPlanned: 0 };
  main.addEventListener("input", function (e) {
    var k = e.target.dataset && e.target.dataset.k, u = cur(); if (!k || !u) return;
    var v = e.target.value;
    if (e.target.type === "number" || k === "grade") v = v === "" ? "" : Number(v);
    if (k === "model") {
      var from = P.models[u.model].map(function (s) { return s[0]; }), to = P.models[v].map(function (s) { return s[0]; });
      u.lessons.forEach(function (l) { var i = from.indexOf(l.stage); if (i >= 0) l.stage = to[i]; });
    }
    if (k === "theme") u.subs = [];
    setPath(u, k, v); delete u.example; S.save(u);
    if (STRUCT[k] || /\.concept$|\.stage$|\.subject$/.test(k)) render();
    else if (/^(title|centralIdea)$/.test(k)) {
      refreshChecks();
      if (k === "centralIdea") { var live = document.getElementById("ciLive"); if (live) live.innerHTML = ciLive(v); } var top = main.querySelector(k === "title" ? ".topbar h2" : ".topbar .sub"); if (top) top.textContent = v || (k === "title" ? "제목 없는 탐구단원" : ""); }
    else refreshChecks();
  });
  main.addEventListener("change", function (e) { if (e.target.dataset && e.target.dataset.k === "lessonsPlanned") render(); });

  function toggle(el) {
    var u = cur(), key = el.dataset.toggle, v = el.dataset.v, max = Number(el.dataset.max), arr = u[key];
    var i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
    else { if (arr.length >= max) { toast("최대 " + max + "개까지 고를 수 있습니다. 먼저 하나를 해제하세요."); return; } arr.push(v); }
    delete u.example; S.save(u); var y = window.scrollY; render(); window.scrollTo(0, y);
  }

  function scaffold(u) {
    var n = Math.max(14, Number(u.lessonsPlanned) || 24); // LOI마다 3차시 이상 되려면 14차시 이상
    var c = P.cycles[u.model] || P.cycles[P.freeModel];
    var tipText = c.tip.map(function (s) { return P.roleNames[stageRole(u.model, s)] || s; }).join(" → ");
    dialog({ title: "차시 뼈대 만들기", danger: !!u.lessons.length, ok: u.lessons.length ? "지우고 새로 만들기" : "만들기",
      body: (u.lessons.length ? '<p class="note" style="color:var(--bad);margin:0 0 10px">지금 차시표 <b>' + u.lessons.length + "개 차시</b>에 적은 내용이 지워집니다. 직후 알림에서 되돌릴 수 있습니다.</p>" : "") +
        "<p>계획 차시 <b>" + n + "차시</b>를 탐구 열기 · LOI 1~3 · 마무리에 나눕니다. LOI 차시는 어떻게 채울까요?</p>" +
        '<label class="opt-card"><input type="radio" name="pattern" value="flows" checked><span><b>흐름만 나누기</b><small>LOI 차시의 탐구 조각은 비워 두고, 학년·단원에 맞게 직접 고릅니다.</small></span></label>' +
        '<label class="opt-card"><input type="radio" name="pattern" value="tip"><span><b>팁 예시로 채우기</b><small>LOI마다 ' + tipText + " 흐름으로 채웁니다. 컨설팅에서 나온 설계 팁이며 IB 공식 틀은 아닙니다. 채운 뒤 자유롭게 고치세요.</small></span></label>" })
      .then(function (v) {
        if (!v) return;
        var before = clone(u), had = u.lessons.length; buildScaffold(u, n, v.pattern);
        if (had) toast("차시표를 새로 만들었습니다.", "되돌리기", function () { S.save(before, true); render(); });
        else toast(v.pattern === "tip" ? "팁 예시로 뼈대를 만들었습니다. LOI마다 자유롭게 고쳐 쓰세요." : "흐름을 나눴습니다. LOI 차시마다 탐구 조각을 골라 주세요.");
      });
  }
  // 탐구 열기 · LOI 1~3 · 마무리에 차시를 나눔
  //  pattern "flows": LOI 차시는 비워 둠 / "tip": LOI마다 팁 흐름(예: 지식·이해 → 조사 → 정리·분석 → 표현·공유)
  //  24차시 예: 열기 3 · LOI 5+5+5 · 마무리 5 · 성찰 1
  function buildScaffold(u, n, pattern) {
    var c = P.cycles[u.model] || P.cycles[P.freeModel], rows = [];
    function push(flow, stage) { rows.push({ flow: flow, stage: stage || "", ilp: "", method: "", note: "", reflection: "", studentRefl: "", studentWork: "" }); }
    var open = n >= 22 ? 3 : 2, close = Math.max(2, Math.round(n * 0.2)), body = n - open - close - 1;
    if (body < 9) { close = 2; body = Math.max(9, n - open - close - 1); }
    for (var i = 0; i < open; i++) push("탐구열기", c.open[Math.min(i, c.open.length - 1)]);
    var per = [0, 0, 0]; for (i = 0; i < body; i++) per[i % 3]++;
    ["LOI1", "LOI2", "LOI3"].forEach(function (f, k) {
      var m = per[k];
      if (pattern !== "tip") { for (var j = 0; j < m; j++) push(f, ""); return; }
      var T = c.tip.slice(); while (T.length > m) T.shift(); // 차시가 적으면 앞(지식·이해)부터 뺌
      var cnt = T.map(function () { return 1; }), iv = Math.max(0, T.length - 3), og = iv + 1; // 남는 차시는 조사 → 정리 순으로
      for (var e = 0; e < m - T.length; e++) cnt[e % 2 === 0 ? iv : og]++;
      T.forEach(function (s, q) { for (var r = 0; r < cnt[q]; r++) push(f, s); });
    });
    for (i = 0; i < close; i++) push("탐구 마무리", c.close[0]);
    push("탐구 마무리", c.reflect);
    u.lessons = rows; S.save(u); render();
  }

  // 내용이 적힌 행만 한 번 더 확인 (빈 행은 바로 삭제)
  function removeRow(u, key, i, label) {
    var row = u[key][i];
    var hasText = Object.keys(row).some(function (k) {
      if (k === "flow" || k === "stage") return false; // 선택 목록 기본값은 내용으로 보지 않음
      var v = row[k]; return String(Array.isArray(v) ? v.join("") : v == null ? "" : v).trim().length > 0;
    });
    var go = function () {
      var y = window.scrollY, before = clone(u[key]);
      u[key].splice(i, 1); delete u.example; S.save(u); render(); window.scrollTo(0, y);
      if (hasText) toast(label + "을(를) 삭제했습니다.", "되돌리기", function () { u[key] = before; S.save(u); render(); });
    };
    if (!hasText) { go(); return false; }
    dialog({ title: label + "을(를) 삭제할까요?", danger: true, ok: "삭제", body: "<span>이 행에 적은 내용이 지워집니다. 직후 알림에서 되돌릴 수 있습니다.</span>" })
      .then(function (v) { if (v) go(); });
    return false;
  }

  // 접힌 영역을 열고 닫은 상태 기억
  main.addEventListener("toggle", function (e) {
    var d = e.target; if (!d.dataset || !d.dataset.more) return;
    UI.open[d.dataset.more] = d.open; saveUI();
  }, true);

  var actions = window.APP_ACTIONS = {
    menu: function () { side.classList.toggle("open"); },
    mode: function (u, el) { UI.guided = el.dataset.v === "guided"; saveUI(); var y = window.scrollY; render(); window.scrollTo(0, y); toast(UI.guided ? "안내 모드로 바꿨습니다." : "전체 보기로 바꿨습니다."); },
    frame: function (u, el) {
      var f = PYP.ciFrames[Number(el.dataset.i)];
      var go = function () { u.centralIdea = f; delete u.example; S.save(u); render(); var t = document.getElementById("f-centralIdea"); if (t) { t.focus(); var s = f.indexOf("["); t.setSelectionRange(s, f.indexOf("]") + 1); } };
      if (!u.centralIdea.trim()) { go(); return false; }
      dialog({ title: "문장 틀로 바꿀까요?", ok: "바꾸기", body: "<span>지금 적은 중심 아이디어가 문장 틀로 바뀝니다. 직후 알림에서 되돌릴 수 있습니다.</span>" })
        .then(function (v) { if (!v) return; var before = u.centralIdea; go(); toast("문장 틀을 넣었습니다. [ ] 부분을 고쳐 쓰세요.", "되돌리기", function () { u.centralIdea = before; S.save(u); render(); }); });
      return false;
    },
    tool: function (u, el) { u.summativeTool = el.dataset.v; },
    rubricConcept: function (u) {
      u.rubric.unshift({ name: "중심 아이디어 이해", domain: "개념적 이해", levels: ["", "", "", ""] });
      toast("개념적 이해 기준을 맨 위에 넣었습니다. 수준별 모습을 채워 주세요.");
    },
    addMeeting: function (u) { var d = new Date(); u.meetings.push({ date: d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + ".", who: u.team || "", note: "" }); },
    help: function (u, el) {
      var term = el.dataset.term, g = GLOSSARY[term]; if (!g) return false;
      dialog({ title: term + (g.en ? ' <span class="en">' + g.en + "</span>" : ""), ok: "알겠어요",
        body: "<span>" + g.d + "</span>" + (g.ex ? '<span class="ex-box"><b>예시</b><br>' + esc(g.ex) + "</span>" : "") });
      return false;
    },
    showLevels: function (u, el) {
      var r = STD_API.find(u.grade, el.dataset.code); if (!r) return false;
      dialog({ title: "[" + r.code + "] 성취수준", ok: "닫기",
        body: "<span>" + esc(r.text) + "</span>" + ["A", "B", "C"].map(function (k) {
          return '<span class="lv"><b>' + k + "</b> " + esc(r[k] || "자료 없음") + "</span>";
        }).join("") + '<span class="note">교육부 「2022 개정 교육과정에 따른 성취수준」에서 가져왔습니다. 루브릭 만들 때 참고하세요.</span>' });
      return false;
    },
    delMeeting: function (u, el) { return removeRow(u, "meetings", Number(el.dataset.i), "회의 기록"); },
    newUnit: function () { createUnit(3, ""); },
    dupUnit: function (u, el) {
      var src = S.units[el.dataset.id] || u;
      dialog({ title: "탐구단원 복사", ok: "복사본 만들기",
        body: "<span>‘" + esc(src.title || "제목 없음") + "’의 모든 내용(개념, 평가, 차시표 포함)을 복사합니다. 다른 학년이나 주제로 옮겨 만들 수도 있습니다.</span>" +
          unitFields(src.grade, src.theme, (src.title || "탐구단원") + " (복사본)") })
        .then(function (v) {
          if (!v) return;
          var c = clone(src); c.id = newUnit().id; delete c.example;
          c.grade = Number(v.grade); if (c.theme !== v.theme) c.subs = []; c.theme = v.theme; c.title = v.title.trim(); c.status = "초안";
          S.save(c, true); open(c.id); toast("복사본을 만들었습니다.");
        });
    },
    delUnit: function (u, el) {
      var src = S.units[el.dataset.id] || u, all = units();
      var t = themeOf(src.theme);
      dialog({ title: "탐구단원을 삭제할까요?", danger: true, ok: "삭제",
        body: "<span><b>" + src.grade + "학년 · " + (t ? t.ko : "주제 미정") + " · " + esc(src.title || "제목 없음") + "</b></span>" +
          "<span>이 단원의 개요, 개념, 평가, 차시표 " + src.lessons.length + "개 차시가 함께 지워지며 " + (S.mode === "shared" ? "<b>함께 쓰는 모든 선생님 화면에서 사라집니다.</b>" : "이 브라우저에서 사라집니다.") +
          " 삭제 직후 알림에서 되돌릴 수 있습니다. 오래 보관하려면 먼저 엑셀이나 JSON으로 내보내 두세요.</span>" })
        .then(function (v) {
          if (!v) return;
          var backup = clone(src); S.remove(src.id);
          if (st.unitId === src.id && st.view === "unit") st.view = "manage";
          render();
          toast("‘" + (backup.title || "제목 없음") + "’ 단원을 삭제했습니다.", "되돌리기", function () { S.save(backup, true); render(); toast("삭제를 되돌렸습니다."); });
        });
    },
    resetTab: function (u) {
      var r = RESET_FIELDS[st.tab]; if (!r) return;
      dialog({ title: "‘" + r.name + "’ 단계를 초기화할까요?", danger: true, ok: "초기화",
        body: "<span>" + r.note + "</span><span>다른 단계의 내용은 그대로 남습니다. 초기화 직후 알림에서 되돌릴 수 있습니다.</span>" })
        .then(function (v) {
          if (!v) return;
          var before = clone(u), blank = newUnit(u.grade, u.theme);
          r.keys.forEach(function (k) { u[k] = clone(blank[k]); });
          delete u.example; S.save(u); render();
          toast("‘" + r.name + "’ 단계를 초기화했습니다.", "되돌리기", function () { S.save(before, true); render(); });
        });
    },
    resetUnit: function (u) {
      dialog({ title: "단원 전체를 초기화할까요?", danger: true, ok: "전체 초기화",
        body: "<span>여섯 단계에 적은 내용을 모두 비우고 새 단원처럼 만듭니다. 학년(<b>" + u.grade + "학년</b>)과 초학문적 주제만 남습니다.</span><span>초기화 직후 알림에서 되돌릴 수 있습니다.</span>" })
        .then(function (v) {
          if (!v) return;
          var before = clone(u), blank = newUnit(u.grade, u.theme);
          blank.id = u.id; S.save(blank, true); st.tab = "overview"; render();
          toast("단원을 초기화했습니다.", "되돌리기", function () { S.save(before, true); render(); });
        });
    },
    addSubject: function (u) { u.subjects.push({ subject: "", hours: "", code: "", content: "" }); },
    delSubject: function (u, el) { return removeRow(u, "subjects", Number(el.dataset.i), "교과 행"); },
    addRubric: function (u) { u.rubric.push({ name: "", domain: "", levels: ["", "", "", ""] }); },
    delRubric: function (u, el) { return removeRow(u, "rubric", Number(el.dataset.i), "루브릭 기준"); },
    rubricFromCriteria: function (u) {
      var lines = (u.criteria || "").split("\n").map(function (s) { return s.replace(/^나는\s*/, "").replace(/(할|말할|설명할|전할) 수 있다\.?$/, "").trim(); }).filter(Boolean);
      if (!lines.length) { toast("먼저 성공 기준을 한 줄에 하나씩 적어 주세요."); return false; }
      lines.forEach(function (l) { u.rubric.push({ name: l, domain: "", levels: ["", "", "", ""] }); });
    },
    addLesson: function (u) { u.lessons.push({ flow: "LOI1", stage: "", ilp: "", method: "", note: "", reflection: "", studentRefl: "", studentWork: "" }); },
    delLesson: function (u, el) { return removeRow(u, "lessons", Number(el.dataset.i), (Number(el.dataset.i) + 1) + "차시"); },
    moveLesson: function (u, el) {
      var i = Number(el.dataset.i), j = el.dataset.dir === "down" ? i + 1 : i - 1;
      if (j < 0 || j >= u.lessons.length) return false;
      var x = u.lessons.splice(i, 1)[0]; u.lessons.splice(j, 0, x);
    },
    // 흐름 머리줄의 ＋: 그 흐름의 끝에 차시를 하나 더함 (LOI 차시의 조각은 선생님이 고름)
    addLessonIn: function (u, el) {
      var f = el.dataset.f, c = P.cycles[u.model] || P.cycles[P.freeModel], last = -1;
      u.lessons.forEach(function (l, i) { if (l.flow === f) last = i; });
      var stage = /^LOI/.test(f) ? "" : f === "탐구열기" ? c.open[0] : c.close[0];
      if (f === "탐구 마무리" && last >= 0 && u.lessons[last].stage === c.reflect) last--; // 마지막 성찰 차시 앞에
      if (last < 0) last = u.lessons.length - 1;
      u.lessons.splice(last + 1, 0, { flow: f, stage: stage, ilp: "", method: "", note: "", reflection: "", studentRefl: "", studentWork: "" });
      toast((last + 2) + "차시를 넣었습니다." + (stage ? "" : " 탐구 조각을 골라 주세요."));
    },
    scaffold: function (u) { scaffold(u); return false; },
    xlsxUnit: function (u) { Exporter.xlsx([u], true); return false; },
    xlsxAll: function () { Exporter.xlsx(units()); },
    backup: function () {
      Exporter.json(units().filter(function (u) { return !u.example; }));
      try { localStorage.setItem("nakseong-uoi-backup", String(Date.now())); } catch (e) {}
      setTimeout(renderSide, 300);
    },
    // 단원 하나만 파일로 — 다른 선생님에게 보내거나 다른 컴퓨터로 옮길 때
    unitFile: function (u) {
      if (!u) return false;
      var name = (u.grade + "학년_" + (u.title || "탐구단원")).replace(/[\\\/:*?"<>|]/g, "");
      Exporter.save(name + ".uoi.json", JSON.stringify({ app: "nakseong-uoi", version: 3, units: [u] }, null, 2));
      return false;
    },
    addLocal: function (u, el) {
      var v = el.dataset.v; if (!u || !v) return false;
      if ((u.context.local || "").indexOf(v) >= 0) { toast("이미 들어 있습니다."); return false; }
      u.context.local = (u.context.local ? u.context.local.trim() + ", " : "") + v;
    },
    goStarters: function () { st.view = "ref"; st.refTab = "starters"; render(); window.scrollTo(0, 0); },
    welcomeOff: function () { try { localStorage.setItem("nakseong-uoi-welcome", "off"); } catch (e) {} render(); toast("안내를 닫았습니다. 자료실에서 언제든 다시 볼 수 있어요."); },
    printUnit: function (u) { if (window.printUnit) window.printUnit(u); return false; },
    import: function () { document.getElementById("importFile").click(); },
    // ───── 학교 공동 저장소 ─────
    cloudIn: function () { if (window.CLOUD) { CLOUD.signIn(); renderSide(); } return false; },
    cloudInHere: function () { if (window.CLOUD) { CLOUD.signIn(true); renderSide(); } return false; },
    cloudOut: function () {
      dialog({ title: "로그아웃할까요?", ok: "로그아웃",
        body: "<span>로그아웃하면 학교 서버의 단원을 더 볼 수 없습니다. 이 브라우저에 남은 사본은 지워지지 않습니다.</span>" })
        .then(function (v) { if (v && window.CLOUD) CLOUD.signOut(); });
      return false;
    },
    cloudRetry: function () { if (window.CLOUD) CLOUD.retry(); return false; },
    cloudPush: function () {
      var n = (S.localOnly || []).length;
      dialog({ title: "학교 서버에 올릴까요?", ok: "올리기",
        body: "<span>이 브라우저에만 있는 단원 <b>" + n + "개</b>를 학교 공동 저장소에 올립니다. 올리면 <b>다른 선생님 화면에도 보입니다.</b></span>" })
        .then(function (v) { if (v) { S.pushLocal(); render(); } });
      return false;
    }
    // ai, coach 등 AI 동작은 ai.js에서 추가
  };

  document.addEventListener("click", function (e) {
    // 열린 드롭다운(AI 도움·더보기)은 바깥을 누르거나 항목을 고르면 닫힘
    document.querySelectorAll("details.aimenu[open]").forEach(function (d) {
      if (!d.contains(e.target) || e.target.closest(".aimenu-list button")) d.open = false;
    });
    var el = e.target.closest("[data-act],[data-open],[data-view],[data-new],[data-tab],[data-toggle],[data-goto],[data-reftab]");
    if (!el) return;
    if (el.dataset.reftab) { st.refTab = el.dataset.reftab; render(); return; }
    if (el.dataset.open) return open(el.dataset.open);
    if (el.dataset.view) { st.view = el.dataset.view; side.classList.remove("open"); render(); return; }
    if (el.dataset.new) { var p = el.dataset.new.split("|"); return createUnit(Number(p[0]), p[1]); }
    if (el.dataset.tab) { var fromNext = !!el.closest(".nextbar"); st.tab = el.dataset.tab; render(); if (fromNext) window.scrollTo(0, 0); return; }
    if (el.dataset.goto) { st.tab = el.dataset.goto; render(); window.scrollTo(0, 0); return; }
    if (el.dataset.toggle) return toggle(el);
    var fn = actions[el.dataset.act]; if (!fn) return;
    var u = cur(), y = window.scrollY;
    var r = fn(u, el);
    if (u && r !== false && ["menu", "mode", "newUnit", "dupUnit", "delUnit", "resetTab", "resetUnit", "xlsxAll", "backup", "import", "goStarters", "welcomeOff"].indexOf(el.dataset.act) < 0) { delete u.example; S.save(u); render(); window.scrollTo(0, y); }
  });
  document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.toggle) { e.preventDefault(); toggle(e.target); } });

  document.getElementById("importFile").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    f.text().then(function (txt) {
      var data = JSON.parse(txt), list = data.units || [];
      if (!list.length) throw new Error();
      var copied = 0;
      list.forEach(function (u) {
        u = migrateUnit(u);
        var mine = S.units[u.id];
        // 같은 단원이 이미 있고 내용이 다르면 덮어쓰지 않고 복사본으로 들여옴
        if (mine && JSON.stringify(mine) !== JSON.stringify(u)) { u.id = newUnit().id; u.title = (u.title || "탐구단원") + " (가져옴)"; delete u.example; copied++; }
        S.save(u, true);
      });
      render(); toast(list.length + "개 단원을 불러왔습니다." + (copied ? " 이미 있던 " + copied + "개는 ‘(가져옴)’ 복사본으로 넣었습니다." : ""));
    }).catch(function () { toast("이 앱에서 만든 JSON 백업 파일이 아닙니다."); });
    e.target.value = "";
  });

  // ai.js 등 다른 파일에서 쓰는 통로
  window.APP = {
    cur: cur, units: units, dialog: dialog, state: function () { return st; }, open: open,
    rerender: function () { var y = window.scrollY; render(); window.scrollTo(0, y); },
    save: function (u) { delete u.example; S.save(u); }
  };

  // 원격 변경: 입력 중이면 점검만 갱신
  S.onChange = function () {
    var a = document.activeElement;
    if (a && main.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { renderSide(); refreshChecks(); return; }
    // AI 답을 기다리거나 보여 주는 중에는 화면을 다시 그리지 않음
    if ((document.getElementById("coachStop") && !document.getElementById("coachStop").hidden) || main.querySelector(".ai-out:not([hidden])")) { renderSide(); refreshChecks(); return; }
    var y = window.scrollY; render(); window.scrollTo(0, y);
  };
  S.init();
})();
