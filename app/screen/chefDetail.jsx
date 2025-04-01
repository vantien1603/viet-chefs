import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "../../components/header";
import { router } from "expo-router";
import { commonStyles } from "../../style";
import AntDesign from '@expo/vector-icons/AntDesign';
import { router, useLocalSearchParams } from "expo-router";
import AXIOS_API from "../../config/AXIOS_API";

const ChefDetail = () => {
  const [expanded, setExpanded] = useState(false);
  const [dishes, setDishes] = useState([]);
  const { id } = useLocalSearchParams();
  const [chefs, setChefs] = useState(null);

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

  useEffect(() => {
    const fetchChefById = async () => {
      if (!id) return;
      try {
        const response = await AXIOS_API.get(`/chef/${id}`);
        console.log("Chef detail:", response.data);
        setChefs(response.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchChefById();
  }, [id]);

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={'Chefs Information'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.profileContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Image source={{ uri: chefs?.image }} style={styles.profileImage} />
              <View>
                <Text style={{ fontSize: 18, fontWeight: '500' }}>{chefs?.user?.fullName}</Text>
                <Text style={{ fontSize: 16 }}>{chefs?.bio}</Text>
                <View style={styles.starContainer}>
                  {Array(5)
                    .fill()
                    .map((_, i) => (
                      <Icon key={i} name="star" size={20} color="#f5a623" />
                    ))}
                </View>
              </View>
            </View>
            <AntDesign name="message1" size={24} color="black" />
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
            <TouchableOpacity style={styles.button}>
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
              <Image
                source={{ uri: dishes.imageUrl }}
                style={styles.dishImage}
              />
              <Text style={styles.dishName}>{dishes.name}</Text>
              <Text style={styles.dishDescription}>{dishes.description}</Text>
            </View>
          ))} 
        </View>
      </ScrollView>

      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        // backgroundColor: "#A64B2A",
        backgroundColor: "#EBE5DD",
        padding: 20,
        alignItems: "center",
      }}>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#748C54",
              padding: 15,
              borderRadius: 10,
              alignItems: "center",
            }}
          >

            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Review
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#A64B2A",
              padding: 15,
              borderRadius: 10,
              alignItems: "center",
            }}
          >

            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Book now
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    // padding: 20,
    marginVertical: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 45,
    marginRight: 20
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
    fontSize: 16,
    textAlign: "left",
    color: "#555",
    marginBottom: 5,
  },
  seeAllText: {
    color: "#b0532c",
    fontWeight: "bold",
    // marginBottom: 15,
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
    borderTopColor: '#D1D1D1',
    borderTopWidth: 0.5,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
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
});

export default ChefDetail;
