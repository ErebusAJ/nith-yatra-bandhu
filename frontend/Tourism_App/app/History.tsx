"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons"; // Importing bin icon

const HistoryScreen = () => {
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to delete an itinerary
  const handleDeleteItinerary = async (id) => {
    try {
      const updatedItineraries = savedItineraries.filter(
        (itinerary) => itinerary.id !== id
      );
      setSavedItineraries(updatedItineraries);
      await AsyncStorage.setItem(
        "savedItineraries",
        JSON.stringify(updatedItineraries)
      );
    } catch (error) {
      console.error("Error deleting itinerary:", error);
    }
  };

  useEffect(() => {
    const fetchItineraries = async () => {
      setLoading(true);
      try {
        const data = await AsyncStorage.getItem("savedItineraries");
        setSavedItineraries(data ? JSON.parse(data) : []);
      } catch (error) {
        console.error("Error fetching itineraries:", error);
      }
      setLoading(false);
    };

    fetchItineraries();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Itineraries</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#ffa952" />
      ) : savedItineraries.length === 0 ? (
        <Text style={styles.noDataText}>No itineraries saved.</Text>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {savedItineraries.map((itinerary) => (
            <View key={itinerary.id} style={styles.itineraryCard}>
              {/* Trash Bin Icon (Delete Button) */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItinerary(itinerary.id)}
              >
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>

              <Text style={styles.cardTitle}>{itinerary.location}</Text>
              <Text style={styles.cardDate}>
                {itinerary.startDate} - {itinerary.endDate}
              </Text>

              {itinerary.timeline.map((day) => (
                <View key={day.day} style={styles.timelineItem}>
                  <Text style={styles.timelineDate}>
                    Day {day.day}: {day.date}
                  </Text>
                  <Text style={styles.timelinePlace}>{day.location}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
  scrollContainer: { flex: 1 },
  itineraryCard: {
    backgroundColor: "#fff9f2",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    position: "relative", // Ensures delete button is positioned correctly
  },
  cardTitle: { fontSize: 20, fontWeight: "bold" },
  cardDate: { fontSize: 16, color: "#777", marginBottom: 10 },
  timelineItem: {
    borderLeftWidth: 3,
    borderColor: "#ffa952",
    paddingLeft: 10,
    marginBottom: 10,
  },
  timelineDate: { fontSize: 16, fontWeight: "bold" },
  timelinePlace: { fontSize: 14, color: "#555" },
  button: {
    backgroundColor: "#ffa952",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Delete Button (Bin Icon)
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 20,
    padding: 6,
  },
});
