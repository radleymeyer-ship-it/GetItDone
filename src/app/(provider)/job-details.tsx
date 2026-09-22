import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
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

export default function ProviderJobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quote Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const fetchJobDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to load job details.');
      } else {
        setJob(data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const handleSubmitQuote = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid numeric quote amount in ZAR.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a quote.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('quotes').insert({
        job_id: id,
        provider_id: user.id,
        amount: parseFloat(amount),
        estimated_duration: duration.trim() || 'Not specified',
        notes: notes.trim() || null,
        status: 'pending',
      });

      if (error) {
        Alert.alert('Quote Submission Failed', error.message);
      } else {
        setModalVisible(false);
        setAmount('');
        setDuration('');
        setNotes('');
        Alert.alert('Success!', 'Your quote has been submitted to the client.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit quote.');
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Job Opportunity</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <Text style={styles.categoryBadge}>{job.category || 'General'}</Text>
          <Text style={styles.statusBadge}>OPEN FOR QUOTES</Text>
        </View>

        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.infoText}>{job.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color={Theme.colors.primary} />
            <Text style={styles.infoText}>
              Client Budget: {job.budget ? `R ${Number(job.budget).toFixed(0)}` : 'Flexible / Open'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Job Description</Text>
        <Text style={styles.description}>{job.description}</Text>

        <Button
          title="Submit a Quote"
          onPress={() => setModalVisible(true)}
          style={styles.quoteBtn}
        />
      </ScrollView>

      {/* Submit Quote Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Quote</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Quote Amount (ZAR)*</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencyPrefix}>R</Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="e.g. 850"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.inputLabel}>Estimated Time Frame</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2 hours / Same day"
              value={duration}
              onChangeText={setDuration}
            />

            <Text style={styles.inputLabel}>Message / Scope Details</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Include parts, callout fee, or availability notes..."
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Send Quote"
                onPress={handleSubmitQuote}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  statusBadge: { fontSize: 11, fontWeight: '800', backgroundColor: '#DEF7EC', color: '#03543F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
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
  sectionHeading: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 8 },
  description: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quoteBtn: { marginTop: 8 },
  errorText: { fontSize: 16, color: Theme.colors.textSecondary },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 6, marginTop: 10 },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#F9FAFB',
  },
  currencyPrefix: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginRight: 8 },
  currencyInput: { flex: 1, fontSize: 16, color: Theme.colors.textPrimary, fontWeight: '600' },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
});