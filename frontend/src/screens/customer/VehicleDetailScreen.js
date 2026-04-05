import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert,
  Animated, Platform, TextInput, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getVehicleById } from '../../api/vehicleService';
import { createBooking } from '../../api/bookingService';
import { getVehicleReviews } from '../../api/reviewService';
import { colors, formatCurrency, formatDate, shadows, getImageUri } from '../../theme';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VehicleDetailScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadData = async () => {
    try {
      const [vRes, rRes] = await Promise.all([
        getVehicleById(vehicleId),
        getVehicleReviews(vehicleId),
      ]);
      setVehicle(vRes.data);
      setReviews(rRes.data.reviews || []);
      setAverageRating(rRes.data.averageRating);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const pickLicense = async () => {
    Alert.alert('Upload License', 'Choose source', [
      {
        text: 'Camera', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!result.canceled) setLicenseDoc(result.assets[0]);
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
          if (!result.canceled) setLicenseDoc(result.assets[0]);
        }
      },
      {
        text: 'PDF File', onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
          if (!result.canceled) setLicenseDoc(result.assets[0]);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBook = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select both start and end dates.');
      return;
    }
    if (!licenseDoc) {
      Alert.alert('Error', 'Please upload your license document.');
      return;
    }

    setBooking(true);
    try {
      const formData = new FormData();
      formData.append('vehicleId', vehicleId);
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());
      formData.append('licenseDocument', {
        uri: licenseDoc.uri,
        name: licenseDoc.name || 'license.jpg',
        type: licenseDoc.mimeType || 'image/jpeg',
      });

      await createBooking(formData);
      Alert.alert('Success', 'Booking created! Awaiting license review.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons key={i} name={i <= Math.round(rating || 0) ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Vehicle not found</Text>
      </SafeAreaView>
    );
  }

  const days = startDate && endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 0;
  const totalPrice = days > 0 ? vehicle.pricePerDay * days : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.imageContainer}>
            <FlatList
              data={vehicle.vehiclePhotos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: getImageUri(item) }} style={styles.heroImage} resizeMode="cover" />
              )}
            />
            
            {vehicle.vehiclePhotos.length > 1 && (
              <View style={styles.pagination}>
                {vehicle.vehiclePhotos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeImageIndex === i ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                <Text style={styles.vehicleYear}>{vehicle.year} • {vehicle.licensePlate}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>{formatCurrency(vehicle.pricePerDay)}</Text>
                <Text style={styles.perDay}>/day</Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              {renderStars(averageRating)}
              <Text style={styles.ratingValue}>{averageRating ? averageRating.toFixed(1) : 'No ratings'}</Text>
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            </View>

            <View style={[styles.specsCard, shadows.small]}>
              <View style={styles.specItem}>
                <Ionicons name="flash-outline" size={20} color={colors.primary} />
                <Text style={styles.specLabel}>Fuel</Text>
                <Text style={styles.specValue}>{vehicle.fuelType}</Text>
              </View>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
                <Text style={styles.specLabel}>Trans.</Text>
                <Text style={styles.specValue}>{vehicle.transmission}</Text>
              </View>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={styles.specLabel}>Seats</Text>
                <Text style={styles.specValue}>{vehicle.seatingCapacity}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Book This Vehicle</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateText}>{startDate ? formatDate(startDate) : 'Start Date'}</Text>
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.dateText}>{endDate ? formatDate(endDate) : 'End Date'}</Text>
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate || tomorrow}
                mode="date"
                minimumDate={tomorrow}
                onChange={(e, date) => {
                  setShowStartPicker(false);
                  if (date) { setStartDate(date); if (endDate && date >= endDate) setEndDate(null); }
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate || (startDate ? new Date(startDate.getTime() + 86400000) : tomorrow)}
                mode="date"
                minimumDate={startDate ? new Date(startDate.getTime() + 86400000) : tomorrow}
                onChange={(e, date) => { setShowEndPicker(false); if (date) setEndDate(date); }}
              />
            )}

            {days > 0 && (
              <View style={styles.priceSummary}>
                <Text style={styles.summaryText}>{formatCurrency(vehicle.pricePerDay)} × {days} days</Text>
                <Text style={styles.totalText}>{formatCurrency(totalPrice)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.uploadButton} onPress={pickLicense}>
              <Ionicons name={licenseDoc ? 'checkmark-circle' : 'document-attach-outline'} size={20} color={licenseDoc ? colors.success : colors.primary} />
              <Text style={[styles.uploadText, licenseDoc && { color: colors.success }]}>
                {licenseDoc ? 'License uploaded' : 'Upload License Document'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bookButton, booking && { opacity: 0.7 }]}
              onPress={handleBook}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Book Now</Text>
              )}
            </TouchableOpacity>

            {reviews.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  <Text style={styles.reviewCount}>{reviews.length} total</Text>
                </View>
                {reviews.map((r) => (
                  <View key={r._id} style={[styles.reviewCard, shadows.small]}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>{r.author}</Text>
                      <View style={styles.reviewStars}>{renderStars(r.rating)}</View>
                    </View>
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                    <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 40 },
  imageContainer: { position: 'relative', height: 280 },
  heroImage: { width: SCREEN_WIDTH, height: 280 },
  pagination: { position: 'absolute', bottom: 15, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  activeDot: { width: 18, backgroundColor: colors.primary },
  inactiveDot: { width: 6, backgroundColor: 'rgba(255,255,255,0.5)' },
  backButton: { position: 'absolute', top: 44, left: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', ...shadows.small },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  vehicleName: { fontSize: 24, fontWeight: '800', color: colors.text },
  vehicleYear: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  priceText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  perDay: { fontSize: 12, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  ratingValue: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 4 },
  reviewCount: { fontSize: 12, color: colors.textMuted },
  specsCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, marginBottom: 24, justifyContent: 'space-around' },
  specItem: { alignItems: 'center', gap: 6 },
  specLabel: { fontSize: 11, color: colors.textMuted },
  specValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  specDivider: { width: 1, backgroundColor: colors.cardBorder },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.cardBorder, gap: 8, ...shadows.small },
  dateText: { fontSize: 13, color: colors.textSecondary },
  priceSummary: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primaryBg, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.primaryBorder },
  summaryText: { fontSize: 14, color: colors.textSecondary },
  totalText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 14, height: 52, borderWidth: 1, borderColor: colors.cardBorder, gap: 10, marginBottom: 14, ...shadows.small },
  uploadText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  bookButton: { backgroundColor: colors.primary, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', ...shadows.medium, marginBottom: 24 },
  bookButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reviewCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: colors.text },
  reviewStars: { flexDirection: 'row' },
  reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  reviewDate: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
});

export default VehicleDetailScreen;
