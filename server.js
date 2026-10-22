const express = require('express');
const path = require('path');
const app = express();

// Menyalurkan file dan folder statis (termasuk css dan js)
app.use(express.static(path.join(__dirname)));

// Menampilkan halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
