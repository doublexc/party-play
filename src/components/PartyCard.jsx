import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import Button from './Button.jsx'
import { fmtParts } from '../lib/format.js'
import './PartyCard.css'

export default function PartyCard({ party: p }) {
  const { day, mon, time } = fmtParts(p.datetime)
  return (
    <article className={`card party-card party-card--${p.status.toLowerCase()}`}>
      <div className="party-card__stub">
        <span className="party-card__day">{day}</span>
        <span>{mon}</span>
        <span className="party-card__time">{time}</span>
      </div>
      <div className="party-card__body">
        <div className="party-card__top">
          <h3>{p.title}</h3>
          <StatusBadge status={p.status} />
        </div>
        <p className="muted">ผู้สร้าง: {p.creatorName}</p>
        <p className="muted">ผู้เข้าร่วม: {p.memberCount} / {p.maxPlayers} คน</p>
        <Button as={Link} to={`/party/${p.id}`} variant="ghost">ดูนัด</Button>
      </div>
    </article>
  )
}
