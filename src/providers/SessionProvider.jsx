import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { onValue, ref } from 'firebase/database'
import { authService, realtimeDb } from '../services/firebaseClient'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(authService, (nextUser) => {
    setUser(nextUser)
    if (!nextUser) {
      setProfile(null)
      setLoading(false)
    }
  }), [])

  useEffect(() => {
    if (!user) return undefined
    return onValue(ref(realtimeDb, `profiles/${user.uid}`), (snapshot) => {
      setProfile(snapshot.val())
      setLoading(false)
    }, () => setLoading(false))
  }, [user])

  return <SessionContext.Provider value={{ user, profile, loading }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider')
  return context
}