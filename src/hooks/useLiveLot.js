import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { realtimeDb } from '../services/firebaseClient'

export function useLiveLot(lotId) {
  const [lot, setLot] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lotId) return undefined
    const stopLot = onValue(ref(realtimeDb, `lots/${lotId}`), (snapshot) => {
      setLot(snapshot.exists() ? { id: lotId, ...snapshot.val() } : null)
      setLoading(false)
    })
    const stopBids = onValue(ref(realtimeDb, `bids/${lotId}`), (snapshot) => {
      const history = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, bid]) => ({ id, ...bid }))
        : []
      setBids(history.sort((first, second) => second.timestamp - first.timestamp))
    })
    return () => { stopLot(); stopBids() }
  }, [lotId])

  return { lot, bids, loading }
}