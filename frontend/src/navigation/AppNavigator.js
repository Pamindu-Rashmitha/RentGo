import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import VehicleDetailScreen from '../screens/customer/VehicleDetailScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import BookingDetailScreen from '../screens/customer/BookingDetailScreen';
import MyReviewsScreen from '../screens/customer/MyReviewsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminVehiclesScreen from '../screens/admin/AdminVehiclesScreen';
import AddVehicleScreen from '../screens/admin/AddVehicleScreen';
import EditVehicleScreen from '../screens/admin/EditVehicleScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminBookingDetailScreen from '../screens/admin/AdminBookingDetailScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
import AdminMaintenanceScreen from '../screens/admin/AdminMaintenanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'fade_from_bottom',
  contentStyle: { backgroundColor: colors.bg },
};

const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  tabBarIcon: ({ focused, color, size }) => {
    const icons = {
      Explore: focused ? 'compass' : 'compass-outline',
      Bookings: focused ? 'receipt' : 'receipt-outline',
      Reviews: focused ? 'star' : 'star-outline',
      Profile: focused ? 'person-circle' : 'person-circle-outline',
      Dashboard: focused ? 'grid' : 'grid-outline',
      Vehicles: focused ? 'car-sport' : 'car-sport-outline',
      AdminBookings: focused ? 'receipt' : 'receipt-outline',
      Payments: focused ? 'card' : 'card-outline',
      Maintenance: focused ? 'construct' : 'construct-outline',
    };
    return <Ionicons name={icons[route.name] || 'help'} size={22} color={color} />;
  },
});

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
    </Stack.Navigator>
  );
}

function CustomerBookingsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
    </Stack.Navigator>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Bookings" component={CustomerBookingsStack} />
      <Tab.Screen name="Reviews" component={MyReviewsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminVehiclesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminVehiclesList" component={AdminVehiclesScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />
    </Stack.Navigator>
  );
}

function AdminBookingsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminBookingsList" component={AdminBookingsScreen} />
      <Stack.Screen name="AdminBookingDetail" component={AdminBookingDetailScreen} />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Vehicles" component={AdminVehiclesStack} />
      <Tab.Screen name="AdminBookings" component={AdminBookingsStack} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
      <Tab.Screen name="Maintenance" component={AdminMaintenanceScreen} />
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
        user.role === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : (
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
