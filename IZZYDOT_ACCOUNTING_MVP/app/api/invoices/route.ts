import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const {data,error}=await db.from('invoices').select('*').order('invoice_date',{ascending:false}).limit(1000);
    if(error) throw new Error(`Supabase invoices SELECT: ${error.message}`);
    return NextResponse.json({invoices:data??[]});
  } catch(e) {
    const message=e instanceof Error?e.message:'Ralat tidak diketahui';
    console.error('[GET /api/invoices]',message);
    return NextResponse.json({error:message},{status:500});
  }
}
export async function POST(req:NextRequest) {
  try {
    const b=await req.json();
    const invoice_no=String(b.invoice_no||'').trim();
    const customer=String(b.customer||'').trim();
    const amount=Number(b.amount);
    const invoice_date=String(b.invoice_date||'');
    const status=String(b.status||'Belum Bayar');
    if(!invoice_no||!customer) return NextResponse.json({error:'No. invois dan pelanggan wajib diisi'},{status:400});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(invoice_date)) return NextResponse.json({error:'Tarikh invois tidak sah'},{status:400});
    if(!Number.isFinite(amount)||amount<0) return NextResponse.json({error:'Jumlah invois tidak sah'},{status:400});
    if(!['Belum Bayar','Sudah Bayar','Batal'].includes(status)) return NextResponse.json({error:'Status invois tidak sah'},{status:400});
    const db=getSupabaseAdmin();
    const {data,error}=await db.from('invoices').insert({invoice_no,customer,amount,invoice_date,status,description:String(b.description||'').slice(0,500)}).select('*').single();
    if(error) throw new Error(`Supabase invoices INSERT: ${error.message}`);
    return NextResponse.json({invoice:data},{status:201});
  } catch(e) {
    const message=e instanceof Error?e.message:'Ralat tidak diketahui';
    console.error('[POST /api/invoices]',message);
    const status=message.includes('duplicate key')?409:500;
    return NextResponse.json({error:message},{status});
  }
}
