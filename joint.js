// 함께하는 교육활동 — 여러 학년의 탐구단원이 학교 교육활동 하나(예: 알뜰장터)에서 만났다가 다시 각자 탐구를 이어 감
//  · 활동은 Store.acts 에 저장 (서버에서는 단원과 같은 곳에 kind:"activity")
//  · 단원 차시에 lesson.joint = 활동 id 를 붙이면 그 차시가 공동 차시. 앞은 사전, 뒤는 사후 활동
//  · 공동 차시는 학년마다 각자 셈 (알뜰장터 4차시 → 1학년 4차시, 2학년 4차시)
(function () {
  var P = window.PYP, S = window.Store, esc = window.esc, A = window.APP_ACTIONS;
  var J = window.JOINT = {};
  // 인쇄할 때는 화면 색(어두운 모드 포함) 대신 흰 종이에 맞는 색
  var PRINT_COLOR = { wwa: "#B85540", wwapt: "#A87A1F", hweo: "#80509A", htww: "#2F6AA0", hwoo: "#2F8068", stp: "#5B8428" };
  var FLOW_NAME = { "탐구열기": "열기", "LOI1": "LOI 1", "LOI2": "LOI 2", "LOI3": "LOI 3", "탐구 마무리": "마무리" };

  function st() { return window.APP.state(); }
  function rerender() { window.APP.rerender(); }
  J.list = function () {
    return S.actList().sort(function (a, b) { return (a.period || "").localeCompare(b.period || "", "ko") || (a.name || "").localeCompare(b.name || "", "ko"); });
  };
  J.cur = function () { var s = st(); return S.acts[s.actId] || J.list()[0] || null; };
  // 참여 단원 (지워진 단원은 빼고, 학년 순)
  J.members = function (a) {
    return a.units.map(function (x, i) { return { link: x, i: i, u: S.units[x.id] }; })
      .filter(function (m) { return m.u; })
      .sort(function (p, q) { return p.u.grade - q.u.grade || (p.u.title || "").localeCompare(q.u.title || "", "ko"); });
  };
  J.forUnit = function (u) { return J.list().filter(function (a) { return a.units.some(function (x) { return x.id === u.id; }); }); };
  J.count = function (u, aid) { return u.lessons.filter(function (l) { return l.joint === aid; }).length; };
  // 사전(공동 차시 앞) · 공동 · 사후(공동 차시 뒤)
  J.phases = function (u, aid) {
    var first = -1, last = -1;
    u.lessons.forEach(function (l, i) { if (l.joint === aid) { if (first < 0) first = i; last = i; } });
    if (first < 0) return { pre: u.lessons, mid: [], post: [], first: -1 };
    return { pre: u.lessons.slice(0, first), mid: u.lessons.filter(function (l) { return l.joint === aid; }), post: u.lessons.slice(last + 1), first: first };
  };
  function flowsOf(list) {
    var out = [];
    list.forEach(function (l) { var f = FLOW_NAME[l.flow] || l.flow; if (f && out.indexOf(f) < 0) out.push(f); });
    return out.join("·");
  }
  function statusOf(a, u) {
    var n = J.count(u, a.id), h = Number(a.hours) || 0;
    return { n: n, h: h, level: !n ? "bad" : n === h ? "ok" : "warn",
      text: !n ? "공동 차시 없음" : n === h ? "공동 " + n + "차시" : "공동 " + n + "차시 (계획 " + h + "차시)" };
  }

  // ───── 흐름도: 학년마다 한 줄 — 갈라져 오다가 활동에서 만나고 다시 갈라짐 ─────
  J.svg = function (a, print) {
    var ms = J.members(a), n = ms.length;
    if (!n) return '<div class="jt-empty">참여 단원을 넣으면 여기에 흐름도가 그려집니다.</div>';
    var W = 960, gap = n > 4 ? 58 : 70, top = 50, H = top * 2 + (n - 1) * gap + 10, cy = H / 2;
    var nodeH = Math.max(76, (n - 1) * gap * 0.42 + 64), nx = 400, nw = 170;
    var col = function (u) { var t = themeOf(u.theme), c = t ? t.color : ""; return c ? (print ? PRINT_COLOR[c] : "var(--" + c + ")") : (print ? "#8A949C" : "var(--faint)"); };
    var ink = print ? "#111" : "var(--ink)", muted = print ? "#555" : "var(--muted)", line = print ? "#999" : "var(--line-strong)";
    var nodeBg = print ? "#EEF3EF" : "var(--accent-soft)", nodeLine = print ? "#2E5E4E" : "var(--accent)";
    var g = "";
    ms.forEach(function (m, k) {
      var u = m.u, y = top + k * gap + 5, ey = cy + (y - cy) * 0.36, c = col(u), ph = J.phases(u, a.id), on = ph.mid.length > 0;
      var dash = on ? "" : ' stroke-dasharray="5 5"';
      var lane = '<g class="jt-lane" data-act="jointOpen" data-id="' + u.id + '" role="link" tabindex="0" aria-label="' + esc(u.grade + "학년 " + (u.title || "제목 없음")) + ' 차시표 열기">' +
        "<title>" + esc(u.grade + "학년 · " + (u.title || "제목 없음") + (m.link.lens ? "\n관점: " + m.link.lens : "")) + "</title>" +
        '<text x="0" y="' + (y - 4) + '" font-size="13" font-weight="700" fill="' + c + '">' + u.grade + "학년</text>" +
        '<text x="0" y="' + (y + 13) + '" font-size="12" fill="' + ink + '">' + esc(cut(u.title || "제목 없음", 13)) + "</text>" +
        '<path d="M200 ' + y + " H262 C330 " + y + " 336 " + ey + " " + nx + " " + ey + '" fill="none" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"' + dash + "/>" +
        '<path d="M' + (nx + nw) + " " + ey + " C" + (nx + nw + 64) + " " + ey + " " + (nx + nw + 70) + " " + y + " " + (nx + nw + 138) + " " + y + ' H940" fill="none" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"' + dash + "/>" +
        '<circle cx="200" cy="' + y + '" r="6" fill="' + c + '"/><circle cx="940" cy="' + y + '" r="6" fill="' + c + '"/>' +
        '<text x="212" y="' + (y - 9) + '" font-size="11.5" fill="' + ink + '">사전 ' + ph.pre.length + "차시</text>" +
        '<text x="212" y="' + (y + 18) + '" font-size="10.5" fill="' + muted + '">' + esc(cut(flowsOf(ph.pre), 16)) + "</text>" +
        '<text x="930" y="' + (y - 9) + '" font-size="11.5" fill="' + ink + '" text-anchor="end">' + (on ? "사후 " + ph.post.length + "차시" : "공동 차시 아직 없음") + "</text>" +
        '<text x="930" y="' + (y + 18) + '" font-size="10.5" fill="' + muted + '" text-anchor="end">' + esc(cut(on ? flowsOf(ph.post) : "", 16)) + "</text></g>";
      g += lane;
    });
    var ny = cy - nodeH / 2;
    g += '<g pointer-events="none"><rect x="' + nx + '" y="' + ny + '" width="' + nw + '" height="' + nodeH + '" rx="14" fill="' + nodeBg + '" stroke="' + nodeLine + '" stroke-width="2"/>' +
      '<text x="' + (nx + nw / 2) + '" y="' + (cy - 12) + '" font-size="15" font-weight="700" text-anchor="middle" fill="' + ink + '">' + esc(cut(a.name || "이름 없는 활동", 11)) + "</text>" +
      '<text x="' + (nx + nw / 2) + '" y="' + (cy + 8) + '" font-size="11.5" text-anchor="middle" fill="' + ink + '">함께 ' + (Number(a.hours) || 0) + "차시 × " + n + "개 단원</text>" +
      (a.period ? '<text x="' + (nx + nw / 2) + '" y="' + (cy + 25) + '" font-size="11" text-anchor="middle" fill="' + muted + '">' + esc(cut(a.period, 16)) + "</text>" : "") + "</g>";
    g += '<text x="200" y="14" font-size="11" fill="' + muted + '">각 반에서 · 사전 탐구</text>' +
      '<text x="' + (nx + nw / 2) + '" y="14" font-size="11" text-anchor="middle" fill="' + muted + '">함께 준비·운영</text>' +
      '<text x="940" y="14" font-size="11" text-anchor="end" fill="' + muted + '">다시 각 반에서 · 사후 탐구·실천</text>' +
      '<line x1="200" y1="22" x2="940" y2="22" stroke="' + line + '" stroke-width="1" stroke-dasharray="2 4"/>';
    return '<div class="jt-svg"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc((a.name || "교육활동") + " 흐름도: " + n + "개 단원이 갈라져 오다가 함께 운영하고 다시 갈라짐") + '" font-family="IBM Plex Sans KR, Malgun Gothic, sans-serif">' + g + "</svg></div>";
  };
  // 받침에 맞는 조사: jo("알뜰장터", "을", "를") → "를"
  function jo(word, withB, noB) {
    var c = String(word || "").replace(/[^가-힣0-9A-Za-z]+$/, "").slice(-1), code = c.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) return code % 28 ? withB : noB;
    return /[013678]$/.test(c) ? withB : noB;
  }
  function q(word, withB, noB) { return "‘" + esc(word) + "’" + jo(word, withB, noB); }
  function cut(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  // ───── 페이지 ─────
  window.renderJoint = function () {
    var list = J.list(), a = J.cur();
    if (a && st().actId !== a.id) st().actId = a.id;
    var h = '<div class="topbar"><button class="btn menu-btn" data-act="menu">☰</button><div><div class="label">학교 전체</div><h2>함께하는 교육활동</h2>' +
      '<div class="sub">학년마다 다른 탐구단원이 학교 교육활동 하나를 함께 준비·운영하고, 앞뒤 탐구는 각 교실에서 따로 이어 갑니다. 공동 차시는 학년마다 각자 셉니다.</div></div>' +
      '<div class="actions">' + (a ? '<button class="btn" data-act="jointPrint">🖨 인쇄</button>' : "") + '<button class="btn primary" data-act="jointNew">＋ 새 교육활동</button></div></div>';
    if (!a) return h + emptyState();
    if (list.length > 1) h += '<div class="tabs" role="tablist">' + list.map(function (x) {
      return '<button role="tab" data-act="jointPick" data-id="' + x.id + '" aria-selected="' + (x.id === a.id) + '">' + esc(x.name || "이름 없는 활동") + '<span class="n jt-n">' + J.members(x).length + "</span></button>";
    }).join("") + "</div>";
    var ms = J.members(a);
    h += '<section class="sec"><div class="sec-h"><h3>흐름도</h3><span class="en">Shared activity map</span></div>' + J.svg(a) +
      '<p class="note">선 하나가 한 단원입니다. 점선은 아직 공동 차시를 넣지 않은 단원입니다. 줄을 누르면 그 단원의 차시표로 갑니다.</p></section>';
    h += '<section class="sec"><div class="sec-h"><h3>활동 정보</h3><span class="en">About the activity</span></div><div class="row">' +
      fld("활동 이름", inp("name", a.name, "예: 알뜰장터")) + fld("시기", inp("period", a.period, "예: 10월 3~4주")) +
      fld("공동 차시 (학년마다)", '<input type="number" min="1" max="20" data-ak="hours" value="' + esc(a.hours) + '">', "참여하는 단원마다 각자 이만큼 차시표에 넣습니다.") +
      fld("장소", inp("place", a.place, "예: 강당, 운동장")) + "</div>" +
      fld("함께 준비·운영하는 내용", '<textarea data-ak="together" rows="3" placeholder="예: 학년 연합 물건 모으기·가격표 만들기, 장터 운영(사고팔기), 수익금 나눔 정하기">' + esc(a.together) + "</textarea>") + "</section>";
    h += '<section class="sec"><div class="sec-h"><h3>참여 단원</h3><span class="en">Units</span></div>' + memberTable(a, ms) + addUnitRow(a) + "</section>";
    h += '<section class="sec"><div class="sec-h"><h3>시수 점검</h3><span class="en">Hours</span></div>' + hoursBox(a, ms) + "</section>";
    h += '<div class="jt-foot"><button class="btn ghost danger" data-act="jointDel">이 교육활동 삭제</button></div>';
    return h;
  };

  function inp(k, v, ph) { return '<input type="text" data-ak="' + k + '" value="' + esc(v) + '" placeholder="' + esc(ph) + '">'; }
  function fld(label, body, hint) { return '<label class="field"><span class="label">' + label + "</span>" + body + (hint ? '<span class="hint">' + hint + "</span>" : "") + "</label>"; }

  function emptyState() {
    var ev = schoolEvents();
    return '<div class="jt-intro"><div><h3>이렇게 씁니다</h3><ol>' +
      "<li><b>교육활동 만들기</b> — 알뜰장터처럼 여러 학년이 함께하는 학교 교육활동을 하나 만듭니다.</li>" +
      "<li><b>참여 단원 넣기</b> — 1학년 ‘○○’, 2학년 ‘△△’처럼 서로 다른 탐구단원을 넣고, 단원마다 이 활동을 어떤 관점으로 바라보는지 적습니다.</li>" +
      "<li><b>공동 차시 넣기</b> — 단원마다 공동 차시(예: 4차시)가 차시표에 들어갑니다. 그 앞은 사전, 뒤는 사후 탐구로 각 교실에서 따로 운영합니다.</li></ol>" +
      "</div>" +
      '<div><h3>학교 행사에서 바로 시작</h3><p class="note">우리 학교 연간 행사 목록입니다. 눌러서 교육활동을 만드세요.</p><div class="chips">' +
      ev.map(function (e) { return '<button class="chip" data-act="jointNew" data-name="' + esc(e[1]) + '" data-period="' + esc(e[0]) + '">' + esc(e[1]) + "</button>"; }).join("") +
      '</div><div style="margin-top:12px"><button class="btn primary" data-act="jointNew">＋ 직접 이름 적어 만들기</button></div></div></div>';
  }
  function schoolEvents() {
    var out = [];
    ((window.SCHOOL && SCHOOL.events) || []).forEach(function (g) {
      String(g[1]).split(/,\s*/).forEach(function (n) { if (n.trim()) out.push([g[0], n.trim()]); });
    });
    return out;
  }

  function memberTable(a, ms) {
    if (!ms.length) return '<p class="note">아직 참여 단원이 없습니다. 아래에서 단원을 골라 넣으세요.</p>';
    return '<div class="tbl-wrap"><table class="mtable jt-table"><thead><tr><th>학년</th><th>탐구단원</th><th>이 단원에서 바라보는 관점</th><th>공동 차시</th><th>사전 · 사후</th><th></th></tr></thead><tbody>' +
      ms.map(function (m) {
        var u = m.u, t = themeOf(u.theme), s = statusOf(a, u), ph = J.phases(u, a.id);
        return '<tr><td class="mono">' + u.grade + "학년</td><td><b>" + esc(u.title || "제목 없음") + "</b>" + (t ? '<br><span style="font-size:12px;color:var(--' + t.color + ')">' + t.ko + "</span>" : "") + "</td>" +
          '<td><textarea data-ak="units.' + m.i + '.lens" rows="2" placeholder="예: 필요와 바람 — 물건의 가치는 어떻게 정해질까?">' + esc(m.link.lens) + "</textarea></td>" +
          '<td><span class="pill ' + s.level + '">' + s.text + "</span>" +
          (s.n < s.h ? '<br><button class="btn ghost jt-small" data-act="jointFill" data-id="' + u.id + '">＋ ' + (s.h - s.n) + "차시 넣기</button>" : "") + "</td>" +
          '<td style="white-space:nowrap">' + (s.n ? "사전 " + ph.pre.length + " · 사후 " + ph.post.length : "—") + "</td>" +
          '<td class="acts"><button class="btn ghost" data-act="jointOpen" data-id="' + u.id + '">차시표</button><button class="btn ghost danger" data-act="jointRemove" data-id="' + u.id + '">빼기</button></td></tr>';
      }).join("") + "</tbody></table></div>";
  }
  function addUnitRow(a) {
    var taken = {}; a.units.forEach(function (x) { taken[x.id] = 1; });
    var rest = S.list().filter(function (u) { return !taken[u.id]; }).sort(function (p, q) { return p.grade - q.grade || (p.title || "").localeCompare(q.title || "", "ko"); });
    if (!rest.length) return '<p class="note" style="margin-top:10px">넣을 수 있는 단원을 모두 넣었습니다.</p>';
    return '<div class="jt-add"><select id="jtUnit"><option value="">단원 고르기</option>' + rest.map(function (u) {
      return '<option value="' + u.id + '">' + u.grade + "학년 · " + esc(u.title || "제목 없음") + (u.example ? " (예시)" : "") + "</option>";
    }).join("") + '</select><button class="btn" data-act="jointAdd">＋ 참여 단원 넣기</button></div>';
  }
  function hoursBox(a, ms) {
    if (!ms.length) return '<p class="note">참여 단원을 넣으면 시수가 계산됩니다.</p>';
    var h = Number(a.hours) || 0, sum = 0, ok = 0;
    var rows = ms.map(function (m) {
      var u = m.u, s = statusOf(a, u), total = u.lessons.length; sum += s.n; if (s.level === "ok") ok++;
      var pct = total ? Math.round(s.n / total * 100) : 0;
      return "<tr><td>" + u.grade + "학년 · " + esc(u.title || "제목 없음") + '</td><td class="mono">' + total + '</td><td class="mono">' + s.n + " / " + h + '</td><td><span class="jt-bar"><i style="width:' + Math.min(100, pct) + '%"></i></span> <span class="mono">' + pct + "%</span></td><td>" +
        '<span class="pill ' + s.level + '">' + (s.level === "ok" ? "맞음" : s.n > h ? h + "차시보다 많음" : s.n ? (h - s.n) + "차시 모자람" : "없음") + "</span></td></tr>";
    }).join("");
    return '<p class="jt-sum">' + q(a.name || "이 활동", "은", "는") + " <b>" + ms.length + "개 단원 × " + h + "차시 = 단원 차시 " + (ms.length * h) + "차시</b>로 운영됩니다. 지금 차시표에 들어간 공동 차시는 모두 <b>" + sum + "차시</b>" +
      (ok === ms.length ? "로 계획과 같습니다." : "입니다. 계획과 다른 단원이 " + (ms.length - ok) + "개 있습니다.") + "</p>" +
      '<div class="tbl-wrap"><table class="mtable"><thead><tr><th>단원</th><th>차시표 전체</th><th>공동 차시</th><th>단원에서 차지하는 비율</th><th>점검</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<p class="note">학교 교육활동을 따로 떼어 운영하지 않고 탐구단원 안에서 운영하면, 교육활동 시수를 늘리지 않고도 앞뒤 탐구와 이어집니다. 공동 차시가 단원의 3분의 1을 넘으면 그 단원의 탐구 초점이 흐려지지 않는지 살펴보세요.</p>';
  }

  // ───── 공동 차시 넣기: 고른 흐름 끝의 차시를 공동으로 표시(차시 수 그대로)하거나 새로 넣음 ─────
  function fill(a, u) {
    var need = (Number(a.hours) || 0) - J.count(u, a.id);
    if (!(Number(a.hours) > 0)) { toast("활동 정보의 ‘공동 차시’를 먼저 적어 주세요."); return; }
    if (need <= 0) { toast("이미 공동 차시가 다 들어 있습니다."); return; }
    var opts = [["LOI1", "LOI 1 끝"], ["LOI2", "LOI 2 끝"], ["LOI3", "LOI 3 끝 (마무리 앞)"]];
    var has = J.count(u, a.id) > 0;
    window.APP.dialog({ title: u.grade + "학년 차시표에 공동 차시 " + need + "차시", ok: "넣기",
      body: (has ? '<p class="note" style="margin:0 0 8px">이미 있는 공동 차시 바로 뒤에 이어서 넣습니다.</p>' :
        "<p style=\"margin:0 0 6px\">" + q(a.name || "교육활동", "을", "를") + " 단원의 어디쯤에서 할까요? 앞쪽은 사전, 뒤쪽은 사후 탐구가 됩니다.</p>" +
        '<div class="chips" style="margin-bottom:12px">' + opts.map(function (o, i) { return '<label class="chip"><input type="radio" name="flow" value="' + o[0] + '"' + (i === 1 ? " checked" : "") + "> " + o[1] + "</label>"; }).join("") + "</div>") +
        '<label class="opt-card"><input type="radio" name="how" value="mark" checked><span><b>있는 차시를 공동 차시로 바꾸기</b><small>차시표의 차시 수(' + u.lessons.length + "차시)는 그대로입니다. 그 자리의 차시가 공동 차시가 됩니다.</small></span></label>" +
        '<label class="opt-card"><input type="radio" name="how" value="insert"><span><b>새 차시로 더하기</b><small>차시표가 ' + u.lessons.length + "차시에서 " + (u.lessons.length + need) + "차시로 늘어납니다.</small></span></label>" })
      .then(function (v) {
        if (!v) return;
        var before = JSON.parse(JSON.stringify(u.lessons)), flow, at = -1, made = 0, first = null;
        if (has) u.lessons.forEach(function (l, i) { if (l.joint === a.id) { at = i; flow = l.flow; } });
        else {
          flow = v.flow || "LOI2";
          var order = P.flows.indexOf(flow);
          u.lessons.forEach(function (l, i) { var k = P.flows.indexOf(l.flow); if (k >= 0 && k <= order) at = i; });
        }
        var label = "[" + (a.name || "공동 활동") + "] 함께 준비·운영";
        if (v.how === "mark") {
          // 이어 붙일 때는 공동 차시 바로 뒤 차시들을, 처음이면 고른 흐름 끝 차시들을 공동으로 (다른 활동의 공동 차시는 건드리지 않음)
          var idx = [];
          if (has) { for (var j = at + 1; j < u.lessons.length && idx.length < need; j++) { if (u.lessons[j].joint) break; idx.push(j); } }
          else { for (var q = at; q >= 0 && idx.length < need && u.lessons[q].flow === flow; q--) { if (u.lessons[q].joint) break; idx.unshift(q); } }
          idx.forEach(function (i) { var l = u.lessons[i]; l.joint = a.id; if (!String(l.method || "").trim()) l.method = label; });
          made = idx.length; first = idx.length ? idx[0] : null;
          if (has && idx.length) at = idx[idx.length - 1];
          else if (!has) at = idx.length ? idx[idx.length - 1] : at;
        }
        var add = need - made;
        for (var k = 0; k < add; k++) u.lessons.splice(at + 1 + k, 0, { flow: flow, stage: "", ilp: "", method: label, note: "", reflection: "", studentRefl: "", studentWork: "", joint: a.id });
        if (first === null) first = at + 1;
        window.APP.save(u); rerender();
        toast(u.grade + "학년 " + (first + 1) + "차시부터 공동 차시 " + need + "개를 " + (made && add ? "맞췄습니다(바꾼 " + made + " · 더한 " + add + ")." : made ? "표시했습니다." : "더했습니다."),
          "되돌리기", function () { u.lessons = before; window.APP.save(u); rerender(); });
      });
  }
  function untag(a, u) { var n = 0; u.lessons.forEach(function (l) { if (l.joint === a.id) { delete l.joint; n++; } }); if (n) window.APP.save(u); return n; }

  // ───── 동작 (모두 false 를 돌려줘 열려 있던 단원을 저장하지 않게 함) ─────
  function askNew(cb) {
    window.APP.dialog({ title: "새 교육활동 만들기", ok: "만들기",
      body: '<label class="field"><span class="label">활동 이름</span><input type="text" name="name" placeholder="예: 알뜰장터"></label>' +
        '<label class="field"><span class="label">시기</span><input type="text" name="period" placeholder="예: 10월 3~4주"></label>' +
        '<label class="field"><span class="label">공동 차시 (학년마다)</span><input type="number" name="hours" min="1" max="20" value="4"></label>' })
      .then(function (v) { if (v) cb((v.name || "").trim(), (v.period || "").trim(), Math.max(1, Math.min(20, Number(v.hours) || 4))); });
  }
  A.jointNew = function (u, el) {
    var name = el.dataset.name || "", period = el.dataset.period || "";
    var go = function (nm, pd, hr) {
      var a = newAct(); a.name = nm; a.period = pd; if (hr) a.hours = hr; S.saveAct(a, true);
      var s = st(); s.view = "joint"; s.actId = a.id; rerender(); window.scrollTo(0, 0);
      toast("‘" + (nm || "새 교육활동") + "’" + jo(nm || "새 교육활동", "을", "를") + " 만들었습니다. 참여 단원을 넣어 주세요.");
    };
    if (name) { go(name, period); return false; }
    askNew(go);
    return false;
  };
  A.jointPick = function (u, el) { st().actId = el.dataset.id; rerender(); return false; };
  A.jointOpen = function (u, el) { window.APP.open(el.dataset.id, "lessons"); return false; };
  A.jointAdd = function () {
    var a = J.cur(), sel = document.getElementById("jtUnit"), id = sel && sel.value;
    if (!a || !id) { toast("넣을 단원을 먼저 고르세요."); return false; }
    a.units.push({ id: id, lens: "" }); S.saveAct(a); rerender();
    var nu = S.units[id];
    toast(nu.grade + "학년 단원을 넣었습니다. ‘＋ 차시 넣기’로 공동 차시를 차시표에 넣으세요.");
    return false;
  };
  A.jointFill = function (u, el) { var a = J.cur(), t = S.units[el.dataset.id]; if (a && t) fill(a, t); return false; };
  A.jointRemove = function (u, el) {
    var a = J.cur(), t = S.units[el.dataset.id]; if (!a || !t) return false;
    var n = J.count(t, a.id);
    window.APP.dialog({ title: "이 단원을 활동에서 뺄까요?", ok: "빼기", danger: true,
      body: "<span>" + t.grade + "학년 " + q(t.title || "제목 없음", "을", "를") + " ‘" + esc(a.name || "교육활동") + "’에서 뺍니다." +
        (n ? " 차시표의 공동 차시 " + n + "개는 <b>지우지 않고</b> 공동 표시만 없앱니다." : "") + "</span>" })
      .then(function (v) {
        if (!v) return;
        untag(a, t); a.units = a.units.filter(function (x) { return x.id !== t.id; }); S.saveAct(a); rerender();
      });
    return false;
  };
  A.jointDel = function () {
    var a = J.cur(); if (!a) return false;
    window.APP.dialog({ title: q(a.name || "교육활동", "을", "를") + " 삭제할까요?", ok: "삭제", danger: true,
      body: "<span>교육활동과 흐름도가 지워집니다. 단원 차시표의 공동 차시는 <b>지우지 않고</b> 공동 표시만 없앱니다.</span>" })
      .then(function (v) {
        if (!v) return;
        a.units.forEach(function (x) { var t = S.units[x.id]; if (t) untag(a, t); });
        S.removeAct(a.id); st().actId = null; rerender(); toast("교육활동을 삭제했습니다.");
      });
    return false;
  };
  A.jointPrint = function () { var a = J.cur(); if (a) printJoint(a); return false; };
  A.openJoint = function (u, el) { var s = st(); s.view = "joint"; s.actId = el.dataset.id; rerender(); window.scrollTo(0, 0); return false; };

  // 활동 정보 입력 (data-ak)
  document.addEventListener("input", function (e) {
    var k = e.target.dataset && e.target.dataset.ak, a = J.cur(); if (!k || !a) return;
    var v = e.target.value, ks = k.split("."), o = a;
    if (k === "hours") v = v === "" ? "" : Math.max(0, Math.min(20, Number(v) || 0));
    for (var i = 0; i < ks.length - 1; i++) o = o[isNaN(ks[i]) ? ks[i] : Number(ks[i])];
    o[ks[ks.length - 1]] = v; S.saveAct(a);
  });
  // 이름·시기·차시는 입력을 마친 뒤 흐름도·시수를 다시 그림 (입력 중 커서가 튀지 않게)
  document.addEventListener("change", function (e) {
    var k = e.target.dataset && e.target.dataset.ak;
    if (k === "hours" || k === "name" || k === "period") rerender();
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("jt-lane")) { e.preventDefault(); window.APP.open(e.target.dataset.id, "lessons"); }
  });

  // ───── 단원 화면에서 쓰는 조각 ─────
  // 차시표 행의 공동 표시 선택
  // 공동이 아닌 차시에는 작은 단추만, 공동 차시에는 활동 이름과 풀기(✕)
  J.lessonSel = function (u, i) {
    var acts = J.forUnit(u); if (!acts.length) return "";
    var l = u.lessons[i], v = acts.some(function (a) { return a.id === l.joint; }) ? l.joint : "";
    if (!v) return '<button class="lnk jt-mark" data-act="jointMark" data-i="' + i + '" title="이 차시를 ' + esc(acts.map(function (a) { return a.name; }).join(", ")) + ' 공동 차시로">🤝 공동으로</button>';
    var a = S.acts[v];
    return '<span class="jt-tag" title="' + esc(a.name || "교육활동") + ' 공동 차시"><span>🤝 ' + esc(a.name || "교육활동") + '</span><button class="lnk" data-act="jointUnmark" data-i="' + i + '" aria-label="공동 차시 풀기" title="공동 차시 풀기">✕</button></span>';
  };
  // 단원 화면의 ‘🤝 공동으로’ — 활동이 하나면 바로, 여럿이면 고르게 함
  A.jointMark = function (u, el) {
    if (!u) return false;
    var acts = J.forUnit(u), l = u.lessons[Number(el.dataset.i)]; if (!l || !acts.length) return false;
    var set = function (id) {
      var a = S.acts[id]; l.joint = id; if (!String(l.method || "").trim()) l.method = "[" + (a.name || "공동 활동") + "] 함께 준비·운영";
      window.APP.save(u); rerender();
      var s2 = statusOf(a, u); if (s2.n > s2.h) toast("공동 차시가 " + s2.n + "차시로 계획(" + s2.h + "차시)보다 많습니다.");
    };
    if (acts.length === 1) { set(acts[0].id); return false; }
    window.APP.dialog({ title: "어느 교육활동의 공동 차시인가요?", ok: "표시",
      body: acts.map(function (a, k) { return '<label class="opt-card"><input type="radio" name="act" value="' + a.id + '"' + (k ? "" : " checked") + "><span><b>" + esc(a.name || "교육활동") + "</b></span></label>"; }).join("") })
      .then(function (v) { if (v && v.act) set(v.act); });
    return false;
  };
  A.jointUnmark = function (u, el) { var l = u && u.lessons[Number(el.dataset.i)]; if (l) delete l.joint; };
  // 흐름 지도 칸 안의 공동 차시 수
  J.flowChip = function (u, flow) {
    var n = u.lessons.filter(function (l) { return l.flow === flow && J.isJoint(u, l); }).length;
    return n ? '<span class="jt-chip" title="함께하는 교육활동 공동 차시">🤝 공동 ' + n + "</span>" : "";
  };
  J.isJoint = function (u, l) { return !!l.joint && J.forUnit(u).some(function (a) { return a.id === l.joint; }); };
  // 흐름 지도 아래 안내 줄
  // 단원 화면(차시 운영)의 함께하는 교육활동 칸 — 여기서 바로 참여·공동 차시 넣기·관점 적기
  J.unitNote = function (u) {
    var mine = J.forUnit(u), others = J.list().filter(function (a) { return mine.indexOf(a) < 0; });
    var h = '<div class="jt-note"><div class="jt-note-h"><b>🤝 함께하는 교육활동</b><span class="hint">여러 학년이 함께 준비·운영하는 학교 교육활동(예: 알뜰장터)에 이 단원을 연결합니다.</span></div>';
    h += mine.map(function (a) {
      var s = statusOf(a, u), link = a.units.find(function (x) { return x.id === u.id; }) || {}, n = J.members(a).length;
      return '<div class="jt-item"><div class="jt-item-h"><button class="lnk" data-act="openJoint" data-id="' + a.id + '">' + esc(a.name || "교육활동") + "</button>" +
        (a.period ? '<span class="jt-lens">' + esc(a.period) + "</span>" : "") + '<span class="jt-lens">' + n + "개 단원 함께</span>" +
        '<span class="pill ' + s.level + '">' + s.text + "</span>" +
        (s.n < s.h ? '<button class="btn ghost jt-small" data-act="jointFillHere" data-aid="' + a.id + '">＋ 공동 차시 ' + (s.h - s.n) + "개 넣기</button>" : "") +
        '<button class="btn ghost jt-small danger" data-act="jointLeave" data-aid="' + a.id + '">참여 빼기</button></div>' +
        '<input type="text" data-lens="' + a.id + '" value="' + esc(link.lens || "") + '" placeholder="이 단원에서 바라보는 관점 — 예: 필요와 바람, 물건의 가치는 어떻게 정해질까?" aria-label="이 단원에서 바라보는 관점"></div>';
    }).join("");
    h += '<div class="jt-join">' + (others.length ? '<select id="jtJoin" aria-label="참여할 교육활동"><option value="">참여할 교육활동 고르기</option>' + others.map(function (a) {
      return '<option value="' + a.id + '">' + esc(a.name || "이름 없는 활동") + (a.period ? " · " + esc(a.period) : "") + " (" + J.members(a).length + "개 단원)</option>";
    }).join("") + '</select><button class="btn" data-act="jointJoin">참여</button>' : "") +
      '<button class="btn ghost" data-act="jointNewHere">＋ 새 교육활동 만들어 참여</button></div></div>';
    return h;
  };
  // 단원 화면에서 쓰는 동작 (u = 지금 열린 단원)
  function joinUnit(a, u) {
    if (!a.units.some(function (x) { return x.id === u.id; })) a.units.push({ id: u.id, lens: "" });
    S.saveAct(a, true); rerender();
    fill(a, u); // 이어서 공동 차시를 어디에 넣을지 물음 (취소해도 참여는 됨)
  }
  A.jointJoin = function (u) {
    var sel = document.getElementById("jtJoin"), a = sel && S.acts[sel.value];
    if (!u || !a) { toast("참여할 교육활동을 먼저 고르세요."); return false; }
    joinUnit(a, u); return false;
  };
  A.jointNewHere = function (u) {
    if (!u) return false;
    askNew(function (nm, pd, hr) {
      var a = newAct(); a.name = nm; a.period = pd; a.hours = hr; st().actId = a.id;
      joinUnit(a, u);
    });
    return false;
  };
  A.jointFillHere = function (u, el) { var a = S.acts[el.dataset.aid]; if (u && a) fill(a, u); return false; };
  A.jointLeave = function (u, el) {
    var a = S.acts[el.dataset.aid]; if (!u || !a) return false;
    var n = J.count(u, a.id);
    window.APP.dialog({ title: q(a.name || "교육활동", "에서", "에서") + " 이 단원을 뺄까요?", ok: "빼기", danger: true,
      body: "<span>" + (n ? "차시표의 공동 차시 " + n + "개는 <b>지우지 않고</b> 공동 표시만 없앱니다." : "차시표는 바뀌지 않습니다.") + "</span>" })
      .then(function (v) {
        if (!v) return;
        untag(a, u); a.units = a.units.filter(function (x) { return x.id !== u.id; }); S.saveAct(a); rerender();
      });
    return false;
  };
  document.addEventListener("input", function (e) {
    var id = e.target.dataset && e.target.dataset.lens, cu = window.APP.cur(), a = id && S.acts[id];
    if (!a || !cu) return;
    var link = a.units.find(function (x) { return x.id === cu.id; }); if (!link) return;
    link.lens = e.target.value; S.saveAct(a);
  });
  // 설계 점검 항목
  J.checks = function (u) {
    return J.forUnit(u).map(function (a) {
      var s = statusOf(a, u);
      return { level: s.level === "ok" ? "ok" : "warn", text: "함께하는 교육활동 ‘" + (a.name || "교육활동") + "’ 공동 차시",
        tip: s.level === "ok" ? "" : s.n + "/" + s.h + "차시 — ‘함께하는 교육활동’ 화면에서 맞출 수 있습니다." };
    });
  };
  // 단원 인쇄에 들어가는 부분
  J.unitPrint = function (u) {
    var acts = J.forUnit(u); if (!acts.length) return "";
    return "<h2>7. 함께하는 교육활동</h2>" + acts.map(function (a) {
      var link = a.units.find(function (x) { return x.id === u.id; }) || {}, ph = J.phases(u, a.id);
      return '<table><tr><th>활동</th><td>' + esc(a.name) + (a.period ? " (" + esc(a.period) + ")" : "") + "</td><th>공동 차시</th><td>" + J.count(u, a.id) + " / " + (Number(a.hours) || 0) + "차시</td></tr>" +
        "<tr><th>이 단원의 관점</th><td colspan=\"3\">" + esc(link.lens || "") + "</td></tr>" +
        "<tr><th>함께 운영</th><td colspan=\"3\">" + esc(a.together || "").replace(/\n/g, "<br>") + "</td></tr>" +
        "<tr><th>흐름</th><td colspan=\"3\">사전 " + ph.pre.length + "차시 → 공동 " + ph.mid.length + "차시 → 사후 " + ph.post.length + "차시</td></tr></table>" + J.svg(a, true);
    }).join("");
  };

  // ───── 활동 인쇄 ─────
  function printJoint(a) {
    var box = document.getElementById("printView"), ms = J.members(a);
    var h = '<div class="pv-page"><div class="pv-head"><div><span>' + esc((window.SCHOOL && SCHOOL.name) || "") + " · 함께하는 교육활동</span><h1>" + esc(a.name || "교육활동") + "</h1></div>" +
      '<table class="pv-sign"><tr><th>담당</th><th>교무</th><th>교감</th><th>교장</th></tr><tr><td></td><td></td><td></td><td></td></tr></table></div>' +
      "<table><tr><th>시기</th><td>" + esc(a.period) + "</td><th>장소</th><td>" + esc(a.place) + "</td></tr>" +
      "<tr><th>공동 차시</th><td colspan=\"3\">학년마다 " + (Number(a.hours) || 0) + "차시 × " + ms.length + "개 단원</td></tr>" +
      "<tr><th>함께 준비·운영</th><td colspan=\"3\">" + esc(a.together).replace(/\n/g, "<br>") + "</td></tr></table>" +
      "<h2>흐름도</h2>" + J.svg(a, true) +
      "<h2>참여 단원</h2><table><tr><th>학년</th><th>탐구단원 · 중심 아이디어</th><th>이 단원의 관점</th><th>사전</th><th>공동</th><th>사후</th></tr>" +
      (ms.length ? ms.map(function (m) {
        var u = m.u, ph = J.phases(u, a.id);
        return '<tr><td class="c">' + u.grade + "</td><td><b>" + esc(u.title) + "</b><br>" + esc(u.centralIdea) + "</td><td>" + esc(m.link.lens) + '</td><td class="c">' + ph.pre.length + '</td><td class="c">' + ph.mid.length + '</td><td class="c">' + ph.post.length + "</td></tr>";
      }).join("") : '<tr><td colspan="6" class="empty">—</td></tr>') + "</table></div>";
    box.innerHTML = '<div class="pv-bar"><b>함께하는 교육활동 인쇄</b><span>A4 세로 기준입니다.</span><button class="btn primary" id="pvPrint">인쇄</button><button class="btn" id="pvClose">닫기</button></div>' + h;
    box.hidden = false; document.body.classList.add("pv-open"); window.scrollTo(0, 0);
    document.getElementById("pvClose").onclick = function () { box.hidden = true; box.innerHTML = ""; document.body.classList.remove("pv-open"); };
    document.getElementById("pvPrint").onclick = function () { try { window.print(); } catch (e) { toast("이 화면에서는 인쇄 창을 열 수 없습니다. Ctrl+P를 눌러 보세요."); } };
  }
})();
