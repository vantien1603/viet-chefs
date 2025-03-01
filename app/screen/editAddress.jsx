import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { commonStyles } from "../../style";
import Header from "../../components/header";

const savedLocations = [
  { id: "1", type: "home", address: "34, George Avenue, Brampton, ON L6T 8H6" },
  { id: "2", type: "work", address: "31244, King Street, Toronto, ON" },
];

const recentLocations = [
  { id: "3", type: "location", address: "56, George Avenue, Brampton, ON" },
];

const EditAddress = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "You need to enable location services.");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        let addr = reverseGeocode[0];
        let fullAddress = `${addr.name}, ${addr.street}, ${addr.city}, ${addr.region}, ${addr.country}`;
        setCurrentAddress(fullAddress);
        setSelectedId("current");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={"Address"} />

      <ScrollView style={{ marginBottom: 80 }}>
        <Text style={{ color: "#666", marginBottom: 5 }}>Saved Locations</Text>
        {savedLocations.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedId(item.id)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons
                name={selectedId === item.id ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={selectedId === item.id ? "#A64B2A" : "gray"}
              />
              {item.type === "home" ? (
                <Ionicons name="home" size={20} color="black" style={{ marginLeft: 10 }} />
              ) : item.type === "work" ? (
                <MaterialIcons name="business" size={20} color="black" style={{ marginLeft: 10 }} />
              ) : (
                <Ionicons name="location-outline" size={20} color="black" style={{ marginLeft: 10 }} />
              )}
              <Text style={{ marginLeft: 10, fontSize: 16, color: "#333" }}>{item.address}</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={{ color: "#A9411D", fontWeight: "bold" }}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}

        {currentAddress && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedId("current")}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons
                name={selectedId === "current" ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={selectedId === "current" ? "#A64B2A" : "gray"}
              />
              <Ionicons name="location-outline" size={20} color="black" style={{ marginLeft: 10 }} />
              <Text style={{ marginLeft: 10, fontSize: 16, color: "#333" }}>{currentAddress}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
          <Text style={{ color: "#666" }}>Recents</Text>
          <TouchableOpacity>
            <Text style={{ color: "red", fontWeight: "bold" }}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>

        {recentLocations.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
            }}
          >
            <TouchableOpacity
              onPress={() => setSelectedId(item.id)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons
                name={selectedId === item.id ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={selectedId === item.id ? "#A64B2A" : "gray"}
              />
              <Ionicons name="location-outline" size={20} color="black" style={{ marginLeft: 10 }} />
              <Text style={{ marginLeft: 10, fontSize: 16, color: "#333" }}>{item.address}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={getCurrentLocation}
        style={{
          position: "absolute",
          bottom: 50,
          left: 20,
          right: 20,
          backgroundColor: "#A64B2A",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          elevation: 5,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Use Current Location
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default EditAddress;
