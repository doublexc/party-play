import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import Notice from '../components/Notice.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ContactPicker from '../components/ContactPicker.jsx'
import ChatLog from '../components/ChatLog.jsx'
import { useUser } from '../lib/auth.jsx'
import { useParty, joinParty, leaveParty, setPartyStatus } from '../lib/parties.js'
import { CONTACT_FIELDS, STATUS, UNVERIFIED, fmtDate } from '../lib/format.js'

export default function PartyDetail() {
  const { id } = useParams()
  const user = useUser()
  const { party: p, members, isMember } = useParty(id, user.userId)
  const [modal, setModal] = useState(null) // 'join' | 'cancel' | null
  const [show, setShow] = useState({ email: true, phone: true })
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (p === undefined) return <p className="muted">กำลังโหลด...</p>
  if (!p) return <p>ไม่พบนัดนี้</p>

  const isCreator = p.creatorId === user.userId
  const full = p.memberCount >= p.maxPlayers
  const myName = members.find((m) => m.userId === user.userId)?.name

  const run = async (fn) => {
    setBusy(true); setErr('')
    try { await fn(); setModal(null) } catch (e) {
      console.error(e)
      setErr('ทำรายการไม่สำเร็จ (' + (e.code || e.message) + ') อาจมีคนอื่นเข้าร่วมหรือแก้ไขพร้อมกัน ลองใหม่อีกครั้ง')
    } finally { setBusy(false) }
  }
  const setStatus = (status) => (status === 'CANCELLED' ? setModal('cancel') : run(() => setPartyStatus(p, status)))

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>{p.title}</h1>
        <StatusBadge status={p.status} />
      </div>

      <div className="card">
        <p>📅 {fmtDate(p.datetime)}</p>
        <p>ผู้สร้าง: {p.creatorName}</p>
        <p>{p.description || <span className="muted">ไม่มีรายละเอียด</span>}</p>
        <p>สมาชิก: {p.memberCount} / {p.maxPlayers} คน</p>
        <div className="row" style={{ marginTop: '.5rem' }}>
          {!isMember && p.status !== 'CANCELLED' && (
            <Button onClick={() => setModal('join')} disabled={full || busy}>{full ? 'นัดเต็มแล้ว' : 'เข้าร่วม'}</Button>
          )}
          {isMember && !isCreator && <Button variant="ghost" disabled={busy} onClick={() => run(() => leaveParty(id, user.userId, myName))}>ถอนตัว</Button>}
        </div>
        {err && <p className="error">{err}</p>}
      </div>

      {isCreator && (
        <>
          <h2>จัดการนัด</h2>
          <div className="card row">
            <Button as={Link} to={`/party/${id}/edit`} variant="ghost">แก้ไขนัด</Button>
            <select className="input" style={{ width: 'auto' }} value={p.status} disabled={busy} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <Button variant="danger" onClick={() => setModal('cancel')} disabled={busy || p.status === 'CANCELLED'}>ยกเลิกนัด</Button>
          </div>
        </>
      )}

      <h2>ผู้เข้าร่วม</h2>
      <Notice>{UNVERIFIED}</Notice>
      <div className="list" style={{ marginTop: '.5rem' }}>
        {members.map((m) => (
          <div className="card" key={m.userId}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{m.userId === p.creatorId ? '👑' : '👤'} {m.name}</strong>
              <Button variant="ghost" onClick={() => setOpen(open === m.userId ? null : m.userId)}>
                {open === m.userId ? 'ซ่อน' : 'ข้อมูลติดต่อ'}
              </Button>
            </div>
            {open === m.userId && CONTACT_FIELDS.map(([k, label]) => (
              <p key={k} className="muted">{label}: {m.contact[k] || 'ไม่เปิดเผย'}</p>
            ))}
          </div>
        ))}
      </div>

      <ChatLog partyId={id} user={user} status={p.status} isMember={isMember} myName={myName} />

      {modal === 'join' && (
        <Modal title="เข้าร่วมนัด" onClose={() => setModal(null)}>
          <Notice>{UNVERIFIED}</Notice>
          <p className="muted">ข้อมูลที่ต้องการแสดงในนัดนี้ (ผู้ใช้ที่เปิดดูนัดนี้จะเห็น)</p>
          <ContactPicker user={user} value={show} onChange={setShow} />
          <p className="muted" style={{ marginTop: '.75rem' }}>ข้อมูลที่เปิดเผยแล้ว คนอื่นอาจจดไว้ได้ แม้คุณถอนตัวภายหลัง</p>
          <div className="row" style={{ marginTop: '1rem' }}>
            <Button disabled={busy} onClick={() => run(() => joinParty(id, user, show))}>เข้าร่วม</Button>
            <Button variant="ghost" onClick={() => setModal(null)}>ยกเลิก</Button>
          </div>
        </Modal>
      )}

      {modal === 'cancel' && (
        <Modal title="ต้องการยกเลิกนัดนี้หรือไม่?" onClose={() => setModal(null)}>
          <div className="row">
            <Button variant="danger" disabled={busy} onClick={() => run(() => setPartyStatus(p, 'CANCELLED'))}>ยืนยันการยกเลิก</Button>
            <Button variant="ghost" onClick={() => setModal(null)}>กลับ</Button>
          </div>
        </Modal>
      )}
    </>
  )
}
