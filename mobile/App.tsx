import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RolePickerScreen from './src/screens/RolePickerScreen';
import LoginScreen from './src/screens/LoginScreen';
import MemberTabs from './src/navigation/MemberTabs';
import DonorTabs from './src/navigation/DonorTabs';
import ChurchAdminTabs from './src/navigation/ChurchAdminTabs';
import KutayimaAdminTabs from './src/navigation/KutayimaAdminTabs';

function RootGate() {
  const { activeRole, user, loading } = useAuth();

  if (!activeRole) return <RolePickerScreen />;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  switch (activeRole) {
    case 'member':
      return <MemberTabs />;
    case 'donor':
      return <DonorTabs />;
    case 'church_admin':
      return <ChurchAdminTabs />;
    case 'kudumbakutayima_admin':
      return <KutayimaAdminTabs />;
    default:
      return null;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootGate />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
