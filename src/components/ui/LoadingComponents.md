# Loading Components Documentation

This document describes the various loading components available in the application, all using the Loading.json Lottie animation.

## Components Overview

### 1. LoadingOverlay (Updated)
**Location**: `src/components/ui/LoadingOverlay.tsx`
**Purpose**: Full-screen loading overlay with Lottie animation
**Usage**: Authentication screens, general loading states

```tsx
import { LoadingOverlay } from '../components/ui/LoadingOverlay';

<LoadingOverlay 
  visible={isLoading} 
  message="Signing in..." 
  useLottie={true} // Default: true
/>
```

### 2. LoadingSpinner (Updated)
**Location**: `src/components/ui/LoadingSpinner.tsx`
**Purpose**: Inline loading spinner with Lottie animation
**Usage**: Report screens, inline loading states

```tsx
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

<LoadingSpinner 
  size="large" 
  text="Generating Report, Please Wait..."
  useLottie={true} // Default: true
/>
```

### 3. LoadingAnimation
**Location**: `src/components/ui/LoadingAnimation.tsx`
**Purpose**: Flexible loading animation component
**Usage**: Custom loading scenarios

```tsx
import { LoadingAnimation } from '../components/ui/LoadingAnimation';

<LoadingAnimation 
  visible={isLoading}
  message="Loading..."
  size="medium" // 'small' | 'medium' | 'large'
  overlay={true} // Default: true
  backgroundColor="rgba(0, 0, 0, 0.7)"
  textColor="#FFFFFF"
/>
```

### 4. UnifiedLoadingOverlay
**Location**: `src/components/ui/UnifiedLoadingOverlay.tsx`
**Purpose**: Unified loading component with multiple animation types
**Usage**: Different loading scenarios with different animations

```tsx
import { UnifiedLoadingOverlay } from '../components/ui/UnifiedLoadingOverlay';

<UnifiedLoadingOverlay 
  visible={isLoading}
  message="Loading..."
  animationType="loading" // 'loading' | 'confetti'
  size="medium"
  overlay={true}
/>
```

### 5. GameLoadingOverlay
**Location**: `src/components/ui/GameLoadingOverlay.tsx`
**Purpose**: Game-specific loading states with appropriate animations
**Usage**: Game start, game end, and game-related loading

```tsx
import { GameLoadingOverlay } from '../components/ui/GameLoadingOverlay';

// Game start
<GameLoadingOverlay 
  visible={isStartingGame}
  message="Starting Game..."
  type="game_start"
  size="large"
/>

// Game end
<GameLoadingOverlay 
  visible={isEndingGame}
  message="Ending Game..."
  type="game_end"
  size="large"
/>

// Confetti celebration
<GameLoadingOverlay 
  visible={showConfetti}
  message="Congratulations!"
  type="confetti"
  size="large"
/>
```

## Animation Types

### Loading.json
- **Usage**: General loading states
- **Animation**: Pulsing circles
- **Best for**: Authentication, data loading, general waiting

### confetti.json
- **Usage**: Celebrations, achievements
- **Animation**: Confetti particles
- **Best for**: Game wins, achievements, celebrations

### Blue Rocket.json
- **Usage**: Game start animations
- **Animation**: Rocket launch
- **Best for**: Game initialization, exciting starts

## Implementation Examples

### Authentication Screens
```tsx
// In SignUpLoginScreen.tsx, SignUpScreen.tsx, OTPVerificationScreen.tsx
const renderLoadingOverlay = () => {
  if (isLoading || isValidating) {
    const message = activeTab === 'login' ? 'Signing in...' : 'Signing up...';
    return (
      <LoadingOverlay
        visible={true}
        message={message}
      />
    );
  }
  return null;
};
```

### Game Screens
```tsx
// In GameScreen.tsx, SinglePlayerGameScreen.tsx
<GameLoadingOverlay 
  visible={isEndingGame} 
  message="Ending Game..." 
  type="game_end"
  size="large"
/>
```

### Report Screens
```tsx
// In ComprehensiveReportScreen.tsx
{isLoading ? (
  <LoadingSpinner 
    size="large" 
    text="Generating Report, Please Wait..."
  />
) : (
  // Report content
)}
```

## Migration Guide

### From ActivityIndicator to Lottie
1. **Before**:
```tsx
<ActivityIndicator size="large" color={theme.colors.primary} />
```

2. **After**:
```tsx
<LoadingSpinner size="large" text="Loading..." />
```

### From Custom Loading to Unified Components
1. **Before**:
```tsx
<View style={styles.loadingContainer}>
  <ActivityIndicator size="large" color="#FFFFFF" />
  <Text style={styles.loadingText}>Loading...</Text>
</View>
```

2. **After**:
```tsx
<LoadingOverlay visible={isLoading} message="Loading..." />
```

## Best Practices

1. **Use LoadingOverlay** for full-screen loading states
2. **Use LoadingSpinner** for inline loading states
3. **Use GameLoadingOverlay** for game-specific scenarios
4. **Use UnifiedLoadingOverlay** for custom loading scenarios
5. **Always provide meaningful messages** to users
6. **Choose appropriate sizes** based on context
7. **Use confetti animations** for celebrations and achievements

## Animation Performance

- All Lottie animations are optimized for performance
- Animations loop automatically
- Use `resizeMode="contain"` for proper scaling
- Consider using `useLottie={false}` for fallback to ActivityIndicator if needed

## Troubleshooting

### Common Issues
1. **Animation not showing**: Check if Lottie is properly installed
2. **Animation too large/small**: Adjust size prop or animation container styles
3. **Performance issues**: Consider using `useLottie={false}` for fallback

### Fallback Support
All components support fallback to ActivityIndicator by setting `useLottie={false}`:

```tsx
<LoadingOverlay 
  visible={isLoading} 
  message="Loading..." 
  useLottie={false} // Falls back to ActivityIndicator
/>
```
