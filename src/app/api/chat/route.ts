import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
const client = new Anthropic()
export async function POST(req: NextRequest) {
  try {
    const { messages, docSummary } = await req.json()
    const system = 'You are a helpful assistant for FamilyVault, a secure family document storage app. Help families organize important documents. Be concise and practical.' + (docSummary ? ' User has: ' + docSummary : '')
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    })
    const reply = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: 'Error: ' + String(err) }, { status: 500 })
  }
}