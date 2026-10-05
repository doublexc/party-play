import './Button.css'

// <Button>, <Button variant="ghost">, <Button as={Link} to="/x">
export default function Button({ variant = 'primary', as: Tag = 'button', className = '', ...props }) {
  return <Tag className={`btn btn-${variant} ${className}`} {...props} />
}
