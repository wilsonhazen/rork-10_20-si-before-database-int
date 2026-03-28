import { Tabs } from "expo-router";
import { Sparkles, DollarSign, User, Home, Handshake } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

const TabBarBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

export default function TabLayout() {
  const { user } = useAuth();
  const { notifications } = useData();

  const unreadNotifications = notifications.filter(
    n => n.userId === user?.id && !n.read
  ).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.darkCard,
          borderTopColor: Colors.darkBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Home size={size} color={color} />
              <TabBarBadge count={unreadNotifications} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: "Deals",
          tabBarIcon: ({ color, size }) => <Handshake size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
