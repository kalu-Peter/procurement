import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetch('http://127.0.0.1:8000/api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'application/json';
    return new NextResponse(text, { status: backendRes.status, headers: { 'Content-Type': contentType } });
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', detail: err?.message || String(err) }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
