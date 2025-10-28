import { NextRequest, NextResponse } from 'next/server'
import { ClientConfig, Client, MessageAPIResponseBase, TextMessage } from '@line/bot-sdk'
import { supabase } from '@/lib/supabase'

const clientConfig: ClientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
}

const client = new Client(clientConfig)

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json()
    console.log('[LINE API] Received request to send message:', { userId, message })

    if (!userId || !message) {
      console.error('[LINE API] Missing userId or message')
      return NextResponse.json({ error: 'Missing userId or message' }, { status: 400 })
    }

    // Supabaseからline_user_idを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('line_user_id')
      .eq('id', userId)
      .single()

    console.log('[LINE API] Supabase user data fetch result:', { userData, userError })

    if (userError || !userData) {
      console.error('[LINE API] Error fetching line_user_id from Supabase:', userError)
      return NextResponse.json({ error: 'User not found or error fetching user data' }, { status: 404 })
    }

    const lineUserId = userData.line_user_id
    console.log('[LINE API] Retrieved lineUserId:', lineUserId)

    if (!lineUserId) {
      console.error('[LINE API] LINE User ID not found for the given user')
      return NextResponse.json({ error: 'LINE User ID not found for the given user' }, { status: 404 })
    }

    const messagePayload: TextMessage = {
      type: 'text',
      text: message,
    }

    console.log('[LINE API] Sending push message to LINE:', { lineUserId, messagePayload })
    const response: MessageAPIResponseBase = await client.pushMessage(lineUserId, messagePayload)
    console.log('[LINE API] LINE push message response:', response)

    return NextResponse.json({ success: true, response }, { status: 200 })
  } catch (error) {
    console.error('[LINE API] Error sending LINE message:', error)
    return NextResponse.json({ error: 'Failed to send LINE message' }, { status: 500 })
  }
}
