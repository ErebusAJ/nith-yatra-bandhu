import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ItineraryScreen = () => {
  const {
    location = "Jaipur",
    startDate = "2025-03-01",
    endDate = "2025-03-05",
  } = useLocalSearchParams();

  const [description, setDescription] = useState("");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawApiResponse, setRawApiResponse] = useState(""); // For debugging

  useEffect(() => {
    const fetchItinerary = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          alert("Session expired. Please log in again.");
          router.push("/sign-in");
          return;
        }

        const locationStr = Array.isArray(location) ? location[0] : location;
        const response = await fetch(
          "https://yatra-bandhu-aj.onrender.com/auth/ai-planner",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              location: locationStr,
              interests: "Viewpoints Foodie",
              days: 3,
            }),
          }
        );

        const text = await response.text();
        setRawApiResponse(text);

        if (!response.ok) {
          if (response.status === 401) {
            await AsyncStorage.removeItem("authToken");
            router.push("/sign-in");
          }
          return;
        }

        try {
          const data = JSON.parse(text);
          // Verify API response structure here
          setDescription(data.description || "No description available");
          setHotels(data.hotels || []);
        } catch (jsonError) {
          console.error("JSON Parse Error:", jsonError);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [location]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{location}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#ffa952" />
        ) : (
          <>
            <Text style={styles.description}>{description}</Text>

            {/* Debug Section */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}></Text>
              <Text style={styles.debugText}>{rawApiResponse}</Text>
            </View>

            <Text style={styles.sectionTitle}>Places to Stay</Text>
            {hotels.length === 0 ? (
              <Text style={styles.noHotelsText}>No hotels available.</Text>
            ) : (
              <FlatList
                data={hotels}
                horizontal
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.hotelCard}>
                    <Image
                      source={{
                        uri: item.image || "https://via.placeholder.com/120",
                      }}
                      style={styles.hotelImage}
                    />
                    <View style={styles.hotelInfo}>
                      <Text style={styles.hotelName}>
                        {item.name || "Unnamed Hotel"}
                      </Text>
                      <Text style={styles.hotelAddress}>
                        {item.address || "Address not available"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
  noHotelsText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginBottom: 10,
  },
  hotelCard: {
    width: 180,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginRight: 10,
    alignItems: "center",
  },
  hotelImage: { width: "100%", height: 120, borderRadius: 8, marginBottom: 5 },
  hotelInfo: { alignItems: "center" },
  hotelName: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  hotelAddress: { fontSize: 14, color: "#777", textAlign: "center" },
  debugContainer: {
    backgroundColor: "#fff",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  debugTitle: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  debugText: {
    color: "#000",
    fontSize: 15,
  },
});

export default ItineraryScreen;
//worked
