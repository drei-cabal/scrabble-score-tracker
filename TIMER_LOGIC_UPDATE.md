# Timer Start Logic Update

**Date**: February 5, 2026
**Status**: ✅ Complete

## 🎯 Goal
Ensure the turn timer does **not** start automatically in **Single-Device Mode** until the player clicks "Ready!".

## 🔧 Changes Implemented

### 1. API Endpoints Logic Modified
Updated the following endpoints to check `game_mode` before setting `turn_started_at`:

*   `/api/rooms/start` (Game Start)
*   `/api/moves/submit` (Word Submission)
*   `/api/moves/skip` (Skip Turn)
*   `/api/moves/swap` (Swap Tiles)

**New Logic:**
```typescript
if (room.turn_timer_enabled) {
    if (room.game_mode === 'single-device') {
        // Pause timer (set to null) until player clicks "Ready!"
        updateData.turn_started_at = null
    } else {
        // Start timer immediately for multi-device
        updateData.turn_started_at = new Date().toISOString()
    }
}
```

### 2. Frontend Behavior Verification
*   **TurnTimer Component**: Already handles `null` value by displaying the full duration (e.g., "1:00") and NOT counting down.
*   **PassDeviceOverlay**: Already waiting for "Ready!" click.
*   **Ready Button**: Calls `/api/rooms/reset-timer`, which sets `turn_started_at` to the current time, effectively starting the countdown.

## 🔄 User Flow (Single-Device Mode)

1.  **Turn Ends** (Submit/Skip/Swap) -> API sets `turn_started_at = null`.
2.  **UI Updates** -> Timer shows full time, paused.
3.  **Overlay Appears** -> "Pass Device To [Next Player]".
4.  **Player Clicks "Ready!"** -> Calls `reset-timer`.
5.  **Timer Starts** -> `turn_started_at` updated to now. Countdown begins.

This ensures players have infinite time to pass the device without losing game time.
