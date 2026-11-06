import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  const expected = process.env.IZZYDOT_ACCESS_CODE;
  if (!expected) return NextResponse.json({error:'IZZYDOT_ACCESS_CODE belum ditetapkan di Vercel Environment Variables'},{status:500});
  const body = await req.json().catch(()=>({}));
  if (typeof body.code !== 'string' || body.code !== expected) return NextResponse.json({error:'Kod akses tidak sah'},{status:401});
  return NextResponse.json({ok:true});
}
