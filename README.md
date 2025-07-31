# Nurse Scheduler

A nurse scheduling app with an autobalance feature that balances shifts among nurses according to specific constraints.

## Features

- **3-Week Schedule Display**: Shows a 21-day schedule from September 17, 2023 to October 7, 2023
- **Nurse Management**: Displays 8 nurse profiles with their shift assignments
- **Fairness Scoring**: Shows fairness percentage for each nurse based on honored preferences
- **Autobalance Feature**: Automatically balances shifts according to the following constraints:
  1. Each day has 3-5 staff working
  2. Each staff works 3-5 shifts in rolling 7-day windows
  3. No more than 3 consecutive shifts

## Local Setup

1. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

2. **Start the Application**:
   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and the React frontend (port 3002).

## Project Structure

```
nurse_scheduler/
├── server/
│   └── index.js          # Express server with API endpoints
├── client/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── utils/
│   │   │   ├── dateUtils.js      # Date handling utilities
│   │   │   └── autobalance.js    # Autobalance algorithm
│   │   └── index.js      # React entry point
│   └── public/
│       └── index.html    # HTML template
├── config.js             # Configuration (API keys, etc.)
└── package.json          # Main package.json
```

## API Endpoints

The server provides two endpoints that proxy to the Supabase API:
- `GET /api/profiles` - Retrieves all nurse profiles
- `GET /api/shift-preferences` - Retrieves all shift preferences

## Usage

1. The application loads with the initial schedule based on the nurses preferences
2. All staff start with 100% fairness as preferences are honored
3. Click "Autobalance Schedule" to automatically balance shifts according to constraints
4. The schedule updates and fairness scores recalculate based on the new assignments
5. Click "Revert Schedule" to revert the schedule back to the initial preferences
6. Click any nurses name in the table to see more details about their schedule and preferences

## Autobalance Implementation

The autobalance algorithm implements the following constraints in order of priority:

1. **Daily Staffing**: Each day must have 3-5 staff working
2. **Weekly Limits**: Each staff must work 3-5 shifts in any rolling 7-day window
3. **Consecutive Limits**: No staff can work more than 3 consecutive shifts

The algorithm uses minimal shift swaps to maintain high fairness scores while meeting all constraints. 

## Future Improvements

* Allow user to manually drag and drop shifts in the schedule table (And update fairness/constraint checking properly)
* Allow user to manually remove shifts from the schedule table
* Polish the UI (looks okay but not great)
