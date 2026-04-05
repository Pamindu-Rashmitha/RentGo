import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator, Alert,
  StatusBar, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateVehicle } from '../../api/vehicleService';
import { colors, shadows, getImageUri } from '../../theme';

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
  const [photos, setPhotos] = useState(vehicle.vehiclePhotos.map(p => ({ uri: getImageUri(p), isExisting: true })));
  const [newPhotos, setNewPhotos] = useState([]); // Photos picked during this session
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewPhotos(result.assets);
      // When new photos are picked, they replace the existing ones in the preview
      setPhotos(result.assets.slice(0, 5));
    }
  };

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    // If we removed a new photo, update newPhotos too
    setNewPhotos(updated.filter(p => !p.isExisting));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => formData.append(k, form[k]));
      formData.append('fuelType', fuelType);
      formData.append('transmission', transmission);
      formData.append('status', status);
      if (newPhotos.length > 0) {
        newPhotos.forEach((p, index) => {
          formData.append('vehiclePhotos', {
            uri: p.uri,
            name: `vehicle_${index}.jpg`,
            type: 'image/jpeg',
          });
        });
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
          <View style={styles.photoSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
              {photos.map((p, i) => (
                <View key={i} style={[styles.photoItem, shadows.small]}>
                  <Image source={{ uri: p.uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}>
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={[styles.addPhotoBox, shadows.small]} onPress={pickPhotos}>
                  <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={styles.photoCount}>{photos.length}/5 photos. Picking new ones replaces the old set.</Text>
          </View>

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
  photoSection: { marginBottom: 20 },
  photoList: { gap: 12, paddingRight: 20 },
  photoItem: { width: 140, height: 140, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  removePhotoBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12 },
  addPhotoBox: { width: 140, height: 140, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  photoCount: { color: colors.textMuted, fontSize: 11, marginTop: 8, fontWeight: '500' },
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
