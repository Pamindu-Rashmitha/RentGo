import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        <View style={[styles.profileCard, shadows.medium]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role?.toUpperCase() || 'USER'}
            </Text>
          </View>
        </View>

        <View style={[styles.menuCard, shadows.small]}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168, 85, 247, 0.04)', bottom: 50, left: -60 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  profileCard: { backgroundColor: colors.card, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: colors.primaryBorder },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  userName: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.textMuted, marginBottom: 14 },
  roleBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  roleBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  menuCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 66 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorBg, borderRadius: 14, height: 56, borderWidth: 1, borderColor: colors.errorBorder, gap: 10 },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
