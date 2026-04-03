import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator, Alert,
  StatusBar, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateVehicle } from '../../api/vehicleService';
import { colors, shadows } from '../../theme';

const API_BASE = 'http://192.168.1.8:5000/';
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const VEHICLE_STATUSES = ['Available', 'Under_Maintenance'];

const EditVehicleScreen = ({ route, navigation }) => {
  const { vehicle } = route.params;
  const [form, setForm] = useState({
    make: vehicle.make, model: vehicle.model, year: String(vehicle.year),
    licensePlate: vehicle.licensePlate, pricePerDay: String(vehicle.pricePerDay),
    seatingCapacity: String(vehicle.seatingCapacity),
  });
  const [fuelType, setFuelType] = useState(vehicle.fuelType);
  const [transmission, setTransmission] = useState(vehicle.transmission);
  const [status, setStatus] = useState(vehicle.status);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => formData.append(k, form[k]));
      formData.append('fuelType', fuelType);
      formData.append('transmission', transmission);
      formData.append('status', status);
      if (photo) {
        formData.append('vehiclePhoto', { uri: photo.uri, name: 'vehicle.jpg', type: 'image/jpeg' });
      }

      await updateVehicle(vehicle._id, formData);
      Alert.alert('Success', 'Vehicle updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, shadows.small]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Vehicle</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={[styles.photoBox, shadows.small]} onPress={pickPhoto}>
            <Image
              source={{ uri: photo ? photo.uri : `${API_BASE}${vehicle.vehiclePhoto}` }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <View style={styles.photoOverlay}>
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          {[
            { key: 'make', label: 'Make', icon: 'car-outline' },
            { key: 'model', label: 'Model', icon: 'speedometer-outline' },
            { key: 'year', label: 'Year', icon: 'calendar-outline', keyboard: 'numeric' },
            { key: 'licensePlate', label: 'License Plate', icon: 'pricetag-outline', autoCapitalize: 'characters' },
            { key: 'pricePerDay', label: 'Price Per Day (LKR)', icon: 'cash-outline', keyboard: 'decimal-pad' },
            { key: 'seatingCapacity', label: 'Seating Capacity', icon: 'people-outline', keyboard: 'numeric' },
          ].map((f) => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={f.icon} size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
                <TextInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={(v) => update(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                  autoCapitalize={f.autoCapitalize || 'none'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          ))}

          <Text style={styles.label}>Fuel Type</Text>
          <View style={styles.chipRow}>
            {FUEL_TYPES.map((f) => (
              <TouchableOpacity key={f} style={[styles.chip, fuelType === f && styles.chipActive]} onPress={() => setFuelType(f)}>
                <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Transmission</Text>
          <View style={styles.chipRow}>
            {TRANSMISSIONS.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, transmission === t && styles.chipActive]} onPress={() => setTransmission(t)}>
                <Text style={[styles.chipText, transmission === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.chipRow}>
            {VEHICLE_STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.submitButton, shadows.medium, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Vehicle</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { padding: 20 },
  photoBox: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  photoPreview: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', bottom: 10, right: 10, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 12 },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  submitButton: { backgroundColor: colors.primary, borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default EditVehicleScreen;
