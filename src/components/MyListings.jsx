import { useMemo, useState } from 'react'
import { Search, Pencil, ArrowUpRight } from 'lucide-react'
import { formatQuetzales, auctionStatus } from './LotCard'

export default function MyListings({ lots, uid, onEdit, onOpen }) {
  const [search, setSearch] = useState('')
  const mine = useMemo(() => lots.filter((lot) => lot.ownerUid === uid && `${lot.marca} ${lot.modelo}`.toLowerCase().includes(search.toLowerCase())), [lots, uid, search])
  return <section className="my-listings page-shell"><div className="section-heading"><div><span className="eyebrow">Tu espacio de vendedor</span><h1>Mis publicaciones</h1><p>Administra tus vehículos y sigue cada remate.</p></div><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca o modelo" /></label></div>
    {mine.length ? <div className="listing-table">{mine.map((lot) => <article className="listing-row" key={lot.id}><img src={lot.fotos?.[0]} alt="" /><div className="listing-vehicle"><strong>{lot.marca} {lot.modelo}</strong><small>{lot.anio} · {lot.tipoArticulo}</small></div><span className={`status-pill status-${auctionStatus(lot) === 'En vivo' ? 'live' : auctionStatus(lot) === 'Finalizado' ? 'ended' : 'soon'}`}><i />{auctionStatus(lot)}</span><div className="listing-price"><small>Oferta actual</small><strong>{formatQuetzales(lot.currentBid || lot.precioBase)}</strong></div><button className="icon-button" onClick={() => onEdit(lot)} title="Editar lote" aria-label="Editar lote"><Pencil size={17} /></button><button className="icon-button" onClick={() => onOpen(lot.id)} title="Ver lote" aria-label="Ver lote"><ArrowUpRight size={17} /></button></article>)}</div> : <div className="empty-state"><h3>{search ? 'No hay coincidencias' : 'Todavía no tienes publicaciones'}</h3><p>Los lotes que publiques aparecerán aquí.</p></div>}
  </section>
}