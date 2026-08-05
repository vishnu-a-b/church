import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MemberProfileScreen from '../screens/member/ProfileScreen';
import MemberTransactionsScreen from '../screens/member/TransactionsScreen';
import MemberSpiritualActivitiesScreen from '../screens/member/SpiritualActivitiesScreen';
import MemberPathavarmScreen from '../screens/member/PathavarmScreen';

const Tab = createBottomTabNavigator();

export default function MemberTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#0d9488' }}>
      <Tab.Screen name="Profile" component={MemberProfileScreen} />
      <Tab.Screen name="Transactions" component={MemberTransactionsScreen} />
      <Tab.Screen name="Activities" component={MemberSpiritualActivitiesScreen} options={{ title: 'Spiritual Activities' }} />
      <Tab.Screen name="Pathavarm" component={MemberPathavarmScreen} />
    </Tab.Navigator>
  );
}
