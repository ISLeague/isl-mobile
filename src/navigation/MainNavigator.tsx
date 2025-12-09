import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme/colors';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SuplantacionBanner } from '../components/common/SuplantacionBanner';
import { useAuth } from '../contexts/AuthContext';


const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { isAdmin, usuarioReal, isGuest } = useAuth();

  // Si es admin y NO está suplantando, no mostrar tabs
  if (isAdmin && !usuarioReal) {
    return (
      <View style={styles.adminContainer}>
        <SuplantacionBanner />
        <ProfileScreen navigation={undefined} />
      </View>
    );
  }

  // Para fans, invitados o admins suplantando fans
  return (
    <>
      <SuplantacionBanner />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            backgroundColor: colors.white,
          },
          tabBarShowLabel: true,
          tabBarLabel: ({ focused }) => {
            let label = '';
            if (route.name === 'Home') label = 'Ligas';
            else if (route.name === 'Profile') label = 'Perfil';

            return (
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.labelText,
                    { color: focused ? colors.primary : colors.textLight },
                  ]}
                >
                  {label}
                </Text>
                {focused && <View style={styles.indicator} />}
              </View>
            );
          },
          tabBarIcon: ({ focused }) => {
            let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
            
            if (route.name === 'Home') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else {
              iconName = focused ? 'account' : 'account-outline';
            }

            return (
              <MaterialCommunityIcons
                name={iconName}
                size={26}
                color={focused ? colors.primary : colors.textLight}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  adminContainer: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  indicator: {
    marginTop: 4,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
