import { formatDateForAPI } from './dateUtils';

// Calculate fairness score for a staff member
export const calculateFairness = (staffPreferences, currentShifts) => {
  if (staffPreferences.length === 0) return 100;
  
  const honoredPreferences = staffPreferences.filter(pref => 
    currentShifts.some(shift => shift === pref.date)
  );
  
  // Fairness = honored preferences / total assignments
  const totalAssignments = currentShifts.length;
  const honoredCount = honoredPreferences.length;
  
  return totalAssignments > 0 ? Math.round((honoredCount / totalAssignments) * 100) : 100;
};

// Check if a day has valid number of staff (3-5)
export const isValidDayStaffing = (dayShifts) => {
  return dayShifts.length >= 3 && dayShifts.length <= 5;
};

// Check if staff has valid shifts in rolling 7-day window
export const isValidWeeklyShifts = (staffShifts, date, allDates) => {
  const dateIndex = allDates.findIndex(d => formatDateForAPI(d) === formatDateForAPI(date));
  const weekStart = Math.max(0, dateIndex - 6);
  const weekEnd = Math.min(allDates.length - 1, dateIndex);
  
  const weekShifts = staffShifts.filter(shift => {
    const shiftIndex = allDates.findIndex(d => formatDateForAPI(d) === shift);
    return shiftIndex >= weekStart && shiftIndex <= weekEnd;
  });
  
  return weekShifts.length >= 3 && weekShifts.length <= 5;
};

// Check if staff has no more than 3 consecutive shifts
export const isValidConsecutiveShifts = (staffShifts, date, allDates) => {
  // Check if adding this shift would create more than 3 consecutive
  const testShifts = [...staffShifts, formatDateForAPI(date)].sort();
  
  let consecutiveCount = 1;
  for (let i = 1; i < testShifts.length; i++) {
    const prevIndex = allDates.findIndex(d => formatDateForAPI(d) === testShifts[i - 1]);
    const currIndex = allDates.findIndex(d => formatDateForAPI(d) === testShifts[i]);
    
    if (currIndex === prevIndex + 1) {
      consecutiveCount++;
      if (consecutiveCount > 3) return false;
    } else {
      consecutiveCount = 1;
    }
  }
  
  return true;
};

// Main autobalance function with minimal shift swaps
export const autobalanceSchedule = (schedule, staffPreferences, allDates) => {
  console.log('Autobalancing schedule with minimal swaps...');
  
  // Start with the current schedule
  let newSchedule = JSON.parse(JSON.stringify(schedule));
  let swaps = 0;
  const maxSwaps = 50; // Limit total swaps to maintain fairness
  
  // Get all staff IDs
  const allStaffIds = [...new Set(schedule.map(s => s.staffId))];
  
  // Priority 1: Fix daily staffing violations (3-5 staff per day) - iterate until all days are valid
  let dailyViolationsFixed = false;
  let iterationCount = 0;
  const maxIterations = 10; // Prevent infinite loops
  
  while (!dailyViolationsFixed && swaps < maxSwaps && iterationCount < maxIterations) {
    dailyViolationsFixed = true;
    iterationCount++;
    
    for (let dayIndex = 0; dayIndex < allDates.length && swaps < maxSwaps; dayIndex++) {
      const currentDate = allDates[dayIndex];
      const dayShifts = newSchedule.filter(shift => 
        formatDateForAPI(shift.date) === formatDateForAPI(currentDate)
      );
      
      if (dayShifts.length < 3) {
        // Need to add staff - find best candidate
        const bestCandidate = findBestStaffToAdd(newSchedule, currentDate, allDates, allStaffIds);
        if (bestCandidate) {
          newSchedule.push({
            staffId: bestCandidate,
            date: formatDateForAPI(currentDate)
          });
          swaps++;
          dailyViolationsFixed = false; // Need to check again
        } else {
          console.warn(`Could not find staff to add for ${formatDateForAPI(currentDate)}`);
        }
      } else if (dayShifts.length > 5) {
        // Need to remove staff - find best candidate to remove
        const bestToRemove = findBestStaffToRemove(newSchedule, currentDate, allDates, dayShifts);
        if (bestToRemove) {
          const index = newSchedule.findIndex(shift => 
            shift.staffId === bestToRemove && 
            formatDateForAPI(shift.date) === formatDateForAPI(currentDate)
          );
          if (index !== -1) {
            newSchedule.splice(index, 1);
            swaps++;
            dailyViolationsFixed = false; // Need to check again
          }
        }
      }
    }
  }
  
  // Priority 2: Fix weekly shift violations (3-5 shifts per rolling week)
  for (let dayIndex = 0; dayIndex < allDates.length && swaps < maxSwaps; dayIndex++) {
    const weekStart = Math.max(0, dayIndex - 6);
    const weekEnd = Math.min(allDates.length - 1, dayIndex);
    
    for (const staffId of allStaffIds) {
      const staffShifts = newSchedule.filter(s => s.staffId === staffId);
      const weekShifts = staffShifts.filter(shift => {
        const shiftIndex = allDates.findIndex(d => formatDateForAPI(d) === shift.date);
        return shiftIndex >= weekStart && shiftIndex <= weekEnd;
      });
      
      if (weekShifts.length < 3) {
        // Need to add a shift in this week
        const bestDate = findBestDateToAddShift(newSchedule, staffId, weekStart, weekEnd, allDates);
        if (bestDate) {
          newSchedule.push({
            staffId: staffId,
            date: formatDateForAPI(bestDate)
          });
          swaps++;
        }
      } else if (weekShifts.length > 5) {
        // Need to remove a shift from this week
        const bestShiftToRemove = findBestShiftToRemove(newSchedule, staffId, weekShifts);
        if (bestShiftToRemove) {
          const index = newSchedule.findIndex(shift => 
            shift.staffId === staffId && shift.date === bestShiftToRemove.date
          );
          if (index !== -1) {
            newSchedule.splice(index, 1);
            swaps++;
          }
        }
      }
    }
  }
  
  // Priority 3: Fix consecutive shift violations (max 3 consecutive)
  for (let dayIndex = 0; dayIndex < allDates.length && swaps < maxSwaps; dayIndex++) {
    const currentDate = allDates[dayIndex];
    
    for (const staffId of allStaffIds) {
      const staffShifts = newSchedule.filter(s => s.staffId === staffId);
      
      if (!isValidConsecutiveShifts(staffShifts.map(s => s.date), currentDate, allDates)) {
        // Need to fix consecutive shifts
        const fixed = fixConsecutiveShifts(newSchedule, staffId, currentDate, allDates);
        if (fixed) {
          swaps++;
        }
      }
    }
  }
  
  // Debug: Check final daily staffing
  console.log('Final daily staffing check:');
  for (let dayIndex = 0; dayIndex < allDates.length; dayIndex++) {
    const currentDate = allDates[dayIndex];
    const dayShifts = newSchedule.filter(shift => 
      formatDateForAPI(shift.date) === formatDateForAPI(currentDate)
    );
    console.log(`${formatDateForAPI(currentDate)}: ${dayShifts.length} nurses`);
  }
  
  console.log(`Autobalance complete with ${swaps} swaps`);
  console.log('Final schedule length:', newSchedule.length);
  return { schedule: newSchedule, swaps };
};

// Helper function to find best staff to add to a day
function findBestStaffToAdd(schedule, date, allDates, allStaffIds) {
  const dayShifts = schedule.filter(shift => 
    formatDateForAPI(shift.date) === formatDateForAPI(date)
  );
  const assignedStaff = dayShifts.map(s => s.staffId);
  
  // First, try to find staff that meets all constraints
  for (const staffId of allStaffIds) {
    if (!assignedStaff.includes(staffId)) {
      const staffShifts = schedule.filter(s => s.staffId === staffId);
      if (isValidWeeklyShifts(staffShifts.map(s => s.date), date, allDates) &&
          isValidConsecutiveShifts(staffShifts.map(s => s.date), date, allDates)) {
        return staffId;
      }
    }
  }
  
  // If no perfect candidate, find any staff that doesn't already have a shift on this day
  // This ensures we meet the critical daily staffing requirement
  for (const staffId of allStaffIds) {
    if (!assignedStaff.includes(staffId)) {
      return staffId;
    }
  }
  
  return null;
}

// Helper function to find best staff to remove from a day
function findBestStaffToRemove(schedule, date, allDates, dayShifts) {
  // Prefer to remove staff who have more shifts overall
  const staffShiftCounts = dayShifts.map(shift => ({
    staffId: shift.staffId,
    totalShifts: schedule.filter(s => s.staffId === shift.staffId).length
  }));
  
  staffShiftCounts.sort((a, b) => b.totalShifts - a.totalShifts);
  return staffShiftCounts[0]?.staffId || null;
}

// Helper function to find best date to add a shift
function findBestDateToAddShift(schedule, staffId, weekStart, weekEnd, allDates) {
  for (let i = weekStart; i <= weekEnd; i++) {
    const date = allDates[i];
    const dayShifts = schedule.filter(shift => 
      formatDateForAPI(shift.date) === formatDateForAPI(date)
    );
    
    // Check if staff already has a shift on this date
    const staffAlreadyHasShift = schedule.some(shift => 
      shift.staffId === staffId && 
      formatDateForAPI(shift.date) === formatDateForAPI(date)
    );
    
    if (dayShifts.length < 5 && !staffAlreadyHasShift) { // Don't exceed max daily staff and don't duplicate
      const staffShifts = schedule.filter(s => s.staffId === staffId);
      if (isValidConsecutiveShifts(staffShifts.map(s => s.date), date, allDates)) {
        return date;
      }
    }
  }
  return null;
}

// Helper function to find best shift to remove
function findBestShiftToRemove(schedule, staffId, weekShifts) {
  // Prefer to remove shifts from days with more staff
  const shiftsWithDayCounts = weekShifts.map(shift => ({
    shift,
    dayStaffCount: schedule.filter(s => 
      formatDateForAPI(s.date) === shift.date
    ).length
  }));
  
  shiftsWithDayCounts.sort((a, b) => b.dayStaffCount - a.dayStaffCount);
  return shiftsWithDayCounts[0]?.shift || null;
}

// Helper function to fix consecutive shifts
function fixConsecutiveShifts(schedule, staffId, date, allDates) {
  const staffShifts = schedule.filter(s => s.staffId === staffId);
  const testShifts = [...staffShifts, { staffId, date: formatDateForAPI(date) }];
  
  // Find the problematic consecutive sequence
  const sortedShifts = testShifts.map(s => s.date).sort();
  let consecutiveCount = 1;
  let maxConsecutive = 1;
  
  for (let i = 1; i < sortedShifts.length; i++) {
    const prevIndex = allDates.findIndex(d => formatDateForAPI(d) === sortedShifts[i - 1]);
    const currIndex = allDates.findIndex(d => formatDateForAPI(d) === sortedShifts[i]);
    
    if (currIndex === prevIndex + 1) {
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 1;
    }
  }
  
  if (maxConsecutive > 3) {
    // Remove the middle shift from the longest consecutive sequence
    // This is a simplified approach - in practice you'd want more sophisticated logic
    const index = schedule.findIndex(shift => 
      shift.staffId === staffId && 
      formatDateForAPI(shift.date) === formatDateForAPI(date)
    );
    if (index !== -1) {
      schedule.splice(index, 1);
      return true;
    }
  }
  
  return false;
} 