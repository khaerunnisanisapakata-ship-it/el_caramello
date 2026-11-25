const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const ROOT = __dirname;
const PHOTO_DIR = path.join(ROOT, "photos");
fs.mkdirSync(PHOTO_DIR, { recursive: true });

app.use(express.json({ limit: "15mb" }));
app.use(express.static(ROOT));
app.use("/photos", express.static(PHOTO_DIR));

app.post("/api/save", (req, res) => {
  try {
    const data = req.body && req.body.image;
    if (typeof data !== "string" || !data.startsWith("data:image/png;base64,")) {
      return res.status(400).json({ error: "Format foto tidak valid." });
    }
    const base64 = data.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: "Ukuran foto terlalu besar." });
    }
    const id = crypto.randomUUID();
    const filename = `${id}.png`;
    fs.writeFileSync(path.join(PHOTO_DIR, filename), buffer);
    const baseUrl = (PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const photoUrl = `${baseUrl}/photos/${filename}`;
    res.json({ photoUrl, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Foto gagal disimpan." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`El Caramelo Photobooth berjalan di http://localhost:${PORT}`);
  console.log("Untuk scan QR dengan HP, buka alamat IP komputer dari HP yang memakai Wi-Fi yang sama.");
});