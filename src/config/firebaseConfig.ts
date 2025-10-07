import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Firebase configuration
// Note: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export Firebase services
export const authentication = auth();


// Test authentication connection
export const testFirebaseAuth = async (): Promise<boolean> => {
  try {
    // Check if auth is properly configured
    const currentUser = authentication.currentUser;
    console.log('Firebase Auth initialized:', currentUser !== null ? 'User logged in' : 'No user');
    return true;
  } catch (error) {
    console.error('Firebase Auth connection failed:', error);
    return false;
  }
};

export default firebase;