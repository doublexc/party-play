import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import ContactPicker from '../components/ContactPicker.jsx'
import { useUser } from '../lib/auth.jsx'
import { createParty, editParty, useParty } from '../lib/parties.js'
import { toLocalInput } from '../lib/format.js'

// /create and /party/:id/edit
export default function CreateParty() {
  const { id } = useParams()
  const user = useUser()
  return id ? <EditLoader id={id} user={user} /> : <PartyForm user={user} />
}

function EditLoader({ id, user }) {
  const { party } = useParty(id, user.userId)
  if (party === undefined) return <p className="muted">กำลังโหลด...</p>
  if (!party || party.creatorId !== user.userId) return <p>ไม่มีสิทธิ์แก้ไขนัดนี้</p>
  return <PartyForm user={user} old={party} />
}

function PartyForm({ user, old }) {
  const nav = useNavigate()
  const [f, setF] = useState(
    old
      ? { title: old.title, when: toLocalInput(old.datetime), name: old.creatorName, description: old.description, max: old.maxPlayers }
      : { title: '', when: '', name: user.displayName, description: '', max: 5 }
  )
  const [show, setShow] = useState({ email: true, phone: true })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const max = Number(f.max)
    if (!f.title.trim() || !f.when || !f.name.trim()) return setErr('กรอกข้อมูลที่มี * ให้ครบ')
    if (!Number.isInteger(max) || max < 2 || max > 100) return setErr('จำนวนผู้เข้าร่วมต้องเป็นจำนวนเต็ม 2–100')
    if (old && max < old.memberCount) return setErr(`มีสมาชิก ${old.memberCount} คนแล้ว ตั้งจำนวนสูงสุดต่ำกว่านี้ไม่ได้`)
    const base = {
      title: f.title.trim(), datetime: new Date(f.when).toISOString(),
      creatorName: f.name.trim(), description: f.description.trim(), maxPlayers: max,
    }
    setBusy(true); setErr('')
    try {
      if (old) {
        await editParty(old.id, base)
        nav(`/party/${old.id}`)
      } else {
        nav(`/party/${await createParty(user, base, show)}`)
      }
    } catch (e2) {
      console.error(e2)
      setErr(e2.code === 'permission-denied'
        ? 'บันทึกไม่สำเร็จ: สร้างนัดถี่เกินไป (รอ 1 นาที) หรือวันนัดไกลเกิน 1 ปี หรือข้อมูลไม่ถูกต้อง'
        : 'บันทึกไม่สำเร็จ (' + (e2.code || e2.message) + ')')
      setBusy(false)
    }
  }

  return (
    <>
      <h1>{old ? 'แก้ไขนัด' : 'สร้างนัด'}</h1>
      <form className="form card" onSubmit={submit}>
        <label>ชื่อนัด *<input value={f.title} onChange={set('title')} maxLength={80} /></label>
        <label>วัน/เวลานัด *<input type="datetime-local" value={f.when} onChange={set('when')} /></label>
        <label>ชื่อเรียกผู้สร้าง *<input value={f.name} onChange={set('name')} maxLength={30} disabled={!!old} /></label>
        <label>รายละเอียด<textarea rows={3} value={f.description} onChange={set('description')} maxLength={500} /></label>
        <label>จำนวนผู้เข้าร่วมสูงสุด *<input type="number" min={2} max={100} value={f.max} onChange={set('max')} /></label>
        {!old && (
          <>
            <p className="muted">ข้อมูลติดต่อที่ต้องการแสดงในนัดนี้ (ผู้ใช้ที่เปิดดูนัดจะเห็น)</p>
            <ContactPicker user={user} value={show} onChange={setShow} />
          </>
        )}
        {err && <p className="error">{err}</p>}
        <div className="row">
          <Button type="submit" disabled={busy}>{busy ? 'กำลังบันทึก...' : old ? 'บันทึก' : 'สร้างนัด'}</Button>
          <Button type="button" variant="ghost" onClick={() => nav(-1)}>กลับ</Button>
        </div>
      </form>
    </>
  )
}
