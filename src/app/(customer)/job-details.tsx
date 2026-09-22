import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
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

interface Quote {
  id: string;
  provider_id: string;
  amount: number;
  estimated_duration: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobAndQuotes = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch Job Details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch Received Quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      setQuotes(quotesData || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobAndQuotes();
  }, [fetchJobAndQuotes]);

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;

      // If accepted, option to automatically set job to active or in progress
      if (newStatus === 'accepted') {
        await supabase
          .from('jobs')
          .update({ status: 'assigned' })
          .eq('id', id);
      }

      Alert.alert('Success', `Quote ${newStatus}.`);
      fetchJobAndQuotes();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update quote status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Deleted', 'Your job posting was deleted.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete job.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Job not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity onPress={handleDeleteJob} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <Text style={styles.categoryBadge}>{job.category || 'General'}</Text>
          <Text
            style={[
              styles.statusBadge,
              job.status === 'open' ? styles.statusOpen : styles.statusDone,
            ]}
          >
            {(job.status || 'OPEN').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.infoText}>{job.location}</Text>
          </View>
          {job.budget && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color={Theme.colors.primary} />
              <Text style={styles.infoText}>Budget: R {Number(job.budget).toFixed(0)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeading}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>

        {/* Received Quotes Section */}
        <Text style={styles.sectionHeading}>Received Quotes ({quotes.length})</Text>

        {quotes.length === 0 ? (
          <View style={styles.noQuotesCard}>
            <Ionicons name="time-outline" size={32} color={Theme.colors.textSecondary} />
            <Text style={styles.noQuotesTitle}>No quotes received yet</Text>
            <Text style={styles.noQuotesSub}>
              Local pros will respond with estimates soon. Check back shortly!
            </Text>
          </View>
        ) : (
          quotes.map((quote) => (
            <View key={quote.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quotePrice}>R {Number(quote.amount).toFixed(0)}</Text>
                <Text
                  style={[
                    styles.quoteStatusBadge,
                    quote.status === 'accepted'
                      ? styles.acceptedBadge
                      : quote.status === 'rejected'
                      ? styles.rejectedBadge
                      : styles.pendingBadge,
                  ]}
                >
                  {quote.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.quoteDetailText}>Duration: {quote.estimated_duration}</Text>
              </View>

              {quote.notes ? (
                <Text style={styles.quoteNotes}>"{quote.notes}"</Text>
              ) : null}

              {quote.status === 'pending' && (
                <View style={styles.quoteActions}>
                  <Button
                    title="Reject"
                    variant="outline"
                    onPress={() => handleUpdateQuoteStatus(quote.id, 'rejected')}
                    loading={actionLoading}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Accept Quote"
                    onPress={() => handleUpdateQuoteStatus(quote.id, 'accepted')}
                    loading={actionLoading}
                    style={{ flex: 1, backgroundColor: '#059669' }}
                  />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.textPrimary },
  content: { padding: Theme.spacing.lg },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusOpen: { backgroundColor: '#DEF7EC', color: '#03543F' },
  statusDone: { backgroundColor: '#E5E7EB', color: '#374151' },
  title: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 16 },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: Theme.colors.textPrimary, fontWeight: '500' },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 8, marginTop: 12 },
  description: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorText: { fontSize: 16, color: Theme.colors.textSecondary },

  // Quotes List Styling
  noQuotesCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  noQuotesTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 8 },
  noQuotesSub: { fontSize: 13, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
  quoteCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quotePrice: { fontSize: 20, fontWeight: '800', color: '#059669' },
  quoteStatusBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  pendingBadge: { backgroundColor: '#FEF3C7', color: '#92400E' },
  acceptedBadge: { backgroundColor: '#DEF7EC', color: '#03543F' },
  rejectedBadge: { backgroundColor: '#FDE8E8', color: '#9B1C1C' },
  quoteDetailText: { fontSize: 13, color: Theme.colors.textSecondary },
  quoteNotes: { fontSize: 14, color: Theme.colors.textPrimary, fontStyle: 'italic', marginVertical: 8 },
  quoteActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});