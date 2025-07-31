import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { generateScheduleDates, formatDate, getDayOfWeek, isSameDate, formatDateForAPI, SCHEDULE_START_DATE, SCHEDULE_END_DATE, formatDateRange } from './utils/dateUtils';
import { autobalanceSchedule, calculateFairness } from './utils/autobalance';
import NurseDetails from './components/NurseDetails';
import './App.css';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [shiftPreferences, setShiftPreferences] = useState([]);
  // Load persisted state from localStorage upoon a refresh
  const loadPersistedState = () => {
    try {
      const persisted = localStorage.getItem('nurseSchedulerState');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return {
          schedule: parsed.schedule || [],
          hasAutobalanced: parsed.hasAutobalanced || false,
          totalSwaps: parsed.totalSwaps || 0
        };
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
    return { schedule: [], hasAutobalanced: false, totalSwaps: 0 };
  };

  // save current state to LocalStorage
  const saveStateToStorage = (newSchedule, newHasAutobalanced, newTotalSwaps) => {
    try {
      const stateToSave = {
        schedule: newSchedule,
        hasAutobalanced: newHasAutobalanced,
        totalSwaps: newTotalSwaps
      };
      localStorage.setItem('nurseSchedulerState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  };

  // REACT state hooks
  const [schedule, setSchedule] = useState(loadPersistedState().schedule);
  const [initialSchedule, setInitialSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutobalancing, setIsAutobalancing] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [totalSwaps, setTotalSwaps] = useState(loadPersistedState().totalSwaps);
  const [hasAutobalanced, setHasAutobalanced] = useState(loadPersistedState().hasAutobalanced);

  const scheduleDates = useMemo(() => generateScheduleDates(), []);

  // fetch data from provided API endpoints
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching data from API...');
      
      const [profilesResponse, preferencesResponse] = await Promise.all([
        axios.get('/api/profiles'),
        axios.get('/api/shift-preferences')
      ]);

      console.log('Profiles API Response:', profilesResponse.data);
      console.log('Shift Preferences API Response:', preferencesResponse.data);

      setProfiles(profilesResponse.data);
      setShiftPreferences(preferencesResponse.data);

      // Initialize schedule from preferences
      const initialScheduleData = preferencesResponse.data.map(pref => ({
        staffId: pref.profile_id,
        date: pref.date
      }));
      
      console.log('Initial Schedule:', initialScheduleData);
      console.log('Schedule dates:', scheduleDates.map(d => formatDateForAPI(d)));
      setInitialSchedule(initialScheduleData);
      
      // Always set initial schedule for revert functionality
      setInitialSchedule(initialScheduleData);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleDates]);

  // fetch data when component mounts (after every page refresh)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set initial schedule when data is loaded and no persisted autobalanced state exists
  useEffect(() => {
    if (initialSchedule.length > 0 && !hasAutobalanced && schedule.length === 0) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule, hasAutobalanced, schedule.length]);

  // autobalance schedule and update UI data
  const handleAutobalance = async () => {
    setIsAutobalancing(true);
    try {
      const result = autobalanceSchedule(schedule, shiftPreferences, scheduleDates);
      const newSchedule = result.schedule;
      const newTotalSwaps = result.swaps;
      const newHasAutobalanced = true;
      
      setSchedule(newSchedule);
      setTotalSwaps(newTotalSwaps);
      setHasAutobalanced(newHasAutobalanced);
      
      // Save to localStorage
      saveStateToStorage(newSchedule, newHasAutobalanced, newTotalSwaps);
    } catch (err) {
      setError('Failed to autobalance schedule');
      console.error('Error autobalancing:', err);
    } finally {
      setIsAutobalancing(false);
    }
  };

  // revert schedule to initial schedule
  const handleRevert = () => {
    setSchedule(initialSchedule);
    setTotalSwaps(0);
    setHasAutobalanced(false);
    
    // Save to localStorage
    saveStateToStorage(initialSchedule, false, 0);
  };

  const getStaffShifts = (staffId) => {
    return schedule.filter(shift => shift.staffId === staffId);
  };

  const getStaffPreferences = (staffId) => {
    return shiftPreferences.filter(pref => pref.profile_id === staffId);
  };

  const hasShiftOnDate = (staffId, date) => {
    const result = schedule.some(shift => 
      shift.staffId === staffId && isSameDate(new Date(shift.date), date)
    );
    return result;
  };

  const getDayStaffCount = (date) => {
    const count = schedule.filter(shift => isSameDate(new Date(shift.date), date)).length;
    return count;
  };

  const handleNurseClick = (nurse) => {
    setSelectedNurse(nurse);
  };

  const handleBackToSchedule = () => {
    setSelectedNurse(null);
  };

  if (loading) {
    return <div className="loading">Loading schedule data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Show nurse details if a nurse is selected
  if (selectedNurse) {
    return (
      <NurseDetails
        nurse={selectedNurse}
        schedule={schedule}
        shiftPreferences={shiftPreferences}
        scheduleDates={scheduleDates}
        onBack={handleBackToSchedule}
      />
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Nurse Scheduler</h1>
        <p>Schedule Period: {formatDateRange(SCHEDULE_START_DATE, SCHEDULE_END_DATE)} (21 days)</p>
      </div>

      <div className="controls">
        {!hasAutobalanced ? (
          <button 
            className="autobalance-btn"
            onClick={handleAutobalance}
            disabled={isAutobalancing}
          >
            {isAutobalancing ? 'Autobalancing...' : 'Autobalance Schedule'}
          </button>
        ) : (
          <button 
            className="revert-btn"
            onClick={handleRevert}
          >
            Revert Schedule
          </button>
        )}
        {totalSwaps > 0 && (
          <div className="swaps-info">
            <span className="swaps-label">Total Swaps:</span>
            <span className="swaps-count">{totalSwaps}</span>
            <span className="swaps-label" style={{ marginLeft: '20px' }}>Avg Fairness:</span>
            <span className="swaps-count">
              {Math.round(
                profiles.reduce((sum, profile) => {
                  const staffShifts = getStaffShifts(profile.id);
                  const staffPreferences = getStaffPreferences(profile.id);
                  const fairness = calculateFairness(staffPreferences, staffShifts.map(s => s.date));
                  return sum + fairness;
                }, 0) / profiles.length
              )}%
            </span>
          </div>
        )}
      </div>

      <div className="schedule-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Nurse</th>
              {scheduleDates.map((date, index) => (
                <th 
                  key={index}
                  className={(index + 1) % 7 === 0 ? 'week-separator' : ''}
                >
                  <div className="date-day">
                    {getDayOfWeek(date)}
                  </div>
                  <div className="date-number">
                    {formatDate(date)}
                  </div>
                  <div className="date-staff-count">
                    {getDayStaffCount(date)} nurses
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const staffShifts = getStaffShifts(profile.id);
              const staffPreferences = getStaffPreferences(profile.id);
              const fairness = calculateFairness(staffPreferences, staffShifts.map(s => s.date));
              

              
              return (
                <tr key={profile.id} className="staff-row">
                  <td className="staff-name">
                    <div 
                      className="nurse-name-clickable"
                      onClick={() => handleNurseClick(profile)}
                      style={{ cursor: 'pointer' }}
                    >
                      {profile.full_name}
                    </div>
                    <div className="fairness-score">Fairness Score: {fairness}%</div>
                  </td>
                  {scheduleDates.map((date, index) => (
                    <td 
                      key={index}
                      className={(index + 1) % 7 === 0 ? 'week-separator-data' : ''}
                    >
                      {hasShiftOnDate(profile.id, date) && (
                        <div className="shift-cell">✓</div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App; 