import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminThirukkarmangalScreen from '../screens/super-admin/ThirukkarmangalScreen';
import SuperAdminThirukkarmangalBookingsScreen from '../screens/super-admin/ThirukkarmangalBookingsScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function SuperAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, marginBottom: 2 },
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen
        name="Thirukkarmangal"
        component={SuperAdminThirukkarmangalScreen}
        options={{
          tabBarLabel: 'Rites',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={SuperAdminThirukkarmangalBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={LogoutScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
