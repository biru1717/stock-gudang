const express = require('express');
const path = require('path');
const app = express();

// Menyalurkan folder statis utama agar folder 'css' dan 'js' terbaca
app.use(express.static(path.join(__dirname)));

// Menampilkan halaman utama (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
