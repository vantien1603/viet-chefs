import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const CartScreen = () => {
  const [quantity, setQuantity] = useState(1);
  const handleBack = () => {
    router.push("home");
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.btnBack} onPress={handleBack}>
          <Ionicons name="arrow-back-sharp" size={22} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.cartContent}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.imageBg}>
            <Image
              source={require("../../../assets/images/1.jpg")}
              style={styles.image}
            />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Food Name</Text>
            <Text style={{ color: "#555", fontSize: 12 }}>
              The dish cooked by{" "}
              <Text style={{ fontWeight: "bold" }}>'someone'</Text>
            </Text>
            <Text style={{ fontSize: 15 }}>$ Price</Text>
            <View style={styles.quantity}>
              <TouchableOpacity onPress={decreaseQuantity}>
                <Ionicons name="remove-circle" size={30} color={quantity > 1 ? "black" : "#ccc"} />
              </TouchableOpacity>
              <Text style={styles.count}>{quantity}</Text>
              <TouchableOpacity onPress={increaseQuantity}>
                <Ionicons name="add-circle" size={30} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.checkoutContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>Sub total</Text>
          <Text style={styles.priceText}>$ Price</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>Delivery fee</Text>
          <Text style={styles.priceText}>$ Price</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>$ Price</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#EBE5DD",
    flex: 1,
  },
  container: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  btnBack: {
    backgroundColor: "#FFF8EF",
    padding: 10,
    borderRadius: 50,
  },
  cartContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageBg: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#A9411D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginHorizontal: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  count: {
    fontSize: 20,
    marginHorizontal: 10,
  },

  checkoutContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceText: {
    fontSize: 16,
    color: "#555",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 10,
  },
  checkoutButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CartScreen;
