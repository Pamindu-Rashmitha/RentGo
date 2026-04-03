import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, Image,
  Platform, Modal, TextInput, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getBookingById, cancelBooking } from '../../api/bookingService';
import { createPayment } from '../../api/paymentService';
import { colors, formatDate, formatCurrency, formatStatus, statusColors, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';

const BookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardError, setCardError] = useState('');

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

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          setActing(true);
          try {
            await cancelBooking(bookingId);
            Alert.alert('Cancelled', 'Booking has been cancelled.');
            loadBooking();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to cancel.');
          } finally {
            setActing(false);
          }
        }
      },
    ]);
  };

  const handlePayCard = async () => {
    // Validation
    const { number, expiry, cvv, name } = cardData;
    const cleanNumber = number.replace(/\s/g, '');
    
    if (cleanNumber.length !== 16) return setCardError('Invalid card number');
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) return setCardError('Invalid expiry (MM/YY)');
    if (cvv.length !== 3) return setCardError('Invalid CVV');
    if (name.trim().length < 2) return setCardError('Invalid name');

    // Future date check
    const [m, y] = expiry.split('/');
    const expDate = new Date(2000 + parseInt(y), parseInt(m) - 1);
    if (expDate < new Date()) return setCardError('Card has expired');

    setActing(true);
    setCardError('');
    try {
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('paymentMethod', 'Card');
      await createPayment(formData);
      setShowCardModal(false);
      Alert.alert('Success', 'Payment successful! Booking is now Confirmed.');
      loadBooking();
    } catch (err) {
      setCardError(err.response?.data?.message || 'Payment failed.');
    } finally {
      setActing(false);
    }
  };

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const matched = cleaned.match(/.{1,4}/g);
    return matched ? matched.join(' ') : cleaned;
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    return cleaned;
  };

  const handlePayBankTransfer = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;

    setActing(true);
    try {
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('paymentMethod', 'Bank_Transfer');
      formData.append('receiptImage', {
        uri: result.assets[0].uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      });
      await createPayment(formData);
      Alert.alert('Submitted', 'Receipt submitted. Awaiting admin verification.');
      loadBooking();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed.');
    } finally {
      setActing(false);
    }
  };

  const handlePay = () => {
    Alert.alert('Payment Method', 'How would you like to pay?', [
      { text: 'Card (Instant)', onPress: () => setShowCardModal(true) },
      { text: 'Bank Transfer', onPress: handlePayBankTransfer },
      { text: 'Cancel', style: 'cancel' },
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
  const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
  const canCancel = ['Pending_License', 'Awaiting_Payment'].includes(booking.status);
  const canPay = booking.status === 'Awaiting_Payment';

  const statusSteps = ['Pending_License', 'Awaiting_Payment', 'Confirmed', 'Completed'];
  const currentStep = statusSteps.indexOf(booking.status);

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
            <Ionicons name={booking.status === 'Cancelled' ? 'close-circle' : 'information-circle'} size={20} color={sc.text} />
            <Text style={[styles.statusBannerText, { color: sc.text }]}>{formatStatus(booking.status)}</Text>
          </View>

          {booking.status !== 'Cancelled' && (
            <View style={styles.timeline}>
              {statusSteps.map((step, i) => {
                const isActive = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <View key={step} style={styles.timelineStep}>
                    <View style={[styles.timelineDot, isActive && styles.timelineDotActive, isCurrent && styles.timelineDotCurrent]} />
                    {i < statusSteps.length - 1 && <View style={[styles.timelineLine, isActive && i < currentStep && styles.timelineLineActive]} />}
                    <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>{formatStatus(step)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {v && (
            <View style={[styles.vehicleCard, shadows.small]}>
              <Image source={{ uri: `${API_BASE}${v.vehiclePhoto}` }} style={styles.vehicleImage} resizeMode="cover" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                <Text style={styles.vehicleSub}>{v.year} • {v.licensePlate}</Text>
              </View>
            </View>
          )}

          <View style={[styles.infoCard, shadows.small]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dates</Text>
              <Text style={styles.infoValue}>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{days} day{days > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate</Text>
              <Text style={styles.infoValue}>{formatCurrency(v?.pricePerDay || 0)}/day</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(booking.totalPrice)}</Text>
            </View>
          </View>

          {canPay && (
            <TouchableOpacity style={[styles.payButton, shadows.medium]} onPress={handlePay} disabled={acting}>
              {acting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={acting}>
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showCardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={[styles.modalContent, shadows.large]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Card Payment</Text>
                <TouchableOpacity onPress={() => setShowCardModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Virtual Card */}
              <View style={[styles.virtualCard, shadows.medium]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="car-sport" size={24} color="#fff" />
                  <Text style={styles.cardType}>VISA</Text>
                </View>
                <Text style={styles.cardNumberDisplay}>
                  {cardData.number || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardLabel}>CARD HOLDER</Text>
                    <Text style={styles.cardValue}>{cardData.name.toUpperCase() || 'YOUR NAME'}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>EXPIRES</Text>
                    <Text style={styles.cardValue}>{cardData.expiry || 'MM/YY'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Card Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardData.number}
                    onChangeText={(t) => setCardData({ ...cardData, number: formatCardNumber(t) })}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Expiry Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={5}
                      value={cardData.expiry}
                      onChangeText={(t) => setCardData({ ...cardData, expiry: formatExpiry(t) })}
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={3}
                      value={cardData.cvv}
                      onChangeText={(t) => setCardData({ ...cardData, cvv: t.replace(/\D/g, '') })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cardholder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name as on card"
                    placeholderTextColor={colors.textMuted}
                    value={cardData.name}
                    onChangeText={(t) => setCardData({ ...cardData, name: t })}
                  />
                </View>

                {cardError ? <Text style={styles.errorText}>{cardError}</Text> : null}

                <TouchableOpacity 
                  style={[styles.processButton, acting && { opacity: 0.7 }]} 
                  onPress={handlePayCard} 
                  disabled={acting}
                >
                  {acting ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.processButtonText}>Pay {formatCurrency(booking.totalPrice)}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  statusBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, gap: 10 },
  statusBannerText: { fontSize: 15, fontWeight: '700' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.cardBorder },
  timelineDotActive: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  timelineDotCurrent: { backgroundColor: colors.primary, borderColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
  timelineLine: { position: 'absolute', top: 5, left: '55%', right: '-45%', height: 2, backgroundColor: colors.cardBorder },
  timelineLineActive: { backgroundColor: colors.primary },
  timelineLabel: { fontSize: 9, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  timelineLabelActive: { color: colors.textSecondary, fontWeight: '600' },
  vehicleCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', marginBottom: 16 },
  vehicleImage: { width: 100, height: 80 },
  vehicleInfo: { flex: 1, padding: 14, justifyContent: 'center' },
  vehicleName: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  infoCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.cardBorder },
  payButton: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 },
  payButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.errorBg, borderRadius: 14, height: 52, borderWidth: 1, borderColor: colors.errorBorder, gap: 8 },
  cancelText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  virtualCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 24, paddingVertical: 32, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  cardType: { color: '#fff', fontSize: 18, fontWeight: '800', fontStyle: 'italic' },
  cardNumberDisplay: { color: '#fff', fontSize: 22, fontWeight: '600', letterSpacing: 2, marginBottom: 30, textAlign: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginBottom: 4 },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, height: 50, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  inputRow: { flexDirection: 'row' },
  errorText: { color: colors.error, fontSize: 13, textAlign: 'center', marginTop: 4 },
  processButton: { backgroundColor: colors.primary, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  processButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default BookingDetailScreen;
