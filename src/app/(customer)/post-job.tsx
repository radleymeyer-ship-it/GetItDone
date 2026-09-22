import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Gardening',
  'Handyman',
  'Painting',
  'Moving',
];

export default function PostJobScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !category || !description.trim() || !location.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post a job.');
      return;
    }

    setLoading(true);

    try {
      const parsedBudget = budget.trim() ? parseFloat(budget.trim()) : null;

      const { error } = await supabase.from('jobs').insert([
        {
          customer_id: user.id,
          title: title.trim(),
          category,
          description: description.trim(),
          location: location.trim(),
          budget: parsedBudget,
          status: 'open',
        },
      ]);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Your job request has been posted!', [
          {
            text: 'View My Jobs',
            onPress: () => router.replace('/(customer)/jobs'),
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Unexpected Error', err.message || 'Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Post a Job Request</Text>
        <Text style={styles.subheading}>Tell local service providers what you need done.</Text>

        <Input
          label="Job Title *"
          placeholder="e.g. Fix leaking kitchen pipe"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                category === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Location / Area *"
          placeholder="e.g. Sandton, Johannesburg"
          value={location}
          onChangeText={setLocation}
        />

        <Input
          label="Estimated Budget (ZAR - Optional)"
          placeholder="e.g. 850"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Input
          label="Detailed Description *"
          placeholder="Describe the issue, required tools, preferred time..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Button
          title={loading ? 'Posting...' : 'Post Job'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg },
  heading: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  subheading: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 8 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.md },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  categoryText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '500' },
  categoryTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  submitBtn: { marginTop: Theme.spacing.md },
});