import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import KutayimaAdminHierarchyScreen from '../screens/kutayima-admin/HierarchyScreen';
import KutayimaAdminMembersScreen from '../screens/kutayima-admin/MembersScreen';
import KutayimaAdminWeeklyScreen from '../screens/kutayima-admin/WeeklyScreen';
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
      <Tab.Screen name="Houses" component={KutayimaAdminHierarchyScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Members" component={KutayimaAdminMembersScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Weekly" component={KutayimaAdminWeeklyScreen}
        options={{ headerShown: false, tabBarLabel: 'Weekly', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Account" component={LogoutScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
