const state = {
  user: null,
  courts: [],
  clients: [],
  bookings: [],
  reservationTypes: [],
  demoAccounts: [],
  selectedBookingId: null,
  openSlotMenu: null,
  activePanelView: "booking",
  clientSearchQuery: "",
  selectedClientId: null,
  bookingClientId: null,
  clientFormMode: "idle",
  bookingSearchQuery: "",
  bookingSearchStatus: "all",
  bookingSearchPayment: "all",
  bookingSearchConfirmation: "all",
  bookingSearchCourt: "all",
  bookingSearchStartDate: "",
  bookingSearchEndDate: "",
  searchBookings: [],
  editingReservationTypeId: null,
  lastRecurringResult: null
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
const RESERVATION_TYPE_OPTION_PREFIX = "reservation-type:";
const PAYMENT_STATUS_LABELS = {
  paid: "Paid",
  unpaid: "Unpaid",
  "not-required": "Not required"
};
const CONFIRMATION_STATUS_LABELS = {
  "not-reviewed": "Not reviewed",
  reviewed: "Reviewed",
  sent: "Sent manually",
  "not-needed": "Not needed"
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
  search: {
    title: "Search",
    subtitle: "Find bookings without leaving the scheduler."
  },
  bookingSetup: {
    title: "Booking Setup",
    subtitle: "Manage how courts are booked, including reservation types, lessons, events, and blocks."
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
const createClientFromBookingButton = document.getElementById("createClientFromBookingButton");
const slotTypeLabel = document.getElementById("slotTypeLabel");
const slotTypeSelect = document.getElementById("slotType");
const courtSelect = document.getElementById("courtId");
const startTimeSelect = document.getElementById("startTime");
const endTimeSelect = document.getElementById("endTime");
const notesInput = document.getElementById("notes");
const staffBookingFields = document.getElementById("staffBookingFields");
const paymentStatusSelect = document.getElementById("paymentStatus");
const confirmationStatusSelect = document.getElementById("confirmationStatus");
const confirmationTextInput = document.getElementById("confirmationText");
const generateConfirmationButton = document.getElementById("generateConfirmationButton");
const paymentEntryPanel = document.getElementById("paymentEntryPanel");
const paymentAmountInput = document.getElementById("paymentAmount");
const paymentMethodInput = document.getElementById("paymentMethod");
const paymentDateInput = document.getElementById("paymentDate");
const paymentNoteInput = document.getElementById("paymentNote");
const recordPaymentButton = document.getElementById("recordPaymentButton");
const bookingPaymentHistory = document.getElementById("bookingPaymentHistory");
const recurringBookingInput = document.getElementById("recurringBooking");
const recurringBookingLabel = document.getElementById("recurringBookingLabel");
const recurringWeeksInput = document.getElementById("recurringWeeks");
const recurringWeeksLabel = document.getElementById("recurringWeeksLabel");
const cancelReasonInput = document.getElementById("cancelReason");
const cancelReasonLabel = document.getElementById("cancelReasonLabel");
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || PAYMENT_STATUS_LABELS.unpaid;
}

function getConfirmationStatusLabel(status) {
  return CONFIRMATION_STATUS_LABELS[status] || CONFIRMATION_STATUS_LABELS["not-reviewed"];
}

function getCourtName(courtId) {
  const court = state.courts.find((item) => item.id === courtId);
  return court ? court.name : courtId;
}

function getBookingDurationMinutes(booking) {
  return timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
}

function getBookingClientKey(booking) {
  return booking.clientId || booking.ownerEmail || booking.displayName || booking.playerName || "unknown";
}

function getBookingTypeLabel(booking) {
  return booking.slotType !== DEFAULT_BOOKING_TYPE.slotType
    ? booking.slotLabel || booking.slotType
    : "Reservation";
}

function makeBookingActionRow(booking, className = "client-booking-row") {
  const row = document.createElement("button");
  row.type = "button";
  row.className = className;
  row.addEventListener("click", () => loadBookingIntoForm(booking));
  return row;
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

function getBookingPayments(booking) {
  return Array.isArray(booking?.payments) ? booking.payments : [];
}

function getBookingPaymentTotal(booking) {
  return getBookingPayments(booking)
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
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

function getClientFormValues(client = {}) {
  const address = client.address && typeof client.address === "object" ? client.address : {};
  return {
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    status: client.status || "Active",
    membershipStatus: client.membershipStatus || "Not set",
    membershipType: client.membershipType || "Not set",
    packageBalance: client.packageBalance == null ? 0 : client.packageBalance,
    packageNotes: client.packageNotes || "",
    street: address.street || "",
    city: address.city || "",
    state: address.state || "NJ",
    zip: address.zip || "",
    noteText: ""
  };
}

function renderClientForm(client = null) {
  const values = getClientFormValues(client || {});
  if (!client && state.clientSearchQuery) {
    values.name = state.clientSearchQuery;
  }
  const form = document.createElement("form");
  form.className = "client-edit-form";
  form.innerHTML = `
    <div class="tool-section-head">
      <div>
        <h3>${client ? "Edit client" : "Create client"}</h3>
        ${client ? `<p class="muted form-context">Editing ${escapeHtml(client.name)}</p>` : ""}
      </div>
      <button type="button" class="ghost-button" data-client-form-cancel>Close</button>
    </div>
    <label>
      Name
      <input type="text" name="name" required />
    </label>
    <label>
      Email
      <input type="email" name="email" />
    </label>
    <label>
      Phone
      <input type="text" name="phone" />
    </label>
    <div class="time-row">
      <label>
        Status
        <input type="text" name="status" />
      </label>
      <label>
        Membership
        <input type="text" name="membershipStatus" />
      </label>
    </div>
    <label>
      Membership type
      <input type="text" name="membershipType" />
    </label>
    <div class="time-row">
      <label>
        Package balance
        <input type="number" name="packageBalance" min="0" step="1" />
      </label>
      <label>
        Zip
        <input type="text" name="zip" />
      </label>
    </div>
    <label>
      Package notes
      <textarea name="packageNotes" rows="2"></textarea>
    </label>
    <label>
      Street
      <input type="text" name="street" />
    </label>
    <div class="time-row">
      <label>
        City
        <input type="text" name="city" />
      </label>
      <label>
        State
        <input type="text" name="state" />
      </label>
    </div>
    <label>
      Add note
      <textarea name="noteText" rows="2" placeholder="Optional new note"></textarea>
    </label>
    <div class="form-actions">
      <button type="submit">${client ? "Save client" : "Create client"}</button>
    </div>
    <p class="message" aria-live="polite"></p>
  `;

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field) {
      field.value = value;
    }
  });

  form.addEventListener("submit", (event) => handleClientFormSubmit(event, client));
  form.querySelector("[data-client-form-cancel]").addEventListener("click", () => {
    state.clientFormMode = "idle";
    renderToolPanel();
  });
  toolPanel.appendChild(form);
}

function getClientFormPayload(form) {
  const fields = form.elements;
  return {
    name: fields.namedItem("name").value,
    email: fields.namedItem("email").value,
    phone: fields.namedItem("phone").value,
    status: fields.namedItem("status").value,
    membershipStatus: fields.namedItem("membershipStatus").value,
    membershipType: fields.namedItem("membershipType").value,
    packageBalance: fields.namedItem("packageBalance").value,
    packageNotes: fields.namedItem("packageNotes").value,
    address: {
      street: fields.namedItem("street").value,
      city: fields.namedItem("city").value,
      state: fields.namedItem("state").value,
      zip: fields.namedItem("zip").value
    },
    noteText: fields.namedItem("noteText").value
  };
}

async function handleClientFormSubmit(event, client = null) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector(".message");
  setMessage(message, "");

  try {
    const url = client ? `/api/clients/${encodeURIComponent(client.id)}` : "/api/clients";
    const method = client ? "PATCH" : "POST";
    const payload = await fetchJson(url, {
      method,
      body: JSON.stringify(getClientFormPayload(form))
    });
    await loadClients();
    state.selectedClientId = payload.client.id;
    state.clientSearchQuery = payload.client.name;
    state.clientFormMode = "idle";
    renderToolPanel();
    setMessage(formMessage, client ? "Client updated." : "Client created.", "success");
  } catch (error) {
    setMessage(message, error.message, "error");
  }
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

function renderClientMembership(client) {
  const heading = document.createElement("h3");
  heading.textContent = "Membership and package";
  toolPanel.appendChild(heading);

  toolPanel.appendChild(renderInfoList([
    { label: "Membership", value: client.membershipStatus || "Not set" },
    { label: "Type", value: client.membershipType || "Not set" },
    { label: "Package balance", value: client.packageBalance == null ? "Not set" : String(client.packageBalance) },
    { label: "Package notes", value: client.packageNotes || "No package notes" }
  ]));
}

function renderClientsTool() {
  const actionRow = document.createElement("div");
  actionRow.className = "tool-action-row";

  const newClientButton = document.createElement("button");
  newClientButton.type = "button";
  newClientButton.className = "secondary-button";
  newClientButton.textContent = "New client";
  newClientButton.addEventListener("click", () => {
    state.clientFormMode = "new";
    renderToolPanel();
  });
  actionRow.appendChild(newClientButton);

  const selectedForEdit = getSelectedClient();
  if (selectedForEdit) {
    const editClientButton = document.createElement("button");
    editClientButton.type = "button";
    editClientButton.className = "secondary-button";
    editClientButton.textContent = "Edit client";
    editClientButton.addEventListener("click", () => {
      state.clientFormMode = "edit";
      renderToolPanel();
    });
    actionRow.appendChild(editClientButton);
  }

  toolPanel.appendChild(actionRow);

  if (state.clientFormMode === "new") {
    renderClientForm();
    return;
  }

  if (state.clientFormMode === "edit" && selectedForEdit) {
    renderClientForm(selectedForEdit);
    return;
  }

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
  renderClientMembership(selectedClient);
  renderClientBookingSummary(clientBookings);
  renderClientNotes(selectedClient);
  renderClientPayments(selectedClient);
}

function bookingMatchesSearchFilters(booking) {
  const query = state.bookingSearchQuery.trim().toLowerCase();
  const date = booking.date || "";
  const searchableText = [
    booking.displayName,
    booking.playerName,
    booking.ownerEmail,
    booking.notes,
    booking.reservationTypeName,
    getCourtName(booking.courtId)
  ].join(" ").toLowerCase();

  if (query && !searchableText.includes(query)) {
    return false;
  }

  if (state.bookingSearchStartDate && date < state.bookingSearchStartDate) {
    return false;
  }

  if (state.bookingSearchEndDate && date > state.bookingSearchEndDate) {
    return false;
  }

  if (state.bookingSearchStatus !== "all" && booking.status !== state.bookingSearchStatus) {
    return false;
  }

  if (state.bookingSearchPayment !== "all" &&
      (booking.paymentStatus || (booking.slotType === "reservation" ? "unpaid" : "not-required")) !== state.bookingSearchPayment) {
    return false;
  }

  if (state.bookingSearchConfirmation !== "all" &&
      (booking.confirmationStatus || (booking.slotType === "reservation" ? "not-reviewed" : "not-needed")) !== state.bookingSearchConfirmation) {
    return false;
  }

  if (state.bookingSearchCourt !== "all" && booking.courtId !== state.bookingSearchCourt) {
    return false;
  }

  return true;
}

function renderBookingSearchTool() {
  const form = document.createElement("div");
  form.className = "booking-search-form";
  form.innerHTML = `
    <label>
      Search
      <input type="search" data-booking-search="query" placeholder="Client, notes, court, or type" />
    </label>
    <div class="time-row">
      <label>
        From
        <input type="date" data-booking-search="startDate" />
      </label>
      <label>
        To
        <input type="date" data-booking-search="endDate" />
      </label>
    </div>
    <div class="time-row">
      <label>
        Status
        <select data-booking-search="status">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>
        Court
        <select data-booking-search="court">
          <option value="all">All courts</option>
        </select>
      </label>
    </div>
    <div class="time-row">
      <label>
        Payment
        <select data-booking-search="payment">
          <option value="all">All</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="not-required">Not required</option>
        </select>
      </label>
      <label>
        Confirmation
        <select data-booking-search="confirmation">
          <option value="all">All</option>
          <option value="not-reviewed">Not reviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="sent">Sent manually</option>
          <option value="not-needed">Not needed</option>
        </select>
      </label>
    </div>
    <button type="button" class="secondary-button" data-booking-search-apply>Apply filters</button>
  `;

  const courtSelectInput = form.querySelector('[data-booking-search="court"]');
  state.courts.forEach((court) => {
    const option = document.createElement("option");
    option.value = court.id;
    option.textContent = court.name;
    courtSelectInput.appendChild(option);
  });

  form.querySelector('[data-booking-search="query"]').value = state.bookingSearchQuery;
  form.querySelector('[data-booking-search="startDate"]').value = state.bookingSearchStartDate;
  form.querySelector('[data-booking-search="endDate"]').value = state.bookingSearchEndDate;
  form.querySelector('[data-booking-search="status"]').value = state.bookingSearchStatus;
  form.querySelector('[data-booking-search="payment"]').value = state.bookingSearchPayment;
  form.querySelector('[data-booking-search="confirmation"]').value = state.bookingSearchConfirmation;
  courtSelectInput.value = state.bookingSearchCourt;

  form.querySelector("[data-booking-search-apply]").addEventListener("click", () => {
    state.bookingSearchQuery = form.querySelector('[data-booking-search="query"]').value;
    state.bookingSearchStartDate = form.querySelector('[data-booking-search="startDate"]').value;
    state.bookingSearchEndDate = form.querySelector('[data-booking-search="endDate"]').value;
    state.bookingSearchStatus = form.querySelector('[data-booking-search="status"]').value;
    state.bookingSearchPayment = form.querySelector('[data-booking-search="payment"]').value;
    state.bookingSearchConfirmation = form.querySelector('[data-booking-search="confirmation"]').value;
    state.bookingSearchCourt = courtSelectInput.value;
    renderToolPanel();
  });

  toolPanel.appendChild(form);

  const results = state.searchBookings
    .filter(bookingMatchesSearchFilters)
    .sort((first, second) =>
      first.date.localeCompare(second.date) ||
      first.startTime.localeCompare(second.startTime) ||
      first.courtId.localeCompare(second.courtId)
    );

  toolPanel.appendChild(renderInfoList([
    { label: "Results", value: String(results.length) },
    { label: "Loaded bookings", value: String(state.searchBookings.length) }
  ]));

  const list = document.createElement("div");
  list.className = "client-booking-list";

  if (results.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No bookings match those filters.";
    list.appendChild(emptyState);
  } else {
    results.slice(0, 50).forEach((booking) => {
      const row = makeBookingActionRow(booking);
      row.innerHTML = `
        <strong>${escapeHtml(booking.displayName || booking.playerName || "Unknown")}</strong>
        <span>${escapeHtml(booking.date)} · ${getCourtName(booking.courtId)} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}</span>
        <span>${getBookingTypeLabel(booking)} · ${booking.status} · ${getPaymentStatusLabel(booking.paymentStatus || "unpaid")} · ${getConfirmationStatusLabel(booking.confirmationStatus || "not-reviewed")}</span>
      `;
      list.appendChild(row);
    });
  }

  toolPanel.appendChild(list);
}

function renderPaymentsTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const reservations = activeBookings.filter((booking) => booking.slotType === "reservation");
  const managedSlots = activeBookings.filter((booking) => booking.slotType !== "reservation");
  const unpaidBookings = reservations.filter((booking) =>
    (booking.paymentStatus || "unpaid") === "unpaid"
  );
  const paidBookings = reservations.filter((booking) =>
    (booking.paymentStatus || "unpaid") === "paid"
  );
  const collectedTotal = reservations.reduce((total, booking) => total + getBookingPaymentTotal(booking), 0);

  toolPanel.appendChild(renderInfoList([
    { label: "Active reservations", value: String(reservations.length) },
    { label: "Managed slots", value: String(managedSlots.length) },
    { label: "Unpaid courts", value: String(unpaidBookings.length) },
    { label: "Paid courts", value: String(paidBookings.length) },
    { label: "Recorded payments", value: formatMoney(collectedTotal) }
  ]));

  const list = document.createElement("div");
  list.className = "client-booking-list";

  if (unpaidBookings.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No unpaid reservations for this date.";
    list.appendChild(emptyState);
  } else {
    unpaidBookings
      .slice()
      .sort((first, second) =>
        first.startTime.localeCompare(second.startTime) ||
        first.courtId.localeCompare(second.courtId)
      )
      .forEach((booking) => {
        const row = makeBookingActionRow(booking);
        row.innerHTML = `
          <strong>${booking.displayName}</strong>
          <span>${getCourtName(booking.courtId)} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}</span>
          <span>${getPaymentStatusLabel(booking.paymentStatus || "unpaid")}</span>
        `;
        list.appendChild(row);
      });
  }

  toolPanel.appendChild(list);
}

function renderRulesTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const reservations = activeBookings.filter((booking) => booking.slotType === "reservation");
  const longBookings = reservations.filter((booking) => getBookingDurationMinutes(booking) > 90);
  const managedSlots = activeBookings.filter((booking) => booking.slotType !== "reservation");
  const clientCounts = reservations.reduce((counts, booking) => {
    const key = getBookingClientKey(booking);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
  const duplicateBookings = reservations.filter((booking) =>
    clientCounts.get(getBookingClientKey(booking)) > 1
  );
  const warningCount = longBookings.length + duplicateBookings.length;

  toolPanel.appendChild(renderInfoList([
    { label: "Warnings today", value: String(warningCount) },
    { label: "Long bookings", value: String(longBookings.length) },
    { label: "Duplicate client activity", value: String(duplicateBookings.length) },
    { label: "Managed blocks", value: String(managedSlots.length) },
  ]));

  const list = document.createElement("div");
  list.className = "tool-alert-list";

  if (warningCount === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No rule warnings for this date.";
    list.appendChild(emptyState);
  } else {
    longBookings.forEach((booking) => {
      const warning = document.createElement("div");
      warning.className = "tool-alert";
      warning.textContent = `Long booking: ${booking.displayName} is booked for ${getBookingDurationMinutes(booking)} minutes on ${getCourtName(booking.courtId)}.`;
      list.appendChild(warning);
    });

    duplicateBookings.forEach((booking) => {
      const warning = document.createElement("div");
      warning.className = "tool-alert";
      warning.textContent = `Duplicate activity: ${booking.displayName} has more than one reservation on this date.`;
      list.appendChild(warning);
    });
  }

  toolPanel.appendChild(list);

  if (managedSlots.length > 0) {
    const managedHeading = document.createElement("h3");
    managedHeading.textContent = "Managed blocks";
    toolPanel.appendChild(managedHeading);

    const managedList = document.createElement("div");
    managedList.className = "tool-alert-list";
    managedSlots.forEach((booking) => {
      const item = document.createElement("div");
      item.className = "tool-alert managed-alert";
      item.textContent = `${getBookingTypeLabel(booking)} · ${getCourtName(booking.courtId)} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}`;
      managedList.appendChild(item);
    });
    toolPanel.appendChild(managedList);
  }
}

function renderNotesTool() {
  const bookingNotes = state.bookings
    .filter((booking) => booking.notes)
    .slice(0, 5);
  const selectedClient = getSelectedClient();
  const clientNotes = selectedClient && Array.isArray(selectedClient.notes) ? selectedClient.notes : [];

  toolPanel.appendChild(renderInfoList([
    { label: "Booking notes", value: String(bookingNotes.length) },
    { label: "Selected client notes", value: String(clientNotes.length) }
  ]));

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
      noteCard.textContent = `Booking · ${booking.displayName} · ${getCourtName(booking.courtId)}: ${booking.notes}`;
      list.appendChild(noteCard);
    });
  }

  toolPanel.appendChild(list);

  if (selectedClient) {
    const heading = document.createElement("h3");
    heading.textContent = `${selectedClient.name} notes`;
    toolPanel.appendChild(heading);

    if (clientNotes.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "muted empty-state";
      emptyState.textContent = "No client notes for the selected client.";
      toolPanel.appendChild(emptyState);
    } else {
      const clientList = document.createElement("div");
      clientList.className = "tool-alert-list";
      clientNotes.forEach((note) => {
        const noteCard = document.createElement("div");
        noteCard.className = "tool-alert";
        noteCard.textContent = `Client · ${note.date || "No date"}: ${note.text || ""}`;
        clientList.appendChild(noteCard);
      });
      toolPanel.appendChild(clientList);
    }
  }
}

function getEditingReservationType() {
  return state.reservationTypes.find((item) => item.id === state.editingReservationTypeId) || null;
}

function formatDurationRange(reservationType) {
  if (reservationType.minDuration === reservationType.maxDuration) {
    return `${reservationType.defaultDuration} min`;
  }

  return `${reservationType.minDuration} - ${reservationType.maxDuration} min`;
}

function renderReservationTypeForm() {
  const editingReservationType = getEditingReservationType();
  const form = document.createElement("form");
  form.className = "reservation-type-form";
  form.innerHTML = `
    <div class="tool-section-head">
      <div>
        <h3>${editingReservationType ? "Edit reservation type" : "Create reservation type"}</h3>
        ${editingReservationType ? `<p class="muted form-context">Editing ${escapeHtml(editingReservationType.name)}</p>` : ""}
      </div>
      ${editingReservationType ? '<button type="button" class="ghost-button" data-reservation-type-reset>New type</button>' : ""}
    </div>
    <label>
      Name
      <input type="text" name="name" required />
    </label>
    <div class="time-row">
      <label>
        Min duration
        <input type="number" name="minDuration" min="15" step="15" required />
      </label>
      <label>
        Max duration
        <input type="number" name="maxDuration" min="15" step="15" required />
      </label>
    </div>
    <div class="time-row">
      <label>
        Default duration
        <input type="number" name="defaultDuration" min="15" step="15" required />
      </label>
      <label>
        Color
        <input type="color" name="color" />
      </label>
    </div>
    <label>
      Fee responsibility
      <input type="text" name="feeResponsibility" />
    </label>
    <div class="time-row">
      <label>
        Min players
        <input type="number" name="minPlayers" min="1" required />
      </label>
      <label>
        Max players
        <input type="number" name="maxPlayers" min="1" required />
      </label>
    </div>
    <label>
      Guest setting
      <input type="text" name="guests" />
    </label>
    <label class="checkbox-row">
      <input type="checkbox" name="isPublic" />
      Public reservation type
    </label>
    <div class="form-actions">
      <button type="submit">${editingReservationType ? "Save changes" : "Create reservation type"}</button>
    </div>
    <p class="message" aria-live="polite"></p>
  `;

  const fields = form.elements;
  fields.namedItem("name").value = editingReservationType?.name || "";
  fields.namedItem("minDuration").value = editingReservationType?.minDuration || 60;
  fields.namedItem("maxDuration").value = editingReservationType?.maxDuration || 60;
  fields.namedItem("defaultDuration").value = editingReservationType?.defaultDuration || 60;
  fields.namedItem("color").value = editingReservationType?.color || "#1492cf";
  fields.namedItem("feeResponsibility").value = editingReservationType?.feeResponsibility || "Reservation Owner";
  fields.namedItem("minPlayers").value = editingReservationType?.minPlayers || 1;
  fields.namedItem("maxPlayers").value = editingReservationType?.maxPlayers || 4;
  fields.namedItem("guests").value = editingReservationType?.guests || "Not set";
  fields.namedItem("isPublic").checked = Boolean(editingReservationType?.isPublic);

  form.addEventListener("submit", handleReservationTypeSubmit);
  form.querySelector("[data-reservation-type-reset]")?.addEventListener("click", () => {
    state.editingReservationTypeId = null;
    renderToolPanel();
  });

  toolPanel.appendChild(form);
}

function getReservationTypeFormPayload(form) {
  const fields = form.elements;
  return {
    name: fields.namedItem("name").value,
    minDuration: fields.namedItem("minDuration").value,
    maxDuration: fields.namedItem("maxDuration").value,
    defaultDuration: fields.namedItem("defaultDuration").value,
    color: fields.namedItem("color").value,
    feeResponsibility: fields.namedItem("feeResponsibility").value,
    minPlayers: fields.namedItem("minPlayers").value,
    maxPlayers: fields.namedItem("maxPlayers").value,
    guests: fields.namedItem("guests").value,
    isPublic: fields.namedItem("isPublic").checked
  };
}

async function handleReservationTypeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector(".message");
  setMessage(message, "");

  const editingReservationType = getEditingReservationType();
  const url = editingReservationType
    ? `/api/reservation-types/${encodeURIComponent(editingReservationType.id)}`
    : "/api/reservation-types";
  const method = editingReservationType ? "PATCH" : "POST";

  try {
    await fetchJson(url, {
      method,
      body: JSON.stringify(getReservationTypeFormPayload(form))
    });
    await loadReservationTypes();
    state.editingReservationTypeId = null;
    renderToolPanel();
  } catch (error) {
    setMessage(message, error.message, "error");
  }
}

async function handleReservationTypeDelete(reservationType) {
  try {
    await fetchJson(`/api/reservation-types/${encodeURIComponent(reservationType.id)}`, {
      method: "DELETE"
    });
    if (state.editingReservationTypeId === reservationType.id) {
      state.editingReservationTypeId = null;
    }
    await loadReservationTypes();
    renderToolPanel();
  } catch (error) {
    const message = toolPanel.querySelector(".reservation-type-message");
    if (message) {
      setMessage(message, error.message, "error");
    }
  }
}

function renderReservationTypeList() {
  const heading = document.createElement("div");
  heading.className = "tool-section-head";
  heading.innerHTML = "<h3>Reservation Types</h3>";
  toolPanel.appendChild(heading);

  const message = document.createElement("p");
  message.className = "message reservation-type-message";
  message.setAttribute("aria-live", "polite");
  toolPanel.appendChild(message);

  if (state.reservationTypes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No reservation types yet.";
    toolPanel.appendChild(emptyState);
    return;
  }

  const list = document.createElement("div");
  list.className = "reservation-type-list";

  state.reservationTypes.forEach((reservationType) => {
    const row = document.createElement("div");
    row.className = "reservation-type-row";
    if (reservationType.id === state.editingReservationTypeId) {
      row.classList.add("is-editing");
    }

    const badge = document.createElement("span");
    badge.className = "reservation-type-badge";
    badge.style.backgroundColor = reservationType.color || "#1492cf";
    badge.textContent = reservationType.name;

    const details = renderInfoList([
      { label: "Min/Max duration", value: formatDurationRange(reservationType) },
      { label: "Default duration", value: `${reservationType.defaultDuration} min` },
      { label: "Public", value: reservationType.isPublic ? "Yes" : "No" },
      { label: "Fee responsibility", value: reservationType.feeResponsibility || "Reservation Owner" },
      { label: "Min/Max players", value: `${reservationType.minPlayers} - ${reservationType.maxPlayers}` },
      { label: "Guest(s)", value: reservationType.guests || "Not set" }
    ]);

    const actions = document.createElement("div");
    actions.className = "reservation-type-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button";
    editButton.textContent = reservationType.id === state.editingReservationTypeId ? "Editing" : "Edit";
    editButton.disabled = reservationType.id === state.editingReservationTypeId;
    editButton.addEventListener("click", () => {
      state.editingReservationTypeId = reservationType.id;
      renderToolPanel();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => handleReservationTypeDelete(reservationType));

    actions.append(editButton, deleteButton);
    row.append(badge, details, actions);
    list.appendChild(row);
  });

  toolPanel.appendChild(list);
}

function renderBookingSetupTool() {
  renderReservationTypeList();
  renderReservationTypeForm();
}

function renderReportsTool() {
  const activeBookings = state.bookings.filter((booking) => booking.status === "active");
  const cancelledBookings = state.bookings.filter((booking) => booking.status === "cancelled");
  const reservations = activeBookings.filter((booking) => booking.slotType === "reservation");
  const managedSlots = activeBookings.filter((booking) => booking.slotType !== "reservation");
  const unpaidBookings = reservations.filter((booking) => (booking.paymentStatus || "unpaid") === "unpaid");
  const paidBookings = reservations.filter((booking) => (booking.paymentStatus || "unpaid") === "paid");
  const staffCreated = state.bookings.filter((booking) => booking.createdByRole === "staff");
  const clientCreated = state.bookings.filter((booking) => booking.createdByRole === "client");
  const collectedTotal = reservations.reduce((total, booking) => total + getBookingPaymentTotal(booking), 0);
  const notReviewed = reservations.filter((booking) => (booking.confirmationStatus || "not-reviewed") === "not-reviewed");
  const reviewed = reservations.filter((booking) => booking.confirmationStatus === "reviewed");
  const sent = reservations.filter((booking) => booking.confirmationStatus === "sent");

  toolPanel.appendChild(renderInfoList([
    { label: "Closing date", value: datePicker.value },
    { label: "Total scheduler items", value: String(state.bookings.length) },
    { label: "Active reservations", value: String(reservations.length) },
    { label: "Managed slots", value: String(managedSlots.length) },
    { label: "Cancelled", value: String(cancelledBookings.length) },
    { label: "Unpaid courts", value: String(unpaidBookings.length) },
    { label: "Paid courts", value: String(paidBookings.length) },
    { label: "Recorded payment total", value: formatMoney(collectedTotal) },
    { label: "Confirmations not reviewed", value: String(notReviewed.length) },
    { label: "Confirmations reviewed", value: String(reviewed.length) },
    { label: "Confirmations sent manually", value: String(sent.length) },
    { label: "Staff-created items", value: String(staffCreated.length) },
    { label: "Client-created items", value: String(clientCreated.length) }
  ]));

  const sections = [
    { title: "Reservations", bookings: reservations },
    { title: "Managed blocks", bookings: managedSlots },
    { title: "Cancelled", bookings: cancelledBookings }
  ];

  sections.forEach((section) => {
    const heading = document.createElement("h3");
    heading.textContent = section.title;
    toolPanel.appendChild(heading);

    const list = document.createElement("div");
    list.className = "client-booking-list";
    if (section.bookings.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "muted empty-state";
      emptyState.textContent = `No ${section.title.toLowerCase()} for this date.`;
      list.appendChild(emptyState);
    } else {
      section.bookings
        .slice()
        .sort((first, second) => first.startTime.localeCompare(second.startTime) || first.courtId.localeCompare(second.courtId))
        .forEach((booking) => {
          const row = makeBookingActionRow(booking);
          row.innerHTML = `
            <strong>${escapeHtml(booking.displayName || booking.playerName || "Unknown")}</strong>
            <span>${getCourtName(booking.courtId)} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)} · ${getBookingTypeLabel(booking)}</span>
            <span>${getPaymentStatusLabel(booking.paymentStatus || (booking.slotType === "reservation" ? "unpaid" : "not-required"))} · ${getConfirmationStatusLabel(booking.confirmationStatus || (booking.slotType === "reservation" ? "not-reviewed" : "not-needed"))} · ${formatMoney(getBookingPaymentTotal(booking))}</span>
          `;
          list.appendChild(row);
        });
    }
    toolPanel.appendChild(list);
  });
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
      row.className = `audit-row ${booking.status === "cancelled" ? "is-cancelled" : ""} ${booking.slotType !== "reservation" ? `managed-slot ${getSlotTypeClassName(booking.slotType)}` : ""}`.trim();

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
      details.textContent = `${court ? court.name : booking.courtId} · ${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)} · ${getBookingTypeLabel(booking)} · ${getPaymentStatusLabel(booking.paymentStatus || "unpaid")}`;

      const notes = document.createElement("span");
      notes.textContent = booking.cancelReason
        ? `Cancel reason: ${booking.cancelReason}`
        : booking.notes || "No notes";

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
  } else if (state.activePanelView === "search") {
    renderBookingSearchTool();
  } else if (state.activePanelView === "bookingSetup") {
    renderBookingSetupTool();
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
    staffBookingFields.classList.remove("hidden");
  } else {
    clientInfoShortcut.classList.add("hidden");
    staffBookingFields.classList.add("hidden");
  }

  if (state.user.role === "staff") {
    slotTypeLabel.classList.remove("hidden");
    createClientFromBookingButton.classList.remove("hidden");
  } else {
    slotTypeLabel.classList.add("hidden");
    createClientFromBookingButton.classList.add("hidden");
    slotTypeSelect.value = DEFAULT_BOOKING_TYPE.slotType;
  }

  syncFormForSlotType(slotTypeSelect.value || DEFAULT_BOOKING_TYPE.slotType);
}

function getManagedSlotOptions() {
  return SLOT_ACTIONS
    .filter((action) => action.slotType && action.slotLabel && action.slotType !== DEFAULT_BOOKING_TYPE.slotType)
    .map((action) => ({
      value: action.slotType,
      slotType: action.slotType,
      slotLabel: action.slotLabel
    }));
}

function getReservationTypeOptionValue(reservationTypeId) {
  return `${RESERVATION_TYPE_OPTION_PREFIX}${reservationTypeId}`;
}

function getCustomReservationTypeOptions(currentBooking = null) {
  const options = state.reservationTypes.map((reservationType) => ({
    value: getReservationTypeOptionValue(reservationType.id),
    slotType: DEFAULT_BOOKING_TYPE.slotType,
    slotLabel: DEFAULT_BOOKING_TYPE.slotLabel,
    reservationTypeId: reservationType.id,
    reservationTypeName: reservationType.name,
    reservationTypeColor: reservationType.color,
    label: reservationType.name
  }));

  if (currentBooking?.reservationTypeId &&
      !state.reservationTypes.some((item) => item.id === currentBooking.reservationTypeId)) {
    options.push({
      value: getReservationTypeOptionValue(currentBooking.reservationTypeId),
      slotType: DEFAULT_BOOKING_TYPE.slotType,
      slotLabel: DEFAULT_BOOKING_TYPE.slotLabel,
      reservationTypeId: currentBooking.reservationTypeId,
      reservationTypeName: currentBooking.reservationTypeName || "Deleted reservation type",
      reservationTypeColor: currentBooking.reservationTypeColor || "",
      label: `${currentBooking.reservationTypeName || "Deleted reservation type"} (not in setup)`
    });
  }

  return options;
}

function getAllSlotTypeOptions(currentBooking = null) {
  return [
    { ...DEFAULT_BOOKING_TYPE, value: DEFAULT_BOOKING_TYPE.slotType, label: DEFAULT_BOOKING_TYPE.slotLabel },
    ...getManagedSlotOptions().map((option) => ({ ...option, label: option.slotLabel })),
    ...getCustomReservationTypeOptions(currentBooking)
  ];
}

function getSlotTypeMeta(slotType) {
  if (!slotType || slotType === DEFAULT_BOOKING_TYPE.slotType) {
    return { ...DEFAULT_BOOKING_TYPE, value: DEFAULT_BOOKING_TYPE.slotType };
  }

  const customReservationTypeId = String(slotType).startsWith(RESERVATION_TYPE_OPTION_PREFIX)
    ? String(slotType).slice(RESERVATION_TYPE_OPTION_PREFIX.length)
    : "";
  const customReservationType = customReservationTypeId
    ? state.reservationTypes.find((item) => item.id === customReservationTypeId)
    : null;

  if (customReservationType) {
    return {
      value: getReservationTypeOptionValue(customReservationType.id),
      slotType: DEFAULT_BOOKING_TYPE.slotType,
      slotLabel: DEFAULT_BOOKING_TYPE.slotLabel,
      reservationTypeId: customReservationType.id,
      reservationTypeName: customReservationType.name,
      reservationTypeColor: customReservationType.color
    };
  }

  if (customReservationTypeId) {
    const selectOption = [...slotTypeSelect.options].find((option) => option.value === slotType);
    if (selectOption?.dataset.reservationTypeId) {
      return {
        value: slotType,
        slotType: DEFAULT_BOOKING_TYPE.slotType,
        slotLabel: DEFAULT_BOOKING_TYPE.slotLabel,
        reservationTypeId: selectOption.dataset.reservationTypeId,
        reservationTypeName: selectOption.dataset.reservationTypeName || "",
        reservationTypeColor: selectOption.dataset.reservationTypeColor || ""
      };
    }
  }

  return getManagedSlotOptions().find((option) => option.slotType === slotType) || {
    value: slotType,
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

function renderBookingTypeChip(booking) {
  if ((booking.slotType || DEFAULT_BOOKING_TYPE.slotType) !== DEFAULT_BOOKING_TYPE.slotType ||
      !booking.reservationTypeName) {
    return "";
  }

  const color = /^#[0-9a-f]{6}$/i.test(String(booking.reservationTypeColor || ""))
    ? booking.reservationTypeColor
    : "#1492cf";

  return `<span class="booking-type-chip" style="background-color: ${color};">${escapeHtml(booking.reservationTypeName)}</span>`;
}

function renderSlotTypeOptions(currentBooking = null) {
  const currentValue = slotTypeSelect.value;
  slotTypeSelect.innerHTML = "";

  getAllSlotTypeOptions(currentBooking).forEach((option) => {
    const selectOption = document.createElement("option");
    selectOption.value = option.value;
    selectOption.textContent = option.label || option.slotLabel;
    if (option.reservationTypeId) {
      selectOption.dataset.reservationTypeId = option.reservationTypeId;
      selectOption.dataset.reservationTypeName = option.reservationTypeName || "";
      selectOption.dataset.reservationTypeColor = option.reservationTypeColor || "";
    }
    slotTypeSelect.appendChild(selectOption);
  });

  if ([...slotTypeSelect.options].some((option) => option.value === currentValue)) {
    slotTypeSelect.value = currentValue;
  }
}

function syncFormForSlotType(nextType) {
  const selectedMeta = getSlotTypeMeta(nextType);
  const isStaffUser = state.user?.role === "staff";
  const isReservation = selectedMeta.slotType === DEFAULT_BOOKING_TYPE.slotType;

  slotTypeSelect.value = selectedMeta.value || selectedMeta.slotType;
  slotTypeSelect.dataset.previousType = selectedMeta.slotType;
  slotTypeSelect.dataset.previousLabel = selectedMeta.slotLabel;
  playerNameLabel.classList.remove("hidden");
  playerNameLabelText.textContent = getPlayerNameFieldLabel(selectedMeta.slotType);

  if (isStaffUser) {
    playerNameInput.disabled = false;
    playerNameInput.required = true;
    playerCombobox.classList.remove("is-disabled");
    paymentStatusSelect.value = isReservation ? (paymentStatusSelect.value || "unpaid") : "not-required";
    confirmationStatusSelect.value = isReservation ? (confirmationStatusSelect.value || "not-reviewed") : "not-needed";
    recurringBookingLabel.classList.toggle("hidden", !isReservation || Boolean(bookingIdInput.value));
    recurringWeeksLabel.classList.toggle("hidden", !isReservation || !recurringBookingInput.checked || Boolean(bookingIdInput.value));
  } else {
    playerNameLabelText.textContent = "Player name";
    playerNameInput.value = state.user?.name || "";
    playerNameInput.disabled = true;
    playerNameInput.required = false;
    playerCombobox.classList.add("is-disabled");
    recurringBookingInput.checked = false;
    recurringBookingLabel.classList.add("hidden");
    recurringWeeksLabel.classList.add("hidden");
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
  paymentStatusSelect.value = "unpaid";
  confirmationStatusSelect.value = "not-reviewed";
  confirmationTextInput.value = "";
  paymentEntryPanel.classList.add("hidden");
  paymentAmountInput.value = "";
  paymentMethodInput.value = "";
  paymentDateInput.value = datePicker.value;
  paymentNoteInput.value = "";
  renderBookingPaymentHistory(null);
  recurringBookingInput.checked = false;
  recurringWeeksInput.value = "4";
  cancelReasonInput.value = "";
  cancelReasonLabel.classList.add("hidden");
  bookingDateInput.value = datePicker.value;
  startTimeSelect.value = "09:00";
  endTimeSelect.value = "10:00";
  renderSlotTypeOptions();
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
  paymentStatusSelect.value = slotType === DEFAULT_BOOKING_TYPE.slotType ? "unpaid" : "not-required";
  confirmationStatusSelect.value = slotType === DEFAULT_BOOKING_TYPE.slotType ? "not-reviewed" : "not-needed";
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
  renderSlotTypeOptions(booking);
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
  paymentStatusSelect.value = booking.paymentStatus || (isManagedSlot ? "not-required" : "unpaid");
  confirmationStatusSelect.value = booking.confirmationStatus || (isManagedSlot ? "not-needed" : "not-reviewed");
  confirmationTextInput.value = booking.confirmationText || "";
  paymentDateInput.value = getToday();
  paymentEntryPanel.classList.toggle(
    "hidden",
    state.user.role !== "staff" || isManagedSlot || booking.status !== "active"
  );
  renderBookingPaymentHistory(booking);
  recurringBookingInput.checked = false;
  recurringWeeksLabel.classList.add("hidden");
  cancelReasonInput.value = "";
  cancelReasonLabel.classList.toggle("hidden", booking.status !== "active" || state.user.role !== "staff");

  const canEdit = booking.isOwner || state.user.role === "staff";
  const bookingTypeValue = booking.reservationTypeId
    ? getReservationTypeOptionValue(booking.reservationTypeId)
    : booking.slotType || DEFAULT_BOOKING_TYPE.slotType;
  slotTypeSelect.value = bookingTypeValue;
  syncFormForSlotType(bookingTypeValue);
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
  paymentStatusSelect.disabled = !canEdit || state.user.role !== "staff";
  confirmationStatusSelect.disabled = !canEdit || state.user.role !== "staff";
  confirmationTextInput.disabled = !canEdit || state.user.role !== "staff";
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
          <strong>${escapeHtml(booking.displayName)}</strong>
          ${renderBookingTypeChip(booking)}
          <span>${escapeHtml(bookingMeta)}</span>
          ${booking.notes ? `<small>${escapeHtml(booking.notes)}</small>` : ""}
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
    const reservationTypeChip = renderBookingTypeChip(booking);
    card.innerHTML = `
      <div class="agenda-card-header">
        <strong>${escapeHtml(booking.displayName)}</strong>
        <span class="status-pill ${booking.slotType !== "reservation" ? `managed-slot ${getSlotTypeClassName(booking.slotType)}` : booking.status}">${booking.slotType !== "reservation" ? booking.slotLabel.toLowerCase() : booking.status}</span>
      </div>
      ${reservationTypeChip}
      <span>${escapeHtml(court ? court.name : booking.courtId)}</span>
      <span>${formatTimeLabel(booking.startTime)} - ${formatTimeLabel(booking.endTime)}</span>
      <span>${escapeHtml(booking.notes || "No notes")}</span>
    `;
    card.addEventListener("click", () => loadBookingIntoForm(booking));
    bookingAgenda.appendChild(card);
  });
}

function renderBookingPaymentHistory(booking = null) {
  bookingPaymentHistory.innerHTML = "";
  const payments = getBookingPayments(booking);

  if (!booking) {
    return;
  }

  if (payments.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted empty-state";
    emptyState.textContent = "No payments recorded for this booking.";
    bookingPaymentHistory.appendChild(emptyState);
    return;
  }

  payments.forEach((payment) => {
    const row = document.createElement("div");
    row.className = "payment-history-row";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = payment.description || "Court payment";
    meta.textContent = `${payment.date || "No date"} · ${payment.method || "Method not set"} · ${payment.status || "Paid"}`;
    details.append(title, meta);

    const amount = document.createElement("strong");
    amount.textContent = formatMoney(payment.amount);
    row.append(details, amount);
    bookingPaymentHistory.appendChild(row);
  });
}

function buildConfirmationText() {
  const player = playerNameInput.value.trim() || "your reservation";
  const court = courtSelect.options[courtSelect.selectedIndex]?.textContent || "your court";
  return `Confirmation: ${player} is booked on ${bookingDateInput.value} from ${formatTimeLabel(startTimeSelect.value)} to ${formatTimeLabel(endTimeSelect.value)} on ${court}.`;
}

async function handleRecordPayment() {
  const bookingId = bookingIdInput.value;
  if (!bookingId) {
    setMessage(formMessage, "Save the booking before recording a payment.", "error");
    return;
  }

  try {
    const payload = await fetchJson(`/api/bookings/${encodeURIComponent(bookingId)}/payments`, {
      method: "POST",
      body: JSON.stringify({
        amount: paymentAmountInput.value,
        method: paymentMethodInput.value,
        date: paymentDateInput.value,
        description: `Court payment for ${bookingDateInput.value}`,
        notes: paymentNoteInput.value
      })
    });
    paymentAmountInput.value = "";
    paymentMethodInput.value = "";
    paymentNoteInput.value = "";
    await loadClients();
    await loadBookings();
    const savedBooking = state.bookings.find((booking) => booking.id === payload.booking.id);
    if (savedBooking) {
      loadBookingIntoForm(savedBooking);
    }
    setMessage(formMessage, "Payment recorded.", "success");
  } catch (error) {
    setMessage(formMessage, error.message, "error");
  }
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

async function loadReservationTypes() {
  if (state.user?.role !== "staff") {
    state.reservationTypes = [];
    renderSlotTypeOptions();
    return;
  }

  const payload = await fetchJson("/api/reservation-types");
  state.reservationTypes = payload.reservationTypes;
  renderSlotTypeOptions();
}

async function loadBookings() {
  const payload = await fetchJson(`/api/bookings?date=${datePicker.value}`);
  state.bookings = payload.bookings;
  state.openSlotMenu = null;
  buildSchedulerGrid();
  renderAgenda();
  renderToolPanel();
}

async function loadSearchBookings() {
  if (state.user?.role !== "staff") {
    state.searchBookings = [];
    return;
  }

  const payload = await fetchJson("/api/bookings");
  state.searchBookings = payload.bookings;
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

async function handleSchedulerToolClick(view) {
  if (!PANEL_TOOLS[view]) {
    return;
  }

  state.openSlotMenu = null;
  if (view === "search") {
    await loadSearchBookings();
  }
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
  await loadReservationTypes();
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
  payload.reservationTypeId = selectedSlotMeta.reservationTypeId || "";

  if (state.user.role === "staff") {
    payload.playerName = playerNameInput.value.trim();
    payload.paymentStatus = paymentStatusSelect.value;
    payload.confirmationStatus = confirmationStatusSelect.value;
    payload.confirmationText = confirmationTextInput.value;
    const selectedClient = getClientById(state.bookingClientId);
    if (selectedClient && payload.playerName === selectedClient.name && payload.slotType === DEFAULT_BOOKING_TYPE.slotType) {
      payload.clientId = selectedClient.id;
    } else {
      payload.clientId = null;
      state.bookingClientId = null;
    }
  }

  const bookingId = bookingIdInput.value;
  const isRecurringCreate = !bookingId &&
    state.user.role === "staff" &&
    recurringBookingInput.checked &&
    payload.slotType === DEFAULT_BOOKING_TYPE.slotType;
  const url = isRecurringCreate ? "/api/recurring-bookings" : bookingId ? `/api/bookings/${bookingId}` : "/api/bookings";
  const method = bookingId ? "PATCH" : "POST";

  if (isRecurringCreate) {
    payload.weeks = recurringWeeksInput.value;
  }

  try {
    const payloadResult = await fetchJson(url, {
      method,
      body: JSON.stringify(payload)
    });
    resetBookingForm();
    await loadBookings();
    if (payloadResult.bookings) {
      state.lastRecurringResult = payloadResult;
      const conflictText = payloadResult.conflicts?.length
        ? ` ${payloadResult.conflicts.length} date(s) had conflicts.`
        : "";
      setMessage(formMessage, `${payloadResult.bookings.length} recurring booking(s) saved.${conflictText}`, "success");
    } else if (payloadResult.booking) {
      const savedBooking = state.bookings.find((booking) => booking.id === payloadResult.booking.id);
      if (savedBooking) {
        loadBookingIntoForm(savedBooking);
      }
      setMessage(formMessage, bookingId ? "Booking updated." : "Booking saved.", "success");
    } else {
      setMessage(formMessage, "Booking saved.", "success");
    }
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
      body: JSON.stringify({
        status: "cancelled",
        cancelReason: cancelReasonInput.value
      })
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
  generateConfirmationButton.addEventListener("click", () => {
    confirmationTextInput.value = buildConfirmationText();
    if (confirmationStatusSelect.value === "not-reviewed") {
      confirmationStatusSelect.value = "reviewed";
    }
  });
  recordPaymentButton.addEventListener("click", handleRecordPayment);
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
  createClientFromBookingButton.addEventListener("click", () => {
    if (state.user?.role !== "staff") {
      return;
    }

    state.clientFormMode = "new";
    state.clientSearchQuery = playerNameInput.value.trim();
    handleSchedulerToolClick("clients");
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
    const selectedMeta = getSlotTypeMeta(slotTypeSelect.value);
    syncFormForSlotType(slotTypeSelect.value);
    if (selectedMeta.slotType !== DEFAULT_BOOKING_TYPE.slotType) {
      state.bookingClientId = null;
    }
  });
  recurringBookingInput.addEventListener("change", () => {
    recurringWeeksLabel.classList.toggle("hidden", !recurringBookingInput.checked || Boolean(bookingIdInput.value));
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
