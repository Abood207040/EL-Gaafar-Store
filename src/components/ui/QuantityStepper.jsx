// src/components/ui/QuantityStepper.jsx
import { useLocalization } from '../../i18n/Localization.jsx';

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  onLimitReached
}) {
  const { t } = useLocalization();
  const dec = () => { if (value > min) onChange(value - 1); };
  const inc = () => {
    if (value < max) {
      onChange(value + 1);
    } else if (onLimitReached) {
      onLimitReached(max);
    }
  };

  return (
    <div className="qty-stepper" aria-label={t('quantitySelector')}>
      <button
        type="button"
        className="qty-btn"
        onClick={dec}
        disabled={value <= min}
        aria-label={t('decreaseQuantity')}
      >
        -
      </button>
      <span className="qty-value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="qty-btn"
        onClick={inc}
        disabled={value >= max && !onLimitReached}
        aria-label={t('increaseQuantity')}
        style={value >= max && !onLimitReached ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
      >
        +
      </button>
    </div>
  );
}
