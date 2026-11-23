const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "web");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let file = path.join(root, urlPath);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(root, "index.html");
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

app.whenReady().then(async () => {
  const port = await startServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 980,
    minHeight: 700,
    title: "知酷课程表",
    icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true,
    backgroundColor: "#F5F6FA",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadURL("http://127.0.0.1:" + port);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
});

app.on("window-all-closed", () => app.quit());
