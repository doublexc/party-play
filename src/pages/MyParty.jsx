import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import PartyCard from '../components/PartyCard.jsx'
import { useUser } from '../lib/auth.jsx'
import { useMyParties } from '../lib/parties.js'

export default function MyParty() {
  const { loading, mine, joined } = useMyParties(useUser().userId)
  if (loading) return <p className="muted">กำลังโหลด...</p>

  return (
    <>
      <h1>นัดของฉัน</h1>
      <h2>นัดที่ฉันสร้าง</h2>
      <div className="list">
        {mine.length ? mine.map((p) => <PartyCard key={p.id} party={p} />) : (
          <p className="muted">ยังไม่มีนัดที่คุณสร้าง <Button as={Link} to="/create" variant="ghost">สร้างนัดแรก</Button></p>
        )}
      </div>
      <h2>นัดที่ฉันเข้าร่วม</h2>
      <div className="list">
        {joined.length ? joined.map((p) => <PartyCard key={p.id} party={p} />) : (
          <p className="muted">ยังไม่ได้เข้าร่วมนัดไหน <Button as={Link} to="/" variant="ghost">ดูบอร์ด</Button></p>
        )}
      </div>
    </>
  )
}
