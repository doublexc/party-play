import { STATUS } from '../lib/format.js'
import './StatusBadge.css'

export default function StatusBadge({ status }) {
  const s = STATUS[status]
  return <span className={`badge badge-${s.cls}`}>{s.icon} {s.label}</span>
}
