import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import UnitAdminBavanakutayimasScreen from '../screens/unit-admin/BavanakutayimasScreen';
import UnitAdminHousesScreen from '../screens/unit-admin/HousesScreen';
import UnitAdminMembersScreen from '../screens/unit-admin/MembersScreen';
import UnitAdminTransactionsScreen from '../screens/unit-admin/TransactionsScreen';
import UnitAdminActivitiesScreen from '../screens/unit-admin/ActivitiesScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function UnitAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="Bavanakutayimas" component={UnitAdminBavanakutayimasScreen}
        options={{ tabBarLabel: 'Kutayimas', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Houses" component={UnitAdminHousesScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Members" component={UnitAdminMembersScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Transactions" component={UnitAdminTransactionsScreen}
        options={{ tabBarLabel: 'Txns', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Activities" component={UnitAdminActivitiesScreen}
        options={{ title: 'Spiritual Activities', tabBarLabel: 'Activities', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Account" component={LogoutScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
