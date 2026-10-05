export const STATUS = {
  PLANNING: { label: 'กำลังนัด', cls: 'planning', icon: '🟢' },
  PLAYING: { label: 'กำลังเล่น', cls: 'playing', icon: '🔵' },
  CANCELLED: { label: 'ยกเลิก', cls: 'cancelled', icon: '🔴' },
}

export const CONTACT_FIELDS = [
  ['email', 'Email'], ['phone', 'เบอร์โทร'],
  ['social1', 'Social 1'], ['social2', 'Social 2'], ['social3', 'Social 3'],
]

export const UNVERIFIED =
  '⚠️ ข้อมูลในระบบไม่ได้ผ่านการยืนยัน อาจเป็นข้อมูลเท็จได้ โปรดตรวจสอบข้อมูลของผู้นัดและผู้เข้าร่วมด้วยตัวเองก่อนติดต่อหรือนัดพบ'

export const ANON_WARNING =
  'บัญชีของคุณผูกกับเบราว์เซอร์เครื่องนี้ หากล้างข้อมูลเบราว์เซอร์ ใช้โหมดไม่ระบุตัวตน หรือเปลี่ยนเครื่อง/เบราว์เซอร์ คุณจะเข้าบัญชีเดิมไม่ได้ และจะเสียสิทธิ์จัดการนัดที่เคยสร้างไว้'

// Board visibility (Phase 5). Data is never deleted; this only decides what the board shows.
//   PLANNING: hidden once now > datetime + 1h   PLAYING: hidden once now > datetime + 12h   CANCELLED: always hidden
const HOUR = 36e5
export const isOnBoard = (p, now = Date.now()) => {
  const t = new Date(p.datetime).getTime()
  if (p.status === 'PLANNING') return now <= t + HOUR
  if (p.status === 'PLAYING') return now <= t + 12 * HOUR
  return false
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('th-TH-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' })

export const fmtParts = (iso) => {
  const d = new Date(iso)
  return {
    day: d.getDate(),
    mon: d.toLocaleDateString('th-TH-u-ca-gregory', { month: 'short' }),
    time: d.toLocaleTimeString('th-TH-u-ca-gregory', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

// ISO -> value for <input type="datetime-local">
export const toLocalInput = (iso) => {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// Keep only the contact fields the user chose to reveal (mirrors the Firestore design)
export const pickShown = (user, show) =>
  Object.fromEntries(CONTACT_FIELDS.filter(([k]) => show[k] && user[k]).map(([k]) => [k, user[k]]))
