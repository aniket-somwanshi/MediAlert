import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Future: navigate to medicine detail
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#F0F4FF' },
            headerTintColor: '#1E3A8A',
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#F0F4FF' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: 'Add Medicine', presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
