import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, X } from 'lucide-react'

const blankLot = {
  anio: '', tipoArticulo: 'Automóvil', marca: '', modelo: '', motor: '', transmision: '', combustible: '', traccion: '', cilindros: '',
  condicion: null, fotos: [], precioBase: '', apertura: '', cierre: '',
}

const conditions = [
  { color: 'verde', nombre: 'Daño menor / Limpio', icon: '✓', note: 'Condición ligera, listo para circular.' },
  { color: 'amarillo', nombre: 'Daño medio / Reparable', icon: '◐', note: 'Requiere reparación moderada.' },
  { color: 'rojo', nombre: 'Daño severo / Salvamento', icon: '!', note: 'Daño importante o para repuestos.' },
]

const toLocalInput = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function LotWizard({ initialLot, onClose, onSave }) {
  const [step, setStep] = useState(0)
  const [lot, setLot] = useState(() => initialLot ? { ...blankLot, ...initialLot, apertura: toLocalInput(initialLot.apertura), cierre: toLocalInput(initialLot.cierre) } : blankLot)
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key) => (event) => setLot((current) => ({ ...current, [key]: event.target.value }))
  const steps = ['Ficha técnica', 'Condición', 'Fotografías', 'Remate']

  function next() {
    setError('')
    if (step === 0 && ['anio', 'tipoArticulo', 'marca', 'modelo', 'motor', 'transmision', 'combustible', 'traccion', 'cilindros'].some((key) => !String(lot[key]).trim())) return setError('Completa todos los campos técnicos para continuar.')
    if (step === 1 && !lot.condicion) return setError('Selecciona la condición del vehículo.')
    if (step === 2 && lot.fotos.length < 5) return setError('Agrega al menos cinco fotografías para continuar.')
    if (step === 3) {
      const open = new Date(lot.apertura).getTime()
      const close = new Date(lot.cierre).getTime()
      if (Number(lot.precioBase) < 20000) return setError('El precio base mínimo es Q 20,000.')
      if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return setError('El cierre debe ser posterior a la apertura.')
      return save()
    }
    setStep((current) => current + 1)
  }

  async function save() {
    setBusy(true)
    try { await onSave({ ...lot, anio: Number(lot.anio), cilindros: Number(lot.cilindros), precioBase: Number(lot.precioBase), apertura: new Date(lot.apertura).getTime(), cierre: new Date(lot.cierre).getTime() }) }
    catch (caught) { setError(caught.message || 'No se pudo guardar el lote.') }
    finally { setBusy(false) }
  }

  function addPhoto(event) {
    event.preventDefault()
    try {
      const parsed = new URL(photoUrl)
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error()
      setLot((current) => ({ ...current, fotos: [...current.fotos, parsed.href] }))
      setPhotoUrl('')
      setError('')
    } catch { setError('Ingresa una URL de imagen válida.') }
  }

  function movePhoto(index, direction) {
    setLot((current) => {
      const photos = [...current.fotos]
      const target = index + direction
      if (target < 0 || target >= photos.length) return current
      ;[photos[index], photos[target]] = [photos[target], photos[index]]
      return { ...current, fotos: photos }
    })
  }

  return <div className="modal-backdrop wizard-backdrop"><section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
    <header className="wizard-header"><div><span className="eyebrow">{initialLot ? 'Editar publicación' : 'Vende en RodaBid'}</span><h2 id="wizard-title">{initialLot ? 'Actualiza tu lote' : 'Publica un vehículo'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={21} /></button></header>
    <div className="wizard-progress">{steps.map((label, index) => <div className={`wizard-step ${index <= step ? 'step-active' : ''}`} key={label}><span>{index < step ? <Check size={15} /> : `0${index + 1}`}</span><small>{label}</small></div>)}</div>
    <div className="wizard-body">
      {step === 0 && <div className="wizard-fields"><label>Año<input type="number" min="1950" max="2035" value={lot.anio} onChange={update('anio')} placeholder="2021" required /></label><label>Tipo de artículo<select value={lot.tipoArticulo} onChange={update('tipoArticulo')}><option>Automóvil</option><option>Camioneta</option><option>Motocicleta</option><option>Camión</option><option>Otro</option></select></label><label>Marca<input value={lot.marca} onChange={update('marca')} placeholder="Toyota" required /></label><label>Modelo<input value={lot.modelo} onChange={update('modelo')} placeholder="Hilux" required /></label><label>Motor<input value={lot.motor} onChange={update('motor')} placeholder="2.8L Turbo Diesel" required /></label><label>Transmisión<select value={lot.transmision} onChange={update('transmision')} required><option value="">Seleccionar</option><option>Automática</option><option>Manual</option></select></label><label>Combustible<select value={lot.combustible} onChange={update('combustible')} required><option value="">Seleccionar</option><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></select></label><label>Tracción<select value={lot.traccion} onChange={update('traccion')} required><option value="">Seleccionar</option><option>AWD</option><option>FWD</option><option>RWD</option><option>4WD</option></select></label><label>Cilindros<input type="number" min="1" max="16" value={lot.cilindros} onChange={update('cilindros')} placeholder="4" required /></label></div>}
      {step === 1 && <div className="condition-cards">{conditions.map((condition) => <button key={condition.color} type="button" className={`condition-card ${condition.color} ${lot.condicion?.color === condition.color ? 'condition-selected' : ''}`} onClick={() => setLot({ ...lot, condicion })}><span className="condition-icon">{condition.icon}</span><strong>{condition.nombre}</strong><small>{condition.note}</small></button>)}</div>}
      {step === 2 && <div className="photo-step"><p className="muted">Añade mínimo 5 fotos con URL. La primera será la portada del lote.</p><form className="photo-add" onSubmit={addPhoto}><ImagePlus size={19} /><input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} type="url" placeholder="https://..." aria-label="URL de fotografía" /><button className="button button-outline">Añadir foto</button></form><div className="photo-grid">{lot.fotos.map((photo, index) => <div className="photo-thumb" key={`${photo}-${index}`}><img src={photo} alt={`Foto ${index + 1}`} onError={(event) => { event.currentTarget.dataset.failed = 'true' }} /><span>{String(index + 1).padStart(2, '0')}</span><div className="photo-tools"><button type="button" onClick={() => movePhoto(index, -1)} title="Mover a la izquierda" aria-label="Mover a la izquierda"><ArrowLeft size={14} /></button><button type="button" onClick={() => movePhoto(index, 1)} title="Mover a la derecha" aria-label="Mover a la derecha"><ArrowRight size={14} /></button><button type="button" onClick={() => setLot({ ...lot, fotos: lot.fotos.filter((_, photoIndex) => photoIndex !== index) })} title="Eliminar foto" aria-label="Eliminar foto"><X size={14} /></button></div></div>)}</div><small className="photo-count">{lot.fotos.length} / 5 fotografías mínimas</small></div>}
      {step === 3 && <div className="wizard-fields auction-fields"><label>Precio base (Q)<input type="number" min="20000" step="500" value={lot.precioBase} onChange={update('precioBase')} placeholder="20000" required /><small>Mínimo Q 20,000</small></label><label>Apertura del remate<input type="datetime-local" value={lot.apertura} onChange={update('apertura')} required /></label><label>Cierre del remate<input type="datetime-local" value={lot.cierre} onChange={update('cierre')} required /></label></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
    <footer className="wizard-footer"><button className="button button-text" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? <><ArrowLeft size={16} /> Anterior</> : 'Cancelar'}</button><span>Paso {step + 1} de 4</span><button className="button button-primary" onClick={next} disabled={busy}>{busy ? 'Guardando…' : step === 3 ? initialLot ? 'Guardar cambios' : 'Publicar lote' : <>Continuar <ArrowRight size={16} /></>}</button></footer>
  </section></div>
}