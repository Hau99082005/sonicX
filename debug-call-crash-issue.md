# Debugging Session: call-crash-issue

- **Status**: [OPEN]
- **Session ID**: call-crash-issue
- **Symptoms**: App crashes immediately when initiating or receiving a voice/video call.
- **Hypotheses**:
    1. Memory leak or resource conflict in `react-native-video` component when unmounting/mounting rapidly.
    2. Socket signaling timing issue leading to navigation before state is ready.
    3. Null reference in `VideoCallScreen` or `VoiceCallScreen` (e.g., `device` or `otherMember` undefined).
    4. Permission race condition on Android (Camera/Microphone).
- **Evidence**: Pending...
- **Fix**: Pending...
