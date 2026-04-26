'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }
    fetch('/api/subscription?session_id=' + sessionId)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'paid' && d.customerId) {
          localStorage.setItem('fv_customer_id', d.customerId)
          localStorage.setItem('fv_pro', 'true')
          setStatus('success')
        } else { setStatus('error') }
      }).catch(() => setStatus('error'))
  }, [sessionId])
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && <><div className="text-5xl mb-4">loading</div><h1 className="text-2xl font-bold">Confirming...</h1></>}
        {status === 'success' && <><div className="text-5xl mb-4">done</div><h1 className="text-2xl font-bold mb-3">You are Pro!</h1><p className="text-slate-400 mb-8">Unlimited documents unlocked.</p><a href="/" className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl inline-block">Open FamilyVault</a></>}
        {status === 'error' && <><div className="text-5xl mb-4">err</div><h1 className="text-2xl font-bold mb-3">Something went wrong</h1><a href="/" className="bg-slate-700 text-white font-bold px-8 py-3 rounded-xl inline-block">Go back</a></>}
      </div>
    </main>
  )
}
export default function SuccessPage() { return <Suspense><SuccessContent /></Suspense> }