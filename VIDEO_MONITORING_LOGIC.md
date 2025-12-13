# Video Monitoring Logic Flow

## Overview
The video player tracks watch time and enforces time limits for students while allowing unlimited playback for teachers/admins.

## Key Components

### 1. State Variables
- `playState.totalWatchTimeSeconds`: Total time the student has watched (cumulative)
- `isPlaying`: Whether video is currently playing
- `isLocked`: Permanent lock state when limit reached
- `canPlay`: Calculated boolean - can the user play the video?
- `watchTimeRemaining`: How much watch time left
- `maxWatchTimeSeconds`: Maximum allowed watch time (videoDuration × multiplier)

### 2. Logic Flow

#### On Component Mount:
1. Load initial `playState` from database (shows previous watch time)
2. Calculate `maxWatchTimeSeconds` = videoDuration × maxWatchTimeMultiplier (e.g., 10s × 2 = 20s allowed)
3. Calculate `watchTimeRemaining` = maxWatchTimeSeconds - totalWatchTimeSeconds
4. Set `canPlay` = !isLocked && watchTimeRemaining > 0

#### When Student Presses Play:
1. Video `play` event fires
2. `handlePlay()` checks if `canPlay` is true
   - If false: immediately pause and prevent playback
   - If true: allow play, set `isPlaying = true`
3. `isPlaying` change triggers tracking interval (runs every 1 second)
4. Tracking interval:
   - Calculates elapsed time since last update
   - Adds elapsed time to `playState.totalWatchTimeSeconds`
   - Updates local state immediately (for UI responsiveness)
   - Every 5 seconds: saves progress to API
   - Checks if new total >= maxWatchTimeSeconds
     - If yes: pause video and set `isLocked = true`

#### When Watch Time Limit Reached:
1. `watchTimeRemaining` becomes 0 or negative
2. `useEffect` watching `watchTimeRemaining` triggers
3. Sets `isLocked = true` (permanent lock)
4. Pauses video if still playing
5. Component renders "Watch Time Limit Reached" screen
6. Video element gets `pointerEvents: 'none'` (disables all interaction)
7. All play attempts are blocked by `handlePlay()` checking `canPlay`

#### When Student Tries to Seek/Play After Limit:
1. Video element has `pointerEvents: 'none'` - clicks don't register
2. If somehow a play event fires (programmatically), `handlePlay()` catches it
3. Checks `canPlay` which is false (because `isLocked = true`)
4. Immediately pauses video
5. Video cannot play - limit enforced

### 3. Time Synchronization

All three timers (Current Position, Total Watch Time, Time Remaining) update together:

1. **Current Position**: Updates via video's `timeupdate` event (~4 times per second)
2. **Total Watch Time**: Updates in tracking interval (every 1 second when playing)
3. **Time Remaining**: Calculated from Total Watch Time (maxWatchTimeSeconds - totalWatchTimeSeconds)

They start at the same moment:
- `isPlaying` changes to true
- Tracking interval starts immediately with `lastUpdateTime.current = Date.now()`
- Next interval tick (1 second later) adds 1 second to total watch time
- Video's timeupdate continues updating current position
- Time remaining decreases as total watch time increases

### 4. Why the Bypass Was Happening

**Previous Issue**: 
- `canPlay` was recalculated every render based on `playState`
- When user seeked backward, video element allowed play briefly before React could update state
- No permanent lock state - `canPlay` could flip back to true if state wasn't updated yet

**Current Fix**:
- Added `isLocked` state - once set to true, it stays true (permanent)
- `canPlay = !isLocked && ...` - locked state takes priority
- Video element gets `pointerEvents: 'none'` - all mouse interactions disabled
- Multiple layers of protection:
  1. UI prevention (`pointerEvents: 'none'`)
  2. Event handler prevention (`handlePlay` checks `canPlay`)
  3. Tracking prevention (stops updating when `!canPlay`)

## Testing the Reset Button

The reset button on the limit screen:
- Only shows for students (not teachers/admins)
- Calls `/api/video/progress/reset` with videoId and userId
- Resets `totalWatchTimeSeconds` to 0 in database
- Reloads page to get fresh state
- Video becomes playable again (for development/testing)
