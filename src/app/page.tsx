'use client'
import { useState, useEffect, useRef } from 'react'

const CATS = [
  {id:'ids',label:'IDs & Passports',icon:'🪪'},
  {id:'insurance',label:'Insurance',icon:'🛡️'},
  {id:'medical',label:'Medical',icon:'🏥'},
  {id:'financial',label:'Financial',icon:'💰'},
  {id:'property',label:'Property & Vehicles',icon:'🏠'},
  {id:'kids',label:'Kids',icon:'👶'},
  {id:'pets',label:'Pets',icon:'🐾'},
  {id:'legal',label:'Legal & Estate',icon:'⚖️'},
  {id:'other',label:'Other',icon:'📁'},
]

const SK = 'familyvault_docs'
const PK = 'familyvault_pin'
const FREE_LIMIT = 5

function daysUntil(d) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function getStoredDocs() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SK) || '[]') } catch { return [] }
}
function getStoredPro() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('fv_pro') === 'true'
}

export default function App() {
  const [docs, setDocs] = useState(getStoredDocs)
  const [isPro, setIsPro] = useState(getStoredPro)
  const [unlocked, setUnlocked] = useState(false)
  const [savedPin, setSavedPin] = useState(null)
  const [settingPin, setSettingPin] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [view, setView] = useState('vault')
  const [selCat, setSelCat] = useState(null)
  const [selDoc, setSelDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', category: '', notes: '', expires: '' })
  const [editMode, setEditMode] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [chatIn, setChatIn] = useState('')
  const [chatLoad, setChatLoad] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    const sp = localStorage.getItem(PK)
    setSavedPin(sp)
    if (!sp) { setSettingPin(true); return }
    const cid = localStorage.getItem('fv_customer_id')
    if (cid) {
      fetch('/api/subscription?customer_id=' + cid)
        .then(r => r.json())
        .then(d => {
          if (d.active) { setIsPro(true); localStorage.setItem('fv_pro', 'true') }
          else { setIsPro(false); localStorage.removeItem('fv_pro') }
        }).catch(() => {})
    }
  }, [])

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const save = (d) => { setDocs(d); localStorage.setItem(SK, JSON.stringify(d)) }
  const atLimit = !isPro && docs.length >= FREE_LIMIT

  const createPin = () => {
    if (pin.length < 4) { setPinError('PIN must be at least 4 digits'); return }
    if (pin !== confirmPin) { setPinError('PINs do not match'); return }
    localStorage.setItem(PK, pin); setSavedPin(pin); setSettingPin(false); setUnlocked(true); setPinError('')
  }

  const unlock = () => {
    if (pinInput === savedPin) { setUnlocked(true); setPinError(''); setPinInput('') }
    else { setPinError('Incorrect PIN'); setPinInput('') }
  }

  const addDoc = () => {
    if (!form.name || !form.category) return
    if (atLimit && !editMode) { setView('upgrade'); return }
    if (editMode && selDoc) {
      save(docs.map(d => d.id === selDoc.id ? { ...d, ...form } : d))
      setSelDoc({ ...selDoc, ...form })
    } else {
      save([...docs, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }])
    }
    setForm({ name: '', category: '', notes: '', expires: '' })
    setEditMode(false)
    setView(editMode ? 'doc' : 'vault')
  }

  const deleteDoc = (id) => { save(docs.filter(d => d.id !== id)); setView('vault') }

  const goToAdd = () => {
    if (atLimit) { setView('upgrade'); return }
    setForm({ name: '', category: '', notes: '', expires: '' })
    setEditMode(false)
    setView('add')
  }

  const startCheckout = async () => {
    setUpgradeLoading(true)
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: upgradeEmail }) })
      const d = await r.json()
      if (d.url) window.location.href = d.url
    } catch { alert('Something went wrong.') }
    finally { setUpgradeLoading(false) }
  }

  const sendChat = async () => {
    if (!chatIn.trim() || chatLoad) return
    const um = { role: 'user', content: chatIn }, nm = [...msgs, um]
    setMsgs(nm); setChatIn(''); setChatLoad(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nm, docSummary: docs.map(d => d.name + ' (' + d.category + ')').join(', ') }) })
      const d = await r.json()
      setMsgs([...nm, { role: 'assistant', content: d.reply || 'Error' }])
    } catch { setMsgs([...nm, { role: 'assistant', content: 'Error connecting.' }]) }
    finally { setChatLoad(false) }
  }

  const expiring = docs.filter(d => d.expires && daysUntil(d.expires) <= 90 && daysUntil(d.expires) >= 0)
  const filtered = docs.filter(d => (!selCat || d.category === selCat) && (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.notes.toLowerCase().includes(search.toLowerCase())))

  if (!unlocked) return (<main className="min-h-screen bg-slate-950 flex items-center justify-center px-4"><div className="w-full max-w-sm"><div className="text-center mb-8"><div className="text-5xl mb-4">🔒</div><h1 className="text-2xl font-bold text-white">FamilyVault</h1><p className="text-slate-400 text-sm mt-1">{settingPin ? 'Create your PIN to get started' : 'Enter your PIN to unlock'}</p></div><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">{settingPin ? (<><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Create PIN</label><input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest outline-none focus:border-blue-500 mb-4" /><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Confirm PIN</label><input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="••••" onKeyDown={e => e.key === 'Enter' && createPin()} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest outline-none focus:border-blue-500 mb-4" />{pinError && <p className="text-red-400 text-sm text-center mb-3">{pinError}</p>}<button onClick={createPin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">Create Vault</button></>) : (<><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">PIN</label><input type="password" inputMode="numeric" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="••••" onKeyDown={e => e.key === 'Enter' && unlock()} autoFocus className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest outline-none focus:border-blue-500 mb-4" />{pinError && <p className="text-red-400 text-sm text-center mb-3">{pinError}</p>}<button onClick={unlock} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">Unlock</button></>)}</div></div></main>)

  if (view === 'upgrade') return (<main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4"><div className="w-full max-w-sm"><button onClick={() => setView('vault')} className="text-slate-400 hover:text-white mb-8 block">← Back</button><div className="text-center mb-8"><div className="text-5xl mb-4">⭐</div><h1 className="text-2xl font-bold mb-2">Upgrade to Pro</h1><p className="text-slate-400 text-sm">You have reached the {FREE_LIMIT} document free limit</p></div><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4"><div className="flex items-center justify-between mb-6"><p className="font-bold text-lg">FamilyVault Pro</p><div className="text-right"><p className="text-2xl font-bold">$7</p><p className="text-slate-400 text-sm">/month</p></div></div><ul className="space-y-2 mb-6">{['Unlimited documents', 'Expiration alerts', 'AI document assistant', 'All 9 categories', 'Cancel anytime'].map(f => (<li key={f} className="text-slate-300 text-sm">✅ {f}</li>))}</ul><div className="mb-4"><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Email for receipts</label><input type="email" value={upgradeEmail} onChange={e => setUpgradeEmail(e.target.value)} placeholder="you@email.com" className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-sm" /></div><button onClick={startCheckout} disabled={upgradeLoading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl">{upgradeLoading ? 'Redirecting...' : 'Upgrade for $7/month'}</button><p className="text-slate-500 text-xs text-center mt-3">Powered by Stripe. Cancel anytime.</p></div></div></main>)

  if (view === 'add') return (<main className="min-h-screen bg-slate-950 text-white"><div className="max-w-2xl mx-auto px-4 py-8"><div className="flex items-center gap-4 mb-8"><button onClick={() => { setView(editMode ? 'doc' : 'vault'); setEditMode(false); setForm({ name: '', category: '', notes: '', expires: '' }) }} className="text-slate-400 hover:text-white">← Back</button><h1 className="text-xl font-bold">{editMode ? 'Edit Document' : 'Add Document'}</h1></div>{!isPro && !editMode && <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm">{FREE_LIMIT - docs.length} free slot{FREE_LIMIT - docs.length !== 1 ? 's' : ''} remaining — <button onClick={() => setView('upgrade')} className="underline font-medium">upgrade for unlimited</button></div>}<div className="space-y-5"><div><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Document Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John's Passport" className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 outline-none" /></div><div><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Category *</label><div className="grid grid-cols-3 gap-2">{CATS.map(c => (<button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))} className={'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ' + (form.category === c.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 bg-slate-900 text-slate-300')}><span>{c.icon}</span><span className="truncate">{c.label}</span></button>))}</div></div><div><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Policy number, location, account number..." rows={4} className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 outline-none resize-none" /></div><div><label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Expiration Date (optional)</label><input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 outline-none" /></div><button onClick={addDoc} disabled={!form.name || !form.category} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl">{editMode ? 'Save Changes' : '+ Add to Vault'}</button></div></div></main>)

  if (view === 'doc' && selDoc) { const cat = CATS.find(c => c.id === selDoc.category), days = selDoc.expires ? daysUntil(selDoc.expires) : null; return (<main className="min-h-screen bg-slate-950 text-white"><div className="max-w-2xl mx-auto px-4 py-8"><button onClick={() => setView('vault')} className="text-slate-400 hover:text-white mb-8 block">← Back</button><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6"><div className="flex items-start justify-between mb-6"><div className="flex items-center gap-3"><span className="text-3xl">{cat?.icon}</span><div><h1 className="text-xl font-bold">{selDoc.name}</h1><p className="text-slate-400 text-sm">{cat?.label}</p></div></div><div className="flex gap-2"><button onClick={() => { setForm({ name: selDoc.name, category: selDoc.category, notes: selDoc.notes, expires: selDoc.expires || '' }); setEditMode(true); setView('add') }} className="text-blue-400 text-sm px-3 py-1.5 border border-blue-500/30 rounded-lg">Edit</button><button onClick={() => { if (confirm('Delete?')) deleteDoc(selDoc.id) }} className="text-red-400 text-sm px-3 py-1.5 border border-red-500/30 rounded-lg">Delete</button></div></div>{selDoc.expires && <div className={'mb-4 px-4 py-3 rounded-xl text-sm ' + (days !== null && days <= 30 ? 'bg-red-500/10 border border-red-500/30 text-red-400' : days !== null && days <= 90 ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' : 'bg-slate-800 text-slate-400')}>Expires {new Date(selDoc.expires).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{days !== null && days >= 0 && ' (' + days + ' days away)'}{days !== null && days < 0 && ' (EXPIRED)'}</div>}{selDoc.notes && <div className="bg-slate-800 rounded-xl p-4"><p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Notes</p><p className="text-slate-200 whitespace-pre-wrap">{selDoc.notes}</p></div>}<p className="text-slate-600 text-xs mt-4">Added {new Date(selDoc.createdAt).toLocaleDateString()}</p></div></div></main>) }

  if (view === 'chat') { if (!isPro) return (<main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="text-5xl mb-4">🤖</div><h1 className="text-xl font-bold mb-3">AI Assistant is Pro only</h1><p className="text-slate-400 text-sm mb-6">Upgrade to ask questions about your documents.</p><button onClick={() => setView('upgrade')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl">Upgrade — $7/mo</button><button onClick={() => setView('vault')} className="block text-slate-500 text-sm mt-4 mx-auto">← Back</button></div></main>); return (<main className="min-h-screen bg-slate-950 text-white flex flex-col"><div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col flex-1"><div className="flex items-center gap-4 mb-6"><button onClick={() => setView('vault')} className="text-slate-400 hover:text-white">← Back</button><div><h1 className="text-lg font-bold">Vault Assistant</h1><p className="text-slate-400 text-xs">Ask about your documents</p></div></div><div className="flex-1 space-y-4 mb-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>{msgs.length === 0 && <div className="space-y-2"><p className="text-slate-500 text-sm text-center mb-4">Ask me anything</p>{['What docs do I need to renew a passport?', 'What insurance should every family have?'].map(q => (<button key={q} onClick={() => setChatIn(q)} className="w-full text-left px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300">{q}</button>))}</div>}{msgs.map((m, i) => (<div key={i} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}><div className={'max-w-[80%] px-4 py-3 rounded-2xl text-sm ' + (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200')}>{m.content}</div></div>))}{chatLoad && <div className="bg-slate-800 px-4 py-3 rounded-2xl text-slate-400 text-sm w-fit">Thinking...</div>}<div ref={chatRef} /></div><div className="flex gap-3"><input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask about your documents..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none text-sm" /><button onClick={sendChat} disabled={!chatIn.trim() || chatLoad} className="bg-blue-600 disabled:opacity-40 px-5 py-3 rounded-xl text-sm">Send</button></div></div></main>) }

  if (view === 'settings') return (<main className="min-h-screen bg-slate-950 text-white"><div className="max-w-2xl mx-auto px-4 py-8"><div className="flex items-center gap-4 mb-8"><button onClick={() => setView('vault')} className="text-slate-400 hover:text-white">← Back</button><h1 className="text-xl font-bold">Settings</h1></div><div className="space-y-4">{isPro ? <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5 flex items-center gap-3"><span className="text-2xl">⭐</span><div><h2 className="font-bold text-blue-400">FamilyVault Pro</h2><p className="text-slate-400 text-sm">Active subscription</p></div></div> : <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><h2 className="font-semibold mb-1">Free Plan</h2><p className="text-slate-400 text-sm mb-3">{docs.length}/{FREE_LIMIT} documents used</p><button onClick={() => setView('upgrade')} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-medium text-white">Upgrade to Pro — $7/mo</button></div>}<div className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><h2 className="font-semibold mb-3">Change PIN</h2><input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} placeholder="New PIN" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none mb-3 focus:border-blue-500" /><input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="Confirm PIN" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none mb-3 focus:border-blue-500" />{pinError && <p className="text-red-400 text-sm mb-3">{pinError}</p>}<button onClick={() => { if (pin.length >= 4 && pin === confirmPin) { localStorage.setItem(PK, pin); setSavedPin(pin); setPin(''); setConfirmPin(''); setPinError('Updated!') } else { setPinError('PINs must match, min 4 digits') } }} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm text-white">Update PIN</button></div><div className="bg-slate-900 border border-red-900/50 rounded-2xl p-5"><h2 className="font-semibold text-red-400 mb-3">Clear All Data</h2><button onClick={() => { if (confirm('Delete ALL?')) { save([]); localStorage.removeItem(PK); localStorage.removeItem('fv_pro'); localStorage.removeItem('fv_customer_id'); setUnlocked(false); setSavedPin(null); setSettingPin(true); setIsPro(false) } }} className="bg-red-600/20 border border-red-600/30 text-red-400 px-5 py-2.5 rounded-xl text-sm">Clear Everything</button></div></div></div></main>)

  return (<main className="min-h-screen bg-slate-950 text-white"><div className="max-w-2xl mx-auto px-4 py-8"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-3"><span className="text-2xl">🔒</span><div><h1 className="text-xl font-bold">FamilyVault</h1><p className="text-slate-400 text-xs">{isPro ? 'Pro — unlimited docs' : docs.length + '/' + FREE_LIMIT + ' free documents'}</p></div></div><div className="flex gap-2">{!isPro && <button onClick={() => setView('upgrade')} className="bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-2 rounded-lg">⭐ Pro</button>}<button onClick={() => setView('chat')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl">🤖</button><button onClick={() => setView('settings')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl">⚙️</button><button onClick={() => setUnlocked(false)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl">🔒</button></div></div>{expiring.length > 0 && isPro && <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className="text-yellow-400 font-semibold text-sm mb-2">Expiring Soon</p>{expiring.map(d => (<button key={d.id} onClick={() => { setSelDoc(d); setView('doc') }} className="block text-yellow-300/80 text-sm">{d.name} — {daysUntil(d.expires)} days left</button>))}</div>}<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 outline-none mb-6 text-sm" /><div className="flex gap-2 overflow-x-auto pb-2 mb-6"><button onClick={() => setSelCat(null)} className={'shrink-0 px-4 py-2 rounded-xl text-sm font-medium ' + (!selCat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')}>All</button>{CATS.map(c => (<button key={c.id} onClick={() => setSelCat(selCat === c.id ? null : c.id)} className={'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ' + (selCat === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')}>{c.icon} {c.label}</button>))}</div>{filtered.length === 0 ? <div className="text-center py-20"><p className="text-5xl mb-4">📂</p><p className="text-slate-400 text-lg">{docs.length === 0 ? 'Your vault is empty' : 'No results'}</p></div> : <div className="space-y-3">{filtered.map(doc => { const cat = CATS.find(c => c.id === doc.category), days = doc.expires ? daysUntil(doc.expires) : null; return (<button key={doc.id} onClick={() => { setSelDoc(doc); setView('doc') }} className="w-full flex items-center gap-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-4 transition-all text-left"><span className="text-2xl">{cat?.icon}</span><div className="flex-1 min-w-0"><p className="font-medium truncate">{doc.name}</p><p className="text-slate-400 text-sm">{cat?.label}</p></div>{days !== null && <span className={'text-xs px-2.5 py-1 rounded-lg ' + (days < 0 ? 'bg-red-500/20 text-red-400' : days <= 30 ? 'bg-red-500/20 text-red-400' : days <= 90 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-500')}>{days < 0 ? 'Expired' : days + 'd'}</span>}<span className="text-slate-600">›</span></button>) })}</div>}<button onClick={goToAdd} className={'fixed bottom-6 right-6 shadow-lg w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ' + (atLimit ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-blue-600 hover:bg-blue-500')}>{atLimit ? '⭐' : '+'}</button></div></main>)
}