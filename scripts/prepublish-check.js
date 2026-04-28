const { execFileSync } = require("node:child_process");

function run(command, args) {
  console.log(`> ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}

run(process.execPath, ["--check", "server.js"]);
run(process.execPath, ["--check", "public/script.js"]);
run("git", ["status", "--short", "data/bookings.json", "data/clients.json", "data/users.json"]);
