import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert, TextInput,
  RefreshControl, Modal, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getTickets, createTicket, updateTicket } from '../../api/maintenanceService';
import { getVehicles } from '../../api/vehicleService';
import { colors, formatDate, formatStatus, statusColors, shadows } from '../../theme';

const TYPES = ['Routine_Service', 'Damage_Repair', 'Inspection', 'Other'];

const AdminMaintenanceScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [ticketTitle, setTicketTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getVehicles();
      setVehicles(res.data);
    } catch (err) { console.error(err); }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchTickets();
  }, []));

  const openCreateModal = async () => {
    await fetchVehicles();
    setShowCreate(true);
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      if (result.assets.length > 5) {
        Alert.alert('Limit Exceeded', 'Maximum 5 damage photos allowed. Only the first 5 will be kept.');
      }
      setPhotos(result.assets.slice(0, 5));
    }
  };

  const handleCreate = async () => {
    if (!selectedVehicle || !ticketTitle || !description || !maintenanceType || !scheduledDate) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vehicleId', selectedVehicle);
      formData.append('ticketTitle', ticketTitle);
      formData.append('description', description);
      formData.append('maintenanceType', maintenanceType);
      formData.append('scheduledDate', scheduledDate.toISOString());
      photos.forEach((p) => {
        formData.append('damagePhotos', { uri: p.uri, name: 'photo.jpg', type: 'image/jpeg' });
      });

      await createTicket(formData);
      Alert.alert('Success', 'Maintenance ticket created.');
      setShowCreate(false);
      resetForm();
      fetchTickets();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setTicketTitle('');
    setDescription('');
    setMaintenanceType('');
    setScheduledDate(null);
    setPhotos([]);
  };

  const handleStatusChange = (id, currentStatus) => {
    if (currentStatus === 'Open') {
      Alert.alert('Update Status', 'Choose action:', [
        { text: 'Start Progress', onPress: () => doUpdate(id, 'In_Progress') },
        { text: 'Cancel Ticket', onPress: () => doUpdate(id, 'Cancelled'), style: 'destructive' },
        { text: 'Dismiss', style: 'cancel' },
      ]);
    } else if (currentStatus === 'In_Progress') {
      Alert.alert('Complete Ticket', 'Mark maintenance as completed?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => doUpdate(id, 'Completed') },
      ]);
    }
  };

  const doUpdate = async (id, status) => {
    try {
      await updateTicket(id, { status });
      Alert.alert('Updated', `Ticket set to ${formatStatus(status)}.`);
      fetchTickets();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update.');
    }
  };

  const renderTicket = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.Open;
    const v = item.vehicleId;
    const canUpdate = ['Open', 'In_Progress'].includes(item.status);
    return (
      <TouchableOpacity 
        style={[styles.card, shadows.small]} 
        activeOpacity={0.7}
        onPress={() => { setSelectedTicket(item); setShowDetail(true); }}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketTitle}>{item.ticketTitle}</Text>
            <Text style={styles.vehicleSub}>{v?.make} {v?.model} • {v?.licensePlate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardBottom}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{formatStatus(item.maintenanceType)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.scheduledDate)}</Text>
        </View>
        {canUpdate && (
          <TouchableOpacity style={[styles.updateBtn, shadows.small]} onPress={() => handleStatusChange(item._id, item.status)}>
            <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.updateText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const today = new Date();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>Maintenance</Text>
        <TouchableOpacity style={[styles.addButton, shadows.small]} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No maintenance tickets</Text>
            </View>
          }
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowCreate(false)} />
          <View style={[styles.modalContent, shadows.medium]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.modalIndicator} />
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>New Maintenance Ticket</Text>
                  <TouchableOpacity onPress={() => setShowCreate(false)}>
                    <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Select Vehicle</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {vehicles.map((v) => (
                  <TouchableOpacity key={v._id}
                    style={[styles.vehicleChip, selectedVehicle === v._id && styles.vehicleChipActive]}
                    onPress={() => setSelectedVehicle(v._id)}
                  >
                    <Text style={[styles.vehicleChipText, selectedVehicle === v._id && { color: colors.primary }]}>
                      {v.make} {v.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Ticket Title</Text>
              <TextInput style={styles.modalInput} value={ticketTitle} onChangeText={setTicketTitle} placeholder="e.g. Oil Change, Brake Fix..." placeholderTextColor={colors.textMuted} />

              <Text style={styles.label}>Detailed Description</Text>
              <TextInput style={[styles.modalInput, { minHeight: 100, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe the maintenance needed..." placeholderTextColor={colors.textMuted} multiline />

              <Text style={styles.label}>Maintenance Type</Text>
              <View style={styles.chipRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, maintenanceType === t && styles.chipActive]} onPress={() => setMaintenanceType(t)}>
                    <Text style={[styles.chipText, maintenanceType === t && styles.chipTextActive]}>{formatStatus(t)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Schedule Date</Text>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateBoxText}>{scheduledDate ? formatDate(scheduledDate) : 'Select a date'}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={scheduledDate || today}
                  mode="date"
                  minimumDate={today}
                  onChange={(e, d) => { setShowDatePicker(false); if (d) setScheduledDate(d); }}
                />
              )}

              <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos}>
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.photoBtnText}>{photos.length > 0 ? `${photos.length} photo(s) selected` : 'Add damage photos'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitButton, shadows.small, submitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Ticket</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal visible={showDetail} transparent animationType="fade" onRequestClose={() => setShowDetail(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDetail(false)} />
          <View style={[styles.modalContent, shadows.medium]}>
            {selectedTicket && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIndicator} />
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>Ticket Details</Text>
                    <TouchableOpacity onPress={() => setShowDetail(false)}>
                      <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedTicket.ticketTitle}</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: statusColors[selectedTicket.status]?.bg, 
                    borderColor: statusColors[selectedTicket.status]?.border,
                    alignSelf: 'flex-start',
                    marginTop: 8
                  }]}>
                    <Text style={[styles.statusText, { color: statusColors[selectedTicket.status]?.text }]}>
                      {formatStatus(selectedTicket.status)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoCard, { marginBottom: 20 }]}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle</Text>
                    <Text style={styles.infoValue}>{selectedTicket.vehicleId?.make} {selectedTicket.vehicleId?.model}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Plate Number</Text>
                    <Text style={styles.infoValue}>{selectedTicket.vehicleId?.licensePlate}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>{formatStatus(selectedTicket.maintenanceType)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Scheduled Date</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedTicket.scheduledDate)}</Text>
                  </View>
                </View>

                <Text style={styles.label}>Description</Text>
                <View style={styles.descBox}>
                  <Text style={styles.descFullText}>{selectedTicket.description}</Text>
                </View>

                {selectedTicket.damagePhotos?.length > 0 && (
                  <>
                    <Text style={[styles.label, { marginTop: 20 }]}>Damage Photos ({selectedTicket.damagePhotos.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                      {selectedTicket.damagePhotos.map((photo, i) => (
                        <View key={i} style={styles.photoContainer}>
                          <Image 
                            source={{ uri: `http://192.168.1.8:5000/${photo}` }} 
                            style={styles.damagePhoto} 
                            resizeMode="cover" 
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

                <TouchableOpacity 
                  style={[styles.closeDetailBtn, shadows.small]} 
                  onPress={() => setShowDetail(false)}
                >
                  <Text style={styles.closeDetailText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  ticketTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  descText: { fontSize: 14, color: colors.textSecondary, marginBottom: 14, lineHeight: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { backgroundColor: colors.blueBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, color: colors.blue, fontWeight: '700' },
  dateText: { fontSize: 12, color: colors.textMuted },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: colors.cardBorder },
  updateText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, marginTop: 4 },
  modalInput: { backgroundColor: colors.card, borderRadius: 16, padding: 16, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 },
  vehicleChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 8 },
  vehicleChipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  vehicleChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: colors.cardBorder, gap: 12, marginBottom: 16 },
  dateBoxText: { fontSize: 15, color: colors.text },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 16, height: 56, borderWidth: 1, borderColor: colors.cardBorder, gap: 10, marginBottom: 20 },
  photoBtnText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  submitButton: { backgroundColor: colors.primary, borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  detailHeader: { marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  infoCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.cardBorder },
  descBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  descFullText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  photoList: { flexDirection: 'row', gap: 12, marginTop: 10 },
  photoContainer: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 12 },
  damagePhoto: { width: 120, height: 120 },
  closeDetailBtn: { backgroundColor: colors.primary, borderRadius: 16, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 10 },
  closeDetailText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AdminMaintenanceScreen;
