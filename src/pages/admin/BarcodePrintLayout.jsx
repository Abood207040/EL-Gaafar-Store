import Barcode from 'react-barcode';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function BarcodePrintLayout({ items }) {
  const { productName, productAltName } = useLocalization();

  if (!items || items.length === 0) return null;

  return (
    <div className="barcode-print-layout">
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="barcode-sticker">
          <div className="sticker-header">
            <span className="sticker-name-en">{productName(item)}</span>
            {productAltName(item) && (
              <span className="sticker-name-ar arabic-text" lang="ar" dir="rtl">{productAltName(item)}</span>
            )}
          </div>
          {item.barcode ? (
            <div className="barcode-graphic">
              <Barcode 
                value={item.barcode} 
                width={1.5} 
                height={40} 
                fontSize={12} 
                margin={5} 
                displayValue={true} 
              />
            </div>
          ) : (
            <div className="no-barcode">No Barcode</div>
          )}
        </div>
      ))}
    </div>
  );
}
