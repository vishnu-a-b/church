import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MemberProfileScreen from '../screens/member/ProfileScreen';
import MemberTransactionsScreen from '../screens/member/TransactionsScreen';
import MemberSpiritualActivitiesScreen from '../screens/member/SpiritualActivitiesScreen';
import MemberPathavarmScreen from '../screens/member/PathavarmScreen';
import MemberNewsScreen from '../screens/member/NewsScreen';
import MemberEventsScreen from '../screens/member/EventsScreen';
import MemberStothrakazhchaScreen from '../screens/member/StothrakazhchaScreen';

const Tab = createBottomTabNavigator();

export default function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, marginBottom: 2 },
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="Profile" component={MemberProfileScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Transactions" component={MemberTransactionsScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Activities" component={MemberSpiritualActivitiesScreen}
        options={{ title: 'Spiritual Activities', tabBarLabel: 'Activities', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Pathavarm" component={MemberPathavarmScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'gift' : 'gift-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="News" component={MemberNewsScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Events" component={MemberEventsScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Stothrakazhcha" component={MemberStothrakazhchaScreen}
        options={{ tabBarLabel: 'Stothra', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
