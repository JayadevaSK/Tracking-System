import React from 'react';
import { EmployeeSummary } from '../types';

interface EmployeeSummaryCardProps {
  summary: EmployeeSummary;
  onClick: (employeeId: string) => void;
}

const EmployeeSummaryCard: React.FC<EmployeeSummaryCardProps> = ({ summary, onClick }) => {
  const pct = summary.completionPercentage;
  const barColor = pct >= 80 ? '#28a745' : pct >= 50 ? '#ffc107' : '#dc3545';

  return (
    <div
      onClick={() => onClick(summary.employeeId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(summary.employeeId)}
      style={{
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      aria-label={`View details for ${summary.employeeName}`}
    >
      <h4 style={{ margin: '0 0 8px' }}>{summary.employeeName}</h4>
      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6c757d' }}>
        {summary.totalItems} items &bull; {summary.completedItems} completed
      </p>
      <div style={{ background: '#e9ecef', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div
          style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '13px', textAlign: 'right' }}>{pct}%</p>
    </div>
  );
};

export default EmployeeSummaryCard;
