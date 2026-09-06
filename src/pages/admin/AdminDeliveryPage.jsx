// src/pages/admin/AdminDeliveryPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import {
  getDeliveryClasses,
  updateDeliveryClass,
  getGovernorates,
  createGovernorate,
  updateGovernorate,
  getAreasByGovernorate,
  createArea,
  updateArea,
  getRatesForGovernorate,
  batchSaveRates,
  getDeliveryAuditSummary,
} from '../../services/deliveryService.js';
import { DELIVERY_CLASS_LIST } from '../../constants/domain.js';

export default function AdminDeliveryPage() {
  const { isArabic } = useLocalization();

  // Active tab: 'rates' | 'governorates' | 'areas' | 'classes'
  const [activeTab, setActiveTab] = useState('rates');

  // Loading & Global Status
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Core Data
  const [deliveryClasses, setDeliveryClasses] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [selectedGovId, setSelectedGovId] = useState('');
  const [areas, setAreas] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);

  // Local Editable Matrix State:
  // Key format: `${areaId || 'default'}_${deliveryClassId}` => { price: number, requiresManualQuote: boolean }
  const [matrixState, setMatrixState] = useState({});
  const [dirtyMatrix, setDirtyMatrix] = useState(false);

  // Modals state
  const [showGovModal, setShowGovModal] = useState(false);
  const [editingGov, setEditingGov] = useState(null);
  const [govForm, setGovForm] = useState({ nameEn: '', nameAr: '', displayOrder: 0, isActive: true });

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm, setAreaForm] = useState({ nameEn: '', nameAr: '', displayOrder: 0, isActive: true });

  // Initial load
  const loadInitialData = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const [classesData, govsData, audit] = await Promise.all([
        getDeliveryClasses(true),
        getGovernorates(true),
        getDeliveryAuditSummary().catch(() => null),
      ]);

      setDeliveryClasses(classesData.length > 0 ? classesData : DELIVERY_CLASS_LIST);
      setGovernorates(govsData);
      setAuditSummary(audit);

      if (govsData.length > 0 && !selectedGovId) {
        setSelectedGovId(govsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load delivery configuration:', err);
      setStatusMessage({ type: 'danger', text: err.message || 'Failed to load delivery settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selected governorate changes, load its areas & rates
  useEffect(() => {
    if (!selectedGovId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAreas([]);
      setMatrixState({});
      setDirtyMatrix(false);
      return;
    }

    let ignore = false;
    const fetchGovDetails = async () => {
      try {
        const [areasData, ratesData] = await Promise.all([
          getAreasByGovernorate(selectedGovId, true),
          getRatesForGovernorate(selectedGovId),
        ]);

        if (ignore) return;
        setAreas(areasData);

        // Build editable matrix state
        const initialMatrix = {};
        ratesData.forEach((r) => {
          const key = `${r.areaId || 'default'}_${r.deliveryClassId}`;
          initialMatrix[key] = {
            price: r.price,
            requiresManualQuote: r.requiresManualQuote,
          };
        });
        setMatrixState(initialMatrix);
        setDirtyMatrix(false);
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load governorate rates:', err);
          setStatusMessage({ type: 'danger', text: err.message || 'Failed to load rates.' });
        }
      }
    };

    fetchGovDetails();
    return () => {
      ignore = true;
    };
  }, [selectedGovId]);

  // Handle matrix input edits
  const handleRateChange = (areaId, classId, field, value) => {
    const key = `${areaId || 'default'}_${classId}`;
    setMatrixState((prev) => {
      const current = prev[key] || { price: 0, requiresManualQuote: false };
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: field === 'price' ? Number(value) : Boolean(value),
        },
      };
    });
    setDirtyMatrix(true);
  };

  // Save Pricing Matrix in Batch
  const handleSaveRatesMatrix = async () => {
    if (!selectedGovId) return;
    setSavingRates(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const rowsToSave = [];

      // 1. Governorate default row
      deliveryClasses.forEach((cls) => {
        const key = `default_${cls.id}`;
        const item = matrixState[key];
        if (item) {
          rowsToSave.push({
            governorateId: selectedGovId,
            areaId: null,
            deliveryClassId: cls.id,
            price: item.price || 0,
            requiresManualQuote: cls.code === 'special' ? true : Boolean(item.requiresManualQuote),
            isActive: true,
          });
        }
      });

      // 2. Each area row
      areas.forEach((area) => {
        deliveryClasses.forEach((cls) => {
          const key = `${area.id}_${cls.id}`;
          const item = matrixState[key];
          if (item) {
            rowsToSave.push({
              governorateId: selectedGovId,
              areaId: area.id,
              deliveryClassId: cls.id,
              price: item.price || 0,
              requiresManualQuote: cls.code === 'special' ? true : Boolean(item.requiresManualQuote),
              isActive: true,
            });
          }
        });
      });

      await batchSaveRates(rowsToSave);
      setDirtyMatrix(false);
      setStatusMessage({
        type: 'success',
        text: isArabic ? 'تم حفظ مصفوفة أسعار التوصيل بنجاح.' : 'Delivery rates matrix saved successfully.',
      });

      // Refresh audit summary
      getDeliveryAuditSummary().then(setAuditSummary).catch(() => null);
    } catch (err) {
      console.error('Failed to save rates matrix:', err);
      setStatusMessage({ type: 'danger', text: err.message || 'Failed to save delivery rates.' });
    } finally {
      setSavingRates(false);
    }
  };

  // Governorate Form Handlers
  const handleOpenGovModal = (gov = null) => {
    setEditingGov(gov);
    setGovForm({
      nameEn: gov ? gov.nameEn : '',
      nameAr: gov ? gov.nameAr : '',
      displayOrder: gov ? gov.displayOrder : governorates.length + 1,
      isActive: gov ? gov.isActive : true,
    });
    setShowGovModal(true);
  };

  const handleSaveGov = async (e) => {
    e.preventDefault();
    if (!govForm.nameEn.trim() || !govForm.nameAr.trim()) return;

    try {
      if (editingGov) {
        await updateGovernorate(editingGov.id, govForm);
      } else {
        const created = await createGovernorate(govForm);
        if (!selectedGovId) setSelectedGovId(created.id);
      }
      setShowGovModal(false);
      setStatusMessage({
        type: 'success',
        text: isArabic ? 'تم حفظ المحافظة بنجاح.' : 'Governorate saved successfully.',
      });
      loadInitialData();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.message });
    }
  };

  const handleToggleGovStatus = async (gov) => {
    try {
      await updateGovernorate(gov.id, { isActive: !gov.isActive });
      loadInitialData();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.message });
    }
  };

  // Area Form Handlers
  const handleOpenAreaModal = (area = null) => {
    setEditingArea(area);
    setAreaForm({
      nameEn: area ? area.nameEn : '',
      nameAr: area ? area.nameAr : '',
      displayOrder: area ? area.displayOrder : areas.length + 1,
      isActive: area ? area.isActive : true,
    });
    setShowAreaModal(true);
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaForm.nameEn.trim() || !areaForm.nameAr.trim() || !selectedGovId) return;

    try {
      if (editingArea) {
        await updateArea(editingArea.id, areaForm);
      } else {
        await createArea({ ...areaForm, governorateId: selectedGovId });
      }
      setShowAreaModal(false);
      setStatusMessage({
        type: 'success',
        text: isArabic ? 'تم حفظ المنطقة بنجاح.' : 'Area saved successfully.',
      });
      // Refresh areas
      const updatedAreas = await getAreasByGovernorate(selectedGovId, true);
      setAreas(updatedAreas);
      loadInitialData();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.message });
    }
  };

  const handleToggleAreaStatus = async (area) => {
    try {
      await updateArea(area.id, { isActive: !area.isActive });
      const updatedAreas = await getAreasByGovernorate(selectedGovId, true);
      setAreas(updatedAreas);
      loadInitialData();
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.message });
    }
  };

  // Toggle delivery class active status
  const handleToggleClass = async (cls) => {
    try {
      await updateDeliveryClass(cls.id, { isActive: !cls.isActive });
      const updatedClasses = await getDeliveryClasses(true);
      setDeliveryClasses(updatedClasses);
    } catch (err) {
      setStatusMessage({ type: 'danger', text: err.message });
    }
  };

  const selectedGov = useMemo(
    () => governorates.find((g) => g.id === selectedGovId),
    [governorates, selectedGovId]
  );

  return (
    <div className="admin-delivery-page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🚚</span>
            <span>{isArabic ? 'إدارة التوصيل وشحن الطلبات' : 'Delivery Management'}</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)' }}>
            {isArabic
              ? 'التحكم المركزي في فئات المنتجات، المحافظات، المناطق، ومصفوفة الأسعار الجغرافية.'
              : 'Centralized control for product delivery classes, governorates, areas, and geographic pricing matrix.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm" onClick={loadInitialData} disabled={loading}>
            🔄 {isArabic ? 'تحديث البيانات' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Global Status / Alert Notice */}
      {statusMessage.text && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            backgroundColor: statusMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: statusMessage.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${statusMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {isArabic ? 'المحافظات النشطة' : 'Active Governorates'}
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: 'var(--primary)' }}>
            {auditSummary ? auditSummary.activeGovernoratesCount : governorates.filter((g) => g.isActive).length}
          </p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {isArabic ? 'إجمالي المناطق' : 'Total Service Areas'}
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: '#10B981' }}>
            {auditSummary ? auditSummary.totalAreas : areas.length}
          </p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {isArabic ? 'فئات التوصيل' : 'Delivery Classes'}
          </span>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: '#F67113' }}>
            {deliveryClasses.length} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--muted)' }}>(Small - Special)</span>
          </p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            {isArabic ? 'تغطية الأسعار' : 'Coverage Audit'}
          </span>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: auditSummary?.missingRateAlerts?.length ? '#DC2626' : '#10B981' }}>
            {auditSummary?.missingRateAlerts?.length
              ? `${auditSummary.missingRateAlerts.length} ${isArabic ? 'فئات تحتاج تسعير' : 'rates missing'}`
              : (isArabic ? '✓ مكتملة' : '✓ Full Coverage')}
          </p>
        </div>
      </div>

      {/* Audit Warning Banner if rates are missing */}
      {auditSummary?.missingRateAlerts?.length > 0 && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            color: '#92400E',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          <strong>⚠️ {isArabic ? 'تنبيه تغطية أسعار التوصيل:' : 'Delivery Rate Coverage Alert:'}</strong>{' '}
          {isArabic
            ? `يوجد ${auditSummary.missingRateAlerts.length} تركيبة (منطقة وفئة) تفتقر لسعر توصيل فعال، مما قد يعطل إتمام الطلب للعميل في تلك المنطقة.`
            : `There are ${auditSummary.missingRateAlerts.length} area-class combinations without active rates, which will block checkout for customers in those areas.`}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: '1.5rem', gap: '0.75rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap', flexWrap: 'nowrap', paddingBottom: '2px' }}>
        <button
          className={`btn ${activeTab === 'rates' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('rates')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.25rem', fontWeight: 600, flexShrink: 0 }}
        >
          📊 {isArabic ? 'مصفوفة الأسعار (Pricing Matrix)' : 'Rates Matrix'}
        </button>
        <button
          className={`btn ${activeTab === 'governorates' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('governorates')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.25rem', fontWeight: 600, flexShrink: 0 }}
        >
          🏛️ {isArabic ? 'المحافظات' : 'Governorates'}
        </button>
        <button
          className={`btn ${activeTab === 'areas' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('areas')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.25rem', fontWeight: 600, flexShrink: 0 }}
        >
          📍 {isArabic ? 'المناطق التابعة' : 'Areas'}
        </button>
        <button
          className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('classes')}
          style={{ borderRadius: '8px 8px 0 0', padding: '0.75rem 1.25rem', fontWeight: 600, flexShrink: 0 }}
        >
          📦 {isArabic ? 'فئات التوصيل' : 'Delivery Classes'}
        </button>
      </div>

      {/* TAB 1: PRICING MATRIX */}
      {activeTab === 'rates' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="govSelect" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isArabic ? 'اختر المحافظة:' : 'Select Governorate:'}
              </label>
              <select
                id="govSelect"
                className="input"
                style={{ minWidth: '220px', fontWeight: 600 }}
                value={selectedGovId}
                onChange={(e) => setSelectedGovId(e.target.value)}
              >
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isArabic ? `${g.nameAr} (${g.nameEn})` : `${g.nameEn} (${g.nameAr})`} {!g.isActive ? `[${isArabic ? 'معطلة' : 'Inactive'}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {dirtyMatrix && (
                <span style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 600 }}>
                  ⚠️ {isArabic ? 'توجد تعديلات غير محفوظة' : 'Unsaved changes'}
                </span>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSaveRatesMatrix}
                disabled={savingRates || !selectedGovId}
                style={{ minWidth: '140px' }}
              >
                {savingRates ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? '💾 حفظ الأسعار' : '💾 Save Rates')}
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {governorates.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                  {isArabic ? 'لا توجد محافظات مضافة بعد.' : 'No governorates configured yet.'}
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('governorates')}>
                  + {isArabic ? 'إضافة محافظة جديدة' : 'Add First Governorate'}
                </button>
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table" style={{ margin: 0, minWidth: '850px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle, #f8fafc)' }}>
                      <th style={{ width: '220px' }}>{isArabic ? 'المنطقة / النطاق' : 'Area / Zone'}</th>
                      {deliveryClasses.map((cls) => (
                        <th key={cls.id || cls.code} style={{ textAlign: 'center', minWidth: '130px' }}>
                          <span style={{ display: 'block', fontWeight: 700 }}>
                            {isArabic ? cls.nameAr : cls.nameEn}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
                            (Rank {cls.rank})
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row: Governorate-wide Default Fallback */}
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--line)' }}>
                      <td>
                        <strong style={{ color: 'var(--primary)', display: 'block' }}>
                          ⭐ {isArabic ? `الافتراضي للمحافظة (${selectedGov?.nameAr || ''})` : `Gov. Default (${selectedGov?.nameEn || ''})`}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {isArabic ? 'يُطبق كبديل في حال عدم وجود تسعير للمنطقة' : 'Fallback if area rate not set'}
                        </span>
                      </td>
                      {deliveryClasses.map((cls) => {
                        const key = `default_${cls.id}`;
                        const current = matrixState[key] || { price: 0, requiresManualQuote: cls.code === 'special' };
                        const isSpecial = cls.code === 'special';

                        return (
                          <td key={cls.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {isSpecial ? (
                              <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                                {isArabic ? 'عرض سعر يدوي' : 'Manual Quote'}
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    className="input"
                                    disabled={current.requiresManualQuote}
                                    style={{ width: '90px', textAlign: 'center', padding: '0.35rem' }}
                                    value={current.requiresManualQuote ? '' : current.price}
                                    placeholder="0"
                                    onChange={(e) => handleRateChange(null, cls.id, 'price', e.target.value)}
                                  />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>EGP</span>
                                </div>
                                <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={current.requiresManualQuote}
                                    onChange={(e) => handleRateChange(null, cls.id, 'requiresManualQuote', e.target.checked)}
                                  />
                                  <span>{isArabic ? 'عرض سعر' : 'Quote'}</span>
                                </label>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Area Rows */}
                    {areas.length === 0 ? (
                      <tr>
                        <td colSpan={deliveryClasses.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                          {isArabic ? 'لا توجد مناطق مضافة تحت هذه المحافظة بعد.' : 'No areas created under this governorate yet.'}{' '}
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenAreaModal()}
                            style={{ marginInlineStart: '0.5rem' }}
                          >
                            + {isArabic ? 'إضافة منطقة' : 'Add Area'}
                          </button>
                        </td>
                      </tr>
                    ) : (
                      areas.map((area) => (
                        <tr key={area.id}>
                          <td>
                            <strong>{isArabic ? area.nameAr : area.nameEn}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                              {isArabic ? area.nameEn : area.nameAr} {!area.isActive && `[${isArabic ? 'معطلة' : 'Disabled'}]`}
                            </span>
                          </td>
                          {deliveryClasses.map((cls) => {
                            const key = `${area.id}_${cls.id}`;
                            const current = matrixState[key] || { price: 0, requiresManualQuote: cls.code === 'special' };
                            const isSpecial = cls.code === 'special';

                            return (
                              <td key={cls.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                {isSpecial ? (
                                  <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                                    {isArabic ? 'عرض سعر يدوي' : 'Manual Quote'}
                                  </span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        step="5"
                                        className="input"
                                        disabled={current.requiresManualQuote}
                                        style={{ width: '90px', textAlign: 'center', padding: '0.35rem' }}
                                        value={current.requiresManualQuote ? '' : current.price}
                                        placeholder="0"
                                        onChange={(e) => handleRateChange(area.id, cls.id, 'price', e.target.value)}
                                      />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>EGP</span>
                                    </div>
                                    <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={current.requiresManualQuote}
                                        onChange={(e) => handleRateChange(area.id, cls.id, 'requiresManualQuote', e.target.checked)}
                                      />
                                      <span>{isArabic ? 'عرض سعر' : 'Quote'}</span>
                                    </label>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNORATES */}
      {activeTab === 'governorates' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{isArabic ? 'قائمة المحافظات' : 'Governorates'}</h2>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenGovModal()}>
              + {isArabic ? 'إضافة محافظة' : 'Add Governorate'}
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>{isArabic ? 'اسم المحافظة (عربي)' : 'Name (Arabic)'}</th>
                    <th>{isArabic ? 'اسم المحافظة (إنجليزي)' : 'Name (English)'}</th>
                    <th>{isArabic ? 'الترتيب' : 'Order'}</th>
                    <th>{isArabic ? 'المناطق' : 'Areas'}</th>
                    <th>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th>{isArabic ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {governorates.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        {isArabic ? 'لا توجد محافظات مضافة.' : 'No governorates added yet.'}
                      </td>
                    </tr>
                  ) : (
                    governorates.map((gov) => (
                      <tr key={gov.id}>
                        <td><strong>{gov.nameAr}</strong></td>
                        <td>{gov.nameEn}</td>
                        <td>{gov.displayOrder}</td>
                        <td>
                          <span className="badge badge-muted">
                            {gov.totalAreas} {isArabic ? 'منطقة' : 'areas'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`badge ${gov.isActive ? 'badge-success' : 'badge-danger'}`}
                            onClick={() => handleToggleGovStatus(gov)}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {gov.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Disabled')}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setSelectedGovId(gov.id);
                                setActiveTab('rates');
                              }}
                            >
                              📊 {isArabic ? 'الأسعار' : 'Rates'}
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                setSelectedGovId(gov.id);
                                setActiveTab('areas');
                              }}
                            >
                              📍 {isArabic ? 'المناطق' : 'Areas'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleOpenGovModal(gov)}>
                              ✏️ {isArabic ? 'تعديل' : 'Edit'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AREAS */}
      {activeTab === 'areas' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="areaGovFilter" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isArabic ? 'المحافظة:' : 'Governorate:'}
              </label>
              <select
                id="areaGovFilter"
                className="input"
                style={{ minWidth: '220px', fontWeight: 600 }}
                value={selectedGovId}
                onChange={(e) => setSelectedGovId(e.target.value)}
              >
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isArabic ? `${g.nameAr} (${g.nameEn})` : `${g.nameEn} (${g.nameAr})`}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenAreaModal()}
              disabled={!selectedGovId}
            >
              + {isArabic ? 'إضافة منطقة جديدة' : 'Add Area'}
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>{isArabic ? 'اسم المنطقة (عربي)' : 'Area Name (Arabic)'}</th>
                    <th>{isArabic ? 'اسم المنطقة (إنجليزي)' : 'Area Name (English)'}</th>
                    <th>{isArabic ? 'المحافظة' : 'Governorate'}</th>
                    <th>{isArabic ? 'الترتيب' : 'Order'}</th>
                    <th>{isArabic ? 'الحالة' : 'Status'}</th>
                    <th>{isArabic ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                        {isArabic ? 'لا توجد مناطق مضافة تحت هذه المحافظة.' : 'No areas found for this governorate.'}
                      </td>
                    </tr>
                  ) : (
                    areas.map((area) => (
                      <tr key={area.id}>
                        <td><strong>{area.nameAr}</strong></td>
                        <td>{area.nameEn}</td>
                        <td>{isArabic ? selectedGov?.nameAr : selectedGov?.nameEn}</td>
                        <td>{area.displayOrder}</td>
                        <td>
                          <button
                            className={`badge ${area.isActive ? 'badge-success' : 'badge-danger'}`}
                            onClick={() => handleToggleAreaStatus(area)}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {area.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Disabled')}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleOpenAreaModal(area)}>
                              ✏️ {isArabic ? 'تعديل' : 'Edit'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY CLASSES */}
      {activeTab === 'classes' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
              {isArabic ? 'فئات التوصيل المعتمدة للسباكة' : 'Standard Delivery Classes'}
            </h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>{isArabic ? 'الرتبة (Ranking)' : 'Rank'}</th>
                    <th>{isArabic ? 'الرمز (Code)' : 'Code'}</th>
                    <th>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</th>
                    <th>{isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'}</th>
                    <th>{isArabic ? 'نوع التسعير' : 'Pricing Mode'}</th>
                    <th>{isArabic ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryClasses.map((cls) => (
                    <tr key={cls.id || cls.code}>
                      <td>
                        <span className="badge badge-dark" style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cls.rank}
                        </span>
                      </td>
                      <td><code>{cls.code}</code></td>
                      <td><strong>{cls.nameAr}</strong></td>
                      <td>{cls.nameEn}</td>
                      <td>
                        {cls.code === 'special' ? (
                          <span className="badge badge-warning">
                            {isArabic ? 'عرض سعر يدوي إلزامي' : 'Mandatory Manual Quote'}
                          </span>
                        ) : (
                          <span className="badge badge-info">
                            {isArabic ? 'سعر ثابت / عرض سعر' : 'Fixed / Quote'}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`badge ${cls.isActive ? 'badge-success' : 'badge-danger'}`}
                          onClick={() => handleToggleClass(cls)}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {cls.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Disabled')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-subtle, #f8fafc)', borderTop: '1px solid var(--line)', fontSize: '0.85rem', color: 'var(--muted)' }}>
              ℹ️ {isArabic
                ? 'فئات التوصيل هذه مركزية ونظامية، ولا يمكن حذفها للحفاظ على سلامة سجلات المنتجات والطلبات التاريخية. يمكن فقط تعديل مسمياتها أو تفعيلها/تعطيلها.'
                : 'Delivery classes are system-defined and cannot be deleted to preserve product assignments and historical orders. You can customize labels or toggle activation.'}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT GOVERNORATE */}
      {showGovModal && (
        <div className="modal-overlay" onClick={() => setShowGovModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingGov ? (isArabic ? 'تعديل محافظة' : 'Edit Governorate') : (isArabic ? 'إضافة محافظة جديدة' : 'Add New Governorate')}</h3>
              <button className="modal-close-btn" onClick={() => setShowGovModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveGov}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'الاسم باللغة العربية' : 'Arabic Name'} *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="مثال: أسوان"
                    value={govForm.nameAr}
                    onChange={(e) => setGovForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'الاسم باللغة الإنجليزية' : 'English Name'} *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Aswan"
                    value={govForm.nameEn}
                    onChange={(e) => setGovForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'ترتيب العرض' : 'Display Order'}</label>
                  <input
                    type="number"
                    className="input"
                    value={govForm.displayOrder}
                    onChange={(e) => setGovForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{isArabic ? 'تفعيل المحافظة' : 'Active Status'}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={govForm.isActive}
                      onChange={(e) => setGovForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowGovModal(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {isArabic ? 'حفظ المحافظة' : 'Save Governorate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT AREA */}
      {showAreaModal && (
        <div className="modal-overlay" onClick={() => setShowAreaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingArea ? (isArabic ? 'تعديل منطقة' : 'Edit Area') : (isArabic ? 'إضافة منطقة جديدة' : 'Add New Area')}</h3>
              <button className="modal-close-btn" onClick={() => setShowAreaModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveArea}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <strong>{isArabic ? 'المحافظة التابعة لها:' : 'Parent Governorate:'}</strong>{' '}
                  {isArabic ? selectedGov?.nameAr : selectedGov?.nameEn}
                </div>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'اسم المنطقة (عربي)' : 'Area Name (Arabic)'} *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="مثال: المحمودية"
                    value={areaForm.nameAr}
                    onChange={(e) => setAreaForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'اسم المنطقة (إنجليزي)' : 'Area Name (English)'} *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Mahmoudia"
                    value={areaForm.nameEn}
                    onChange={(e) => setAreaForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{isArabic ? 'ترتيب العرض' : 'Display Order'}</label>
                  <input
                    type="number"
                    className="input"
                    value={areaForm.displayOrder}
                    onChange={(e) => setAreaForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{isArabic ? 'تفعيل المنطقة' : 'Active Status'}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={areaForm.isActive}
                      onChange={(e) => setAreaForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAreaModal(false)}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {isArabic ? 'حفظ المنطقة' : 'Save Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
