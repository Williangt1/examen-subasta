import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { X, Eye, EyeOff } from 'lucide-react'
import { authService, realtimeDb } from '../services/firebaseClient'

const passwordScore = (password) => [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length

export default function AccessPanel({ onClose }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const score = passwordScore(password)

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const correo = form.get('correo').trim()
    setBusy(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(authService, correo, password)
      } else {
        if (score < 4) throw new Error('La contraseña debe tener 8 caracteres, mayúscula, número y símbolo.')
        const credential = await createUserWithEmailAndPassword(authService, correo, password)
        const nombre = form.get('nombre').trim()
        const apellido = form.get('apellido').trim()
        await updateProfile(credential.user, { displayName: `${nombre} ${apellido}` })
        await set(ref(realtimeDb, `profiles/${credential.user.uid}`), {
          nombre, apellido, correo, telefono: form.get('telefono').trim(), fechaRegistro: Date.now(),
        })
      }
      onClose()
    } catch (caught) {
      setError(caught.message || 'No se pudo completar el acceso.')
    } finally { setBusy(false) }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-title">
      <button className="modal-close icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
      <span className="eyebrow">Tu próxima gran oferta</span>
      <h2 id="access-title">Entra a la subasta.</h2>
      <p className="muted">Participa en remates automotrices en tiempo real.</p>
      <div className="tabs"><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError('') }}>Ingresar</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError('') }}>Crear cuenta</button></div>
      <form onSubmit={submit} className="form-stack">
        {mode === 'register' && <div className="field-row"><label>Nombre<input name="nombre" required autoComplete="given-name" /></label><label>Apellido<input name="apellido" required autoComplete="family-name" /></label></div>}
        <label>Correo electrónico<input name="correo" type="email" required autoComplete="email" /></label>
        {mode === 'register' && <label>Teléfono<input name="telefono" type="tel" required autoComplete="tel" /></label>}
        <label>Contraseña<span className="password-input"><input name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {mode === 'register' && <div className="strength-meter"><div className="strength-bars">{[1, 2, 3, 4].map((part) => <i key={part} className={score >= part ? `level-${score}` : ''} />)}</div><span>{['Muy débil', 'Débil', 'Regular', 'Buena', 'Segura'][score]}</span></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Un momento…' : mode === 'login' ? 'Ingresar a RodaBid' : 'Crear mi cuenta'}</button>
      </form>
      <p className="fine-print">Al continuar aceptas nuestras condiciones de uso y privacidad.</p>
    </section>
  </div>
}