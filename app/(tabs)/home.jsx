import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AXIOS_API from "../../config/AXIOS_API";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [chef, setChef] = useState([]);
  const [dishes, setDishes] = useState([]);

  const handleSearch = () => {
    const searchQuery = String(query || "");
    if (searchQuery.trim() !== "") {
      router.push(`/screen/searchResult/?query=${query}`);
    } else {
      router.push("/screen/searchResult");
    }
  };

  useEffect(() => {
    const fetchChef = async () => {
      try {
        const response = await AXIOS_API.get("/chef");
        console.log("Chefs:", response.data.content);
        setChef(response.data.content.slice(0, 3));
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchDishes = async () => {
      try {
        const response = await AXIOS_API.get("/dishes");
        console.log("Dishes:", response.data.content);
        setDishes(response.data.content.slice(0, 3));
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchChef();
    fetchDishes();
  }, []);

  const fullName = AsyncStorage.getItem("@fullName");
  return (
    <View style={commonStyles.containerContent}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#ddd",
          // marginBottom: 10,
          // marginTop: 50,
        }}
      >
        <TouchableOpacity onPress={() => router.push("screen/editAddress")}>
          <View style={{ flexDirection: "row" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 50, height: 50 }}
              resizeMode="cover"
            />
            <View>
              <Text style={{ fontSize: 18, color: "#383838" }}>
                Hello, {fullName}
              </Text>
              <Text style={{ fontSize: 12, color: "#968B7B" }}>
                Jarkata, Indonesia
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => router.push("/screen/calendar")}>
            <Ionicons name="notifications" size={30} color="#4EA0B7" />
          </TouchableOpacity>
          {/* <TouchableOpacity>
            <Ionicons name="cart" size={30} color="#4EA0B7" />
          </TouchableOpacity> */}
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ paddingTop: 10 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Image
            source={require("../../assets/images/promo.png")}
            style={{ width: "100%", height: 150, borderRadius: 30 }}
            resizeMode="cover"
          />
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Icon
            name="search"
            size={24}
            color="#4EA0B7"
            style={styles.searchIcon}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <Text style={{ fontSize: 20 }}>Popular dishes</Text>
          <Text style={{ fontSize: 18, color: "#968B7B" }}>See all</Text>
        </View>
        <View>
          {dishes.map((item, index) => (
            <View key={index}
              style={{ width: 200, alignItems: "center", marginBottom: 20 }}
            >
              <View style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{uri: item.imageUrl}}
                    style={styles.image}
                  />
                </View>

                <Text style={styles.title}>{item.name}</Text>
                <Text style={{ color: "#F8BF40" }}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <Text style={{ fontSize: 20 }}>Recommend chef</Text>
          <Text style={{ fontSize: 18, color: "#968B7B" }}>See all</Text>
        </View>
        <View style={{ marginBottom: 30 }}>
          <View
            style={{
              width: 200,
              alignItems: "center",
              backgroundColor: "#A9411D",
              borderRadius: 16,
              paddingBottom: 10,
            }}
          >
            {chef.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  router.push({
                    pathname: "/screen/chefDetail",
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.card}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
                      }}
                      defaultSource={require("../../assets/images/logo.png")}
                      style={styles.image}
                    />
                  </View>

                  <Text style={styles.title}>{item.user.fullName}</Text>
                  <Text style={{ color: "#F8BF40" }}>{item.specialzation}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View
              style={{
                backgroundColor: "#fff",
                marginTop: -5,
                borderRadius: 30,
                padding: 5,
                position: "absolute",
                bottom: -20,
              }}
            >
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>i</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#FFF8EF",
    borderColor: "#ddd",
    borderWidth: 2,
    // width: '100%',
    height: 60,
    borderRadius: 100,
    padding: 20,
    fontSize: 16,
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: 200,
    position: "relative",
    // marginBottom: 20
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 8,
    position: "absolute",
    top: -20,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 70,
    textAlign: "center",
    marginBottom: 5,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#F8BF40",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
  },
});
