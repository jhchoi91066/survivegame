import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { updateFriendCount } from '../utils/achievementManager';

type FriendsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface FriendsScreenProps {
  navigation: FriendsScreenNavigationProp;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile: {
    username: string;
    country_code?: string;
  };
}

interface SearchResult {
  id: string;
  username: string;
  country_code?: string;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      setLoading(true);

      // Load accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          friend_profile:profiles!friendships_friend_id_fkey (
            username,
            country_code
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (friendsError) throw friendsError;
      setFriends(friendsData || []);

      // Update achievement for friend count
      if (friendsData) {
        await updateFriendCount(friendsData.length);
      }

      // Load pending requests (received)
      const { data: pendingData, error: pendingError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          friend_profile:profiles!friendships_user_id_fkey (
            username,
            country_code
          )
        `)
        .eq('friend_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;
      setPendingRequests(pendingData || []);
    } catch (error) {
      console.error('Load friends error:', error);
      Alert.alert('오류', '친구 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, country_code')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user?.id)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('오류', '검색 중 문제가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string, username: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(user_id.eq.${user?.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user?.id})`)
        .single();

      if (existing) {
        Alert.alert('알림', '이미 친구이거나 요청을 보냈습니다.');
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', `${username}님에게 친구 요청을 보냈습니다.`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Add friend error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '친구 요청을 보낼 수 없습니다.');
    }
  };

  const handleAcceptRequest = async (friendshipId: string, username: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('성공', `${username}님과 친구가 되었습니다!`);
      await loadFriends();
    } catch (error) {
      console.error('Accept request error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('오류', '친구 요청을 수락할 수 없습니다.');
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadFriends();
    } catch (error) {
      console.error('Reject request error:', error);
      Alert.alert('오류', '요청을 거절할 수 없습니다.');
    }
  };

  const handleRemoveFriend = async (friendshipId: string, username: string) => {
    Alert.alert(
      '친구 삭제',
      `${username}님을 친구 목록에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await loadFriends();
            } catch (error) {
              console.error('Remove friend error:', error);
              Alert.alert('오류', '친구를 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notLoggedIn}>
            <Text style={styles.notLoggedInEmoji}>🔐</Text>
            <Text style={styles.notLoggedInText}>로그인이 필요합니다</Text>
            <Text style={styles.notLoggedInSubtext}>
              친구 시스템을 사용하려면 로그인해주세요
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>로그인하기</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>👥 친구</Text>
          <Text style={styles.subtitle}>친구와 함께 경쟁하세요!</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="친구 이름 검색..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable
            onPress={handleSearch}
            disabled={searching}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchButtonPressed,
            ]}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.searchButtonGradient}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>🔍</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>검색 결과</Text>
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((result) => (
                <View key={result.id} style={styles.searchResultCard}>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultUsername}>{result.username}</Text>
                    {result.country_code && (
                      <Text style={styles.searchResultCountry}>{result.country_code}</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleAddFriend(result.id, result.username)}
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.addButtonPressed,
                    ]}
                  >
                    <Text style={styles.addButtonText}>+ 추가</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => {
              setActiveTab('friends');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              친구 ({friends.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTab('pending');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              요청 ({pendingRequests.length})
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : activeTab === 'friends' ? (
            friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyText}>아직 친구가 없습니다</Text>
                <Text style={styles.emptySubtext}>위에서 친구를 검색해보세요!</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <Pressable
                  key={friend.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('FriendComparison', {
                      friendId: friend.friend_id,
                      friendUsername: friend.friend_profile.username,
                    });
                  }}
                  style={({ pressed }) => [
                    styles.friendCard,
                    pressed && styles.friendCardPressed,
                  ]}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.friendAvatar}
                  >
                    <Text style={styles.friendAvatarText}>
                      {friend.friend_profile.username[0].toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendUsername}>
                      {friend.friend_profile.username}
                    </Text>
                    {friend.friend_profile.country_code && (
                      <Text style={styles.friendCountry}>
                        {friend.friend_profile.country_code}
                      </Text>
                    )}
                    <Text style={styles.friendDate}>
                      친구된 날짜: {new Date(friend.created_at).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                  <View style={styles.friendActions}>
                    <Text style={styles.compareText}>기록 비교 ›</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.id, friend.friend_profile.username);
                      }}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.removeButtonPressed,
                      ]}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))
            )
          ) : pendingRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📬</Text>
              <Text style={styles.emptyText}>받은 요청이 없습니다</Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b']}
                  style={styles.friendAvatar}
                >
                  <Text style={styles.friendAvatarText}>
                    {request.friend_profile.username[0].toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendUsername}>
                    {request.friend_profile.username}
                  </Text>
                  {request.friend_profile.country_code && (
                    <Text style={styles.friendCountry}>
                      {request.friend_profile.country_code}
                    </Text>
                  )}
                </View>
                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() =>
                      handleAcceptRequest(request.id, request.friend_profile.username)
                    }
                    style={({ pressed }) => [
                      styles.acceptButton,
                      pressed && styles.acceptButtonPressed,
                    ]}
                  >
                    <Text style={styles.acceptButtonText}>✓</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRejectRequest(request.id)}
                    style={({ pressed }) => [
                      styles.rejectButton,
                      pressed && styles.rejectButtonPressed,
                    ]}
                  >
                    <Text style={styles.rejectButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonPressed: {
    opacity: 0.8,
  },
  searchButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 24,
  },
  searchResultsContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    maxHeight: 200,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  searchResultsList: {
    maxHeight: 180,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  searchResultCountry: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  friendCardPressed: {
    opacity: 0.7,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  friendCountry: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  friendDate: {
    fontSize: 11,
    color: '#475569',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    opacity: 0.8,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonPressed: {
    opacity: 0.8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonPressed: {
    opacity: 0.8,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '700',
  },
  notLoggedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  notLoggedInEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  notLoggedInText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  notLoggedInSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginButtonPressed: {
    opacity: 0.9,
  },
  loginButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default FriendsScreen;
