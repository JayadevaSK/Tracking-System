import React, { useState } from 'react';
import { EmployeeSummary } from '../types';
import EmployeeSummaryCard from './EmployeeSummaryCard';

type SortKey = 'name' | 'completionPercentage' | 'totalItems';

interface TeamOverviewProps {
  employees: EmployeeSummary[];
  date: string;
  onDateChange: (date: string) => void;
  onSelectEmployee: (employeeId: string) => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  employees,
  date,
  onDateChange,
  onSelectEmployee,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const sorted = [...employees].sort((a, b) => {
    if (sortKey === 'name') return a.employeeName.localeCompare(b.employeeName);
    if (sortKey === 'completionPercentage') return b.completionPercentage - a.completionPercentage;
    return b.totalItems - a.totalItems;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="team-date">Date: </label>
          <input
            id="team-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            style={{ marginLeft: '8px', padding: '6px' }}
          />
        </div>
        <div>
          <label htmlFor="sort-key">Sort by: </label>
          <select
            id="sort-key"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{ marginLeft: '8px', padding: '6px' }}
          >
            <option value="name">Name</option>
            <option value="completionPercentage">Completion %</option>
            <option value="totalItems">Work Items</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: '#6c757d' }}>No employees found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {sorted.map((emp) => (
            <EmployeeSummaryCard key={emp.employeeId} summary={emp} onClick={onSelectEmployee} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamOverview;
