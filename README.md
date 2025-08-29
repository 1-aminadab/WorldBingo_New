# World Bingo 🌍

A modern mobile Bingo game app built with React Native, featuring animated slot machine number calling, voice announcements, and customizable game patterns.

## ✨ Features

### 🎯 Game Features
- **Classic & Modern Patterns**: Traditional lines and creative shapes (T, U, X, Plus, Diamond)
- **Animated Slot Machine**: Realistic spinning animation for number draws
- **Voice Calling**: Male/Female voice options in English and Amharic
- **Real-time Board**: Interactive bingo card with animations
- **Pattern Matching**: Automatic win detection with celebration animations
- **Guest Mode**: Play without registration with optional account creation

### 🛠️ Technical Features
- **React Native CLI**: Pure React Native (not Expo)
- **TypeScript**: Full type safety
- **Zustand**: Global state management
- **React Navigation**: Smooth screen transitions
- **React Native Reanimated**: 60fps animations
- **Internationalization**: English and Amharic support
- **Theme System**: Light/Dark/System themes
- **Audio System**: Voice calling and sound effects

### 👤 User Experience
- **Guest Access**: Play immediately without account creation
- **Account Benefits**: Save progress, track stats, compete with friends
- **Profile Management**: View stats, upgrade guest accounts
- **Seamless Upgrade**: Convert guest account to full account with progress preservation

### 📱 Screens & Flow
1. **Splash Screen**: Animated brand introduction
2. **Authentication**: Login, Signup, Password recovery with OTP, **Guest Access**
3. **Home Screen**: Main navigation with user stats and guest prompts
4. **Profile Screen**: User stats, account management, guest-to-user conversion
5. **Settings**: Comprehensive game configuration
6. **Game Screen**: Full bingo experience with slot machine

## 🚀 Installation

### Prerequisites
- Node.js (v18+)
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd World_Bingo

# Install dependencies
yarn install

# iOS additional setup
cd ios && pod install && cd ..

# Android setup
npx react-native run-android

# iOS setup
npx react-native run-ios
```

## 🎮 How to Play

### For Guest Users:
1. **Open App**: Choose "Enter as Guest" on login screen
2. **Configure Settings**: Select pattern, voice, language, and RTP
3. **Start Playing**: Tap "Play Bingo" from home screen
4. **Upgrade Anytime**: Create account to save progress

### For Registered Users:
1. **Login/Signup**: Create account or login
2. **Configure Settings**: Select pattern, voice, language, and RTP
3. **Start Game**: Tap "Play Bingo" from home screen
4. **Track Progress**: View stats and achievements in profile

## 👤 Guest vs. Registered Users

### Guest Features:
- ✅ Full game access
- ✅ All patterns and settings
- ✅ Real-time stats during session
- ✅ Voice calling and animations
- ❌ Progress saving between sessions
- ❌ Global leaderboards
- ❌ Achievement tracking

### Registered User Benefits:
- ✅ All guest features
- ✅ Progress saved across sessions
- ✅ Detailed statistics and history
- ✅ Achievement system
- ✅ Global leaderboards
- ✅ Friend challenges
- ✅ Cloud backup

## 🔧 Configuration

### Game Settings
- **Patterns**: 9 different winning patterns
- **Voice**: Male/Female in English/Amharic
- **RTP**: Return to Player percentage (35-85%)
- **Theme**: Light, Dark, or System

### Account Types
- **Guest**: Temporary session, no registration required
- **Registered**: Full features with data persistence

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Basic UI elements (Button, Input, etc.)
│   ├── game/          # Game-specific components
│   └── animations/    # Animated components
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── game/          # Game screens
│   ├── settings/      # Settings screens
│   └── ProfileScreen.tsx # User profile and stats
├── navigation/        # Navigation configuration
├── store/            # Zustand state management
│   ├── authStore.ts  # Auth + guest management
│   ├── gameStore.ts  # Game state
│   └── settingsStore.ts # Game settings
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── i18n/             # Internationalization
```

## 🎨 Design System

### Colors
- **Primary**: Orange-Red (#FF6B35)
- **Secondary**: Teal (#4ECDC4)
- **Success**: Green
- **Warning**: Orange
- **Error**: Red

### Guest UI Elements
- **Guest Badge**: Indicates guest status
- **Upgrade Prompts**: Encourage account creation
- **Progress Indicators**: Show what's available vs. locked

## 🔊 Audio System

### Sound Effects
- Button clicks
- Number draw sounds
- Win celebrations
- Background music

### Voice Calling
- Text-to-Speech integration
- Multiple language support
- Gender selection
- Preview functionality

## 🌐 Internationalization

Currently supports:
- **English**: Default language
- **Amharic**: Ethiopian language support

Easy to add more languages by updating the `src/i18n/locales/` directory.

## 📊 User Statistics

### Guest Stats (Session Only):
- Games played this session
- Games won this session
- Current win rate
- Session play time

### Registered User Stats (Persistent):
- Total games played
- Total games won
- Overall win rate
- Total play time
- Achievement progress
- Historical data

## 🚀 Performance

- **60fps animations** using React Native Reanimated
- **Optimized re-renders** with Zustand state management
- **Lazy loading** for screens and components
- **Memory efficient** audio management
- **Fast guest access** with no signup friction

## 🔄 Guest to User Flow

1. **Guest plays** and accumulates session stats
2. **Upgrade prompt** appears periodically
3. **User creates account** via profile screen
4. **Session data transfers** to permanent account
5. **Full features unlock** immediately

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@worldbingo.com or create an issue in this repository.

---

**Start playing World Bingo today - no account required! 🎉**