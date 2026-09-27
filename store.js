// 저장소: 학교 공동 저장소(파이어베이스) → 공유 DB(claude.ai 아티팩트) → 이 브라우저의 localStorage
// backend: "cloud"(파이어베이스) | "claude" | "local"
(function () {
  var LS = "nakseong-uoi-v1";
  var S = window.Store = { units: {}, mode: "local", backend: "local", onChange: null, status: "live", cloud: null, localOnly: [] };
  var db = null, timers = {}, writing = {}, again = {}, seen = {};

  function lsLoad() { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; } }
  function lsSave() { try { localStorage.setItem(LS, JSON.stringify(S.units)); } catch (e) {} }
  function emit() { S.onChange && S.onChange(); }
  function setStatus(s) { S.status = s; var el = document.getElementById("sync"); if (el) el.dataset.s = s; }

  S.init = function () {
    var saved = lsLoad();
    var ex = window.exampleUnit();
    if (saved && Object.keys(saved).length) {
      S.units = saved; Object.keys(saved).forEach(function (k) { migrateUnit(saved[k]); });
      // 손대지 않은 옛 예시 단원은 새 예시로 바꿈 (고쳐 쓴 예시는 선생님 단원이므로 그대로)
      Object.keys(S.units).forEach(function (k) {
        var o = S.units[k];
        if (o.example && (o.exampleVersion || 1) < (ex.exampleVersion || 1)) { delete S.units[k]; S.units[ex.id] = ex; }
      });
    }
    else S.units[ex.id] = ex;
    emit();

    // ① 학교 공동 저장소(파이어베이스)를 설정해 두었으면 그것을 씀
    if (window.CLOUD && CLOUD.available()) {
      S.backend = "cloud";
      CLOUD.start({
        state: function (s, msg) {
          S.cloud = { state: s, msg: msg };
          S.mode = (s === "live" || s === "cache") ? "shared" : "local";
          setStatus(s === "live" ? "live" : s === "error" || s === "login" ? "err" : "saving");
          emit();
        },
        units: applyRemote
      });
      return;
    }
    // ② claude.ai 안에서 열었으면 아티팩트 공유 DB
    if (window.claude && window.claude.use) {
      window.claude.use("db").then(function (d) {
        if (!d) return;
        db = d; S.backend = "claude"; S.mode = "shared";
        db.collection("units").onSnapshot(function (snap) {
          if (!snap.metadata.fromCache || snap.size) {
            var map = {};
            snap.docs.forEach(function (doc) { var v = doc.data(); if (v) map[doc.id] = v; });
            applyRemote(map);
          }
        }, function () { S.mode = "local"; emit(); });
      });
    }
  };

  // 서버(또는 다른 선생님)에서 온 목록을 내 화면에 반영
  //  · 지금 저장 중인 단원, 예시 단원, 아직 올리지 않은 내 단원은 지우지 않음
  //  · 전에 서버에 있었는데 사라진 단원은 함께 지움(다른 선생님이 삭제한 경우)
  function applyRemote(map) {
    var next = {}, localOnly = [];
    Object.keys(map).forEach(function (k) { seen[k] = true; next[k] = migrateUnit(JSON.parse(JSON.stringify(map[k]))); });
    Object.keys(S.units).forEach(function (id) {
      if (next[id]) return;
      var u = S.units[id];
      if (timers[id] || writing[id] || u.example) { next[id] = u; return; }
      if (seen[id]) return;
      next[id] = u;
      localOnly.push(id);
    });
    S.units = next; S.localOnly = localOnly; lsSave(); emit();
  }

  // 아직 서버에 없는 내 단원을 한꺼번에 올림
  S.pushLocal = function () {
    var ids = (S.localOnly || []).slice();
    if (!ids.length) return;
    if (S.backend === "cloud" && !(window.CLOUD && CLOUD.canWrite())) { toast("아직 학교 서버에 연결되지 않았습니다."); return; }
    S.localOnly = [];
    ids.forEach(function (id) { if (S.units[id]) write(id); });
    toast(ids.length + "개 단원을 학교 서버에 올렸습니다. 다른 선생님 화면에도 보입니다.");
    emit();
  };

  function write(id) {
    lsSave();
    var u = S.units[id], cloud = S.backend === "cloud";
    // 예시 단원은 공유하지 않고 내 브라우저에만 둠
    if (!db && !cloud) { setStatus("live"); return; }
    if (cloud && u && u.example) { setStatus("live"); return; }
    if (cloud && !CLOUD.canWrite()) { setStatus("err"); return; }
    if (writing[id]) { again[id] = true; return; }
    writing[id] = true;
    var p;
    if (cloud) p = CLOUD.write(id, u || null);
    else { var ref = db.collection("units").doc(id); p = u ? ref.set(JSON.parse(JSON.stringify(u))) : ref.delete(); }
    p.catch(function (e) {
      var code = e && e.code;
      toast(code === "quota_exceeded" ? "저장 공간이 가득 찼습니다. 쓰지 않는 단원을 삭제해 주세요." :
        code === "permission-denied" ? "학교 서버에 저장할 권한이 없습니다. 내용은 이 브라우저에 저장되었습니다." :
        "학교 서버에 저장하지 못했습니다. 내용은 이 브라우저에 남아 있고, 연결되면 자동으로 올라갑니다.");
    }).then(function () {
        delete writing[id];
        if (again[id]) { delete again[id]; write(id); }
        else if (!Object.keys(timers).length) setStatus(cloud && !(S.cloud && S.cloud.state === "live") ? "saving" : "live");
      });
  }

  S.save = function (u, now) {
    u.updatedAt = Date.now(); S.units[u.id] = u; lsSave(); setStatus("saving");
    clearTimeout(timers[u.id]);
    var run = function () { delete timers[u.id]; write(u.id); };
    if (now) run(); else timers[u.id] = setTimeout(run, 900);
  };
  S.remove = function (id) { delete S.units[id]; lsSave(); clearTimeout(timers[id]); delete timers[id]; write(id); emit(); };
  S.list = function () { return Object.keys(S.units).map(function (k) { return S.units[k]; }); };

  // toast(메시지, [버튼 이름, 눌렀을 때 실행할 함수]) — 되돌리기 제공
  window.toast = function (msg, label, fn) {
    var t = document.getElementById("toast"); t.textContent = msg; t.hidden = false;
    if (label && fn) {
      var b = document.createElement("button"); b.textContent = label;
      b.onclick = function () { t.hidden = true; fn(); }; t.appendChild(b);
    }
    clearTimeout(window.toast._t); window.toast._t = setTimeout(function () { t.hidden = true; }, label ? 8000 : 2600);
  };
})();

// ───────── AI 연결 ─────────
// claude.ai 안에서는 Claude(sample)를 사용. 다른 곳(구글 Apps Script 등)에 올릴 때는 window.AI_BACKEND 로 교체.
window.AI = {
  _s: undefined,
  get: function () {
    var self = this;
    if (window.AI_BACKEND) return Promise.resolve(window.AI_BACKEND);
    if (self._s !== undefined) return Promise.resolve(self._s);
    if (!(window.claude && window.claude.use)) { self._s = null; return Promise.resolve(null); }
    return window.claude.use("sample").then(function (s) { self._s = s || null; return self._s; });
  },
  errorText: function (e) {
    return ({ not_granted: "AI 사용이 허용되지 않았습니다.", sampling_disabled: "이 계정에서는 AI를 쓸 수 없습니다.", rate_limited: "요청이 많습니다. 잠시 후 다시 눌러 주세요.",
      session_expired: "다시 로그인한 뒤 눌러 주세요.", invalid_json: "AI 답을 읽지 못했습니다. 한 번 더 눌러 주세요.", cancelled: "" })[e && e.code] ?? "AI 응답이 중간에 멈췄습니다. 다시 눌러 주세요.";
  }
};

// ───────── 설계 점검 ─────────
// core: 안내 모드에서 ‘꼭 할 일’로 보여 줄 항목
window.checkUnit = function (u, all) {
  var P = window.PYP, out = [];
  // phase "run": 운영하면서 채우는 항목 — 설계 점수·꼭 할 일에서 빠짐
  function add(level, tab, text, tip, core, phase) { out.push({ level: level, tab: tab, text: text, tip: tip || "", core: !!core, phase: phase || "plan" }); }
  var filled = function (s) { return s && String(s).trim().length > 0; };

  add(filled(u.title) ? "ok" : "bad", "overview", "탐구단원 제목", "", true);
  add(u.theme ? "ok" : "bad", "overview", "초학문적 주제 선택", "", true);
  add(u.subs.length ? "ok" : "warn", "overview", "세부 주제 연결", u.subs.length ? "" : "주제 설명의 세 갈래 중 이 단원이 다루는 것을 고르세요.");
  var ctx = ["local", "global", "nature"].filter(function (k) { return filled(u.context[k]); }).length;
  add(ctx >= 2 ? "ok" : "warn", "overview", "지역·세계 맥락과 인간·자연 연결", ctx + "/3 작성 — 2025 주제 설명은 인간과 자연 세계의 연결을 함께 봅니다.");
  var lp = Number(u.lessonsPlanned) || 0, UL = P.unitLength;
  add(lp >= UL[0] && lp <= UL[1] + 6 ? "ok" : "warn", "overview", "단원 길이 " + UL[0] + "~" + UL[1] + "차시",
    !lp ? "계획 차시를 적어 주세요." :
    lp < UL[0] ? lp + "차시는 짧을 수 있습니다. 학생이 자기 수준의 결과물과 실천까지 가려면 " + UL[0] + "~" + UL[1] + "차시를 권합니다." :
    lp > UL[1] + 6 ? lp + "차시는 깁니다. 탐구 초점이 흐려지지 않는지, 한 해 여섯 단원을 운영할 수 있는지 살펴보세요." : "");

  var ci = (u.centralIdea || "").trim();
  if (!ci) add("bad", "concept", "중심 아이디어 진술", "", true);
  else add(ciTips(ci).length ? "warn" : "ok", "concept", "중심 아이디어 진술", ciTips(ci).join(" · "), true);

  var nc = u.concepts.length;
  add(nc >= 2 && nc <= 3 ? "ok" : nc ? "warn" : "bad", "concept", "명시된 개념 2~3개", nc > 3 ? "개념이 많으면 탐구 초점이 흐려집니다." : "", true);
  var loiFilled = u.lois.filter(function (l) { return filled(l.text); });
  add(loiFilled.length === 3 ? "ok" : loiFilled.length ? "warn" : "bad", "concept", "탐구 목록(LOI) 3개", loiFilled.length + "/3 작성", true);
  var loiC = u.lois.map(function (l) { return l.concept; }).filter(Boolean);
  var missC = loiFilled.length && loiC.length < loiFilled.length;
  var dupC = loiC.length !== new Set(loiC).size;
  var outC = loiC.filter(function (c) { return u.concepts.indexOf(c) < 0; });
  add(missC || dupC || outC.length ? "warn" : loiC.length ? "ok" : "bad", "concept", "LOI마다 서로 다른 명시된 개념",
    missC ? "개념이 비어 있는 LOI가 있습니다." : dupC ? "같은 개념이 두 LOI에 겹칩니다." : outC.length ? outC.join(", ") + "은(는) 고른 명시된 개념에 없습니다." : "");
  add(filled(u.studentQs) ? "ok" : "warn", "concept", "학생 질문 수집", "탐구열기에서 나온 학생의 궁금증을 적어 두면 주도성이 살아납니다.");
  add(filled(u.agency) ? "ok" : "warn", "concept", "학생 선택·주도성", "학생이 무엇을 스스로 고를 수 있는지 한 줄이면 됩니다.");
  add(u.lp.length >= 1 && u.lp.length <= 3 ? "ok" : u.lp.length ? "warn" : "bad", "concept", "학습자상 1~3개", "", true);
  add(u.atl.length >= 1 && u.atl.length <= 3 ? "ok" : u.atl.length ? "warn" : "bad", "concept", "학습 접근 방법(ATL) 1~3개", "", true);

  var subj = u.subjects.filter(function (s) { return s.subject; });
  var distinct = new Set(subj.map(function (s) { return s.subject; })).size;
  add(distinct >= 2 ? "ok" : distinct ? "warn" : "bad", "subjects", "두 교과 이상 통합", distinct === 1 ? "초학문적 탐구는 여러 교과가 함께 작동합니다." : "", true);
  var hours = subj.reduce(function (a, s) { return a + (Number(s.hours) || 0); }, 0);
  add(hours && hours === Number(u.lessonsPlanned) ? "ok" : hours ? "warn" : "bad", "subjects", "교과 시수 합 = 계획 차시",
    "시수 " + hours + " · 계획 " + (u.lessonsPlanned || 0) + " · 차시표 " + u.lessons.length);
  var codes = subj.map(function (s) { return (s.code || "").trim(); }).filter(Boolean);
  var dupIn = codes.filter(function (c, i) { return codes.indexOf(c) !== i; });
  var dupOther = [];
  (all || []).forEach(function (o) {
    if (o.id === u.id || o.grade !== u.grade) return;
    o.subjects.forEach(function (s) { if (s.code && codes.indexOf(s.code.trim()) >= 0) dupOther.push(s.code.trim() + " → " + (o.title || "제목 없음")); });
  });
  if (codes.length) add(dupIn.length || dupOther.length ? "warn" : "ok", "subjects", "성취기준 중복 없음", dupIn.concat(dupOther).join(" · "));

  add(filled(u.criteria) ? "ok" : "warn", "assess", "성공 기준(학생 언어)", "", true);
  add(filled(u.prior) ? "ok" : "warn", "assess", "사전 지식 확인");
  add(filled(u.formative) && filled(u.documenting) ? "ok" : filled(u.formative) || filled(u.documenting) ? "warn" : "warn", "assess", "모니터링·기록 방법", "배움을 살피는 방법과 남기는 방법을 각각 적습니다.");
  add(filled(u.selfPeer) ? "ok" : "warn", "assess", "자기·동료 평가");
  var tool = u.summativeTool === "RAFT" ? P.raft : u.summativeTool === "GRASPS" ? P.grasps : null;
  var src = u.summativeTool === "RAFT" ? u.raft : u.grasps;
  if (tool) {
    var g = tool.filter(function (x) { return filled(src[x[0]]); }).length;
    add(g === tool.length ? "ok" : g ? "warn" : "bad", "assess", "총괄 과제(" + u.summativeTool + ")", g + "/" + tool.length + " 작성", true);
  } else add(filled(u.grasps.p) ? "ok" : "warn", "assess", "총괄 과제", "과제 내용을 적어 주세요.", true);
  var hasConceptRow = u.rubric.some(function (r) { return r.domain === "개념적 이해"; });
  add(hasConceptRow ? "ok" : "warn", "assess", "루브릭에 개념적 이해 기준", u.rubric.length ? "중심 아이디어 이해를 보는 기준을 하나 넣으세요." : "루브릭이 아직 없습니다.");

  var nl = u.lessons.length;
  if (u.model === P.freeModel) {
    // 탐구 조각: 정해진 순서는 없음 — 탐구를 여는 차시와 배운 것을 모으는 차시가 있는지만 봄
    var roles = u.lessons.map(function (l) { return stageRole(u.model, l.stage); });
    var opens = roles.some(function (r) { return r === "open" || r === "ask" || r === "know"; });
    var ends = roles.some(function (r) { return r === "gen" || r === "share" || r === "close"; });
    add(nl === 0 ? "bad" : opens && ends ? "ok" : "warn", "lessons", "탐구를 여는 차시와 모으는 차시",
      !nl ? "" : !opens ? "관계 맺기·질문 만들기·지식·이해처럼 탐구를 여는 차시가 있는지 보세요." : !ends ? "일반화·표현·공유·적용처럼 배운 것을 모으는 차시가 있는지 보세요." : "", true);
    var blank = u.lessons.filter(function (l) { return !l.stage; }).length;
    if (nl) add(blank ? "warn" : "ok", "lessons", "차시마다 탐구 조각 고르기", blank ? blank + "개 차시가 비어 있습니다. 학년과 단원에 맞게 골라 주세요." : "");
  } else {
    var stages = P.models[u.model].map(function (s) { return s[0]; });
    var used = new Set(u.lessons.map(function (l) { return l.stage; }));
    var missing = stages.filter(function (s) { return !used.has(s); });
    add(nl === 0 ? "bad" : missing.length ? "warn" : "ok", "lessons", "탐구 단계 모두 배치", missing.length && nl ? "빠진 단계: " + missing.join(", ") : "", true);
  }
  var flowsUsed = new Set(u.lessons.map(function (l) { return l.flow; }));
  var loiNo = ["LOI1", "LOI2", "LOI3"].filter(function (f) { return !flowsUsed.has(f); });
  if (nl) add(loiNo.length ? "warn" : "ok", "lessons", "LOI마다 차시 배정", loiNo.length ? loiNo.join(", ") + " 차시가 없습니다." : "");
  var ilps = new Set(u.lessons.map(function (l) { return l.ilp; }).filter(Boolean));
  if (nl) add(ilps.size >= 2 ? "ok" : "warn", "lessons", "탐구 기능 발달 단계 연결", "관찰·역할·질문·의사결정 중 두 가지 이상을 차시에 연결해 보세요.");

  // 실천·성찰은 운영하면서 채움 — 설계 단계의 필수가 아님
  add(filled(u.action) || u.actionTypes.length ? "ok" : "warn", "reflect", "예상되는 학생 실천 떠올려 보기", "설계 때 꼭 채울 필요는 없습니다. 미리 떠올려 두면 기회를 열어 주기 쉽습니다.");
  var r = ["before", "during", "teacher"].filter(function (k) { return filled(u.reflect[k]); }).length;
  add(r === 3 ? "ok" : "run", "reflect", "교사 성찰(전·중·후)", r + "/3 · 운영하면서 채웁니다", false, "run");
  var rs = ["student", "parent"].filter(function (k) { return filled(u.reflect[k]); }).length;
  add(rs === 2 ? "ok" : "run", "reflect", "학생·학부모 성찰", rs + "/2 · 운영하면서 채웁니다", false, "run");
  return out;
};

// 중심 아이디어 즉시 점검(규칙 기반, AI 아님)
window.ciTips = function (ci) {
  var tips = [];
  if (/[?？]$/.test(ci)) tips.push("질문이 아니라 진술문으로 쓰세요");
  if (/^(학생들?은|아이들은|우리 반)/.test(ci)) tips.push("학생 목표가 아닌, 세상에 대한 개념적 진술로 쓰세요");
  if (/(알 수 있다|배운다|이해한다|할 수 있다|알아본다)\.?$/.test(ci)) tips.push("‘~할 수 있다’는 학습 목표 표현입니다");
  if (ci.length < 25) tips.push("두 개 이상의 개념을 잇는 문장으로 넓혀 보세요");
  if (/\d{4}|[0-9]+학년|교과서/.test(ci)) tips.push("특정 사실보다 다른 상황에도 옮겨 쓸 수 있는 이해로 쓰세요");
  if (/\[.+\]/.test(ci)) tips.push("문장 틀의 [ ] 부분을 단원 내용으로 바꿔 주세요");
  return tips;
};

// 설계 점수 — 운영하면서 채우는 항목(phase "run")은 빼고 셈
window.scoreOf = function (checks) {
  var list = checks.filter(function (c) { return c.phase !== "run"; }), s = 0;
  list.forEach(function (c) { s += c.level === "ok" ? 1 : c.level === "warn" ? 0.5 : 0; });
  return list.length ? Math.round(s / list.length * 100) : 0;
};

// ───────── 내보내기 ─────────
window.Exporter = {
  save: function (filename, data) {
    var fallback = function () {
      var blob = data instanceof Blob ? data : new Blob([data]);
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    };
    if (!(window.claude && window.claude.use)) return fallback();
    window.claude.use("downloads").then(function (d) {
      if (!d) return fallback();
      d.save({ filename: filename, data: data }).then(function () { toast("파일을 저장했습니다."); })
        .catch(function (e) { if (e.code !== "declined") toast("이 화면에서는 파일을 저장할 수 없습니다."); });
    });
  },
  json: function (units) {
    this.save("낙성초_UOI_백업_" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify({ app: "nakseong-uoi", version: 2, units: units }, null, 2));
  },
  xlsx: function (units, onlyUnit) {
    if (!window.XLSX) { toast("엑셀 모듈을 불러오지 못했습니다. JSON으로 백업해 주세요."); return; }
    var P = window.PYP, wb = XLSX.utils.book_new();
    var themeKo = function (id) { var t = P.themes.find(function (x) { return x.id === id; }); return t ? t.ko : ""; };
    if (!onlyUnit) {
      var rows = [["학년", "학기", "초학문적 주제", "탐구단원 제목", "명시된 개념", "추가 개념", "중심 아이디어", "LOI1", "LOI2", "LOI3", "학습자상", "ATL", "기간", "상태"]];
      units.slice().sort(function (a, b) { return a.grade - b.grade || P.themes.findIndex(function (t) { return t.id === a.theme; }) - P.themes.findIndex(function (t) { return t.id === b.theme; }); })
        .forEach(function (u) {
          rows.push([u.grade + "학년", u.semester || "", themeKo(u.theme), u.title, u.concepts.join(", "), u.related, u.centralIdea,
            u.lois[0].text, u.lois[1].text, u.lois[2].text, u.lp.join(", "), u.atl.join(", "), u.period, u.status]);
        });
      var ws = XLSX.utils.aoa_to_sheet(rows); ws["!cols"] = [6, 8, 18, 22, 16, 16, 44, 26, 26, 26, 22, 30, 16, 8].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, ws, "POI 계획표");
    }
    units.forEach(function (u, i) {
      var o = [["탐구 단원(Unit of inquiry) 계획 및 실행"], [], ["탐구단원 제목", u.title], ["학년", u.grade + "학년"], ["운영 학기", u.semester || ""],
        ["초학문적 주제", themeKo(u.theme)], ["세부 주제", u.subs.join(" / ")], ["기간", u.period], ["계획 차시", u.lessonsPlanned],
        ["협력적 계획 팀", u.team], ["지역 맥락", u.context.local], ["세계 맥락", u.context.global], ["인간·자연 연결", u.context.nature], ["중심 아이디어", u.centralIdea]];
      u.lois.forEach(function (l, k) { o.push(["LOI-" + (k + 1), l.text, l.concept]); });
      o.push(["명시된 개념", u.concepts.join(", ")], ["추가 개념", u.related], ["학습자상", u.lp.join(", ")], ["ATL", u.atl.join(", ")],
        ["교수 접근 방법", u.teaching.join(", ")], ["교사 질문", u.teacherQs], ["학생 질문", u.studentQs], ["학생 선택·주도성", u.agency], [], ["교과", "시수", "성취기준", "내용"]);
      u.subjects.forEach(function (s) { o.push([s.subject, s.hours, s.code, s.content]); });
      o.push([], ["학습 목표", u.goals], ["성공 기준", u.criteria], ["사전 지식 확인", u.prior], ["모니터링", u.formative], ["기록", u.documenting], ["자기·동료 평가", u.selfPeer], [], ["총괄 과제 도구", u.summativeTool]);
      if (u.summativeTool === "RAFT") P.raft.forEach(function (x) { o.push([x[2], u.raft[x[0]]]); });
      else P.grasps.forEach(function (x) { o.push([x[2], u.grasps[x[0]]]); });
      o.push(["산출물 종류", u.productType], [], ["루브릭", "영역"].concat(P.rubricLevels));
      u.rubric.forEach(function (r) { o.push([r.name, r.domain].concat(r.levels)); });
      o.push([], ["실천 유형", u.actionTypes.join(", ")], ["학생 실천 지원", u.action], ["학생이 제안한 실천", u.studentAction], ["자료", u.resources],
        ["교사 성찰(운영 전)", u.reflect.before], ["교사 성찰(운영 중)", u.reflect.during], ["교사 성찰(운영 후)", u.reflect.teacher], ["학생 성찰", u.reflect.student], ["학부모 성찰", u.reflect.parent], [], ["협력적 계획 회의", "참석", "협의 내용"]);
      u.meetings.forEach(function (m) { o.push([m.date, m.who, m.note]); });
      var w1 = XLSX.utils.aoa_to_sheet(o); w1["!cols"] = [{ wch: 18 }, { wch: 60 }, { wch: 18 }, { wch: 40 }, { wch: 30 }, { wch: 30 }];
      var name = (u.grade + "학년 " + (u.title || "단원" + (i + 1))).replace(/[\\\/\?\*\[\]:]/g, "").slice(0, 24);
      XLSX.utils.book_append_sheet(wb, w1, name + " 개요");
      var l = [["탐구 모형", u.model], ["차시", "탐구의 흐름", "탐구단계", "탐구 기능 발달", "교수학습방법 및 전략", "비고", "차시별 성찰", "학생성찰", "학생활동 결과"]];
      u.lessons.forEach(function (x, k) { l.push([k + 1, x.flow, x.stage, x.ilp, x.method, x.note, x.reflection, x.studentRefl, x.studentWork]); });
      var w2 = XLSX.utils.aoa_to_sheet(l); w2["!cols"] = [6, 12, 16, 14, 44, 24, 30, 24, 24].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, w2, name.slice(0, 22) + " 차시");
    });
    var buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    var fn = onlyUnit ? (units[0].grade + "학년_" + (units[0].title || "탐구단원")) : "낙성초_POI_" + new Date().getFullYear();
    this.save(fn.replace(/[\\\/:*?"<>|]/g, "") + ".xlsx", new Blob([buf]));
  }
};
