
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseconfig';

export const logoutUser = async (navigationRouter?: any) => {
  try {
    await signOut(auth);
    // Use the provided router or the global router
    if (navigationRouter) {
      navigationRouter.replace('/login');
    } else {
      router.replace('/login');
    }
  } catch (error) {
    console.error('Error signing out:', error);
  }
};