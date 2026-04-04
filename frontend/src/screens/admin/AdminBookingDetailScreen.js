import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBookingById, updateBookingStatus } from '../../api/bookingService';
import { colors, formatDate, formatCurrency, formatStatus, statusColors, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';

const AdminBookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => { loadBooking(); }, []);

  const loadBooking = async () => {
    try {
      const res = await getBookingById(bookingId);
      setBooking(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = (newStatus, label) => {
    Alert.alert('Confirm', `${label} this booking?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        setActing(true);
        try {
          await updateBookingStatus(bookingId, newStatus);
          Alert.alert('Done', `Booking status updated to ${formatStatus(newStatus)}.`);
          loadBooking();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
        } finally {
          setActing(false);
        }
      }},
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) return null;

  const sc = statusColors[booking.status] || statusColors.Cancelled;
  const v = booking.vehicleId;
  const u = booking.userId;
  const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, shadows.small]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusBannerText, { color: sc.text }]}>{formatStatus(booking.status)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={[styles.infoCard, shadows.small]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{u?.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{u?.email}</Text>
              </View>
            </View>
          </View>

          {v && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <View style={[styles.vehicleCard, shadows.small]}>
                <Image 
                  source={{ uri: `${API_BASE}${v.vehiclePhotos?.[0] || ''}` }} 
                  style={styles.vehicleImage} 
                  resizeMode="cover" 
                />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                  <Text style={styles.vehicleSub}>{v.year} • {v.licensePlate}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Info</Text>
            <View style={[styles.infoCard, shadows.small]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dates</Text>
                <Text style={styles.infoValue}>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{days} days</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(booking.totalPrice)}</Text>
              </View>
            </View>
          </View>

          {booking.licenseDocument && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>License Document</Text>
              <View style={[styles.licenseContainer, shadows.small]}>
                <Image source={{ uri: `${API_BASE}${booking.licenseDocument}` }} style={styles.licenseImage} resizeMode="contain" />
              </View>
            </View>
          )}

          <View style={styles.actionsSection}>
            {booking.status === 'Pending_License' && (
              <>
                <TouchableOpacity
                  style={[styles.approveButton, shadows.medium]}
                  onPress={() => handleTransition('Awaiting_Payment', 'Approve license for')}
                  disabled={acting}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.approveText}>Approve License</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleTransition('Cancelled', 'Reject license for')}
                  disabled={acting}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                  <Text style={styles.rejectText}>Reject License</Text>
                </TouchableOpacity>
              </>
            )}

            {booking.status === 'Confirmed' && (
              <TouchableOpacity
                style={[styles.completeButton, shadows.medium]}
                onPress={() => handleTransition('Completed', 'Mark as completed for')}
                disabled={acting}
              >
                <Ionicons name="trophy-outline" size={20} color="#fff" />
                <Text style={styles.completeText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}

            {acting && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { padding: 20 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1 },
  statusBannerText: { fontSize: 15, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.cardBorder },
  vehicleCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  vehicleImage: { width: 100, height: 80 },
  vehicleInfo: { flex: 1, padding: 14, justifyContent: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  licenseContainer: { width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  licenseImage: { width: '100%', height: '100%' },
  actionsSection: { marginBottom: 30 },
  approveButton: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 },
  approveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rejectButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.errorBg, borderRadius: 14, height: 52, borderWidth: 1, borderColor: colors.errorBorder, gap: 8 },
  rejectText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  completeButton: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', gap: 10 },
  completeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AdminBookingDetailScreen;
