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

    // Modal Edit Stok & Pilihan Opsi Transaksi + Status TITO
    const dEdit = document.getElementById('dEdit');
    const fEdit = document.getElementById('fEdit');
    const eOpsi = document.getElementById('eOpsi');
    const boxAksiVendor = document.getElementById('boxAksiVendor');
    const boxStatusTito = document.getElementById('boxStatusTito');

    if (eOpsi) {
        eOpsi.addEventListener('change', () => {
            if (boxAksiVendor) boxAksiVendor.style.display = eOpsi.value === 'Vendor' ? 'block' : 'none';
            if (boxStatusTito) boxStatusTito.style.display = (eOpsi.value === 'Transfer In' || eOpsi.value === 'Transfer Out') ? 'block' : 'none';
        });
    }

    if (dEdit) {
        const btnBatalEdit = dEdit.querySelector('.cancel');
        if (btnBatalEdit) {
            btnBatalEdit.addEventListener('click', () => dEdit.close());
        }
    }

    // Submit Edit Stok & Simpan Status TITO ke Riwayat
    if (fEdit) {
        fEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedBarangEditId) return;

            const opsi = document.getElementById('eOpsi').value;
            const vendorAksi = document.getElementById('eVendorAksi')?.value || 'tambah';
            const statusTito = document.getElementById('eStatusTito')?.value || 'Belum TITO';
            const qty = parseInt(document.getElementById('eQty').value) || 0;
            const expiredDate = document.getElementById('eExpired')?.value || '-';
            const desc = document.getElementById('eDesc').value || '-';

            let isTambah = true;
            let labelTipe = opsi;
            let statusTitoFinal = '-';

            if (opsi === 'Transfer In') {
                isTambah = true;
                statusTitoFinal = statusTito;
            } else if (opsi === 'Transfer Out') {
                isTambah = false;
                statusTitoFinal = statusTito;
            } else if (opsi === 'Restock') {
                isTambah = true;
                labelTipe = 'Restock (+)';
                statusTitoFinal = '-';
            } else if (opsi === 'Kebutuhan Operasional') {
                isTambah = false;
                labelTipe = 'Kebutuhan Operasional (-)';
                statusTitoFinal = '-';
            } else if (opsi === 'Vendor') {
                isTambah = (vendorAksi === 'tambah');
                labelTipe = `Vendor (${vendorAksi === 'tambah' ? 'In' : 'Out'})`;
                statusTitoFinal = '-';
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
                    catatan: `${desc} ${expiredDate !== '-' ? '(Exp: ' + expiredDate + ')' : ''}`,
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

    // Modal Edit Riwayat (Status TITO & Catatan)
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

// --- 3. RENDER TOMBOL FILTER KATEGORI ---
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
            let bgStyle = isActive ? 'background: #38bdf8; color: #0f172a; font-weight: bold;' : 'background: var(--bg-card); color: var(--text-sub);';
            
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
                let subBgStyle = isSubActive ? 'background: #0284c7; color: white; font-weight: bold;' : 'background: var(--bg-card); color: var(--text-sub);';
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

// --- 4. TAMPILKAN DATA & DASHBOARD RIWAYAT DENGAN TITO ---
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

            let totalMasuk = riwayatTrx.filter(t => !t.tipe.toLowerCase().includes('out') && !t.tipe.toLowerCase().includes('kurang')).length;
            let totalKeluar = riwayatTrx.filter(t => t.tipe.toLowerCase().includes('out') || t.tipe.toLowerCase().includes('kurang') || t.tipe.toLowerCase().includes('keluar')).length;

            let html = `
                <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; margin-bottom: 20px; color: var(--text-color);">
                    <h3 style="margin-bottom: 10px; font-size: 16px; color: #38bdf8;">📊 Dashboard Ringkasan Aktivitas</h3>
                    <div style="display: flex; gap: 20px; font-size: 14px;">
                        <div>Total Transaksi Masuk: <b style="color: #10b981;">${totalMasuk}</b></div>
                        <div>Total Transaksi Keluar: <b style="color: #ef4444;">${totalKeluar}</b></div>
                    </div>
                </div>
            `;

            let filteredRiwayat = riwayatTrx.filter(trx => {
                let matchKeyword = trx.namaBarang ? trx.namaBarang.toLowerCase().includes(keyword.toLowerCase()) : false;
                let katTrx = trx.kategori || 'FOOD';
                let matchKategori = false;

                if (activeKategoriFilter === 'Semua') {
                    matchKategori = true;
                } else if (activeKategoriFilter === 'FOOD') {
                    if (katTrx.startsWith('FOOD')) {
                        if (activeSubFoodFilter === 'Semua') {
                            matchKategori = true;
                        } else {
                            matchKategori = katTrx === `FOOD - ${activeSubFoodFilter}`;
                        }
                    }
                } else {
                    matchKategori = katTrx === activeKategoriFilter;
                }

                return matchKeyword && matchKategori;
            });

            if (filteredRiwayat.length === 0) {
                html += `
                    <div style="text-align: center; color: var(--text-sub); padding: 40px; background: var(--bg-card); border-radius: 12px;">
                        <p>Belum ada riwayat transaksi pada kategori ini.</p>
                    </div>`;
            } else {
                html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
                filteredRiwayat.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                
                filteredRiwayat.forEach(trx => {
                    const isKeluar = trx.tipe.toLowerCase().includes('out') || trx.tipe.toLowerCase().includes('kurang') || trx.tipe.toLowerCase().includes('keluar');
                    const color = isKeluar ? '#ef4444' : '#10b981';

                    // Rendering badge TITO jika transaksi berjenis Transfer In / Transfer Out
                    let titoBadge = '';
                    if (trx.statusTito && trx.statusTito !== '-') {
                        const isSudah = trx.statusTito === 'Sudah TITO';
                        const titoBg = isSudah ? 'background: #10b981; color: white;' : 'background: #f59e0b; color: #0f172a;';
                        titoBadge = `<span style="${titoBg} font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: bold; margin-left: 6px;">${trx.statusTito}</span>`;
                    }

                    // Menampilkan tombol "Edit TITO" hanya jika opsi berjenis Transfer In / Out
                    let btnEditTito = '';
                    if (trx.tipe === 'Transfer In' || trx.tipe === 'Transfer Out' || (trx.statusTito && trx.statusTito !== '-')) {
                        btnEditTito = `<button onclick="bukaModalEditRiwayat('${trx.id}', '${trx.namaBarang}', '${trx.statusTito || 'Belum TITO'}', '${(trx.catatan || '').replace(/'/g, "\\'")}')" style="background: #3b82f6; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">Edit TITO</button>`;
                    }

                    html += `
                        <div style="background: var(--bg-card); padding: 14px 18px; border-radius: 8px; color: var(--text-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                    <span style="color: ${color}; font-weight: bold;">[${trx.tipe}]</span> 
                                    ${trx.namaBarang} (${trx.jumlah} ${trx.satuan || ''}) 
                                    <span style="background: var(--border-color); color: #38bdf8; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${trx.kategori || 'FOOD'}</span>
                                    ${titoBadge}
                                </div>
                                <div style="font-size: 12px; color: var(--text-sub); margin-top: 4px;">Deskripsi: <b>${trx.catatan || '-'}</b></div>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                                <div style="font-size: 12px; color: var(--text-sub);">${trx.tanggal}</div>
                                ${btnEditTito}
                            </div>
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

// --- FUNGSI BANTUAN RENDER TAB STOK ---
function renderStokView(listBarang, keyword, main) {
    let filtered = listBarang.filter(item => {
        let matchKeyword = item.nama ? item.nama.toLowerCase().includes(keyword.toLowerCase()) : false;
        let katItem = item.kategori || 'FOOD';
        let matchKategori = false;

        if (activeKategoriFilter === 'Semua') {
            matchKategori = true;
        } else if (activeKategoriFilter === 'FOOD') {
            if (katItem.startsWith('FOOD')) {
                if (activeSubFoodFilter === 'Semua') {
                    matchKategori = true;
                } else {
                    matchKategori = katItem === `FOOD - ${activeSubFoodFilter}`;
                }
            }
        } else {
            matchKategori = katItem === activeKategoriFilter;
        }

        return matchKeyword && matchKategori;
    });

    if (filtered.length === 0) {
        main.innerHTML = `
            <div style="text-align: center; color: var(--text-sub); padding: 40px; background: var(--bg-card); border-radius: 12px; margin-top: 10px;">
                <p>Belum ada barang pada kategori ini.</p>
            </div>`;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 5px;">';
    filtered.forEach(item => {
        let statusWarna = item.stok <= item.min ? '#f59e0b' : '#38bdf8';
        if (item.stok === 0) statusWarna = '#ef4444';

        html += `
            <div style="background: var(--bg-card); padding: 16px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; color: var(--text-color);">
                <div>
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                        <strong style="font-size: 16px;">${item.nama}</strong>
                        <span style="background: var(--border-color); color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 12px;">${item.kategori || 'FOOD'}</span>
                    </div>
                    ${item.deskripsi && item.deskripsi !== '-' ? `<div style="font-size: 13px; color: var(--text-sub); margin-top: 2px;">Ket: ${item.deskripsi}</div>` : ''}
                    <div style="font-size: 13px; color: var(--text-color); margin-top: 4px;">
                        Stok: <span style="color: ${statusWarna}; font-weight: bold;">${item.stok} ${item.satuan}</span> 
                        <span style="color: var(--text-sub); font-size: 12px;">(Min: ${item.min})</span>
                        ${item.expired && item.expired !== '-' ? `<br><span style="color: #f43f5e; font-size: 12px; font-weight: 600;">📅 Expired: ${item.expired}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button onclick="bukaModalEdit('${item.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">Edit</button>
                    <button onclick="ubahStokQuick('${item.id}', -1)" title="Kurangi Stok" style="background: var(--border-color); color: var(--text-color); border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">-</button>
                    <button onclick="ubahStokQuick('${item.id}', 1)" title="Tambah Stok" style="background: var(--border-color); color: var(--text-color); border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">+</button>
                    <button onclick="hapusBarang('${item.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Hapus</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    main.innerHTML = html;
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
        const boxStatusTito = document.getElementById('boxStatusTito');
        const eExpired = document.getElementById('eExpired');

        if (pEditNama) pEditNama.textContent = `Barang: ${barang.nama} (${barang.kategori}) - Stok: ${barang.stok} ${barang.satuan}`;
        if (fEdit) fEdit.reset();
        if (boxAksiVendor) boxAksiVendor.style.display = 'none';
        if (boxStatusTito) boxStatusTito.style.display = 'block';
        if (eExpired && barang.expired && barang.expired !== '-') {
            eExpired.value = barang.expired;
        }

        if (dEdit) dEdit.showModal();
    } catch (error) {
        console.error("Gagal membuka modal edit:", error);
    }
}

// --- FUNGSI BUKA MODAL EDIT RIWAYAT (EDIT TITO & CATATAN) ---
function bukaModalEditRiwayat(id, namaBarang, currentStatusTito, currentCatatan) {
    selectedRiwayatEditId = id;
    const dEditRiwayat = document.getElementById('dEditRiwayat');
    const pEditRiwayatInfo = document.getElementById('pEditRiwayatInfo');
    const rStatusTito = document.getElementById('rStatusTito');
    const rCatatan = document.getElementById('rCatatan');

    if (pEditRiwayatInfo) pEditRiwayatInfo.textContent = `Barang: ${namaBarang}`;
    if (rStatusTito) rStatusTito.value = currentStatusTito !== '-' ? currentStatusTito : 'Belum TITO';
    if (rCatatan) rCatatan.value = currentCatatan || '';

    if (dEditRiwayat) dEditRiwayat.showModal();
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
            statusTito: '-',
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

// --- 8. UPDATE STATISTIK DASHBOARD ATAS & INTERAKTIF KLIK ---
async function updateStatistik() {
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "stok_barang"));
        let listBarang = [];
        querySnapshot.forEach(docSnap => {
            listBarang.push(docSnap.data());
        });
        updateStatistikRealtime(listBarang);
    } catch (error) {
        console.error("Gagal memperbarui statistik:", error);
    }
}

function updateStatistikRealtime(listBarang) {
    const sTotal = document.getElementById('sTotal');
    const sLow = document.getElementById('sLow');
    const sOut = document.getElementById('sOut');

    const totalJenis = listBarang.length;
    const listStokMenipis = listBarang.filter(b => Number(b.stok) > 0 && Number(b.stok) <= Number(b.min));
    const listStokHabis = listBarang.filter(b => Number(b.stok) === 0);

    if (sTotal) sTotal.textContent = totalJenis;
    if (sLow) sLow.textContent = listStokMenipis.length;
    if (sOut) sOut.textContent = listStokHabis.length;

    const statLowCard = sLow?.closest('.stat');
    const statOutCard = sOut?.closest('.stat');

    if (statLowCard) {
        statLowCard.style.cursor = 'pointer';
        statLowCard.onclick = () => bukaModalAlerts('Stok Menipis (<= Batas Minimum)', listStokMenipis);
    }

    if (statOutCard) {
        statOutCard.style.cursor = 'pointer';
        statOutCard.onclick = () => bukaModalAlerts('Stok Habis (Jumlah 0)', listStokHabis);
    }
}

// --- 9. FUNGSI POP-UP ALERT ---
function bukaModalAlerts(judul, items) {
    const dAlerts = document.getElementById('dAlerts');
    const tAlertsTitle = document.getElementById('tAlertsTitle');
    const contentAlertsList = document.getElementById('contentAlertsList');

    if (!dAlerts || !tAlertsTitle || !contentAlertsList) return;

    tAlertsTitle.textContent = judul;

    if (items.length === 0) {
        contentAlertsList.innerHTML = '<p style="text-align: center; color: var(--text-sub); padding: 20px;">Tidak ada barang dalam daftar ini.</p>';
        dAlerts.showModal();
        return;
    }

    let grouped = {};
    items.forEach(item => {
        let kat = item.kategori || 'FOOD';
        if (!grouped[kat]) {
            grouped[kat] = [];
        }
        grouped[kat].push(item);
    });

    let html = '';
    for (let kat in grouped) {
        let displayKat = kat;
        if (kat.startsWith('FOOD - ')) {
            let subFoodName = kat.replace('FOOD - ', '');
            displayKat = `--- FOOD --- › ${subFoodName}`;
        } else {
            displayKat = `--- ${kat} ---`;
        }

        html += `
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; border-left: 3px solid #38bdf8; margin-bottom: 8px;">
                <div style="font-weight: bold; color: #38bdf8; font-size: 13px; margin-bottom: 8px; letter-spacing: 0.5px;">${displayKat}</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
        `;

        grouped[kat].forEach(b => {
            html += `
                <div style="display: flex; justify-content: space-between; font-size: 13px; background: var(--bg-card); padding: 6px 10px; border-radius: 6px; align-items: center;">
                    <span style="color: var(--text-color);">• ${b.nama}</span>
                    <strong style="color: ${b.stok === 0 ? '#ef4444' : '#f59e0b'};">${b.stok} ${b.satuan}</strong>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    contentAlertsList.innerHTML = html;
    dAlerts.showModal();
}
