# Centralized Audio System

This document describes the centralized, persistent audio management system implemented in the World Bingo app.

## Overview

The audio system provides:
- **Persistent audio state** - Music preference is saved and restored across app restarts
- **Automatic background music** - Starts automatically on app launch if enabled
- **Universal click sounds** - All touchable components automatically play click sounds
- **Centralized management** - Single point of control for all audio functionality

## Architecture

### Core Components

1. **AudioService** (`src/services/audioService.ts`)
   - Singleton service managing all audio functionality
   - Handles background music lifecycle
   - Provides centralized click sound method
   - Manages persistent state via SettingsStore

2. **Enhanced UI Components**
   - `Button` component - Automatically plays click sounds
   - `TouchableWithSound` - Enhanced TouchableOpacity with click sounds
   - `TouchableWrapper` - Global replacements for TouchableOpacity/Pressable

3. **Persistent Storage**
   - Uses Zustand persist middleware
   - Stores `isMusicEnabled` boolean in AsyncStorage
   - Default state: `true` (music enabled)

### Initialization Flow

1. App starts (`App.tsx`)
2. `audioService.initialize()` called during app startup
3. Reads persistent `isMusicEnabled` state from storage
4. Automatically starts background music if enabled
5. Subscribes to state changes for real-time updates

### State Management

```typescript
// Get current state
const isEnabled = audioService.isMusicEnabled();

// Toggle music (persists automatically)
audioService.toggleMusic();

// Force enable/disable
audioService.enableMusic();
audioService.disableMusic();

// Play click sound (respects music state)
audioService.playClickSound();
```

## Usage

### For Developers

**Using Enhanced Components:**
```tsx
import { TouchableWithSound } from '../components/ui/TouchableWithSound';
import { Button } from '../components/ui/Button';

// Both automatically include click sounds
<TouchableWithSound onPress={handlePress}>
  <Text>Click me</Text>
</TouchableWithSound>

<Button title="Save" onPress={handleSave} />
```

**Manual Click Sounds:**
```tsx
import { audioService } from '../services/audioService';

const handleCustomAction = () => {
  audioService.playClickSound(); // Respects user preference
  // Your action logic here
};
```

**Music Control:**
```tsx
import { audioService } from '../services/audioService';

const MusicToggle = () => {
  const toggleMusic = () => {
    audioService.toggleMusic(); // Persists automatically
  };
  
  return (
    <TouchableOpacity onPress={toggleMusic}>
      {audioService.isMusicEnabled() ? <VolumeUp /> : <VolumeOff />}
    </TouchableOpacity>
  );
};
```

### For Users

- **Background Music**: Starts automatically when app opens (if not muted)
- **Persistent Settings**: Music preference is remembered between app sessions
- **Universal Mute**: Volume button controls all audio (music + click sounds)
- **Default State**: Audio is enabled by default for new installations

## Audio Files

- **Background Music**: `baground.mp3` (loops continuously)
- **Click Sound**: `computer_mouse_click_02_383961.mp3` (short click effect)

## Technical Details

### Persistence Implementation
- Uses Zustand's `persist` middleware
- Stores in React Native's AsyncStorage
- Automatic serialization/deserialization
- No manual storage management needed

### Performance Considerations
- Audio service is a singleton (single instance)
- Background music only loads once
- Click sounds use cached audio manager
- Minimal memory footprint

### Platform Compatibility
- iOS: Uses bundle resources (.mp3 files)
- Android: Uses raw resources (renamed for Android compatibility)
- Cross-platform audio file access

## Migration Notes

### From Previous System
- Old `audioManager.playButtonClick()` → `audioService.playClickSound()`
- Manual music state management → Automatic persistence
- Component-level music checks → Centralized handling

### Breaking Changes
- Components no longer need to check `isMusicEnabled` manually
- Music toggle now handled by audioService instead of direct state manipulation
- Background music lifecycle managed automatically

## Troubleshooting

### Common Issues

1. **Music doesn't start automatically**
   - Check if `audioService.initialize()` is called in App.tsx
   - Verify `isMusicEnabled` state in SettingsStore

2. **Click sounds not working**
   - Ensure components use enhanced versions (TouchableWithSound, Button)
   - Check if music is enabled (click sounds respect global mute)

3. **State not persisting**
   - Verify AsyncStorage permissions
   - Check Zustand persist configuration in SettingsStore

### Debug Commands
```typescript
// Check current state
console.log('Music enabled:', audioService.isMusicEnabled());

// Force initialization
audioService.initialize();

// Test click sound
audioService.playClickSound();
```

## Future Enhancements

- Volume level controls (currently binary on/off)
- Different sound themes
- Audio compression for smaller app size
- Haptic feedback integration
- Accessibility improvements (audio descriptions)