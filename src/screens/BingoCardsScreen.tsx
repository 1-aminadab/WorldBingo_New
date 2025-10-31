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
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../components/ui/ThemeProvider';
import { setTabBarVisibility, restoreTabBar } from '../utils/tabBarStyles';


const { width } = Dimensions.get('window');

export const BingoCardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisibility(navigation, false);

      return () => {
        // Show tab bar again when leaving
        restoreTabBar(navigation);
      };
    }, [navigation])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAppStore = () => {
    const appStoreUrl = 'https://worldappios.aworldplay.com';
    Linking.openURL(appStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open App Store');
    });
  };

  const handlePlayStore = () => {
    const playStoreUrl = 'https://worldappandroid.aworldplay.com';
    Linking.openURL(playStoreUrl).catch(() => {
      Alert.alert('Error', 'Could not open Play Store');
    });
  };

  const handleGetCards = () => {
    const url = 'https://myworldbingo.com/bingo_card';
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
        <View style={styles.headerBackground} />
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bingo Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Bingo Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bingo Cards</Text>
          
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/images/showCard.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.cardDescription}>
              Get Bingo cards from the "Million Game" app and play directly on your mobile or tablet.
            </Text>
          </View>

          <View style={styles.storeButtonsContainer}>
            <TouchableOpacity onPress={handleAppStore} style={styles.storeButton}>
              <Image 
                source={require('../assets/images/appStore.png')}
                style={styles.storeButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayStore} style={styles.storeButton}>
              <Image 
                source={require('../assets/images/playStore.png')}
                style={styles.storeButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Print Bingo Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Print Bingo Cards</Text>
          
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/images/cardPrinter.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
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
    paddingTop: 20,
    paddingBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgb(0, 10, 60)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardDescription: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '500',
  },
  storeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  storeButton: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  storeButtonImage: {
    width: '100%',
    height: '100%',
  },
  getCardsButton: {
    backgroundColor: '#1e3a8a',
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