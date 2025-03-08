import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import TravelCard from "./components/connect-cards";
import { SafeAreaView } from "react-native-safe-area-context";
import Taskbar from "./components/taskbar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Connect = () => {
  const navigation = useNavigation();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState({});
  const [sentRequests, setSentRequests] = useState({});

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.ID) {
            setCurrentUserId(parsedData.ID);
          } else {
            console.warn("User ID missing in stored data");
          }
        } else {
          console.warn("No user data found in storage");
        }
      } catch (error) {
        console.error("Error retrieving user ID:", error);
      }
    };

    getUserId();
  }, []);

  const handleConnect = async (receiverId, tripName) => {
    if (!currentUserId) {
      Alert.alert("Error", "You need to be logged in to connect with others");
      return;
    }

    if (sentRequests[receiverId]) {
      Alert.alert("Info", "You've already sent a request to this user.");
      return;
    }

    setIsLoading((prev) => ({ ...prev, [receiverId]: true }));

    try {
      // ✅ Create a new travel group
      const groupResponse = await axios.post(
        "https://yatra-bandhu-aj.onrender.com/travel-group",
        {
          name: tripName || "New Travel Group",
          description: "Let's plan a trip together!",
          createdBy: currentUserId,
        }
      );

      if (!groupResponse.data || !groupResponse.data.groupId) {
        throw new Error("Invalid response from server: groupId missing");
      }

      const newGroupId = groupResponse.data.groupId;
      await AsyncStorage.setItem("groupId", newGroupId);

      // ✅ Send connection request
      const requestResponse = await axios.post(
        `https://yatra-bandhu-aj.onrender.com/travel-group/${newGroupId}/request`,
        {
          senderId: currentUserId,
          receiverId: receiverId,
        }
      );

      setSentRequests((prev) => ({ ...prev, [receiverId]: true }));
      Alert.alert("Success", "Connection Request Sent!");

      navigation.navigate("Notifications", { groupId: newGroupId });
    } catch (error) {
      console.error("Error during connection process:", error);

      let errorMessage = "Something went wrong.";
      if (error.response) {
        errorMessage = `Server error: ${
          error.response.data.message || error.response.status
        }`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading((prev) => ({ ...prev, [receiverId]: false }));
    }
  };

  const travelersData = [
    { id: "user123", name: "Jessie", tripName: "LADAKH" },
    { id: "user456", name: "Andrew", tripName: "ARGENTINA" },
    { id: "user789", name: "Joseph", tripName: "JAPAN" },
    { id: "user101", name: "Kelly", tripName: "SWITZERLAND" },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.heading}>🌍 Connect</Text>
        <Text style={styles.subheading}>
          Meet like-minded travelers and explore together!
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {travelersData.map((traveler, index) => (
          <TravelCard
            key={index}
            image={`https://source.unsplash.com/featured/?travel,${traveler.tripName}`}
            title={traveler.tripName}
            profileImage={`https://randomuser.me/api/portraits/men/${index}.jpg`}
            name={traveler.name}
            description={`Join ${traveler.name} on a trip to ${traveler.tripName}!`}
            tripDates="TBD"
            groupSize="1/4"
            profiles={["https://randomuser.me/api/portraits/women/45.jpg"]}
            onConnect={() => handleConnect(traveler.id, traveler.tripName)}
            isLoading={isLoading[traveler.id]}
          />
        ))}
      </ScrollView>

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/createPlan")}
        disabled={Object.values(isLoading).some((loading) => loading)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Fixed Taskbar at the Bottom */}
      <View style={styles.taskbarContainer}>
        <Taskbar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subheading: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 100, // Space for Taskbar + Floating Button
  },
  taskbarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    elevation: 5,
  },
  floatingButton: {
    position: "absolute",
    bottom: 90, // Adjust above Taskbar
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
});

export default Connect;
