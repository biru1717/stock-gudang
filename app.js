// --- PERBAIKAN TOTAL TOMBOL INTERAKTIF ---
window.onload = function() {
    // Cari semua tombol di halaman
    const tombolList = document.querySelectorAll('button');
    
    tombolList.forEach(btn => {
        const teks = btn.textContent.toLowerCase();
        
        // Jika tombol untuk menambah barang ditekan
        if (teks.includes('tambah barang')) {
            btn.onclick = function() {
                let nama = prompt("Nama Barang:");
                if (!nama) return;
                let jenis = prompt("Jenis/Kategori Barang:");
                let jumlah = parseInt(prompt("Jumlah Stok:")) || 0;
                
                // Simpan data ke array & LocalStorage
                listBarang.push({
                    id: Date.now(),
                    nama: nama,
                    jenis: jenis || 'Umum',
                    jumlah: jumlah
                });
                simpanKeStorage();
                tampilkanData();
            };
        }
        
        // Jika tombol catat transaksi ditekan
        if (teks.includes('catat transaksi')) {
            btn.onclick = function() {
                alert("Fitur Catat Transaksi aktif! Gunakan menu stok untuk update data.");
            };
        }
    });

    if (typeof tampilkanData === 'function') {
        tampilkanData();
    }
};
