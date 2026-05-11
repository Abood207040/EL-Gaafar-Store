// src/components/ui/OrderTimeline.jsx
import { useLocalization } from '../../i18n/Localization.jsx';

export default function OrderTimeline({ timeline }) {
  const { timelineStep } = useLocalization();
  const steps = timeline || [];

  return (
    <div className="order-timeline">
      {steps.map((step, i) => (
        <div key={i} className={`timeline-step ${step.done ? 'done' : ''} ${i === steps.findLastIndex(s => s.done) ? 'current' : ''}`}>
          <div className="timeline-connector">
            <div className="timeline-dot" aria-hidden="true">
              {step.done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && <div className="timeline-line" />}
          </div>
          <div className="timeline-content">
            <span className="timeline-label">{timelineStep(step.step)}</span>
            {step.date && <span className="timeline-date">{step.date}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
