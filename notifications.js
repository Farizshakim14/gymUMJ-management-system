const NOTIF_STORE_KEY = "gym_admin_notifications";
const NOTIF_UNREAD_KEY = "gym_admin_unread_count";
const NOTIF_MAX_ITEMS = 40;
const NOTIF_FILTER_KEY = "gym_admin_notif_filter";

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function setStoredNotifications(items) {
  localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(items.slice(0, NOTIF_MAX_ITEMS)));
}

function getUnreadCount() {
  const raw = localStorage.getItem(NOTIF_UNREAD_KEY);
  const n = Number(raw || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setUnreadCount(count) {
  localStorage.setItem(NOTIF_UNREAD_KEY, String(Math.max(0, count)));
}

function getStoredFilter() {
  const value = localStorage.getItem(NOTIF_FILTER_KEY) || "all";
  return ["all", "booking", "absensi"].includes(value) ? value : "all";
}

function setStoredFilter(value) {
  localStorage.setItem(NOTIF_FILTER_KEY, value);
}

function safeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(ts) {
  return new Date(ts).toLocaleString("id-ID");
}

function buildNotifItem(type, title, desc) {
  const targetPage = type === "booking" ? "databooking.html" : "dataabsensi.html";
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    desc,
    ts: Date.now(),
    read: false,
    targetPage
  };
}

function normalizeStoredNotifications(items, legacyUnreadCount) {
  const safeItems = Array.isArray(items) ? items : [];
  const unreadRemaining = Math.max(0, Number(legacyUnreadCount || 0));
  let unreadAssigned = 0;

  return safeItems.slice(0, NOTIF_MAX_ITEMS).map((item) => {
    const hasReadFlag = typeof item?.read === "boolean";
    const fallbackRead = unreadAssigned < unreadRemaining ? false : true;
    if (!hasReadFlag && !fallbackRead) unreadAssigned += 1;

    return {
      id: item?.id || `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: item?.type === "booking" ? "booking" : (item?.type === "absensi" ? "absensi" : "booking"),
      title: item?.title || "Notifikasi",
      desc: item?.desc || "",
      ts: item?.ts || Date.now(),
      read: hasReadFlag ? item.read : fallbackRead,
      targetPage: item?.targetPage || (item?.type === "absensi" ? "dataabsensi.html" : "databooking.html")
    };
  });
}

function setupNotificationUI() {
  const header = document.querySelector(".page-header");
  if (!header) return null;

  let right = header.querySelector(".right");
  if (!right) {
    right = document.createElement("div");
    right.className = "right";
    header.appendChild(right);
  }

  const wrap = document.createElement("div");
  wrap.className = "notif-wrap";
  wrap.innerHTML = `
    <button type="button" class="notif-btn" id="notifBtn" aria-label="Notifikasi">
      <i class="bi bi-bell-fill"></i>
      <span class="notif-badge" id="notifBadge">0</span>
    </button>
    <div class="notif-panel" id="notifPanel">
      <div class="notif-head">
        <strong>Notifikasi</strong>
        <div class="notif-head-actions">
          <button type="button" id="notifReadAllBtn">Tandai semua dibaca</button>
          <button type="button" id="notifClearBtn">Bersihkan</button>
        </div>
      </div>
      <div class="notif-filter" id="notifFilter">
        <button type="button" data-filter="all" class="active">Semua</button>
        <button type="button" data-filter="booking">Booking</button>
        <button type="button" data-filter="absensi">Absensi</button>
      </div>
      <div class="notif-list" id="notifList"></div>
    </div>
  `;
  right.prepend(wrap);

  return {
    wrap,
    btn: wrap.querySelector("#notifBtn"),
    badge: wrap.querySelector("#notifBadge"),
    panel: wrap.querySelector("#notifPanel"),
    list: wrap.querySelector("#notifList"),
    clearBtn: wrap.querySelector("#notifClearBtn"),
    readAllBtn: wrap.querySelector("#notifReadAllBtn"),
    filterWrap: wrap.querySelector("#notifFilter")
  };
}

function renderNotifList(listEl, items, activeFilter) {
  const filteredItems = items.filter((n) => activeFilter === "all" || n.type === activeFilter);

  const typeLabel = activeFilter === "booking"
    ? "booking"
    : (activeFilter === "absensi" ? "absensi" : "notifikasi");

  if (!filteredItems.length) {
    listEl.innerHTML = `<div class="notif-empty">Belum ada ${typeLabel}.</div>`;
    return;
  }

  listEl.innerHTML = filteredItems
    .map((n) => `
      <div class="notif-item ${n.read ? "is-read" : "is-unread"}" data-id="${safeText(n.id)}">
        <div class="notif-item-top">
          <div class="notif-item-title">${safeText(n.title)}</div>
          <span class="notif-chip chip-${safeText(n.type)}">${safeText(n.type)}</span>
        </div>
        <div class="notif-item-desc">${safeText(n.desc)}</div>
        <div class="notif-item-bottom">
          <div class="notif-item-time">${formatTime(n.ts)}</div>
          <div class="notif-item-actions">
            ${n.read ? "" : `<button type="button" class="notif-read-btn" data-read-id="${safeText(n.id)}">Mark as read</button>`}
            <button type="button" class="notif-open-btn" data-go-id="${safeText(n.id)}">Buka menu</button>
          </div>
        </div>
      </div>
    `)
    .join("");
}

function updateFilterUI(filterWrap, activeFilter) {
  Array.from(filterWrap.querySelectorAll("button[data-filter]")).forEach((btn) => {
    const isActive = btn.getAttribute("data-filter") === activeFilter;
    btn.classList.toggle("active", isActive);
  });
}

function countUnread(items) {
  return items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
}

let notifAudioCtx = null;

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!notifAudioCtx) notifAudioCtx = new AudioCtx();
    if (notifAudioCtx.state === "suspended") notifAudioCtx.resume();

    const now = notifAudioCtx.currentTime;
    const osc = notifAudioCtx.createOscillator();
    const gain = notifAudioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(notifAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (_) {
    // Ignore autoplay/browser audio restriction.
  }
}

function setBadge(el, count) {
  el.textContent = String(count);
  el.style.display = count > 0 ? "inline-flex" : "none";
}

function rerenderNotificationPanel(ui, notifications, activeFilter) {
  renderNotifList(ui.list, notifications, activeFilter);
  updateFilterUI(ui.filterWrap, activeFilter);
  setBadge(ui.badge, countUnread(notifications));
}

function markNotificationAsRead(notifications, id) {
  let changed = false;
  const updated = notifications.map((n) => {
    if (n.id !== id || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  return { updated, changed };
}

function markAllNotificationsAsRead(notifications) {
  let changed = false;
  const updated = notifications.map((n) => {
    if (n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  return { updated, changed };
}

function bindItemActions(ui, getState, setStateAndRender) {
  ui.list.addEventListener("click", (e) => {
    const readBtn = e.target.closest("[data-read-id]");
    if (readBtn) {
      const id = readBtn.getAttribute("data-read-id");
      const state = getState();
      const result = markNotificationAsRead(state.notifications, id);
      if (!result.changed) return;

      setStateAndRender({
        ...state,
        notifications: result.updated
      });
      return;
    }

    const goBtn = e.target.closest("[data-go-id]");
    if (!goBtn) return;

    const id = goBtn.getAttribute("data-go-id");
    const state = getState();
    const notif = state.notifications.find((n) => n.id === id);
    if (!notif) return;

    const result = markNotificationAsRead(state.notifications, id);
    if (result.changed) {
      setStateAndRender({
        ...state,
        notifications: result.updated
      });
    }

    if (notif.targetPage) {
      window.location.href = notif.targetPage;
    }
  });
}

function bindFilterActions(ui, getState, setStateAndRender) {
  ui.filterWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;

    const nextFilter = btn.getAttribute("data-filter");
    if (!nextFilter) return;

    const state = getState();
    if (state.activeFilter === nextFilter) return;

    setStateAndRender({
      ...state,
      activeFilter: nextFilter
    });
  });
}

function flattenNestedMap(mapObj) {
  const rows = [];
  const parents = mapObj || {};
  Object.keys(parents).forEach((uid) => {
    const children = parents[uid] || {};
    Object.keys(children).forEach((id) => {
      rows.push({ uid, id, data: children[id] || {} });
    });
  });
  return rows;
}

function showToastNotification(item) {
  let container = document.getElementById("notifToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notifToastContainer";
    container.className = "notif-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("button");
  toast.type = "button";
  toast.className = "notif-toast";
  toast.innerHTML = `
    <div class="notif-toast-title">${safeText(item.title)}</div>
    <div class="notif-toast-desc">${safeText(item.desc)}</div>
  `;
  container.prepend(toast);

  const removeToast = () => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  };

  toast.addEventListener("click", () => {
    removeToast();
    if (item.targetPage) window.location.href = item.targetPage;
  });

  setTimeout(removeToast, 4000);
}

function initRealtimeNotificationWatcher(pushNotification) {
  let bookingReady = false;
  let knownBookingMap = new Map();

  db.ref("bookings").on("value", (snap) => {
    const rows = flattenNestedMap(snap.val());
    const currentMap = new Map(rows.map((r) => [`${r.uid}/${r.id}`, String(r?.data?.status || "Pending")]));

    if (!bookingReady) {
      knownBookingMap = currentMap;
      bookingReady = true;
      return;
    }

    rows.forEach((r) => {
      const key = `${r.uid}/${r.id}`;
      const currStatus = String(r?.data?.status || "Pending");
      const prevStatus = knownBookingMap.get(key);

      if (!knownBookingMap.has(key)) {
        const user = r.data.user_name || "User";
        const tanggal = r.data.gym_date || "-";
        const sesi = r.data.sesi || "-";
        pushNotification(
          buildNotifItem("booking", "Booking baru masuk", `${user} booking ${tanggal} (${sesi})`)
        );
      } else if (prevStatus !== currStatus && currStatus === "Disetujui") {
        const user = r.data.user_name || "User";
        const tanggal = r.data.gym_date || "-";
        const sesi = r.data.sesi || "-";
        pushNotification(
          buildNotifItem("booking", "Booking di-ACC", `${user} disetujui untuk ${tanggal} (${sesi})`)
        );
      }
    });

    knownBookingMap = currentMap;
  });

  let absensiReady = false;
  let knownAbsensi = new Set();

  db.ref("absensi").on("value", (snap) => {
    const rows = flattenNestedMap(snap.val());
    const current = new Set(rows.map((r) => `${r.uid}/${r.id}`));

    if (!absensiReady) {
      knownAbsensi = current;
      absensiReady = true;
      return;
    }

    rows.forEach((r) => {
      const key = `${r.uid}/${r.id}`;
      if (!knownAbsensi.has(key)) {
        const status = r.data.status || "Absensi";
        const tanggal = r.data.tanggal || "-";
        const jam = r.data.jam || "-";
        pushNotification(
          buildNotifItem("absensi", "Absensi baru masuk", `${status} pada ${tanggal} ${jam}`)
        );
      }
    });

    knownAbsensi = current;
  });
}

function initAdminNotifications() {
  if (typeof db === "undefined") return;

  const ui = setupNotificationUI();
  if (!ui) return;

  let state = {
    notifications: normalizeStoredNotifications(getStoredNotifications(), getUnreadCount()),
    activeFilter: getStoredFilter()
  };

  const persistState = () => {
    setStoredNotifications(state.notifications);
    setUnreadCount(countUnread(state.notifications));
    setStoredFilter(state.activeFilter);
  };

  const setStateAndRender = (nextState) => {
    state = nextState;
    persistState();
    rerenderNotificationPanel(ui, state.notifications, state.activeFilter);
  };

  const getState = () => state;

  rerenderNotificationPanel(ui, state.notifications, state.activeFilter);
  bindItemActions(ui, getState, setStateAndRender);
  bindFilterActions(ui, getState, setStateAndRender);

  const pushNotification = (item) => {
    setStateAndRender({
      ...state,
      notifications: [{ ...item, read: false }, ...state.notifications].slice(0, NOTIF_MAX_ITEMS)
    });
    playNotificationSound();
    showToastNotification(item);
  };

  ui.btn.addEventListener("click", (e) => {
    e.stopPropagation();
    ui.panel.classList.toggle("show");
  });

  ui.clearBtn.addEventListener("click", () => {
    setStateAndRender({
      ...state,
      notifications: []
    });
  });

  ui.readAllBtn.addEventListener("click", () => {
    const result = markAllNotificationsAsRead(state.notifications);
    if (!result.changed) return;

    setStateAndRender({
      ...state,
      notifications: result.updated
    });
  });

  document.addEventListener("click", (e) => {
    if (!ui.wrap.contains(e.target)) ui.panel.classList.remove("show");
  });

  initRealtimeNotificationWatcher(pushNotification);
}

document.addEventListener("DOMContentLoaded", initAdminNotifications);
