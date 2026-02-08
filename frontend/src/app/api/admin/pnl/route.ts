import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.MOLTGIG_ADMIN_KEY || process.env.ADMIN_API_KEY;

function hasValidAdminKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-admin-api-key');
  return !!ADMIN_API_KEY && apiKey === ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  try {
    if (!hasValidAdminKey(request)) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get('period') || 'all';

    const response = await fetch(`${BACKEND_URL}/api/admin/pnl?period=${period}`, {
      headers: { 'x-admin-api-key': ADMIN_API_KEY || '' },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PnL fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
