import { useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import { useMessages, sendMessage } from '../lib/parties.js'
import { STATUS } from '../lib/format.js'
import './ChatLog.css'

const hhmm = (d) => d.toLocaleTimeString('th-TH-u-ca-gregory', { hour: '2-digit', minute: '2-digit', hour12: false })
const day = (d) => d.toLocaleDateString('th-TH-u-ca-gregory', { day: 'numeric', month: 'short' })

const sysText = (m) => {
  if (m.type === 'join') return `${m.name} เข้าร่วมนัด`
  if (m.type === 'leave') return `${m.name} ถอนตัว`
  return `${m.name} เปลี่ยนสถานะเป็น "${STATUS[m.status]?.label ?? m.status}"`
}

// Log-style chat at the bottom of the party page. Everyone reads; members type (1 line / 5 min).
export default function ChatLog({ partyId, user, status, isMember, myName }) {
  const [n, setN] = useState(50)
  const msgs = useMessages(partyId, n)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [nextAt, setNextAt] = useState(0)
  const box = useRef(null)
  const pinned = useRef(true)

  // stay on the newest line unless the reader scrolled up
  useEffect(() => {
    if (box.current && pinned.current) box.current.scrollTop = box.current.scrollHeight
  }, [msgs])
  const onScroll = () => {
    const el = box.current
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  const send = async () => {
    const t = text.trim()
    if (!t || busy) return
    setBusy(true); setErr('')
    try {
      await sendMessage(partyId, user.userId, myName, t)
      setText(''); setNextAt(Date.now() + 5 * 60000); pinned.current = true
    } catch (e) {
      console.error(e)
      setErr(e.code === 'permission-denied'
        ? 'ส่งไม่สำเร็จ: ส่งได้ 1 ข้อความต่อ 5 นาที (ข้อความยังอยู่ในช่อง) หรือนัดถูกยกเลิก'
        : 'ส่งไม่สำเร็จ (' + (e.code || e.message) + ')')
    } finally { setBusy(false) }
  }
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }

  return (
    <>
      <h2>แชทนัด</h2>
      <div className="chatlog" ref={box} onScroll={onScroll}>
        {msgs === null ? <p className="muted">กำลังโหลด...</p> : (
          <>
            {msgs.length >= n && <button className="chatlog__more" onClick={() => setN(n + 50)}>แสดงข้อความเก่าเพิ่ม</button>}
            {!msgs.length && <p className="muted">ยังไม่มีข้อความ</p>}
            {msgs.map((m, i) => (
              <div key={m.id}>
                {(i === 0 || day(msgs[i - 1].at) !== day(m.at)) && <div className="chatlog__day">— {day(m.at)} —</div>}
                <div className={m.type === 'chat' ? 'chatlog__row' : 'chatlog__row chatlog__sys'}>
                  <span className="chatlog__time">{hhmm(m.at)}</span>
                  {m.type === 'chat' ? <><b className="chatlog__name">{m.name}</b>{m.text}</> : <>* {sysText(m)}</>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {isMember && status !== 'CANCELLED' ? (
        <div className="chatlog__form">
          <textarea className="input" rows={2} maxLength={500} placeholder="พิมพ์ข้อความ (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
          <Button onClick={send} disabled={busy || !text.trim()}>ส่ง</Button>
        </div>
      ) : (
        <p className="muted">{status === 'CANCELLED' ? 'นัดนี้ถูกยกเลิก ปิดการพิมพ์' : 'เข้าร่วมนัดเพื่อพิมพ์ข้อความ'}</p>
      )}
      {err && <p className="error">{err}</p>}
      {nextAt > Date.now() && <p className="muted">ส่งข้อความถัดไปได้หลัง {hhmm(new Date(nextAt))}</p>}
      <p className="muted">ทุกคนอ่านข้อความได้ อย่าใส่ข้อมูลส่วนตัว · ส่งได้ 1 ข้อความต่อ 5 นาที</p>
    </>
  )
}
