import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export const useUser = () => useContext(Ctx).user // { userId, displayName, email, phone, social1-3 } | null

const FIELDS = ['email', 'phone', 'social1', 'social2', 'social3']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const saving = useRef(false)

  // Restore session: Firebase keeps the anonymous account in the browser (IndexedDB)
  useEffect(() => onAuthStateChanged(auth, async (fb) => {
    if (saving.current) return
    if (!fb) { setUser(null); setLoading(false); return }
    try {
      const [u, c] = await Promise.all([
        getDoc(doc(db, 'users', fb.uid)),
        getDoc(doc(db, 'users', fb.uid, 'private', 'contact')),
      ])
      setUser(u.exists() ? { userId: fb.uid, displayName: u.data().displayName, ...(c.data() || {}) } : null)
    } catch (e) {
      console.error('load profile failed', e)
      setUser(null)
    }
    setLoading(false)
  }), [])

  // The anonymous account is created on the first save, together with users/{uid} and private/contact
  const saveProfile = async (f) => {
    saving.current = true
    try {
      const fb = auth.currentUser || (await signInAnonymously(auth)).user
      const userRef = doc(db, 'users', fb.uid)
      const exists = (await getDoc(userRef)).exists()
      const contact = Object.fromEntries(FIELDS.filter((k) => f[k]).map((k) => [k, f[k]]))
      const batch = writeBatch(db)
      if (exists) batch.update(userRef, { displayName: f.displayName })
      else batch.set(userRef, { displayName: f.displayName, createdAt: serverTimestamp() })
      batch.set(doc(db, 'users', fb.uid, 'private', 'contact'), contact)
      await batch.commit()
      setUser({ userId: fb.uid, displayName: f.displayName, ...contact })
    } finally {
      saving.current = false
    }
  }

  return <Ctx.Provider value={{ user, loading, saveProfile }}>{children}</Ctx.Provider>
}
