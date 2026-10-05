import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Notice from '../components/Notice.jsx'
import { useAuth } from '../lib/auth.jsx'
import { ANON_WARNING } from '../lib/format.js'

// First visit (no user yet) and "edit contact" share this page
export default function ContactSettings() {
  const nav = useNavigate()
  const { user: old, saveProfile } = useAuth()
  const [f, setF] = useState({
    displayName: old?.displayName || '', email: old?.email || '', phone: old?.phone || '',
    social1: old?.social1 || '', social2: old?.social2 || '', social3: old?.social3 || '',
  })
  const [ack, setAck] = useState(false)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!f.displayName.trim()) return setErr('กรอกชื่อเรียก')
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr('กรอก Email ให้ถูกต้อง')
    if (!old && !ack) return setErr('กรุณากดรับทราบข้อความเตือนก่อน')
    setSaving(true); setErr('')
    try {
      await saveProfile(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()])))
      nav('/')
    } catch (e2) {
      console.error(e2)
      setErr('บันทึกไม่สำเร็จ (' + (e2.code || e2.message) + ')')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>{old ? 'ช่องทางติดต่อ' : 'ยินดีต้อนรับสู่ Party Play'}</h1>
      {!old && <Notice type="info">กรอกข้อมูลติดต่อครั้งเดียว แล้วเลือกได้ว่าจะเปิดเผยอะไรในแต่ละนัด</Notice>}
      <form className="form card" onSubmit={submit}>
        <label>ชื่อเรียก *<input value={f.displayName} onChange={set('displayName')} maxLength={30} /></label>
        <label>Email *<input type="email" value={f.email} onChange={set('email')} maxLength={254} /></label>
        <label>เบอร์โทร<input value={f.phone} onChange={set('phone')} maxLength={20} /></label>
        <label>Social 1<input value={f.social1} onChange={set('social1')} maxLength={100} placeholder="เช่น Discord: ชื่อ" /></label>
        <label>Social 2<input value={f.social2} onChange={set('social2')} maxLength={100} /></label>
        <label>Social 3<input value={f.social3} onChange={set('social3')} maxLength={100} /></label>
        {!old && (
          <>
            <Notice>{ANON_WARNING}</Notice>
            <label className="check">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> รับทราบ
            </label>
          </>
        )}
        {err && <p className="error">{err}</p>}
        <div className="row">
          <Button type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          {old && <Button type="button" variant="ghost" onClick={() => nav(-1)}>กลับ</Button>}
        </div>
      </form>
    </>
  )
}
