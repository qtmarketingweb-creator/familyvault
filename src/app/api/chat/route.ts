import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, docSummary } = await req.json()
    const system = 'You are a helpful assistant for FamilyVault. Help families organize important documents. Be concise and practical.' + (docSummary ? ' User documents: ' + docSummary : '')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system,
        messages: messages.map((m: {role: string; content: string}) => ({ role: m.role, content: m.content }))
      })
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ reply: 'Error: ' + data.error?.message }, { status: 500 })
    return NextResponse.json({ reply: data.content?.[0]?.text || 'No response' })
  } catch (err) {
    return NextResponse.json({ reply: 'Error: ' + String(err) }, { status: 500 })
  }
}
