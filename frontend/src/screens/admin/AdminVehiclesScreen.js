import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert,
  RefreshControl, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles, deleteVehicle } from '../../api/vehicleService';
import { colors, formatCurrency, formatStatus, statusColors, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';

const AdminVehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await getVehicles();
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
  }, []));

  const handleDelete = (id, name) => {
    Alert.alert('Delete Vehicle', `Deactivate ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteVehicle(id);
            fetchVehicles();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete.');
          }
        }
      },
    ]);
  };

  const renderVehicle = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.Available;
    return (
      <View style={[styles.vehicleCard, shadows.small]}>
        <Image source={{ uri: `${API_BASE}${item.vehiclePhoto}` }} style={styles.vehicleImage} resizeMode="contain" />
        <View style={styles.vehicleInfo}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{item.make} {item.model}</Text>
              <Text style={styles.vehicleSub}>{item.year} • {item.licensePlate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.priceText}>{formatCurrency(item.pricePerDay)}/day</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditVehicle', { vehicle: item })}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item._id, `${item.make} ${item.model}`)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>Vehicles</Text>
        <TouchableOpacity
          style={[styles.addButton, shadows.small]}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          renderItem={renderVehicle}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVehicles(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="car-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles in fleet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  vehicleCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16, overflow: 'hidden' },
  vehicleImage: { width: '100%', height: 160 },
  vehicleInfo: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 17, fontWeight: '800', color: colors.primary },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primaryBorder },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.errorBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.errorBorder },
});

export default AdminVehiclesScreen;
