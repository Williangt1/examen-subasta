import { Gavel, LogOut, Plus, UserRound } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { authService } from '../services/firebaseClient'
import { useSession } from '../providers/SessionProvider'

export default function Header({ onAccess, onPublish, onMyListings, onHome }) {
  const { user, profile } = useSession()
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="RodaBid, inicio">
        <span className="brand-mark"><Gavel size={21} /></span>
        <span>roda<span className="brand-accent">bid</span><small>REMATES EN VIVO</small></span>
      </button>
      <nav className="topnav" aria-label="Navegación principal">
        <button className="nav-link active" onClick={onHome}>Explorar lotes</button>
        {user && <button className="nav-link" onClick={onMyListings}>Mis publicaciones</button>}
      </nav>
      <div className="header-actions">
        {user ? <>
          <span className="user-chip"><UserRound size={16} /> {profile?.nombre || user.email?.split('@')[0]}</span>
          <button className="button button-primary" onClick={onPublish}><Plus size={17} /> Publicar lote</button>
          <button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => signOut(authService)}><LogOut size={18} /></button>
        </> : <button className="button button-primary" onClick={onAccess}>Ingresar <span aria-hidden="true">↗</span></button>}
      </div>
    </header>
  )
}