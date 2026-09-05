import { usePos } from './PosContext.jsx';
import PosHeader from './PosHeader.jsx';
import PosCatalog from './PosCatalog.jsx';
import PosCart from './PosCart.jsx';
import PosReceipt from './PosReceipt.jsx';
import HeldSalesModal from './HeldSalesModal.jsx';

export default function PosLayout() {
  const { completedSaleData } = usePos();

  if (completedSaleData) {
    return <PosReceipt />;
  }

  return (
    <div className="pos-layout-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <PosHeader />
      
      <div className="pos-main-content" style={{ display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden' }}>
        <PosCatalog />
        <PosCart />
      </div>

      <HeldSalesModal />
    </div>
  );
}
