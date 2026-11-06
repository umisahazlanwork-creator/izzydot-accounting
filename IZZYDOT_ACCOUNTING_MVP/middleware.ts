import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/') && req.nextUrl.pathname !== '/api/access') {
    const expected = process.env.IZZYDOT_ACCESS_CODE;
    if (!expected) return NextResponse.json({error:'IZZYDOT_ACCESS_CODE belum ditetapkan di Vercel Environment Variables'},{status:500});
    if (req.headers.get('x-access-code') !== expected) return NextResponse.json({error:'Akses ditolak. Sila masukkan kod akses yang betul.'},{status:401});
  }
  return NextResponse.next();
}
export const config = { matcher: ['/api/:path*'] };
