import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import KutayimaAdminHousesScreen from '../screens/kutayima-admin/HousesScreen';
import KutayimaAdminMembersScreen from '../screens/kutayima-admin/MembersScreen';
import KutayimaAdminActivitiesScreen from '../screens/kutayima-admin/ActivitiesScreen';
import KutayimaAdminStothrakazhchaScreen from '../screens/kutayima-admin/StothrakazhchaScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function KutayimaAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="Members" component={KutayimaAdminMembersScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Houses" component={KutayimaAdminHousesScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Activities" component={KutayimaAdminActivitiesScreen}
        options={{ title: 'Spiritual Activities', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Sthothrakazhcha" component={KutayimaAdminStothrakazhchaScreen}
        options={{ tabBarLabel: 'Stothra', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Account" component={LogoutScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
