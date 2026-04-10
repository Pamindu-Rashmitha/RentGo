import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, StatusBar, Platform, Alert, ActivityIndicator,
  TextInput, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers, deleteUser } from '../../api/userService';
import { colors, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const AdminUsersScreen = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(false);
  };

  const handleDelete = (userId, userName) => {
    if (userId === currentUser?._id) {
      Alert.alert('Action Denied', 'You cannot delete yourself.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers(false);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={[styles.userCard, shadows.small]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarTextMini}>
            {item.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.userNameText}>{item.name}</Text>
          <Text style={styles.userEmailText}>{item.email}</Text>
          <View style={[
            styles.roleBadge, 
            { backgroundColor: item.role === 'admin' ? colors.primaryBg : colors.bgAlt }
          ]}>
            <Text style={[
              styles.roleText,
              { color: item.role === 'admin' ? colors.primary : colors.textMuted }
            ]}>
              {item.role?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item._id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, shadows.small]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textMuted} opacity={0.3} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarMini: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTextMini: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default AdminUsersScreen;
