const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, createHash } = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const BOOKINGS_FILE = path.join(__dirname, "data", "bookings.json");
const CLIENTS_FILE = path.join(__dirname, "data", "clients.json");
const SESSION_COOKIE_NAME = "court_booking_session";

const COURTS = Array.from({ length: 11 }, (_, index) => {
  const courtNumber = index + 1;
  return {
    id: `court-${courtNumber}`,
    name: `Tennis Court #${courtNumber}`,
    surface: "Tennis"
  };
});

const USERS = [
  {
    id: "staff-1",
    role: "staff",
    name: "Front Desk",
    email: "staff@wotc.local",
    password: "demo123"
  },
  {
    id: "client-1",
    role: "client",
    name: "Thiago Member",
    email: "client@wotc.local",
    password: "demo123"
  }
];

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

function writeClients(clients) {
  return writeJsonArray(CLIENTS_FILE, "clients", clients);
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

  return USERS.find((user) => user.id === session.userId) || null;
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

function sanitizeBookingForViewer(booking, viewer) {
  const isOwner = viewer && (
    booking.userId === viewer.id ||
    booking.clientId === viewer.id ||
    booking.ownerEmail === viewer.email
  );
  const slotType = booking.slotType || "reservation";
  const slotLabel = booking.slotLabel ||
    (slotType !== "reservation" ? booking.playerName || "Unavailable" : "Reserved");
  const isManagedSlot = slotType !== "reservation";
  const canViewDetails = viewer && (viewer.role === "staff" || isOwner);
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
    cancelledAt: booking.cancelledAt || null,
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
  sendJson(response, 200, {
    user: user ? normalizeUser(user) : null,
    demoAccounts: USERS.map((item) => ({
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
    const user = USERS.find((candidate) =>
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

  sendJson(response, 200, { clients: readClients() });
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

    const slotType = typeof payload.slotType === "string" && payload.slotType.trim()
      ? payload.slotType.trim().toLowerCase()
      : "reservation";
    const slotLabel = typeof payload.slotLabel === "string" && payload.slotLabel.trim()
      ? payload.slotLabel.trim()
      : slotType === "reservation"
        ? "Reserved"
        : "Unavailable";
    const selectedClient = user.role === "staff" && slotType === "reservation"
      ? findClientById(payload.clientId)
      : null;
    const playerName = selectedClient
      ? selectedClient.name
      : user.role === "staff"
      ? String(payload.playerName || "").trim()
      : user.name;

    if (!playerName) {
      sendJson(response, 400, { error: "Player name is required." });
      return;
    }

    const proposedBooking = {
      id: randomUUID(),
      date: payload.date,
      courtId: payload.courtId,
      playerName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      notes: String(payload.notes || "").trim(),
      status: "active",
      slotType,
      slotLabel,
      createdAt: new Date().toISOString(),
      userId: user.id,
      ownerEmail: user.email,
      createdByRole: user.role
    };

    if (selectedClient) {
      proposedBooking.clientId = selectedClient.id;
      proposedBooking.ownerEmail = selectedClient.email;
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

    const userCanEdit = user.role === "staff" || booking.userId === user.id;
    if (!userCanEdit) {
      sendJson(response, 403, { error: "You do not have permission to edit this booking." });
      return;
    }

    if (payload.status === "cancelled") {
      booking.status = "cancelled";
      booking.cancelledAt = new Date().toISOString();
    } else {
      const updatedSlotType = typeof payload.slotType === "string" && payload.slotType.trim()
        ? payload.slotType.trim().toLowerCase()
        : (booking.slotType || "reservation");
      const updatedSlotLabel = typeof payload.slotLabel === "string" && payload.slotLabel.trim()
        ? payload.slotLabel.trim()
        : (booking.slotLabel || (updatedSlotType === "reservation" ? "Reserved" : "Unavailable"));
      const selectedClient = user.role === "staff" && updatedSlotType === "reservation"
        ? findClientById(payload.clientId)
        : null;
      const updatedBooking = {
        ...booking,
        date: payload.date || booking.date,
        courtId: payload.courtId || booking.courtId,
        startTime: payload.startTime || booking.startTime,
        endTime: payload.endTime || booking.endTime,
        notes: typeof payload.notes === "string" ? payload.notes.trim() : booking.notes,
        playerName: selectedClient
          ? selectedClient.name
          : user.role === "staff" && typeof payload.playerName === "string"
          ? String(payload.playerName).trim()
          : booking.playerName,
        slotType: updatedSlotType,
        slotLabel: updatedSlotLabel,
        status: payload.status || booking.status
      };

      if (selectedClient) {
        updatedBooking.clientId = selectedClient.id;
        updatedBooking.ownerEmail = selectedClient.email;
      } else if (user.role === "staff" && updatedSlotType === "reservation" && "clientId" in payload) {
        delete updatedBooking.clientId;
      } else if (updatedSlotType !== "reservation") {
        delete updatedBooking.clientId;
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

  if (request.method === "GET" && url.pathname === "/api/bookings") {
    handleGetBookings(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/bookings") {
    await handleCreateBooking(request, response);
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

server.listen(PORT, () => {
  console.log(`[INFO] Court booking MVP running at http://localhost:${PORT}`);
});
