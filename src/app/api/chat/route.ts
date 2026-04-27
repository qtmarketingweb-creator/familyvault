import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, docSummary } = await req.json()
    const system = 'You are a helpful assistant for FamilyVault, a secure family document storage app. Help families organize important documents like passports, insurance, medical records, birth certificates, and vehicle titles. Be concise and practical.' + (docSummary ? ' The user has these documents: ' + docSummary : '')
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
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
    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data))
      return NextResponse.json({ reply: 'API error: ' + data.error?.message }, { status: 500 })
    }
    
    const reply = data.content?.[0]?.text || 'No response'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Error: ' + String(err) }, { status: 500 })
  }
}