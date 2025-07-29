import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Setting from '@/lib/db/models/setting.model'

export async function GET() {
  try {
    await connectToDatabase()

    const settings = await Setting.findOne({}, 'site') // fetch only the `site` field

    if (!settings || !settings.site) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json({
      email: settings.site.email,
      phone: settings.site.phone,
      address: settings.site.address,
    })
  } catch (error) {
    console.error('[API] Footer settings error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
