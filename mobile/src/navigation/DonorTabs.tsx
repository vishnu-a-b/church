import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DonorProfileScreen from '../screens/donor/DonorProfileScreen';
import DonorDuesScreen from '../screens/donor/DonorDuesScreen';

const Tab = createBottomTabNavigator();

export default function DonorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="Profile" component={DonorProfileScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Dues" component={DonorDuesScreen}
        options={{ title: 'Monthly Support', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
