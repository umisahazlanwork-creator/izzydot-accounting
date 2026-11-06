import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('transactions').select('*').order('date',{ascending:false}).order('created_at',{ascending:false}).limit(1000);
    if (error) throw new Error(`Supabase transactions SELECT: ${error.message}`);
    return NextResponse.json({ transactions: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ralat tidak diketahui';
    console.error('[GET /api/transactions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const date = String(body.date || '');
    const kind = String(body.kind || '');
    const amount = Number(body.amount);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({error:'Tarikh tidak sah'}, {status:400});
    if (!['sales_cash','sales_qr','expense'].includes(kind)) return NextResponse.json({error:'Jenis transaksi tidak sah'}, {status:400});
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({error:'Jumlah mesti lebih daripada RM0'}, {status:400});
    const payload = {
      date, kind, amount,
      category: String(body.category || 'Umum').slice(0,100),
      description: String(body.description || '').slice(0,500),
      customer: String(body.customer || '').slice(0,200)
    };
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('transactions').insert(payload).select('*').single();
    if (error) throw new Error(`Supabase transactions INSERT: ${error.message}`);
    return NextResponse.json({ transaction: data }, { status:201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ralat tidak diketahui';
    console.error('[POST /api/transactions]', message);
    return NextResponse.json({ error: message }, { status:500 });
  }
}
