import { useState } from 'react';
import { PosProvider } from '../../../components/pos/PosContext.jsx';
import PosLayout from '../../../components/pos/PosLayout.jsx';
import ShiftManager from '../../../components/pos/ShiftManager.jsx';

export default function AdminPosPage({ navigate }) {
  const [activeShift, setActiveShift] = useState(null);

  if (!activeShift) {
    return <ShiftManager onShiftStarted={setActiveShift} />;
  }

  return (
    <PosProvider navigate={navigate} activeShift={activeShift} onShiftEnded={() => setActiveShift(null)}>
      <div className="admin-page animate-fadeIn pos-wrapper" style={{ padding: 0 }}>
        <PosLayout />
      </div>
    </PosProvider>
  );
}
