import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { messages, docSummary } = await req.json()
    const system = `You are a helpful assistant for FamilyVault, a secure family document storage app. 
You help families organize and keep track of important documents like passports, insurance policies, medical records, birth certificates, vehicle titles, and more.
${docSummary ? `The user currently has these documents stored: ${docSummary}` : 'The user has no documents stored yet.'}
Be concise, friendly, and practical. Give specific advice about what documents families should have, renewal timelines, and organization tips.`

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
    })

    const reply = res.content[0].type === 'text' ? res.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again.' }, { status: 500 })
  }
}
