import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Values come from .env.local (see .env.example). They are not secrets; security is in firestore.rules.
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
if (!cfg.apiKey || !cfg.projectId) {
  throw new Error('ยังไม่ได้ตั้งค่า Firebase: สร้างไฟล์ .env.local ตาม .env.example แล้วรัน npm run dev ใหม่')
}

const app = initializeApp(cfg)
export const auth = getAuth(app)
export const db = getFirestore(app)
