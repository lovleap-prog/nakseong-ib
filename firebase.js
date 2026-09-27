// 학교 공동 저장소(파이어베이스 Firestore + 구글 로그인)
// firebase-config.js 를 채우고 enabled:true 로 바꾸면 켜집니다. 그 전에는 아무 일도 하지 않습니다.
// 필요한 파일은 켜졌을 때만 인터넷에서 불러오므로, 설정하지 않은 학교는 기존과 똑같이 동작합니다.
(function () {
  var CFG = window.FIREBASE || {};
  var C = window.CLOUD = { state: "off", msg: "", user: null };
  var host = null, M = null, auth = null, col = null, unsub = null, started = false;

  // 설정이 채워졌는지
  C.available = function () {
    var c = CFG.config || {};
    return !!(CFG.enabled && c.apiKey && c.projectId && c.appId);
  };
  // 지금 서버에 쓸 수 있는 상태인지
  C.canWrite = function () {
    return !!col && C.state !== "login" && C.state !== "error" && (!!C.user || !CFG.requireLogin);
  };

  function state(s, msg) {
    C.state = s; C.msg = msg || "";
    if (host && host.state) host.state(s, C.msg);
  }

  // 파이어베이스 모듈 불러오기 — 구글 공식 CDN, 막혀 있으면 jsDelivr
  function load() {
    var v = CFG.version || "10.14.1";
    var bases = [
      function (m) { return "https://www.gstatic.com/firebasejs/" + v + "/firebase-" + m + ".js"; },
      function (m) { return "https://cdn.jsdelivr.net/npm/firebase@" + v + "/" + m + "/+esm"; }
    ];
    var i = 0;
    function attempt() {
      var at = bases[i++];
      if (!at) return Promise.reject(new Error("firebase load failed"));
      return Promise.all([import(at("app")), import(at("auth")), import(at("firestore"))])
        .then(function (r) { return { app: r[0], auth: r[1], fs: r[2] }; })
        .catch(function (e) { console.warn("[cloud] CDN 실패, 다음 주소로 시도", e); return attempt(); });
    }
    return attempt();
  }

  C.start = function (h) {
    host = h;
    if (!C.available()) { state("off"); return; }
    if (started) return; started = true;
    state("connecting");
    load().then(setup).catch(function (e) {
      console.error("[cloud]", e);
      state("error", "파이어베이스 파일을 불러오지 못했습니다. 인터넷 연결이나 학교 방화벽을 확인해 주세요.");
    });
  };

  function setup(m) {
    M = m;
    var app;
    try { app = m.app.getApps().length ? m.app.getApp() : m.app.initializeApp(CFG.config); }
    catch (e) { console.error("[cloud]", e); state("error", "설정 값이 올바르지 않습니다. firebase-config.js를 다시 확인해 주세요."); return; }

    var fs;
    // 인터넷이 끊겨도 보이도록 기기 안에 사본을 둠 (탭 여러 개도 지원)
    try {
      fs = m.fs.initializeFirestore(app, { localCache: m.fs.persistentLocalCache({ tabManager: m.fs.persistentMultipleTabManager() }) });
    } catch (e) { fs = m.fs.getFirestore(app); }

    col = m.fs.collection(fs, "schools", CFG.school || "school", "units");
    auth = m.auth.getAuth(app);

    m.auth.onAuthStateChanged(auth, function (user) {
      if (user) {
        C.user = { name: user.displayName || user.email || "선생님", email: user.email || "" };
        listen();
      } else {
        C.user = null;
        if (unsub) { unsub(); unsub = null; }
        if (CFG.requireLogin) state("login", "");
        else listen();
      }
    }, function (e) { console.error("[cloud]", e); state("error", "로그인 상태를 확인하지 못했습니다."); });
  }

  // 실시간 구독 — 다른 선생님이 고치면 바로 내 화면에 들어옴
  function listen() {
    if (unsub) return;
    state("connecting");
    unsub = M.fs.onSnapshot(col, function (snap) {
      var map = {};
      snap.forEach(function (d) { var v = d.data(); if (v) map[d.id] = v; });
      state(snap.metadata.fromCache ? "cache" : "live");
      if (host && host.units) host.units(map);
    }, function (e) {
      console.error("[cloud]", e);
      unsub = null;
      state("error", (e && e.code) === "permission-denied"
        ? "이 계정은 아직 참여자로 등록되지 않았습니다. 보안 규칙에 이메일을 추가해 달라고 담당 선생님께 부탁하세요."
        : "학교 서버에 연결하지 못했습니다. 작성 내용은 이 브라우저에 계속 저장됩니다.");
    });
  }

  // 단원 하나 저장(unit === null 이면 삭제)
  C.write = function (id, unit) {
    if (!C.canWrite()) return Promise.reject({ code: "offline" });
    var ref = M.fs.doc(col, id);
    if (!unit) return M.fs.deleteDoc(ref);
    var data = JSON.parse(JSON.stringify(unit));
    data.editedBy = C.user ? C.user.name : "";
    data.editedAt = Date.now();
    return M.fs.setDoc(ref, data);
  };

  C.signIn = function () {
    if (!auth) return;
    var m = M.auth, p = new m.GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    state("connecting");
    m.signInWithPopup(auth, p).catch(function (e) {
      var code = (e && e.code) || "";
      if (/popup-blocked/.test(code)) return m.signInWithRedirect(auth, p);
      if (/popup-closed|cancelled-popup/.test(code)) { state("login", ""); return; }
      console.error("[cloud]", e);
      state("login", /unauthorized-domain/.test(code)
        ? "이 주소가 파이어베이스에 승인되지 않았습니다. Authentication > Settings > 승인된 도메인에 이 주소를 추가해 주세요."
        : /operation-not-allowed|configuration-not-found/.test(code)
          ? "구글 로그인이 켜져 있지 않습니다. Authentication > Sign-in method에서 Google을 사용 설정해 주세요."
          : "로그인하지 못했습니다. 다시 눌러 주세요.");
    });
  };

  C.signOut = function () { if (auth) M.auth.signOut(auth); };
  C.retry = function () { if (!unsub && col) { state("connecting"); listen(); } };
})();
