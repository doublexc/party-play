import './Notice.css'

export default function Notice({ type = 'warn', children }) {
  return <div className={`notice notice-${type}`}>{children}</div>
}
