
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { toast } from 'react-toastify';
import {
  usePatients,
  useAddPatientTag,
  useRemovePatientTag,
} from '../../services/database/hooks';
import Tag from '../../components/common/Tag';
import { formatDate } from '../../utils/dateUtils';
import './PatientsPageStyled.css';

const ITEM_HEIGHT = 80;
const OVERSCAN_COUNT = 5;

const VirtualizedPatientList = ({
  patients = [],
  totalCount = 0,
  hasNextPage = false,
  isNextPageLoading = false,
  loadMoreItems,
  onPatientClick,
  onPatientSelect,
  selectedPatients = [],
  isSelectionMode = false,
  containerHeight = 600,
}) => {
  const itemData = useMemo(
    () => ({
      patients,
      onPatientClick,
      onPatientSelect,
      selectedPatients,
      isSelectionMode,
    }),
    [
      patients,
      onPatientClick,
      onPatientSelect,
      selectedPatients,
      isSelectionMode,
    ]
  );

  const itemCount = hasNextPage ? patients.length + 1 : patients.length;

  const isItemLoaded = useCallback(
    (index) => !!patients[index],
    [patients]
  );

  const loadMoreItemsCallback = useCallback(
    (startIndex, stopIndex) => {
      if (!isNextPageLoading) {
        return loadMoreItems(startIndex, stopIndex);
      }
      return Promise.resolve();
    },
    [loadMoreItems, isNextPageLoading]
  );

  return (
    <div
      className="virtualized-patient-list"
      style={{ height: containerHeight }}
    >
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItemsCallback}
        threshold={10}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={ITEM_HEIGHT}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={OVERSCAN_COUNT}
            className="patient-list-virtual"
          >
            {PatientRow}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

const PatientRow = React.memo(({ index, style, data }) => {
  const {
    patients,
    onPatientClick,
    onPatientSelect,
    selectedPatients,
    isSelectionMode,
  } = data;
  const patient = patients[index];
  const navigate = useNavigate();

  const handleRowClick = useCallback(
    (e) => {
      if (isSelectionMode) {
        e.preventDefault();
        onPatientSelect(patient.id);
      } else {
        navigate(`/patients/${patient.id}`);
      }
    },
    [patient, isSelectionMode, onPatientClick, onPatientSelect, navigate]
  );

  const handleCheckboxClick = useCallback(
    (e) => {
      e.stopPropagation();
      onPatientSelect(patient.id);
    },
    [patient.id, onPatientSelect]
  );

  if (!patient) {
    return (
      <div style={style} className="patient-row loading-row">
        <div className="loading-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-details"></div>
          </div>
        </div>
      </div>
    );
  }

  const isSelected = selectedPatients.includes(patient.id);
  const patientAge = calculateAge(patient.date_of_birth);
  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  const patientInitials = getInitials(patient.first_name, patient.last_name);

  return (
    <div
      style={style}
      className={`patient-row ${isSelected ? 'selected' : ''}`}
      onClick={handleRowClick}
    >
      <div className="patient-row-content">
        <div className="patient-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxClick}
            onClick={handleCheckboxClick}
          />
        </div>
        <div className="patient-avatar-small">
          {patientInitials}
        </div>
        <div className="patient-info-row">
          <div className="patient-primary-info">
            <span className="patient-name">{patientName}</span>
          </div>
          <div className="patient-secondary-info">
            <span className="patient-age-gender">
              {patientAge} years • {patient.gender || 'Unknown'}
            </span>
            <span className="patient-contact">
              📧 {patient.email || 'No email'} • 📞 {patient.phone || 'No phone'}
            </span>
          </div>
        </div>
        <div className="patient-tags-row">
          {patient.tags?.slice(0, 2).map((tag) => (
            <Tag key={tag.id} id={tag.id} name={tag.name} color={tag.color} size="small" />
          ))}
          {patient.tags?.length > 2 && (
            <span className="tag-overflow">+{patient.tags.length - 2}</span>
          )}
        </div>
        <div className="patient-activity">
          <span className="last-activity">
            Last: {formatDate(patient.updated_at || patient.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
});

PatientRow.displayName = 'PatientRow';

const calculateAge = (dob) => {
  if (!dob) return 'Unknown';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
};

const PatientsPageStyled = () => {
  const { data: patients, isLoading, isError, error } = usePatients();
  const addPatientTagMutation = useAddPatientTag();
  const removePatientTagMutation = useRemovePatientTag();
  const navigate = useNavigate();

  const handleAddTag = async (patientId, tagId) => {
    try {
      await addPatientTagMutation.mutateAsync({ patientId, tagId });
      toast.success('Tag added successfully');
    } catch (e) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (patientId, tagId) => {
    try {
      await removePatientTagMutation.mutateAsync({ patientId, tagId });
      toast.success('Tag removed successfully');
    } catch (e) {
      toast.error('Failed to remove tag');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <VirtualizedPatientList
      patients={patients}
      onPatientClick={(patient) => navigate(`/patients/${patient.id}`)}
      onPatientSelect={(patientId) => {
        // Handle patient selection for bulk actions
        console.log('Selected patient:', patientId);
      }}
      containerHeight={800} // Example height, adjust as needed
    />
  );
};

export default PatientsPageStyled;
