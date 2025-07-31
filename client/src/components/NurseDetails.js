import React from 'react';
import { formatDate, getDayOfWeek } from '../utils/dateUtils';
import { calculateFairness } from '../utils/autobalance';

function NurseDetails({ nurse, schedule, shiftPreferences, scheduleDates, onBack }) {
  const nurseShifts = schedule.filter(shift => shift.staffId === nurse.id);
  const nursePreferences = shiftPreferences.filter(pref => pref.profile_id === nurse.id);
  const fairness = calculateFairness(nursePreferences, nurseShifts.map(s => s.date));
  


  const hasShiftOnDate = (date) => {
    return nurseShifts.some(shift => 
      shift.date === formatDateForAPI(date)
    );
  };

  const hasPreferenceOnDate = (date) => {
    return nursePreferences.some(pref => 
      pref.date === formatDateForAPI(date)
    );
  };

  const formatDateForAPI = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="container">
      <div className="header">
        <button 
          onClick={onBack}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Back to Schedule
        </button>
        <h1>Nurse Details</h1>
        <h2>{nurse.full_name}</h2>
      </div>

      <div className="nurse-stats">
        <div className="stat-card">
          <h3>Fairness Score</h3>
          <div className="fairness-display">{fairness}%</div>
          <p>Preferences honored: {nurseShifts.length > 0 ? 
            `${nursePreferences.filter(pref => 
              nurseShifts.some(shift => shift.date === pref.date)
            ).length}/${nurseShifts.length}` : '0/0'}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Shifts</h3>
          <div className="shift-count">{nurseShifts.length}</div>
          <p>Assigned shifts in this period</p>
        </div>
        
        <div className="stat-card">
          <h3>Preferences</h3>
          <div className="preference-count">{nursePreferences.length}</div>
          <p>Requested shifts</p>
        </div>
      </div>

      <div className="schedule-details">
        <h3>Schedule Details</h3>
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Has Shift</th>
              <th>Had Preference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {scheduleDates.map((date, index) => {
              const hasShift = hasShiftOnDate(date);
              const hadPreference = hasPreferenceOnDate(date);
              let status = '';
              let statusClass = '';
              
              if (hasShift && hadPreference) {
                status = '✓ Honored';
                statusClass = 'honored';
              } else if (hasShift && !hadPreference) {
                status = 'Assigned';
                statusClass = 'assigned';
              } else if (!hasShift && hadPreference) {
                status = '✗ Not Honored';
                statusClass = 'not-honored';
              } else {
                status = 'No Assignment';
                statusClass = 'none';
              }

              return (
                <tr key={index} className={statusClass}>
                  <td>{formatDate(date)}</td>
                  <td>{getDayOfWeek(date)}</td>
                  <td>{hasShift ? '✓' : '✗'}</td>
                  <td>{hadPreference ? '✓' : '✗'}</td>
                  <td className={`status-${statusClass}`}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .nurse-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #dee2e6;
        }
        
        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .fairness-display {
          font-size: 2.5em;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }
        
        .shift-count, .preference-count {
          font-size: 2.5em;
          font-weight: bold;
          color: #28a745;
          margin-bottom: 5px;
        }
        
        .stat-card p {
          margin: 0;
          color: #6c757d;
          font-size: 12px;
        }
        
        .schedule-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .schedule-details h3 {
          margin-top: 0;
          color: #495057;
        }
        
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .schedule-table th,
        .schedule-table td {
          padding: 16px 12px;
          text-align: center;
          border: 1px solid #dee2e6;
          vertical-align: middle;
        }
        
        .schedule-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          padding: 18px 12px;
        }
        
        .schedule-table th:nth-child(1),
        .schedule-table td:nth-child(1) {
          width: 20%;
        }
        
        .schedule-table th:nth-child(2),
        .schedule-table td:nth-child(2) {
          width: 15%;
        }
        
        .schedule-table th:nth-child(3),
        .schedule-table td:nth-child(3) {
          width: 15%;
        }
        
        .schedule-table th:nth-child(4),
        .schedule-table td:nth-child(4) {
          width: 15%;
        }
        
        .schedule-table th:nth-child(5),
        .schedule-table td:nth-child(5) {
          width: 35%;
        }
        
        .honored {
          background-color: #d4edda;
        }
        
        .assigned {
          background-color: #fff3cd;
        }
        
        .not-honored {
          background-color: #f8d7da;
        }
        
        .none {
          background-color: #f8f9fa;
        }
        
        .status-honored {
          color: #155724;
          font-weight: bold;
        }
        
        .status-assigned {
          color: #856404;
          font-weight: bold;
        }
        
        .status-not-honored {
          color: #721c24;
          font-weight: bold;
        }
        
        .status-none {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}

export default NurseDetails; 