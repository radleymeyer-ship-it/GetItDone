import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
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

const CATEGORIES = [
  'All',
  'Plumbing',
  'Electrical',
  'Handyman',
  'Cleaning',
  'Gardening',
  'Painting',
  'Moving',
];

export default function ProviderFeedScreen() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOpenJobs = useCallback(async () => {
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'All') {
        query = query.ilike('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching provider feed:', error.message);
      } else if (data) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Unexpected error in feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      fetchOpenJobs();
    }, [fetchOpenJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpenJobs();
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      (job.description && job.description.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q))
    );
  });

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(provider)/job-details',
          params: { id: item.id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
        {item.budget ? (
          <Text style={styles.budgetText}>R {Number(item.budget).toFixed(0)}</Text>
        ) : (
          <Text style={styles.noBudgetText}>Budget open</Text>
        )}
      </View>

      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.infoText}>{item.location || 'Location specified on response'}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Jobs</Text>
        <Text style={styles.subtitle}>Find leads and submit quotes in South Africa</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, description, or suburb..."
            placeholderTextColor={Theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={
            filteredJobs.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="construct-outline" size={48} color={Theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No open jobs found</Text>
              <Text style={styles.emptySub}>
                Try changing your search keywords or switching category filters.
              </Text>
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
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary },
  subtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Theme.colors.textPrimary },
  categoryScroll: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipActive: { backgroundColor: Theme.colors.primary },
  chipText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { fontSize: 12, fontWeight: '700', color: Theme.colors.primary, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  budgetText: { fontSize: 15, fontWeight: '800', color: '#059669' },
  noBudgetText: { fontSize: 12, color: Theme.colors.textSecondary, italic: 'italic' },
  jobTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 4 },
  description: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: Theme.colors.textSecondary },
  dateText: { fontSize: 11, color: Theme.colors.textSecondary },
});