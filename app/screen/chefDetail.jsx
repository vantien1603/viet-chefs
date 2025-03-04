import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router } from "expo-router";
import AXIOS_API from "../../config/AXIOS_API";

const ChefDetail = () => {
  const [expanded, setExpanded] = useState(false);
  const fullText =
    "I am a highly skilled Vietnamese culinary expert with over 10 years of experience. Passionate about authentic flavors, I specialize in traditional dishes such as Pho, Banh Mi, and Fresh Spring Rolls. With a dedication to quality and a love for sharing my culinary heritage, I bring the flavors of Vietnam to your doorstep.";
  const previewText = fullText.slice(0, 100) + "...";
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const response = await AXIOS_API.get("/dishes");
        setDishes(response.data.content);
        console.log(response.data.content);
      } catch (error) {
        console.log("Error dishes:", error);
      }
    };
    fetchDishes();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EBE5DD" }}>
      <Header title={"Chef's Information"} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.profileContainer}>
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/avatar.png")}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>John Doe</Text>
              <Text style={styles.specialty}>Vietnamese Cuisine</Text>
              <View style={styles.starContainer}>
                {Array(5)
                  .fill()
                  .map((_, i) => (
                    <Icon key={i} name="star" size={20} color="#f5a623" />
                  ))}
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {expanded ? fullText : previewText}
          </Text>
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.seeAllText}>
              {expanded ? "See Less" : "See All"}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/screen/selectFood")}
            >
              <Text style={styles.buttonText}>Book now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured dish</Text>
          <TouchableOpacity onPress={() => router.push("/screen/allDish")}>
            <Text style={styles.viewAll}>All dishes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dishContainer}>
          {dishes.slice(0, 3).map((dishes, index) => (
            <View key={index} style={styles.dishCard}>
              <Image source={{ uri: dishes.imageUrl }} style={styles.dishImage} />
              <Text style={styles.dishName}>{dishes.name}</Text>
              <Text style={styles.dishDescription}>{dishes.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  title: {
    fontSize: 16,
    color: "black",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontWeight: "bold",
  },
  profileContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#b0532c",
  },
  textContainer: {
    marginLeft: 30,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  specialty: {
    fontSize: 16,
    color: "#777",
  },
  starContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  description: {
    textAlign: "left",
    color: "#555",
    marginBottom: 5,
  },
  seeAllText: {
    color: "#b0532c",
    fontWeight: "bold",
    marginBottom: 15,
    alignSelf: "flex-end",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    backgroundColor: "#b0532c",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAll: {
    fontSize: 14,
    color: "#b0532c",
  },
  dishContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  dishCard: {
    backgroundColor: "#b0532c",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
  },
  dishImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  dishName: {
    color: "#fff",
    fontWeight: "bold",
  },
  dishDescription: {
    color: "#fff",
    fontSize: 12,
  },
};

export default ChefDetail;
