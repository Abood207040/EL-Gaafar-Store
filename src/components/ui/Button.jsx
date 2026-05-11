// src/components/ui/Button.jsx
export default function Button({
  children,
  variant = 'primary',
  size = '',
  className = '',
  icon,
  iconRight,
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className="btn-icon-wrap">{icon}</span>}
      {children}
      {iconRight && <span className="btn-icon-wrap">{iconRight}</span>}
    </button>
  );
}
