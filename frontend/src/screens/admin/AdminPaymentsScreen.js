import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert,
  RefreshControl, Image, TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getPayments, verifyPayment, voidPayment } from '../../api/paymentService';
import { colors, formatCurrency, formatDate, formatStatus, statusColors, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';

const AdminPaymentsScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [underReviewCount, setUnderReviewCount] = useState(0);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [acting, setActing] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await getPayments();
      setPayments(res.data.payments || []);
      setUnderReviewCount(res.data.underReviewCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPayments();
  }, []));

  const handleVerify = (id) => {
    Alert.alert('Verify Payment', 'Confirm this bank transfer as received?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify', onPress: async () => {
          setActing(true);
          try {
            await verifyPayment(id);
            Alert.alert('Verified', 'Payment confirmed. Booking is now active.');
            fetchPayments();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
          } finally {
            setActing(false);
          }
        }
      },
    ]);
  };

  const handleVoid = async () => {
    if (voidReason.trim().length < 10) {
      Alert.alert('Error', 'Void reason must be at least 10 characters.');
      return;
    }
    setActing(true);
    try {
      await voidPayment(voidTarget, voidReason.trim());
      Alert.alert('Voided', 'Payment has been voided.');
      setVoidModalVisible(false);
      setVoidReason('');
      setVoidTarget(null);
      fetchPayments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Void failed.');
    } finally {
      setActing(false);
    }
  };

  const renderPayment = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.Voided;
    const b = item.bookingId;
    const v = b?.vehicleId;
    return (
      <View style={[styles.card, shadows.small]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{v?.make} {v?.model}</Text>
            <Text style={styles.methodText}>{item.paymentMethod.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.receiptImage && (
          <View style={[styles.receiptContainer, shadows.small]}>
            <Image source={{ uri: `${API_BASE}${item.receiptImage}` }} style={styles.receiptImage} resizeMode="contain" />
          </View>
        )}

        {item.voidReason && (
          <View style={styles.voidReasonBox}>
            <Text style={styles.voidReasonLabel}>Void Reason:</Text>
            <Text style={styles.voidReasonText}>{item.voidReason}</Text>
          </View>
        )}

        {item.status === 'Payment_Under_Review' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.verifyBtn, shadows.small]} onPress={() => handleVerify(item._id)} disabled={acting}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.verifyText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.voidBtn]} onPress={() => { setVoidTarget(item._id); setVoidModalVisible(true); }} disabled={acting}>
              <Ionicons name="close-circle-outline" size={16} color={colors.error} />
              <Text style={styles.voidBtnText}>Void</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        {underReviewCount > 0 && (
          <View style={[styles.pendingBadge, shadows.small]}>
            <Text style={styles.pendingText}>{underReviewCount} to review</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPayment}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="card-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          }
        />
      )}

      <Modal visible={voidModalVisible} transparent animationType="slide" onRequestClose={() => setVoidModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVoidModalVisible(false)} />
          <View style={[styles.modalContent, shadows.medium]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>Void Payment</Text>
              <Text style={styles.modalSub}>Provide a reason for cancelling this payment.</Text>
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for voiding (min 10 chars)..."
              placeholderTextColor={colors.textMuted}
              value={voidReason}
              onChangeText={setVoidReason}
              multiline
              maxLength={255}
            />

            <TouchableOpacity style={[styles.modalVoidBtn, shadows.small]} onPress={handleVoid} disabled={acting}>
              {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalVoidText}>Void Payment</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setVoidModalVisible(false); setVoidReason(''); }} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  pendingBadge: { backgroundColor: colors.warningBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.warningBorder },
  pendingText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  list: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: colors.text },
  methodText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  amountText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  dateText: { fontSize: 12, color: colors.textSecondary },
  receiptContainer: { width: '100%', height: 180, borderRadius: 12, marginBottom: 14, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  receiptImage: { width: '100%', height: '100%' },
  voidReasonBox: { backgroundColor: colors.errorBg, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.errorBorder },
  voidReasonLabel: { fontSize: 11, fontWeight: '700', color: colors.error, marginBottom: 4, textTransform: 'uppercase' },
  voidReasonText: { fontSize: 13, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  verifyBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.success, borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', gap: 8 },
  verifyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  voidBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.errorBg, borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.errorBorder },
  voidBtnText: { color: colors.error, fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  modalSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  reasonInput: { backgroundColor: colors.card, borderRadius: 16, padding: 16, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
  modalVoidBtn: { backgroundColor: colors.error, borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalVoidText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  modalCancelBtn: { height: 44, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
});

export default AdminPaymentsScreen;
