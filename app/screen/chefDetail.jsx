// app/screen/ChefDetail.js
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import AXIOS_API from "../../config/AXIOS_API";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ProgressBar from "../../components/progressBar";

const ChefDetail = () => {
  const [expanded, setExpanded] = useState(false);
  const [dishes, setDishes] = useState([]);
  const { id } = useLocalSearchParams(); // This is the chefId
  const [chefs, setChefs] = useState(null);
  const modalizeRef = useRef(null);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const response = await AXIOS_API.get("/dishes");
        setDishes(response.data.content);
      } catch (error) {
        console.log("Error fetching dishes:", error);
      }
    };
    fetchDishes();
  }, []);

  useEffect(() => {
    const fetchChefById = async () => {
      if (!id) return;
      try {
        const response = await AXIOS_API.get(`/chef/${id}`);
        setChefs(response.data);
      } catch (error) {
        console.log("Error fetching chef:", error);
      }
    };
    fetchChefById();
  }, [id]);

  const onOpenModal = () => {
    modalizeRef.current?.open();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#EBE5DD" }}>
      <Header title={"Chef's Information"} />
      <ProgressBar title="Chọn đầu bếp" currentStep={1} totalSteps={4} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.profileContainer}>
          <View style={styles.header}>
            <Image source={{ uri: chefs?.image }} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{chefs?.user?.fullName}</Text>
              <Text style={styles.specialty}>{chefs?.bio}</Text>
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
            {expanded
              ? chefs?.description
              : chefs?.description?.slice(0, 100) + "..."}
          </Text>

          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.seeAllText}>
              {expanded ? "See Less" : "See All"}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onOpenModal}>
              <Text style={styles.buttonText}>Book now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push("/screen/reviewsChef")}>
              <Text style={styles.buttonText}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Dishes</Text>
          <TouchableOpacity onPress={() => router.push("/screen/allDish")}>
            <Text style={styles.viewAll}>All Dishes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dishContainer}>
          {dishes.slice(0, 3).map((dish, index) => (
            <View key={index} style={styles.dishCard}>
              <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
              <Text style={styles.dishName}>{dish.name}</Text>
              <Text style={styles.dishDescription}>{dish.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modalize cho Book Now */}
      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Choose Booking Type</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              router.push("/screen/selectFood");
            }}
          >
            <Text style={styles.modalButtonText}>Short-term Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              modalizeRef.current?.close();
              router.push({
                pathname: "/screen/longTermBooking",
                params: { chefId: id }, // Pass chefId here
              });
            }}
          >
            <Text style={styles.modalButtonText}>Long-term Booking</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
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
  modalContainer: {
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#b0532c",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "90%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
};

export default ChefDetail;