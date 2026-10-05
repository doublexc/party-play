import { CONTACT_FIELDS } from '../lib/format.js'

// Checkboxes for choosing which contact fields to reveal in one party
export default function ContactPicker({ user, value, onChange }) {
  return (
    <div className="form">
      {CONTACT_FIELDS.map(([k, label]) => (
        <label key={k} className="check">
          <input
            type="checkbox"
            disabled={!user[k]}
            checked={!!value[k] && !!user[k]}
            onChange={(e) => onChange({ ...value, [k]: e.target.checked })}
          />
          {label} <span className="muted">{user[k] ? `(${user[k]})` : '(ยังไม่ได้กรอก)'}</span>
        </label>
      ))}
    </div>
  )
}
