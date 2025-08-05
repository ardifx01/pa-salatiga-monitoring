import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connection from '@/lib/db';

export async function GET() {
  try {
    const db = await connection;
    const [rows] = await db.execute(
      'SELECT setting_key, setting_value, setting_type FROM app_settings ORDER BY setting_key'
    );
    
    const settings: Record<string, string | number | boolean> = {};
    (rows as { setting_key: string; setting_value: string; setting_type: string }[]).forEach((row) => {
      let value = row.setting_value;
      
      // Convert value based on type
      if (row.setting_type === 'boolean') {
        value = value === 'true';
      } else if (row.setting_type === 'number') {
        value = parseInt(value);
      }
      
      settings[row.setting_key] = value;
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();
    const db = await connection;
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = String(value);
      
      await db.execute(
        'UPDATE app_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [stringValue, key]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}