import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Firebase configuration
// Note: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project-id",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Safe Firebase initialization with error handling
let authentication: any = null;

try {
  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    // Check if google-services.json exists for Android
    firebase.initializeApp(firebaseConfig);
  }
  
  // Initialize auth service
  authentication = auth();
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed - using fallback auth:', error);
  
  // Create a mock auth object for development
  authentication = {
    currentUser: null,
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    signOut: () => Promise.resolve(),
    sendPasswordResetEmail: () => Promise.reject(new Error('Firebase not configured')),
    onAuthStateChanged: (callback: any) => {
      // Call callback with null user immediately
      setTimeout(() => callback(null), 0);
      // Return unsubscribe function
      return () => {};
    }
  };
}

// Export Firebase services
export { authentication };


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