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

  return activeRole === 'member' ? <MemberTabs /> : <DonorTabs />;
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
