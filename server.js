const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, createHash } = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const BOOKINGS_FILE = path.join(__dirname, "data", "bookings.json");
const CLIENTS_FILE = path.join(__dirname, "data", "clients.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");
const RESERVATION_TYPES_FILE = path.join(__dirname, "data", "reservation-types.json");
const SESSION_COOKIE_NAME = "court_booking_session";
const VALID_PAYMENT_STATUSES = new Set(["paid", "unpaid", "not-required"]);
const VALID_CONFIRMATION_STATUSES = new Set(["not-reviewed", "reviewed", "not-needed"]);

const COURTS = Array.from({ length: 11 }, (_, index) => {
  const courtNumber = index + 1;
  return {
    id: `court-${courtNumber}`,
    name: `Tennis Court #${courtNumber}`,
    surface: "Tennis"
  };
});

const sessions = new Map();

function readJsonArray(filePath, label) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`[ERROR] Failed to read ${label} file:`, error.message);
    return [];
  }
}

function writeJsonArray(filePath, label, items) {
  const directory = path.dirname(filePath);
  const temporaryFile = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(temporaryFile, JSON.stringify(items, null, 2));
    fs.renameSync(temporaryFile, filePath);
    return { ok: true };
  } catch (error) {
    console.error(`[ERROR] Failed to write ${label} file:`, error.message);
    try {
      if (fs.existsSync(temporaryFile)) {
        fs.unlinkSync(temporaryFile);
      }
    } catch (cleanupError) {
      console.error(`[ERROR] Failed to clean up temporary ${label} file:`, cleanupError.message);
    }
    return { ok: false, error };
  }
}

function readBookings() {
  return readJsonArray(BOOKINGS_FILE, "bookings");
}

function writeBookings(bookings) {
  return writeJsonArray(BOOKINGS_FILE, "bookings", bookings);
}

function readClients() {
  return readJsonArray(CLIENTS_FILE, "clients");
}

function readUsers() {
  const users = readJsonArray(USERS_FILE, "users");
  const validUsers = users.filter((user) =>
    user &&
    typeof user.id === "string" &&
    typeof user.role === "string" &&
    typeof user.email === "string" &&
    typeof user.password === "string"
  );

  if (users.length !== validUsers.length) {
    console.error("[ERROR] Some users in data/users.json are missing id, role, email, or password.");
  }

  return validUsers;
}

function readReservationTypes() {
  return readJsonArray(RESERVATION_TYPES_FILE, "reservation types")
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string");
}

function writeReservationTypes(reservationTypes) {
  return writeJsonArray(RESERVATION_TYPES_FILE, "reservation types", reservationTypes);
}

function findUserById(userId) {
  return readUsers().find((user) => user.id === userId) || null;
}

function findClientById(clientId) {
  if (!clientId) {
    return null;
  }

  return readClients().find((client) => client.id === clientId) || null;
}

function parseCookies(request) {
  const cookieHeader = request.headers.cookie || "";
  return cookieHeader.split(";").reduce((accumulator, piece) => {
    const [rawName, ...rest] = piece.trim().split("=");
    if (!rawName) {
      return accumulator;
    }

    accumulator[rawName] = decodeURIComponent(rest.join("="));
    return accumulator;
  }, {});
}

function getSessionUser(request) {
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  const session = sessionToken ? sessions.get(sessionToken) : null;

  if (!session) {
    return null;
  }

  return findUserById(session.userId);
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8"
  };

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("File not found.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    response.end(contents);
  });
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error("Invalid JSON payload."));
      }
    });

    request.on("error", reject);
  });
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function normalizeUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email
  };
}

function isStaff(user) {
  return user && user.role === "staff";
}

function normalizeChoice(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function slugifyReservationTypeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeReservationTypePayload(payload, existingReservationType = null) {
  const name = String(payload.name || existingReservationType?.name || "").trim();
  const minDuration = parsePositiveNumber(payload.minDuration, existingReservationType?.minDuration || 60);
  const maxDuration = Math.max(
    minDuration,
    parsePositiveNumber(payload.maxDuration, existingReservationType?.maxDuration || minDuration)
  );
  const defaultDuration = Math.min(
    maxDuration,
    Math.max(minDuration, parsePositiveNumber(payload.defaultDuration, existingReservationType?.defaultDuration || minDuration))
  );
  const minPlayers = parsePositiveNumber(payload.minPlayers, existingReservationType?.minPlayers || 1);
  const maxPlayers = Math.max(
    minPlayers,
    parsePositiveNumber(payload.maxPlayers, existingReservationType?.maxPlayers || minPlayers)
  );
  const color = /^#[0-9a-f]{6}$/i.test(String(payload.color || ""))
    ? String(payload.color).trim()
    : existingReservationType?.color || "#1492cf";

  return {
    id: existingReservationType?.id || `${slugifyReservationTypeName(name) || "reservation-type"}-${randomUUID().slice(0, 8)}`,
    name,
    minDuration,
    maxDuration,
    defaultDuration,
    isPublic: Boolean(payload.isPublic ?? existingReservationType?.isPublic ?? false),
    feeResponsibility: String(payload.feeResponsibility || existingReservationType?.feeResponsibility || "Reservation Owner").trim(),
    minPlayers,
    maxPlayers,
    guests: String(payload.guests || existingReservationType?.guests || "Not set").trim(),
    color
  };
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getBookingOwnerClientId(booking) {
  return booking.clientId || booking.userId || null;
}

function requireAuth(request, response) {
  const user = getSessionUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Please log in first." });
    return null;
  }

  return user;
}

function isTimeRangeValid(startTime, endTime) {
  return typeof startTime === "string" &&
    typeof endTime === "string" &&
    /^\d{2}:\d{2}$/.test(startTime) &&
    /^\d{2}:\d{2}$/.test(endTime) &&
    startTime < endTime;
}

function overlapsExistingBooking(existingBooking, proposedBooking) {
  if (existingBooking.status !== "active") {
    return false;
  }

  return existingBooking.courtId === proposedBooking.courtId &&
    existingBooking.date === proposedBooking.date &&
    proposedBooking.startTime < existingBooking.endTime &&
    proposedBooking.endTime > existingBooking.startTime;
}

function canViewBookingDetails(booking, viewer) {
  if (!viewer) {
    return false;
  }

  return isStaff(viewer) ||
    booking.userId === viewer.id ||
    booking.clientId === viewer.id ||
    booking.ownerEmail === viewer.email;
}

function normalizeBookingPayload(payload, user, existingBooking = null) {
  const requestedSlotType = typeof payload.slotType === "string" && payload.slotType.trim()
    ? payload.slotType.trim().toLowerCase()
    : existingBooking?.slotType || "reservation";
  const slotType = isStaff(user) ? requestedSlotType : "reservation";
  const slotLabel = typeof payload.slotLabel === "string" && payload.slotLabel.trim()
    ? payload.slotLabel.trim()
    : slotType === "reservation"
      ? "Reservation"
      : "Unavailable";
  const selectedClient = isStaff(user) && slotType === "reservation"
    ? findClientById(payload.clientId)
    : null;
  const playerName = selectedClient
    ? selectedClient.name
    : isStaff(user)
    ? String(payload.playerName || existingBooking?.playerName || "").trim()
    : user.name;
  const reservationTypeId = isStaff(user) && slotType === "reservation" && typeof payload.reservationTypeId === "string"
    ? payload.reservationTypeId.trim()
    : existingBooking?.reservationTypeId || "";
  const reservationType = reservationTypeId
    ? readReservationTypes().find((item) => item.id === reservationTypeId) || null
    : null;

  return {
    date: payload.date || existingBooking?.date,
    courtId: payload.courtId || existingBooking?.courtId,
    playerName,
    startTime: payload.startTime || existingBooking?.startTime,
    endTime: payload.endTime || existingBooking?.endTime,
    notes: typeof payload.notes === "string" ? payload.notes.trim() : existingBooking?.notes || "",
    slotType,
    slotLabel,
    reservationType,
    reservationTypeId: reservationType
      ? reservationType.id
      : reservationTypeId && existingBooking?.reservationTypeId === reservationTypeId
        ? existingBooking.reservationTypeId
        : "",
    reservationTypeName: reservationType
      ? reservationType.name
      : reservationTypeId
        ? existingBooking?.reservationTypeName || ""
        : "",
    reservationTypeColor: reservationType
      ? reservationType.color
      : reservationTypeId
        ? existingBooking?.reservationTypeColor || ""
        : "",
    selectedClient,
    paymentStatus: normalizeChoice(
      payload.paymentStatus || existingBooking?.paymentStatus,
      VALID_PAYMENT_STATUSES,
      slotType === "reservation" ? "unpaid" : "not-required"
    ),
    confirmationStatus: normalizeChoice(
      payload.confirmationStatus || existingBooking?.confirmationStatus,
      VALID_CONFIRMATION_STATUSES,
      slotType === "reservation" ? "not-reviewed" : "not-needed"
    ),
    confirmationText: typeof payload.confirmationText === "string"
      ? payload.confirmationText.trim()
      : existingBooking?.confirmationText || ""
  };
}

function sanitizeBookingForViewer(booking, viewer) {
  const isOwner = viewer && (
    booking.userId === viewer.id ||
    getBookingOwnerClientId(booking) === viewer.id ||
    booking.ownerEmail === viewer.email
  );
  const slotType = booking.slotType || "reservation";
  const slotLabel = booking.slotLabel ||
    (slotType !== "reservation" ? booking.playerName || "Unavailable" : "Reserved");
  const isManagedSlot = slotType !== "reservation";
  const canViewDetails = canViewBookingDetails(booking, viewer);
  const displayName = isManagedSlot
    ? booking.playerName || slotLabel
    : canViewDetails
      ? booking.playerName
      : "Reserved";

  return {
    id: booking.id,
    date: booking.date,
    courtId: booking.courtId,
    playerName: displayName,
    displayName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    notes: isManagedSlot || canViewDetails ? booking.notes : "",
    status: booking.status,
    slotType,
    slotLabel,
    createdAt: booking.createdAt,
    reservationTypeId: booking.reservationTypeId || null,
    reservationTypeName: booking.reservationTypeName || "",
    reservationTypeColor: booking.reservationTypeColor || "",
    cancelledAt: booking.cancelledAt || null,
    cancelledBy: canViewDetails ? booking.cancelledBy || null : null,
    cancelReason: canViewDetails ? booking.cancelReason || "" : "",
    paymentStatus: canViewDetails ? booking.paymentStatus || (isManagedSlot ? "not-required" : "unpaid") : null,
    confirmationStatus: canViewDetails ? booking.confirmationStatus || (isManagedSlot ? "not-needed" : "not-reviewed") : null,
    confirmationText: canViewDetails ? booking.confirmationText || "" : "",
    recurrenceId: canViewDetails ? booking.recurrenceId || null : null,
    roleVisibility: canViewDetails ? "full" : "limited",
    isOwner,
    clientId: canViewDetails ? booking.clientId || null : null,
    ownerEmail: canViewDetails ? booking.ownerEmail : null,
    createdByRole: booking.createdByRole
  };
}

function findBookingById(bookings, bookingId) {
  return bookings.find((booking) => booking.id === bookingId);
}

function handleGetSession(request, response) {
  const user = getSessionUser(request);
  const users = readUsers();
  sendJson(response, 200, {
    user: user ? normalizeUser(user) : null,
    demoAccounts: users.map((item) => ({
      role: item.role,
      name: item.name,
      email: item.email,
      password: item.password
    }))
  });
}

async function handleLogin(request, response) {
  try {
    const payload = await parseBody(request);
    const user = readUsers().find((candidate) =>
      candidate.email.toLowerCase() === String(payload.email || "").trim().toLowerCase() &&
      hashPassword(candidate.password) === hashPassword(String(payload.password || ""))
    );

    if (!user) {
      sendJson(response, 401, { error: "Invalid email or password." });
      return;
    }

    const sessionToken = randomUUID();
    sessions.set(sessionToken, {
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    sendJson(
      response,
      200,
      { user: normalizeUser(user) },
      {
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${sessionToken}; HttpOnly; Path=/; SameSite=Lax`
      }
    );
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

function handleLogout(request, response) {
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (sessionToken) {
    sessions.delete(sessionToken);
  }

  sendJson(
    response,
    200,
    { ok: true },
    {
      "Set-Cookie": `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    }
  );
}

function handleGetCourts(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  sendJson(response, 200, { courts: COURTS, user: normalizeUser(user) });
}

function handleGetClients(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  const clients = readClients();
  if (isStaff(user)) {
    sendJson(response, 200, { clients });
    return;
  }

  sendJson(response, 200, {
    clients: clients.filter((client) => client.id === user.id || client.email === user.email)
  });
}

function handleGetReservationTypes(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  if (!isStaff(user)) {
    sendJson(response, 403, { error: "Only staff can manage reservation types." });
    return;
  }

  sendJson(response, 200, { reservationTypes: readReservationTypes() });
}

async function handleCreateReservationType(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  if (!isStaff(user)) {
    sendJson(response, 403, { error: "Only staff can manage reservation types." });
    return;
  }

  try {
    const payload = await parseBody(request);
    const reservationType = normalizeReservationTypePayload(payload);

    if (!reservationType.name) {
      sendJson(response, 400, { error: "Reservation type name is required." });
      return;
    }

    const reservationTypes = readReservationTypes();
    reservationTypes.push(reservationType);

    const writeResult = writeReservationTypes(reservationTypes);
    if (!writeResult.ok) {
      sendJson(response, 500, {
        error: `Unable to save reservation type right now: ${writeResult.error.message}`
      });
      return;
    }

    sendJson(response, 201, { reservationType });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

async function handleUpdateReservationType(request, response, reservationTypeId) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  if (!isStaff(user)) {
    sendJson(response, 403, { error: "Only staff can manage reservation types." });
    return;
  }

  try {
    const payload = await parseBody(request);
    const reservationTypes = readReservationTypes();
    const currentIndex = reservationTypes.findIndex((item) => item.id === reservationTypeId);

    if (currentIndex === -1) {
      sendJson(response, 404, { error: "Reservation type not found." });
      return;
    }

    const reservationType = normalizeReservationTypePayload(payload, reservationTypes[currentIndex]);

    if (!reservationType.name) {
      sendJson(response, 400, { error: "Reservation type name is required." });
      return;
    }

    reservationTypes[currentIndex] = reservationType;
    const writeResult = writeReservationTypes(reservationTypes);
    if (!writeResult.ok) {
      sendJson(response, 500, {
        error: `Unable to update reservation type right now: ${writeResult.error.message}`
      });
      return;
    }

    sendJson(response, 200, { reservationType });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

function handleDeleteReservationType(request, response, reservationTypeId) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  if (!isStaff(user)) {
    sendJson(response, 403, { error: "Only staff can manage reservation types." });
    return;
  }

  const reservationTypes = readReservationTypes();
  const nextReservationTypes = reservationTypes.filter((item) => item.id !== reservationTypeId);

  if (nextReservationTypes.length === reservationTypes.length) {
    sendJson(response, 404, { error: "Reservation type not found." });
    return;
  }

  const writeResult = writeReservationTypes(nextReservationTypes);
  if (!writeResult.ok) {
    sendJson(response, 500, {
      error: `Unable to delete reservation type right now: ${writeResult.error.message}`
    });
    return;
  }

  sendJson(response, 200, { ok: true });
}

function handleGetBookings(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedDate = url.searchParams.get("date");
  const bookings = readBookings()
    .filter((booking) => !requestedDate || booking.date === requestedDate)
    .filter((booking) => isStaff(user) || canViewBookingDetails(booking, user))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.courtId.localeCompare(b.courtId);
    })
    .map((booking) => sanitizeBookingForViewer(booking, user));

  sendJson(response, 200, { bookings, user: normalizeUser(user) });
}

async function handleCreateBooking(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  try {
    const payload = await parseBody(request);
    const requiredFields = ["date", "courtId", "startTime", "endTime"];
    const missingField = requiredFields.find((field) => !payload[field]);

    if (missingField) {
      sendJson(response, 400, { error: `Missing required field: ${missingField}` });
      return;
    }

    if (!COURTS.some((court) => court.id === payload.courtId)) {
      sendJson(response, 400, { error: "Selected court does not exist." });
      return;
    }

    if (!isTimeRangeValid(payload.startTime, payload.endTime)) {
      sendJson(response, 400, {
        error: "Time range is invalid. Use HH:MM and make sure end is after start."
      });
      return;
    }

    const requestedSlotType = String(payload.slotType || "reservation").trim().toLowerCase();
    if (!isStaff(user) && requestedSlotType !== "reservation") {
      sendJson(response, 403, { error: "Only staff can create managed court blocks." });
      return;
    }
    const normalized = normalizeBookingPayload(payload, user);

    if (payload.reservationTypeId && !normalized.reservationType) {
      sendJson(response, 400, { error: "Selected reservation type does not exist." });
      return;
    }

    if (!normalized.playerName) {
      sendJson(response, 400, { error: "Player name is required." });
      return;
    }

    const proposedBooking = {
      id: randomUUID(),
      date: normalized.date,
      courtId: normalized.courtId,
      playerName: normalized.playerName,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      notes: String(payload.notes || "").trim(),
      status: "active",
      slotType: normalized.slotType,
      slotLabel: normalized.slotLabel,
      reservationTypeId: normalized.reservationTypeId,
      reservationTypeName: normalized.reservationTypeName,
      reservationTypeColor: normalized.reservationTypeColor,
      paymentStatus: normalized.paymentStatus,
      confirmationStatus: normalized.confirmationStatus,
      confirmationText: normalized.confirmationText,
      createdAt: new Date().toISOString(),
      userId: user.id,
      ownerEmail: user.email,
      createdByRole: user.role
    };

    if (normalized.selectedClient) {
      proposedBooking.clientId = normalized.selectedClient.id;
      proposedBooking.ownerEmail = normalized.selectedClient.email;
    }

    const bookings = readBookings();
    const conflictingBooking = bookings.find((booking) => overlapsExistingBooking(booking, proposedBooking));

    if (conflictingBooking) {
      sendJson(response, 409, {
        error: "That court is already booked during the selected time."
      });
      return;
    }

    bookings.push(proposedBooking);

    const writeResult = writeBookings(bookings);
    if (!writeResult.ok) {
      sendJson(response, 500, {
        error: `Unable to save booking right now: ${writeResult.error.message}`
      });
      return;
    }

    sendJson(response, 201, { booking: sanitizeBookingForViewer(proposedBooking, user) });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

async function handleCreateRecurringBookings(request, response) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  if (!isStaff(user)) {
    sendJson(response, 403, { error: "Only staff can create recurring reservations." });
    return;
  }

  try {
    const payload = await parseBody(request);
    const weeks = Math.max(1, Math.min(Number(payload.weeks || 1), 26));
    const normalized = normalizeBookingPayload({
      ...payload,
      slotType: "reservation",
      slotLabel: "Reservation"
    }, user);
    const requiredFields = ["date", "courtId", "startTime", "endTime"];
    const missingField = requiredFields.find((field) => !normalized[field]);

    if (missingField) {
      sendJson(response, 400, { error: `Missing required field: ${missingField}` });
      return;
    }

    if (!normalized.playerName) {
      sendJson(response, 400, { error: "Player name is required." });
      return;
    }

    if (payload.reservationTypeId && !normalized.reservationType) {
      sendJson(response, 400, { error: "Selected reservation type does not exist." });
      return;
    }

    if (!COURTS.some((court) => court.id === normalized.courtId)) {
      sendJson(response, 400, { error: "Selected court does not exist." });
      return;
    }

    if (!isTimeRangeValid(normalized.startTime, normalized.endTime)) {
      sendJson(response, 400, {
        error: "Time range is invalid. Use HH:MM and make sure end is after start."
      });
      return;
    }

    const recurrenceId = randomUUID();
    const now = new Date().toISOString();
    const bookings = readBookings();
    const created = [];
    const conflicts = [];

    for (let index = 0; index < weeks; index += 1) {
      const proposedBooking = {
        id: randomUUID(),
        date: addDays(normalized.date, index * 7),
        courtId: normalized.courtId,
        playerName: normalized.playerName,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        notes: normalized.notes,
        status: "active",
        slotType: "reservation",
        slotLabel: "Reservation",
        reservationTypeId: normalized.reservationTypeId,
        reservationTypeName: normalized.reservationTypeName,
        reservationTypeColor: normalized.reservationTypeColor,
        paymentStatus: normalized.paymentStatus,
        confirmationStatus: normalized.confirmationStatus,
        confirmationText: normalized.confirmationText,
        recurrenceId,
        createdAt: now,
        userId: user.id,
        ownerEmail: normalized.selectedClient ? normalized.selectedClient.email : user.email,
        createdByRole: user.role
      };

      if (normalized.selectedClient) {
        proposedBooking.clientId = normalized.selectedClient.id;
      }

      const conflictingBooking = bookings.find((booking) => overlapsExistingBooking(booking, proposedBooking));
      if (conflictingBooking) {
        conflicts.push({
          date: proposedBooking.date,
          courtId: proposedBooking.courtId,
          startTime: proposedBooking.startTime,
          endTime: proposedBooking.endTime
        });
        continue;
      }

      bookings.push(proposedBooking);
      created.push(proposedBooking);
    }

    if (created.length === 0) {
      sendJson(response, 409, {
        error: "No recurring bookings were created because every date had a conflict.",
        conflicts
      });
      return;
    }

    const writeResult = writeBookings(bookings);
    if (!writeResult.ok) {
      sendJson(response, 500, {
        error: `Unable to save recurring bookings right now: ${writeResult.error.message}`
      });
      return;
    }

    sendJson(response, 201, {
      bookings: created.map((booking) => sanitizeBookingForViewer(booking, user)),
      conflicts
    });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

async function handleUpdateBooking(request, response, bookingId) {
  const user = requireAuth(request, response);
  if (!user) {
    return;
  }

  try {
    const payload = await parseBody(request);
    const bookings = readBookings();
    const booking = findBookingById(bookings, bookingId);

    if (!booking) {
      sendJson(response, 404, { error: "Booking not found." });
      return;
    }

    const userCanEdit = isStaff(user) || (booking.userId === user.id && (booking.slotType || "reservation") === "reservation");
    if (!userCanEdit) {
      sendJson(response, 403, { error: "You do not have permission to edit this booking." });
      return;
    }

    if (payload.status === "cancelled") {
      booking.status = "cancelled";
      booking.cancelledAt = new Date().toISOString();
      booking.cancelledBy = user.name;
      booking.cancelReason = String(payload.cancelReason || "").trim();
    } else {
      const requestedSlotType = String(payload.slotType || booking.slotType || "reservation").trim().toLowerCase();
      if (!isStaff(user) && requestedSlotType !== "reservation") {
        sendJson(response, 403, { error: "Only staff can manage court blocks." });
        return;
      }
      const normalized = normalizeBookingPayload(payload, user, booking);

      if (payload.reservationTypeId && !normalized.reservationType &&
          payload.reservationTypeId !== booking.reservationTypeId) {
        sendJson(response, 400, { error: "Selected reservation type does not exist." });
        return;
      }

      const updatedBooking = {
        ...booking,
        date: normalized.date,
        courtId: normalized.courtId,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        notes: normalized.notes,
        playerName: normalized.playerName,
        slotType: normalized.slotType,
        slotLabel: normalized.slotLabel,
        reservationTypeId: normalized.reservationTypeId,
        reservationTypeName: normalized.reservationTypeName,
        reservationTypeColor: normalized.reservationTypeColor,
        paymentStatus: isStaff(user) ? normalized.paymentStatus : booking.paymentStatus,
        confirmationStatus: isStaff(user) ? normalized.confirmationStatus : booking.confirmationStatus,
        confirmationText: isStaff(user) ? normalized.confirmationText : booking.confirmationText,
        status: payload.status || booking.status
      };

      if (normalized.selectedClient) {
        updatedBooking.clientId = normalized.selectedClient.id;
        updatedBooking.ownerEmail = normalized.selectedClient.email;
      } else if (isStaff(user) && normalized.slotType === "reservation" && "clientId" in payload) {
        delete updatedBooking.clientId;
      } else if (normalized.slotType !== "reservation") {
        delete updatedBooking.clientId;
        delete updatedBooking.reservationTypeId;
        delete updatedBooking.reservationTypeName;
        delete updatedBooking.reservationTypeColor;
      }

      if (!updatedBooking.playerName) {
        sendJson(response, 400, { error: "Player name is required." });
        return;
      }

      if (!COURTS.some((court) => court.id === updatedBooking.courtId)) {
        sendJson(response, 400, { error: "Selected court does not exist." });
        return;
      }

      if (!isTimeRangeValid(updatedBooking.startTime, updatedBooking.endTime)) {
        sendJson(response, 400, {
          error: "Time range is invalid. Use HH:MM and make sure end is after start."
        });
        return;
      }

      const conflictingBooking = bookings.find((item) =>
        item.id !== booking.id && overlapsExistingBooking(item, updatedBooking)
      );

      if (conflictingBooking) {
        sendJson(response, 409, {
          error: "That court is already booked during the selected time."
        });
        return;
      }

      Object.assign(booking, updatedBooking);
      if (!updatedBooking.clientId) {
        delete booking.clientId;
      }
      if (booking.status !== "cancelled") {
        delete booking.cancelledAt;
        delete booking.cancelledBy;
        delete booking.cancelReason;
      }
    }

    const writeResult = writeBookings(bookings);
    if (!writeResult.ok) {
      sendJson(response, 500, {
        error: `Unable to update booking right now: ${writeResult.error.message}`
      });
      return;
    }

    sendJson(response, 200, { booking: sanitizeBookingForViewer(booking, user) });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/session") {
    handleGetSession(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    await handleLogin(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/logout") {
    handleLogout(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/courts") {
    handleGetCourts(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/clients") {
    handleGetClients(request, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/reservation-types") {
    handleGetReservationTypes(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reservation-types") {
    await handleCreateReservationType(request, response);
    return;
  }

  if (url.pathname.startsWith("/api/reservation-types/")) {
    const reservationTypeId = decodeURIComponent(url.pathname.split("/").pop());

    if (request.method === "PATCH") {
      await handleUpdateReservationType(request, response, reservationTypeId);
      return;
    }

    if (request.method === "DELETE") {
      handleDeleteReservationType(request, response, reservationTypeId);
      return;
    }
  }

  if (request.method === "GET" && url.pathname === "/api/bookings") {
    handleGetBookings(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/bookings") {
    await handleCreateBooking(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/recurring-bookings") {
    await handleCreateRecurringBookings(request, response);
    return;
  }

  if (request.method === "PATCH" && url.pathname.startsWith("/api/bookings/")) {
    const bookingId = url.pathname.split("/").pop();
    await handleUpdateBooking(request, response, bookingId);
    return;
  }

  const safePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden.");
    return;
  }

  sendFile(response, filePath);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${PORT} is already in use. Start with another port, for example: PORT=${PORT + 1} node server.js`);
    return;
  }

  console.error("[ERROR] Server failed to start:", error.message);
});

server.listen(PORT, () => {
  console.log(`[INFO] Court booking MVP running at http://localhost:${PORT}`);
});
