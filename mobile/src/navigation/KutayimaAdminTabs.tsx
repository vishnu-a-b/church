import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import KutayimaAdminHousesScreen from '../screens/kutayima-admin/HousesScreen';
import KutayimaAdminMembersScreen from '../screens/kutayima-admin/MembersScreen';
import KutayimaAdminActivitiesScreen from '../screens/kutayima-admin/ActivitiesScreen';
import KutayimaAdminStothrakazhchaScreen from '../screens/kutayima-admin/StothrakazhchaScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function KutayimaAdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#ea580c' }}>
      <Tab.Screen name="Members" component={KutayimaAdminMembersScreen} />
      <Tab.Screen name="Houses" component={KutayimaAdminHousesScreen} />
      <Tab.Screen name="Activities" component={KutayimaAdminActivitiesScreen} options={{ title: 'Spiritual Activities' }} />
      <Tab.Screen name="Sthothrakazhcha" component={KutayimaAdminStothrakazhchaScreen} />
      <Tab.Screen name="Account" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
