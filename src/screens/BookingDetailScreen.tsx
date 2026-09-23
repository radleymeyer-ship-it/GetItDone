import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ChatBox from '../components/chat/ChatBox';

export default function BookingDetailScreen() {
  // Temporary test IDs (replace with dynamic auth/booking data later)
  const dummyBookingId = "11111111-1111-1111-1111-111111111111";
  const dummyCurrentUserId = "22222222-2222-2222-2222-222222222222";
  const dummyRecipientId = "33333333-3333-3333-3333-333333333333";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Chat</Text>
      </View>

      <ChatBox
        bookingId={dummyBookingId}
        currentUserId={dummyCurrentUserId}
        recipientId={dummyRecipientId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
});