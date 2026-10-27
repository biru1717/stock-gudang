// --- 0. SISTEM LOGIN, AUTHENTICATION & THEME ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initApp();
});

function initTheme() {
    const btnTheme = document.getElementById('btnTheme');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (btnTheme) {
        btnTheme.textContent = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            let newTheme = theme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            btnTheme.textContent = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
        });
    }
}

function initAuth() {
    const dLogin = document.getElementById('dLogin');
    const fLogin = document.getElementById('fLogin');
    const loginError = document.getElementById('loginError');

    const isLogged = sessionStorage.getItem('isLoggedIn');
    if (isLogged === 'true') {
        if (dLogin) dLogin.style.setProperty('display', 'none', 'important');
    } else {
        if (dLogin) dLogin.style.setProperty('display', 'flex', 'important');
    }

    if (fLogin) {
        fLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('uName')?.value.trim();
            const passwordInput = document.getElementById('uPass')?.value.trim();

            if (usernameInput === 'jatimulya' && passwordInput === 'fore1234') {
                sessionStorage.setItem('isLoggedIn', 'true');
                if (dLogin) dLogin.style.setProperty('display', 'none', 'important');
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
let activeRiwayatFilter = 'Semua';
let activeChartKatFilter = 'Semua';     
let activeChartTimeFilter = 'Semua';    
let tipeTrxModal = 'masuk';
let selectedBarangEditId = null;
let selectedRiwayatEditId = null;

// --- 2. INISIALISASI UTAMA & EVENT LISTENERS ---
function initApp() {
    tampilkanData();
    updateStatistik();

    const selectKategori = document.getElementById('iKategori');
    const boxSubFood = document.getElementById('boxSubFood');

    if (selectKategori && boxSubFood) {
        selectKategori.addEventListener('change', () => {
            boxSubFood.style.display = selectKategori.value === 'FOOD' ? 'block' : 'none';
        });
    }

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

    // Submit Tambah Barang Baru
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
                    expired: '-',
                    createdAt: new Date().toISOString()
                });

                await window.addDoc(window.collection(window.db, "riwayat_trx"), {
                    tipe: 'TAMBAH BARANG BARU',
                    namaBarang: nama,
                    kategori: kategoriFinal,
                    jumlah: stok,
                    satuan: satuan,
                    statusTito: '-',
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

    // Modal Edit Stok
    const dEdit = document.getElementById('dEdit');
    const fEdit = document.getElementById('fEdit');
    const eOpsi = document.getElementById('eOpsi');
    const boxAksiVendor = document.getElementById('boxAksiVendor');
    const boxStatusTito = document.getElementById('boxStatusTito');
    const boxDesc = document.getElementById('boxDesc');

    if (eOpsi) {
        eOpsi.addEventListener('change', () => {
            const val = eOpsi.value;
            if (boxAksiVendor) boxAksiVendor.style.display = val === 'Vendor' ? 'block' : 'none';
            if (boxStatusTito) boxStatusTito.style.display = (val === 'Transfer In' || val === 'Transfer Out') ? 'block' : 'none';
            if (boxDesc) {
                boxDesc.style.display = (val === 'Transfer In' || val === 'Transfer Out') ? 'block' : 'none';
            }
        });
    }

    if (dEdit) {
        const btnBatalEdit = dEdit.querySelector('.cancel');
        if (btnBatalEdit) {
            btnBatalEdit.addEventListener('click', () => dEdit.close());
        }
    }

    // Submit Edit Stok
    if (fEdit) {
        fEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedBarangEditId) return;

            const opsi = document.getElementById('eOpsi').value;
            const vendorAksi = document.getElementById('eVendorAksi')?.value || 'tambah';
            const statusTito = document.getElementById('eStatusTito')?.value || 'Belum TITO';
            const qty = parseInt(document.getElementById('eQty').value) || 0;
            const expiredDate = document.getElementById('eExpired')?.value || '-';
            const desc = document.getElementById('eDesc')?.value || '-';

            let isTambah = true;
            let labelTipe = opsi;
            let statusTitoFinal = '-';

            if (opsi === 'Transfer In') {
                isTambah = true;
                statusTitoFinal = statusTito;
            } else if (opsi === 'Transfer Out') {
                isTambah = false;
                statusTitoFinal = statusTito;
            } else if (opsi === 'Kebutuhan Operasional') {
                isTambah = false;
                labelTipe = 'Kebutuhan Operasional (-)';
                statusTitoFinal = '-';
            } else if (opsi === 'Vendor') {
                isTambah = (vendorAksi === 'tambah');
                labelTipe = `Vendor (${vendorAksi === 'tambah' ? 'In' : 'Out'})`;
                statusTitoFinal = '-';
            }

            let catatanFinal = (opsi === 'Transfer In' || opsi === 'Transfer Out') ? desc : '-';

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

                await window.updateDoc(barangDocRef, { 
                    stok: stokBaru,
                    expired: expiredDate !== '-' ? expiredDate : (barangData.expired || '-')
                });

                await window.addDoc(window.collection(window.db, "riwayat_trx"), {
                    tipe: labelTipe,
                    namaBarang: barangData.nama,
                    kategori: barangData.kategori || 'FOOD',
                    jumlah: qty,
                    satuan: barangData.satuan,
                    statusTito: statusTitoFinal,
                    catatan: `${catatanFinal} ${expiredDate !== '-' ? '(Exp: ' + expiredDate + ')' : ''}`.trim(),
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

    // Modal Edit Riwayat
    const dEditRiwayat = document.getElementById('dEditRiwayat');
    const fEditRiwayat = document.getElementById('fEditRiwayat');

    if (dEditRiwayat) {
        const btnBatal = dEditRiwayat.querySelector('.cancel');
        if (btnBatal) btnBatal.addEventListener('click', () => dEditRiwayat.close());
    }

    if (fEditRiwayat) {
        fEditRiwayat.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedRiwayatEditId) return;

            const rStatusTito = document.getElementById('rStatusTito').value;
            const rCatatan = document.getElementById('rCatatan').value;

            try {
                const riwayatRef = window.doc(window.db, "riwayat_trx", selectedRiwayatEditId);
                await window.updateDoc(riwayatRef, {
                    statusTito: rStatusTito,
                    catatan: rCatatan
                });

                tampilkanData();
                dEditRiwayat.close();
            } catch (error) {
                console.error("Gagal mengupdate riwayat:", error);
                alert("Gagal memperbarui riwayat transaksi.");
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
                        let barangOpts = [];
                        querySnapshot.forEach(docSnap => {
                            barangOpts.push({ id: docSnap.id, ...docSnap.data() });
                        });
                        barangOpts.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

                        barangOpts.forEach((b) => {
                            const opt = document.createElement('option');
                            opt.value = b.id;
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
                    statusTito: '-',
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

    const tabButtons = document.querySelectorAll('#tabs button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabButtons.forEach(b => b.classList.remove('on'));
            btn.classList.add('on');
            activeTab = btn.getAttribute('data-tab') || 'stok';
            activeKategoriFilter = 'Semua'; 
            activeSubFoodFilter = 'Semua';
            activeRiwayatFilter = 'Semua';
            activeChartKatFilter = 'Semua';
            activeChartTimeFilter = 'Semua';
            tampilkanData();
        });
    });

    const searchInput = document.getElementById('q');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            tampilkanData(searchInput.value);
        });
    }
}

// --- 3. RENDER TOMBOL FILTER KATEGORI (GAYA PILLS SEPERTI GAMBAR) ---
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

        // Render Tombol Kategori Utama dalam bentuk Pill (Gaya Tombol Rapiah/Modern)
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; align-items: center;">';
        
        baseCategories.forEach(kat => {
            let isActive = activeKategoriFilter === kat;
            let bgStyle = isActive ? 'background: #38bdf8; color: #0f172a; font-weight: bold; border: none;' : 'background: var(--bg-card); color: var(--text-color); border: 1px solid var(--border-color);';
            
            let labelKat = kat;
            if (kat === 'FOOD') {
                labelKat = kat + (isActive ? ' ▾' : ' ▸');
            }

            html += `<button onclick="setFilterKategori('${kat}')" style="padding: 6px 16px; border-radius: 20px; cursor: pointer; font-size: 13px; transition: 0.2s; ${bgStyle}">${labelKat}</button>`;
        });
        html += '</div>';

        // Jika kategori FOOD dipilih, tampilkan sub-kategori di bawahnya dengan gaya serupa
        if (activeKategoriFilter === 'FOOD') {
            let subFoodList = ['Semua', 'SANDWICH', 'POUND CAKE', 'PASTRY', 'ROLL CAKE'];
            html += '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; padding-left: 5px;">';
            
            subFoodList.forEach(sub => {
                let isSubActive = activeSubFoodFilter === sub;
                let subBgStyle = isSubActive ? 'background: #0284c7; color: white; font-weight: bold; border: none;' : 'background: var(--bg-card); color: var(--text-sub); border: 1px solid var(--border-color);';
                html += `<button onclick="setSubFoodFilter('${sub}')" style="padding: 4px 12px; border-radius: 15px; cursor: pointer; font-size: 12px; ${subBgStyle}">↳ ${sub}</button>`;
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

function setFilterRiwayat(tipeTrx) {
    activeRiwayatFilter = tipeTrx;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

function setChartKatFilter(kat) {
    activeChartKatFilter = kat;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

function setChartTimeFilter(time) {
    activeChartTimeFilter = time;
    const searchInput = document.getElementById('q');
    tampilkanData(searchInput ? searchInput.value : '');
}

// --- 4. TAMPILKAN DATA & DIAGRAM ---
async function tampilkanData(keyword = '') {
    await renderFilterKategori();
    const main = document.getElementById('main');
    if (!main) return;

    if (activeTab === 'stok') {
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

            let availableCategories = new Set(['Semua']);
            riwayatTrx.forEach(t => {
                if (t.kategori) {
                    let mainKat = t.kategori.split(' - ')[0];
                    availableCategories.add(mainKat);
                }
            });

            let now = new Date();
            let riwayatUntukDiagram = riwayatTrx.filter(trx => {
                let katTrx = trx.kategori || 'FOOD';
                let matchKat = (activeChartKatFilter === 'Semua') || katTrx.startsWith(activeChartKatFilter);
                
                let matchTime = true;
                if (trx.createdAt) {
                    let trxDate = new Date(trx.createdAt);
                    if (activeChartTimeFilter === 'Harian') {
                        matchTime = (trxDate.getDate() === now.getDate() &&
                                     trxDate.getMonth() === now.getMonth() &&
                                     trxDate.getFullYear() === now.getFullYear());
                    } else if (activeChartTimeFilter === 'Mingguan') {
                        let diffTime = now - trxDate;
                        let diffDays
