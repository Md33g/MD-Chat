/* ==========================================================================
   MD Chat — client-side room chat
   Yjs document + y-websocket awareness, public keyless relay.
   ========================================================================== */

const RELAY_ENDPOINT = "wss://demos.yjs.dev/ws";
const PROFILE_KEY = "mdchat.profile.v1";
const LAST_ROOM_KEY = "mdchat.lastRoom.v1";
const MESSAGE_LIMIT = 4000;
const MAX_INPUT_HEIGHT = 116;

const EMOJI_OPTIONS = [
  { emoji: "🦊", label: "Fox" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🐳", label: "Whale" },
  { emoji: "🦉", label: "Owl" },
  { emoji: "🐙", label: "Octopus" },
  { emoji: "🌙", label: "Moon" },
  { emoji: "⚡", label: "Lightning" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "🌊", label: "Wave" },
  { emoji: "🪐", label: "Planet" },
  { emoji: "🍀", label: "Clover" },
  { emoji: "🎧", label: "Headphones" }
];

const COLOR_OPTIONS = [
  { value: "#0A84FF", label: "Blue" },
  { value: "#1E90FF", label: "Sky" },
  { value: "#5E5CE6", label: "Indigo" },
  { value: "#30D158", label: "Green" },
  { value: "#FF9F0A", label: "Amber" },
  { value: "#FF375F", label: "Pink" },
  { value: "#64D2FF", label: "Cyan" },
  { value: "#BF5AF2", label: "Purple" }
];

const PICKER_EMOJIS = [
  "😀", "😂", "😊", "😍", "🤔", "😎", "😭", "😅",
  "🙌", "👏", "🔥", "✨", "💙", "💯", "🎉", "☕",
  "🌙", "⚡", "🌊", "🍀", "🫶", "👀", "🤝", "🚀"
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const el = {
  landing: $("#landingScreen"),
  chat: $("#chatScreen"),
  joinForm: $("#joinForm"),
  username: $("#username"),
  usernameError: $("#usernameError"),
  roomName: $("#roomName"),
  roomError: $("#roomError"),
  joinBtn: $("#joinBtn"),
  avatarPreview: $("#avatarPreview"),
  tabEmoji: $("#tabEmoji"),
  tabInitial: $("#tabInitial"),
  emojiPanel: $("#emojiPanel"),
  initialPanel: $("#initialPanel"),
  landingAbout: $("#landingAbout"),

  sidebarRoom: $("#sidebarRoom"),
  sidebarStatusDot: $("#sidebarStatusDot"),
  sidebarStatusText: $("#sidebarStatusText"),
  desktopOnlineCount: $("#desktopOnlineCount"),
  mobileOnlineCount: $("#mobileOnlineCount"),
  popoverOnlineCount: $("#popoverOnlineCount"),
  onlineListDesktop: $("#onlineListDesktop"),
  onlineListMobile: $("#onlineListMobile"),

  topbarRoom: $("#topbarRoom"),
  topbarStatusDot: $("#topbarStatusDot"),
  topbarStatusText: $("#topbarStatusText"),
  mobileLeave: $("#mobileLeave"),
  peopleBtn: $("#peopleBtn"),
  peoplePopover: $("#peoplePopover"),
  topbarAbout: $("#topbarAbout"),
  aboutBtn: $("#aboutBtn"),
  leaveBtn: $("#leaveBtn"),
  popoverAbout: $("#popoverAbout"),
  popoverLeave: $("#popoverLeave"),

  connectionBanner: $("#connectionBanner"),
  bannerText: $("#bannerText"),
  bannerRetry: $("#bannerRetry"),

  messageList: $("#messageList"),
  emptyState: $("#emptyState"),
  emptyTitle: $("#emptyTitle"),
  emptySub: $("#emptySub"),
  jumpLatest: $("#jumpLatest"),
  typingBar: $("#typingBar"),
  typingText: $("#typingText"),

  replyPreview: $("#replyPreview"),
  replyName: $("#replyName"),
  replyText: $("#replyText"),
  cancelReply: $("#cancelReply"),
  emojiBtn: $("#emojiBtn"),
  emojiPicker: $("#emojiPicker"),
  emojiPickerGrid: $("#emojiPickerGrid"),
  messageInput: $("#messageInput"),
  sendBtn: $("#sendBtn"),
  charCount: $("#charCount"),

  aboutDialog: $("#aboutDialog"),
  closeAbout: $("#closeAbout"),
  toast: $("#toast"),
  fatal: $("#fatal"),
  fatalDetail: $("#fatalDetail")
};

let Y = null;
let WebsocketProvider = null;

const state = {
  profile: null,
  room: null,
  doc: null,
  provider: null,
  messagesArray: null,
  awareness: null,
  connection: "idle",
  synced: false,
  hadConnected: false,
  everDisconnected: false,
  hasRendered: false,
  knownIds: new Set(),
  forceScroll: false,
  replyTo: null,
  typing: false,
  typingTimer: null,
  onMessages: null,
  onAwareness: null
};

/* ==========================================================================
   Small utilities
   ========================================================================== */

function uid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : COLOR_OPTIONS[0].value;
}

function safeEmoji(value) {
  if (typeof value !== "string") return "👤";
  const parts = Array.from(value.trim());
  if (!parts.length || parts.length > 4) return "👤";
  return parts.join("");
}

function hexToRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeColor(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  let r = ((value >> 16) & 255) + amount;
  let g = ((value >> 8) & 255) + amount;
  let b = (value & 255) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit"
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short"
});

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatTime(ts) {
  return timeFormatter.format(new Date(ts));
}

function formatFullDate(ts) {
  try {
    return fullDateFormatter.format(new Date(ts));
  } catch {
    return "";
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayLabel(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (date.getFullYear() === now.getFullYear()) return shortDateFormatter.format(date);
  return longDateFormatter.format(date);
}

function dayKey(ts) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function tickSvg(read) {
  if (read) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m2 12.5 4.5 4.5L16 7.5" />
      <path d="m10.5 17 2 2L23 8.5" />
    </svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m4 12.5 4.5 4.5L19 7.5" />
  </svg>`;
}

function replyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 17 4 12l5-5" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>`;
}

/* ==========================================================================
   Profile persistence
   ========================================================================== */

function defaultProfile() {
  return {
    id: uid(),
    name: "",
    avatarType: "emoji",
    emoji: EMOJI_OPTIONS[0].emoji,
    color: COLOR_OPTIONS[0].value
  };
}

function loadProfile() {
  const fallback = defaultProfile();
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!raw || typeof raw !== "object") return fallback;

    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : fallback.id,
      name: typeof raw.name === "string" ? raw.name.slice(0, 20) : "",
      avatarType: raw.avatarType === "initial" ? "initial" : "emoji",
      emoji: EMOJI_OPTIONS.some((item) => item.emoji === raw.emoji)
        ? raw.emoji
        : fallback.emoji,
      color: COLOR_OPTIONS.some((item) => item.value === raw.color)
        ? raw.color
        : fallback.color
    };
  } catch {
    return fallback;
  }
}

function persistProfile() {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
  } catch {
    /* localStorage can fail in private browsing — profile still works this session. */
  }
}

/* ==========================================================================
   Avatar rendering
   ========================================================================== */

function paintAvatar(node, avatar) {
  const color = safeColor(avatar.color);
  const type = avatar.avatarType === "initial" ? "initial" : "emoji";

  node.style.setProperty("--avatar-color", color);
  node.classList.toggle("avatar-initial", type === "initial");
  node.classList.toggle("avatar-emoji", type === "emoji");

  if (type === "initial") {
    const name = String(avatar.name || "?");
    const initial = Array.from(name)[0] || "?";
    node.textContent = initial.toUpperCase();
    node.style.background = `linear-gradient(145deg, ${color}, ${shadeColor(color, -42)})`;
  } else {
    node.textContent = safeEmoji(avatar.emoji);
    node.style.background =
      `radial-gradient(circle at 30% 22%, ${hexToRgba(color, 0.34)}, rgba(255,255,255,0.035) 68%)`;
  }

  node.style.borderColor = hexToRgba(color, 0.34);
}

function avatarFromMessage(message) {
  return {
    avatarType: message.avatarType === "initial" ? "initial" : "emoji",
    emoji: message.emoji,
    name: message.senderName,
    color: message.color
  };
}

function updateAvatarPreview() {
  paintAvatar(el.avatarPreview, {
    avatarType: state.profile.avatarType,
    emoji: state.profile.emoji,
    name: state.profile.name || "?",
    color: state.profile.color
  });
}

function setAvatarMode(mode) {
  state.profile.avatarType = mode === "initial" ? "initial" : "emoji";
  refreshAvatarControls();
}

function refreshAvatarControls() {
  el.emojiPanel.classList.toggle("hidden", state.profile.avatarType !== "emoji");
  el.initialPanel.classList.toggle("hidden", state.profile.avatarType !== "initial");

  el.tabEmoji.setAttribute("aria-selected", String(state.profile.avatarType === "emoji"));
  el.tabInitial.setAttribute("aria-selected", String(state.profile.avatarType === "initial"));

  $$(".emoji-choice", el.emojiPanel).forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(
        state.profile.avatarType === "emoji" &&
        button.dataset.emoji === state.profile.emoji
      )
    );
  });

  $$(".color-choice", el.initialPanel).forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(
        state.profile.avatarType === "initial" &&
        button.dataset.color === state.profile.color
      )
    );
  });

  updateAvatarPreview();
}

function buildAvatarPicker() {
  EMOJI_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "emoji-choice";
    button.textContent = item.emoji;
    button.dataset.emoji = item.emoji;
    button.setAttribute("aria-label", `Use ${item.label} emoji avatar`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      state.profile.emoji = item.emoji;
      state.profile.avatarType = "emoji";
      refreshAvatarControls();
    });
    el.emojiPanel.append(button);
  });

  COLOR_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-choice";
    button.style.setProperty("--c", item.value);
    button.dataset.color = item.value;
    button.setAttribute("aria-label", `Use ${item.label} initial avatar`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      state.profile.color = item.value;
      state.profile.avatarType = "initial";
      refreshAvatarControls();
    });
    el.initialPanel.append(button);
  });

  el.tabEmoji.addEventListener("click", () => setAvatarMode("emoji"));
  el.tabInitial.addEventListener("click", () => setAvatarMode("initial"));

  el.username.addEventListener("input", () => {
    if (state.profile.avatarType === "initial") updateAvatarPreview();
  });
}

function buildEmojiPicker() {
  PICKER_EMOJIS.forEach((emoji) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = emoji;
    button.setAttribute("aria-label", `Insert ${emoji}`);
    button.addEventListener("click", () => insertEmoji(emoji));
    el.emojiPickerGrid.append(button);
  });
}

/* ==========================================================================
   Validation
   ========================================================================== */

function validateUsername(value) {
  const name = value.trim();
  if (!name) return "Choose a username.";
  if (name.length < 2) return "Use at least 2 characters.";
  if (name.length > 20) return "Keep it to 20 characters or fewer.";
  if (/\s/.test(name)) return "Usernames cannot contain spaces.";
  return "";
}

function validateRoom(value) {
  if (!value) return "Name your room.";
  if (!/^[A-Za-z0-9-]{3,30}$/.test(value)) {
    return "Use 3–30 letters, numbers, or hyphens.";
  }
  return "";
}

function showFieldError(input, errorNode, message) {
  errorNode.textContent = message || "";
  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

/* ==========================================================================
   Toast
   ========================================================================== */

let toastTimer = null;

function showToast(message, type = "info") {
  el.toast.textContent = message;
  el.toast.classList.toggle("error", type === "error");
  el.toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove("show");
  }, type === "error" ? 4200 : 2600);
}

/* ==========================================================================
   Presence
   ========================================================================== */

function presencePayload() {
  return {
    id: state.profile.id,
    name: state.profile.name,
    avatarType: state.profile.avatarType,
    emoji: state.profile.emoji,
    color: state.profile.color,
    typing: false
  };
}

function getUniqueUsers() {
  const users = new Map();

  if (!state.awareness) return [];

  for (const awarenessState of state.awareness.getStates().values()) {
    const user = awarenessState?.user;
    if (!user || typeof user !== "object" || typeof user.id !== "string") continue;

    const name = typeof user.name === "string" ? user.name.slice(0, 20) : "";
    if (!name) continue;

    const normalized = {
      id: user.id,
      name,
      avatarType: user.avatarType === "initial" ? "initial" : "emoji",
      emoji: safeEmoji(user.emoji),
      color: safeColor(user.color),
      typing: Boolean(user.typing)
    };

    const existing = users.get(normalized.id);
    if (!existing) {
      users.set(normalized.id, normalized);
    } else if (normalized.typing) {
      existing.typing = true;
    }
  }

  return Array.from(users.values()).sort((a, b) => {
    if (a.id === state.profile.id) return -1;
    if (b.id === state.profile.id) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function getOtherOnlineCount() {
  return getUniqueUsers().filter((user) => user.id !== state.profile.id).length;
}

function buildOnlineUser(user) {
  const row = document.createElement("div");
  row.className = "online-user";
  row.setAttribute("role", "listitem");

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  paintAvatar(avatar, user);

  const name = document.createElement("span");
  name.className = "online-name";
  name.textContent = user.name;

  if (user.id === state.profile.id) {
    const you = document.createElement("span");
    you.className = "you-badge";
    you.textContent = "you";
    name.append(you);
  }

  const dot = document.createElement("span");
  dot.className = "presence-dot";
  dot.setAttribute("aria-hidden", "true");
  dot.title = "Online";

  row.append(avatar, name, dot);
  row.setAttribute("aria-label", `${user.name}${user.id === state.profile.id ? ", you" : ""}, online`);
  return row;
}

function renderOnlineUsers() {
  const users = getUniqueUsers();
  const count = users.length;
  const countText = String(count);

  el.desktopOnlineCount.textContent = countText;
  el.mobileOnlineCount.textContent = countText;
  el.popoverOnlineCount.textContent = countText;

  const renderInto = (container) => {
    container.replaceChildren();

    if (!users.length) {
      const empty = document.createElement("div");
      empty.className = "online-empty";
      empty.textContent = "Connecting…";
      container.append(empty);
      return;
    }

    users.forEach((user) => container.append(buildOnlineUser(user)));
  };

  renderInto(el.onlineListDesktop);
  renderInto(el.onlineListMobile);
}

function setTyping(next) {
  if (!state.awareness) return;
  if (state.typing === next) return;

  state.typing = next;
  const current = state.awareness.getLocalState()?.user;
  if (!current) return;

  state.awareness.setLocalStateField("user", {
    ...current,
    typing: next
  });
}

function renderTyping() {
  if (!state.room) {
    el.typingBar.classList.add("hidden");
    return;
  }

  const typers = getUniqueUsers().filter(
    (user) => user.id !== state.profile.id && user.typing
  );

  if (!typers.length) {
    el.typingBar.classList.add("hidden");
    el.typingText.textContent = "";
    return;
  }

  let label;
  if (typers.length === 1) {
    label = `${typers[0].name} is typing`;
  } else if (typers.length === 2) {
    label = `${typers[0].name} and ${typers[1].name} are typing`;
  } else {
    label = "Several people are typing";
  }

  el.typingText.textContent = label;
  el.typingBar.classList.remove("hidden");
}

function handleAwarenessChange() {
  renderOnlineUsers();
  renderTyping();
  updateTicks();
}

/* ==========================================================================
   Message rendering
   ========================================================================== */

function normalizeMessage(raw) {
  if (!raw || typeof raw !== "object") return null;

  const text = typeof raw.text === "string" ? raw.text.slice(0, MESSAGE_LIMIT) : "";
  if (!text.trim()) return null;

  const parsedTs = Number(raw.ts);
  const ts = Number.isFinite(parsedTs) && parsedTs > 0 ? parsedTs : Date.now();

  const senderName =
    typeof raw.senderName === "string" && raw.senderName.trim()
      ? raw.senderName.slice(0, 40)
      : "Unknown";

  let replyTo = null;
  if (raw.replyTo && typeof raw.replyTo === "object") {
    const replyText =
      typeof raw.replyTo.text === "string" ? raw.replyTo.text.slice(0, 1000) : "";
    if (replyText) {
      replyTo = {
        id: String(raw.replyTo.id || ""),
        senderId: String(raw.replyTo.senderId || ""),
        senderName:
          typeof raw.replyTo.senderName === "string" && raw.replyTo.senderName.trim()
            ? raw.replyTo.senderName.slice(0, 40)
            : "Unknown",
        text: replyText
      };
    }
  }

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    senderId: typeof raw.senderId === "string" ? raw.senderId : "",
    senderName,
    avatarType: raw.avatarType === "initial" ? "initial" : "emoji",
    emoji: safeEmoji(raw.emoji),
    color: safeColor(raw.color),
    text,
    ts,
    replyTo
  };
}

function getMessages() {
  if (!state.messagesArray) return [];

  return state.messagesArray
    .toArray()
    .map(normalizeMessage)
    .filter(Boolean)
    .sort((a, b) => {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return String(a.id).localeCompare(String(b.id));
    });
}

function buildDateSeparator(ts) {
  const separator = document.createElement("div");
  separator.className = "date-sep";
  separator.setAttribute("role", "separator");

  const label = document.createElement("span");
  label.textContent = formatDayLabel(ts);
  separator.append(label);

  return separator;
}

function buildMessageElement(message, isOwn, isNew) {
  const row = document.createElement("div");
  row.className = `msg${isOwn ? " own" : ""}${isNew ? " is-new" : ""}`;
  row.dataset.id = message.id;

  const avatar = document.createElement("span");
  avatar.className = "avatar msg-avatar";
  avatar.setAttribute("aria-hidden", "true");
  paintAvatar(avatar, avatarFromMessage(message));

  const content = document.createElement("div");
  content.className = "msg-content";

  const topline = document.createElement("div");
  topline.className = "msg-topline";

  const sender = document.createElement("span");
  sender.className = "sender";
  sender.textContent = isOwn ? "You" : message.senderName;
  topline.append(sender);

  const bubbleWrap = document.createElement("div");
  bubbleWrap.className = "bubble-wrap";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.tabIndex = 0;
  bubble.setAttribute("role", "article");

  if (message.replyTo) {
    const quote = document.createElement("div");
    quote.className = "reply-quote";

    const quoteName = document.createElement("span");
    quoteName.className = "reply-quote-name";
    quoteName.textContent =
      message.replyTo.senderId === state.profile.id
        ? "You"
        : message.replyTo.senderName;

    const quoteText = document.createElement("span");
    quoteText.className = "reply-quote-text";
    quoteText.textContent = message.replyTo.text;

    quote.append(quoteName, quoteText);
    bubble.append(quote);
  }

  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = message.text;
  bubble.append(text);

  const meta = document.createElement("div");
  meta.className = "bubble-meta";

  const time = document.createElement("time");
  time.dateTime = new Date(message.ts).toISOString();
  time.title = formatFullDate(message.ts);
  time.textContent = formatTime(message.ts);
  meta.append(time);

  if (isOwn) {
    const read = getOtherOnlineCount() > 0;
    const ticks = document.createElement("span");
    ticks.className = `ticks${read ? " is-read" : ""}`;
    ticks.innerHTML = tickSvg(read);
    ticks.setAttribute("aria-label", read ? "Read by someone in the room" : "Sent");
    ticks.title = read ? "Read" : "Sent";
    meta.append(ticks);
  }

  bubble.append(meta);
  bubbleWrap.append(bubble);

  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const replyButton = document.createElement("button");
  replyButton.type = "button";
  replyButton.className = "reply-action";
  replyButton.innerHTML = `${replyIcon()}<span>Reply</span>`;
  replyButton.setAttribute("aria-label", `Reply to ${isOwn ? "your message" : message.senderName}`);
  replyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setReply(message);
    row.classList.remove("show-actions");
  });

  actions.append(replyButton);

  bubble.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    row.classList.toggle("show-actions");
  });

  bubble.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      row.classList.toggle("show-actions");
    }
  });

  content.append(topline, bubbleWrap, actions);
  row.append(avatar, content);

  return row;
}

function isNearBottom() {
  const list = el.messageList;
  return list.scrollHeight - list.scrollTop - list.clientHeight < 140;
}

function scrollToBottom(instant = false) {
  const list = el.messageList;
  if (instant) {
    list.scrollTop = list.scrollHeight;
    return;
  }
  list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
}

function updateJumpButton() {
  const hasMessages = el.messageList.querySelector(".msg") !== null;
  const distance =
    el.messageList.scrollHeight - el.messageList.scrollTop - el.messageList.clientHeight;
  el.jumpLatest.classList.toggle("hidden", !hasMessages || distance <= 120);
}

function updateEmptyState(messageCount) {
  el.emptyState.classList.toggle("hidden", messageCount > 0);

  if (messageCount > 0) return;

  if (!state.synced) {
    el.emptyTitle.textContent = "Opening the room…";
    el.emptySub.textContent = "Syncing messages through the public relay.";
  } else {
    el.emptyTitle.textContent = "This room is quiet.";
    el.emptySub.textContent = "Send the first message and break the silence.";
  }
}

function renderMessages({ forceBottom = false, instant = false } = {}) {
  if (!state.messagesArray) return;

  const messages = getMessages();
  const stick = forceBottom || isNearBottom();
  const fragment = document.createDocumentFragment();
  let previousDay = null;

  for (const message of messages) {
    const currentDay = dayKey(message.ts);
    if (currentDay !== previousDay) {
      fragment.append(buildDateSeparator(message.ts));
      previousDay = currentDay;
    }

    const isNew = state.hasRendered && !state.knownIds.has(message.id);
    const isOwn = message.senderId === state.profile.id;

    fragment.append(buildMessageElement(message, isOwn, isNew));
    state.knownIds.add(message.id);
  }

  el.messageList.replaceChildren(fragment);
  state.hasRendered = true;

  updateEmptyState(messages.length);

  if (stick) {
    requestAnimationFrame(() => scrollToBottom(instant));
  }

  updateTicks();
  requestAnimationFrame(updateJumpButton);
}

function updateTicks() {
  const read = getOtherOnlineCount() > 0;
  const nodes = el.messageList.querySelectorAll(".msg.own .ticks");

  nodes.forEach((node) => {
    node.classList.toggle("is-read", read);
    node.innerHTML = tickSvg(read);
    node.setAttribute("aria-label", read ? "Read by someone in the room" : "Sent");
    node.title = read ? "Read" : "Sent";
  });
}

/* ==========================================================================
   Reply and composer
   ========================================================================== */

function setReply(message) {
  state.replyTo = {
    id: message.id,
    senderId: message.senderId,
    senderName: message.senderName,
    text: message.text
  };

  el.replyName.textContent =
    message.senderId === state.profile.id ? "You" : message.senderName;
  el.replyText.textContent = message.text.replace(/\s+/g, " ").slice(0, 140);
  el.replyPreview.classList.remove("hidden");
  el.messageInput.focus();
}

function clearReply() {
  state.replyTo = null;
  el.replyName.textContent = "";
  el.replyText.textContent = "";
  el.replyPreview.classList.add("hidden");
}

function resizeInput() {
  const input = el.messageInput;
  input.style.height = "auto";
  const nextHeight = Math.min(input.scrollHeight, MAX_INPUT_HEIGHT);
  input.style.height = `${nextHeight}px`;
  input.style.overflowY = input.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
}

function updateSendState() {
  const value = el.messageInput.value;
  const hasText = value.trim().length > 0;
  el.sendBtn.disabled = !hasText;
  el.charCount.textContent = value.length > 1800 ? `${value.length}/2000` : "";
}

function handleComposerInput() {
  updateSendState();
  resizeInput();

  const hasText = el.messageInput.value.trim().length > 0;

  if (hasText) {
    setTyping(true);
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => setTyping(false), 1500);
  } else {
    setTyping(false);
    clearTimeout(state.typingTimer);
  }
}

function sendMessage() {
  const text = el.messageInput.value.trim();
  if (!text || !state.messagesArray) return;

  const message = {
    id: uid(),
    senderId: state.profile.id,
    senderName: state.profile.name,
    avatarType: state.profile.avatarType,
    emoji: state.profile.emoji,
    color: state.profile.color,
    text,
    ts: Date.now(),
    replyTo: state.replyTo ? { ...state.replyTo } : null
  };

  state.forceScroll = true;

  try {
    state.messagesArray.push([message]);
  } catch (error) {
    console.error("Could not send message:", error);
    showToast("Could not send that message. Try again.", "error");
    return;
  }

  el.messageInput.value = "";
  resizeInput();
  updateSendState();
  clearReply();
  clearTimeout(state.typingTimer);
  setTyping(false);
  el.messageInput.focus();
}

function insertEmoji(emoji) {
  const input = el.messageInput;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;

  input.setRangeText(emoji, start, end, "end");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

function closeEmojiPicker() {
  el.emojiPicker.classList.add("hidden");
  el.emojiBtn.setAttribute("aria-expanded", "false");
}

function toggleEmojiPicker() {
  const isHidden = el.emojiPicker.classList.contains("hidden");
  if (isHidden) {
    el.emojiPicker.classList.remove("hidden");
    el.emojiBtn.setAttribute("aria-expanded", "true");
  } else {
    closeEmojiPicker();
  }
}

/* ==========================================================================
   Connection and room lifecycle
   ========================================================================== */

function updateConnectionUi() {
  const status = state.connection;
  const labels = {
    connected: "Live",
    connecting: "Connecting…",
    disconnected: "Reconnecting…",
    idle: "Offline"
  };

  const label = labels[status] || "Offline";

  el.topbarStatusText.textContent = label;
  el.sidebarStatusText.textContent = label;

  el.topbarStatusDot.className = `status-dot ${status}`;
  el.sidebarStatusDot.className = `status-dot ${status}`;

  if (status === "connected") {
    el.connectionBanner.classList.add("hidden");
  } else {
    el.connectionBanner.classList.remove("hidden");
    el.bannerText.textContent =
      status === "connecting"
        ? "Connecting to the room…"
        : "Connection lost. Trying to reconnect…";
  }
}

function handleProviderStatus({ status }) {
  const wasConnected = state.hadConnected;
  state.connection = status;

  if (status === "connected") {
    state.hadConnected = true;

    if (state.everDisconnected) {
      state.everDisconnected = false;
      showToast("Reconnected.");
    }
  }

  if (status === "disconnected" && wasConnected) {
    state.everDisconnected = true;
    showToast("Connection lost. Retrying…", "error");
  }

  updateConnectionUi();
}

function handleProviderSync(isSynced) {
  if (!isSynced) return;

  state.synced = true;
  renderMessages({ forceBottom: true, instant: true });
}

function handleMessagesChange() {
  const stick = state.forceScroll || isNearBottom();
  renderMessages({ forceBottom: stick });
  state.forceScroll = false;
}

function updateRoomLabels() {
  el.topbarRoom.textContent = state.room || "room";
  el.sidebarRoom.textContent = state.room || "—";
  document.title = state.room ? `#${state.room} · MD Chat` : "MD Chat — Real-time rooms";
}

function enterRoom(roomName) {
  if (state.room) cleanupChat();

  state.room = roomName;
  state.connection = "connecting";
  state.synced = false;
  state.hadConnected = false;
  state.everDisconnected = false;
  state.hasRendered = false;
  state.knownIds.clear();
  state.forceScroll = false;
  state.replyTo = null;
  state.typing = false;

  state.doc = new Y.Doc();
  state.messagesArray = state.doc.getArray("messages");

  state.provider = new WebsocketProvider(RELAY_ENDPOINT, roomName, state.doc, {
    connect: true
  });

  state.awareness = state.provider.awareness;
  state.awareness.setLocalStateField("user", presencePayload());

  state.onMessages = handleMessagesChange;
  state.onAwareness = handleAwarenessChange;

  state.messagesArray.observe(state.onMessages);
  state.awareness.on("change", state.onAwareness);

  state.provider.on("status", handleProviderStatus);
  state.provider.on("sync", handleProviderSync);

  updateRoomLabels();
  updateConnectionUi();
  renderOnlineUsers();
  renderTyping();
  renderMessages({ forceBottom: true, instant: true });

  el.landing.classList.add("hidden");
  el.chat.classList.remove("hidden");
  document.body.classList.add("in-chat");

  requestAnimationFrame(() => {
    resizeInput();
    updateSendState();
    el.messageInput.focus();
  });
}

function cleanupChat() {
  clearTimeout(state.typingTimer);
  state.typingTimer = null;
  state.typing = false;

  if (state.messagesArray && state.onMessages) {
    try {
      state.messagesArray.unobserve(state.onMessages);
    } catch {
      /* already detached */
    }
  }

  if (state.awareness && state.onAwareness) {
    try {
      state.awareness.off("change", state.onAwareness);
    } catch {
      /* already detached */
    }
  }

  if (state.awareness) {
    try {
      state.awareness.setLocalState(null);
    } catch {
      /* provider may already be destroyed */
    }
  }

  if (state.provider) {
    try {
      state.provider.destroy();
    } catch {
      /* already destroyed */
    }
  }

  if (state.doc) {
    try {
      state.doc.destroy();
    } catch {
      /* already destroyed */
    }
  }

  state.doc = null;
  state.provider = null;
  state.messagesArray = null;
  state.awareness = null;
  state.onMessages = null;
  state.onAwareness = null;
  state.room = null;
  state.connection = "idle";
  state.synced = false;
  state.hadConnected = false;
  state.everDisconnected = false;
  state.hasRendered = false;
  state.knownIds.clear();
  state.forceScroll = false;
  state.replyTo = null;
}

function leaveRoom() {
  if (!state.room) return;

  cleanupChat();

  el.chat.classList.add("hidden");
  el.landing.classList.remove("hidden");
  document.body.classList.remove("in-chat");

  el.messageList.replaceChildren();
  el.emptyState.classList.remove("hidden");
  el.typingBar.classList.add("hidden");
  el.jumpLatest.classList.add("hidden");
  el.peoplePopover.classList.add("hidden");
  closeEmojiPicker();
  clearReply();

  el.messageInput.value = "";
  resizeInput();
  updateSendState();

  document.title = "MD Chat — Real-time rooms";
  el.roomName.value = localStorage.getItem(LAST_ROOM_KEY) || "";

  history.replaceState(null, "", location.pathname);

  showToast("You left the room.");

  requestAnimationFrame(() => {
    el.username.focus();
  });
}

/* ==========================================================================
   Modal
   ========================================================================== */

function openAbout() {
  el.peoplePopover.classList.add("hidden");
  closeEmojiPicker();

  if (typeof el.aboutDialog.showModal === "function") {
    el.aboutDialog.showModal();
  } else {
    el.aboutDialog.setAttribute("open", "");
  }
}

function closeAbout() {
  if (typeof el.aboutDialog.close === "function") {
    el.aboutDialog.close();
  } else {
    el.aboutDialog.removeAttribute("open");
  }
}

/* ==========================================================================
   Event wiring
   ========================================================================== */

function wireEvents() {
  /* Landing */
  el.joinForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = el.username.value.trim();
    const room = el.roomName.value.trim().toLowerCase();

    const nameError = validateUsername(name);
    const roomError = validateRoom(room);

    showFieldError(el.username, el.usernameError, nameError);
    showFieldError(el.roomName, el.roomError, roomError);

    if (nameError || roomError) {
      (nameError ? el.username : el.roomName).focus();
      return;
    }

    state.profile.name = name;
    persistProfile();

    try {
      localStorage.setItem(LAST_ROOM_KEY, room);
    } catch {
      /* ignore storage failures */
    }

    enterRoom(room);
  });

  el.username.addEventListener("input", () => {
    if (el.username.getAttribute("aria-invalid") === "true") {
      showFieldError(el.username, el.usernameError, validateUsername(el.username.value));
    }
  });

  el.roomName.addEventListener("input", () => {
    if (el.roomName.getAttribute("aria-invalid") === "true") {
      showFieldError(el.roomName, el.roomError, validateRoom(el.roomName.value.trim()));
    }
  });

  el.landingAbout.addEventListener("click", openAbout);

  /* Chat header / sidebar */
  el.aboutBtn.addEventListener("click", openAbout);
  el.topbarAbout.addEventListener("click", openAbout);
  el.popoverAbout.addEventListener("click", openAbout);
  el.closeAbout.addEventListener("click", closeAbout);
  el.leaveBtn.addEventListener("click", leaveRoom);
  el.mobileLeave.addEventListener("click", leaveRoom);
  el.popoverLeave.addEventListener("click", leaveRoom);

  el.peopleBtn.addEventListener("click", () => {
    const isHidden = el.peoplePopover.classList.contains("hidden");
    el.peoplePopover.classList.toggle("hidden", !isHidden);
    el.peopleBtn.setAttribute("aria-expanded", String(isHidden));
    if (isHidden) renderOnlineUsers();
  });

  el.bannerRetry.addEventListener("click", () => {
    if (!state.provider) return;
    try {
      state.provider.connect();
      showToast("Trying to reconnect…");
    } catch {
      showToast("Could not restart the connection.", "error");
    }
  });

  /* Composer */
  el.messageInput.addEventListener("input", handleComposerInput);

  el.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });

  el.messageInput.addEventListener("blur", () => {
    setTyping(false);
    clearTimeout(state.typingTimer);
  });

  el.sendBtn.addEventListener("click", sendMessage);
  el.cancelReply.addEventListener("click", clearReply);
  el.emojiBtn.addEventListener("click", toggleEmojiPicker);

  el.jumpLatest.addEventListener("click", () => {
    scrollToBottom(false);
  });

  el.messageList.addEventListener("scroll", () => {
    requestAnimationFrame(updateJumpButton);
  });

  /* Global dismissal */
  document.addEventListener("pointerdown", (event) => {
    if (
      !el.emojiPicker.classList.contains("hidden") &&
      !el.emojiPicker.contains(event.target) &&
      !el.emojiBtn.contains(event.target)
    ) {
      closeEmojiPicker();
    }

    if (
      !el.peoplePopover.classList.contains("hidden") &&
      !el.peoplePopover.contains(event.target) &&
      !el.peopleBtn.contains(event.target)
    ) {
      el.peoplePopover.classList.add("hidden");
      el.peopleBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (!el.emojiPicker.classList.contains("hidden")) {
      closeEmojiPicker();
      return;
    }

    if (!el.peoplePopover.classList.contains("hidden")) {
      el.peoplePopover.classList.add("hidden");
      el.peopleBtn.setAttribute("aria-expanded", "false");
      return;
    }

    if (state.replyTo) clearReply();
  });

  /* Dialog backdrop close */
  el.aboutDialog.addEventListener("click", (event) => {
    const rect = el.aboutDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) closeAbout();
  });

  /* Best-effort presence cleanup */
  window.addEventListener("pagehide", () => {
    if (state.awareness) {
      try {
        state.awareness.setLocalState(null);
      } catch {
        /* ignore */
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      setTyping(false);
      clearTimeout(state.typingTimer);
    }
  });
}

/* ==========================================================================
   Boot
   ========================================================================== */

function prefillForm() {
  state.profile = loadProfile();

  el.username.value = state.profile.name || "";

  let room = localStorage.getItem(LAST_ROOM_KEY) || "";
  try {
    const queryRoom = new URLSearchParams(location.search).get("room");
    if (queryRoom) room = queryRoom.slice(0, 30);
  } catch {
    /* ignore malformed URLs */
  }
  el.roomName.value = room;

  buildAvatarPicker();
  refreshAvatarControls();
  updateSendState();
  resizeInput();

  if (state.profile.name) {
    el.roomName.focus();
  } else {
    el.username.focus();
  }
}

function init() {
  prefillForm();
  buildEmojiPicker();
  wireEvents();
}

async function boot() {
  try {
    Y = await import("yjs");
    const websocketModule = await import("y-websocket");
    WebsocketProvider = websocketModule.WebsocketProvider;

    if (!WebsocketProvider) {
      throw new Error("WebsocketProvider export was not found.");
    }

    init();
  } catch (error) {
    console.error("MD Chat failed to boot:", error);
    el.fatal.classList.remove("hidden");
    el.fatalDetail.textContent =
      "MD Chat could not load its real-time libraries. Check your network connection and refresh. " +
      "The public relay and CDN must be reachable.";
  }
}

boot();
