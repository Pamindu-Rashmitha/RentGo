import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme';

const SECTIONS = [
  {
    title: 'Getting started',
    icon: 'rocket-outline',
    bullets: [
      'Use Explore to browse available vehicles and open a listing for photos, pricing, and details.',
      'Switch to Bookings to see upcoming and past reservations.',
      'Reviews shows feedback you have submitted about completed rentals.',
    ],
  },
  {
    title: 'Making a booking',
    icon: 'calendar-outline',
    bullets: [
      'Choose your dates and follow the steps on the vehicle screen to request a booking.',
      'Complete any payment or document steps shown in your booking details.',
      'Check the Bookings tab for status updates (for example pending, confirmed, or completed).',
    ],
  },
  {
    title: 'Your account',
    icon: 'person-circle-outline',
    bullets: [
      'Open Profile, then Edit Profile to change your name or email.',
      'Use Sign Out when you finish on a shared device.',
      'If the app cannot reach the server, confirm you are online and that the API address in the app matches your environment.',
    ],
  },
  {
    title: 'Troubleshooting',
    icon: 'build-outline',
    bullets: [
      'Force-close the app and open it again if a screen looks stuck.',
      'After changing networks, retry the action; slow connections can time out.',
      'If login works but another feature fails, sign out and sign back in to refresh your session.',
    ],
  },
  {
    title: 'Contact support',
    icon: 'mail-outline',
    bullets: [
      'For billing or vehicle issues, contact support through the channel your rental provider gave you (email, phone, or storefront).',
      'When you reach out, include your account email and, if applicable, a booking or vehicle reference.',
    ],
  },
];

const HelpSupportScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.introCard, shadows.small]}>
          <Ionicons name="information-circle" size={28} color={colors.primary} />
          <Text style={styles.introTitle}>How to use RentGo</Text>
          <Text style={styles.introBody}>
            Quick tips for browsing vehicles, managing bookings, and fixing common issues.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={[styles.sectionCard, shadows.small]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name={section.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.bullets.map((line, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  introCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
    textAlign: 'center',
  },
  introBody: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 8,
    lineHeight: 22,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default HelpSupportScreen;
