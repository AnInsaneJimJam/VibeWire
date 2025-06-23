import { useEffect } from 'react';
import { router } from 'expo-router';

export default function TabsIndex() {
  useEffect(() => {
    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}