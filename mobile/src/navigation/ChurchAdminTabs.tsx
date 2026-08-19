import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ChurchAdminApprovalsScreen from '../screens/church-admin/ApprovalsScreen';
import ChurchAdminStothrakazhchaScreen from '../screens/church-admin/StothrakazhchaScreen';
import ChurchAdminThirukkarmangalScreen from '../screens/church-admin/ThirukkarmangalScreen';
import ChurchAdminPathavarmScreen from '../screens/church-admin/PathavarmScreen';
import ChurchAdminMembersScreen from '../screens/church-admin/MembersScreen';
import ChurchAdminTransactionsScreen from '../screens/church-admin/TransactionsScreen';
import ChurchAdminCampaignsScreen from '../screens/church-admin/CampaignsScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function ChurchAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 9, marginBottom: 2 },
        tabBarStyle: { borderTopColor: '#f3f4f6', borderTopWidth: 1 },
      }}
    >
      <Tab.Screen name="Approvals" component={ChurchAdminApprovalsScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Stothra" component={ChurchAdminStothrakazhchaScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Thirukkarmangal" component={ChurchAdminThirukkarmangalScreen}
        options={{ tabBarLabel: 'Rites', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Pathavarm" component={ChurchAdminPathavarmScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'gift' : 'gift-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Members" component={ChurchAdminMembersScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Transactions" component={ChurchAdminTransactionsScreen}
        options={{ tabBarLabel: 'Txns', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Campaigns" component={ChurchAdminCampaignsScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'flag' : 'flag-outline'} size={size} color={color} /> }} />
      <Tab.Screen name="Account" component={LogoutScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
