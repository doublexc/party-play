import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import PartyCard from '../components/PartyCard.jsx'
import Notice from '../components/Notice.jsx'
import { useBoardParties } from '../lib/parties.js'
import { isOnBoard } from '../lib/format.js'

export default function Board() {
  const [q, setQ] = useState('')
  const [now, setNow] = useState(Date.now())
  const { list, error } = useBoardParties()

  // re-check expiry every 30s so cards disappear while the page stays open
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const term = q.trim().toLowerCase()
  const shown = (list || []).filter((p) => isOnBoard(p, now) && p.title.toLowerCase().includes(term))

  return (
    <>
      <h1>Party Play</h1>
      <input className="input" placeholder="ค้นหานัดจากชื่อ" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="row" style={{ margin: '.75rem 0' }}>
        <Button as={Link} to="/create">+ สร้างนัด</Button>
        <Button as={Link} to="/settings" variant="ghost">แก้ไขช่องทางติดต่อ</Button>
      </div>
      {error && <Notice>โหลดนัดไม่สำเร็จ ({error})</Notice>}
      <div className="list">
        {!list ? <p className="muted">กำลังโหลด...</p>
          : shown.length ? shown.map((p) => <PartyCard key={p.id} party={p} />)
          : <p className="muted">{term ? 'ไม่พบนัดที่ค้นหา' : 'ยังไม่มีนัดบนบอร์ด ลองสร้างนัดแรกดูครับ'}</p>}
      </div>
    </>
  )
}
