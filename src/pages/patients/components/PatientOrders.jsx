
import React, { useState, useMemo } from 'react';
import { usePatientOrders } from '../../../apis/orders/enhancedHooks';

const PatientOrders = ({ patient }) => {
  // State for filters
  const [medicationFilter, setMedicationFilter] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Real API call for patient orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = usePatientOrders(patient?.id);

  // Memoize processed orders and active prescriptions to avoid recalculating on every render
  const { processedOrders, activePrescriptions } = useMemo(() => {
    const orders = (ordersData || []).map((order) => ({
      id: order.id,
      date: order.created_at,
      pharmacy: order.pharmacy || 'Default Pharmacy',
      status: order.status,
      total: order.total_amount || 0,
      tracking: order.tracking_number,
      items:
        order.order_items?.map((item) => ({
          name: item.medication_name || item.product_name,
          quantity: item.quantity,
        })) || [],
    }));

    const prescriptions = (ordersData || [])
      .filter(
        (order) =>
          order.order_type === 'prescription' &&
          ['active', 'sent', 'filled'].includes(order.status)
      )
      .map((order) => ({
        id: order.id,
        medication: order.medication_name,
        dosage: order.dosage,
        refillsRemaining: order.refills_remaining || 0,
        nextRefillDate: order.next_refill_date,
        expirationDate: order.expiration_date,
        isAutoRefill: order.auto_refill || false,
        status: order.status,
        instructions: order.instructions,
      }));
    
    return { processedOrders: orders, activePrescriptions };
  }, [ordersData]);


  // Memoize filter options to prevent re-creation on each render
  const uniqueMedications = useMemo(() => {
    const medications = new Set();
    processedOrders.forEach((order) => {
      order.items.forEach((item) => {
        medications.add(item.name);
      });
    });
    return Array.from(medications);
  }, [processedOrders]);

  const uniquePharmacies = useMemo(() => {
     const pharmacies = new Set();
    processedOrders.forEach((order) => {
      if(order.pharmacy) pharmacies.add(order.pharmacy);
    });
    return Array.from(pharmacies);
  }, [processedOrders]);

  const uniqueStatuses = useMemo(() => {
     const statuses = new Set();
    processedOrders.forEach((order) => {
      statuses.add(order.status);
    });
    return Array.from(statuses);
  }, [processedOrders]);

  // Memoize the filtered orders array
  const filteredOrders = useMemo(() => {
    return processedOrders.filter((order) => {
      const matchesMedication =
        !medicationFilter ||
        order.items.some((item) => item.name === medicationFilter);
      const matchesPharmacy = !pharmacyFilter || order.pharmacy === pharmacyFilter;
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesMedication && matchesPharmacy && matchesStatus;
    });
  }, [processedOrders, medicationFilter, pharmacyFilter, statusFilter]);
  

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return { bg: 'var(--success-bg)', color: 'var(--success)' };
      case 'shipped':
        return { bg: 'var(--info-bg)', color: 'var(--info)' };
      case 'processing':
        return { bg: 'var(--warning-bg)', color: 'var(--warning)' };
      case 'cancelled':
        return { bg: 'var(--critical-bg)', color: 'var(--critical)' };
      default:
        return { bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' };
    }
  };

  return (
    <div>
      {/* Active Orders */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title h2">📦 Orders</h2>
          <button className="btn btn-primary">New Order</button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Medication Filter */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              Filter by Medication
            </label>
            <select
              value={medicationFilter}
              onChange={(e) => setMedicationFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                background: 'var(--bg-primary)',
              }}
            >
              <option value="">All Medications</option>
              {uniqueMedications.map((medication) => (
                <option key={medication} value={medication}>
                  {medication}
                </option>
              ))}
            </select>
          </div>

          {/* Pharmacy Filter */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              Filter by Pharmacy
            </label>
            <select
              value={pharmacyFilter}
              onChange={(e) => setPharmacyFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                background: 'var(--bg-primary)',
              }}
            >
              <option value="">All Pharmacies</option>
              {uniquePharmacies.map((pharmacy) => (
                <option key={pharmacy} value={pharmacy}>
                  {pharmacy}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              Filter by Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                background: 'var(--bg-primary)',
              }}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option
                  key={status}
                  value={status}
                  style={{ textTransform: 'capitalize' }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {ordersLoading && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          >
            Loading orders...
          </div>
        )}

        {ordersError && (
          <div
            style={{
              padding: '16px',
              background: 'var(--critical-bg)',
              color: 'var(--critical)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              marginTop: '16px',
            }}
          >
            Error loading orders: {ordersError.message}
            <button
              onClick={() => refetchOrders()}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                background: 'var(--critical)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              marginTop: '16px',
            }}
          >
            {ordersData.length === 0
              ? 'No orders found'
              : 'No orders match the current filters'}
          </div>
        )}

        {/* Orders Table */}
        {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              marginTop: '16px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Order ID
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Items
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Total
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusStyle = getStatusColor(order.status);

                return (
                  <tr key={order.id}>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>{order.id}</div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                        }}
                      >
                        {order.pharmacy}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                      }}
                    >
                      {new Date(order.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                      }}
                    >
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < order.items.length - 1 ? '8px' : 0,
                          }}
                        >
                          <div style={{ fontWeight: '500' }}>{item.name}</div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Qty: {item.quantity}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      ${order.total.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.status}
                      </span>
                      {order.tracking && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '4px',
                          }}
                        >
                          Tracking: {order.tracking}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-light)',
                        fontSize: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          View
                        </button>
                        {order.status === 'delivered' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Prescription Tracking */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title h2">💊 Active Prescriptions</h2>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {activePrescriptions.length > 0 ? (
            activePrescriptions.map((prescription) => {
              const statusColor =
                prescription.status === 'active'
                  ? 'var(--success)'
                  : 'var(--info)';
              const statusBg =
                prescription.status === 'active'
                  ? 'var(--success-bg)'
                  : 'var(--info-bg)';

              return (
                <div
                  key={prescription.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: statusColor,
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      💊
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>
                        {prescription.medication} {prescription.dosage}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {prescription.isAutoRefill
                          ? 'Auto-refill'
                          : 'Manual refill'}{' '}
                        •{prescription.refillsRemaining} refills remaining •
                        {prescription.nextRefillDate
                          ? `Next: ${new Date(prescription.nextRefillDate).toLocaleDateString()}`
                          : `Expires: ${new Date(prescription.expirationDate).toLocaleDateString()}`}
                      </div>
                      {prescription.instructions && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                            marginTop: '2px',
                          }}
                        >
                          {prescription.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: statusBg,
                      color: statusColor,
                      textTransform: 'capitalize',
                    }}
                  >
                    {prescription.status}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              {ordersLoading
                ? 'Loading prescriptions...'
                : 'No active prescriptions found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientOrders;
