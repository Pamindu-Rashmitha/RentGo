import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Background Decorative Circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        <View style={[styles.welcomeCard, shadows.medium]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.badgeContainer}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role?.toUpperCase() || 'USER'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    bottom: 50,
    left: -60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: 14,
    height: 56,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
