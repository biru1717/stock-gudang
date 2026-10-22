// --- 1. INISIALISASI DATA LOCALSTORAGE ---
let listBarang = JSON.parse(localStorage.getItem('stok_barang')) || [];
let riwayatTrx = JSON.parse(localStorage.getItem('riwayat_trx')) || [];
let activeTab = 'stok';

window.onload = function() {
    initApp();
};
// --- 1. INISIALISASI DATA LOCALSTORAGE ---
let listBarang = JSON.parse(localStorage.getItem('stok_barang')) || [];
let riwayatTrx = JSON.parse(localStorage.getItem('riwayat_trx')) || [];
let activeTab = 'stok';

window.onload = function() {
    initApp();
};

function simpanData() {
    localStorage.setItem('stok_barang', JSON.stringify(listBarang));
    localStorage.setItem('riwayat_trx', JSON.stringify(riwayatTrx));
}

// --- 2. INISIALISASI UTAMA & EVENT LISTENER ---
function initApp() {
    tampilkanData();
    updateStatistik();

    // Tombol Tambah Barang
    const btnAdd = document.getElementById('btnAdd');
    const dItem = document.getElementById('dItem');
    const fItem = document.getElementById('fItem');

    if (btnAdd && dItem) {
        btnAdd.onclick = () => {
            document.getElementById('tItemT').textContent = 'Tambah barang';
            fItem.reset();
            dItem.showModal();
        };
    }

    const cancelItem = dItem?.querySelector('.cancel');
    if (cancelItem) {
        cancelItem.onclick = () => dItem.close();
    }

    // Submit Form Tambah Barang
    if (fItem) {
        fItem.onsubmit = (e) => {
            e.preventDefault();
            const nama = document.getElementById('iNama').value;
            const desc = document.getElementById('iDesc').value || '-';
            const stok = parseInt(document.getElementById('iStok').value) || 0;
            const satuan = document.getElementById('iSatuan').value || 'pcs';
            const batasMin = parseInt(document.getElementById('iMin').value) || 5;

            const barangBaru = {
                id: Date.now(),
                nama: nama,
                deskripsi: desc,
                stok: stok,
                satuan: satuan,
                min: batasMin
            };

            listBarang.push(barangBaru);
            
            // Catat ke riwayat
            riwayatTrx.push({
                tipe: 'tambah barang baru',
                namaBarang: nama,
                jumlah: stok,
                satuan: satuan,
                tanggal: new Date().toLocaleString()
            });

            simpanData();
            tampilkanData();
            updateStatistik();
            dItem.close();
        };
    }

    // Tab Navigasi
    const tabs = document.querySelectorAll('#tabs button');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('on'));
            tab.classList.add('on');
            activeTab = tab.getAttribute('data-tab');
            tampilkanData();
        };
    });

    // Pencarian
    const searchInput = document.getElementById('q');
    if (searchInput) {
        searchInput.oninput = () => {
            tampilkanData(searchInput.value);
        };
    }
}

// --- 3. MENAMPILKAN DATA KE LAYAR ---
function tampilkanData(keyword = '') {
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
        let filtered = listBarang.filter(item => item.nama.toLowerCase().includes(keyword.toLowerCase()));

        if (filtered.length === 0) {
            main.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px;">Belum ada barang. Mulai dengan menambahkan barang pertama.</div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">';
        filtered.forEach(item => {
            let statusWarna = item.stok <= item.min ? '#f59e0b' : '#38bdf8';
            if (item.stok === 0) statusWarna = '#ef4444';

            html += `
                <div style="background: #1e293b; padding: 15px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; color: white;">
                    <div>
                        <strong style="font-size: 16px;">${item.nama}</strong>
                        <div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">Ket: ${item.deskripsi}</div>
                        <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
                            Stok: <span style="color: ${statusWarna}; font-weight: bold;">${item.stok} ${item.satuan}</span> 
                            (Min: ${item.min})
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button onclick="ubahStok(${item.id}, -1)" title="Kurangi Stok" style="background: #334155; color: white; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold;">-</button>
                        <button onclick="ubahStok(${item.id}, 1)" title="Tambah Stok" style="background: #334155; color: white; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-weight: bold;">+</button>
                        <button onclick="hapusBarang(${item.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-left: 6px;">Hapus</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        main.innerHTML = html;

    } else if (activeTab === 'riwayat') {
        if (riwayatTrx.length === 0) {
            main.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px;">Belum ada riwayat transaksi.</div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
        riwayatTrx.slice().reverse().forEach(trx => {
            html += `
                <div style="background: #1e293b; padding: 12px 18px; border-radius: 8px; color: white; font-size: 14px;">
                    <div><b>${trx.tipe.toUpperCase()}</b> - ${trx.namaBarang} (${trx.jumlah} ${trx.satuan || ''})</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${trx.tanggal}</div>
                </div>
            `;
        });
        html += '</div>';
        main.innerHTML = html;
    }
}

// --- 4. FITUR TAMBAH / KURANG STOK LANGSUNG ---
function ubahStokid(id, jumlahUbah) {
    // Fungsi pembantu jika terpanggil
}

function ubahStok(id, jumlahUbah) {
    const barang = listBarang.find(item => item.id === id);
    if (!barang) return;

    if (barang.stok + jumlahUbah < 0) {
        alert("Stok tidak boleh kurang dari 0!");
        return;
    }

    barang.stok += jumlahUbah;

    // Catat ke riwayat
    riwayatTrx.push({
        tipe: jumlahUbah > 0 ? 'tambah stok' : 'kurang stok',
        namaBarang: barang.nama,
        jumlah: Math.abs(jumlahUbah),
        satuan: barang.satuan,
        tanggal: new Date().toLocaleString()
    });

    simpanData();
    tampilkanData();
    updateStatistik();
}

// --- 5. HAPUS BARANG ---
function hapusBarang(id) {
    listBarang = listBarang.filter(item => item.id !== id);
    simpanData();
    tampilkanData();
    updateStatistik();
}

// --- 6. UPDATE ANGKA STATISTIK ATAS ---
function updateStatistik() {
    const sTotal = document.getElementById('sTotal');
    const sLow = document.getElementById('sLow');
    const sOut = document.getElementById('sOut');

    const totalJenis = listBarang.length;
    const stokMenipis = listBarang.filter(item => item.stok > 0 && item.stok <= item.min).length;
    const stokHabis = listBarang.filter(item => item.stok === 0).length;

    if (sTotal) sTotal.textContent = totalJenis;
    if (sLow) sLow.textContent = stokMenipis;
    if (sOut) sOut.textContent = stokHabis;
}
function simpanData() {
    localStorage.setItem('stok_barang', JSON.stringify(listBarang));
    localStorage.setItem('riwayat_trx', JSON.stringify(riwayatTrx));
}

// --- 2. INISIALISASI UTAMA & EVENT LISTENER ---
function initApp() {
    tampilkanData();
    updateStatistik();

    // Tombol Tambah Barang (Membuka dialog/modal dItem)
    const btnAdd = document.getElementById('btnAdd');
    const dItem = document.getElementById('dItem');
    const fItem = document.getElementById('fItem');

    if (btnAdd && dItem) {
        btnAdd.onclick = () => {
            document.getElementById('tItemT').textContent = 'Tambah barang';
            fItem.reset();
            dItem.showModal();
        };
    }

    // Tombol Batal di dalam dialog dItem
    const cancelItem = dItem?.querySelector('.cancel');
    if (cancelItem) {
        cancelItem.onclick = () => dItem.close();
    }

    // Submit form tambah barang
    if (fItem) {
        fItem.onsubmit = (e) => {
            e.preventDefault();
            const nama = document.getElementById('iNama').value;
            const stok = parseInt(document.getElementById('iStok').value) || 0;
            const satuan = document.getElementById('iSatuan').value || 'pcs';
            const batasMin = parseInt(document.getElementById('iMin').value) || 5;

            const barangBaru = {
                id: Date.now(),
                nama: nama,
                stok: stok,
                satuan: satuan,
                min: batasMin
            };

            listBarang.push(barangBaru);
            simpanData();
            tampilkanData();
            updateStatistik();
            dItem.close();
        };
    }

    // Tab Stok & Riwayat
    const tabs = document.querySelectorAll('#tabs button');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('on'));
            tab.classList.add('on');
            activeTab = tab.getAttribute('data-tab');
            tampilkanData();
        };
    });

    // Fitur Pencarian
    const searchInput = document.getElementById('q');
    if (searchInput) {
        searchInput.oninput = () => {
            tampilkanData(searchInput.value);
        };
    }
}

// --- 3. MENAMPILKAN DATA KE ELEMENT <main id="main"> ---
function tampilkanData(keyword = '') {
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
        let filtered = listBarang.filter(item => item.nama.toLowerCase().includes(keyword.toLowerCase()));

        if (filtered.length === 0) {
            main.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px;">Belum ada barang. Mulai dengan menambahkan barang pertama.</div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">';
        filtered.forEach(item => {
            let statusWarna = item.stok <= item.min ? '#f59e0b' : '#38bdf8';
            if (item.stok === 0) statusWarna = '#ef4444';

            html += `
                <div style="background: #1e293b; padding: 15px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; color: white;">
                    <div>
                        <strong style="font-size: 16px;">${item.nama}</strong>
                        <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                            Stok: <span style="color: ${statusWarna}; font-weight: bold;">${item.stok} ${item.satuan}</span> 
                            (Min: ${item.min})
                        </div>
                    </div>
                    <button onclick="hapusBarang(${item.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Hapus</button>
                </div>
            `;
        });
        html += '</div>';
        main.innerHTML = html;

    } else if (activeTab === 'riwayat') {
        if (riwayatTrx.length === 0) {
            main.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 40px;">Belum ada riwayat transaksi.</div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
        riwayatTrx.slice().reverse().forEach(trx => {
            html += `
                <div style="background: #1e293b; padding: 12px 18px; border-radius: 8px; color: white; font-size: 14px;">
                    <div><b>${trx.tipe.toUpperCase()}</b> - ${trx.namaBarang} (${trx.jumlah} ${trx.satuan})</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${trx.tanggal}</div>
                </div>
            `;
        });
        html += '</div>';
        main.innerHTML = html;
    }
}

// --- 4. HAPUS BARANG ---
function hapusBarang(id) {
    listBarang = listBarang.filter(item => item.id !== id);
    simpanData();
    tampilkanData();
    updateStatistik();
}

// --- 5. UPDATE ANGKA STATISTIK ATAS ---
function updateStatistik() {
    const sTotal = document.getElementById('sTotal');
    const sLow = document.getElementById('sLow');
    const sOut = document.getElementById('sOut');

    const totalJenis = listBarang.length;
    const stokMenipis = listBarang.filter(item => item.stok > 0 && item.stok <= item.min).length;
    const stokHabis = listBarang.filter(item => item.stok === 0).length;

    if (sTotal) sTotal.textContent = totalJenis;
    if (sLow) sLow.textContent = stokMenipis;
    if (sOut) sOut.textContent = stokHabis;
}
