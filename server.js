const express = require('express');
const path = require('path');
const app = express();

// Menyalurkan file statis dari folder saat ini dengan benar
app.use(express.static(__dirname));

// Rute utama website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
