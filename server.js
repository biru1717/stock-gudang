const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "gudang.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS barang (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL,
  stok INTEGER NOT NULL,
  satuan TEXT NOT NULL,
  minimum INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS riwayat (
  no INTEGER PRIMARY KEY AUTOINCREMENT,
  t INTEGER,
  nama TEXT,
  satuan TEXT,
  tipe TEXT,
  qty INTEGER,
  sisa INTEGER,
  cat TEXT
);
`);

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(__dirname));

app.get("/api/data", (req, res) => {
  const items = db.prepare("SELECT id, nama, stok, satuan, minimum AS min FROM barang").all();
  const log = db.prepare("SELECT t, nama, satuan, tipe, qty, sisa, cat FROM riwayat ORDER BY no DESC").all();
  res.json({ items, log });
});

app.post("/api/data", (req, res) => {
  const { items = [], log = [] } = req.body || {};
  const simpan = db.transaction(() => {
    db.exec("DELETE FROM barang; DELETE FROM riwayat;");
    const ib = db.prepare("INSERT INTO barang (id, nama, stok, satuan, minimum) VALUES (?, ?, ?, ?, ?)");
    items.forEach((i) => ib.run(i.id, i.nama, i.stok, i.satuan, i.min));
    const ir = db.prepare("INSERT INTO riwayat (t, nama, satuan, tipe, qty, sisa, cat) VALUES (?, ?, ?, ?, ?, ?, ?)");
    log.slice().reverse().forEach((l) => ir.run(l.t, l.nama, l.satuan, l.tipe, l.qty, l.sisa, l.cat || ""));
  });
  simpan();
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));