import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DonorProfileScreen from '../screens/donor/DonorProfileScreen';
import DonorDuesScreen from '../screens/donor/DonorDuesScreen';

const Tab = createBottomTabNavigator();

export default function DonorTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#7c3aed' }}>
      <Tab.Screen name="Profile" component={DonorProfileScreen} />
      <Tab.Screen name="Dues" component={DonorDuesScreen} options={{ title: 'Monthly Support' }} />
    </Tab.Navigator>
  );
}
