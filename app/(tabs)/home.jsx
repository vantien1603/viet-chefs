import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [chef, setChef] = useState([]);
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState([]);
  const { user } = useContext(AuthContext);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [fullName, setFullName] = useState("User");

  const handleSearch = () => {
    const searchQuery = String(query || "").trim();
    router.push({
      pathname: "/screen/searchResult",
      params: { query: searchQuery },
    });
  };

  const loadData = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      if (savedAddress) {
        setSelectedAddress(JSON.parse(savedAddress));
      }
      const name = await AsyncStorage.getItem("@fullName");
      setFullName(name || "User");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    const fetchChef = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/chefs");
        // console.log("Chefs:", response.data.content);
        setChef(response.data.content.slice(0, 3));
      } catch (error) {
        if (error.response) {
          console.error(`Lỗi ${error.response.status}:`, error.response.data);
        }
        else {
          console.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    };


    const fetchDishes = async () => {
      try {
        const response = await axiosInstance.get("/dishes");
        // console.log("Dishes:", response.data.content);
        setDishes(response.data.content.slice(0, 3));
      } catch (error) {
        if (error.response) {
          console.error(`Lỗi ${error.response.status}:`, error.response.data);
        }
        else {
          console.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChef();
    fetchDishes();
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

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
        }}
      >
        <TouchableOpacity onPress={() => router.push("screen/editAddress")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 50, height: 50 }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, maxWidth: 200 }}>
              <Text style={{ fontSize: 18, color: "#383838" }}>
                Hello, {user?.fullName}
              </Text>
              <Text
                style={{ fontSize: 12, color: "#968B7B" }}
                numberOfLines={2}
              >
                {selectedAddress
                  ? selectedAddress.address
                  : "Jarkata, Indonesia"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => router.push("/screen/notification")}>
            <Ionicons name="notifications" size={30} color="#4EA0B7" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ paddingTop: 10 }}
        contentContainerStyle={{ paddingBottom: 50 }}
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
          <TouchableOpacity onPress={() => router.push("screen/chefSchedule")}>
            <Text style={{ fontSize: 18, color: "#968B7B" }}>See all</Text>
          </TouchableOpacity>
        </View>
        <View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (

            <FlatList
              style={{ paddingTop: 20 }}
              data={dishes}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: 200,
                    alignItems: "center",
                    marginBottom: 20,
                    marginRight: 10,
                  }}
                >
                  <View key={item.id} style={styles.card}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                      />
                    </View>

                    <Text style={styles.title}>{item.name}</Text>
                    <Text
                      style={{ color: "#fff", textAlign: 'center' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"

                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
              )}
            />


          )}

        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <Text style={{ fontSize: 20 }}>Recommend chef</Text>
          <TouchableOpacity onPress={() => router.push("screen/scheduleBlocked")}>

            <Text style={{ fontSize: 18, color: "#968B7B" }}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 30 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              style={{ paddingTop: 20 }}
              data={chef}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: 200,
                    alignItems: "center",
                    backgroundColor: "#A9411D",
                    borderRadius: 16,
                    paddingBottom: 10,
                    marginRight: 10,
                    // marginBottom: 20,
                  }}
                  key={item.id}
                >

                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/screen/chefDetail", params: { id: item.id } })}
                  >
                    <View style={styles.card}>
                      <View style={styles.imageContainer}>
                        <Image
                          source={{
                            uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
                          }}
                          style={styles.image}
                        />
                      </View>
                      <Text style={styles.title}>{item.user.fullName}</Text>
                      <Text style={{ color: "#fff", fontWeight: 'bold' }}>{item.price} $</Text>
                      <Text style={{ color: "#fff", textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{item.specialization}</Text>
                    </View>
                    <Feather style={{ position: 'absolute', right: 5, top: 5 }} name="info" size={24} color="white" />

                  </TouchableOpacity>


                  {/* 
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
                    <TouchableOpacity style={styles.button}> */}
                  {/* <Text style={styles.buttonText}>i</Text> */}
                  {/* <Feather name="info" size={24} color="white" />
                    </TouchableOpacity>
                  </View> */}
                </View>
              )}
            />

            //   chef.map((item, index) => (
            // <View
            //   style={{
            //     width: 200,
            //     alignItems: "center",
            //     backgroundColor: "#A9411D",
            //     borderRadius: 16,
            //     paddingBottom: 10,
            //   }}
            //   key={item.id}
            // >
            //   <TouchableOpacity
            //     key={index}
            //     onPress={() => router.push({ pathname: "/screen/chefDetail", params: { id: item.id } })}
            //   >
            //     <View style={styles.card}>
            //       <View style={styles.imageContainer}>
            //         <Image
            //           source={{
            //             uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
            //           }}
            //           style={styles.image}
            //         />
            //       </View>
            //       <Text style={styles.title}>{item.user.fullName}</Text>
            //       <Text style={{ color: "#F8BF40" }}>{item.specialzation}</Text>
            //     </View>
            //   </TouchableOpacity>

            //   <View
            //     style={{
            //       backgroundColor: "#fff",
            //       marginTop: -5,
            //       borderRadius: 30,
            //       padding: 5,
            //       position: "absolute",
            //       bottom: -20,
            //     }}
            //   >
            //     <TouchableOpacity style={styles.button}>
            //       <Text style={styles.buttonText}>i</Text>
            //     </TouchableOpacity>
            //   </View>
            // </View>
            // ))
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "relative",
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: "#FFF8EF",
    borderColor: "#ddd",
    borderWidth: 2,
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
    marginTop: 20,
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
    color: "#F8BF40",
    marginTop: 70,
    textAlign: "center",
    marginBottom: 5,
  },
});
