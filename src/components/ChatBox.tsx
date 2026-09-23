import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatProps {
  bookingId: string;
  currentUserId: string;
  recipientId: string;
}

export default function ChatBox({ bookingId, currentUserId, recipientId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Fetch initial message history
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // 2. Realtime listener for incoming messages
    const channel = supabase
      .channel(`chat_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      booking_id: bookingId,
      sender_id: currentUserId,
      receiver_id: recipientId,
      content: inputText.trim(),
    };

    setInputText('');

    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) {
      console.error('Failed to send message:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === currentUserId;
          return (
            <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
              <Text style={isMe ? styles.myText : styles.theirText}>{item.content}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  bubble: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: '80%' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#0284C7' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#E2E8F0' },
  myText: { color: '#FFFFFF', fontSize: 15 },
  theirText: { color: '#0F172A', fontSize: 15 },
  inputContainer: { flexDirection: 'row', paddingTop: 8, borderTopWidth: 1, borderColor: '#CBD5E1' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  sendButton: { backgroundColor: '#0284C7', marginLeft: 8, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 16 },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
});