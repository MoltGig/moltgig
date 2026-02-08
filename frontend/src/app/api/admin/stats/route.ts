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
    // Allow access via admin API key (for agents) or Supabase auth (for dashboard)
    if (!hasValidAdminKey(request)) {
      const authHeader = request.headers.get('authorization');
      let accessToken: string | null = null;

      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.slice(7);
      } else {
        const supabaseCookie = request.cookies.get('sb-nsfelvytlvffussgydfq-auth-token');
        if (supabaseCookie) {
          try {
            const parsed = JSON.parse(supabaseCookie.value);
            accessToken = parsed.access_token;
          } catch {
            // Cookie format might be different
          }
        }
      }

      if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch stats from backend
    const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
      headers: {
        'x-admin-api-key': ADMIN_API_KEY || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
