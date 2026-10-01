import { SlidersHorizontal, X } from 'lucide-react'

export default function FilterSidebar({ filters, setFilters, lots, onClose }) {
  const options = {
    anio: [...new Set(lots.map((lot) => lot.anio).filter(Boolean))].sort((a, b) => b - a),
    marca: [...new Set(lots.map((lot) => lot.marca).filter(Boolean))].sort(),
    modelo: [...new Set(lots.map((lot) => lot.modelo).filter(Boolean))].sort(),
    combustible: [...new Set(lots.map((lot) => lot.combustible).filter(Boolean))].sort(),
  }
  const change = (key) => (event) => setFilters({ ...filters, [key]: event.target.value })
  return <aside className="filter-panel">
    <div className="filter-heading"><h3><SlidersHorizontal size={17} /> Filtros</h3>{onClose && <button className="icon-button mobile-only" onClick={onClose} aria-label="Cerrar filtros"><X size={18} /></button>}</div>
    <label>Año<select value={filters.anio} onChange={change('anio')}><option value="">Todos los años</option>{options.anio.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>Marca<select value={filters.marca} onChange={change('marca')}><option value="">Todas las marcas</option>{options.marca.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>Modelo<select value={filters.modelo} onChange={change('modelo')}><option value="">Todos los modelos</option>{options.modelo.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>Combustible<select value={filters.combustible} onChange={change('combustible')}><option value="">Cualquier tipo</option>{options.combustible.map((value) => <option key={value}>{value}</option>)}</select></label>
    <fieldset><legend>Condición</legend>{[['verde', 'Daño menor / Limpio'], ['amarillo', 'Daño medio / Reparable'], ['rojo', 'Daño severo / Salvamento']].map(([value, label]) => <label className="check-option" key={value}><input type="checkbox" checked={filters.condicion.includes(value)} onChange={(event) => setFilters({ ...filters, condicion: event.target.checked ? [...filters.condicion, value] : filters.condicion.filter((item) => item !== value) })} /><span className={`condition-dot ${value}`} />{label}</label>)}</fieldset>
    <button className="clear-filters" onClick={() => setFilters({ anio: '', marca: '', modelo: '', combustible: '', condicion: [] })}>Limpiar filtros</button>
  </aside>
}