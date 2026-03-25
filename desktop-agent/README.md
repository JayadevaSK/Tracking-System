# Work Tracker Desktop Agent

A lightweight background agent that tracks which apps and windows are active on the employee's Windows laptop and reports to the Work Tracker backend.

## What it tracks

- Active window title (e.g. "Q3 Report.xlsx - Microsoft Excel")
- App name (e.g. "excel", "chrome", "code")
- Category (automatically classified: Browser, IDE, Office, Communication, etc.)
- Time spent in each window
- Idle detection (5 min of no window change = idle)

## Setup (per employee machine)

### Requirements
- Windows 10/11
- Node.js v18+ (https://nodejs.org)
- PowerShell (built into Windows — no extra install needed)

### 1. Install and build the agent
```cmd
cd desktop-agent
npm install
npm run build
```

### 2. Run the agent
```cmd
node dist/index.js
```

On first run it will ask for your username and password. Credentials are saved locally in `%APPDATA%\work-tracker-agent\config.json`.

### 4. To run automatically on Windows startup
Create a shortcut to `start-agent.bat` and place it in:
`C:\Users\<username>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

**start-agent.bat:**
```bat
@echo off
cd /d "C:\path\to\your\project\desktop-agent"
node dist/index.js
```

### 5. To log out / switch user
```cmd
node dist/index.js --logout
```

## Viewing activity

Managers can see the full activity timeline in the Manager Dashboard → click any employee → "🕐 Activity" tab.

The timeline shows:
- Every app/window the employee had open
- Time spent in each
- Idle periods
- Category breakdown (Browser, Office, Communication, etc.)
