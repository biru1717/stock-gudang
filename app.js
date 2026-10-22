// --- 1. INISIALISASI DATA DARI LOCALSTORAGE ---
let listBarang = JSON.parse(localStorage.getItem('stok_barang')) || [];

// Jalankan fungsi tampilkan data saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', () => {
    tampilkanData();
    hilangkanPesanErrorServer();
});

// --- 2. FUNGSI PENYIMPANAN ---
function simpanKeStorage() {
    localStorage.setItem('stok_barang', JSON.stringify(listBarang));
}

// Hilangkan banner / teks "Tidak bisa terhubung ke server" secara otomatis
function hilangkanPesanErrorServer() {
    // Mencari elemen yang tulisannya mengandung "Tidak bisa terhubung"
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        if (el.textContent.includes('Tidak bisa terhubung ke server')) {
            el.remove();
        }
    });
}

// --- 3. FUNGSI UTAMA (TAMBAH & TAMPILKAN) ---
function tambahBarang(event) {
    if (event) event.preventDefault(); // Mencegah form reload halaman jika pakai tag <form>

    // Ambil nilai dari input form (sesuaikan id input HTML Anda jika berbeda)
    const namaBarang = document.getElementById('namaBarang')?.value || '';
    const jenisBarang = document.getElementById('jenisBarang')?.value || '';
    const jumlahBarang = parseInt(document.getElementById('jumlahBarang')?.value) || 0;

    if (!namaBarang) {
        alert('Nama barang tidak boleh kosong!');
        return;
    }

    // Buat objek data baru
    const barangBaru = {
        id: Date.now(), // ID unik berdasarkan waktu
        nama: namaBarang,
        jenis: jenisBarang,
        jumlah: jumlahBarang
    };

    // Masukkan ke array
    listBarang.push(barangBaru);
    
    // Simpan ke LocalStorage browser
    simpanKeStorage(); 
    
    // Refresh tampilan tabel/UI
    tampilkanData();    

    // Bersihkan form input setelah ditambahkan
    document.getElementById('formInputBarang')?.reset();
}

// --- 4. FUNGSI MENAMPILKAN DATA KE HTML ---
function tampilkanData() {
    const containerTabel = document.getElementById('tabelBarang') || document.getElementById('list-barang');
    
    // Hitung ringkasan statistik (Jenis barang, Stok menipis, dll)
    updateStatistik();

    if (!containerTabel) return;

    // Jika data kosong
    if (listBarang.length === 0) {
        containerTabel.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada barang. Mulai dengan menambahkan barang pertama.</td></tr>`;
        return;
    }

    // Render data ke dalam bentuk baris tabel/list
    let html = '';
    listBarang.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.nama}</td>
                <td>${item.jenis}</td>
                <td>${item.jumlah}</td>
                <td>
                    <button onclick="hapusBarang(${item.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Hapus</button>
                </td>
            </tr>
        `;
    });

    containerTabel.innerHTML = html;
}

// --- 5. FUNGSI HAPUS BARANG ---
function hapusBarang(id) {
    listBarang = listBarang.filter(item => item.id !== id);
    simpanKeStorage();
    tampilkanData();
}

// --- 6. FUNGSI HITUNG STATISTIK (ANGKA 0 DI ATAS DASHBOARD) ---
function updateStatistik() {
    const elTotalJenis = document.getElementById('totalJenis');
    const elStokMenipis = document.getElementById('stokMenipis');
    const elStokHabis = document.getElementById('stokHabis');

    if (elTotalJenis) elTotalJenis.textContent = listBarang.length;
    
    let menipis = listBarang.filter(item => item.jumlah > 0 && item.jumlah <= 5).length;
    let habis = listBarang.filter(item => item.jumlah === 0).length;

    if (elStokMenipis) elStokMenipis.textContent = menipis;
    if (elStokHabis) elStokHabis.textContent = habis;
}

// --- OTOMATISASI KLIK TOMBOL UTAMA ---
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan render data awal
    if (typeof tampilkanData === 'function') {
        tampilkanData();
    }

    // Mencari tombol "Tambah barang" berdasarkan teks di dalamnya
    const semuaTombol = document.querySelectorAll('button');
    semuaTombol.forEach(tombol => {
        if (tombol.textContent.includes('Tambah barang')) {
            tombol.addEventListener('click', () => {
                // Cek apakah ada fungsi bawaan modal atau form Anda, contoh: bukaModal()
                if (typeof bukaModalTambah === 'function') {
                    bukaModalTambah();
                } else {
                    // Jika tidak ada fungsi modal, arahkan ke prompt sederhana untuk input data
                    let nama = prompt("Masukkan nama barang baru:");
                    if (nama) {
                        let jenis = prompt("Masukkan jenis barang:");
                        let jumlah = parseInt(prompt("Masukkan jumlah stok:")) || 0;
                        
                        // Masukkan ke array dan simpan
                        listBarang.push({ id: Date.now(), nama: nama, jenis: jenis, jumlah: jumlah });
                        simpanKeStorage();
                        tampilkanData();
                    }
                }
            });
        }
    });
});
