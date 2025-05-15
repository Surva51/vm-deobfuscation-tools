/*──────────────────────────────────────────────────────────────────────────────
  Tiny DOM‑/Web‑API shim for Node
  – creates window, document, navigator, etc. on the fly
  – hard‑codes cookies + xhsSecCookies
──────────────────────────────────────────────────────────────────────────────*/

/* --- helpers & silent logger --------------------------------------------- */
const IGNORE = new Set(["console", "process", "Buffer", "GLOBAL", "global"]);
const log = (..._a) => {}; // <- flip to //console.log if needed

/* --- 1.  global `window` / `self` proxy ---------------------------------- */
function createWindowProxy(target) {
  return new Proxy(target, {
    get(t, p, r) {
      if (typeof p !== "symbol" && !IGNORE.has(p)) log(`window.${String(p)}`);
      return Reflect.get(t, p, r);
    },
    set(t, p, v, r) {
      if (typeof p !== "symbol") log(`window.${String(p)} ←`, v);
      return Reflect.set(t, p, v, r);
    },
  });
}

/* --- 2.  dummy DOM elements (never break the VM) ------------------------- */
function makeElement(tag = "div") {
  const attrs = Object.create(null);
  const children = [];
  const listeners = Object.create(null);

  const core = {
    tagName: tag.toUpperCase(),

    getAttribute(name) {
      log(`  getAttribute("${name}")`);
      return attrs[name] ?? null;
    },
    setAttribute(name, v) {
      log(`  setAttribute("${name}", "${v}")`);
      attrs[name] = String(v);
    },
    removeAttribute(name) {
      delete attrs[name];
    },
    hasAttribute(name) {
      return name in attrs;
    },

    get src() {
      return attrs.src ?? "";
    },
    set src(v) {
      attrs.src = String(v);
    },
    get href() {
      return attrs.href ?? "";
    },
    set href(v) {
      attrs.href = String(v);
    },

    style: new Proxy(Object.create(null), { get: () => "", set: () => true }),

    addEventListener(type, cb) {
      (listeners[type] ??= []).push(cb);
    },
    removeEventListener(type, cb) {
      const a = listeners[type] || [];
      const i = a.indexOf(cb);
      if (i > -1) a.splice(i, 1);
    },
    dispatchEvent(evt) {
      (listeners[evt.type] || []).forEach((cb) => cb.call(this, evt));
      return true;
    },

    appendChild(c) {
      children.push(c);
    },
    removeChild(c) {
      const i = children.indexOf(c);
      if (i > -1) children.splice(i, 1);
    },
    get firstChild() {
      return children[0] ?? makeElement();
    },
    get parentNode() {
      return makeElement();
    },

    toString() {
      return `<${tag}>`;
    },
  };

  return new Proxy(core, {
    get(t, p, r) {
      const prop = typeof p === "symbol" ? p.toString() : String(p);
      log(`  <${core.tagName}>.${prop}`);
      if (p in t) return t[p];
      return function dummy() {
        log(`    (dummy ${prop} invoked)`);
        return undefined;
      };
    },
    set(t, p, v, r) {
      t[p] = v;
      return true;
    },
  });
}

/* --- 3.  super‑minimal `document` object --------------------------------- */
function createDocument() {
  const d = {};
  d.createElement = (tag) => makeElement(tag);
  d.createElementNS = (_ns, tag) => makeElement(tag);
  d.querySelector = (sel) => makeElement(sel.replace(/[.#].*/, "") || "div");
  d.getElementById = (_id) => makeElement("div");
  d.getElementsByTagName = (tag) =>
    Object.assign([makeElement(tag)], { item: (_) => makeElement(tag) });
  d.getElementsByClassName = (cls) =>
    Object.assign([makeElement("div")], { item: (_) => makeElement("div") });
  d.readyState = "complete";
  d.addEventListener = () => {};
  d.head = makeElement("head");
  d.body = makeElement("body");
  d.documentElement = makeElement("html");
  return d;
}

/* --- hard‑define navigator (clobbers anything that was there) ------------ */
globalThis.navigator = {
  /* strings --------------------------------------------------------------- */
  appCodeName: "Mozilla",
  appName: "Netscape",
  appVersion:
    "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  platform: "Win32",
  product: "Gecko",
  productSub: "20030107",
  vendor: "Google Inc.",
  vendorSub: "",
  language: "zh-CN",
  languages: ["zh-CN", "zh", "en"],

  /* numbers / booleans ---------------------------------------------------- */
  deviceMemory: 8,
  hardwareConcurrency: 16,
  maxTouchPoints: 0,
  onLine: true,
  pdfViewerEnabled: false,
  cookieEnabled: true,
  webdriver: false,

  /* stub objects ---------------------------------------------------------- */
  bluetooth: {},
  clipboard: {},
  gpu: {},
  hid: {},
  ink: {},
  keyboard: {},
  locks: {},
  login: {},
  managed: {},
  mediaSession: {},
  permissions: {},
  presentation: {},
  protectedAudience: {},
  scheduling: {},
  serial: {},
  storage: {},
  storageBuckets: {},
  usb: {},
  virtualKeyboard: {},
  wakeLock: {},

  /* connection ------------------------------------------------------------ */
  connection: {
    effectiveType: "4g",
    rtt: 50,
    downlink: 10,
    saveData: false,
    onchange: null,
  },

  /* misc shims ------------------------------------------------------------ */
  geolocation: {},
  mediaDevices: {},
  mimeTypes: { length: 0, item: () => null },
  plugins: { length: 0, item: () => null },
  serviceWorker: {
    controller: null,
    ready: Promise.resolve(),
    oncontrollerchange: null,
    onmessage: null,
    onmessageerror: null,
  },

  userAgentData: {
    brands: [
      { brand: "Chromium", version: "135" },
      { brand: "Google Chrome", version: "135" },
      { brand: "Not:A-Brand", version: "24" },
    ],
    mobile: false,
    platform: "Windows",
    getHighEntropyValues(keys) {
      const map = {
        fullVersionList: this.brands,
        platformVersion: "15.0.0",
        architecture: "x86",
        model: "",
        bitness: "64",
      };
      return Promise.resolve(keys.reduce((o, k) => ((o[k] = map[k]), o), {}));
    },
  },
};

/* --- 5.  wire up globals -------------------------------------------------- */
globalThis.window = globalThis.self = createWindowProxy(globalThis);
globalThis.document = createDocument();

/* --- 6.  example cookies for environment simulation ------------------------ */
const cookieStr =
  "abRequestId=aabbccdd-1234-5678-9012-aabbccddeeff; " +
  "a1=examplecookievalue12345; " +
  "webId=abcdef1234567890abcdef1234567890; " +
  "gid=someCookieValueWithRandomText123456; " +
  "xsecappid=webapp-example; " +
  "webBuild=4.6.0; " +
  "websectiga=examplehash123456789abcdef123456789abcdef123456789abcdef123456; " +
  "sec_poison_id=00112233-4455-6677-8899-aabbccddeeff; " +
  "loadts=1641234567890; " +
  "unread={%22data%22:%22example%22,%22count%22:10}";

document.cookie = cookieStr;

Object.defineProperty(window, "xhsSecCookies", {
  configurable: true,
  enumerable: false,
  get() {
    return document.cookie;
  },
  set(v) {
    document.cookie = String(v);
  },
});

/*──────────────────────────────────────────────────────────────────────────────
  7.  Extra browser-API shims (location, screen, performance, Image, XHR)
      – lightweight stubs good enough for most bundler output
      – do nothing in real browsers where the objects already exist
──────────────────────────────────────────────────────────────────────────────*/

const has = (k) => Object.prototype.hasOwnProperty.call(globalThis, k);

/* --- location ------------------------------------------------------------ */
if (!has("location")) {
  // Defaults to https://example.com/ – change if your code expects another origin
  const url = new URL("https://example.com/");
  globalThis.location = new Proxy(url, {
    get(t, p) {
      if (typeof p === "string") log(`location.${p}`);
      // Methods (assign, reload, etc.) work; primitives are mirrored
      return typeof t[p] === "function" ? t[p].bind(t) : t[p];
    },
    set(_, p, v) {
      if (p === "href") {
        try { url.href = v; } catch {}
      }
      return true;
    },
  });
}

/* --- screen -------------------------------------------------------------- */
if (!has("screen")) {
  globalThis.screen = {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
  };
}

/* --- performance.now() --------------------------------------------------- */
if (!has("performance")) {
  const start = Date.now();
  globalThis.performance = {
    now: () => Date.now() - start,
    timeOrigin: start,
    toJSON() { return { timeOrigin: start }; },
  };
}

/* --- Image constructor --------------------------------------------------- */
if (!has("Image")) {
  globalThis.Image = class Image {
    constructor(width = 0, height = 0) {
      this.width = width;
      this.height = height;
      this.onload = null;
      this.onerror = null;
      this._src = "";
    }
    get src() { return this._src; }
    set src(v) {
      this._src = String(v);
      // async "load" tick—good enough for most code paths
      setTimeout(() => typeof this.onload === "function" && this.onload());
    }
  };
}

/* --- super-minimal XMLHttpRequest backed by fetch ------------------------ */
if (!has("XMLHttpRequest")) {
  globalThis.XMLHttpRequest = class XMLHttpRequest {
    open(method, url, async = true) {
      this._method = method;
      this._url = url;
      this._async = async;
      this.readyState = 1;
    }
    setRequestHeader() {}              // noop – add if you really need it
    send(body) {
      fetch(this._url, { method: this._method, body })
        .then((r) => r.text().then((t) => {
          this.status = r.status;
          this.responseText = t;
          this.readyState = 4;
          if (typeof this.onload === "function") this.onload();
        }))
        .catch((e) => {
          this.status = 0;
          if (typeof this.onerror === "function") this.onerror(e);
        });
    }
    abort() {}
  };
}

/* put this BEFORE the bundle executes – never touches _rts1062 */

/* 1. Location object Chrome-style --------------------------------------- */
const url = new URL("https://example.com/webapp");
globalThis.location = {
  ancestorOrigins: {},
  get href()      { return url.href; },
  set href(v)     { try { url.href = v; } catch {} },
  get origin()    { return url.origin;   },
  get protocol()  { return url.protocol; },
  get host()      { return url.host;     },
  get hostname()  { return url.hostname; },
  get port()      { return url.port;     },
  get pathname()  { return url.pathname; },
  get search()    { return url.search;   },
  get hash()      { return url.hash;     },
  assign : (u) => (url.href = u),
  replace: (u) => (url.href = u),
  reload : () => {},
  toString() { return url.href; }
};



/* 4. performance clone with timing & navigation keys -------------------- */
const t0 = Date.now();
globalThis.performance = {
  timeOrigin : t0 + 0.2,
  now: () => Date.now() - t0,
  timing : { navigationStart: t0 },   // keys exist; values don't matter here
  navigation : { type: 1, redirectCount: 0 }
};

/* 5. tiny process.env for later checks ---------------------------------- */
globalThis.process = { env: { BROWSER: true, BUILD_ENV: "production" } };
