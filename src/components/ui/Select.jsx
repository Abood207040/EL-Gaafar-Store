// src/components/ui/Select.jsx
export default function Select({
  label,
  id,
  required,
  hint,
  children,
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
      <select id={id} className="select" required={required} {...rest}>
        {children}
      </select>
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}
