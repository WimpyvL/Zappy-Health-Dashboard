
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  X,
  Edit,
  Calendar,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
  Download,
  MessageSquare,
  Eye,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';
import RealtimeIndicator from '../../components/realtime/RealtimeIndicator';
import RealtimeNotifications from '../../components/realtime/RealtimeNotifications';
import { useRealtimePatients } from '../../hooks/useRealtime';
import CrudModal from '../../components/common/CrudModal';
import BulkPatientTagOperations from '../../components/admin/BulkPatientTagOperations';
import UndoNotification from '../../components/patients/UndoNotification';
import BulkCheckInModal from '../../components/patients/BulkCheckInModal';
import ExportModal from '../../components/export/ExportModal';
import useBulkPatientOperations from '../../hooks/useBulkPatientOperations';
import Pagination from '../../components/common/Pagination';
import { useQuickExport } from '../../hooks/useDataExport';
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
} from '../../services/database/hooks';
import patientsApi from '../../apis/patients/api';
import { useTags } from '../../apis/tags/hooks';
import { useSubscriptionPlans } from '../../apis/subscriptionPlans/hooks';
import {
  validatePhoneNumber,
  validateEmail,
  validateDateOfBirth,
  validateZipCode,
  validatePolicyNumber,
  validateName,
  validateInsuranceProvider,
  validateGroupNumber,
  validateInsuranceCopay,
  validateInsuranceEffectiveDate,
} from '../../utils/patientValidation';
import VirtualizedPatientList from '../../components/patients/VirtualizedPatientList';


const patientFormFields = [
  {
    name: 'first_name',
    label: 'First Name',
    type: 'text',
    required: 'First name is required.',
    validation: {
      validate: (value) => {
        const result = validateName(value, 'First name');
        return result === true ? true : result;
      },
    },
    gridCols: 1,
  },
  {
    name: 'last_name',
    label: 'Last Name',
    type: 'text',
    required: 'Last name is required.',
    validation: {
      validate: (value) => {
        const result = validateName(value, 'Last name');
        return result === true ? true : result;
      },
    },
    gridCols: 1,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: 'A valid email is required.',
    validation: {
      validate: (value) => {
        const result = validateEmail(value);
        return result === true ? true : result;
      },
    },
    gridCols: 2,
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    placeholder: '(XXX) XXX-XXXX',
    required: 'Phone number is required.',
    validation: {
      validate: (value) => {
        const result = validatePhoneNumber(value, true); // Required field
        return result === true ? true : result;
      },
    },
    gridCols: 1,
  },
  {
    name: 'mobile_phone',
    label: 'Mobile Phone',
    type: 'tel',
    placeholder: '(XXX) XXX-XXXX',
    validation: {
      validate: (value) => {
        const result = validatePhoneNumber(value, false); // Optional field
        return result === true ? true : result;
      },
    },
    gridCols: 1,
  },
  {
    name: 'date_of_birth',
    label: 'Date of Birth',
    type: 'date',
    required: 'Date of birth is required.',
    validation: {
      validate: (value) => {
        const result = validateDateOfBirth(value);
        return result === true ? true : result;
      },
    },
    gridCols: 2,
  },
  {
    name: 'address',
    label: 'Street Address',
    type: 'text',
    gridCols: 2,
    placeholder: 'Enter street address',
  },
  {
    name: 'city',
    label: 'City',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter city',
  },
  {
    name: 'state',
    label: 'State',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter state',
  },
  {
    name: 'zip',
    label: 'ZIP Code',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter ZIP code',
    validation: {
      validate: (value) => {
        const result = validateZipCode(value);
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'preferred_pharmacy',
    label: 'Preferred Pharmacy',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter preferred pharmacy',
  },
  // Insurance information fields
  {
    name: 'insurance_provider',
    label: 'Insurance Provider',
    type: 'text',
    gridCols: 1,
    placeholder: 'e.g., Blue Cross Blue Shield',
    validation: {
      validate: (value) => {
        const result = validateInsuranceProvider(value);
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'policy_number',
    label: 'Policy/Member ID Number',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter policy number',
    validation: {
      validate: (value) => {
        const result = validatePolicyNumber(value);
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'group_number',
    label: 'Group Number',
    type: 'text',
    gridCols: 1,
    placeholder: 'Enter group number',
    validation: {
      validate: (value) => {
        const result = validateGroupNumber(value);
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'primary_insurance_holder',
    label: 'Primary Insurance Holder',
    type: 'text',
    gridCols: 1,
    placeholder: 'If not the patient',
    validation: {
      validate: (value) => {
        const result = validateName(value, 'Primary insurance holder');
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'insurance_effective_date',
    label: 'Insurance Effective Date',
    type: 'date',
    gridCols: 1,
    validation: {
      validate: (value) => {
        const result = validateInsuranceEffectiveDate(value);
        return result === true ? true : result;
      },
    },
  },
  {
    name: 'insurance_copay',
    label: 'Copay Amount',
    type: 'text',
    gridCols: 1,
    placeholder: 'e.g., $25',
    validation: {
      validate: (value) => {
        const result = validateInsuranceCopay(value);
        return result === true ? true : result;
      },
    },
  },
  // Patient Status Field
  {
    name: 'status',
    label: 'Patient Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'deactivated', label: 'Deactivated' },
      { value: 'blacklisted', label: 'Blacklisted' },
    ],
    gridCols: 1,
    required: 'Status is required',
  },
];

const Patients = () => {
  const { data: allSubscriptionPlans = [] } = useSubscriptionPlans();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [affiliateFilter, setAffiliateFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchType, setSearchType] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlSearchTerm = queryParams.get('search');
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [location.search]);

  const filtersForHook = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tag_id: selectedTags.length > 0 ? selectedTags : undefined,
    is_affiliate:
      affiliateFilter !== 'all' ? affiliateFilter === 'yes' : undefined,
  };
  const {
    data: patientsData,
    isLoading: loading,
    error,
    refetch: fetchPatients,
  } = usePatients({
    page: currentPage,
    pageSize: pageSize,
    filters: filtersForHook,
  });

  const { data: tagsData = [] } = useTags();

  const rawPatients = patientsData?.data || [];
  const rawMeta = patientsData?.meta;
  
  // Calculate pagination metadata with proper fallbacks
  const totalRecords = rawMeta?.total || 0;
  const calculatedTotalPages = Math.ceil(totalRecords / pageSize);
  
  const paginationMeta = {
    total: totalRecords,
    total_pages: calculatedTotalPages,
    current_page: rawMeta?.current_page || currentPage,
    per_page: rawMeta?.per_page || pageSize,
    // Keep original last_page for backward compatibility
    last_page: calculatedTotalPages,
  };
  
  const paginationLinks = patientsData?.links || {
    first: calculatedTotalPages > 1 ? `?page=1` : null,
    last: calculatedTotalPages > 1 ? `?page=${calculatedTotalPages}` : null,
    prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
    next: currentPage < calculatedTotalPages ? `?page=${currentPage + 1}` : null,
  };
  
  const tags = tagsData || [];

  const patients = rawPatients.filter((patient) => {
    if (subscriptionPlanFilter === 'all') return true;
    if (subscriptionPlanFilter === 'none') return !patient.subscriptionPlanName;
    return patient.subscriptionPlanName === subscriptionPlanFilter;
  });

  const [selectedPatients, setSelectedPatients] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [showBulkCheckInModal, setShowBulkCheckInModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Bulk operations hook
  const {
    bulkUpdateStatus,
    bulkScheduleCheckIns,
    isProcessing,
    progress,
    showUndo,
    undoTimeLeft,
    executeUndo,
    dismissUndo,
  } = useBulkPatientOperations();

  // Quick export hook
  const { quickExport, isLoading: isExporting } = useQuickExport();

  // Real-time patient updates
  const {
    isConnected,
    connectionStatus,
    forceReconnect,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimePatients({
    enablePatientUpdates: true,
    enableStatusUpdates: true,
    enableNotifications: true,
  });

  // Handle real-time updates by refreshing patient list
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (
        latestNotification.type === 'patient' &&
        latestNotification.event === 'INSERT'
      ) {
        // Refresh patient list when new patients are added
        fetchPatients();
      } else if (
        latestNotification.type === 'patient' &&
        latestNotification.event === 'UPDATE'
      ) {
        // Refresh patient list when patients are updated
        fetchPatients();
      }
    }
  }, [notifications, fetchPatients]);

  // Handle export button click
  const handleExportClick = () => {
    console.log('Export button clicked, patients count:', patients.length);
    console.log('Selected patients count:', selectedPatients.length);

    if (patients.length === 0) {
      alert(
        'No patients available to export. Please adjust your filters or add patients.'
      );
      return;
    }
    setShowExportModal(true);
  };

  useEffect(() => {
    setShowBulkActions(selectedPatients.length > 0);
  }, [selectedPatients]);

  const handlePageChange = (page) => {
    if (page < 1 || page > paginationMeta.total_pages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Create pagination info for our reusable component
  const paginationInfo = {
    currentPage: paginationMeta.current_page,
    totalPages: paginationMeta.total_pages,
    totalItems: paginationMeta.total,
    pageSize: paginationMeta.per_page,
    hasNextPage: !!paginationLinks.next,
    hasPreviousPage: !!paginationLinks.prev,
  };

  const handlePatientSelection = (patientId) => {
    if (selectedPatients.includes(patientId)) {
      setSelectedPatients(selectedPatients.filter((id) => id !== patientId));
    } else {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAffiliateFilter('all');
    setSelectedTags([]);
    setSubscriptionPlanFilter('all');
    setSearchType('name');
    setCurrentPage(1);
    fetchPatients();
  };

  const handleEditClick = (patient) => {
    setEditingPatientId(patient.id);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingPatientId(null);
  };

  // Bulk operation handlers
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedPatients.length === 0) return;

    const selectedPatientObjects = patients.filter((p) =>
      selectedPatients.includes(p.id)
    );
    await bulkUpdateStatus(selectedPatientObjects, newStatus);

    // Clear selection after operation
    setSelectedPatients([]);

    // Refresh patient list
    fetchPatients();
  };

  const handleBulkCheckInSchedule = async (templateId) => {
    if (selectedPatients.length === 0) return;

    const selectedPatientObjects = patients.filter((p) =>
      selectedPatients.includes(p.id)
    );
    await bulkScheduleCheckIns(selectedPatientObjects, templateId);

    // Close modal and clear selection
    setShowBulkCheckInModal(false);
    setSelectedPatients([]);

    // Refresh patient list
    fetchPatients();
  };

  const uniquePlanNames = Array.from(
    new Set(allSubscriptionPlans.map((plan) => plan.name).filter(Boolean))
  );

  return (
    <div>
      {/* Header and Bulk Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="admin-page-title">Patients</h1>
          <RealtimeIndicator
            isConnected={isConnected}
            connectionStatus={connectionStatus}
            onReconnect={forceReconnect}
            className="text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <RealtimeNotifications
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotifications={clearNotifications}
            showToasts={true}
            maxToasts={3}
          />
          {showBulkActions && (
            <div
              style={{
                background: 'var(--primary-light)',
                borderBottom: '1px solid var(--border)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontWeight: '600', color: 'var(--primary-600)' }}>
                {selectedPatients.length} patient
                {selectedPatients.length !== 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleBulkStatusUpdate('deactivated')}
                  disabled={isProcessing}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--error-600)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Ban className="h-4 w-4" /> Suspend
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={isProcessing}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--success-600)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--success-600)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <UserCheck className="h-4 w-4" /> Activate
                </button>
                <button
                  onClick={() => setShowBulkCheckInModal(true)}
                  disabled={isProcessing}
                  style={{
                    padding: '6px 12px',
                    border:
                      '1px solid var(--primary-600)' /* Using primary-600 token */,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--primary-600)' /* Using primary-600 token */,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar className="h-4 w-4" /> Schedule Follow-up
                </button>
                <button
                  onClick={() => setShowBulkTagModal(true)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--programs-weight)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--programs-weight)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <TagIcon className="h-4 w-4" /> Tag Operations
                </button>
                <button
                  onClick={() => setSelectedPatients([])}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border)' /* Using border token */,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color:
                      'var(--text-secondary)' /* Using text-secondary token */,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          <button
            className="admin-btn-secondary"
            onClick={handleExportClick}
            disabled={patients.length === 0}
            title="Export patient data to CSV"
          >
            <Download className="h-5 w-5 mr-2" /> Export
          </button>
          <button
            className="admin-btn-primary bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              setEditingPatientId(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="h-5 w-5 mr-2" /> Add a Patient
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search patients by ${searchType}...`}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="order">Order #</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          <button
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Tags:</span>
              <div className="flex flex-wrap gap-2 max-w-md">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tag.id]);
                        } else {
                          setSelectedTags(
                            selectedTags.filter((id) => id !== tag.id)
                          );
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Plan:</span>
              <select
                className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={subscriptionPlanFilter}
                onChange={(e) => setSubscriptionPlanFilter(e.target.value)}
              >
                <option value="all">All Plans</option>
                {uniquePlanNames.map((planName) => (
                  <option key={planName} value={planName}>
                    {planName}
                  </option>
                ))}
                <option value="none">No Plan</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <button
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Patients List */}
      <div className="admin-table-container">
        <VirtualizedPatientList
          patients={patients}
          totalCount={paginationMeta.total}
          hasNextPage={paginationInfo.hasNextPage}
          isNextPageLoading={loading}
          loadMoreItems={() => handlePageChange(currentPage + 1)}
          onPatientClick={(patient) => navigate(`/patients/${patient.id}`)}
          onPatientSelect={(patientId) => handlePatientSelection(patientId)}
          selectedPatients={selectedPatients}
          isSelectionMode={showBulkActions}
        />
      </div>


      {/* Pagination */}
      <div className="admin-table-footer">
        <Pagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          totalItems={paginationInfo.totalItems}
          pageSize={paginationInfo.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 25, 50]}
          showPageInfo={true}
          layout="clean"
        />
      </div>

      {/* Generic CRUD Modal for Add/Edit */}
      {(showAddModal || showEditModal) && (
        <CrudModal
          isOpen={showAddModal || showEditModal}
          onClose={handleCloseModal}
          entityId={editingPatientId}
          resourceName="Patient"
          fetchById={patientsApi.getById}
          useCreateHook={useCreatePatient}
          useUpdateHook={useUpdatePatient}
          formFields={patientFormFields}
          onSuccess={() => {
            handleCloseModal();
            fetchPatients();
          }}
          formGridCols={2}
        />
      )}

      {/* Bulk Patient Tag Operations Modal */}
      {showBulkTagModal && (
        <BulkPatientTagOperations
          selectedPatients={patients.filter((p) =>
            selectedPatients.includes(p.id)
          )}
          onComplete={(results) => {
            setSelectedPatients([]);
            setShowBulkTagModal(false);
            fetchPatients(); // Refresh to show updated tags
          }}
          onClose={() => setShowBulkTagModal(false)}
        />
      )}

      {/* Bulk Check-in Scheduling Modal */}
      {showBulkCheckInModal && (
        <BulkCheckInModal
          isOpen={showBulkCheckInModal}
          onClose={() => setShowBulkCheckInModal(false)}
          selectedPatients={patients.filter((p) =>
            selectedPatients.includes(p.id)
          )}
          onSchedule={handleBulkCheckInSchedule}
          isProcessing={isProcessing}
        />
      )}

      {/* Undo Notification */}
      {showUndo && (
        <UndoNotification
          message="Operation completed successfully"
          timeLeft={undoTimeLeft}
          onUndo={executeUndo}
          onDismiss={dismissUndo}
          isProcessing={isProcessing}
        />
      )}

      {/* Progress Indicator */}
      {isProcessing && progress.total > 0 && (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Processing {progress.current} of {progress.total} patients...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          patients={patients}
          selectedPatients={selectedPatients}
          currentFilters={{
            status: statusFilter !== 'all' ? statusFilter : undefined,
            subscriptionPlan:
              subscriptionPlanFilter !== 'all'
                ? subscriptionPlanFilter
                : undefined,
            search: searchTerm || undefined,
          }}
        />
      )}
    </div>
  );
};

export default Patients;
