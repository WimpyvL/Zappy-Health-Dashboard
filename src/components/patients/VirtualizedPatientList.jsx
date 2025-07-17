
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import Tag from '../common/Tag';
import { formatDate } from '../../utils/dateUtils';
import './VirtualizedPatientList.css';

const ITEM_HEIGHT = 80; // Height of each patient row
const OVERSCAN_COUNT = 5; // Number of items to render outside visible area

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
  const listRef = useRef();
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
      if (!isNextPageLoading && hasNextPage) {
        return loadMoreItems(startIndex, stopIndex);
      }
      return Promise.resolve();
    },
    [loadMoreItems, isNextPageLoading, hasNextPage]
  );

  useEffect(() => {
    return () => {
      if (listRef.current) {
        // @ts-ignore
        listRef.current.scrollTo(0);
      }
    };
  }, []);

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
            ref={(list) => {
              // @ts-ignore
              ref(list);
              listRef.current = list;
            }}
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

  const handleRowClick = useCallback(
    (e) => {
      if (isSelectionMode) {
        e.preventDefault();
        onPatientSelect(patient.id);
      } else {
        onPatientClick(patient);
      }
    },
    [patient, isSelectionMode, onPatientClick, onPatientSelect]
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
  const patientName =
    `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
  const patientInitials = getInitials(patient.first_name, patient.last_name);

  return (
    <div
      style={style}
      className={`patient-row ${isSelected ? 'selected' : ''} ${
        isSelectionMode ? 'selection-mode' : ''
      }`}
      onClick={handleRowClick}
    >
      <div className="patient-row-content">
        {isSelectionMode && (
          <div className="patient-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              onClick={handleCheckboxClick}
            />
          </div>
        )}

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
              📧 {patient.email || 'No email'} • 📞{' '}
              {patient.phone || 'No phone'}
            </span>
          </div>
        </div>

        <div className="patient-tags-row">
          {patient.tags?.slice(0, 2).map((tag) => (
            <Tag
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              size="small"
            />
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

export default VirtualizedPatientList;
