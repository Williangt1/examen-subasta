import { useEffect, useMemo, useState } from 'react'
import { push, ref, runTransaction } from 'firebase/database'
import { ArrowLeft, ArrowRight, Clock3, Gavel, X } from 'lucide-react'
import { realtimeDb } from '../services/firebaseClient'
import { useSession } from '../providers/SessionProvider'
import { useLiveLot } from '../hooks/useLiveLot'
import { auctionStatus, formatQuetzales } from './LotCard'

const remainingTime = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60 }
}

export default function LotView({ lotId, onClose, onLogin }) {
  const { lot, bids, loading } = useLiveLot(lotId)
  const { user } = useSession()
  const [now, setNow] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setPhotoIndex((index) => Math.min(index + 1, (lot?.fotos?.length || 1) - 1))
      if (event.key === 'ArrowLeft') setPhotoIndex((index) => Math.max(index - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lot, onClose])

  const status = lot ? now ? auctionStatus(lot, now) : 'Próximamente' : 'Finalizado'
  const currentBid = Number(lot?.currentBid || 0)
  const minimumBid = Math.max(Number(lot?.precioBase || 0), currentBid ? Math.ceil(currentBid * 1.1) : 0)
  const countdown = useMemo(() => remainingTime(Number((status === 'Próximamente' ? lot?.apertura : lot?.cierre) || now) - (now || Number(lot?.apertura || 0))), [lot, now, status])
  const uniqueBidders = [...new Set([...bids].sort((a, b) => a.timestamp - b.timestamp).map((bid) => bid.uid))]
  const leader = user && lot?.leaderUid === user.uid
  const outbid = user && bids.some((bid) => bid.uid === user.uid) && !leader
  const closedDeserted = status === 'Finalizado' && (!lot?.totalBids || currentBid < Number(lot?.precioBase || 0))
  const canBid = Boolean(user) && status === 'En vivo' && !closedDeserted

  async function placeBid(value = Number(amount)) {
    setMessage('')
    if (!user) { onLogin(); return }
    if (!Number.isFinite(value) || value < minimumBid) { setMessage(`La oferta mínima permitida es ${formatQuetzales(minimumBid)}.`); return }
    setBusy(true)
    try {
      const result = await runTransaction(ref(realtimeDb, `lots/${lotId}`), (current) => {
        if (!current || Date.now() < Number(current.apertura) || Date.now() >= Number(current.cierre)) return
        const liveBid = Number(current.currentBid || 0)
        const liveMinimum = Math.max(Number(current.precioBase), liveBid ? Math.ceil(liveBid * 1.1) : 0)
        if (value < liveMinimum) return
        return { ...current, currentBid: value, leaderUid: user.uid, totalBids: Number(current.totalBids || 0) + 1 }
      }, { applyLocally: false })
      if (!result.committed) throw new Error('La subasta cambió o ya terminó. Actualiza tu oferta con el mínimo vigente.')
      await push(ref(realtimeDb, `bids/${lotId}`), { amount: value, uid: user.uid, timestamp: Date.now() })
      setAmount('')
      setMessage('¡Tu oferta fue registrada!')
    } catch (caught) { setMessage(caught.message || 'No se pudo registrar la oferta.') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="modal-backdrop"><div className="loading-panel">Cargando lote…</div></div>
  if (!lot) return <div className="modal-backdrop"><div className="loading-panel">Este lote ya no está disponible.<button className="icon-button" onClick={onClose} aria-label="Cerrar"><X /></button></div></div>
  return <div className="modal-backdrop lotview-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="lotview-modal" role="dialog" aria-modal="true" aria-label={`${lot.marca} ${lot.modelo}`}>
    <button className="lotview-close icon-button" onClick={onClose} aria-label="Cerrar lote"><X size={21} /></button>
    <div className="lot-gallery"><div className="gallery-main"><img src={lot.fotos?.[photoIndex]} alt={`${lot.marca} ${lot.modelo}, fotografía ${photoIndex + 1}`} /><button className="gallery-arrow previous" aria-label="Foto anterior" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))}><ArrowLeft size={18} /></button><button className="gallery-arrow next" aria-label="Foto siguiente" onClick={() => setPhotoIndex(Math.min((lot.fotos?.length || 1) - 1, photoIndex + 1))}><ArrowRight size={18} /></button><span className="gallery-index">{String(photoIndex + 1).padStart(2, '0')} / {String(lot.fotos?.length || 0).padStart(2, '0')}</span></div><div className="gallery-thumbs">{lot.fotos?.map((photo, index) => <button key={`${photo}-${index}`} className={index === photoIndex ? 'thumb-active' : ''} onClick={() => setPhotoIndex(index)} aria-label={`Ver fotografía ${index + 1}`}><img src={photo} alt="" /></button>)}</div></div>
    <div className="lot-details"><div className="lot-detail-heading"><span className="eyebrow">LOTE RB-{lotId.slice(-6).toUpperCase()}</span><button className={`status-pill status-${status === 'En vivo' ? 'live' : status === 'Finalizado' ? 'ended' : 'soon'}`}><i />{status}</button><h2>{lot.anio} {lot.marca} {lot.modelo}</h2><p>{lot.motor} · {lot.transmision} · {lot.traccion}</p></div>
      <div className="auction-summary"><div><small>{currentBid ? 'Oferta vigente' : 'Precio base'}</small><strong>{formatQuetzales(currentBid || lot.precioBase)}</strong></div><div className={`countdown ${countdown.days === 0 && countdown.hours === 0 && countdown.minutes < 5 && status !== 'Finalizado' ? 'countdown-urgent' : ''}`}><Clock3 size={16} /><span>{status === 'Finalizado' ? 'Remate finalizado' : status === 'Próximamente' ? 'Inicia en' : 'Cierra en'}</span><strong>{countdown.days > 0 && `${countdown.days}d `}{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</strong></div></div>
      {leader && <div className="bid-alert alert-winning">¡Vas ganando esta subasta!</div>}{outbid && <div className="bid-alert alert-outbid">Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!</div>}
      {closedDeserted && <div className="bid-alert alert-closed">Subasta cerrada / desierta</div>}
      <div className="bid-panel"><h3><Gavel size={18} /> Panel de ofertas</h3>{!user ? <><p>Inicia sesión para participar en este remate.</p><button className="button button-primary button-wide" onClick={onLogin}>Inicia sesión para ofertar</button></> : canBid ? <><p>Tu oferta debe ser de al menos <strong>{formatQuetzales(minimumBid)}</strong></p><div className="quick-bids">{[1.1, 1.15, 1.25].map((factor) => <button key={factor} className="button button-outline" disabled={busy} onClick={() => placeBid(Math.max(minimumBid, Math.ceil((currentBid || Number(lot.precioBase)) * factor)))}>+{Math.round((factor - 1) * 100)}%</button>)}</div><div className="manual-bid"><span>Q</span><input type="number" min={minimumBid} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={String(minimumBid)} aria-label="Monto de oferta en quetzales" /><button className="button button-primary" disabled={busy || !amount} onClick={() => placeBid()}>Ofertar</button></div>{message && <p className="bid-message" role="status">{message}</p>}</> : <p>El panel de ofertas está cerrado para este remate.</p>}</div>
      <div className="bid-history"><div className="history-heading"><h3>Historial de ofertas</h3><span>{bids.length} ofertas</span></div>{bids.length ? bids.slice(0, 8).map((bid) => <div className="history-row" key={bid.id}><span className="bid-avatar">{uniqueBidders.indexOf(bid.uid) + 1}</span><strong>Postor {uniqueBidders.indexOf(bid.uid) + 1}</strong><time>{new Date(bid.timestamp).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</time><b>{formatQuetzales(bid.amount)}</b></div>) : <p className="muted history-empty">Aún no hay ofertas. Sé el primero en participar.</p>}</div>
    </div>
  </section></div>
}