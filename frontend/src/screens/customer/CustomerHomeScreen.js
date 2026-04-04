import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TextInput,
  TouchableOpacity, Image, ActivityIndicator, StatusBar,
  RefreshControl, Animated, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles } from '../../api/vehicleService';
import { useAuth } from '../../context/AuthContext';
import { colors, formatCurrency, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';

const FUEL_TYPES = ['All', 'Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['All', 'Manual', 'Automatic'];

const CustomerHomeScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  const fetchVehicles = async () => {
    try {
      const filters = {};
      if (selectedFuel !== 'All') filters.fuelType = selectedFuel;
      if (selectedTransmission !== 'All') filters.transmission = selectedTransmission;
      const res = await getVehicles(filters);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchVehicles();
  }, [selectedFuel, selectedTransmission]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
  });

  const renderStars = (rating) => {
    const stars = [];
    const r = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(r) ? 'star' : 'star-outline'}
          size={12}
          color="#F59E0B"
          style={{ marginRight: 1 }}
        />
      );
    }
    return stars;
  };

  const renderVehicle = ({ item, index }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.vehicleCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
      >
        <Image
          source={{ uri: `${API_BASE}${item.vehiclePhotos[0]}` }}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleName}>{item.make} {item.model}</Text>
            <Text style={styles.vehicleYear}>{item.year}</Text>
          </View>

          <View style={styles.specsRow}>
            <View style={styles.specBadge}>
              <Ionicons name="speedometer-outline" size={11} color={colors.primary} />
              <Text style={styles.specText}>{item.transmission}</Text>
            </View>
            <View style={styles.specBadge}>
              <Ionicons name="flash-outline" size={11} color={colors.primary} />
              <Text style={styles.specText}>{item.fuelType}</Text>
            </View>
            <View style={styles.specBadge}>
              <Ionicons name="people-outline" size={11} color={colors.primary} />
              <Text style={styles.specText}>{item.seatingCapacity}</Text>
            </View>
          </View>

          <View style={styles.vehicleFooter}>
            <View style={styles.ratingRow}>
              {renderStars(item.averageRating)}
              <Text style={styles.ratingText}>
                {item.averageRating ? item.averageRating.toFixed(1) : 'N/A'}
              </Text>
            </View>
            <Text style={styles.priceText}>{formatCurrency(item.pricePerDay)}<Text style={styles.perDay}>/day</Text></Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Explore</Text>
          <Text style={styles.subtitle}>Find your perfect ride</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search make or model..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderVehicle}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="car-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          }
        />
      )}

      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Fuel Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {FUEL_TYPES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, selectedFuel === f && styles.chipActive]}
                  onPress={() => setSelectedFuel(f)}
                >
                  <Text style={[styles.chipText, selectedFuel === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Transmission</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {TRANSMISSIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTransmission === t && styles.chipActive]}
                  onPress={() => setSelectedTransmission(t)}
                >
                  <Text style={[styles.chipText, selectedTransmission === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => { setShowFilters(false); setLoading(true); fetchVehicles(); }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => { setSelectedFuel('All'); setSelectedTransmission('All'); }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: StatusBar.currentHeight },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168, 85, 247, 0.04)', bottom: 50, left: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  greeting: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  logoutBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.errorBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.errorBorder },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: colors.inputBorder },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, marginLeft: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  vehicleCard: { backgroundColor: colors.card, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', ...shadows.small },
  vehicleImage: { width: '100%', height: 180 },
  vehicleInfo: { padding: 16 },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehicleName: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 },
  vehicleYear: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  specsRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  specBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  specText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  vehicleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4, fontWeight: '600' },
  priceText: { fontSize: 20, fontWeight: '800', color: colors.primary },
  perDay: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, ...shadows.large },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  filterLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 10, marginTop: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bg, marginRight: 8, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  applyButton: { backgroundColor: colors.primary, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resetButton: { alignItems: 'center', marginTop: 14 },
  resetButtonText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});

export default CustomerHomeScreen;
