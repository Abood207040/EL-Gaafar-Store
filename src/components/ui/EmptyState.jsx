// src/components/ui/EmptyState.jsx
import Button from './Button.jsx';

export default function EmptyState({ icon = '📦', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state animate-fadeIn">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
