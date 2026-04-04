import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert, TextInput,
  RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getBookings } from '../../api/bookingService';
import { getVehicleReviews, createReview, updateReview, deleteReview } from '../../api/reviewService';
import { colors, formatCurrency, shadows } from '../../theme';

const MyReviewsScreen = () => {
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      const res = await getBookings({ status: 'Completed' });
      const bookings = res.data.bookings || [];
      const uniqueVehicles = [];
      const seen = new Set();
      for (const b of bookings) {
        const vId = b.vehicleId?._id;
        if (vId && !seen.has(vId)) {
          seen.add(vId);
          try {
            const rRes = await getVehicleReviews(vId);
            const userReview = (rRes.data.reviews || []).find(r => r.userId === currentUser?._id);
            uniqueVehicles.push({
              vehicle: b.vehicleId,
              existingReview: userReview,
              allReviews: rRes.data.reviews || [],
            });
          } catch {
            uniqueVehicles.push({ vehicle: b.vehicleId, existingReview: null, allReviews: [] });
          }
        }
      }
      setCompletedBookings(uniqueVehicles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchData();
  }, []));

  const handleSubmitReview = async (vehicleId) => {
    if (rating < 1 || rating > 5) { Alert.alert('Error', 'Please select a rating (1-5).'); return; }
    if (comment.trim().length < 10) { Alert.alert('Error', 'Comment must be at least 10 characters.'); return; }

    setSubmitting(true);
    try {
      if (editingReview) {
        await updateReview(editingReview, { rating, comment: comment.trim() });
        Alert.alert('Updated', 'Review updated successfully.');
      } else {
        await createReview({ vehicleId, rating, comment: comment.trim() });
        Alert.alert('Submitted', 'Review submitted successfully.');
      }
      setRating(0); setComment(''); setEditingReview(null); setExpandedVehicle(null);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteReview(reviewId);
          fetchData();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete.');
        }
      }},
    ]);
  };

  const renderStarPicker = () => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => setRating(s)}>
          <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={32} color="#F59E0B" style={{ marginRight: 4 }} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }) => {
    const v = item.vehicle;
    const isExpanded = expandedVehicle === v._id;
    return (
      <View style={[styles.card, shadows.small]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => {
            if (isExpanded) { setExpandedVehicle(null); setEditingReview(null); }
            else { setExpandedVehicle(v._id); setRating(0); setComment(''); setEditingReview(null); }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
            <Text style={styles.vehicleSub}>{v.year}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {item.existingReview && !isExpanded && (
          <View style={styles.existingBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.existingText}>Reviewed</Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.reviewForm}>
            {renderStarPicker()}
            <TextInput
              style={styles.commentInput}
              placeholder="Write your review (min 10 chars)..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitButton, shadows.small, submitting && { opacity: 0.7 }]}
              onPress={() => handleSubmitReview(v._id)}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.submitText}>{editingReview ? 'Update Review' : 'Submit Review'}</Text>
              )}
            </TouchableOpacity>

            {item.allReviews.filter(r => r.userId === currentUser?._id).map((r) => (
              <View key={r._id} style={styles.reviewItem}>
                <View style={styles.reviewRow}>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
                    ))}
                  </View>
                  {r.userId === currentUser?._id && (
                    <View style={styles.reviewActions}>
                      <TouchableOpacity onPress={() => { setEditingReview(r._id); setRating(r.rating); setComment(r.comment); }}>
                        <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(r._id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.bgCircle} />
      <View style={styles.header}><Text style={styles.title}>My Reviews</Text></View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={completedBookings}
          keyExtractor={(item) => item.vehicle._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="star-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Complete a rental to leave a review</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(245, 158, 11, 0.04)', top: -40, left: -60 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  existingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  existingText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  reviewForm: { paddingHorizontal: 16, paddingBottom: 16 },
  starRow: { flexDirection: 'row', marginBottom: 14 },
  commentInput: { backgroundColor: colors.bg, borderRadius: 14, padding: 14, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.cardBorder, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 14, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  reviewItem: { backgroundColor: colors.primaryBg, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.primaryBorder },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewStars: { flexDirection: 'row' },
  reviewActions: { flexDirection: 'row', gap: 12 },
  reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});

export default MyReviewsScreen;
