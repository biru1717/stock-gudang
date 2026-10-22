// --- 1. INISIALISASI VARIABEL GLOBAL & STATE ---
let activeTab = 'stok';
let activeKategoriFilter = 'Semua';
let tipeTrxModal = 'masuk';
let selectedBarangEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// --- 2. INISIALISASI UTAMA & EVENT LISTENERS ---
function initApp() {
    tampilkanData();
    updateStatistik();

    // Event Listener Kategori FOOD
    const selectKategori = document.getElementById('iKategori');
    const boxSubFood = document.getElementById('boxSubFood');

    if (selectKategori && boxSubFood) {
        // Tampilkan/sembunyikan sub-kategori food saat kategori berubah
        selectKategori.addEventListener('change', () => {
            boxSubFood.style.display = selectKategori.value === 'FOOD' ? 'block' : 'none';
        });
    }

    // Tombol Tambah Barang
    const btnAdd = document.getElementById('btnAdd');
    const dItem = document.getElementById('dItem');
    const fItem = document.getElementById('fItem');

    if (btnAdd && dItem) {
        btnAdd.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('tItemT').textContent = 'Tambah barang';
            if (fItem) fItem.reset();
            if (boxSubFood && selectKategori) {
                boxSubFood.style.display = selectKategori.value === 'FOOD' ? 'block' : 'none';
            }
            dItem.showModal();
        });
    }

    if (dItem) {
        const btnBatalItem = dItem.querySelector('.cancel');
        if (btnBatalItem) {
            btnBatalItem.addEventListener('click', () => dItem.close());
        }
    }

    // Submit Tambah Barang ke Firebase
    if (fItem) {
        fItem.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nama = document.getElementById('iNama')?.value || '';
            let kategori = document.getElementById('iKategori')?.value || 'FOOD';
            const subFood = document.getElementById('iSubFood')?.value || 'SANDWICH';
            const desc = document.getElementById('iDesc')?.value || '-';
            const stok = parseInt(document.getElementById('iStok')?.value) || 0;
            const satuan = document.getElementById('iSatuan')?.value || 'pcs';
            const batasMin = parseInt(document.getElementById('iMin')?.value) || 5;

            if (!nama.trim()) return;

            // Jika kategori FOOD, gabungkan kategori dengan sub-kategori
            let kategoriFinal = kategori;
            if (kategori === 'FOOD') {
                kategoriFinal = `FOOD - ${subFood}`;
            }

            try {
                // Simpan barang baru ke koleksi "stok_barang"
                await window.addDoc(window.collection(window.db, "stok_barang"), {
                    nama: nama,
                    kategori: kategoriFinal,
                    deskripsi: desc,
                    stok: stok,
                    satuan: satuan,
                    min: batasMin,
                    createdAt: new Date().toISOString()
                });

                // Catat juga ke riwayat transaksi
                await window.addDoc(window.collection(window.db, "riwayat_trx"), {
                    tipe: 'TAMBAH BARANG BARU',
                    namaBarang: nama,
                    kategori: kategoriFinal,
                    jumlah: stok,
                    satuan: satuan,
                    catatan: `Kategori: ${kategoriFinal} (${desc})`,
                    tanggal: new Date().toLocaleString('id-ID'),
                    createdAt: new Date().toISOString()
                });

                tampilkanData();
                updateStatistik();
                dItem.close();
            } catch (error) {
                console.error("Gagal menambah barang ke Firebase:", error);
                alert("Terjadi kesalahan saat menyimpan data ke cloud.");
            }
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

    // Submit Edit Stok ke Firebase
    if (fEdit) {
        fEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedBarangEditId) return;

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

            try {
                const barangDocRef = window.doc(window.db, "stok_barang", selectedBarangEditId);
                const stokSnap = await window.getDocs(window.collection(window.db, "stok_barang"));
                let barangData = null;
                stokSnap.forEach(docSnap => {
                    if (docSnap.id === selectedBarangEditId) {
                        barangData = docSnap.data();
                    }
                });

                if (!barangData) {
                    alert("Barang tidak ditemukan!");
                    return;
                }

                let stokBaru = Number(barangData.stok) || 0;

                if (!isTambah && stokBaru < qty) {
                    alert('Stok tidak mencukupi untuk pengurangan ini!');
                    return;
                }

                if (isTambah) {
                    stokBaru += qty;
                } else {
                    stokBaru -= qty;
                }

                // Update stok di Firestore
                await window.updateDoc(barangDocRef, { stok: stokBaru });

                // Catat riwayat transaksi ke Firestore
                await window.addDoc(window.collection(window.db, "riwayat_trx"), {
                    tipe: labelTipe,
                    namaBarang: barangData.nama,
                    kategori: barangData.kategori || 'FOOD',
                    jumlah: qty,
                    satuan: barangData.satuan,
                    catatan: desc,
                    tanggal: new Date().toLocaleString('id-ID'),
                    createdAt: new Date().toISOString()
                });

                tampilkanData();
                updateStatistik();
                dEdit.close();
            } catch (error) {
                console.error("Gagal memperbarui stok di Firebase:", error);
                alert("Terjadi kesalahan saat memperbarui data.");
            }
        });
    }

    // Modal Catat Transaksi Header
    const btnTrx = document.getElementById('btnTrx');
    const dTrx = document.getElementById('dTrx');
    const fTrx = document.getElementById('fTrx');
    const selectBarang = document.getElementById('tItem');

    if (btnTrx && dTrx) {
        btnTrx.addEventListener('click', async (e) => {
            e.preventDefault();
            if (selectBarang) {
                selectBarang.innerHTML = '<option value="">Memuat data...</option>';
                try {
                    const querySnapshot = await window.getDocs(window.collection(window.db, "stok_barang"));
                    selectBarang.innerHTML = '';
                    
                    if (querySnapshot.empty) {
                        selectBarang.innerHTML = '<option value="">Belum ada barang</option>';
                    } else {
                        querySnapshot.forEach((docSnap) => {
                            const b = docSnap.data();
                            const opt = document.createElement('option');
                            opt.value = docSnap.id;
                            opt.textContent = `${b.nama} (${b.kategori}) - Stok: ${b.stok} ${b.satuan}`;
                            selectBarang.appendChild(opt);
                        });
                    }
                } catch (error) {
                    console.error("Gagal memuat pilihan barang:", error);
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

    // Submit Transaksi Header ke Firebase
    if (fTrx) {
        fTrx.addEventListener('submit', async (e) => {
            e.preventDefault();
            const barangId = selectBarang?.value;
            const qty = parseInt(document.getElementById('tQty')?.value) || 0;
            const cat = document.getElementById('tCat')?.value || 'Transaksi manual';

            if (!barangId) {
                alert('Pilih barang terlebih dahulu!');
                return;
            }

            try {
                const barangDocRef = window.doc(window.db, "stok_barang", barangId);
                const stokSnap = await window.getDocs(window.collection(window.db, "stok_barang"));
                let barangData = null;
                stokSnap.forEach(docSnap => {
                    if (docSnap.id === barangId) {
                        barangData = docSnap.data();
                    }
                });

                if (!barangData) {
                    alert("Barang tidak ditemukan di database!");
                    return;
                }

                let stokBaru = Number(barangData.stok) || 0;

                if (tipeTrxModal === 'keluar') {
                    if (stokBaru < qty) {
                        alert('Stok tidak mencukupi!');
                        return;
                    }
                    stokBaru -= qty;
                } else {
                    stokBaru += qty;
                }

                // Update stok di Firestore
                await window.updateDoc(barangDocRef, { stok: stokBaru });

                // Catat riwayat transaksi
                await window.addDoc(window.collection(window.db, "riwayat_trx"), {
                    tipe: `Barang ${tipeTrxModal}`,
                    namaBarang: barangData.nama,
                    kategori: barangData.kategori || 'FOOD',
                    jumlah: qty,
                    satuan: barangData.satuan,
                    catatan: cat,
                    tanggal: new Date().toLocaleString('id-ID'),
                    createdAt: new Date().toISOString()
                });

                tampilkanData();
                updateStatistik();
                dTrx.close();
            } catch (error) {
                console.error("Gagal memproses transaksi:", error);
                alert("Terjadi kesalahan saat memproses transaksi.");
            }
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
            activeKategoriFilter = 'Semua'; 
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

// --- 3. RENDER TOMBOL FILTER KATEGORI ---
async function renderFilterKategori() {
    const filtersContainer = document.getElementById('filters');
    if (!filtersContainer) return;

    try {
        let kategoriSet = new Set(['Semua']);
        
        const stokSnap = await window.getDocs(window.collection(window.db, "stok_barang"));
        stokSnap.forEach(docSnap => {
            const item = docSnap.data();
            if (item.kategori) kategoriSet.add(item.kategori);
        });

        const trxSnap = await window.getDocs(window.collection(window.db, "riwayat_trx"));
        trxSnap.forEach(docSnap => {
            const trx = docSnap.data();
            if (trx.kategori) kategoriSet.add(trx.kategori);
        });

        let html = '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px;">';
        kategoriSet.forEach(kat => {
            let isActive = activeKategoriFilter === kat;
            let bgStyle = isActive ? 'background: #38bdf8; color: #0f172a; font-weight: bold;' : 'background: #1e293b; color: #94a3b8;';
            html += `<button onclick="setFilterKategori('${kat}')" style="border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; ${bgStyle}">${kat}</button>`;
        });
        html += '</div>';

        filtersContainer.innerHTML = html;
    } catch (error) {
        console.error("Gagal merender filter kategori:", error);
    }
}

function setFilterKategori(kat) {
    activeKategoriFilter = kat;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

// --- 4. MENAMPILKAN DATA KE <main id="main"> (DARI FIREBASE) ---
async function tampilkanData(keyword = '') {
    await renderFilterKategori();
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
        try {
            const querySnapshot = await window.getDocs(window.collection(window.db, "stok_barang"));
            let listBarang = [];
            querySnapshot.forEach(docSnap => {
                listBarang.push({ id: docSnap.id, ...docSnap.data() });
            });

            let filtered = listBarang.filter(item => {
                let matchKeyword = item.nama.toLowerCase().includes(keyword.toLowerCase());
                let matchKategori = (activeKategoriFilter === 'Semua' || item.kategori === activeKategoriFilter || item.kategori.includes(activeKategoriFilter));
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
                                <span style="background: #334155; color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 12px;">${item.kategori || 'FOOD'}</span>
                            </div>
                            ${item.deskripsi && item.deskripsi !== '-' ? `<div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">Ket: ${item.deskripsi}</div>` : ''}
                            <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
                                Stok: <span style="color: ${statusWarna}; font-weight: bold;">${item.stok} ${item.satuan}</span> 
                                <span style="color: #64748b; font-size: 12px;">(Min: ${item.min})</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button onclick="bukaModalEdit('${item.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">Edit</button>
                            <button onclick="ubahStokQuick('${item.id}', -1)" title="Kurangi Stok" style="background: #334155; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">-</button>
                            <button onclick="ubahStokQuick('${item.id}', 1)" title="Tambah Stok" style="background: #334155; color: white; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">+</button>
                            <button onclick="hapusBarang('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Hapus</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            main.innerHTML = html;
        } catch (error) {
            console.error("Gagal memuat data stok:", error);
        }

    } else if (activeTab === 'riwayat') {
        try {
            const querySnapshot = await window.getDocs(window.collection(window.db, "riwayat_trx"));
            let riwayatTrx = [];
            querySnapshot.forEach(docSnap => {
                riwayatTrx.push({ id: docSnap.id, ...docSnap.data() });
            });

            let totalMasuk = riwayatTrx.filter(t => !t.tipe.toLowerCase().includes('out') && !t.tipe.toLowerCase().includes('kurang')).length;
            let totalKeluar = riwayatTrx.filter(t => t.tipe.toLowerCase().includes('out') || t.tipe.toLowerCase().includes('kurang') || t.tipe.toLowerCase().includes('keluar')).length;

            let html = `
                <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; color: white;">
                    <h3 style="margin-bottom: 10px; font-size: 16px; color: #38bdf8;">📊 Dashboard Ringkasan Aktivitas</h3>
                    <div style="display: flex; gap: 20px; font-size: 14px;">
                        <div>Total Transaksi Masuk: <b style="color: #10b981;">${totalMasuk}</b></div>
                        <div>Total Transaksi Keluar: <b style="color: #ef4444;">${totalKeluar}</b></div>
                    </div>
                </div>
            `;

            let filteredRiwayat = riwayatTrx.filter(trx => {
                let matchKeyword = trx.namaBarang.toLowerCase().includes(keyword.toLowerCase());
                let katTrx = trx.kategori || 'FOOD';
                let matchKategori = (activeKategoriFilter === 'Semua' || katTrx === activeKategoriFilter || katTrx.includes(activeKategoriFilter));
                return matchKeyword && matchKategori;
            });

            if (filteredRiwayat.length === 0) {
                html += `
                    <div style="text-align: center; color: #94a3b8; padding: 40px; background: #1e293b; border-radius: 12px;">
                        <p>Belum ada riwayat transaksi pada kategori ini.</p>
                    </div>`;
            } else {
                html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
                filteredRiwayat.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                
                filteredRiwayat.forEach(trx => {
                    const isKeluar = trx.tipe.toLowerCase().includes('out') || trx.tipe.toLowerCase().includes('kurang') || trx.tipe.toLowerCase().includes('keluar');
                    const color = isKeluar ? '#ef4444' : '#10b981';

                    html += `
                        <div style="background: #1e293b; padding: 14px 18px; border-radius: 8px; color: white; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">
                                    <span style="color: ${color}; font-weight: bold;">[${trx.tipe}]</span> 
                                    ${trx.namaBarang} (${trx.jumlah} ${trx.satuan || ''}) 
                                    <span style="background: #334155; color: #38bdf8; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 6px;">${trx.kategori || 'FOOD'}</span>
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
        } catch (error) {
            console.error("Gagal memuat riwayat transaksi:", error);
        }
    }
}

// --- 5. BUKA MODAL EDIT STOK ---
async function bukaModalEdit(id) {
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "stok_barang"));
        let barang = null;
        
        querySnapshot.forEach(docSnap => {
            if (docSnap.id === id) {
                barang = docSnap.data();
            }
        });

        if (!barang) {
            alert("Data barang tidak ditemukan!");
            return;
        }

        selectedBarangEditId = id;
        
        const dEdit = document.getElementById('dEdit');
        const fEdit = document.getElementById('fEdit');
        const pEditNama = document.getElementById('pEditNama');
        const boxAksiVendor = document.getElementById('boxAksiVendor');

        if (pEditNama) pEditNama.textContent = `Barang: ${barang.nama} (${barang.kategori}) - Stok: ${barang.stok} ${barang.satuan}`;
        if (fEdit) fEdit.reset();
        if (boxAksiVendor) boxAksiVendor.style.display = 'none';

        if (dEdit) dEdit.showModal();
    } catch (error) {
        console.error("Gagal membuka modal edit:", error);
    }
}

// --- 6. AKSI UBAH STOK CEPAT (+ / -) ---
async function ubahStokQuick(id, delta) {
    try {
        const barangDocRef = window.doc(window.db, "stok_barang", id);
        const stokSnap = await window.getDocs(window.collection(window.db, "stok_barang"));
        let barang = null;

        stokSnap.forEach(docSnap => {
            if (docSnap.id === id) {
                barang = docSnap.data();
            }
        });

        if (!barang) return;

        const aksiStr = delta > 0 ? 'menambahkan' : 'mengurangi';
        const reason = prompt(`Masukkan deskripsi/alasan ${aksiStr} stok "${barang.nama}":`, delta > 0 ? 'Restock' : 'Penggunaan barang');
        
        if (reason === null) return; 

        let stokSekarang = Number(barang.stok) || 0;

        if (stokSekarang + delta < 0) {
            alert('Stok tidak boleh kurang dari 0!');
            return;
        }

        const stokBaru = stokSekarang + delta;
        await window.updateDoc(barangDocRef, { stok: stokBaru });

        await window.addDoc(window.collection(window.db, "riwayat_trx"), {
            tipe: delta > 0 ? 'Tambah Stok' : 'Kurang Stok',
            namaBarang: barang.nama,
            kategori: barang.kategori || 'FOOD',
            jumlah: Math.abs(delta),
            satuan: barang.satuan,
            catatan: reason.trim() || '-',
            tanggal: new Date().toLocaleString('id-ID'),
            createdAt: new Date().toISOString()
        });

        tampilkanData();
        updateStatistik();
    } catch (error) {
        console.error("Gagal mengubah stok cepat:", error);
        alert("Terjadi kesalahan saat mengubah stok.");
    }
}

// --- 7. HAPUS BARANG ---
async function hapusBarang(id) {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    try {
        await window.deleteDoc(window.doc(window.db, "stok_barang", id));
        tampilkanData();
        updateStatistik();
    } catch (error) {
        console.error("Gagal menghapus barang:", error);
        alert("Terjadi kesalahan saat menghapus barang.");
    }
}

// --- 8. UPDATE STATISTIK DASHBOARD ATAS ---
async function updateStatistik() {
    const sTotal = document.getElementById('sTotal');
    const sLow = document.getElementById('sLow');
    const sOut = document.getElementById('sOut');

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "stok_barang"));
        let listBarang = [];
        querySnapshot.forEach(docSnap => {
            listBarang.push(docSnap.data());
        });

        const totalJenis = listBarang.length;
        const stokMenipis = listBarang.filter(b => Number(b.stok) > 0 && Number(b.stok) <= Number(b.min)).length;
        const stokHabis = listBarang.filter(b => Number(b.stok) === 0).length;

        if (sTotal) sTotal.textContent = totalJenis;
        if (sLow) sLow.textContent = stokMenipis;
        if (sOut) sOut.textContent = stokHabis;
    } catch (error) {
        console.error("Gagal memperbarui statistik:", error);
    }
}
