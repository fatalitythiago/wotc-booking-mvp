const state = {
  user: null,
  courts: [],
  clients: [],
  bookings: [],
  demoAccounts: [],
  selectedBookingId: null,
  openSlotMenu: null,
  activePanelView: "booking",
  clientSearchQuery: "",
  selectedClientId: null,
  bookingClientId: null
};

const timeOptions = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00"
];

const displayHours = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00"
];

const slotHeight = 72;
const DEFAULT_BOOKING_TYPE = {
  slotType: "reservation",
  slotLabel: "Reservation"
};

// Add or rename slot menu options here without changing the grid renderer below.
const SLOT_ACTIONS = [
  {
    id: "reservation",
    label: "Reservation",
    mode: "open-form",
    slotType: "reservation",
    slotLabel: "Reservation",
    tone: "primary"
  },
  {
    id: "open-time",
    label: "Open Time",
    mode: "open-form",
    slotType: "open-time",
    slotLabel: "Open Time",
    tone: "primary"
  },
  {
    id: "canceled",
    label: "Canceled",
    mode: "open-form",
    slotType: "canceled",
    slotLabel: "Canceled",
    tone: "danger"
  },
  {
    id: "maintenance",
    label: "Maintenance",
    mode: "open-form",
    slotType: "maintenance",
    slotLabel: "Maintenance",
    tone: "muted"
  },
  {
    id: "lesson",
    label: "Lesson",
    mode: "open-form",
    slotType: "lesson",
    slotLabel: "Lesson",
    tone: "warm"
  }
];

const PANEL_TOOLS = {
  clients: {
    title: "Clients",
    subtitle: "Look up a client without leaving the scheduler."
  },
  payments: {
    title: "Payments",
    subtitle: "Track unpaid courts and balance checks from this side panel."
  },
  rules: {
    title: "Rules",
    subtitle: "Review booking rule warnings for the selected day."
  },
  notes: {
    title: "Notes",
    subtitle: "Keep staff notes close to the schedule."
  },
  reports: {
    title: "Reports",
    subtitle: "Compact daily summary for the current schedule date."
  },
  audit: {
    title: "Audit",
    subtitle: "Review every court booking for the selected date."
  }
};

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");
const demoAccounts = document.getElementById("demoAccounts");
const datePicker = document.getElementById("datePicker");
const userName = document.getElementById("userName");
const clientInfoShortcut = document.getElementById("clientInfoShortcut");
const logoutButton = document.getElementById("logoutButton");
const schedulerGrid = document.getElementById("schedulerGrid");
const bookingAgenda = document.getElementById("bookingAgenda");
const bookingForm = document.getElementById("bookingForm");
const bookingIdInput = document.getElementById("bookingId");
const bookingDateInput = document.getElementById("bookingDate");
const playerNameInput = document.getElementById("playerName");
const playerNameLabel = document.getElementById("playerNameLabel");
const playerNameLabelText = document.getElementById("playerNameLabelText");
const playerCombobox = document.getElementById("playerCombobox");
const playerSuggestions = document.getElementById("playerSuggestions");
const slotTypeLabel = document.getElementById("slotTypeLabel");
const slotTypeSelect = document.getElementById("slotType");
const courtSelect = document.getElementById("courtId");
const startTimeSelect = document.getElementById("startTime");
const endTimeSelect = document.getElementById("endTime");
const notesInput = document.getElementById("notes");
const formMessage = document.getElementById("formMessage");
const bookingPanelTitle = document.getElementById("bookingPanelTitle");
const bookingPanelSubtitle = document.getElementById("bookingPanelSubtitle");
const cancelBookingButton = document.getElementById("cancelBookingButton");
const bookingPanel = document.querySelector(".booking-panel");
const schedulerWorkspace = document.getElementById("schedulerWorkspace");
const sidePanel = document.getElementById("sidePanel");
const sidePanelToggle = document.getElementById("sidePanelToggle");
const schedulerMenuButton = document.getElementById("schedulerMenuButton");
const schedulerMenuPanel = document.getElementById("schedulerMenuPanel");
const toolPanel = document.getElementById("toolPanel");

function getToday() {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split("T")[0];
}

function setSidePanelCollapsed(isCollapsed) {
  schedulerWorkspace.classList.toggle("side-panel-collapsed", isCollapsed);
  appScreen.classList.toggle("side-panel-collapsed", isCollapsed);
  sidePanel.setAttribute("aria-hidden", String(isCollapsed));
  sidePanelToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidePanelToggle.setAttribute(
    "aria-label",
    isCollapsed ? "Open booking side panel" : "Close booking side panel"
  );
  sidePanelToggle.textContent = isCollapsed ? "‹" : "›";
}

function formatTimeLabel(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function setMessage(target, text, type = "") {
  target.textContent = text;
  target.className = `message ${type}`.trim();
}

function setActivePanelView(view) {
  state.activePanelView = view;
  appScreen.classList.toggle("booking-mode", view === "booking");
  bookingPanel.classList.toggle("hidden", view !== "booking");
  renderToolPanel();
  schedulerMenuPanel.querySelectorAll("[data-panel-view]").forEach((button) => {
    const isActive = button.dataset.panelView === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function formatClientAddress(address) {
  if (!address) {
    return "Not available";
  }

  if (typeof address === "string") {
    return address;
  }

  return [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ") || "Not available";
}

function getSelectedClient() {
  return state.clients.find((client) => client.id === state.selectedClientId) || null;
}

function getClientById(clientId) {
  return state.clients.find((client) => client.id === clientId) || null;
}

function bookingMatchesClient(booking, client) {
  if (!booking || !client) {
    return false;
  }

  return booking.clientId === client.id ||
    booking.displayName === client.name ||
    booking.playerName === client.name ||
    booking.ownerEmail === client.email;
}

function selectClient(client, options = {}) {
  state.selectedClientId = client.id;
  state.clientSearchQuery = client.name;

  if (options.prefillBooking) {
    state.bookingClientId = client.id;
    playerNameInput.value = client.name;
  }

  renderClientInfoShortcut();
}

function renderClientInfoShortcut() {
  if (state.user?.role !== "staff") {
    clientInfoShortcut.classList.add("hidden");
    return;
  }

  clientInfoShortcut.classList.remove("hidden");
  const selectedClient = getSelectedClient();

  if (!selectedClient) {
    userName.textContent = "Client lookup";
    return;
  }

  userName.textContent = selectedClient.name;
}

function renderToolPanelHeader(title, subtitle) {
  const panelHead = document.createElement("div");
  panelHead.className = "panel-head";

  const textWrap = document.createElement("div");
  const heading = document.createElement("h2");
  const copy = document.createElement("p");

  heading.textContent = title;
  copy.className = "muted";
  copy.textContent = subtitle;

  textWrap.append(heading, copy);
  panelHead.appendChild(textWrap);
  toolPanel.appendChild(panelHead);
}

function renderInfoList(items) {
  const list = document.createElement("div");
  list.className = "tool-info-list";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "tool-info-row";

    const label = document.createElement("span");
    label.textContent = item.label;

    const value = document.createElement("strong");
    value.textContent = item.value;

    row.append(label, value);
    list.appendChild(row);
  });

  return list;
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

function getClientBookings(client) {
  if (!client) {
    return [];
  }

  return state.bookings.filter((booking) =>
    bookingMatchesClient(booking, client)
  );
}

function getClientPaymentSummary(client) {
  const payments = Array.isArray(client.payments) ? client.payments : [];
  const paidTotal = payments
    .filter((payment) => String(payment.status || "").toLowerCase() === "paid")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const unpaidTotal = payments
    .filter((payment) => String(payment.status || "").toLowerCase() !== "paid")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return {
    count: payments.length,
    paidTotal,
    unpaidTotal
  };
}

function renderClientPayments(client) {
  const payments = Array.isArray(client.payments) ? client.payments : [];
  const heading = document.createElement("h3");
  heading.textContent = "Payment summary";
  toolPanel.appendChild(heading);

  const summary = getClientPaymentSummary(client);
  toolPanel.appendChild(renderInfoList([
    { label: "Payment records", value: String(summary.count) },
    { label: "Paid total", value: formatMoney(summary.paidTotal) },
    { label: "Open balance", value: formatMoney(summary.unpaidTotal) }
  ]));

  if (payments.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No payment history available yet.";
    toolPanel.appendChild(emptyState);
    return;
  }

  const list = document.createElement("div");
  list.className = "payment-history-list";

  payments.forEach((payment) => {
    const row = document.createElement("div");
    row.className = "payment-history-row";

    const main = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = payment.description;
    meta.textContent = `${payment.date} · ${payment.method} · ${payment.status}`;
    main.append(title, meta);

    const amount = document.createElement("strong");
    amount.textContent = formatMoney(payment.amount);

    row.append(main, amount);
    list.appendChild(row);
  });

  toolPanel.appendChild(list);
}

function renderClientBookingSummary(clientBookings) {
  const activeBookings = clientBookings.filter((booking) => booking.status === "active");
  const cancelledBookings = clientBookings.filter((booking) => booking.status === "cancelled");
  const managedSlots = clientBookings.filter((booking) => booking.slotType !== "reservation");

  toolPanel.appendChild(renderInfoList([
    { label: "Bookings on date", value: String(clientBookings.length) },
    { label: "Active bookings", value: String(activeBookings.length) },
    { label: "Cancelled", value: String(cancelledBookings.length) },
    { label: "Managed slots", value: String(managedSlots.length) }
  ]));

  const list = document.createElement("div");
  list.className = "client-booking-list";

  if (clientBookings.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No bookings for this client on the selected date.";
    list.appendChild(emptyState);
  } else {
    clientBookings
      .slice()
      .sort((first, second) => first.startTime.localeCompare(second.startTime))
      .forEach((booking) => {
        const court = state.courts.find((item) => item.id === booking.courtId);
        const row = document.createElement("button");
        row.type = "button";
        row.className = "client-booking-row";
        row.innerHTML = `
          <strong>${court ? court.name : booking.courtId}</strong>
          <span>${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)} · ${booking.status}</span>
        `;
        row.addEventListener("click", () => loadBookingIntoForm(booking));
        list.appendChild(row);
      });
  }

  toolPanel.appendChild(list);
}

function renderClientNotes(client) {
  const notes = Array.isArray(client.notes) ? client.notes : [];
  const heading = document.createElement("h3");
  heading.textContent = "Notes";
  toolPanel.appendChild(heading);

  if (notes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No client notes yet.";
    toolPanel.appendChild(emptyState);
    return;
  }

  const list = document.createElement("div");
  list.className = "tool-alert-list";

  notes.forEach((note) => {
    const row = document.createElement("div");
    row.className = "tool-alert";
    row.textContent = `${note.date || "No date"}: ${note.text || ""}`;
    list.appendChild(row);
  });

  toolPanel.appendChild(list);
}

function renderClientsTool() {
  const searchLabel = document.createElement("label");
  searchLabel.className = "tool-search";
  searchLabel.textContent = "Client search";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Type a client name or email";
  searchInput.value = state.clientSearchQuery;
  searchInput.addEventListener("input", () => {
    const cursorPosition = searchInput.selectionStart || searchInput.value.length;
    state.clientSearchQuery = searchInput.value;
    state.selectedClientId = null;
    state.bookingClientId = null;
    renderClientInfoShortcut();
    renderToolPanel();
    const nextInput = toolPanel.querySelector(".tool-search input");
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(cursorPosition, cursorPosition);
    }
  });
  searchLabel.appendChild(searchInput);
  toolPanel.appendChild(searchLabel);

  const query = state.clientSearchQuery.trim().toLowerCase();
  const matches = state.clients.filter((client) =>
    !query ||
    client.name.toLowerCase().includes(query) ||
    client.email.toLowerCase().includes(query) ||
    String(client.phone || "").toLowerCase().includes(query) ||
    formatClientAddress(client.address).toLowerCase().includes(query)
  );

  const list = document.createElement("div");
  list.className = "client-tool-list";

  if (matches.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No matching clients.";
    list.appendChild(emptyState);
  } else {
    matches.forEach((client) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "client-tool-card";
      if (state.selectedClientId === client.id) {
        button.classList.add("is-selected");
      }

      const name = document.createElement("strong");
      name.textContent = client.name;

      const email = document.createElement("span");
      email.textContent = client.email;

      const phone = document.createElement("span");
      phone.textContent = client.phone || "Phone not available";

      const address = document.createElement("span");
      address.textContent = formatClientAddress(client.address);

      button.append(name, email, phone, address);
      button.addEventListener("click", () => {
        selectClient(client, { prefillBooking: state.activePanelView === "booking" });
        renderToolPanel();
      });
      list.appendChild(button);
    });
  }

  toolPanel.appendChild(list);

  const selectedClient = state.clients.find((client) => client.id === state.selectedClientId);
  if (!selectedClient) {
    return;
  }

  const clientBookings = getClientBookings(selectedClient);
  const detail = document.createElement("div");
  detail.className = "tool-detail-box";

  const title = document.createElement("h3");
  title.textContent = selectedClient.name;

  const details = renderInfoList([
    { label: "Email", value: selectedClient.email },
    { label: "Phone", value: selectedClient.phone || "Not available" },
    { label: "Home address", value: formatClientAddress(selectedClient.address) },
    { label: "Status", value: selectedClient.status || "Active" }
  ]);

  detail.append(title, details);
  toolPanel.appendChild(detail);
  renderClientBookingSummary(clientBookings);
  renderClientNotes(selectedClient);
  renderClientPayments(selectedClient);
}

function renderPaymentsTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const reservations = activeBookings.filter((booking) => booking.slotType === "reservation");
  const managedSlots = activeBookings.filter((booking) => booking.slotType !== "reservation");

  toolPanel.appendChild(renderInfoList([
    { label: "Active reservations", value: String(reservations.length) },
    { label: "Managed slots", value: String(managedSlots.length) },
    { label: "Unpaid courts", value: "Not connected yet" }
  ]));

  const note = document.createElement("p");
  note.className = "tool-note";
  note.textContent = "This is the future place for unpaid court warnings, balance checks, and payment follow-up.";
  toolPanel.appendChild(note);
}

function renderRulesTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const longBookings = activeBookings.filter((booking) =>
    timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime) > 90
  );
  const managedSlots = activeBookings.filter((booking) => booking.slotType !== "reservation");

  toolPanel.appendChild(renderInfoList([
    { label: "Warnings today", value: String(longBookings.length) },
    { label: "Managed blocks", value: String(managedSlots.length) },
    { label: "Rule engine", value: "Placeholder" }
  ]));

  const list = document.createElement("div");
  list.className = "tool-alert-list";

  if (longBookings.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No long-booking warnings for this date.";
    list.appendChild(emptyState);
  } else {
    longBookings.forEach((booking) => {
      const warning = document.createElement("div");
      warning.className = "tool-alert";
      warning.textContent = `${booking.displayName} is booked from ${formatTimeLabel(booking.startTime)} to ${formatTimeLabel(booking.endTime)}.`;
      list.appendChild(warning);
    });
  }

  toolPanel.appendChild(list);
}

function renderNotesTool() {
  const bookingNotes = state.bookings
    .filter((booking) => booking.notes)
    .slice(0, 5);

  const note = document.createElement("p");
  note.className = "tool-note";
  note.textContent = "Staff notes will live here later. For now, recent booking notes are shown below.";
  toolPanel.appendChild(note);

  const list = document.createElement("div");
  list.className = "tool-alert-list";

  if (bookingNotes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No booking notes for this date.";
    list.appendChild(emptyState);
  } else {
    bookingNotes.forEach((booking) => {
      const noteCard = document.createElement("div");
      noteCard.className = "tool-alert";
      noteCard.textContent = `${booking.displayName}: ${booking.notes}`;
      list.appendChild(noteCard);
    });
  }

  toolPanel.appendChild(list);
}

function renderReportsTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const cancelledBookings = state.bookings.filter((booking) => booking.status === "cancelled");
  const reservations = activeBookings.filter((booking) => booking.slotType === "reservation");
  const openTime = activeBookings.filter((booking) => booking.slotType === "open-time");

  toolPanel.appendChild(renderInfoList([
    { label: "Total items", value: String(state.bookings.length) },
    { label: "Active reservations", value: String(reservations.length) },
    { label: "Open time blocks", value: String(openTime.length) },
    { label: "Cancelled", value: String(cancelledBookings.length) }
  ]));
}

function renderAuditTool() {
  if (state.bookings.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No bookings yet for this date.";
    toolPanel.appendChild(emptyState);
    return;
  }

  const list = document.createElement("div");
  list.className = "audit-list";

  [...state.bookings]
    .sort((first, second) =>
      first.startTime.localeCompare(second.startTime) ||
      first.courtId.localeCompare(second.courtId)
    )
    .forEach((booking) => {
      const court = state.courts.find((item) => item.id === booking.courtId);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "audit-row";

      const heading = document.createElement("div");
      heading.className = "audit-row-heading";

      const name = document.createElement("strong");
      name.textContent = booking.displayName || booking.playerName || "Unknown client";

      const status = document.createElement("span");
      status.className = `status-pill ${booking.slotType !== "reservation" ? `managed-slot ${getSlotTypeClassName(booking.slotType)}` : booking.status}`;
      status.textContent = booking.slotType !== "reservation"
        ? booking.slotLabel.toLowerCase()
        : booking.status;

      heading.append(name, status);

      const details = document.createElement("span");
      details.textContent = `${court ? court.name : booking.courtId} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}`;

      const notes = document.createElement("span");
      notes.textContent = booking.notes || "No notes";

      row.append(heading, details, notes);
      row.addEventListener("click", () => loadBookingIntoForm(booking));
      list.appendChild(row);
    });

  toolPanel.appendChild(list);
}

function renderToolPanel() {
  toolPanel.innerHTML = "";
  bookingPanel.classList.toggle("hidden", state.activePanelView !== "booking");

  if (state.activePanelView === "booking") {
    toolPanel.classList.add("hidden");
    return;
  }

  const tool = PANEL_TOOLS[state.activePanelView];
  if (!tool) {
    toolPanel.classList.add("hidden");
    return;
  }

  toolPanel.classList.remove("hidden");
  renderToolPanelHeader(tool.title, tool.subtitle);

  if (state.activePanelView === "clients") {
    renderClientsTool();
  } else if (state.activePanelView === "payments") {
    renderPaymentsTool();
  } else if (state.activePanelView === "rules") {
    renderRulesTool();
  } else if (state.activePanelView === "notes") {
    renderNotesTool();
  } else if (state.activePanelView === "reports") {
    renderReportsTool();
  } else if (state.activePanelView === "audit") {
    renderAuditTool();
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function renderDemoAccounts() {
  demoAccounts.innerHTML = "";

  state.demoAccounts.forEach((account) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "demo-card";
    card.innerHTML = `
      <strong>${account.role === "staff" ? "Staff" : "Client"}</strong>
      <span>${account.name}</span>
      <span>${account.email}</span>
      <span>Password: ${account.password}</span>
    `;
    card.addEventListener("click", () => {
      loginEmail.value = account.email;
      loginPassword.value = account.password;
    });
    demoAccounts.appendChild(card);
  });
}

function hidePlayerSuggestions() {
  playerSuggestions.classList.add("hidden");
  playerNameInput.setAttribute("aria-expanded", "false");
}

function choosePlayer(client) {
  selectClient(client, { prefillBooking: true });
  hidePlayerSuggestions();
}

function renderPlayerSuggestions() {
  if (state.user?.role !== "staff" || playerNameInput.disabled) {
    hidePlayerSuggestions();
    return;
  }

  const query = playerNameInput.value.trim().toLowerCase();
  const matches = state.clients.filter((client) =>
    client.name.toLowerCase().includes(query) ||
    client.email.toLowerCase().includes(query)
  );

  playerSuggestions.innerHTML = "";

  if (matches.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "player-suggestion-empty";
    emptyState.textContent = "No matching clients";
    playerSuggestions.appendChild(emptyState);
  } else {
    matches.forEach((client) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "player-suggestion";
      button.setAttribute("role", "option");
      button.innerHTML = `<strong>${client.name}</strong><span>${client.email}</span>`;
      button.addEventListener("click", () => choosePlayer(client));
      playerSuggestions.appendChild(button);
    });
  }

  playerSuggestions.classList.remove("hidden");
  playerNameInput.setAttribute("aria-expanded", "true");
}

function renderUser() {
  if (state.user.role === "staff") {
    renderClientInfoShortcut();
  } else {
    clientInfoShortcut.classList.add("hidden");
  }

  if (state.user.role === "staff") {
    slotTypeLabel.classList.remove("hidden");
  } else {
    slotTypeLabel.classList.add("hidden");
    slotTypeSelect.value = DEFAULT_BOOKING_TYPE.slotType;
  }

  syncFormForSlotType(slotTypeSelect.value || DEFAULT_BOOKING_TYPE.slotType);
}

function getManagedSlotOptions() {
  return SLOT_ACTIONS
    .filter((action) => action.slotType && action.slotLabel)
    .map((action) => ({
      slotType: action.slotType,
      slotLabel: action.slotLabel
    }));
}

function getAllSlotTypeOptions() {
  return [DEFAULT_BOOKING_TYPE, ...getManagedSlotOptions()];
}

function getSlotTypeMeta(slotType) {
  if (!slotType || slotType === DEFAULT_BOOKING_TYPE.slotType) {
    return DEFAULT_BOOKING_TYPE;
  }

  return getManagedSlotOptions().find((option) => option.slotType === slotType) || {
    slotType,
    slotLabel: slotType
  };
}

function isManagedSlotType(slotType) {
  return slotType !== DEFAULT_BOOKING_TYPE.slotType;
}

function getSlotTypeClassName(slotType) {
  return isManagedSlotType(slotType)
    ? `slot-type-${String(slotType).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : "";
}

function getPlayerNameFieldLabel(slotType) {
  return slotType === DEFAULT_BOOKING_TYPE.slotType ? "Player name" : "Name";
}

function renderSlotTypeOptions() {
  slotTypeSelect.innerHTML = "";

  getAllSlotTypeOptions().forEach((option) => {
    const selectOption = document.createElement("option");
    selectOption.value = option.slotType;
    selectOption.textContent = option.slotLabel;
    slotTypeSelect.appendChild(selectOption);
  });
}

function syncFormForSlotType(nextType) {
  const selectedMeta = getSlotTypeMeta(nextType);

  slotTypeSelect.value = selectedMeta.slotType;
  slotTypeSelect.dataset.previousType = selectedMeta.slotType;
  slotTypeSelect.dataset.previousLabel = selectedMeta.slotLabel;
  playerNameLabel.classList.remove("hidden");
  playerNameLabelText.textContent = getPlayerNameFieldLabel(selectedMeta.slotType);

  if (state.user?.role === "staff") {
    playerNameInput.disabled = false;
    playerNameInput.required = true;
    playerCombobox.classList.remove("is-disabled");
  } else {
    playerNameLabelText.textContent = "Player name";
    playerNameInput.value = state.user?.name || "";
    playerNameInput.disabled = true;
    playerNameInput.required = false;
    playerCombobox.classList.add("is-disabled");
    hidePlayerSuggestions();
  }
}

function renderCourtOptions() {
  courtSelect.innerHTML = "";
  state.courts.forEach((court) => {
    const option = document.createElement("option");
    option.value = court.id;
    option.textContent = `${court.name} (${court.surface})`;
    courtSelect.appendChild(option);
  });
}

function renderTimeOptions() {
  startTimeSelect.innerHTML = "";
  endTimeSelect.innerHTML = "";

  timeOptions.slice(0, -1).forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = formatTimeLabel(time);
    startTimeSelect.appendChild(option);
  });

  timeOptions.slice(1).forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = formatTimeLabel(time);
    endTimeSelect.appendChild(option);
  });
}

function resetBookingForm() {
  bookingForm.reset();
  bookingIdInput.value = "";
  state.selectedBookingId = null;
  state.bookingClientId = null;
  state.openSlotMenu = null;
  setActivePanelView("booking");
  bookingPanelTitle.textContent = "Create booking";
  bookingPanelSubtitle.textContent = "Choose an open time on the grid or fill out the form.";
  cancelBookingButton.classList.add("hidden");
  courtSelect.disabled = false;
  bookingDateInput.disabled = false;
  startTimeSelect.disabled = false;
  endTimeSelect.disabled = false;
  notesInput.disabled = false;
  bookingDateInput.value = datePicker.value;
  startTimeSelect.value = "09:00";
  endTimeSelect.value = "10:00";
  slotTypeSelect.value = DEFAULT_BOOKING_TYPE.slotType;
  slotTypeSelect.disabled = state.user?.role !== "staff";
  slotTypeSelect.dataset.previousType = DEFAULT_BOOKING_TYPE.slotType;
  slotTypeSelect.dataset.previousLabel = DEFAULT_BOOKING_TYPE.slotLabel;
  if (state.user?.role === "staff") {
    const selectedClient = getSelectedClient();
    if (selectedClient) {
      state.bookingClientId = selectedClient.id;
      playerNameInput.value = selectedClient.name;
    } else {
      playerNameInput.value = "";
    }
  }
  syncFormForSlotType(DEFAULT_BOOKING_TYPE.slotType);
  setMessage(formMessage, "");
}

function getBookingsForCourt(courtId) {
  return state.bookings.filter((booking) => booking.courtId === courtId);
}

function getBookingAtSlot(courtId, time) {
  return state.bookings.find((booking) =>
    booking.courtId === courtId &&
    booking.status === "active" &&
    booking.startTime <= time &&
    booking.endTime > time
  );
}

function prefillNewBooking(courtId, startTime, slotType = DEFAULT_BOOKING_TYPE.slotType) {
  setSidePanelCollapsed(false);
  resetBookingForm();
  setActivePanelView("booking");
  state.openSlotMenu = null;
  courtSelect.value = courtId;
  bookingDateInput.value = datePicker.value;
  startTimeSelect.value = startTime;
  const startIndex = timeOptions.indexOf(startTime);
  endTimeSelect.value = timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)];
  syncFormForSlotType(slotType);
  if (state.user?.role === "staff") {
    const selectedClient = getSelectedClient();
    if (selectedClient && slotType === DEFAULT_BOOKING_TYPE.slotType) {
      state.bookingClientId = selectedClient.id;
      playerNameInput.value = selectedClient.name;
    } else {
      state.bookingClientId = null;
      playerNameInput.value = "";
    }
  }
  bookingPanelTitle.textContent = "Create booking";
  bookingPanelSubtitle.textContent = isManagedSlotType(slotType)
    ? `This slot will be saved as ${getSlotTypeMeta(slotType).slotLabel}.`
    : "This slot is open. Fill in the details and save the reservation.";
}

function focusBookingPanel(message) {
  setSidePanelCollapsed(false);
  setMessage(formMessage, message, "success");
  bookingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  if (state.user?.role === "staff") {
    playerNameInput.focus();
  } else {
    notesInput.focus();
  }
}

function openReservationForm(courtId, startTime) {
  setSchedulerMenuOpen(false);
  prefillNewBooking(courtId, startTime, DEFAULT_BOOKING_TYPE.slotType);
  buildSchedulerGrid();
  focusBookingPanel("Reservation selected. Fill in the booking details.");
}

async function createManagedSlot(courtId, startTime, action) {
  const startIndex = timeOptions.indexOf(startTime);
  const endTime = timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)];

  try {
    await fetchJson("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        date: datePicker.value,
        courtId,
        startTime,
        endTime,
        slotType: action.slotType,
        slotLabel: action.slotLabel,
        notes: action.notes || `${action.label} slot created.`
      })
    });
    state.openSlotMenu = null;
    setMessage(formMessage, `${action.label} slot created.`, "success");
    await loadBookings();
  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
}

async function handleSlotAction(action, courtId, startTime) {
  if (action.mode === "open-form") {
    prefillNewBooking(courtId, startTime, action.slotType || DEFAULT_BOOKING_TYPE.slotType);
    buildSchedulerGrid();
    focusBookingPanel(`${action.label} selected. Fill in the booking details.`);
    return;
  }

  if (action.mode === "create-slot") {
    await createManagedSlot(courtId, startTime, action);
    return;
  }

  setMessage(formMessage, `Unknown slot action: ${action.label}`, "error");
}

function loadBookingIntoForm(booking) {
  setSidePanelCollapsed(false);
  setActivePanelView("booking");
  state.selectedBookingId = booking.id;
  state.bookingClientId = booking.clientId || null;
  if (booking.clientId) {
    state.selectedClientId = booking.clientId;
    renderClientInfoShortcut();
  }
  state.openSlotMenu = null;
  bookingIdInput.value = booking.id;
  const isManagedSlot = booking.slotType !== "reservation";
  const slotLabel = booking.slotLabel || booking.displayName;
  bookingPanelTitle.textContent = booking.isOwner || state.user.role === "staff"
    ? isManagedSlot ? `Edit ${slotLabel.toLowerCase()} slot` : "Edit booking"
    : isManagedSlot ? `${slotLabel} slot` : "Booking details";
  bookingPanelSubtitle.textContent = booking.isOwner || state.user.role === "staff"
    ? "You can update or cancel this reservation."
    : "You can view this reservation block but not edit it.";
  bookingDateInput.value = booking.date;
  courtSelect.value = booking.courtId;
  startTimeSelect.value = booking.startTime;
  endTimeSelect.value = booking.endTime;
  notesInput.value = booking.notes || "";

  const canEdit = booking.isOwner || state.user.role === "staff";
  slotTypeSelect.value = booking.slotType || DEFAULT_BOOKING_TYPE.slotType;
  syncFormForSlotType(slotTypeSelect.value);
  playerNameInput.value = booking.playerName || "";
  playerNameInput.disabled = !canEdit || state.user.role !== "staff";
  playerCombobox.classList.toggle("is-disabled", playerNameInput.disabled);
  hidePlayerSuggestions();
  slotTypeSelect.disabled = !canEdit || state.user.role !== "staff";
  courtSelect.disabled = !canEdit;
  bookingDateInput.disabled = !canEdit;
  startTimeSelect.disabled = !canEdit;
  endTimeSelect.disabled = !canEdit;
  notesInput.disabled = !canEdit;
  cancelBookingButton.classList.toggle("hidden", !canEdit || booking.status !== "active");
}

function buildSchedulerGrid() {
  schedulerGrid.innerHTML = "";
  schedulerGrid.style.setProperty("--court-count", String(state.courts.length));
  schedulerGrid.style.setProperty("--rows", String(displayHours.length));

  const corner = document.createElement("div");
  corner.className = "grid-corner";
  corner.innerHTML = `<span>${new Date(`${datePicker.value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  })}</span>`;
  schedulerGrid.appendChild(corner);

  state.courts.forEach((court) => {
    const header = document.createElement("div");
    header.className = "court-header";
    header.innerHTML = `<strong>${court.name}</strong><span>${court.surface}</span>`;
    schedulerGrid.appendChild(header);
  });

  displayHours.forEach((time) => {
    const timeLabel = document.createElement("div");
    timeLabel.className = "time-label";
    timeLabel.textContent = formatTimeLabel(time);
    schedulerGrid.appendChild(timeLabel);

    state.courts.forEach((court) => {
      const slot = document.createElement("div");
      slot.className = "schedule-slot";
      slot.dataset.courtId = court.id;
      slot.dataset.time = time;

      const booking = getBookingAtSlot(court.id, time);
      if (booking) {
        slot.classList.add("booked");
        if (booking.slotType !== "reservation") {
          slot.classList.add("managed-slot");
          const slotTypeClassName = getSlotTypeClassName(booking.slotType);
          if (slotTypeClassName) {
            slot.classList.add(slotTypeClassName);
          }
        }
        if (booking.isOwner) {
          slot.classList.add("owned");
        }
        const bookingButton = document.createElement("button");
        bookingButton.type = "button";
        bookingButton.className = "slot-pill booking-block";
        const bookingMeta = booking.slotType !== DEFAULT_BOOKING_TYPE.slotType
          ? booking.slotLabel
          : `${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}`;
        bookingButton.innerHTML = `
          <strong>${booking.displayName}</strong>
          <span>${bookingMeta}</span>
          ${booking.notes ? `<small>${booking.notes}</small>` : ""}
        `;
        bookingButton.addEventListener("click", () => loadBookingIntoForm(booking));
        slot.appendChild(bookingButton);
      } else {
        slot.classList.add("available-slot");

        const reserveButton = document.createElement("button");
        reserveButton.type = "button";
        reserveButton.className = "slot-pill";
        reserveButton.innerHTML = "<span>Reserve</span>";
        reserveButton.addEventListener("click", (event) => {
          event.stopPropagation();
          openReservationForm(court.id, time);
        });
        slot.appendChild(reserveButton);

        const isMenuOpen = state.openSlotMenu &&
          state.openSlotMenu.courtId === court.id &&
          state.openSlotMenu.startTime === time;

        if (isMenuOpen) {
          const menu = document.createElement("div");
          menu.className = "slot-action-menu";

          const visibleActions = state.user?.role === "staff"
            ? SLOT_ACTIONS
            : SLOT_ACTIONS.filter((action) => action.slotType === DEFAULT_BOOKING_TYPE.slotType);

          visibleActions.forEach((action) => {
            const actionButton = document.createElement("button");
            actionButton.type = "button";
            actionButton.className = `slot-action-button ${action.tone ? `tone-${action.tone}` : ""}`.trim();
            actionButton.textContent = action.label;
            actionButton.addEventListener("click", async (event) => {
              event.stopPropagation();
              await handleSlotAction(action, court.id, time);
            });
            menu.appendChild(actionButton);
          });
          slot.appendChild(menu);
        }
      }

      schedulerGrid.appendChild(slot);
    });
  });
}

function renderAgenda() {
  bookingAgenda.innerHTML = "";

  if (state.bookings.length === 0) {
    bookingAgenda.innerHTML = `<p class="muted empty-state">No bookings yet for this date.</p>`;
    return;
  }

  state.bookings.forEach((booking) => {
    const court = state.courts.find((item) => item.id === booking.courtId);
    const card = document.createElement("button");
    card.type = "button";
    const managedSlotClassName = booking.slotType !== "reservation"
      ? `managed-slot ${getSlotTypeClassName(booking.slotType)}`
      : "";
    card.className = `agenda-card ${booking.isOwner ? "owned" : ""} ${managedSlotClassName}`.trim();
    card.innerHTML = `
      <div class="agenda-card-header">
        <strong>${booking.displayName}</strong>
        <span class="status-pill ${booking.slotType !== "reservation" ? `managed-slot ${getSlotTypeClassName(booking.slotType)}` : booking.status}">${booking.slotType !== "reservation" ? booking.slotLabel.toLowerCase() : booking.status}</span>
      </div>
      <span>${court ? court.name : booking.courtId}</span>
      <span>${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}</span>
      <span>${booking.notes || "No notes"}</span>
    `;
    card.addEventListener("click", () => loadBookingIntoForm(booking));
    bookingAgenda.appendChild(card);
  });
}

async function loadCourts() {
  const payload = await fetchJson("/api/courts");
  state.courts = payload.courts;
  renderCourtOptions();
  renderSlotTypeOptions();
}

async function loadClients() {
  if (state.user?.role !== "staff") {
    state.clients = state.user ? [{ id: state.user.id, name: state.user.name, email: state.user.email }] : [];
    renderClientInfoShortcut();
    return;
  }

  const payload = await fetchJson("/api/clients");
  state.clients = payload.clients;
  renderClientInfoShortcut();
}

async function loadBookings() {
  const payload = await fetchJson(`/api/bookings?date=${datePicker.value}`);
  state.bookings = payload.bookings;
  state.openSlotMenu = null;
  buildSchedulerGrid();
  renderAgenda();
  renderToolPanel();
}

function setSchedulerMenuOpen(isOpen) {
  if (isOpen && state.openSlotMenu) {
    state.openSlotMenu = null;
    buildSchedulerGrid();
  }

  schedulerMenuPanel.classList.toggle("hidden", !isOpen);
  schedulerMenuButton.setAttribute("aria-expanded", String(isOpen));
  schedulerMenuButton.setAttribute(
    "aria-label",
    isOpen ? "Close scheduler menu" : "Open scheduler menu"
  );
}

function handleSchedulerToolClick(view) {
  if (!PANEL_TOOLS[view]) {
    return;
  }

  state.openSlotMenu = null;
  setActivePanelView(view);
  setSidePanelCollapsed(false);
  setSchedulerMenuOpen(false);
  buildSchedulerGrid();
}

async function loadSession() {
  const payload = await fetchJson("/api/session");
  state.demoAccounts = payload.demoAccounts;
  renderDemoAccounts();
  state.user = payload.user;

  if (!state.user) {
    loginScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
    return;
  }

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  renderUser();
  await loadCourts();
  await loadClients();
  setSidePanelCollapsed(true);
  resetBookingForm();
  await loadBookings();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  setMessage(loginMessage, "");

  try {
    const payload = {
      email: loginEmail.value,
      password: loginPassword.value
    };
    await fetchJson("/api/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    loginForm.reset();
    await loadSession();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
}

async function handleLogout() {
  await fetchJson("/api/logout", { method: "POST" });
  state.user = null;
  await loadSession();
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  setMessage(formMessage, "");

  const payload = {
    date: bookingDateInput.value,
    courtId: courtSelect.value,
    startTime: startTimeSelect.value,
    endTime: endTimeSelect.value,
    notes: notesInput.value
  };

  const selectedSlotMeta = state.user.role === "staff"
    ? getSlotTypeMeta(slotTypeSelect.value)
    : DEFAULT_BOOKING_TYPE;
  payload.slotType = selectedSlotMeta.slotType;
  payload.slotLabel = selectedSlotMeta.slotLabel;

  if (state.user.role === "staff") {
    payload.playerName = playerNameInput.value.trim();
    const selectedClient = getClientById(state.bookingClientId);
    if (selectedClient && payload.playerName === selectedClient.name && payload.slotType === DEFAULT_BOOKING_TYPE.slotType) {
      payload.clientId = selectedClient.id;
    } else {
      payload.clientId = null;
      state.bookingClientId = null;
    }
  }

  const bookingId = bookingIdInput.value;
  const url = bookingId ? `/api/bookings/${bookingId}` : "/api/bookings";
  const method = bookingId ? "PATCH" : "POST";

  try {
    const payloadResult = await fetchJson(url, {
      method,
      body: JSON.stringify(payload)
    });
    resetBookingForm();
    await loadBookings();
    if (payloadResult.booking) {
      const savedBooking = state.bookings.find((booking) => booking.id === payloadResult.booking.id);
      if (savedBooking) {
        loadBookingIntoForm(savedBooking);
      }
    }
    setMessage(formMessage, bookingId ? "Booking updated." : "Booking saved.", "success");
  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
}

async function handleCancelBooking() {
  if (!bookingIdInput.value) {
    return;
  }

  try {
    await fetchJson(`/api/bookings/${bookingIdInput.value}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" })
    });
    setMessage(formMessage, "Booking cancelled.", "success");
    resetBookingForm();
    await loadBookings();
  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
}

function syncBookingDateWithPicker() {
  bookingDateInput.value = datePicker.value;
}

async function init() {
  renderTimeOptions();
  datePicker.value = getToday();
  syncBookingDateWithPicker();
  loginForm.addEventListener("submit", handleLoginSubmit);
  logoutButton.addEventListener("click", handleLogout);
  bookingForm.addEventListener("submit", handleBookingSubmit);
  sidePanelToggle.addEventListener("click", () => {
    const isCollapsed = schedulerWorkspace.classList.contains("side-panel-collapsed");
    if (isCollapsed && state.user?.role === "staff" && state.activePanelView === "booking") {
      setActivePanelView("clients");
    }
    setSidePanelCollapsed(!isCollapsed);
  });
  cancelBookingButton.addEventListener("click", handleCancelBooking);
  playerNameInput.addEventListener("focus", renderPlayerSuggestions);
  playerNameInput.addEventListener("input", renderPlayerSuggestions);
  playerNameInput.addEventListener("input", () => {
    const selectedClient = getClientById(state.bookingClientId);
    if (selectedClient && playerNameInput.value.trim() !== selectedClient.name) {
      state.bookingClientId = null;
    }
  });
  playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hidePlayerSuggestions();
    }
  });
  schedulerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setSchedulerMenuOpen(schedulerMenuPanel.classList.contains("hidden"));
  });
  schedulerMenuPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-panel-view]");
    if (!button) {
      return;
    }

    event.stopPropagation();
    handleSchedulerToolClick(button.dataset.panelView);
  });
  clientInfoShortcut.addEventListener("click", () => {
    if (state.user?.role === "staff") {
      handleSchedulerToolClick("clients");
    }
  });
  datePicker.addEventListener("change", async () => {
    syncBookingDateWithPicker();
    resetBookingForm();
    await loadBookings();
  });
  bookingDateInput.addEventListener("change", async () => {
    datePicker.value = bookingDateInput.value;
    await loadBookings();
  });
  slotTypeSelect.addEventListener("change", () => {
    syncFormForSlotType(slotTypeSelect.value);
    if (slotTypeSelect.value !== DEFAULT_BOOKING_TYPE.slotType) {
      state.bookingClientId = null;
    }
  });
  document.addEventListener("click", (event) => {
    if (!schedulerMenuPanel.classList.contains("hidden") &&
        !event.target.closest(".scheduler-menu")) {
      setSchedulerMenuOpen(false);
    }

    if (!event.target.closest(".player-combobox")) {
      hidePlayerSuggestions();
    }

    if (!state.openSlotMenu) {
      return;
    }

    const clickedInsideMenu = event.target.closest(".available-slot");
    if (clickedInsideMenu) {
      return;
    }

    state.openSlotMenu = null;
    buildSchedulerGrid();
  });

  await loadSession();
}

init().catch((error) => {
  setMessage(loginMessage, `Startup failed: ${error.message}`, "error");
});
