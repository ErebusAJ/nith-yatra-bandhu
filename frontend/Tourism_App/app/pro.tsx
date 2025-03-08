import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

const subscriptions = [
  {
    id: "basic",
    title: "Explorer",
    price: "Free",
    features: [
      "Personalized travel recommendations (Basic)",
      "Travel buddy",
      "Community Spotlights",
      "Ads",
    ],
  },
  {
    id: "premium",
    title: "Voyager",
    price: "₹49.99/month",
    features: [
      "Unlimited Plan Customization",
      "Interest based buddy matching",
      "Smart deals",
      "Ad free",
    ],
  },
  {
    id: "elite",
    title: "Trailblazer",
    price: "₹99.99/month",
    features: [
      "All Premium+",
      "Personalized AI trips",
      "No Travel buddy deposit",
      "Exclusive Partner Deals",
    ],
  },
];

const SubscriptionScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = (id) => {
    setSelectedPlan(id);
  };

  const handleProceed = () => {
    if (selectedPlan) {
      console.log("Proceeding with plan:", selectedPlan);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Choose Your Travel Plan</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {subscriptions.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.card,
              selectedPlan === plan.id && styles.selectedCard,
            ]}
            onPress={() => handleSelectPlan(plan.id)}
          >
            <Text style={styles.title}>{plan.title}</Text>
            <Text style={styles.price}>{plan.price}</Text>
            {plan.features.map((feature, index) => (
              <Text key={index} style={styles.featureText}>
                • {feature}
              </Text>
            ))}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.proceedButton, !selectedPlan && styles.disabledButton]}
        onPress={handleProceed}
        disabled={!selectedPlan}
      >
        <Text style={styles.proceedButtonText}>Proceed</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: "#ffa952",
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    color: "#ffa952",
    fontWeight: "bold",
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#555",
  },
  proceedButton: {
    backgroundColor: "#ffa952",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  proceedButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
