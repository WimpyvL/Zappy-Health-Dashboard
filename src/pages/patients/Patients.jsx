import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
import PatientStatusBadge from '../../components/ui/PatientStatusBadge';
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
  // NEW Patient Status Fields
  {
    name: 'account_status',
    label: 'Account Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Available' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'banned', label: 'Banned' },
    ],
    gridCols: 1,
    required: 'Account status is required',
  },
  {
    name: 'id_verification_status',
    label: 'ID Verification Status',
    type: 'select',
    options: [
      { value: 'verified', label: 'ID Verified' },
      { value: 'pending', label: 'ID Pending' },
      { value: 'rejected', label: 'ID Rejected' },
      { value: 'not_required', label: 'Not Required' },
    ],
    gridCols: 1,
    required: 'ID Verification status is required',
  },
];

const Patients = () => {
  const { data: allSubscriptionPlans = [] } = useSubscriptionPlans();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [idVerificationFilter, setIdVerificationFilter] = useState('all');
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
    account_status: statusFilter !== 'all' ? statusFilter : undefined,
    id_verification_status: idVerificationFilter !== 'all' ? idVerificationFilter : undefined,
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
  
  const totalRecords = rawMeta?.total || 0;
  const calculatedTotalPages = Math.ceil(totalRecords / pageSize);
  
  const paginationMeta = {
    total: totalRecords,
    total_pages: calculatedTotalPages,
    current_page: rawMeta?.current_page || currentPage,
    per_page: rawMeta?.per_page || pageSize,
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

  const { quickExport, isLoading: isExporting } = useQuickExport();

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

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (
        latestNotification.type === 'patient' &&
        (latestNotification.event === 'INSERT' || latestNotification.event === 'UPDATE')
      ) {
        fetchPatients();
      }
    }
  }, [notifications, fetchPatients]);

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
    setCurrentPage(1);
  };

  const paginationInfo = {
    currentPage: paginationMeta.current_page,
    totalPages: paginationMeta.total_pages,
    totalItems: paginationMeta.total,
    pageSize: paginationMeta.per_page,
    hasNextPage: !!paginationLinks.next,
    hasPreviousPage: !!paginationLinks.prev,
  };

  const handlePatientSelection = (patientId) => {
    setSelectedPatients(prevSelected => 
      prevSelected.includes(patientId)
        ? prevSelected.filter((id) => id !== patientId)
        : [...prevSelected, patientId]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setIdVerificationFilter('all');
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

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedPatients.length === 0) return;

    const selectedPatientObjects = patients.filter((p) =>
      selectedPatients.includes(p.id)
    );
    await bulkUpdateStatus(selectedPatientObjects, newStatus);
    setSelectedPatients([]);
    fetchPatients();
  };

  const handleBulkCheckInSchedule = async (templateId) => {
    if (selectedPatients.length === 0) return;

    const selectedPatientObjects = patients.filter((p) =>
      selectedPatients.includes(p.id)
    );
    await bulkScheduleCheckIns(selectedPatientObjects, templateId);
    setShowBulkCheckInModal(false);
    setSelectedPatients([]);
    fetchPatients();
  };

  const uniquePlanNames = Array.from(
    new Set(allSubscriptionPlans.map((plan) => plan.name).filter(Boolean))
  );

  return (
    <div>
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
             <div className="bg-white rounded-md shadow px-4 py-2 flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-3">
                {selectedPatients.length} selected
              </span>
              <button
                onClick={() => handleBulkStatusUpdate('suspended')}
                className="text-orange-600 hover:text-orange-900 text-sm font-medium mx-2 flex items-center"
              >
                <Ban className="h-4 w-4 mr-1" /> Suspend
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="text-green-600 hover:text-green-900 text-sm font-medium mx-2 flex items-center"
              >
                <UserCheck className="h-4 w-4 mr-1" /> Reactivate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('banned')}
                className="text-red-600 hover:text-red-900 text-sm font-medium mx-2 flex items-center"
              >
                <X className="h-4 w-4 mr-1" /> Ban
              </button>
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

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search patients by ${searchType}...`}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <select
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Available</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
           <select
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={idVerificationFilter}
            onChange={(e) => setIdVerificationFilter(e.target.value)}
          >
            <option value="all">All ID Statuses</option>
            <option value="verified">ID Verified</option>
            <option value="pending">ID Pending</option>
            <option value="rejected">ID Rejected</option>
            <option value="not_required">Not Required</option>
          </select>
        </div>
      </div>
      
      <div className="admin-table-container">
        <VirtualizedPatientList
          patients={patients}
          totalCount={paginationMeta.total}
          hasNextPage={paginationInfo.hasNextPage}
          isNextPageLoading={loading}
          loadMoreItems={() => handlePageChange(currentPage + 1)}
          onPatientClick={(patient) => navigate(`/patients/${patient.id}`)}
          onPatientSelect={handlePatientSelection}
          selectedPatients={selectedPatients}
          isSelectionMode={showBulkActions}
        />
      </div>

      <div className="admin-table-footer">
        <Pagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          totalItems={paginationInfo.totalItems}
          pageSize={paginationInfo.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 25, 50]}
          showPageInfo={true}
          layout="clean"
        />
      </div>
      
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
      
      {showUndo && (
        <UndoNotification
          message="Operation completed successfully"
          timeLeft={undoTimeLeft}
          onUndo={executeUndo}
          onDismiss={dismissUndo}
          isProcessing={isProcessing}
        />
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          patients={patients}
          selectedPatients={selectedPatients}
          currentFilters={filtersForHook}
        />
      )}
    </div>
  );
};

export default Patients;
