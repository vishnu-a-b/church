import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UnitAdminBavanakutayimasScreen from '../screens/unit-admin/BavanakutayimasScreen';
import UnitAdminHousesScreen from '../screens/unit-admin/HousesScreen';
import UnitAdminMembersScreen from '../screens/unit-admin/MembersScreen';
import UnitAdminTransactionsScreen from '../screens/unit-admin/TransactionsScreen';
import UnitAdminActivitiesScreen from '../screens/unit-admin/ActivitiesScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function UnitAdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tab.Screen name="Bavanakutayimas" component={UnitAdminBavanakutayimasScreen} />
      <Tab.Screen name="Houses" component={UnitAdminHousesScreen} />
      <Tab.Screen name="Members" component={UnitAdminMembersScreen} />
      <Tab.Screen name="Transactions" component={UnitAdminTransactionsScreen} />
      <Tab.Screen name="Activities" component={UnitAdminActivitiesScreen} options={{ title: 'Spiritual Activities' }} />
      <Tab.Screen name="Account" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
