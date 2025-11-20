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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { updateFriendCount } from '../utils/achievementManager';
import { useTheme } from '../contexts/ThemeContext';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  X,
  Check,
  UserMinus,
  User,
  Globe,
  Calendar,
  Inbox,
  UserCheck
} from 'lucide-react-native';

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
  const { theme } = useTheme();
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
      setFriends((friendsData as any) || []);

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
      setPendingRequests((pendingData as any) || []);
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

  const styles = getStyles(theme);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notLoggedIn}>
            <GlassView style={styles.notLoggedInGlass} intensity={20} tint="dark">
              <User size={48} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.notLoggedInText}>로그인이 필요합니다</Text>
              <Text style={styles.notLoggedInSubtext}>
                친구 시스템을 사용하려면 로그인해주세요
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>로그인하기</Text>
                </LinearGradient>
              </Pressable>
            </GlassView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background} style={styles.backgroundGradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <GlassView style={styles.iconButtonGlass} intensity={20}>
              <ArrowLeft size={24} color={theme.colors.text} />
            </GlassView>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>친구</Text>
            <Text style={styles.subtitle}>친구와 함께 경쟁하세요!</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <GlassView style={styles.searchGlass} intensity={20} tint="dark">
            <TextInput
              style={styles.searchInput}
              placeholder="친구 이름 검색..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <Pressable
              onPress={handleSearch}
              disabled={searching}
              style={styles.searchButton}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.searchButtonGradient}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Search size={20} color="#fff" />
                )}
              </LinearGradient>
            </Pressable>
          </GlassView>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>검색 결과</Text>
            <ScrollView style={styles.searchResultsList}>
              {searchResults.map((result) => (
                <View key={result.id} style={styles.searchResultWrapper}>
                  <GlassView style={styles.searchResultGlass} intensity={30} tint="dark">
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultUsername}>{result.username}</Text>
                      {result.country_code && (
                        <View style={styles.countryContainer}>
                          <Globe size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                          <Text style={styles.searchResultCountry}>{result.country_code}</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleAddFriend(result.id, result.username)}
                      style={styles.addButton}
                    >
                      <LinearGradient colors={theme.gradients.primary} style={styles.addButtonGradient}>
                        <UserPlus size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.addButtonText}>추가</Text>
                      </LinearGradient>
                    </Pressable>
                  </GlassView>
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
            style={styles.tabWrapper}
          >
            <GlassView
              style={styles.tabGlass}
              intensity={activeTab === 'friends' ? 40 : 20}
              tint={activeTab === 'friends' ? 'light' : 'dark'}
            >
              <Users size={16} color={activeTab === 'friends' ? theme.colors.text : theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                친구 ({friends.length})
              </Text>
            </GlassView>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTab('pending');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.tabWrapper}
          >
            <GlassView
              style={styles.tabGlass}
              intensity={activeTab === 'pending' ? 40 : 20}
              tint={activeTab === 'pending' ? 'light' : 'dark'}
            >
              <Inbox size={16} color={activeTab === 'pending' ? theme.colors.text : theme.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                요청 ({pendingRequests.length})
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </GlassView>
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
              tintColor={theme.colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : activeTab === 'friends' ? (
            friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={64} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
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
                  style={styles.friendCardWrapper}
                >
                  <GlassView style={styles.friendCardGlass} intensity={20} tint="dark">
                    <LinearGradient
                      colors={theme.gradients.primary}
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
                      <View style={styles.friendMetaContainer}>
                        {friend.friend_profile.country_code && (
                          <View style={styles.friendMetaItem}>
                            <Globe size={10} color={theme.colors.textSecondary} style={{ marginRight: 2 }} />
                            <Text style={styles.friendCountry}>
                              {friend.friend_profile.country_code}
                            </Text>
                          </View>
                        )}
                        <View style={styles.friendMetaItem}>
                          <Calendar size={10} color={theme.colors.textSecondary} style={{ marginRight: 2 }} />
                          <Text style={styles.friendDate}>
                            {new Date(friend.created_at).toLocaleDateString('ko-KR')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.friendActions}>
                      <View style={styles.compareButton}>
                        <Text style={styles.compareText}>비교</Text>
                        <ArrowLeft size={12} color={theme.colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend.id, friend.friend_profile.username);
                        }}
                        style={styles.removeButton}
                      >
                        <UserMinus size={18} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  </GlassView>
                </Pressable>
              ))
            )
          ) : pendingRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Inbox size={64} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>받은 요청이 없습니다</Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCardWrapper}>
                <GlassView style={styles.requestCardGlass} intensity={30} tint="dark">
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
                      <View style={styles.friendMetaItem}>
                        <Globe size={10} color={theme.colors.textSecondary} style={{ marginRight: 2 }} />
                        <Text style={styles.friendCountry}>
                          {request.friend_profile.country_code}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      onPress={() =>
                        handleAcceptRequest(request.id, request.friend_profile.username)
                      }
                      style={styles.acceptButton}
                    >
                      <LinearGradient colors={theme.gradients.success} style={styles.actionButtonGradient}>
                        <Check size={16} color="#fff" />
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectRequest(request.id)}
                      style={styles.rejectButton}
                    >
                      <LinearGradient colors={theme.gradients.error} style={styles.actionButtonGradient}>
                        <X size={16} color="#fff" />
                      </LinearGradient>
                    </Pressable>
                  </View>
                </GlassView>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'web' ? 40 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backButton: { marginRight: 16, borderRadius: 12, overflow: 'hidden' },
  iconButtonGlass: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchGlass: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 16, gap: 8 },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text, paddingHorizontal: 8, height: 40 },
  searchButton: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  searchButtonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchResultsContainer: { marginHorizontal: 20, marginBottom: 16, maxHeight: 200 },
  searchResultsTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 },
  searchResultsList: { maxHeight: 180 },
  searchResultWrapper: { marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  searchResultGlass: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12 },
  searchResultInfo: { flex: 1 },
  searchResultUsername: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  countryContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  searchResultCountry: { fontSize: 12, color: theme.colors.textSecondary },
  addButton: { borderRadius: 8, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  tabWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  tabGlass: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  tabText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.text, fontWeight: '700' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: theme.colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.colors.textSecondary },
  friendCardWrapper: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  friendCardGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  friendAvatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  friendInfo: { flex: 1 },
  friendUsername: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  friendMetaContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  friendMetaItem: { flexDirection: 'row', alignItems: 'center' },
  friendCountry: { fontSize: 12, color: theme.colors.textSecondary },
  friendDate: { fontSize: 11, color: theme.colors.textTertiary },
  friendActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compareButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compareText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
  removeButton: { padding: 4 },
  requestCardWrapper: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  requestCardGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  rejectButton: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  actionButtonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notLoggedIn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notLoggedInGlass: { padding: 32, alignItems: 'center', borderRadius: 24, width: '100%' },
  notLoggedInText: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
  notLoggedInSubtext: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24, textAlign: 'center' },
  loginButton: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  loginButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FriendsScreen;
