const state = {
  user: null,
  courts: [],
  bookings: [],
  demoAccounts: [],
  selectedBookingId: null,
  openSlotMenu: null
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

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");
const demoAccounts = document.getElementById("demoAccounts");
const datePicker = document.getElementById("datePicker");
const userName = document.getElementById("userName");
const userMeta = document.getElementById("userMeta");
const logoutButton = document.getElementById("logoutButton");
const schedulerGrid = document.getElementById("schedulerGrid");
const scheduleHint = document.getElementById("scheduleHint");
const bookingAgenda = document.getElementById("bookingAgenda");
const bookingForm = document.getElementById("bookingForm");
const bookingIdInput = document.getElementById("bookingId");
const bookingDateInput = document.getElementById("bookingDate");
const playerNameInput = document.getElementById("playerName");
const playerNameLabel = document.getElementById("playerNameLabel");
const playerNameLabelText = document.getElementById("playerNameLabelText");
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
const resetFormButton = document.getElementById("resetFormButton");
const bookingPanel = document.querySelector(".booking-panel");

function getToday() {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split("T")[0];
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

function renderUser() {
  userName.textContent = state.user.name;
  userMeta.textContent = `${state.user.role === "staff" ? "Staff view" : "Client view"} · ${state.user.email}`;

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
  } else {
    playerNameLabelText.textContent = "Player name";
    playerNameInput.value = state.user?.name || "";
    playerNameInput.disabled = true;
    playerNameInput.required = false;
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
  state.openSlotMenu = null;
  bookingPanelTitle.textContent = "Create booking";
  bookingPanelSubtitle.textContent = "Choose an open time on the grid or fill out the form.";
  cancelBookingButton.classList.add("hidden");
  resetFormButton.classList.remove("hidden");
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
    playerNameInput.value = "";
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
  resetBookingForm();
  state.openSlotMenu = null;
  courtSelect.value = courtId;
  bookingDateInput.value = datePicker.value;
  startTimeSelect.value = startTime;
  const startIndex = timeOptions.indexOf(startTime);
  endTimeSelect.value = timeOptions[Math.min(startIndex + 1, timeOptions.length - 1)];
  syncFormForSlotType(slotType);
  if (state.user?.role === "staff") {
    playerNameInput.value = "";
  }
  bookingPanelTitle.textContent = "Create booking";
  bookingPanelSubtitle.textContent = isManagedSlotType(slotType)
    ? `This slot will be saved as ${getSlotTypeMeta(slotType).slotLabel}.`
    : "This slot is open. Fill in the details and save the reservation.";
}

function focusBookingPanel(message) {
  setMessage(formMessage, message, "success");
  bookingPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  if (state.user?.role === "staff") {
    playerNameInput.focus();
  } else {
    notesInput.focus();
  }
}

function setOpenSlotMenu(courtId, startTime) {
  const nextMenu = state.openSlotMenu &&
    state.openSlotMenu.courtId === courtId &&
    state.openSlotMenu.startTime === startTime
    ? null
    : { courtId, startTime };

  state.openSlotMenu = nextMenu;
  buildSchedulerGrid();
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
  state.selectedBookingId = booking.id;
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
        bookingButton.className = "slot-pill";
        bookingButton.innerHTML = `<span>${booking.displayName}</span>`;
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
          setOpenSlotMenu(court.id, time);
        });
        slot.appendChild(reserveButton);

        const isMenuOpen = state.openSlotMenu &&
          state.openSlotMenu.courtId === court.id &&
          state.openSlotMenu.startTime === time;

        if (isMenuOpen) {
          const menu = document.createElement("div");
          menu.className = "slot-action-menu";

          SLOT_ACTIONS.forEach((action) => {
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

async function loadBookings() {
  const payload = await fetchJson(`/api/bookings?date=${datePicker.value}`);
  state.bookings = payload.bookings;
  state.openSlotMenu = null;
  buildSchedulerGrid();
  renderAgenda();
  scheduleHint.textContent = state.user.role === "staff"
    ? `Staff can click Reserve to choose ${SLOT_ACTIONS.map((action) => action.label).join(" or ")}, or click any booking to edit it.`
    : "Clients can click their own bookings to edit them and open slots to reserve.";
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
  }

  const bookingId = bookingIdInput.value;
  const url = bookingId ? `/api/bookings/${bookingId}` : "/api/bookings";
  const method = bookingId ? "PATCH" : "POST";

  try {
    await fetchJson(url, {
      method,
      body: JSON.stringify(payload)
    });
    setMessage(formMessage, bookingId ? "Booking updated." : "Booking saved.", "success");
    resetBookingForm();
    await loadBookings();
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
  cancelBookingButton.addEventListener("click", handleCancelBooking);
  resetFormButton.addEventListener("click", resetBookingForm);
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
  });
  document.addEventListener("click", (event) => {
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
