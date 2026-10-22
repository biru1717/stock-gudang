const express = require('express');
const path = require('path');
const app = express();

// Mengizinkan Express membaca seluruh file statis di folder utama
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});
