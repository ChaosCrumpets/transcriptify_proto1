import { NextResponse } from 'next/server';
import { getHistory } from '../queries/getHistory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHistory();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}