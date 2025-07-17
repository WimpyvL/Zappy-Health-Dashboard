import React from 'react';

const accountStatusConfig = {
  active: {
    label: 'Available',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢',
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '⏸️',
  },
  banned: {
    label: 'Banned',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🚫',
  },
};

const idStatusConfig = {
  verified: {
    label: 'ID Verified',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
  },
  pending: {
    label: 'ID Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
  },
  rejected: {
    label: 'ID Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
  },
  not_required: {
    label: 'No ID Required',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '➖',
  },
};

const PatientStatusBadge = ({
  accountStatus,
  idVerificationStatus,
  size = 'sm',
}) => {
  const accountInfo = accountStatusConfig[accountStatus] || accountStatusConfig.active;
  const idInfo = idStatusConfig[idVerificationStatus] || idStatusConfig.not_required;

  const sizeClasses =
    size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${accountInfo.color}`}
      >
        <span className="mr-1">{accountInfo.icon}</span>
        {accountInfo.label}
      </span>
      {idVerificationStatus && idVerificationStatus !== 'not_required' && (
        <span
          className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${idInfo.color}`}
        >
          <span className="mr-1">{idInfo.icon}</span>
          {idInfo.label}
        </span>
      )}
    </div>
  );
};

export default PatientStatusBadge;
