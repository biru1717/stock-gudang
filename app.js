// --- 0. SISTEM LOGIN & AUTHENTICATION ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initApp();
});

function initAuth() {
    const dLogin = document.getElementById('dLogin');
    const fLogin = document.getElementById('fLogin');
    const loginError = document.getElementById('loginError');

    // Cek apakah user sudah login pada sesi browser saat ini
    const isLogged = sessionStorage.getItem('isLoggedIn');
    if (isLogged === 'true') {
        if (dLogin) dLogin.style.display = 'none';
    } else {
        if (dLogin) dLogin.style.display = 'flex';
    }

    // Process submit form login
    if (fLogin) {
        fLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('uName')?.value.trim();
            const passwordInput = document.getElementById('uPass')?.value.trim();

            // Validasi Username & Password
            if (usernameInput === 'jatimulya' && passwordInput === 'fore1234') {
                sessionStorage.setItem('isLoggedIn', 'true');
                if (dLogin) dLogin.style.display = 'none';
                if (loginError) loginError.style.display = 'none';
                fLogin.reset();
            } else {
                if (loginError) loginError.style.display = 'block';
            }
        });
    }
}

// --- 1. INISIALISASI VARIABEL GLOBAL & STATE ---
let activeTab = 'stok';
let activeKategoriFilter = 'Semua';
let activeSubFoodFilter = 'Semua';
let tipeTrxModal = 'masuk';
let selectedBarangEditId = null;

// --- 2. INISIALISASI UTAMA & EVENT LISTENERS ---
function initApp() {
    tampilkanData();
    updateStatistik();

    // Event Listener Kategori FOOD di Modal Tambah Barang
    const selectKategori = document.getElementById('iKategori');
    const boxSubFood = document.getElementById('boxSubFood');

    if (selectKategori && boxSubFood) {
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

            let kategoriFinal = kategori;
            if (kategori === 'FOOD') {
                kategoriFinal = `FOOD - ${subFood}`;
            }

            try {
                await window.addDoc(window.collection(window.db, "stok_barang"), {
                    nama: nama,
                    kategori: kategoriFinal,
                    deskripsi: desc,
                    stok: stok,
                    satuan: satuan,
                    min: batasMin,
                    createdAt: new Date().toISOString()
                });

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

                await window.updateDoc(barangDocRef, { stok: stokBaru });

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

                await window.updateDoc(barangDocRef, { stok: stokBaru });

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
            activeSubFoodFilter = 'Semua';
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

// --- 3. RENDER TOMBOL FILTER KATEGORI DENGAN DROPDOWN SUB-FOOD ---
async function renderFilterKategori() {
    const filtersContainer = document.getElementById('filters');
    if (!filtersContainer) return;

    try {
        let baseCategories = new Set(['Semua']);
        
        const stokSnap = await window.getDocs(window.collection(window.db, "stok_barang"));
        stokSnap.forEach(docSnap => {
            const item = docSnap.data();
            if (item.kategori) {
                let mainKat = item.kategori.split(' - ')[0];
                baseCategories.add(mainKat);
            }
        });

        const trxSnap = await window.getDocs(window.collection(window.db, "riwayat_trx"));
        trxSnap.forEach(docSnap => {
            const trx = docSnap.data();
            if (trx.kategori) {
                let mainKat = trx.kategori.split(' - ')[0];
                baseCategories.add(mainKat);
            }
        });

        let html = '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">';
        
        baseCategories.forEach(kat => {
            let isActive = activeKategoriFilter === kat;
            let bgStyle = isActive ? 'background: #38bdf8; color: #0f172a; font-weight: bold;' : 'background: #1e293b; color: #94a3b8;';
            
            let labelKat = kat;
            if (kat === 'FOOD') {
                labelKat = kat + (isActive ? ' ▾' : ' ▸');
            }

            html += `<button onclick="setFilterKategori('${kat}')" style="border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; ${bgStyle}">${labelKat}</button>`;
        });
        html += '</div>';

        if (activeKategoriFilter === 'FOOD') {
            let subFoodList = ['Semua', 'SANDWICH', 'POUND CAKE', 'PASTRY', 'ROLL CAKE'];
            html += '<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; padding-left: 10px; border-left: 2px solid #38bdf8;">';
            
            subFoodList.forEach(sub => {
                let isSubActive = activeSubFoodFilter === sub;
                let subBgStyle = isSubActive ? 'background: #0284c7; color: white; font-weight: bold;' : 'background: #1e293b; color: #64748b;';
                html += `<button onclick="setSubFoodFilter('${sub}')" style="border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; font-size: 11px; ${subBgStyle}">↳ ${sub}</button>`;
            });
            html += '</div>';
        }

        filtersContainer.innerHTML = html;
    } catch (error) {
        console.error("Gagal merender filter kategori:", error);
    }
}

function setFilterKategori(kat) {
    activeKategoriFilter = kat;
    if (kat !== 'FOOD') {
        activeSubFoodFilter = 'Semua';
    }
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

function setSubFoodFilter(sub) {
    activeSubFoodFilter = sub;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

// --- 4. MENAMPILKAN DATA KE <main id="main"> (REAL-TIME DENGAN onSNAPSHOT) ---
async function tampilkanData(keyword = '') {
    await renderFilterKategori();
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
        // Mendengarkan perubahan data stok secara real-time
        window.onSnapshot(window.collection(window.db, "stok_barang"), (querySnapshot) => {
            let listBarang = [];
            querySnapshot.forEach(docSnap => {
                listBarang.push({ id: docSnap.id, ...docSnap.data() });
            });

            updateStatistikRealtime(listBarang);
            renderStokView(listBarang, keyword, main);
        }, (error) => {
            console.error("Gagal mendengarkan data stok:", error);
        });

    } else if (activeTab === 'riwayat') {
        try {
            const querySnapshot = await window.getDocs(window.collection(window.db, "riwayat_trx"));
            let riwayatTrx = [];
            querySnapshot.forEach(docSnap => {
                riwayatTrx.push({ id: docSnap.id, ...docSnap.data() });
            });

            let totalMasuk = riwayatTrx.filter(t => !t.tipe.toLowerCase().includes('out') && !t.tipe.toLowerCase().includes('kurang')).length;
            let totalKeluar = riwayatTrx.filter(t => t.tipe.toLowerCase().includes('out') || t.tipe.toLowerCase().includes('kurang') || t.tipe.toLowerCase().includes('
