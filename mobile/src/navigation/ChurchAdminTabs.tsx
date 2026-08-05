import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChurchAdminApprovalsScreen from '../screens/church-admin/ApprovalsScreen';
import ChurchAdminThirukkarmangalScreen from '../screens/church-admin/ThirukkarmangalScreen';
import ChurchAdminPathavarmScreen from '../screens/church-admin/PathavarmScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function ChurchAdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#059669' }}>
      <Tab.Screen name="Approvals" component={ChurchAdminApprovalsScreen} />
      <Tab.Screen name="Thirukkarmangal" component={ChurchAdminThirukkarmangalScreen} />
      <Tab.Screen name="Pathavarm" component={ChurchAdminPathavarmScreen} />
      <Tab.Screen name="Account" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
