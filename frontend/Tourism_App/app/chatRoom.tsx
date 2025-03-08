"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Type definitions
interface ChatGroup {
  id: string;
  name: string;
  memberCount: number;
  location: string;
  createdAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isUser?: boolean;
}

const ChatRoomScreen = () => {
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatGroup();
  }, [groupId]);

  const loadChatGroup = async () => {
    try {
      setLoading(true);
      const storedGroups = await AsyncStorage.getItem("chatGroups");
      const parsedGroups: ChatGroup[] = storedGroups
        ? JSON.parse(storedGroups)
        : [];
      const currentGroup = parsedGroups.find((g) => g.id === groupId);

      if (currentGroup) {
        setGroup(currentGroup);
        setMessages(currentGroup.messages || []);

        // If no messages, add a welcome message
        if (!currentGroup.messages || currentGroup.messages.length === 0) {
          const welcomeMessage = {
            id: "welcome",
            text: `Welcome to the ${currentGroup.name} group chat! Share your travel plans and connect with fellow travelers.`,
            sender: "YatraBandhu",
            timestamp: new Date().toISOString(),
            isUser: false,
          };

          setMessages([welcomeMessage]);

          // Update AsyncStorage with welcome message
          currentGroup.messages = [welcomeMessage];
          await AsyncStorage.setItem(
            "chatGroups",
            JSON.stringify(parsedGroups)
          );
        }
      }
    } catch (error) {
      console.error("Error loading chat group:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !group) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: "You", // In a real app, this would be the current user's name
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setNewMessage("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Update AsyncStorage
      const storedGroups = await AsyncStorage.getItem("chatGroups");
      const parsedGroups: ChatGroup[] = storedGroups
        ? JSON.parse(storedGroups)
        : [];
      const updatedGroups = parsedGroups.map((g) => {
        if (g.id === groupId) {
          return { ...g, messages: updatedMessages };
        }
        return g;
      });

      await AsyncStorage.setItem("chatGroups", JSON.stringify(updatedGroups));
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser
          ? styles.userMessageContainer
          : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessageBubble : styles.otherMessageBubble,
        ]}
      >
        {!item.isUser && (
          <Text style={styles.messageSender}>{item.sender}</Text>
        )}
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.otherMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa952" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}{" "}
            • {group.location}
          </Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() ? styles.sendButtonDisabled : {},
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  infoButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#777",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#ffa952",
    fontSize: 16,
    fontWeight: "bold",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    paddingBottom: 8,
  },
  userMessageBubble: {
    backgroundColor: "#ffa952",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.5)",
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffa952",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default ChatRoomScreen;
