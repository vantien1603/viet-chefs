import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, StyleSheet, Text, View } from "react-native";
import Header from "../../../components/header";
import { router } from "expo-router";
import { commonStyles } from "../../../style"

const FoodDetailScreen = () => {
  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Food Detail" onRightPress={() => router.push("screen/Chefs/editFood")} rightIcon={"pencil"} />

      <View style={styles.imageContainer}>
        <Image source={require("../../../assets/images/1.jpg")} style={styles.image} />
      </View>

      <View>
        <Text style={styles.title}>CC</Text>
        <Text style={styles.subtitle}>Cooking time ~ 30 minutes</Text>
        <Text style={styles.infoText}>Type: Non-Veg</Text>
        <Text style={styles.infoText}>Category: Mon xao</Text>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          This is a sample text. This is a sample text. This is a sample text. This is a sample text. 
          This is a sample text. This is a sample text. This is a sample text. This is a sample text. 
          This is a sample text. This is a sample text. This is a sample text. This is a sample text.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: "90%",
    height: 200,
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "gray",
    lineHeight: 22,
  },
});


export default FoodDetailScreen;
