import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { INITIAL_CATEGORIES } from '../constants/categories';
import { Theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function PostJobScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryId || INITIAL_CATEGORIES[0].id
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !suburb || !city) {
      Alert.alert('Missing Info', 'Please complete all required fields.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'You must be signed in to post a job.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('jobs').insert([
      {
        customer_id: user.id,
        category_id: selectedCategory,
        title,
        description,
        suburb,
        city,
        province,
        status: 'open',
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Post Failed', error.message);
    } else {
      Alert.alert('Job Posted!', 'Local pros in your area will be notified.', [
        {
          text: 'View My Jobs',
          onPress: () => router.replace('/(customer)/jobs' as any),
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.topTitle}>Post a Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>1. Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
          {INITIAL_CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategory;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionHeading}>2. Job Details</Text>
        <Input
          label="Job Title *"
          placeholder="e.g. Fix leaking kitchen tap"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description *"
          placeholder="Describe the issue or project in detail..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionHeading}>3. Location</Text>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              label="Suburb *"
              placeholder="e.g. Sandton"
              value={suburb}
              onChangeText={setSuburb}
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              label="City *"
              placeholder="e.g. Johannesburg"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <Input
          label="Province *"
          placeholder="e.g. Gauteng"
          value={province}
          onChangeText={setProvince}
        />

        <Button
          title={loading ? 'Submitting...' : 'Post Job Request'}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  backBtn: { padding: 4 },
  backText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 16 },
  topTitle: { fontSize: 17, fontWeight: '700', color: Theme.colors.textPrimary },
  scrollContent: { padding: Theme.spacing.lg },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  categoryPicker: { flexDirection: 'row', marginBottom: Theme.spacing.md },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary },
  categoryChipTextActive: { color: '#FFFFFF' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Theme.spacing.md },
  halfWidth: { flex: 1 },
  submitBtn: { marginTop: Theme.spacing.lg },
});