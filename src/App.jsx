import { useEffect, useMemo, useState } from 'react'
import { onValue, push, ref, set, update } from 'firebase/database'
import { ArrowDownUp, CarFront, LayoutGrid, List, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { realtimeDb } from './services/firebaseClient'
import { SessionProvider, useSession } from './providers/SessionProvider'
import Header from './components/Header'
import AccessPanel from './components/AccessPanel'
import LotWizard from './components/LotWizard'
import FilterSidebar from './components/FilterSidebar'
import LotCard from './components/LotCard'
import LotView from './components/LotView'
import MyListings from './components/MyListings'
import './styles/theme.css'

const initialFilters = { anio: '', marca: '', modelo: '', combustible: '', condicion: [] }
const photoIds = ['photo-1621135802920-133df287f89c', 'photo-1519641471654-76ce0107ad1b', 'photo-1552519507-da3b142c6e3d', 'photo-1503376780353-7e6692767b70', 'photo-1549317661-bd32c8ce0db2']
const demoLots = [
  { id: 'demo-hilux', anio: 2021, tipoArticulo: 'Camioneta', marca: 'Toyota', modelo: 'Hilux SRV', motor: '2.8L Turbo Diesel', transmision: 'Automática', combustible: 'Diésel', traccion: '4WD', cilindros: 4, condicion: { color: 'verde', nombre: 'Daño menor / Limpio' }, precioBase: 145000 },
  { id: 'demo-mazda', anio: 2020, tipoArticulo: 'Automóvil', marca: 'Mazda', modelo: 'CX-5 Touring', motor: '2.5L Skyactiv', transmision: 'Automática', combustible: 'Gasolina', traccion: 'AWD', cilindros: 4, condicion: { color: 'amarillo', nombre: 'Daño medio / Reparable' }, precioBase: 98000 },
  { id: 'demo-civic', anio: 2019, tipoArticulo: 'Automóvil', marca: 'Honda', modelo: 'Civic EX', motor: '1.5L Turbo', transmision: 'CVT', combustible: 'Gasolina', traccion: 'FWD', cilindros: 4, condicion: { color: 'rojo', nombre: 'Daño severo / Salvamento' }, precioBase: 62000 },
]
const photosFor = (index) => [...photoIds.slice(index), ...photoIds.slice(0, index)].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`)

function Marketplace() {
  const { user } = useSession()
  const [lots, setLots] = useState([])
  const [lotsLoading, setLotsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('closing')
  const [layout, setLayout] = useState('grid')
  const [accessOpen, setAccessOpen] = useState(false)
  const [wizard, setWizard] = useState(null)
  const [activeLot, setActiveLot] = useState(null)
  const [myListings, setMyListings] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => onValue(ref(realtimeDb, 'lots'), (snapshot) => {
    setLots(Object.entries(snapshot.val() || {}).map(([id, lot]) => ({ id, ...lot })))
    setLoadError('')
    setLotsLoading(false)
  }, (error) => { setLoadError(error.message); setLotsLoading(false) }), [])

  const visibleLots = useMemo(() => {
    const filtered = lots.filter((lot) => `${lot.marca} ${lot.modelo} ${lot.anio}`.toLowerCase().includes(search.toLowerCase()) && (!filters.anio || String(lot.anio) === filters.anio) && (!filters.marca || lot.marca === filters.marca) && (!filters.modelo || lot.modelo === filters.modelo) && (!filters.combustible || lot.combustible === filters.combustible) && (!filters.condicion.length || filters.condicion.includes(lot.condicion?.color)))
    return filtered.sort((a, b) => {
      if (sort === 'price') return a.precioBase - b.precioBase
      if (sort === 'recent') return (b.createdAt || 0) - (a.createdAt || 0)
      const rank = (lot) => ({ 'En vivo': 0, Próximamente: 1, Finalizado: 2 })[new Date().getTime() < lot.apertura ? 'Próximamente' : new Date().getTime() >= lot.cierre ? 'Finalizado' : 'En vivo']
      const rankDifference = rank(a) - rank(b)
      if (rankDifference) return rankDifference
      return rank(a) === 1 ? a.apertura - b.apertura : a.cierre - b.cierre
    })
  }, [lots, filters, search, sort])

  async function seedDemoLots() {
    setSeeding(true)
    setLoadError('')
    try {
      const now = Date.now()
      const data = Object.fromEntries(demoLots.map((lot, index) => [lot.id, { ...lot, fotos: photosFor(index), apertura: now + (index + 1) * 3600000, cierre: now + (36 + index * 6) * 3600000, ownerUid: 'demo', currentBid: 0, leaderUid: null, totalBids: 0, createdAt: now }]))
      await update(ref(realtimeDb, 'lots'), data)
    } catch (error) { setLoadError(`No se pudieron cargar los lotes. Revisa las reglas de Realtime Database. ${error.message}`) }
    finally { setSeeding(false) }
  }

  async function saveLot(values) {
    if (!user) throw new Error('Inicia sesión para publicar un lote.')
    const editableFields = ['anio', 'tipoArticulo', 'marca', 'modelo', 'motor', 'transmision', 'combustible', 'traccion', 'cilindros', 'condicion', 'fotos', 'precioBase', 'apertura', 'cierre']
    const editableLot = Object.fromEntries(editableFields.map((field) => [field, values[field]]))
    if (wizard?.initialLot) await update(ref(realtimeDb, `lots/${wizard.initialLot.id}`), editableLot)
    else await set(push(ref(realtimeDb, 'lots')), { ...editableLot, ownerUid: user.uid, currentBid: 0, leaderUid: null, totalBids: 0, createdAt: Date.now() })
    setWizard(null)
  }

  function openPublish() {
    if (!user) { setAccessOpen(true); return }
    setMyListings(false)
    setWizard({ initialLot: null })
  }

  return <div className="app-shell">
    <Header onAccess={() => setAccessOpen(true)} onPublish={openPublish} onMyListings={() => setMyListings(true)} onHome={() => setMyListings(false)} />
    {myListings ? <MyListings lots={lots} uid={user?.uid} onEdit={(lot) => setWizard({ initialLot: lot })} onOpen={setActiveLot} /> : <main>
      <section className="market-hero"><div className="hero-copy"><span className="eyebrow"><span className="live-spark" /> EL PULSO DEL MOTOR, EN VIVO</span><h1>Encuentra tu próximo<br /><em>gran hallazgo.</em></h1><p>Vehículos seleccionados. Ofertas transparentes.<br />El siguiente movimiento es tuyo.</p><div className="hero-proof"><span><b>01</b> Explora el inventario</span><span><b>02</b> Sigue cada remate</span><span><b>03</b> Ofrece en vivo</span></div></div><div className="hero-photo"><img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=90" alt="Deportivo clásico en exposición" /><div className="hero-photo-caption"><span>EL SIGUIENTE CAPÍTULO</span><strong>Empieza en la subasta.</strong></div><div className="hero-stamp"><span>RODA</span><b>BID</b><small>GUATEMALA</small></div></div><div className="hero-index">01 <span>/</span> 03</div></section>
      <section className="catalog-section"><div className="catalog-heading"><div><span className="eyebrow">INVENTARIO ABIERTO</span><h2>El catálogo <span>de hoy.</span></h2><p>Encuentra el vehículo indicado. La puja empieza cuando tú decides.</p></div><label className="catalog-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca, modelo o año" /></label></div>
        {loadError && <div className="database-error" role="alert">{loadError}</div>}
        <div className="catalog-layout"><div className={`filter-drawer ${filtersOpen ? 'drawer-open' : ''}`}><FilterSidebar filters={filters} setFilters={setFilters} lots={lots} onClose={() => setFiltersOpen(false)} /></div><div className="catalog-results"><div className="results-toolbar"><div className="result-count"><strong>{visibleLots.length.toString().padStart(2, '0')}</strong> lotes disponibles<button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> Filtros</button></div><div className="results-controls"><label className="sort-control"><ArrowDownUp size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar lotes"><option value="closing">Cierra pronto</option><option value="price">Precio menor</option><option value="recent">Más recientes</option></select></label><div className="view-toggle"><button className={layout === 'grid' ? 'view-active' : ''} onClick={() => setLayout('grid')} title="Vista de cuadrícula" aria-label="Vista de cuadrícula"><LayoutGrid size={17} /></button><button className={layout === 'list' ? 'view-active' : ''} onClick={() => setLayout('list')} title="Vista de lista" aria-label="Vista de lista"><List size={18} /></button></div></div></div>
          {lotsLoading ? <div className="empty-state"><div className="loading-dots"><i /><i /><i /></div><p>Conectando al catálogo en vivo...</p></div> : visibleLots.length ? <div className={`lot-grid ${layout === 'list' ? 'lot-list' : ''}`}>{visibleLots.map((lot) => <LotCard key={lot.id} lot={lot} list={layout === 'list'} onOpen={() => setActiveLot(lot.id)} />)}</div> : <div className="empty-state catalog-empty"><span className="empty-icon"><CarFront size={24} /></span><h3>{lots.length ? 'No encontramos coincidencias' : 'La pista está lista'}</h3><p>{lots.length ? 'Prueba cambiando o limpiando tus filtros.' : 'Los nuevos lotes aparecerán aquí en cuanto sean publicados.'}</p>{lots.length ? <button className="button button-outline" onClick={() => { setFilters(initialFilters); setSearch('') }}>Limpiar búsqueda</button> : !lotsLoading && <button className="button button-primary" disabled={seeding} onClick={seedDemoLots}><Sparkles size={16} />{seeding ? 'Cargando lotes...' : 'Cargar lotes de demostración'}</button>}</div>}
        </div></div><div className="catalog-footnote"><span>RODABID · GUATEMALA</span><span>Actualización de ofertas en tiempo real</span></div>
      </section>
    </main>}
    <footer className="site-footer"><span>© 2026 RodaBid</span><span>Remates transparentes. Decisiones inteligentes.</span><span>Hecho para quienes aman el camino.</span></footer>
    {accessOpen && <AccessPanel onClose={() => setAccessOpen(false)} />}{wizard && <LotWizard initialLot={wizard.initialLot} onClose={() => setWizard(null)} onSave={saveLot} />}{activeLot && <LotView lotId={activeLot} onClose={() => setActiveLot(null)} onLogin={() => { setActiveLot(null); setAccessOpen(true) }} />}
  </div>
}

export default function App() { return <SessionProvider><Marketplace /></SessionProvider> }

