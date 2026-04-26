# Court Booking MVP

This is a simple CourtReserve-style internal scheduler with a basic login flow.

## What it can do right now

- Show an eight-court scheduler grid
- Log in as either staff or a client
- Let staff see full booking details
- Let clients see their own bookings and reserved blocks on other courts
- Create, edit, and cancel bookings
- Prevent double-booking on the same court and time
- Save bookings locally in `data/bookings.json`

## Demo accounts

- Staff: `staff@wotc.local` / `demo123`
- Client: `client@wotc.local` / `demo123`

## Why this version is still simple

This starter avoids outside libraries so it can run with the tools already available in this workspace.

- `server.js` runs the app, handles login, and saves data
- `public/index.html` contains the login screen and scheduler layout
- `public/styles.css` styles the scheduler and side panels
- `public/script.js` handles login, bookings, and scheduler interactions

## How to run it

From this folder:

```bash
/Applications/Codex.app/Contents/Resources/node server.js
```

If port `3000` or `3001` is already in use, choose another one:

```bash
PORT=3002 /Applications/Codex.app/Contents/Resources/node server.js
```

Then open the matching local address in Chrome.

## Good next upgrades

- Real user management stored outside the code
- Recurring reservations
- Blocking maintenance times
- Member profiles
- Pricing and payment tracking
- Notifications and confirmations
