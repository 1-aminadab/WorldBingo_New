import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Smartphone, Play } from 'lucide-react-native';
import { useTheme } from '../components/ui/ThemeProvider';


const { width } = Dimensions.get('window');

export const BingoCardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }

      return () => {
        // Show tab bar again when leaving
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
              marginBottom: 42
            }
          });
        }
      };
    }, [navigation, theme])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAppStore = () => {
    const appStoreUrl = 'https://apps.apple.com/app/world-bingo/id123456789';
    Linking.openURL(appStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open App Store');
    });
  };

  const handlePlayStore = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.worldbingo';
    Linking.openURL(playStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open Play Store');
    });
  };

  const handleGetCards = () => {
    const url = 'https://MyWorldBingo.com';
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open website');
    });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/app-bgaround.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bingo Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Bingo Cards Section */}
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <Text style={styles.sectionTitle}>Bingo Cards</Text>
          
          <View style={styles.cardContent}>
            <View style={styles.iconPlaceholder} />
            <Text style={styles.cardDescription}>
              Get Bingo cards from the "Million Game" app and play directly on your mobile or tablet.
            </Text>
          </View>

          <View style={styles.storeButtonsContainer}>
            <TouchableOpacity onPress={handleAppStore} style={styles.appStoreButton}>
              <View style={styles.storeButtonContent}>
                <Smartphone size={24} color="#FFFFFF" />
                <View style={styles.storeButtonTextContainer}>
                  <Text style={styles.storeButtonText}>Available on the</Text>
                  <Text style={styles.storeButtonTitle}>App Store</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayStore} style={styles.playStoreButton}>
              <View style={styles.storeButtonContent}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                <View style={styles.storeButtonTextContainer}>
                  <Text style={styles.storeButtonText}>GET IT ON</Text>
                  <Text style={styles.storeButtonTitle}>Google Play</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Print Bingo Cards Section */}
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <Text style={styles.sectionTitle}>Print Bingo Cards</Text>
          
          <View style={styles.cardContent}>
            <View style={styles.iconPlaceholder} />
            <Text style={styles.cardDescription}>
              Download your cards from MyWorldBingo.com and print directly from your printer
            </Text>
          </View>

          <TouchableOpacity onPress={handleGetCards} style={styles.getCardsButton}>
            <Text style={styles.getCardsButtonText}>Get cards</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#8B7355',
    borderRadius: 8,
    marginRight: 16,
  },
  cardDescription: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  storeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  appStoreButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 60,
  },
  playStoreButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 60,
  },
  storeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  storeButtonTextContainer: {
    alignItems: 'flex-start',
  },
  storeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '400',
  },
  storeButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  getCardsButton: {
    backgroundColor: '#8B7355',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'flex-end',
    minWidth: 120,
  },
  getCardsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});