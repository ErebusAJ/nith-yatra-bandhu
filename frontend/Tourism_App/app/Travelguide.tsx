"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import Taskbar from "./components/taskbar";

const guides = [
  {
    id: "1",
    name: "Ravi Kumar",
    age: 35,
    rating: 4.8,
    phone: "+91 9876543210",
    image: "https://bootdey.com/img/Content/avatar/avatar5.png",
    experience: "10 years",
  },
  {
    id: "2",
    name: "Amit Singh",
    age: 29,
    rating: 4.5,
    phone: "+91 8765432109",
    image: "https://bootdey.com/img/Content/avatar/avatar1.png",
    experience: "7 years",
  },
  {
    id: "3",
    name: "Suresh Patil",
    age: 40,
    rating: 4.9,
    phone: "+91 7654321098",
    image: "https://bootdey.com/img/Content/avatar/avatar6.png",
    experience: "15 years",
  },
  {
    id: "4",
    name: "Anshul Kunwar",
    age: 45,
    rating: 4.2,
    phone: "+91 7654325098",
    image: "https://bootdey.com/img/Content/avatar/avatar5.png",
    experience: "11 years",
  },
  {
    id: "5",
    name: "Surender Jha",
    age: 40,
    rating: 3.9,
    phone: "+91 7654327652",
    image: "https://bootdey.com/img/Content/avatar/avatar2.png",
    experience: "03 years",
  },
  {
    id: "6",
    name: "Skibidi Patel",
    age: 40,
    rating: 5.0,
    phone: "+91 7656969690",
    image: "https://bootdey.com/img/Content/avatar/avatar6.png",
    experience: "25 years",
  },
];

const TravelGuidesScreen = () => {
  const [sortedGuides, setSortedGuides] = useState([...guides]);
  const [selectedGuide, setSelectedGuide] = useState(null);

  const sortByRating = () => {
    const sorted = [...sortedGuides].sort((a, b) => b.rating - a.rating);
    setSortedGuides(sorted);
  };

  const handleRequest = () => {
    Alert.alert("Request Sent", "Your request has been successfully sent!", [
      { text: "OK", onPress: () => setSelectedGuide(null) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hire a Travel Guide</Text>
        <TouchableOpacity onPress={sortByRating} style={styles.sortButton}>
          <Text style={styles.sortButtonText}>Sort by Rating</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedGuides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => setSelectedGuide(item)}
          >
            <Image source={{ uri: item.image }} style={styles.guideImage} />
            <View style={styles.guideInfo}>
              <Text style={styles.guideName}>{item.name}</Text>
              <Text style={styles.guideDetails}>Rating: {item.rating} ⭐</Text>
              <Text style={styles.guideDetails}>{item.location}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {selectedGuide && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={!!selectedGuide}
          onRequestClose={() => setSelectedGuide(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedGuide.image }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedGuide.name}</Text>
              <Text>Age: {selectedGuide.age}</Text>
              <Text>Rating: {selectedGuide.rating} ⭐</Text>
              <Text>Phone: {selectedGuide.phone}</Text>
              <Text>Experience: {selectedGuide.experience}</Text>
              <Text>Location: {selectedGuide.location}</Text>
              <TouchableOpacity
                style={styles.requestButton}
                onPress={handleRequest}
              >
                <Text style={styles.requestButtonText}>Request Guide</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Taskbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomColor: "#f5f5f5",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  sortButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  sortButtonText: {
    color: "#ffa952",
    fontWeight: "bold",
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    margin: 8,
    backgroundColor: "#faf5e4",
    borderRadius: 8,
    elevation: 2,
  },
  guideImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  guideDetails: {
    fontSize: 14,
    color: "#555",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  requestButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#ffa952",
    borderRadius: 5,
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default TravelGuidesScreen;
