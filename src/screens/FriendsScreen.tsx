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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { GlassView } from '../components/shared/GlassView';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  Check,
  X,
  Clock,
  User,
  MessageSquare,
  Shield,
  Trash2
} from 'lucide-react-native';

type FriendsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface FriendsScreenProps {
  navigation: FriendsScreenNavigationProp;
}

interface Friend {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'playing';
  last_seen: string;
  avatar_url?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  sender_username: string;
  created_at: string;
}

type TabType = 'friends' | 'requests' | 'search';

const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, themeMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadRequests();
    }
  }, [user, activeTab]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Get accepted friendships
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          user_id,
          status,
          created_at
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      // Extract friend IDs
      const friendIds = data.map(f => f.user_id === user.id ? f.friend_id : f.user_id);

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, last_seen, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Format friends data
      const formattedFriends = profiles.map(p => ({
        id: p.id,
        username: p.username,
        status: getStatus(p.last_seen),
        last_seen: p.last_seen,
        avatar_url: p.avatar_url
      }));

      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    try {
      // Get pending requests received by current user
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          created_at,
          profiles!friendships_user_id_fkey (
            username
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const formattedRequests = data.map((r: any) => ({
        id: r.id,
        sender_id: r.user_id,
        sender_username: r.profiles?.username || 'Unknown',
        created_at: r.created_at
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, last_seen, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id) // Exclude self
        .limit(20);

      if (error) throw error;

      // Filter out existing friends
      const friendIds = friends.map(f => f.id);
      const filteredResults = data
        .filter(p => !friendIds.includes(p.id))
        .map(p => ({
          id: p.id,
          username: p.username,
          status: getStatus(p.last_seen),
          last_seen: p.last_seen,
          avatar_url: p.avatar_url
        }));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    try {
      // Check if request already exists
      const { data: existing, error: checkError } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        Alert.alert('알림', '이미 친구이거나 요청을 보냈습니다.');
        return;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('성공', '친구 요청을 보냈습니다.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Remove from search results
      setSearchResults(prev => prev.filter(p => p.id !== friendId));
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('오류', '친구 요청 실패');
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadRequests();
      loadFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatus = (lastSeen: string): 'online' | 'offline' => {
    if (!lastSeen) return 'offline';
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000 ? 'online' : 'offline'; // 5 minutes
  };

  const styles = getStyles(theme);

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
            <Text style={styles.subtitle}>함께 플레이할 친구를 찾아보세요</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            <Pressable
              onPress={() => setActiveTab('friends')}
              style={styles.tabWrapper}
            >
              <GlassView
                style={styles.tabGlass}
                intensity={activeTab === 'friends' ? 40 : 20}
                tint={activeTab === 'friends' ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
              >
                <Users size={18} color={activeTab === 'friends' ? (themeMode === 'dark' ? theme.colors.text : '#fff') : theme.colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'friends' && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' }]}>
                  내 친구 {friends.length > 0 && `(${friends.length})`}
                </Text>
              </GlassView>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('requests')}
              style={styles.tabWrapper}
            >
              <GlassView
                style={styles.tabGlass}
                intensity={activeTab === 'requests' ? 40 : 20}
                tint={activeTab === 'requests' ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
              >
                <UserPlus size={18} color={activeTab === 'requests' ? (themeMode === 'dark' ? theme.colors.text : '#fff') : theme.colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'requests' && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' }]}>
                  요청 {requests.length > 0 && `(${requests.length})`}
                </Text>
              </GlassView>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('search')}
              style={styles.tabWrapper}
            >
              <GlassView
                style={styles.tabGlass}
                intensity={activeTab === 'search' ? 40 : 20}
                tint={activeTab === 'search' ? (themeMode === 'dark' ? 'light' : 'dark') : (themeMode === 'dark' ? 'dark' : 'light')}
              >
                <Search size={18} color={activeTab === 'search' ? (themeMode === 'dark' ? theme.colors.text : '#fff') : theme.colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'search' && { color: themeMode === 'dark' ? theme.colors.text : '#fff', fontWeight: '700' }]}>
                  친구 찾기
                </Text>
              </GlassView>
            </Pressable>
          </ScrollView>
        </View>

        {/* Content */}
        {!user ? (
          <View style={styles.centerContainer}>
            <GlassView style={styles.notLoggedInGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
              <User size={48} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>로그인이 필요합니다</Text>
              <Text style={styles.emptySubtext}>친구 기능을 사용하려면 로그인해주세요</Text>
            </GlassView>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {activeTab === 'search' && (
              <View style={styles.searchContainer}>
                <GlassView style={styles.searchGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                  <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="사용자 이름 검색..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchUsers}
                    returnKeyType="search"
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <X size={18} color={theme.colors.textSecondary} />
                    </Pressable>
                  )}
                </GlassView>
              </View>
            )}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <>
                  {activeTab === 'friends' && (
                    friends.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Users size={64} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>친구가 없습니다</Text>
                        <Text style={styles.emptySubtext}>친구 찾기 탭에서 새로운 친구를 찾아보세요!</Text>
                      </View>
                    ) : (
                      friends.map(friend => (
                        <View key={friend.id} style={styles.friendCardWrapper}>
                          <GlassView style={styles.friendCardGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                            <View style={styles.avatarContainer}>
                              <LinearGradient
                                colors={friend.status === 'online' ? ['#4ade80', '#22c55e'] : ['#94a3b8', '#64748b']}
                                style={styles.avatarGradient}
                              >
                                <Text style={styles.avatarText}>{friend.username[0].toUpperCase()}</Text>
                              </LinearGradient>
                              {friend.status === 'online' && <View style={styles.onlineBadge} />}
                            </View>
                            <View style={styles.friendInfo}>
                              <Text style={styles.friendName}>{friend.username}</Text>
                              <Text style={[styles.friendStatus, { color: friend.status === 'online' ? theme.colors.success : theme.colors.textTertiary }]}>
                                {friend.status === 'online' ? '온라인' : '오프라인'}
                              </Text>
                            </View>
                            <View style={styles.friendActions}>
                              <Pressable style={styles.actionButton}>
                                <MessageSquare size={20} color={theme.colors.textSecondary} />
                              </Pressable>
                            </View>
                          </GlassView>
                        </View>
                      ))
                    )
                  )}

                  {activeTab === 'requests' && (
                    requests.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <UserPlus size={64} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>받은 요청이 없습니다</Text>
                      </View>
                    ) : (
                      requests.map(request => (
                        <View key={request.id} style={styles.requestCardWrapper}>
                          <GlassView style={styles.requestCardGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                            <View style={styles.requestInfo}>
                              <Text style={styles.requestName}>{request.sender_username}</Text>
                              <Text style={styles.requestDate}>
                                {new Date(request.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={styles.requestActions}>
                              <Pressable
                                onPress={() => acceptRequest(request.id)}
                                style={[styles.requestButton, { backgroundColor: theme.colors.success + '20' }]}
                              >
                                <Check size={20} color={theme.colors.success} />
                              </Pressable>
                              <Pressable
                                onPress={() => rejectRequest(request.id)}
                                style={[styles.requestButton, { backgroundColor: theme.colors.error + '20' }]}
                              >
                                <X size={20} color={theme.colors.error} />
                              </Pressable>
                            </View>
                          </GlassView>
                        </View>
                      ))
                    )
                  )}

                  {activeTab === 'search' && (
                    searchResults.length === 0 && searchQuery.length > 0 ? (
                      <View style={styles.emptyContainer}>
                        <Search size={48} color={theme.colors.textTertiary} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
                      </View>
                    ) : (
                      searchResults.map(user => (
                        <View key={user.id} style={styles.friendCardWrapper}>
                          <GlassView style={styles.friendCardGlass} intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'}>
                            <View style={styles.avatarContainer}>
                              <LinearGradient
                                colors={['#6366f1', '#4f46e5']}
                                style={styles.avatarGradient}
                              >
                                <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
                              </LinearGradient>
                            </View>
                            <View style={styles.friendInfo}>
                              <Text style={styles.friendName}>{user.username}</Text>
                            </View>
                            <Pressable
                              onPress={() => sendFriendRequest(user.id)}
                              style={styles.addButton}
                            >
                              <UserPlus size={20} color={theme.colors.primary} />
                            </Pressable>
                          </GlassView>
                        </View>
                      ))
                    )
                  )}
                </>
              )}
            </ScrollView>
          </View>
        )}
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
  tabContainer: { marginBottom: 16 },
  tabContent: { paddingHorizontal: 20, gap: 12 },
  tabWrapper: { borderRadius: 16, overflow: 'hidden' },
  tabGlass: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderRadius: 16 },
  tabText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  contentContainer: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notLoggedInGlass: { padding: 40, alignItems: 'center', borderRadius: 24, width: '100%' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchGlass: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16 },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.text, height: '100%', zIndex: 10, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  loadingContainer: { paddingVertical: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
  friendCardWrapper: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  friendCardGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  avatarContainer: { marginRight: 16, position: 'relative' },
  avatarGradient: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.success, borderWidth: 2, borderColor: theme.colors.card },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  friendStatus: { fontSize: 12, fontWeight: '500' },
  friendActions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8 },
  requestCardWrapper: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  requestCardGlass: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  requestDate: { fontSize: 12, color: theme.colors.textTertiary },
  requestActions: { flexDirection: 'row', gap: 12 },
  requestButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.colors.primary + '20' },
});

export default FriendsScreen;
