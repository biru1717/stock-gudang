// --- 1. INISIALISASI DATA LOCALSTORAGE ---
let listBarang = JSON.parse(localStorage.getItem('stok_barang')) || [];

window.onload = function() {
    setupTombol();
    tampilkanData();
};

// --- 2. PENYIMPANAN KE BROWSER ---
function simpanKeStorage() {
    localStorage.setItem('stok_barang', JSON.stringify(listBarang));
}

// --- 3. SETUP TOMBOL INTERAKTIF ---
function setupTombol() {
    const tombolList = document.querySelectorAll('button');
    
    tombolList.forEach(btn => {
        const teks = btn.textContent.toLowerCase();
        
        if (teks.includes('tambah barang')) {
            btn.onclick = function() {
                let nama = prompt("Masukkan Nama Barang:");
                if (!nama) return;
                let jenis = prompt("Masukkan Jenis/Kategori Barang:") || "Umum";
                let jumlah = parseInt(prompt("Masukkan Jumlah Stok:")) || 0;
                
                // Tambahkan data baru ke array
                listBarang.push({
                    id: Date.now(),
                    nama: nama,
                    jenis: jenis,
                    jumlah: jumlah
                });
                
                simpanKeStorage();
                tampilkanData();
            };
        }
        
        if (teks.includes('catat transaksi')) {
            btn.onclick = function() {
                alert("Fitur Catat Transaksi aktif!");
            };
        }
    });
}

// --- 4. MENAMPILKAN DATA KE LAYAR ---
function tampilkanData() {
    updateStatistik();

    // Cari area kosong di bawah search bar untuk menampilkan daftar barang
    let container = document.getElementById('area-tabel-barang');
    
    if (!container) {
        const searchBar = document.querySelector('input[type="text"], input[placeholder*="Cari"]');
        if (searchBar && searchBar.parentElement) {
            container = document.createElement('div');
            container.id = 'area-tabel-barang';
            container.style.marginTop = '20px';
            searchBar.parentElement.insertAdjacentElement('afterend', container);
        }
    }

    if (!container) return;

    if (listBarang.length === 0) {
        container.innerHTML = `
            <div style="background: #1e293b; padding: 40px; border-radius: 12px; text-align: center; color: #94a3b8; margin-top: 20px;">
                <p>Belum ada barang. Mulai dengan menambahkan barang pertama.</p>
            </div>`;
        return;
    }

    // Render daftar barang
    let html = '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">';
    listBarang.forEach((item) => {
        html += `
            <div style="background: #1e293b; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; color: white;">
                <div>
                    <strong style="font-size: 16px;">${item.nama}</strong>
                    <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Jenis: ${item.jenis} | Stok: <span style="color: #38bdf8; font-weight: bold;">${item.jumlah}</span></div>
                </div>
                <button onclick="hapusBarang(${item.id})" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">Hapus</button>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

// --- 5. HAPUS BARANG ---
function hapusBarang(id) {
    listBarang = listBarang.filter(item => item.id !== id);
    simpanKeStorage();
    tampilkanData();
}

// --- 6. UPDATE ANGKA STATISTIK DI DASHBOARD ---
function updateStatistik() {
    const totalJenis = listBarang.length;
    const stokMenipis = listBarang.filter(item => item.jumlah > 0 && item.jumlah <= 5).length;
    const stokHabis = listBarang.filter(item => item.jumlah === 0).length;

    const semuaElement = document.querySelectorAll('div, section, p, span');

    semuaElement.forEach(el => {
        const teks = el.innerText ? el.innerText.trim().toLowerCase() : '';

        if (teks.includes('jenis barang')) {
            const angkaNode = Array.from(el.querySelectorAll('*')).find(child => !isNaN(child.innerText) && child.children.length === 0);
            if (angkaNode) angkaNode.innerText = totalJenis;
        }

        if (teks.includes('stok menipis')) {
            const angkaNode = Array.from(el.querySelectorAll('*')).find(child => !isNaN(child.innerText) && child.children.length === 0);
            if (angkaNode) angkaNode.innerText = stokMenipis;
        }

        if (teks.includes('stok habis')) {
            const angkaNode = Array.from(el.querySelectorAll('*')).find(child => !isNaN(child.innerText) && child.children.length === 0);
            if (angkaNode) angkaNode.innerText = stokHabis;
        }
    });
}
