import { ArrowUpRight, Clock3, Gauge, Fuel, MapPin } from 'lucide-react'

export function auctionStatus(lot, now = Date.now()) {
  if (now < Number(lot.apertura || 0)) return 'Próximamente'
  if (now >= Number(lot.cierre || 0)) return 'Finalizado'
  return 'En vivo'
}

export function formatQuetzales(amount) {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 0 }).format(Number(amount || 0))
}

export default function LotCard({ lot, onOpen, list = false }) {
  const status = auctionStatus(lot)
  return <article className={`lot-card ${list ? 'list-card' : ''}`}>
    <button className="lot-image" onClick={onOpen} aria-label={`Ver ${lot.marca} ${lot.modelo}`}><img src={lot.fotos?.[0]} alt={`${lot.marca} ${lot.modelo}`} loading="lazy" /><span className={`status-pill status-${status === 'En vivo' ? 'live' : status === 'Finalizado' ? 'ended' : 'soon'}`}><i />{status}</span><span className="image-count">{lot.fotos?.length || 0} fotos</span></button>
    <div className="lot-card-content"><div className="lot-title-row"><div><span className="lot-year">{lot.anio} · {lot.tipoArticulo || 'Vehículo'}</span><h3>{lot.marca} {lot.modelo}</h3></div><button className="arrow-button" onClick={onOpen} aria-label="Abrir lote"><ArrowUpRight size={19} /></button></div>
      <div className="spec-line"><span><Gauge size={14} />{lot.transmision}</span><span><Fuel size={14} />{lot.combustible}</span><span><MapPin size={14} />Guatemala</span></div>
      <div className="card-footer"><div><small>{status === 'En vivo' ? 'Oferta actual' : 'Precio base'}</small><strong>{formatQuetzales(status === 'En vivo' && lot.currentBid ? lot.currentBid : lot.precioBase)}</strong></div><span className={`condition-label ${lot.condicion?.color}`}>{lot.condicion?.nombre}</span></div>
      {status !== 'Finalizado' && <p className="closing-note"><Clock3 size={14} />{status === 'En vivo' ? 'Remate activo' : `Abre ${new Date(lot.apertura).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}`}</p>}
    </div>
  </article>
}