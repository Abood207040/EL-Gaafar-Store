// src/components/ui/Input.jsx
export default function Input({
  label,
  id,
  required,
  hint,
  icon,
  className = '',
  ...rest
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span aria-hidden="true">*</span>}
        </label>
      )}
      {icon ? (
        <div className="input-group">
          <span className="input-icon" aria-hidden="true">{icon}</span>
          <input id={id} className="input" required={required} {...rest} />
        </div>
      ) : (
        <input id={id} className="input" required={required} {...rest} />
      )}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}
