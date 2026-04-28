# Pre-Publish Checklist

Run this before pushing booking app changes.

```bash
/Applications/Codex.app/Contents/Resources/node scripts/prepublish-check.js
```

Review the output carefully:

- `data/bookings.json` changes are usually local test bookings. Only push them when the current booking data is intentionally part of the app state.
- `data/clients.json` is the local client seed file for this MVP. Review any client changes before pushing.
- `data/users.json` is the local demo login seed file. Review any account changes before pushing.
- Confirm staff login, client lookup, booking create/edit/cancel, and the right-side panel still work locally.
