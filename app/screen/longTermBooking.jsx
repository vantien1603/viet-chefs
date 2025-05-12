import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import { t } from "i18next";

const LongTermBookingScreen = () => {
  const router = useRouter();
  const { chefId } = useLocalSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [numPeople, setNumPeople] = useState(1); // Default to 1 (number instead of string)
  const [address, setAddress] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();

  useEffect(() => {
    const backAction = () => {
      router.push({ pathname: "/screen/chefDetail", params: { chefId } });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress) {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress.address);
          console.log("Loaded selected address:", parsedAddress.address);
        }
      } catch (error) {
        console.error("Error loading selected address:", error);
      }
    };
    loadSelectedAddress();
  }, []);

  const fetchPackagesByChefId = async () => {
    if (!chefId) {
      setError("Không có ID đầu bếp được cung cấp.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get(`/packages/chefs/${chefId}`);
      const fetchedPackages = response.data.content || response.data || [];
      setPackages(fetchedPackages);
      if (fetchedPackages.length > 0) {
        setSelectedPackage(fetchedPackages[0]);
      }
    } catch (error) {
      console.log("Error fetching packages for chef:", error);
      setError("Không thể tải danh sách gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesByChefId();
  }, [chefId]);

  const handleBack = () => {
    router.push({
      pathname: "/screen/chefDetail",
      params: { chefId: chefId },
    });
  };

  // Increment/Decrement numPeople
  const incrementNumPeople = () => {
    if (numPeople < (selectedPackage?.maxGuestCountPerMeal || 999)) {
      setNumPeople(numPeople + 1);
    }
  };

  const decrementNumPeople = () => {
    if (numPeople > 1) {
      setNumPeople(numPeople - 1);
    }
  };

  // Navigate to ChooseAddressScreen
  const navigateToChooseAddress = () => {
    router.push({
      pathname: "/screen/chooseAddress",
      params: {
        chefId,
        source: "longTerm", // Indicate this is from LongTermBookingScreen
        selectedPackage: JSON.stringify(selectedPackage),
        numPeople: numPeople.toString(),
      },
    });
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
  };

  const buttonStyle = {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("longTermBooking")} />
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" color="#4EA0B7" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("longTermBooking")} />
        <View style={{ padding: 20 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Limit to maximum 5 packages
  const displayedPackages = packages.slice(0, 5);

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("longTermBooking")} onLeftPress={handleBack} />
      <ScrollView style={{ padding: 20, backgroundColor: "#EBE5DD" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
          {t("selectServicePackage")}:
        </Text>
        <View>
          {displayedPackages.length > 0 ? (
            displayedPackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => setSelectedPackage(pkg)}
                style={{
                  ...buttonStyle,
                  backgroundColor:
                    selectedPackage?.id === pkg.id ? "#A64B2A" : "#e0e0e0",
                }}
              >
                <Text
                  style={{
                    color: selectedPackage?.id === pkg.id ? "white" : "black",
                    fontSize: 16,
                  }}
                >
                  {pkg.name} - {pkg.durationDays} {t("days")}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#777" }}>
              {t("noPackageForChef")}
            </Text>
          )}
        </View>

        <View
          style={{
            marginTop: 15,
            marginBottom: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {t("numberOfPeople")}:
            </Text>
            {selectedPackage && (
              <Text style={{ fontSize: 14, color: "#666" }}>
                {t("maximum")}: {selectedPackage.maxGuestCountPerMeal}{" "}
                {t("people")}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 8,
              justifyContent: "center",
              width: "100%",
              paddingHorizontal: 20
            }}
          >
            <TouchableOpacity
              onPress={decrementNumPeople}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#e0e0e0",
                justifyContent: "center",
                alignItems: "center",
              }}
              disabled={numPeople <= 1}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>−</Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginHorizontal: 20,
                width: 40,
                textAlign: "center",
              }}
            >
              {numPeople}
            </Text>
            <TouchableOpacity
              onPress={incrementNumPeople}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#e0e0e0",
                justifyContent: "center",
                alignItems: "center",
              }}
              disabled={
                numPeople >= (selectedPackage?.maxGuestCountPerMeal || 999)
              }
            >
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 15,
            marginBottom: 5,
          }}
        >
          {t("address")}:
        </Text>
        <TouchableOpacity
          onPress={navigateToChooseAddress}
          style={inputStyle}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons
              name="location-on"
              size={20}
              color="#4EA0B7"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: address ? "#333" : "#777",
                flexShrink: 1,
                flexWrap: "wrap",
              }}
            >
              {address || t("selectAddress")}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <View>
        <TouchableOpacity
          style={{
            ...buttonStyle,
            backgroundColor: "#A64B2A",
            marginTop: 20,
            marginBottom: 20,
            marginHorizontal: 20,
          }}
          onPress={() => {
            if (!selectedPackage) {
              return;
            }
            if (!numPeople || numPeople < 1) {
              return;
            }
            if (!address) {
              return;
            }
            router.push({
              pathname: "/screen/longTermSelect",
              params: {
                selectedPackage: JSON.stringify(selectedPackage),
                numPeople: numPeople.toString(),
                address,
                chefId,
              },
            });
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            {t("continue")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LongTermBookingScreen;