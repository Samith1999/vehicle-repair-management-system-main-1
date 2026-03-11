import React from 'react';
import { Badge } from 'react-bootstrap';
import { REPAIR_STATUS, VEHICLE_STATUS } from '../utils/constants';

const StatusBadge = ({ status, type = 'repair' }) => {
  const getStatusConfig = () => {
    
    
    const configs = {
      [REPAIR_STATUS.PENDING]: { variant: 'warning', text: 'Pending' },
      [REPAIR_STATUS.SENT_TO_RDHS]: { variant: 'info', text: 'Sent to RDHS' },
      [REPAIR_STATUS.APPROVED]: { variant: 'success', text: 'Approved' },
      [REPAIR_STATUS.REJECTED]: { variant: 'danger', text: 'Rejected' },
      [VEHICLE_STATUS.OPERATIONAL]: { variant: 'success', text: 'Operational' },
      [VEHICLE_STATUS.UNDER_REPAIR]: { variant: 'warning', text: 'Under Repair' },
      [VEHICLE_STATUS.REPAIRED]: { variant: 'info', text: 'Repaired' },
      [VEHICLE_STATUS.APPROVED]: { variant: 'primary', text: 'Approved' }
    };
    
    return configs[status] || { variant: 'secondary', text: status };
  };

  const config = getStatusConfig();

  return (
    <Badge 
      bg={config.variant} 
      className={`status-badge badge-${config.variant}`}
      pill
    >
      {config.text}
    </Badge>
  );
};

export default StatusBadge;