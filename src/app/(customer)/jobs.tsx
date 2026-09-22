import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  budget: number | null;
  status: string;
  created_at: string;
}

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error.message);
      } else if (data) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Re-fetch automatically whenever the user navigates onto this screen
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(customer)/job-details', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
        <Text style={[styles.statusBadge, item.status === 'open' ? styles.statusOpen : styles.statusDone]}>
          {(item.status || 'OPEN').toUpperCase()}
        </Text>
      </View>

      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        {item.budget ? (
          <Text style={styles.budgetText}>R {Number(item.budget).toFixed(0)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Posted Jobs</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(customer)/post-job')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="clipboard-outline" size={48} color={Theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No jobs posted yet</Text>
              <Text style={styles.emptySub}>Tap "Post Job" to request a local service.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  listContent: { padding: Theme.spacing.lg, gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { fontSize: 12, fontWeight: '700', color: Theme.colors.primary, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  statusOpen: { backgroundColor: '#DEF7EC', color: '#03543F' },
  statusDone: { backgroundColor: '#E5E7EB', color: '#374151' },
  jobTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 4 },
  description: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: Theme.colors.textSecondary },
  budgetText: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
});