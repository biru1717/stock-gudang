(function(){
var KEY="stok-barang-v1",items=[],log=[],tab="stok",flt="",editId=null,tipe="masuk",delId=null;
function load(){return fetch("/api/data").then(function(r){return r.json()}).then(function(d){items=d.items||[];log=d.log||[]}).catch(function(){toast("Tidak bisa terhubung ke server")})}
function save(){fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items,log:log})}).catch(function(){toast("Gagal menyimpan ke server")})}
function $(i){return document.getElementById(i)}
function all(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function st(i){return i.stok<=0?"habis":i.stok<=i.min?"menipis":"aman"}
var LBL={aman:"Aman",menipis:"Menipis",habis:"Habis"};
function fmt(t){return new Date(t).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
function toast(m){var t=$("toast");t.textContent=m;t.className="show";clearTimeout(toast.h);toast.h=setTimeout(function(){t.className=""},3400)}
function find(id){return items.filter(function(i){return i.id==id})[0]}
function add(it,t,qty,cat){log.unshift({t:Date.now(),nama:it.nama,satuan:it.satuan,tipe:t,qty:qty,sisa:it.stok,cat:cat||""});if(log.length>500)log.length=500}
function cnt(s){return items.filter(function(i){return st(i)==s}).length}

function render(){
  var low=items.filter(function(i){return st(i)!="aman"});
  $("sTotal").textContent=items.length;$("sLow").textContent=cnt("menipis");$("sOut").textContent=cnt("habis");
  var a="";
  if(low.length){
    var hasOut=cnt("habis")>0;
    a='<div class="alert'+(hasOut?" d":"")+'"><strong>'+low.length+' barang perlu direstok</strong><div class="chips">'+low.map(function(i){var h=st(i)=="habis";
      return '<span class="ac '+(h?"d":"w")+'">'+esc(i.nama)+' · '+(h?"habis":"sisa "+i.stok+" "+esc(i.satuan))+'<button data-a="restok" data-id="'+i.id+'">Restok</button></span>'}).join("")+'</div></div>'}
  $("alerts").innerHTML=a;
  var f=tab=="stok"?[["","Semua",items.length],["aman","Aman",cnt("aman")],["menipis","Menipis",cnt("menipis")],["habis","Habis",cnt("habis")]]:[["","Semua"],["masuk","Masuk"],["keluar","Keluar"]];
  $("filters").innerHTML=f.map(function(x){return '<button data-f="'+x[0]+'"'+(flt==x[0]?' class="on"':'')+'>'+x[1]+(x[2]!=null?'<small>'+x[2]+'</small>':'')+'</button>'}).join("");
  tab=="stok"?stok():riwayat()
}
function stok(){
  var q=$("q").value.toLowerCase();
  var list=items.filter(function(i){return i.nama.toLowerCase().indexOf(q)>-1&&(!flt||st(i)==flt)});
  if(!list.length){$("main").innerHTML='<div class="empty">'+(items.length?"Tidak ada barang yang cocok.":"Belum ada barang. Mulai dengan menambahkan barang pertama.")+(items.length?"":'<br><button class="primary" data-a="new">Tambah barang</button>')+'</div>';return}
  $("main").innerHTML='<div class="grid">'+list.map(function(i){
    var p=Math.min(100,Math.round(i.stok/(Math.max(i.min,1)*3)*100));
    return '<article class="card" data-s="'+st(i)+'"><div class="ch"><div><h3>'+esc(i.nama)+'</h3><span class="badge s-'+st(i)+'">'+LBL[st(i)]+'</span></div><div class="qty"><b>'+i.stok+'</b><small>'+esc(i.satuan)+'</small></div></div>'+
    '<div class="lvl" title="Garis penanda = batas minimum"><i style="width:'+p+'%"></i><u style="left:33.3%"></u></div><p class="meta">Batas minimum '+i.min+' '+esc(i.satuan)+'</p>'+
    '<div class="ca"><button class="go in" data-a="masuk" data-id="'+i.id+'">+ Masuk</button><button class="go out" data-a="keluar" data-id="'+i.id+'">− Keluar</button><button class="ghost" data-a="edit" data-id="'+i.id+'">Ubah</button><button class="ghost" data-a="hapus" data-id="'+i.id+'">Hapus</button></div></article>'}).join("")+'</div>'
}
function riwayat(){
  var q=$("q").value.toLowerCase();
  var list=log.filter(function(l){return l.nama.toLowerCase().indexOf(q)>-1&&(!flt||l.tipe==flt)});
  if(!list.length){$("main").innerHTML='<div class="empty">Belum ada riwayat. Catat barang masuk atau keluar untuk melihatnya di sini.</div>';return}
  var G={masuk:"↓",keluar:"↑",baru:"+",edit:"✎"};
  $("main").innerHTML='<div class="list">'+list.map(function(l){
    var q=l.tipe=="masuk"?"+"+l.qty:l.tipe=="keluar"?"−"+l.qty:l.tipe=="baru"?"Stok awal "+l.qty:"Diubah";
    var sub=(l.tipe=="masuk"?"Barang masuk":l.tipe=="keluar"?"Barang keluar":l.tipe=="baru"?"Barang baru":"Data diubah")+(l.cat&&l.tipe!="baru"&&l.tipe!="edit"?" · "+esc(l.cat):"")+" · "+fmt(l.t);
    return '<div class="lrow"><span class="ico '+l.tipe+'">'+G[l.tipe]+'</span><div class="lmain"><b>'+esc(l.nama)+'</b><small>'+sub+'</small></div><div class="lq"><b>'+q+(l.tipe=="masuk"||l.tipe=="keluar"?" "+esc(l.satuan):"")+'</b><small>sisa '+l.sisa+'</small></div></div>'}).join("")+'</div>'
}

function pv(){
  var it=find($("tItem").value),n=+$("tQty").value||0,p=$("pv"),b=$("bTrx");
  if(!it){p.textContent="";b.disabled=true;return}
  var after=tipe=="masuk"?it.stok+n:it.stok-n;
  p.className="pv";b.disabled=false;
  p.textContent="Stok "+it.stok+" → "+after+" "+it.satuan;
  if(n<1){b.disabled=true}
  else if(after<0){p.className="pv d";p.textContent="Stok tidak cukup. Tersisa "+it.stok+" "+it.satuan+".";b.disabled=true}
  else if(after<=0){p.className="pv d";p.textContent+=" · stok akan habis"}
  else if(after<=it.min){p.className="pv w";p.textContent+=" · di bawah batas minimum"}
}
function openTrx(t,id){
  if(!items.length){toast("Tambahkan barang terlebih dahulu");return}
  tipe=t;all("#segT button").forEach(function(b){b.classList.toggle("on",b.dataset.t==t)});
  $("tItem").innerHTML=items.map(function(i){return '<option value="'+i.id+'">'+esc(i.nama)+' (stok '+i.stok+')</option>'}).join("");
  if(id)$("tItem").value=id;$("tQty").value=1;$("tCat").value="";pv();$("dTrx").showModal()
}

$("btnAdd").onclick=function(){editId=null;$("tItemT").textContent="Tambah barang";$("fItem").reset();$("iStok").disabled=false;$("dItem").showModal()};
$("btnTrx").onclick=function(){openTrx("masuk")};
$("fItem").onsubmit=function(){
  var nama=$("iNama").value.trim(),stok=+$("iStok").value,sat=$("iSatuan").value.trim(),min=+$("iMin").value;
  if(editId){var it=find(editId);it.nama=nama;it.satuan=sat;it.min=min;add(it,"edit",0,"");toast("Perubahan disimpan")}
  else{var n={id:Date.now(),nama:nama,stok:stok,satuan:sat,min:min};items.push(n);add(n,"baru",stok,"");toast("Barang ditambahkan")}
  save();render()
};
$("fTrx").onsubmit=function(){
  var it=find($("tItem").value),n=+$("tQty").value;
  if(!it||n<1||(tipe=="keluar"&&n>it.stok))return false;
  it.stok+=tipe=="masuk"?n:-n;add(it,tipe,n,$("tCat").value.trim());save();render();
  var s=st(it);
  toast(tipe=="keluar"&&s=="habis"?it.nama+" sekarang habis. Segera restok.":tipe=="keluar"&&s=="menipis"?"Peringatan: stok "+it.nama+" menipis (sisa "+it.stok+" "+it.satuan+")":(tipe=="masuk"?"Barang masuk dicatat":"Barang keluar dicatat"))
};
$("segT").onclick=function(e){var b=e.target.closest("button");if(!b)return;tipe=b.dataset.t;all("#segT button").forEach(function(x){x.classList.toggle("on",x==b)});pv()};
$("tItem").onchange=pv;$("tQty").oninput=pv;
$("mn").onclick=function(){$("tQty").value=Math.max(1,(+$("tQty").value||1)-1);pv()};
$("pl").onclick=function(){$("tQty").value=(+$("tQty").value||0)+1;pv()};
$("bDel").onclick=function(){var it=find(delId);items=items.filter(function(x){return x.id!=delId});$("dDel").close();save();render();toast((it?it.nama:"Barang")+" dihapus")};
function act(e){
  var b=e.target.closest("button[data-a]");if(!b)return;var a=b.dataset.a,it=find(b.dataset.id);
  if(a=="new")$("btnAdd").onclick();
  else if(a=="masuk"||a=="keluar")openTrx(a,it.id);
  else if(a=="restok")openTrx("masuk",it.id);
  else if(a=="edit"){editId=it.id;$("tItemT").textContent="Ubah barang";$("iNama").value=it.nama;$("iStok").value=it.stok;$("iStok").disabled=true;$("iSatuan").value=it.satuan;$("iMin").value=it.min;$("dItem").showModal()}
  else if(a=="hapus"){delId=it.id;$("pDel").textContent=it.nama+" akan dihapus dari daftar. Riwayatnya tetap tersimpan.";$("dDel").showModal()}
}
$("main").onclick=act;$("alerts").onclick=act;
all(".cancel").forEach(function(b){b.onclick=function(){b.closest("dialog").close()}});
$("tabs").onclick=function(e){var b=e.target.closest("button");if(!b)return;tab=b.dataset.tab;flt="";all("#tabs button").forEach(function(x){x.classList.toggle("on",x==b)});render()};
$("filters").onclick=function(e){var b=e.target.closest("button");if(!b)return;flt=b.dataset.f;render()};
$("q").oninput=function(){tab=="stok"?stok():riwayat()};
load().then(render);
})();