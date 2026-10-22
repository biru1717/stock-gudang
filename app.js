// --- 1. INISIALISASI & NORMALISASI DATA LOCALSTORAGE ---
let listBarang = JSON.parse(localStorage.getItem('stok_barang')) || [];
let riwayatTrx = JSON.parse(localStorage.getItem('riwayat_trx')) || [];
let activeTab = 'stok';
let activeKategoriFilter = 'Semua';
let tipeTrxModal = 'masuk';
let selectedBarangEditId = null;

// Normalisasi data lama
listBarang = listBarang.map(item => ({
    id: item.id || Date.now() + Math.random(),
    nama: item.nama || 'Tanpa Nama',
    kategori: item.kategori || 'Umum',
    deskripsi: item.deskripsi || item.jenis || '-',
    stok: Number(item.stok !== undefined ? item.stok : (item.jumlah !== undefined ? item.jumlah : 0)) || 0,
    satuan: item.satuan || 'pcs',
    min: Number(item.min !== undefined ? item.min : 5) || 5
}));

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function simpanData() {
    localStorage.setItem('stok_barang', JSON.stringify(listBarang));
    localStorage.setItem('riwayat_trx', JSON.stringify(riwayatTrx));
}

// --- 2. INISIALISASI UTAMA & EVENT LISTENERS ---
function initApp() {
    tampilkanData();
    updateStatistik();

    // Tombol Tambah Barang
    const btnAdd = document.getElementById('btnAdd');
    const dItem = document.getElementById('dItem');
    const fItem = document.getElementById('fItem');

    if (btnAdd && dItem) {
        btnAdd.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('tItemT').textContent = 'Tambah barang';
            if (fItem) fItem.reset();
            dItem.showModal();
        });
    }

    if (dItem) {
        const btnBatalItem = dItem.querySelector('.cancel');
        if (btnBatalItem) {
            btnBatalItem.addEventListener('click', () => dItem.close());
        }
    }

    if (fItem) {
        fItem.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('iNama')?.value || '';
            const kategori = document.getElementById('iKategori')?.value || 'Umum';
            const desc = document.getElementById('iDesc')?.value || '-';
            const stok = parseInt(document.getElementById('iStok')?.value) || 0;
            const satuan = document.getElementById('iSatuan')?.value || 'pcs';
            const batasMin = parseInt(document.getElementById('iMin')?.value) || 5;

            if (!nama.trim()) return;

            const barangBaru = {
                id: Date.now(),
                nama: nama,
                kategori: kategori,
                deskripsi: desc,
                stok: stok,
                satuan: satuan,
                min: batasMin
            };

            listBarang.push(barangBaru);

            riwayatTrx.push({
                tipe: 'TAMBAH BARANG BARU',
                namaBarang: nama,
                jumlah: stok,
                satuan: satuan,
                catatan: `Kategori: ${kategori} (${desc})`,
                tanggal: new Date().toLocaleString('id-ID')
            });

            simpanData();
            tampilkanData();
            updateStatistik();
            dItem.close();
        });
    }

    // Modal Edit Stok & Opsi (Transfer In / Out / Vendor)
    const dEdit = document.getElementById('dEdit');
    const fEdit = document.getElementById('fEdit');
    const eOpsi = document.getElementById('eOpsi');
    const boxAksiVendor = document.getElementById('boxAksiVendor');

    if (eOpsi && boxAksiVendor) {
        eOpsi.addEventListener('change', () => {
            boxAksiVendor.style.display = eOpsi.value === 'Vendor' ? 'block' : 'none';
        });
    }

    if (dEdit) {
        const btnBatalEdit = dEdit.querySelector('.cancel');
        if (btnBatalEdit) {
            btnBatalEdit.addEventListener('click', () => dEdit.close());
        }
    }

    if (fEdit) {
        fEdit.addEventListener('submit', (e) => {
            e.preventDefault();
            const barang = listBarang.find(b => b.id === selectedBarangEditId);
            if (!barang) return;

            const opsi = document.getElementById('eOpsi').value;
            const vendorAksi = document.getElementById('eVendorAksi').value;
            const qty = parseInt(document.getElementById('eQty').value) || 0;
            const desc = document.getElementById('eDesc').value || '-';

            let isTambah = true;
            let labelTipe = opsi;

            if (opsi === 'Transfer In') {
                isTambah = true;
            } else if (opsi === 'Transfer Out') {
                isTambah = false;
            } else if (opsi === 'Vendor') {
                isTambah = (vendorAksi === 'tambah');
                labelTipe = `Vendor (${vendorAksi === 'tambah' ? 'In' : 'Out'})`;
            }

            if (!isTambah && barang.stok < qty) {
                alert('Stok tidak mencukupi untuk pengurangan ini!');
                return;
            }

            if (isTambah) {
                barang.stok += qty;
            } else {
                barang.stok -= qty;
            }

            riwayatTrx.push({
                tipe: labelTipe,
                namaBarang: barang.nama,
                jumlah: qty,
                satuan: barang.satuan,
                catatan: desc,
                tanggal: new Date().toLocaleString('id-ID')
            });

            simpanData();
            tampilkanData();
            updateStatistik();
            dEdit.close();
        });
    }

    // Modal Catat Transaksi Header
    const btnTrx = document.getElementById('btnTrx');
    const dTrx = document.getElementById('dTrx');
    const fTrx = document.getElementById('fTrx');
    const selectBarang = document.getElementById('tItem');

    if (btnTrx && dTrx) {
        btnTrx.addEventListener('click', (e) => {
            e.preventDefault();
            if (selectBarang) {
                selectBarang.innerHTML = '';
                if (listBarang.length === 0) {
                    selectBarang.innerHTML = '<option value="">Belum ada barang</option>';
                } else {
                    listBarang.forEach(b => {
                        const opt = document.createElement('option');
                        opt.value = b.id;
                        opt.textContent = `${b.nama} (Stok: ${b.stok} ${b.satuan})`;
                        selectBarang.appendChild(opt);
                    });
                }
            }
            if (fTrx) fTrx.reset();
            dTrx.showModal();
        });
    }

    if (dTrx) {
        const btnBatalTrx = dTrx.querySelector('.cancel');
        if (btnBatalTrx) {
            btnBatalTrx.addEventListener('click', () => dTrx.close());
        }

        const btnSeg = dTrx.querySelectorAll('#segT button');
        btnSeg.forEach(btn => {
            btn.addEventListener('click', () => {
                btnSeg.forEach(b => b.classList.remove('on'));
                btn.classList.add('on');
                tipeTrxModal = btn.getAttribute('data-t') || 'masuk';
            });
        });

        const btnMn = document.getElementById('mn');
        const btnPl = document.getElementById('pl');
        const inputQty = document.getElementById('tQty');

        if (btnMn && inputQty) {
            btnMn.onclick = () => {
                let val = parseInt(inputQty.value) || 1;
                if (val > 1) inputQty.value = val - 1;
            };
        }
        if (btnPl && inputQty) {
            btnPl.onclick = () => {
                let val = parseInt(inputQty.value) || 1;
                inputQty.value = val + 1;
            };
        }
    }

    if (fTrx) {
        fTrx.addEventListener('submit', (e) => {
            e.preventDefault();
            const barangId = parseInt(selectBarang?.value);
            const qty = parseInt(document.getElementById('tQty')?.value) || 0;
            const cat = document.getElementById('tCat')?.value || 'Transaksi manual';

            const barang = listBarang.find(b => b.id === barangId);
            if (!barang) {
                alert('Pilih barang terlebih dahulu!');
                return;
            }

            if (tipeTrxModal === 'keluar') {
                if (barang.stok < qty) {
                    alert('Stok tidak mencukupi!');
                    return;
                }
                barang.stok -= qty;
            } else {
                barang.stok += qty;
            }

            riwayatTrx.push({
                tipe: `Barang ${tipeTrxModal}`,
                namaBarang: barang.nama,
                jumlah: qty,
                satuan: barang.satuan,
                catatan: cat,
                tanggal: new Date().toLocaleString('id-ID')
            });

            simpanData();
            tampilkanData();
            updateStatistik();
            dTrx.close();
        });
    }

    // Tab Navigasi (Stok & Riwayat)
    const tabButtons = document.querySelectorAll('#tabs button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabButtons.forEach(b => b.classList.remove('on'));
            btn.classList.add('on');
            activeTab = btn.getAttribute('data-tab') || 'stok';
            tampilkanData();
        });
    });

    // Pencarian
    const searchInput = document.getElementById('q');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            tampilkanData(searchInput.value);
        });
    }
}

// --- 3. RENDER TOMBOL FILTER KATEGORI OTOMATIS ---
function renderFilterKategori() {
    const filtersContainer = document.getElementById('filters');
    if (!filtersContainer) return;

    // Ambil daftar kategori unik dari data barang + opsi "Semua"
    let kategoriSet = new Set(['Semua']);
    listBarang.forEach(item => kategoriSet.add(item.kategori || 'Umum'));

    let html = '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;">';
    kategoriSet.forEach(kat => {
        let isActive = activeKategoriFilter === kat;
        let bgStyle = isActive ? 'background: #38bdf8; color: #0f172a; font-weight: bold;' : 'background: #1e293b; color: #94a3b8;';
        html += `<button onclick="setFilterKategori('${kat}')" style="border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; ${bgStyle}">${kat}</button>`;
    });
    html += '</div>';

    filtersContainer.innerHTML = html;
}

function setFilterKategori(kat) {
    activeKategoriFilter = kat;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

// --- 4. MENAMPILKAN DATA KE <main id="main"> ---
function tampilkanData(keyword = '') {
    renderFilterKategori();
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
        let filtered = listBarang.filter(item => {
            let matchKeyword = item.nama.toLowerCase().includes(keyword.toLowerCase());
            let matchKategori = (activeKategoriFilter === 'Semua' || item.kategori === activeKategoriFilter);
            return matchKeyword && matchKategori;
        });

        if (filtered.length === 0) {
            main.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 40px; background: #1e293b; border-radius: 12px; margin-top: 10px;">
                    <p>Belum ada barang pada kategori ini.</p>
                </div>`;
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 5px;">';
        filtered.forEach(item => {
            let statusWarna = item.stok <= item.min ? '#f59e0b' : '#38bdf8';
            if (item.stok === 0) statusWarna = '#ef4444';

            html += `
                <div style="background: #1e293b; padding: 16px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; color: white;">
                    <div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                            <strong style="font-size: 16px; color: #f8fafc;">${item.nama}</strong>
                            <span style="background: #334155; color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 12px;">${item.kategori || 'Umum'}</span>
                        </div>
                        ${item.deskripsi && item.deskripsi !== '-' ? `<div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">Ket: ${item.deskripsi}</div>` : ''}
                        <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
                            Stok: <span style="color: ${statusWarna}; font-weight: bold;">${item.stok} ${item.satuan}</span> 
                            <span style="color: #64748b; font-size: 12px;">(Min: ${item.min})</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button onclick="bukaModalEdit(${item.id})" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">Edit</button>
                        <button onclick="ubahStokQuick(${item.id}, -1)" title="Kurangi Stok" style="background: #334155; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">-</button>
                        <button onclick="ubahStokQuick(${item.id}, 1)" title="Tambah Stok" style="background: #334155; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">+</button>
                        <button onclick="hapusBarang(${item.id})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Hapus</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        main.innerHTML = html;

    } else if (activeTab === 'riwayat') {
        // Dashboard Ringkasan / Grafik Statistik Sederhana di Tab Riwayat
        let totalMasuk = riwayatTrx.filter(t => !t.tipe.toLowerCase().includes('out') && !t.tipe.toLowerCase().includes('kurang')).length;
        let totalKeluar = riwayatTrx.filter(t => t.tipe.toLowerCase().includes('out') || t.tipe.toLowerCase().includes('kurang') || t.tipe.toLowerCase().includes('keluar')).length;

        let html = `
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; color: white;">
                <h3 style="margin-bottom: 10px; font-size: 16px; color: #38bdf8;">📊 Dashboard Ringkasan Aktivitas</h3>
                <div style="display: flex; gap: 20px; font-size: 14px;">
                    <div>Total Transaksi Masuk: <b style="color: #10b981;">${totalMasuk}</b></div>
                    <div>Total Transaksi Keluar/Keluar Gudang: <b style="color: #ef4444;">${totalKeluar}</b></div>
                </div>
            </div>
        `;

        if (riwayatTrx.length === 0) {
            html += `
                <div style="text-align: center; color: #94a3b8; padding: 40px; background: #1e293b; border-radius: 12px;">
                    <p>Belum ada riwayat transaksi.</p>
                </div>`;
        } else {
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            riwayatTrx.slice().reverse().forEach(trx => {
                const isKeluar = trx.tipe.toLowerCase().includes('out') || trx.tipe.toLowerCase().includes('kurang') || trx.tipe.toLowerCase().includes('keluar');
                const color = isKeluar ? '#ef4444' : '#10b981';

                html += `
                    <div style="background: #1e293b; padding: 14px 18px; border-radius: 8px; color: white; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">
                                <span style="color: ${color}; font-weight: bold;">[${trx.tipe}]</span> 
                                ${trx.namaBarang} (${trx.jumlah} ${trx.satuan || ''})
                            </div>
                            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Deskripsi: <b>${trx.catatan || '-'}</b></div>
                        </div>
                        <div style="font-size: 12px; color: #64748b; text-align: right;">${trx.tanggal}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        main.innerHTML = html;
    }
}

// --- 5. BUKA MODAL EDIT STOK ---
function bukaModalEdit(id) {
    const barang = listBarang.find(b => b.id === id);
    if (!barang) return;

    selectedBarangEditId = id;
    const dEdit = document.getElementById('dEdit');
    const fEdit = document.getElementById('fEdit');
    const pEditNama = document.getElementById('pEditNama');
    const boxAksiVendor = document.getElementById('boxAksiVendor');

    if (pEditNama) pEditNama.textContent = `Barang: ${barang.nama} (Stok: ${barang.stok} ${barang.satuan})`;
    if (fEdit) fEdit.reset();
    if (boxAksiVendor) boxAksiVendor.style.display = 'none';

    if (dEdit) dEdit.showModal();
}

// --- 6. AKSI UBAH STOK CEPAT (+ / -) ---
function ubahStokQuick(id, delta) {
    const barang = listBarang.find(b => b.id === id);
    if (!barang) return;

    const aksiStr = delta > 0 ? 'menambahkan' : 'mengurangi';
    const reason = prompt(`Masukkan deskripsi/alasan ${aksiStr} stok "${barang.nama}":`, delta > 0 ? 'Restock' : 'Penggunaan barang');
    
    if (reason === null) return; 

    if (barang.stok + delta < 0) {
        alert('Stok tidak boleh kurang dari 0!');
        return;
    }

    barang.stok += delta;

    riwayatTrx.push({
        tipe: delta > 0 ? 'Tambah Stok' : 'Kurang Stok',
        namaBarang: barang.nama,
        jumlah: Math.abs(delta),
        satuan: barang.satuan,
        catatan: reason.trim() || '-',
        tanggal: new Date().toLocaleString('id-ID')
    });

    simpanData();
    tampilkanData();
    updateStatistik();
}

// --- 7. HAPUS BARANG ---
function hapusBarang(id) {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    listBarang = listBarang.filter(b => b.id !== id);
    simpanData();
    tampilkanData();
    updateStatistik();
}

// --- 8. UPDATE STATISTIK DASHBOARD ATAS ---
function updateStatistik() {
    const sTotal = document.getElementById('sTotal');
    const sLow = document.getElementById('sLow');
    const sOut = document.getElementById('sOut');

    const totalJenis = listBarang.length;
    const stokMenipis = listBarang.filter(b => b.stok > 0 && b.stok <= b.min).length;
    const stokHabis = listBarang.filter(b => b.stok === 0).length;

    if (sTotal) sTotal.textContent = totalJenis;
    if (sLow) sLow.textContent = stokMenipis;
    if (sOut) sOut.textContent = stokHabis;
}
