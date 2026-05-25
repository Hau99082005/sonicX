# Debug Session: invalid-hook-call

## 📝 Status: [OPEN]

## 🎯 Symptoms
- **Actual**: "Invalid hook call" error on app startup or during navigation. Error stack points to `useFrameSize` in `@react-navigation/elements`.
- **Expected**: App starts normally without render errors.

## 🔍 Hypotheses
1. **[H1] Context Mismatch**: `usePlayer` is called outside `PlayerProvider` due to navigation nesting.
2. **[H2] Nested Definition**: A component is defined inside another's render function (e.g., in `BottomTabNavigator`).
3. **[H3] Multiple React Instances**: Incompatible dependency versions or multiple `react` bundles.
4. **[H4] enableScreens Conflict**: `react-native-screens` initialization issue causing render errors in native stack.

## 🛠️ Evidence Collection Plan
1. Start Debug Server to collect runtime logs.
2. Instrument `App.tsx` to trace Provider nesting.
3. Instrument `PlayerContext.tsx` to check if context is available.
4. Instrument `BottomTabNavigator.tsx` to trace `CustomTabBar` render and hook calls.

## 📓 Progress Log
- [2026-05-25] Initialized debugging session.
- [2026-05-25] Starting Debug Server...
