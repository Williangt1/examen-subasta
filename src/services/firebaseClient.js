import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDr0pqXwn4RZOkS9350JhRIRMyXMFOaxmQ',
  authDomain: 'subasta-auto.firebaseapp.com',
  databaseURL: 'https://subasta-auto-default-rtdb.firebaseio.com',
  projectId: 'subasta-auto',
  storageBucket: 'subasta-auto.firebasestorage.app',
  messagingSenderId: '1015126994671',
  appId: '1:1015126994671:web:fdb7ed907a6042114fb51a',
}

const firebaseApp = initializeApp(firebaseConfig)
export const authService = getAuth(firebaseApp)
export const realtimeDb = getDatabase(firebaseApp)