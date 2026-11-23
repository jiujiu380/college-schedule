const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "dist");
const dest = path.join(__dirname, "web");
if (!fs.existsSync(src)) {
  console.error("dist not found, run expo export first");
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("web copied", dest);
