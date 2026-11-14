/* ==========================================================================
   MD Chat v2 — full feature build
   ========================================================================== */

const RELAY = "wss://demos.yjs.dev/ws";
const PROFILE_KEY = "mdchat.profile.v1";
const SETTINGS_KEY = "mdchat.settings.v1";
const LAST_ROOM_KEY = "mdchat.lastRoom.v1";
const READ_KEY = "mdchat.read.";
const MAX_TEXT = 4000;
const MAX_IMAGE_BYTES = 450 * 1024;
const IMAGE_MAX_EDGE = 1600;
const AVATAR_SIZE = 128;

const EMOJI_AVATARS = ["🦊","🐼","🐳","🦉","🐙","🌙","⚡","🔥","🌊","🪐","🍀","🎧"];
const COLORS = ["#0A84FF","#1E90FF","#5E5CE6","#30D158","#FF9F0A","#FF375F","#64D2FF","#BF5AF2"];
const PICKER_EMOJIS = ["😀","😂","😊","😍","🤔","😎","😭","😅","🙌","👏","🔥","✨","💙","💯","🎉","☕","🌙","⚡","🌊","🍀","🫶","👀","🤝","🚀"];
const REACTION_EMOJIS = ["👍","❤️","😂","😮","🔥","👀"];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const el = {
  landing: $("#landingScreen"), chat: $("#chatScreen"),
  joinForm: $("#joinForm"), username: $("#username"), usernameError: $("#usernameError"),
  roomName: $("#roomName"), roomError: $("#roomError"), joinBtn: $("#joinBtn"),
  avatarPreview: $("#avatarPreview"), tabEmoji: $("#tabEmoji"), tabInitial: $("#tabInitial"),
  tabPhoto: $("#tabPhoto"), emojiPanel: $("#emojiPanel"), initialPanel: $("#initialPanel"),
  photoPanel: $("#photoPanel"), photoInput: $("#photoInput"), photoDrop: $("#photoDrop"),
  removePhoto: $("#removePhoto"), landingAbout: $("#landingAbout"),
  sidebarRoom: $("#sidebarRoom"), sidebarStatusDot: $("#sidebarStatusDot"),
  sidebarStatusText: $("#sidebarStatusText"), desktopOnlineCount: $("#desktopOnlineCount"),
  mobileOnlineCount: $("#mobileOnlineCount"), popoverOnlineCount: $("#popoverOnlineCount"),
  onlineListDesktop: $("#onlineListDesktop"), onlineListMobile: $("#onlineListMobile"),
  topbarRoom: $("#topbarRoom"), topbarStatusDot: $("#topbarStatusDot"),
  topbarStatusText: $("#topbarStatusText"), mobileLeave: $("#mobileLeave"),
  peopleBtn: $("#peopleBtn"), peoplePopover: $("#peoplePopover"),
  searchBtn: $("#searchBtn"), topbarSettings: $("#topbarSettings"),
  copyInviteBtn: $("#copyInviteBtn"), settingsBtn: $("#settingsBtn"),
  aboutBtn: $("#aboutBtn"), leaveBtn: $("#leaveBtn"),
  popoverSettings: $("#popoverSettings"), popoverAbout: $("#popoverAbout"),
  popoverLeave: $("#popoverLeave"),
  connectionBanner: $("#connectionBanner"), bannerText: $("#bannerText"),
  bannerRetry: $("#bannerRetry"),
  searchBar: $("#searchBar"), searchInput: $("#searchInput"),
  searchCount: $("#searchCount"), searchPrev: $("#searchPrev"),
  searchNext: $("#searchNext"), searchClose: $("#searchClose"),
  messageList: $("#messageList"), emptyState: $("#emptyState"),
  emptyTitle: $("#emptyTitle"), emptySub: $("#emptySub"),
  jumpLatest: $("#jumpLatest"), typingBar: $("#typingBar"), typingText: $("#typingText"),
  replyPreview: $("#replyPreview"), replyName: $("#replyName"), replyText: $("#replyText"),
  cancelReply: $("#cancelReply"), editBar: $("#editBar"), editText: $("#editText"),
  cancelEdit: $("#cancelEdit"), mentionDropdown: $("#mentionDropdown"),
  emojiBtn: $("#emojiBtn"), emojiPicker: $("#emojiPicker"),
  emojiPickerGrid: $("#emojiPickerGrid"), attachBtn: $("#attachBtn"),
  imageInput: $("#imageInput"), messageInput: $("#messageInput"),
  sendBtn: $("#sendBtn"), charCount: $("#charCount"),
  settingsDialog: $("#settingsDialog"), closeSettings: $("#closeSettings"),
  settingName: $("#settingName"), settingAvatarBtn: $("#settingAvatarBtn"),
  resetProfile: $("#resetProfile"), settingDensity: $("#settingDensity"),
  settingFont: $("#settingFont"), settingTimestamps: $("#settingTimestamps"),
  settingTyping: $("#settingTyping"), settingReceipts: $("#settingReceipts"),
  settingEnterSend: $("#settingEnterSend"), settingAutoScroll: $("#settingAutoScroll"),
  settingSound: $("#settingSound"), settingNotify: $("#settingNotify"),
  settingMute: $("#settingMute"), exportTxt: $("#exportTxt"),
  exportJson: $("#exportJson"), clearCache: $("#clearCache"),
  resetSettings: $("#resetSettings"),
  aboutDialog: $("#aboutDialog"), closeAbout: $("#closeAbout"),
  lightbox: $("#lightbox"), lightboxImg: $("#lightboxImg"),
  lightboxClose: $("#lightboxClose"), lightboxDownload: $("#lightboxDownload"),
  shortcutsDialog: $("#shortcutsDialog"), closeShortcuts: $("#closeShortcuts"),
  toast: $("#toast"), fatal: $("#fatal"), fatalDetail: $("#fatalDetail")
};

let Y, WebsocketProvider, IndexeddbPersistence;
let booted = false;

const S = {
  profile: null, settings: null, room: null, doc: null, ws: null, idb: null,
  messages: null, profiles: null, images: null, reactions: null,
  awareness: null, status: "idle", synced: false, idbSynced: false,
  known: new Set(), rendered: false, forceScroll: false,
  replyTo: null, editing: null, typing: false, typingTimer: null,
  searchActive: false, searchMatches: [], searchIndex: -1,
  mentionIndex: -1, mentionMatches: [],
  systemNotices: [], lastRenderedDay: null,
  unreadAfter: null, observers: []
};

/* ====================== Utilities ====================== */
const uid = () => crypto.randomUUID?.() || `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
const safeColor = v => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : COLORS[0]);
const safeEmoji = v => (typeof v === "string" && [...v.trim()].length <= 4 ? v.trim() || "👤" : "👤");

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + amt, 0, 255);
  const g = clamp(((n >> 8) & 255) + amt, 0, 255);
  const b = clamp((n & 255) + amt, 0, 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const t = ts => timeFmt.format(new Date(ts));
const full = ts => fullFmt.format(new Date(ts));
const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

function dayLabel(ts) {
  const d = new Date(ts), now = new Date();
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : dateFmt.format(d);
}

function toast(msg, type = "info") {
  el.toast.textContent = msg;
  el.toast.classList.toggle("error", type === "error");
  el.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.remove("show"), type === "error" ? 4200 : 2600);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ====================== Image helpers ====================== */
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function compressImage(file, maxEdge, maxBytes, mime = "image/webp") {
  if (file.size > 12 * 1024 * 1024) throw new Error("Image is too large (max 12 MB before compression).");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let { width: w, height: h } = img;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    w = Math.round(w * scale); h = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);

    let q = 0.85;
    let data = canvas.toDataURL(mime, q);
    while (data.length * 0.75 > maxBytes && q > 0.35) {
      q -= 0.08;
      data = canvas.toDataURL(mime, q);
    }
    if (data.length * 0.75 > maxBytes) {
      // fall back to jpeg
      q = 0.8;
      data = canvas.toDataURL("image/jpeg", q);
      while (data.length * 0.75 > maxBytes && q > 0.3) {
        q -= 0.08;
        data = canvas.toDataURL("image/jpeg", q);
      }
    }
    if (data.length * 0.75 > maxBytes) throw new Error("Image is still too large after compression. Try a smaller image.");
    return { dataUrl: data, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressAvatar(file) {
  const { dataUrl } = await compressImage(file, AVATAR_SIZE, 40 * 1024, "image/webp");
  return dataUrl;
}

/* ====================== Profile & settings ====================== */
function defaultProfile() {
  return { id: uid(), name: "", avatarType: "emoji", emoji: EMOJI_AVATARS[0], color: COLORS[0], photo: null };
}

function loadProfile() {
  const fb = defaultProfile();
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!raw || typeof raw !== "object") return fb;
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : fb.id,
      name: typeof raw.name === "string" ? raw.name.slice(0, 20) : "",
      avatarType: ["emoji", "initial", "photo"].includes(raw.avatarType) ? raw.avatarType : "emoji",
      emoji: EMOJI_AVATARS.includes(raw.emoji) ? raw.emoji : fb.emoji,
      color: COLORS.includes(raw.color) ? raw.color : fb.color,
      photo: typeof raw.photo === "string" && raw.photo.startsWith("data:image/") ? raw.photo : null
    };
  } catch { return fb; }
}

function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(S.profile)); } catch {}
}

function defaultSettings() {
  return {
    density: "comfortable", font: "default", timestamps: false,
    typing: true, receipts: true, enterSend: true, autoScroll: true,
    sound: false, notify: false, mute: false
  };
}

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    return { ...defaultSettings(), ...(raw && typeof raw === "object" ? raw : {}) };
  } catch { return defaultSettings(); }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S.settings)); } catch {}
}

function applySettings() {
  document.body.dataset.density = S.settings.density;
  document.body.dataset.font = S.settings.font;
}

/* ====================== Avatar ====================== */
function paintAvatar(node, a) {
  const color = safeColor(a.color);
  const type = ["emoji", "initial", "photo"].includes(a.avatarType) ? a.avatarType : "emoji";
  node.style.setProperty("--avatar-color", color);
  node.classList.toggle("avatar-initial", type === "initial");
  node.classList.toggle("avatar-emoji", type === "emoji");
  node.classList.toggle("avatar-photo", type === "photo");

  if (type === "photo" && a.photo) {
    node.style.background = "#0a0a0c";
    node.innerHTML = `<img src="${a.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`;
  } else if (type === "initial") {
    const initial = [...String(a.name || "?")][0] || "?";
    node.textContent = initial.toUpperCase();
    node.style.background = `linear-gradient(145deg,${color},${shade(color, -42)})`;
  } else {
    node.textContent = safeEmoji(a.emoji);
    node.style.background = `radial-gradient(circle at 30% 22%,${rgba(color, 0.34)},rgba(255,255,255,.035) 68%)`;
  }
  node.style.borderColor = rgba(color, 0.34);
}

function refreshAvatarPicker() {
  const mode = S.profile.avatarType;
  el.emojiPanel.classList.toggle("hidden", mode !== "emoji");
  el.initialPanel.classList.toggle("hidden", mode !== "initial");
  el.photoPanel.classList.toggle("hidden", mode !== "photo");
  [["emoji", el.tabEmoji], ["initial", el.tabInitial], ["photo", el.tabPhoto]].forEach(([m, b]) => b.setAttribute("aria-selected", String(mode === m)));

  $$(".emoji-choice", el.emojiPanel).forEach(b => b.setAttribute("aria-pressed", String(mode === "emoji" && b.dataset.emoji === S.profile.emoji)));
  $$(".color-choice", el.initialPanel).forEach(b => b.setAttribute("aria-pressed", String(mode === "initial" && b.dataset.color === S.profile.color)));
  paintAvatar(el.avatarPreview, { ...S.profile, name: S.profile.name || "?" });
}

function buildAvatarPicker() {
  EMOJI_AVATARS.forEach(e => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "emoji-choice"; b.textContent = e;
    b.dataset.emoji = e; b.setAttribute("aria-label", `Use ${e} avatar`); b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { S.profile.emoji = e; S.profile.avatarType = "emoji"; refreshAvatarPicker(); });
    el.emojiPanel.append(b);
  });
  COLORS.forEach(c => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "color-choice"; b.style.setProperty("--c", c);
    b.dataset.color = c; b.setAttribute("aria-label", `Use ${c} initial avatar`); b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { S.profile.color = c; S.profile.avatarType = "initial"; refreshAvatarPicker(); });
    el.initialPanel.append(b);
  });
  el.tabEmoji.addEventListener("click", () => { S.profile.avatarType = "emoji"; refreshAvatarPicker(); });
  el.tabInitial.addEventListener("click", () => { S.profile.avatarType = "initial"; refreshAvatarPicker(); });
  el.tabPhoto.addEventListener("click", () => { S.profile.avatarType = "photo"; refreshAvatarPicker(); });
  el.photoInput.addEventListener("change", async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      S.profile.photo = await compressAvatar(f);
      S.profile.avatarType = "photo";
      refreshAvatarPicker();
      toast("Photo ready.");
    } catch (err) { toast(err.message || "Could not process that image.", "error"); }
    e.target.value = "";
  });
  el.removePhoto.addEventListener("click", () => {
    S.profile.photo = null;
    S.profile.avatarType = "emoji";
    refreshAvatarPicker();
  });
  el.username.addEventListener("input", () => {
    if (S.profile.avatarType === "initial") paintAvatar(el.avatarPreview, { ...S.profile, name: el.username.value || "?" });
  });
}

/* ====================== Presence ====================== */
function getOnline() {
  if (!S.awareness) return [];
  const map = new Map();
  for (const st of S.awareness.getStates().values()) {
    const u = st?.user;
    if (!u?.id || !u.name) continue;
    const p = S.profiles?.get(u.id);
    const prof = p && typeof p === "object" ? p : {};
    const norm = {
      id: u.id, name: String(prof.name || u.name).slice(0, 20),
      avatarType: prof.avatarType || "emoji", emoji: prof.emoji, color: prof.color,
      photo: prof.photo, typing: !!u.typing
    };
    if (!map.has(norm.id)) map.set(norm.id, norm);
    else if (norm.typing) map.get(norm.id).typing = true;
  }
  return [...map.values()].sort((a, b) => a.id === S.profile.id ? -1 : b.id === S.profile.id ? 1 : a.name.localeCompare(b.name));
}

function renderOnline() {
  const users = getOnline();
  const n = users.length;
  [el.desktopOnlineCount, el.mobileOnlineCount, el.popoverOnlineCount].forEach(x => x.textContent = n);
  const paint = (container) => {
    container.replaceChildren();
    if (!users.length) { const d = document.createElement("div"); d.className = "online-empty"; d.textContent = "Connecting…"; container.append(d); return; }
    users.forEach(u => {
      const row = document.createElement("div"); row.className = "online-user"; row.setAttribute("role", "listitem");
      const av = document.createElement("span"); av.className = "avatar"; paintAvatar(av, u);
      const name = document.createElement("span"); name.className = "online-name"; name.textContent = u.name;
      if (u.id === S.profile.id) { const y = document.createElement("span"); y.className = "you-badge"; y.textContent = "you"; name.append(y); }
      const dot = document.createElement("span"); dot.className = "presence-dot"; dot.title = "Online";
      row.append(av, name, dot); container.append(row);
    });
  };
  paint(el.onlineListDesktop); paint(el.onlineListMobile);
}

function setTyping(v) {
  if (!S.awareness || S.typing === v) return;
  S.typing = v;
  const cur = S.awareness.getLocalState()?.user;
  if (cur) S.awareness.setLocalStateField("user", { ...cur, typing: v });
}

function renderTyping() {
  if (!S.settings.typing) { el.typingBar.classList.add("hidden"); return; }
  const typers = getOnline().filter(u => u.id !== S.profile.id && u.typing);
  if (!typers.length) { el.typingBar.classList.add("hidden"); el.typingText.textContent = ""; return; }
  el.typingText.textContent = typers.length === 1 ? `${typers[0].name} is typing` : typers.length === 2 ? `${typers[0].name} and ${typers[1].name} are typing` : "Several people are typing";
  el.typingBar.classList.remove("hidden");
}

/* ====================== Messages ====================== */
function normMsg(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.deleted) return { ...raw, text: "", deleted: true };
  const text = typeof raw.text === "string" ? raw.text.slice(0, MAX_TEXT) : "";
  const hasImage = typeof raw.imageId === "string" && raw.imageId;
  if (!text.trim() && !hasImage) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    senderId: typeof raw.senderId === "string" ? raw.senderId : "",
    senderName: String(raw.senderName || "Unknown").slice(0, 40),
    avatarType: ["emoji", "initial", "photo"].includes(raw.avatarType) ? raw.avatarType : "emoji",
    emoji: safeEmoji(raw.emoji), color: safeColor(raw.color), photo: raw.photo || null,
    text, ts: Number(raw.ts) || Date.now(),
    imageId: raw.imageId || null, imageWidth: raw.imageWidth || 0, imageHeight: raw.imageHeight || 0,
    replyTo: raw.replyTo && raw.replyTo.text ? {
      id: String(raw.replyTo.id || ""), senderId: String(raw.replyTo.senderId || ""),
      senderName: String(raw.replyTo.senderName || "Unknown").slice(0, 40),
      text: String(raw.replyTo.text).slice(0, 1000)
    } : null,
    editedAt: raw.editedAt || null, deleted: false
  };
}

function getMessages() {
  if (!S.messages) return [];
  return S.messages.toArray().map(normMsg).filter(Boolean).sort((a, b) => a.ts - b.ts || String(a.id).localeCompare(String(b.id)));
}

function getImage(id) {
  if (!S.images || !id) return null;
  const v = S.images.get(id);
  return typeof v === "string" && v.startsWith("data:image/") ? v : null;
}

function linkify(text) {
  const urlRe = /(https?:\/\/[^\s<]+)/g;
  return escapeHtml(text).replace(urlRe, u => {
    const safe = u.replace(/&amp;/g, "&");
    return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${u}</a>`;
  });
}

function highlightMentions(html, text) {
  if (!S.profiles) return html;
  const names = new Set(getOnline().map(u => u.name));
  if (!names.size) return html;
  let out = html;
  names.forEach(n => {
    const re = new RegExp(`@${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    out = out.replace(re, m => `<span class="mention">${m}</span>`);
  });
  return out;
}

function renderText(text) { return highlightMentions(linkify(text), text); }

function buildTicks(read) {
  return read
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m2 12.5 4.5 4.5L16 7.5"/><path d="m10.5 17 2 2L23 8.5"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 4.5 4.5L19 7.5"/></svg>`;
}

function replyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`;
}

function buildReactions(msgId) {
  if (!S.reactions) return null;
  const data = S.reactions.get(msgId);
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, arr]) => Array.isArray(arr) && arr.length);
  if (!entries.length) return null;
  const bar = document.createElement("div"); bar.className = "reaction-bar";
  entries.forEach(([emoji, users]) => {
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = `reaction-chip${users.includes(S.profile.id) ? " mine" : ""}`;
    btn.textContent = `${emoji} ${users.length}`;
    btn.title = users.map(id => getOnline().find(u => u.id === id)?.name || "someone").join(", ");
    btn.addEventListener("click", e => { e.stopPropagation(); toggleReaction(msgId, emoji); });
    bar.append(btn);
  });
  return bar;
}

function buildMessageEl(m, own, isNew, grouped) {
  const row = document.createElement("div");
  row.className = `msg${own ? " own" : ""}${isNew ? " is-new" : ""}${grouped ? " grouped" : ""}`;
  row.dataset.id = m.id;

  const avatar = document.createElement("span"); avatar.className = "avatar msg-avatar"; paintAvatar(avatar, m);

  const content = document.createElement("div"); content.className = "msg-content";
  const top = document.createElement("div"); top.className = "msg-topline";
  const sender = document.createElement("span"); sender.className = "sender"; sender.textContent = own ? "You" : m.senderName;
  top.append(sender);

  const wrap = document.createElement("div"); wrap.className = "bubble-wrap";
  const bubble = document.createElement("div"); bubble.className = `bubble${m.deleted ? " deleted" : ""}`; bubble.tabIndex = 0;

  if (m.replyTo) {
    const q = document.createElement("div"); q.className = "reply-quote";
    const qn = document.createElement("span"); qn.className = "reply-quote-name";
    qn.textContent = m.replyTo.senderId === S.profile.id ? "You" : m.replyTo.senderName;
    const qt = document.createElement("span"); qt.className = "reply-quote-text"; qt.textContent = m.replyTo.text;
    q.append(qn, qt); q.addEventListener("click", e => { e.stopPropagation(); scrollToMessage(m.replyTo.id); });
    bubble.append(q);
  }

  if (m.imageId) {
    const src = getImage(m.imageId);
    if (src) {
      const img = document.createElement("img"); img.className = "bubble-image"; img.src = src; img.alt = "Shared image"; img.loading = "lazy";
      if (m.imageWidth && m.imageHeight) { img.width = m.imageWidth; img.height = m.imageHeight; img.style.aspectRatio = `${m.imageWidth}/${m.imageHeight}`; }
      img.addEventListener("click", e => { e.stopPropagation(); openLightbox(src); });
      bubble.append(img);
    }
  }

  if (m.text) {
    const txt = document.createElement("div"); txt.className = "message-text";
    txt.innerHTML = m.deleted ? "This message was deleted" : renderText(m.text);
    bubble.append(txt);
  }

  const meta = document.createElement("div"); meta.className = "bubble-meta";
  const time = document.createElement("time"); time.dateTime = new Date(m.ts).toISOString(); time.title = full(m.ts); time.textContent = t(m.ts);
  if (S.settings.timestamps || own) meta.append(time);
  else { meta.append(time); time.style.opacity = "0"; }
  if (m.editedAt && !m.deleted) { const ed = document.createElement("span"); ed.className = "edited-tag"; ed.textContent = "edited"; meta.append(ed); }
  if (own && !m.deleted && S.settings.receipts) {
    const read = getOnline().filter(u => u.id !== S.profile.id).length > 0;
    const ticks = document.createElement("span"); ticks.className = `ticks${read ? " is-read" : ""}`;
    ticks.innerHTML = buildTicks(read); ticks.title = read ? "Read" : "Sent"; meta.append(ticks);
  }
  bubble.append(meta); wrap.append(bubble);

  const actions = document.createElement("div"); actions.className = "msg-actions";
  const replyBtn = document.createElement("button"); replyBtn.type = "button"; replyBtn.className = "reply-action";
  replyBtn.innerHTML = `${replyIcon()}<span>Reply</span>`;
  replyBtn.addEventListener("click", e => { e.stopPropagation(); setReply(m); });
  actions.append(replyBtn);

  if (own && !m.deleted) {
    const editBtn = document.createElement("button"); editBtn.type = "button"; editBtn.className = "reply-action"; editBtn.textContent = "Edit";
    editBtn.addEventListener("click", e => { e.stopPropagation(); startEdit(m); });
    const delBtn = document.createElement("button"); delBtn.type = "button"; delBtn.className = "reply-action"; delBtn.textContent = "Delete";
    delBtn.addEventListener("click", e => { e.stopPropagation(); deleteMessage(m.id); });
    actions.append(editBtn, delBtn);
  }

  const reactBtn = document.createElement("button"); reactBtn.type = "button"; reactBtn.className = "reply-action"; reactBtn.textContent = "React";
  reactBtn.addEventListener("click", e => { e.stopPropagation(); showReactionPicker(reactBtn, m.id); });
  actions.append(reactBtn);

  bubble.addEventListener("click", e => { if (!e.target.closest("button,a")) row.classList.toggle("show-actions"); });
  bubble.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); row.classList.toggle("show-actions"); } });

  content.append(top, wrap, buildReactions(m.id) || document.createDocumentFragment(), actions);
  row.append(avatar, content);
  return row;
}

function scrollToMessage(id) {
  const node = el.messageList.querySelector(`.msg[data-id="${CSS.escape(id)}"]`);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.add("highlight");
  setTimeout(() => node.classList.remove("highlight"), 1500);
}

function isNearBottom() {
  const l = el.messageList;
  return l.scrollHeight - l.scrollTop - l.clientHeight < 140;
}

function scrollBottom(instant = false) {
  el.messageList.scrollTo({ top: el.messageList.scrollHeight, behavior: instant ? "auto" : "smooth" });
}

function updateJump() {
  const has = el.messageList.querySelector(".msg") !== null;
  const d = el.messageList.scrollHeight - el.messageList.scrollTop - el.messageList.clientHeight;
  el.jumpLatest.classList.toggle("hidden", !has || d <= 120);
}

function updateEmpty(n) {
  el.emptyState.classList.toggle("hidden", n > 0 || S.systemNotices.length > 0);
  if (n > 0) return;
  if (!S.synced) { el.emptyTitle.textContent = "Opening the room…"; el.emptySub.textContent = "Syncing messages through the public relay."; }
  else { el.emptyTitle.textContent = "This room is quiet."; el.emptySub.textContent = "Send the first message and break the silence."; }
}

function renderMessages({ forceBottom = false, instant = false } = {}) {
  if (!S.messages) return;
  const msgs = getMessages();
  const stick = forceBottom || isNearBottom();
  const frag = document.createDocumentFragment();
  let prevDay = null, prevSender = null, prevTs = 0;
  const unreadTs = getLastRead();

  for (const m of msgs) {
    const dk = dayKey(m.ts);
    if (dk !== prevDay) { frag.append(buildDateSep(m.ts)); prevDay = dk; prevSender = null; }
    if (unreadTs && m.ts > unreadTs && !S.unreadAfter) {
      const div = document.createElement("div"); div.className = "unread-divider"; div.textContent = "New messages";
      frag.append(div); S.unreadAfter = m.id;
    }
    const grouped = !m.replyTo && prevSender === m.senderId && m.ts - prevTs < 120000 && !m.imageId;
    const isNew = S.rendered && !S.known.has(m.id);
    frag.append(buildMessageEl(m, m.senderId === S.profile.id, isNew, grouped));
    S.known.add(m.id); prevSender = m.senderId; prevTs = m.ts;
  }

  // system notices (local only)
  S.systemNotices.forEach(n => {
    const d = document.createElement("div"); d.className = "system-notice"; d.textContent = n.text; frag.append(d);
  });

  el.messageList.replaceChildren(frag);
  S.rendered = true; updateEmpty(msgs.length);
  if (stick) requestAnimationFrame(() => scrollBottom(instant));
  requestAnimationFrame(updateJump);
}

function buildDateSep(ts) {
  const d = document.createElement("div"); d.className = "date-sep"; d.setAttribute("role", "separator");
  const s = document.createElement("span"); s.textContent = dayLabel(ts); d.append(s); return d;
}

function updateAllTicks() {
  const read = getOnline().filter(u => u.id !== S.profile.id).length > 0;
  el.messageList.querySelectorAll(".msg.own .ticks").forEach(n => {
    n.classList.toggle("is-read", read); n.innerHTML = buildTicks(read); n.title = read ? "Read" : "Sent";
  });
}

/* ====================== Reactions ====================== */
function showReactionPicker(anchor, msgId) {
  $$(".reaction-picker").forEach(p => p.remove());
  const pop = document.createElement("div"); pop.className = "reaction-picker";
  REACTION_EMOJIS.forEach(e => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = e;
    b.addEventListener("click", ev => { ev.stopPropagation(); toggleReaction(msgId, e); pop.remove(); });
    pop.append(b);
  });
  anchor.parentElement.append(pop);
  setTimeout(() => document.addEventListener("click", () => pop.remove(), { once: true }), 0);
}

function toggleReaction(msgId, emoji) {
  if (!S.reactions) return;
  const cur = S.reactions.get(msgId);
  const data = cur && typeof cur === "object" ? structuredClone(cur) : {};
  const arr = Array.isArray(data[emoji]) ? data[emoji] : [];
  const idx = arr.indexOf(S.profile.id);
  if (idx >= 0) arr.splice(idx, 1); else arr.push(S.profile.id);
  if (arr.length) data[emoji] = arr; else delete data[emoji];
  if (Object.keys(data).length) S.reactions.set(msgId, data); else S.reactions.delete(msgId);
  S.forceScroll = false;
  renderMessages();
}

/* ====================== Reply / edit ====================== */
function setReply(m) {
  S.replyTo = { id: m.id, senderId: m.senderId, senderName: m.senderName, text: m.text || "[image]" };
  el.replyName.textContent = m.senderId === S.profile.id ? "You" : m.senderName;
  el.replyText.textContent = S.replyTo.text.replace(/\s+/g, " ").slice(0, 140);
  el.replyPreview.classList.remove("hidden");
  el.messageInput.focus();
}

function clearReply() {
  S.replyTo = null; el.replyPreview.classList.add("hidden");
  el.replyName.textContent = ""; el.replyText.textContent = "";
}

function startEdit(m) {
  if (!m || m.senderId !== S.profile.id) return;
  S.editing = m.id;
  el.messageInput.value = m.text;
  el.editText.textContent = m.text.replace(/\s+/g, " ").slice(0, 140);
  el.editBar.classList.remove("hidden");
  resizeInput(); updateSendState(); el.messageInput.focus();
}

function cancelEdit() {
  S.editing = null; el.editBar.classList.add("hidden");
  el.messageInput.value = ""; resizeInput(); updateSendState();
}

function deleteMessage(id) {
  const arr = S.messages.toArray();
  const idx = arr.findIndex(x => x?.id === id);
  if (idx < 0) return;
  const msg = arr[idx];
  if (msg.senderId !== S.profile.id) return;
  S.messages.delete(idx, 1);
  S.messages.insert(idx, [{ ...msg, deleted: true, text: "" }]);
  toast("Message deleted.");
}

/* ====================== Composer ====================== */
function resizeInput() {
  const i = el.messageInput;
  i.style.height = "auto";
  const h = Math.min(i.scrollHeight, 116);
  i.style.height = `${h}px`;
  i.style.overflowY = i.scrollHeight > 116 ? "auto" : "hidden";
}

function updateSend() {
  const v = el.messageInput.value;
  el.sendBtn.disabled = !v.trim().length && !S.editing;
  el.charCount.textContent = v.length > 1800 ? `${v.length}/2000` : "";
}

function onInput() {
  updateSend(); resizeInput();
  const has = el.messageInput.value.trim().length > 0;
  if (has) { setTyping(true); clearTimeout(S.typingTimer); S.typingTimer = setTimeout(() => setTyping(false), 1500); }
  else { setTyping(false); clearTimeout(S.typingTimer); }
  updateMentionDropdown();
}

function send() {
  const text = el.messageInput.value.trim();
  if (!S.messages) return;
  if (!text && !S.editing) return;

  if (S.editing) {
    const arr = S.messages.toArray();
    const idx = arr.findIndex(x => x?.id === S.editing);
    if (idx >= 0) {
      const old = arr[idx];
      S.messages.delete(idx, 1);
      S.messages.insert(idx, [{ ...old, text, editedAt: Date.now() }]);
    }
    cancelEdit(); return;
  }

  const msg = {
    id: uid(), senderId: S.profile.id, senderName: S.profile.name,
    avatarType: S.profile.avatarType, emoji: S.profile.emoji,
    color: S.profile.color, photo: S.profile.photo,
    text, ts: Date.now(), replyTo: S.replyTo ? { ...S.replyTo } : null
  };
  S.forceScroll = true;
  try { S.messages.push([msg]); } catch { toast("Could not send. Try again.", "error"); return; }
  el.messageInput.value = ""; resizeInput(); updateSend(); clearReply();
  clearTimeout(S.typingTimer); setTyping(false); el.messageInput.focus();
  maybeNotify(msg);
}

async function attachImage(file) {
  if (!file || !file.type.startsWith("image/")) { toast("Please choose an image.", "error"); return; }
  try {
    toast("Compressing image…");
    const { dataUrl, width, height } = await compressImage(file, IMAGE_MAX_EDGE, MAX_IMAGE_BYTES);
    const id = uid();
    S.images.set(id, dataUrl);
    const msg = {
      id: uid(), senderId: S.profile.id, senderName: S.profile.name,
      avatarType: S.profile.avatarType, emoji: S.profile.emoji,
      color: S.profile.color, photo: S.profile.photo,
      text: el.messageInput.value.trim(), ts: Date.now(),
      imageId: id, imageWidth: width, imageHeight: height,
      replyTo: S.replyTo ? { ...S.replyTo } : null
    };
    S.forceScroll = true;
    S.messages.push([msg]);
    el.messageInput.value = ""; resizeInput(); updateSend(); clearReply();
    toast("Image sent.");
    maybeNotify(msg);
  } catch (err) { toast(err.message || "Could not send that image.", "error"); }
}

function insertEmoji(e) {
  const i = el.messageInput, s = i.selectionStart ?? i.value.length, en = i.selectionEnd ?? s;
  i.setRangeText(e, s, en, "end");
  i.dispatchEvent(new Event("input", { bubbles: true })); i.focus();
}

function toggleEmoji() {
  const hidden = el.emojiPicker.classList.contains("hidden");
  el.emojiPicker.classList.toggle("hidden", !hidden);
  el.emojiBtn.setAttribute("aria-expanded", String(hidden));
  if (hidden) el.mentionDropdown.classList.add("hidden");
}

function closeEmoji() { el.emojiPicker.classList.add("hidden"); el.emojiBtn.setAttribute("aria-expanded", "false"); }

/* ====================== Mentions ====================== */
function updateMentionDropdown() {
  const input = el.messageInput;
  const val = input.value;
  const caret = input.selectionStart ?? val.length;
  const before = val.slice(0, caret);
  const match = before.match(/@(\w*)$/);
  if (!match) { el.mentionDropdown.classList.add("hidden"); return; }
  const q = match[1].toLowerCase();
  const users = getOnline().filter(u => u.id !== S.profile.id && u.name.toLowerCase().startsWith(q));
  if (!users.length) { el.mentionDropdown.classList.add("hidden"); return; }
  S.mentionMatches = users; S.mentionIndex = 0;
  el.mentionDropdown.replaceChildren();
  users.forEach((u, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = `mention-item${i === 0 ? " active" : ""}`;
    const av = document.createElement("span"); av.className = "avatar"; paintAvatar(av, u);
    const n = document.createElement("span"); n.textContent = u.name;
    b.append(av, n);
    b.addEventListener("click", () => pickMention(u));
    el.mentionDropdown.append(b);
  });
  el.mentionDropdown.classList.remove("hidden");
}

function pickMention(u) {
  const input = el.messageInput;
  const val = input.value;
  const caret = input.selectionStart ?? val.length;
  const before = val.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return;
  const next = val.slice(0, at) + `@${u.name} ` + val.slice(caret);
  input.value = next;
  const pos = at + u.name.length + 2;
  input.setSelectionRange(pos, pos);
  el.mentionDropdown.classList.add("hidden");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

function moveMention(dir) {
  if (el.mentionDropdown.classList.contains("hidden")) return false;
  const items = $$(".mention-item", el.mentionDropdown);
  if (!items.length) return false;
  S.mentionIndex = (S.mentionIndex + dir + items.length) % items.length;
  items.forEach((b, i) => b.classList.toggle("active", i === S.mentionIndex));
  return true;
}

/* ====================== Search ====================== */
function openSearch() {
  el.searchBar.classList.remove("hidden");
  el.searchInput.focus();
  el.searchInput.select();
  S.searchActive = true;
}

function closeSearch() {
  el.searchBar.classList.add("hidden");
  S.searchActive = false; S.searchMatches = []; S.searchIndex = -1;
  el.searchCount.textContent = "";
  renderMessages({ forceBottom: false });
}

function runSearch(q) {
  S.searchMatches = []; S.searchIndex = -1;
  const term = q.trim().toLowerCase();
  if (!term || !S.messages) { el.searchCount.textContent = ""; renderMessages(); return; }
  const msgs = getMessages();
  msgs.forEach(m => { if (m.text && m.text.toLowerCase().includes(term)) S.searchMatches.push(m.id); });
  el.searchCount.textContent = S.searchMatches.length ? `${S.searchIndex + 1}/${S.searchMatches.length}` : "0";
  renderMessages();
  if (S.searchMatches.length) { S.searchIndex = 0; focusMatch(); }
}

function focusMatch() {
  $$(".msg.highlight").forEach(n => n.classList.remove("highlight"));
  const id = S.searchMatches[S.searchIndex];
  const node = el.messageList.querySelector(`.msg[data-id="${CSS.escape(id)}"]`);
  if (node) { node.scrollIntoView({ behavior: "smooth", block: "center" }); node.classList.add("highlight"); }
  el.searchCount.textContent = `${S.searchIndex + 1}/${S.searchMatches.length}`;
}

function stepSearch(d) {
  if (!S.searchMatches.length) return;
  S.searchIndex = (S.searchIndex + d + S.searchMatches.length) % S.searchMatches.length;
  focusMatch();
}

/* ====================== Lightbox ====================== */
function openLightbox(src) {
  el.lightboxImg.src = src;
  el.lightboxDownload.href = src;
  el.lightbox.classList.remove("hidden");
  el.lightboxClose.focus();
}
function closeLightbox() { el.lightbox.classList.add("hidden"); el.lightboxImg.src = ""; }

/* ====================== Notifications ====================== */
function soundPing() {
  if (!S.settings.sound || S.settings.mute) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.start(); o.stop(ctx.currentTime + 0.2);
  } catch {}
}

function maybeNotify(msg) {
  if (msg.senderId === S.profile.id || S.settings.mute) return;
  soundPing();
  if (S.settings.notify && document.visibilityState === "hidden" && Notification.permission === "granted") {
    const body = msg.text || "Sent an image";
    try { new Notification(`${msg.senderName} in #${S.room}`, { body, silent: true }); } catch {}
  }
  if (document.visibilityState === "hidden") {
    const unread = getMessages().filter(m => m.ts > (getLastRead() || 0)).length;
    document.title = `(${unread}) #${S.room} · MD Chat`;
  }
}

/* ====================== Read state ====================== */
function getLastRead() { try { return Number(localStorage.getItem(READ_KEY + S.room)) || 0; } catch { return 0; } }
function markRead() {
  if (!S.room) return;
  try { localStorage.setItem(READ_KEY + S.room, String(Date.now())); } catch {}
  document.title = S.room ? `#${S.room} · MD Chat` : "MD Chat — Real-time rooms";
}

/* ====================== Connection ====================== */
function setStatus(st) {
  S.status = st;
  const label = { connected: "Live", connecting: "Connecting…", disconnected: "Reconnecting…", idle: "Offline" }[st] || "Offline";
  el.topbarStatusText.textContent = label; el.sidebarStatusText.textContent = label;
  el.topbarStatusDot.className = `status-dot ${st}`; el.sidebarStatusDot.className = `status-dot ${st}`;
  if (st === "connected") el.connectionBanner.classList.add("hidden");
  else { el.connectionBanner.classList.remove("hidden"); el.bannerText.textContent = st === "connecting" ? "Connecting to the room…" : "Connection lost. Trying to reconnect…"; }
}

function onStatus({ status }) { setStatus(status); }

function onSync(ok) {
  if (!ok) return;
  S.synced = true;
  renderMessages({ forceBottom: true, instant: true });
}

function onMessages() { renderMessages({ forceBottom: S.forceScroll || isNearBottom() }); S.forceScroll = false; }

/* ====================== Room lifecycle ====================== */
function labels() {
  el.topbarRoom.textContent = S.room || "room";
  el.sidebarRoom.textContent = S.room || "—";
  document.title = S.room ? `#${S.room} · MD Chat` : "MD Chat — Real-time rooms";
}

function enterRoom(room) {
  if (S.room) cleanup();
  S.room = room; S.synced = false; S.idbSynced = false; S.known.clear(); S.rendered = false;
  S.replyTo = null; S.editing = null; S.searchActive = false; S.unreadAfter = null;
  S.systemNotices = [];

  S.doc = new Y.Doc();
  S.messages = S.doc.getArray("messages");
  S.profiles = S.doc.getMap("profiles");
  S.images = S.doc.getMap("images");
  S.reactions = S.doc.getMap("reactions");

  // local persistence
  S.idb = new IndexeddbPersistence(room, S.doc);
  S.idb.on("synced", () => { S.idbSynced = true; renderMessages({ forceBottom: true, instant: true }); });

  // websocket
  S.ws = new WebsocketProvider(RELAY, room, S.doc, { connect: true });
  S.awareness = S.ws.awareness;
  S.awareness.setLocalStateField("user", { id: S.profile.id, name: S.profile.name, typing: false });

  // write profile to shared map
  S.profiles.set(S.profile.id, {
    name: S.profile.name, avatarType: S.profile.avatarType,
    emoji: S.profile.emoji, color: S.profile.color, photo: S.profile.photo
  });

  const obs = () => { renderOnline(); renderTyping(); updateAllTicks(); };
  S.observers.push(() => S.messages.unobserve(onMessages));
  S.messages.observe(onMessages);
  S.awareness.on("change", obs);
  S.observers.push(() => S.awareness.off("change", obs));
  S.ws.on("status", onStatus);
  S.ws.on("sync", onSync);

  labels(); setStatus("connecting"); renderOnline(); renderTyping();
  renderMessages({ forceBottom: true, instant: true });

  el.landing.classList.add("hidden"); el.chat.classList.remove("hidden");
  document.body.classList.add("in-chat");

  requestAnimationFrame(() => { resizeInput(); updateSend(); el.messageInput.focus(); });
  history.replaceState(null, "", `?room=${encodeURIComponent(room)}`);
}

function cleanup() {
  clearTimeout(S.typingTimer);
  S.observers.forEach(fn => { try { fn(); } catch {} }); S.observers = [];
  try { S.awareness?.setLocalState(null); } catch {}
  try { S.ws?.destroy(); } catch {}
  try { S.idb?.destroy(); } catch {}
  try { S.doc?.destroy(); } catch {}
  S.doc = S.ws = S.idb = S.messages = S.profiles = S.images = S.reactions = S.awareness = null;
  S.room = null; S.synced = false; S.idbSynced = false; S.known.clear(); S.rendered = false;
  S.replyTo = null; S.editing = null; S.typing = false; S.systemNotices = []; S.unreadAfter = null;
}

function leave() {
  if (!S.room) return;
  cleanup();
  el.chat.classList.add("hidden"); el.landing.classList.remove("hidden");
  document.body.classList.remove("in-chat");
  el.messageList.replaceChildren(); el.emptyState.classList.remove("hidden");
  el.typingBar.classList.add("hidden"); el.jumpLatest.classList.add("hidden");
  el.peoplePopover.classList.add("hidden"); closeEmoji(); clearReply(); cancelEdit();
  el.messageInput.value = ""; resizeInput(); updateSend();
  document.title = "MD Chat — Real-time rooms";
  try { el.roomName.value = localStorage.getItem(LAST_ROOM_KEY) || ""; } catch {}
  history.replaceState(null, "", location.pathname);
  toast("You left the room.");
  requestAnimationFrame(() => el.username.focus());
}

/* ====================== Modal helpers ====================== */
function openDlg(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
function closeDlg(d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }

/* ====================== Settings UI ====================== */
function fillSettings() {
  el.settingName.value = S.profile.name;
  el.settingDensity.value = S.settings.density;
  el.settingFont.value = S.settings.font;
  el.settingTimestamps.checked = S.settings.timestamps;
  el.settingTyping.checked = S.settings.typing;
  el.settingReceipts.checked = S.settings.receipts;
  el.settingEnterSend.checked = S.settings.enterSend;
  el.settingAutoScroll.checked = S.settings.autoScroll;
  el.settingSound.checked = S.settings.sound;
  el.settingNotify.checked = S.settings.notify;
  el.settingMute.checked = S.settings.mute;
}

function bindSetting(id, key, isCheck = true) {
  el[id]?.addEventListener("change", () => {
    S.settings[key] = isCheck ? el[id].checked : el[id].value;
    saveSettings(); applySettings();
    if (key === "typing") renderTyping();
    if (key === "receipts") updateAllTicks();
    if (key === "notify" && el[id].checked) requestNotifyPermission();
  });
}

async function requestNotifyPermission() {
  if (!("Notification" in window)) { toast("Notifications are not supported here.", "error"); return; }
  if (Notification.permission === "granted") return;
  const p = await Notification.requestPermission();
  if (p !== "granted") { S.settings.notify = false; saveSettings(); fillSettings(); toast("Notifications were not enabled."); }
}

function exportTranscript(format) {
  if (!S.messages) return;
  const msgs = getMessages();
  let out, mime, ext;
  if (format === "json") {
    out = JSON.stringify({ room: S.room, exported: new Date().toISOString(), messages: msgs }, null, 2);
    mime = "application/json"; ext = "json";
  } else {
    out = msgs.map(m => `[${full(m.ts)}] ${m.senderName}: ${m.deleted ? "[deleted]" : m.text}${m.imageId ? " [image]" : ""}`).join("\n");
    mime = "text/plain"; ext = "txt";
  }
  const blob = new Blob([out], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `mdchat-${S.room}-${Date.now()}.${ext}`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exported .${ext}`);
}

/* ====================== Keyboard ====================== */
function onKey(e) {
  const tag = e.target.tagName;
  const typing = tag === "INPUT" || tag === "TEXTAREA";

  if (e.key === "?" && !typing) { e.preventDefault(); openDlg(el.shortcutsDialog); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); return; }

  if (e.key === "Escape") {
    if (!el.lightbox.classList.contains("hidden")) { closeLightbox(); return; }
    if (!el.emojiPicker.classList.contains("hidden")) { closeEmoji(); return; }
    if (!el.peoplePopover.classList.contains("hidden")) { el.peoplePopover.classList.add("hidden"); el.peopleBtn.setAttribute("aria-expanded", "false"); return; }
    if (!el.mentionDropdown.classList.contains("hidden")) { el.mentionDropdown.classList.add("hidden"); return; }
    if (S.replyTo) { clearReply(); return; }
    if (S.editing) { cancelEdit(); return; }
  }

  if (typing) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      if (!el.mentionDropdown.classList.contains("hidden")) { e.preventDefault(); pickMention(S.mentionMatches[S.mentionIndex]); return; }
      if (S.settings.enterSend) { e.preventDefault(); send(); }
    }
    if (e.key === "ArrowDown" && moveMention(1)) { e.preventDefault(); return; }
    if (e.key === "ArrowUp" && moveMention(-1)) { e.preventDefault(); return; }
    return;
  }

  if (e.key === "ArrowUp") {
    const msgs = getMessages().filter(m => m.senderId === S.profile.id && !m.deleted);
    if (msgs.length) { e.preventDefault(); startEdit(msgs[msgs.length - 1]); }
  }
  if (e.key.toLowerCase() === "r") {
    const msgs = getMessages();
    if (msgs.length) { e.preventDefault(); setReply(msgs[msgs.length - 1]); }
  }
}

/* ====================== Boot ====================== */
function prefill() {
  S.profile = loadProfile(); S.settings = loadSettings();
  applySettings();
  el.username.value = S.profile.name || "";
  let room = ""; try { room = localStorage.getItem(LAST_ROOM_KEY) || ""; } catch {}
  try { const q = new URLSearchParams(location.search).get("room"); if (q) room = q.slice(0, 30); } catch {}
  el.roomName.value = room;
  buildAvatarPicker(); refreshAvatarPicker(); updateSend(); resizeInput();
  (S.profile.name ? el.roomName : el.username).focus();
}

function wire() {
  el.joinForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = el.username.value.trim(), room = el.roomName.value.trim().toLowerCase();
    const nameErr = !name ? "Choose a username." : name.length < 2 ? "Use at least 2 characters." : /\s/.test(name) ? "No spaces." : "";
    const roomErr = !/^[A-Za-z0-9-]{3,30}$/.test(room) ? "Use 3–30 letters, numbers, or hyphens." : "";
    el.usernameError.textContent = nameErr; el.username.setAttribute("aria-invalid", String(!!nameErr));
    el.roomError.textContent = roomErr; el.roomName.setAttribute("aria-invalid", String(!!roomErr));
    if (nameErr || roomErr) { (nameErr ? el.username : el.roomName).focus(); return; }
    S.profile.name = name; saveProfile();
    try { localStorage.setItem(LAST_ROOM_KEY, room); } catch {}
    enterRoom(room);
  });

  el.username.addEventListener("input", () => { if (el.username.getAttribute("aria-invalid") === "true") el.usernameError.textContent = ""; });
  el.roomName.addEventListener("input", () => { if (el.roomName.getAttribute("aria-invalid") === "true") el.roomError.textContent = ""; });

  [el.landingAbout, el.aboutBtn, el.popoverAbout].forEach(b => b?.addEventListener("click", () => openDlg(el.aboutDialog)));
  el.closeAbout.addEventListener("click", () => closeDlg(el.aboutDialog));
  el.leaveBtn.addEventListener("click", leave); el.mobileLeave.addEventListener("click", leave); el.popoverLeave.addEventListener("click", leave);

  el.peopleBtn.addEventListener("click", () => {
    const h = el.peoplePopover.classList.contains("hidden");
    el.peoplePopover.classList.toggle("hidden", !h);
    el.peopleBtn.setAttribute("aria-expanded", String(h));
    if (h) renderOnline();
  });

  el.bannerRetry.addEventListener("click", () => { try { S.ws?.connect(); toast("Trying to reconnect…"); } catch { toast("Could not reconnect.", "error"); } });

  // Composer
  el.messageInput.addEventListener("input", onInput);
  el.messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      if (!el.mentionDropdown.classList.contains("hidden")) { e.preventDefault(); pickMention(S.mentionMatches[S.mentionIndex]); return; }
      if (S.settings.enterSend) { e.preventDefault(); send(); }
    }
  });
  el.messageInput.addEventListener("blur", () => { setTyping(false); clearTimeout(S.typingTimer); });
  el.sendBtn.addEventListener("click", send);
  el.cancelReply.addEventListener("click", clearReply); el.cancelEdit.addEventListener("click", cancelEdit);
  el.emojiBtn.addEventListener("click", toggleEmoji);
  el.attachBtn.addEventListener("click", () => el.imageInput.click());
  el.imageInput.addEventListener("change", e => { const f = e.target.files?.[0]; if (f) attachImage(f); e.target.value = ""; });
  el.jumpLatest.addEventListener("click", () => scrollBottom(false));
  el.messageList.addEventListener("scroll", () => { requestAnimationFrame(updateJump); if (isNearBottom()) markRead(); });

  // Drag & drop images
  document.addEventListener("dragover", e => { if (e.dataTransfer?.types?.includes("Files")) e.preventDefault(); });
  document.addEventListener("drop", e => {
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith("image/")) { e.preventDefault(); attachImage(f); }
  });

  // Search
  el.searchBtn.addEventListener("click", openSearch);
  el.searchClose.addEventListener("click", closeSearch);
  el.searchInput.addEventListener("input", () => runSearch(el.searchInput.value));
  el.searchInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); stepSearch(e.shiftKey ? -1 : 1); } });
  el.searchPrev.addEventListener("click", () => stepSearch(-1));
  el.searchNext.addEventListener("click", () => stepSearch(1));

  // Settings
  [el.settingsBtn, el.topbarSettings, el.popoverSettings].forEach(b => b?.addEventListener("click", () => { fillSettings(); openDlg(el.settingsDialog); }));
  el.closeSettings.addEventListener("click", () => closeDlg(el.settingsDialog));
  el.settingName.addEventListener("change", () => {
    S.profile.name = el.settingName.value.trim().slice(0, 20) || S.profile.name;
    saveProfile();
    if (S.profiles) S.profiles.set(S.profile.id, { ...S.profiles.get(S.profile.id), name: S.profile.name });
    toast("Display name updated.");
  });
  el.settingAvatarBtn.addEventListener("click", () => { closeDlg(el.settingsDialog); el.landing.classList.remove("hidden"); el.chat.classList.add("hidden"); refreshAvatarPicker(); });
  el.resetProfile.addEventListener("click", () => {
    localStorage.removeItem(PROFILE_KEY); S.profile = defaultProfile(); saveProfile();
    el.username.value = ""; refreshAvatarPicker(); toast("Profile reset.");
  });
  el.settingDensity.addEventListener("change", () => { S.settings.density = el.settingDensity.value; saveSettings(); applySettings(); });
  el.settingFont.addEventListener("change", () => { S.settings.font = el.settingFont.value; saveSettings(); applySettings(); });
  bindSetting("settingTimestamps", "timestamps"); bindSetting("settingTyping", "typing");
  bindSetting("settingReceipts", "receipts"); bindSetting("settingEnterSend", "enterSend");
  bindSetting("settingAutoScroll", "autoScroll"); bindSetting("settingSound", "sound");
  bindSetting("settingNotify", "notify"); bindSetting("settingMute", "mute");
  el.exportTxt.addEventListener("click", () => exportTranscript("txt"));
  el.exportJson.addEventListener("click", () => exportTranscript("json"));
  el.clearCache.addEventListener("click", async () => {
    if (!S.room || !confirm("Clear the local cache for this room?")) return;
    try { await S.idb?.clearData(); toast("Local cache cleared."); } catch { toast("Could not clear cache.", "error"); }
  });
  el.resetSettings.addEventListener("click", () => {
    if (!confirm("Reset all settings?")) return;
    S.settings = defaultSettings(); saveSettings(); applySettings(); fillSettings(); toast("Settings reset.");
  });

  // Shortcuts
  el.closeShortcuts.addEventListener("click", () => closeDlg(el.shortcutsDialog));

  // Lightbox
  el.lightboxClose.addEventListener("click", closeLightbox);
  el.lightbox.addEventListener("click", e => { if (e.target === el.lightbox) closeLightbox(); });

  // Copy invite
  el.copyInviteBtn.addEventListener("click", async () => {
    if (!S.room) return;
    const link = `${location.origin}${location.pathname}?room=${encodeURIComponent(S.room)}`;
    try { await navigator.clipboard.writeText(link); toast("Invite link copied."); }
    catch { toast(link); }
  });

  // Global
  document.addEventListener("keydown", onKey);
  document.addEventListener("pointerdown", e => {
    if (!el.emojiPicker.classList.contains("hidden") && !el.emojiPicker.contains(e.target) && !el.emojiBtn.contains(e.target)) closeEmoji();
    if (!el.peoplePopover.classList.contains("hidden") && !el.peoplePopover.contains(e.target) && !el.peopleBtn.contains(e.target)) {
      el.peoplePopover.classList.add("hidden"); el.peopleBtn.setAttribute("aria-expanded", "false");
    }
    if (!el.mentionDropdown.classList.contains("hidden") && !el.mentionDropdown.contains(e.target) && !el.messageInput.contains(e.target)) el.mentionDropdown.classList.add("hidden");
  });
  [el.aboutDialog, el.settingsDialog, el.shortcutsDialog].forEach(d => d.addEventListener("click", e => {
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDlg(d);
  }));

  window.addEventListener("pagehide", () => { try { S.awareness?.setLocalState(null); } catch {} });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") markRead(); });
}

async function boot() {
  try {
    Y = await import("yjs");
    const wsMod = await import("y-websocket");
    const idbMod = await import("y-indexeddb");
    WebsocketProvider = wsMod.WebsocketProvider;
    IndexeddbPersistence = idbMod.IndexeddbPersistence;
    if (!WebsocketProvider || !IndexeddbPersistence) throw new Error("Providers missing");
    prefill(); wire(); booted = true;
  } catch (err) {
    console.error(err);
    el.fatal.classList.remove("hidden");
    el.fatalDetail.textContent = "MD Chat could not load its real-time libraries. Check your network and refresh.";
  }
}

boot();
