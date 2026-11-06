'use client';

import { useEffect, useMemo, useState } from 'react';

type Tx = {
  id: string; date: string; kind: 'sales_cash'|'sales_qr'|'expense';
  amount: number; category: string; description: string; customer?: string;
};
type Invoice = { id:string; invoice_no:string; invoice_date:string; customer:string; description:string; amount:number; status:string };
const MYR = new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'});
const today = () => new Date().toLocaleDateString('en-CA');
const labels: Record<string,string> = {sales_cash:'Jualan Tunai',sales_qr:'Jualan QR',expense:'Duit Keluar'};
const emptyForm = () => ({date:today(),kind:'sales_cash' as Tx['kind'],amount:'',category:'Jualan',description:'',customer:''});

export default function Home() {
  const [tab,setTab] = useState<'dashboard'|'transactions'|'invoices'|'reports'>('dashboard');
  const [transactions,setTransactions] = useState<Tx[]>([]);
  const [invoices,setInvoices] = useState<Invoice[]>([]);
  const [form,setForm] = useState(emptyForm());
  const [invoiceForm,setInvoiceForm] = useState({invoice_no:'',invoice_date:today(),customer:'',description:'',amount:'',status:'Belum Bayar'});
  const [month,setMonth] = useState(today().slice(0,7));
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [access,setAccess] = useState('');
  const [unlocked,setUnlocked] = useState(false);
  useEffect(()=>{ if(sessionStorage.getItem('izzydot_access')) setUnlocked(true); },[]);

  async function load() {
    try {
      const r = await fetch('/api/transactions',{cache:'no-store',headers:{'x-access-code':sessionStorage.getItem('izzydot_access')||''}});
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Gagal mendapatkan transaksi');
      setTransactions(j.transactions || []);
      const ir = await fetch('/api/invoices',{cache:'no-store',headers:{'x-access-code':sessionStorage.getItem('izzydot_access')||''}});
      const ij = await ir.json();
      if (ir.ok) setInvoices(ij.invoices || []);
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Ralat sambungan'); }
  }
  useEffect(()=>{ if(unlocked) load(); },[unlocked]);

  const inMonth = useMemo(()=>transactions.filter(t=>t.date?.slice(0,7)===month),[transactions,month]);
  const totalCash = inMonth.filter(t=>t.kind==='sales_cash').reduce((s,t)=>s+Number(t.amount),0);
  const totalQR = inMonth.filter(t=>t.kind==='sales_qr').reduce((s,t)=>s+Number(t.amount),0);
  const totalExpense = inMonth.filter(t=>t.kind==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const net = totalCash+totalQR-totalExpense;

  async function saveTransaction(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const r=await fetch('/api/transactions',{method:'POST',headers:{'Content-Type':'application/json','x-access-code':sessionStorage.getItem('izzydot_access')||''},body:JSON.stringify({...form,amount:Number(form.amount)})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error || 'Transaksi gagal disimpan');
      setForm(emptyForm()); setMessage('Transaksi berjaya disimpan'); await load();
    } catch(e) { setMessage(e instanceof Error?e.message:'Ralat menyimpan transaksi'); }
    finally { setBusy(false); }
  }
  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const r=await fetch('/api/invoices',{method:'POST',headers:{'Content-Type':'application/json','x-access-code':sessionStorage.getItem('izzydot_access')||''},body:JSON.stringify({...invoiceForm,amount:Number(invoiceForm.amount)})});
      const j=await r.json(); if(!r.ok) throw new Error(j.error || 'Invois gagal disimpan');
      setInvoiceForm({invoice_no:'',invoice_date:today(),customer:'',description:'',amount:'',status:'Belum Bayar'});
      setMessage('Invois berjaya disimpan'); await load();
    } catch(e) { setMessage(e instanceof Error?e.message:'Ralat menyimpan invois'); }
    finally { setBusy(false); }
  }
  function exportCSV() {
    const rows=[['Tarikh','Jenis','Jumlah (RM)','Kategori','Keterangan','Pelanggan'],...inMonth.map(t=>[t.date,labels[t.kind],Number(t.amount).toFixed(2),t.category,t.description,t.customer||''])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a'); a.href=url; a.download=`izzydot-laporan-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  if(!unlocked) return <main className="gate"><div className="gateCard"><div className="logo">ID</div><p className="eyebrow">SISTEM PENGURUSAN KEWANGAN</p><h1>IZZYDOT <span>ACCOUNTING</span></h1><p className="muted">Rekod akaun harian, invois dan laporan dalam satu tempat.</p><form onSubmit={async e=>{e.preventDefault();setMessage('');try{const r=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:access})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Kod akses tidak sah');sessionStorage.setItem('izzydot_access',access);setUnlocked(true)}catch(err){setMessage(err instanceof Error?err.message:'Gagal mengesahkan kod')}}}><label>Kod akses paparan</label><input value={access} onChange={e=>setAccess(e.target.value)} placeholder="Masukkan kod akses" required/><button className="primary full">Buka sistem</button></form><small>Nota: kawalan kod akses ini ialah lapisan UI asas. Untuk data kewangan sebenar, tambah authentication server-side sebelum penggunaan awam.</small></div></main>;

  return <main className="appShell">
    <aside className="sidebar"><div className="brand"><div className="logo small">ID</div><div><b>IZZYDOT</b><span>ACCOUNTING</span></div></div>
      <nav>{(['dashboard','transactions','invoices','reports'] as const).map(k=><button key={k} className={tab===k?'nav active':'nav'} onClick={()=>setTab(k)}>{({dashboard:'▦  Dashboard',transactions:'↔  Transaksi',invoices:'▤  Invois',reports:'▥  Laporan'})[k]}</button>)}</nav>
      <div className="sideBottom"><span className="statusDot"/> Sistem Akaun<br/><small>Versi MVP 1.0</small></div>
    </aside>
    <section className="mainArea"><header><div><p className="eyebrow">PENGURUSAN KEWANGAN</p><h1>{({dashboard:'Dashboard',transactions:'Rekod Transaksi',invoices:'Invois Pelanggan',reports:'Laporan Akaun'})[tab]}</h1></div><div className="headerRight"><span className="today">{today()}</span><button className="outline" onClick={load}>↻ Refresh</button></div></header>
      {message && <div className="notice" role="status">{message}<button onClick={()=>setMessage('')}>×</button></div>}
      <div className="monthBar"><label>Bulan laporan</label><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/><span className="muted">Semua angka dalam Ringgit Malaysia (RM)</span></div>
      {tab==='dashboard' && <>
        <div className="cards">
          <Metric title="Jualan Tunai" amount={totalCash} icon="RM" tone="red"/>
          <Metric title="Jualan QR" amount={totalQR} icon="QR" tone="gold"/>
          <Metric title="Jumlah Duit Keluar" amount={totalExpense} icon="−" tone="dark"/>
          <Metric title="Baki Bersih" amount={net} icon="=" tone="green"/>
        </div>
        <div className="gridTwo"><section className="panel"><div className="panelHead"><div><h2>Transaksi terkini</h2><p>Rekod yang paling baru dimasukkan</p></div><button className="textBtn" onClick={()=>setTab('transactions')}>Lihat semua →</button></div><TransactionTable rows={[...transactions].slice(0,8)}/></section>
        <section className="panel"><div className="panelHead"><div><h2>Ringkasan bulan</h2><p>{month}</p></div></div><div className="summaryLine"><span>Jumlah jualan</span><b>{MYR.format(totalCash+totalQR)}</b></div><div className="bar"><i style={{width:`${totalCash+totalQR>0?totalCash/(totalCash+totalQR)*100:0}%`}}/></div><div className="legend"><span><i className="dot red"/> Tunai {MYR.format(totalCash)}</span><span><i className="dot gold"/> QR {MYR.format(totalQR)}</span></div><div className="summaryLine"><span>Jumlah transaksi</span><b>{inMonth.length}</b></div><div className="summaryLine"><span>Invois belum bayar</span><b>{invoices.filter(i=>i.status==='Belum Bayar').length}</b></div><div className="summaryLine"><span>Baki bersih</span><b className={net<0?'negative':'positive'}>{MYR.format(net)}</b></div></section></div>
      </>}
      {tab==='transactions' && <div className="gridTwo transactionLayout"><section className="panel"><div className="panelHead"><div><h2>Tambah transaksi</h2><p>Isi butiran transaksi harian</p></div></div><form className="stackForm" onSubmit={saveTransaction}><label>Tarikh<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label>Jenis transaksi<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value as Tx['kind'],category:e.target.value==='expense'?'Operasi':'Jualan'})}><option value="sales_cash">Jualan Tunai</option><option value="sales_qr">Jualan QR</option><option value="expense">Duit Keluar / Perbelanjaan</option></select></label><label>Jumlah (RM)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" required/></label><label>Kategori<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Contoh: Jualan, minyak, barang"/></label><label>Pelanggan / Penerima<input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} placeholder="Nama (jika berkaitan)"/></label><label>Keterangan<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Butiran ringkas"/></label><button className="primary" disabled={busy}>{busy?'Menyimpan...':'Simpan transaksi'}</button></form></section><section className="panel"><div className="panelHead"><div><h2>Senarai transaksi</h2><p>{inMonth.length} rekod untuk {month}</p></div><button className="outline" onClick={exportCSV}>Eksport CSV</button></div><TransactionTable rows={inMonth}/></section></div>}
      {tab==='invoices' && <div className="gridTwo transactionLayout"><section className="panel"><div className="panelHead"><div><h2>Cipta invois</h2><p>Rekod invois pelanggan</p></div></div><form className="stackForm" onSubmit={saveInvoice}><label>No. invois<input value={invoiceForm.invoice_no} onChange={e=>setInvoiceForm({...invoiceForm,invoice_no:e.target.value})} placeholder="INV-0001" required/></label><label>Tarikh invois<input type="date" value={invoiceForm.invoice_date} onChange={e=>setInvoiceForm({...invoiceForm,invoice_date:e.target.value})} required/></label><label>Nama pelanggan<input value={invoiceForm.customer} onChange={e=>setInvoiceForm({...invoiceForm,customer:e.target.value})} required/></label><label>Keterangan<input value={invoiceForm.description} onChange={e=>setInvoiceForm({...invoiceForm,description:e.target.value})} placeholder="Produk / servis"/></label><label>Jumlah (RM)<input type="number" min="0" step="0.01" value={invoiceForm.amount} onChange={e=>setInvoiceForm({...invoiceForm,amount:e.target.value})} required/></label><label>Status<select value={invoiceForm.status} onChange={e=>setInvoiceForm({...invoiceForm,status:e.target.value})}><option>Belum Bayar</option><option>Sudah Bayar</option><option>Batal</option></select></label><button className="primary" disabled={busy}>{busy?'Menyimpan...':'Simpan invois'}</button></form></section><section className="panel"><div className="panelHead"><div><h2>Senarai invois</h2><p>Semua invois pelanggan</p></div></div><div className="tableWrap"><table><thead><tr><th>No. Invois</th><th>Pelanggan</th><th>Tarikh</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>{invoices.map(i=><tr key={i.id}><td><b>{i.invoice_no}</b></td><td>{i.customer}</td><td>{i.invoice_date}</td><td>{MYR.format(Number(i.amount))}</td><td><span className={`pill ${i.status==='Sudah Bayar'?'paid':i.status==='Batal'?'cancelled':'unpaid'}`}>{i.status}</span></td></tr>)}{!invoices.length&&<tr><td colSpan={5} className="empty">Belum ada invois</td></tr>}</tbody></table></div></section></div>}
      {tab==='reports' && <section className="panel"><div className="panelHead"><div><h2>Laporan kewangan</h2><p>Ringkasan transaksi untuk {month}</p></div><button className="primary" onClick={exportCSV}>Muat turun CSV</button></div><div className="reportStats"><div><span>Jualan tunai</span><b>{MYR.format(totalCash)}</b></div><div><span>Jualan QR</span><b>{MYR.format(totalQR)}</b></div><div><span>Jumlah jualan</span><b>{MYR.format(totalCash+totalQR)}</b></div><div><span>Perbelanjaan</span><b>{MYR.format(totalExpense)}</b></div><div><span>Baki bersih</span><b>{MYR.format(net)}</b></div></div><TransactionTable rows={inMonth}/></section>}
      <footer>IZZYDOT ACCOUNTING <span>•</span> Rekod kewangan lebih tersusun</footer>
    </section>
  </main>;
}
function Metric({title,amount,icon,tone}:{title:string;amount:number;icon:string;tone:string}) {
 return <div className="metric"><div className={`metricIcon ${tone}`}>{icon}</div><span>{title}</span><strong>{MYR.format(amount)}</strong><small>Untuk bulan dipilih</small></div>
}
function TransactionTable({rows}:{rows:Tx[]}) {
 return <div className="tableWrap"><table><thead><tr><th>Tarikh</th><th>Jenis</th><th>Keterangan</th><th>Kategori</th><th className="right">Jumlah</th></tr></thead><tbody>{rows.map(t=><tr key={t.id}><td>{t.date}</td><td><span className={`pill ${t.kind==='expense'?'unpaid':t.kind==='sales_qr'?'paid':'cash'}`}>{labels[t.kind]}</span></td><td>{t.description||t.customer||'—'}</td><td>{t.category}</td><td className={`right amount ${t.kind==='expense'?'negative':'positive'}`}>{t.kind==='expense'?'−':'+'}{MYR.format(Number(t.amount))}</td></tr>)}{!rows.length&&<tr><td colSpan={5} className="empty">Tiada transaksi untuk bulan ini</td></tr>}</tbody></table></div>
}
