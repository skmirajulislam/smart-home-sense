

# XIOT — Cognitive IoT Smart Home Dashboard

## Overview
A production-grade React dashboard that visualizes real-time IoT sensor data across multiple rooms, with an AI explainability engine that provides contextual reasoning about environmental changes.

## Pages & Layout

### App Shell
- **Sidebar** (collapsible): Room list with add/remove, global dashboard link, alerts summary badge
- **Main content area**: Selected room or global dashboard
- **Right panel** (slide-out): AI Insights panel for selected room

### 1. Global Dashboard (`/`)
- Overview grid of all rooms as cards showing aggregated sensor status
- Global alert feed (recent alerts across all rooms)
- System health summary (total rooms, active sensors, active alerts)

### 2. Room Detail View (`/room/:id`)
- 6 sensor cards in a responsive grid: Temperature, Humidity, Air Quality, Motion, Light, Door Status
- Each card shows: current value, unit, trend arrow (↑↓→), threshold status badge (safe/warning/critical), mini sparkline chart (last 10 data points)
- Color-coded borders: green/yellow/red based on thresholds
- AI Explanation panel (right side or below on mobile)
- Room analytics section with historical charts

## Key Features

### Sensor System
- Simulated real-time data via `setInterval` (every 2-3 seconds) mimicking WebSocket updates
- Zustand store for global sensor state with per-room data
- Threshold configuration per sensor type for color coding

### AI Explainability Engine (Frontend Simulation)
- Rule-based reasoning engine that combines multiple sensor values
- Structured output per room: **Event** → **Reasoning** → **Impact** → **Suggested Action**
- Examples:
  - High temp + high humidity + no motion → "Closed hot environment detected. Ventilation recommended."
  - Poor air quality + door closed → "Stale air accumulating. Open windows or activate purifier."
- Displayed in a clean card format with icons for each section
- Sensor contribution badges showing which sensors triggered the insight

### Alerts & Notifications
- Toast notifications (sonner) for new critical alerts
- Alert history panel accessible from sidebar
- Timeline view with severity, room, timestamp, and description

### Room Management
- Add room via modal (name, icon selection)
- Remove/rename rooms
- Each room starts with default sensor set
- State persisted in Zustand (localStorage persistence)

### Data Visualization (Recharts)
- Per-sensor sparklines on cards
- Room analytics page: line charts for historical trends, multi-sensor overlay
- Anomaly spike highlighting on charts

### Animations
- Framer Motion for: card entry/exit, panel slides, alert toasts, value change transitions

## Component Architecture
```
src/
  components/
    layout/        — AppSidebar, AppLayout, RightPanel
    dashboard/     — RoomCard, SensorCard, SystemHealth
    sensors/       — SensorSparkline, SensorBadge, TrendIndicator
    insights/      — InsightPanel, InsightCard, SensorContribution
    alerts/        — AlertPanel, AlertTimeline, AlertToast
    rooms/         — AddRoomModal, RoomSettings
    charts/        — HistoricalChart, MultiSensorChart
  pages/
    Dashboard.tsx, RoomDetail.tsx
  store/
    useSensorStore.ts, useRoomStore.ts, useAlertStore.ts
  services/
    sensorSimulator.ts, aiEngine.ts, thresholds.ts
  types/
    sensor.ts, room.ts, alert.ts, insight.ts
```

## State Management (Zustand)
- `useRoomStore`: rooms CRUD, active room, localStorage persistence
- `useSensorStore`: real-time sensor values per room, history buffer
- `useAlertStore`: alert list, unread count, dismiss actions

## Design
- Dark-themed dashboard with ShadCN components
- Color system: emerald (safe), amber (warning), rose (critical)
- Card-based layout, responsive grid (3 cols → 2 → 1 on mobile)
- Monospace values for sensor readings, clean typography

## Mock Data & Simulation
- Sensor simulator generates realistic fluctuating values with occasional anomaly spikes
- AI engine runs on each data update cycle, evaluating cross-sensor rules
- 3 pre-configured rooms (Living Room, Bedroom, Kitchen) with active data on load

