import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
// import ProgressBar from "../../components/progressBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { t } from "i18next";

const LongTermBookingScreen = () => {
  const router = useRouter();
  const { chefId } = useLocalSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [numPeople, setNumPeople] = useState("1"); // Default to 1
  const [address, setAddress] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();
  const [addresses, setAddresses] = useState([]);
  const addressModalizeRef = useRef(null);

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

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/address/my-addresses");
      setAddresses(response.data);
      console.log("Fetched addresses:", response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách địa chỉ",
      });
    }
  };

  const openAddressModal = () => {
    fetchAddresses();
    addressModalizeRef.current?.open();
  };

  const selectAddress = async (selectedAddress) => {
    setAddress(selectedAddress.address);
    try {
      await AsyncStorage.setItem(
        "selectedAddress",
        JSON.stringify(selectedAddress)
      );
      console.log("Saved selected address:", selectedAddress.address);
    } catch (error) {
      console.error("Error saving selected address:", error);
    }
    addressModalizeRef.current?.close();
  };

  const renderAddressModal = () => (
    <Modalize
      ref={addressModalizeRef}
      handlePosition="outside"
      modalStyle={{
        backgroundColor: "#FFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleStyle={{
        backgroundColor: "#A64B2A",
        width: 40,
        height: 5,
        borderRadius: 5,
      }}
      adjustToContentHeight={true}
    >
      <View style={{ padding: 20, paddingBottom: 40 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {t("selectAddress")}
        </Text>
        {addresses.length === 0 ? (
          <Text
            style={{
              fontSize: 16,
              color: "#777",
              textAlign: "center",
              marginVertical: 20,
            }}
          >
            {t("noAddressMessage")}
          </Text>
        ) : (
          addresses.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              onPress={() => selectAddress(item)}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#ddd",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: 5,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#666",
                    marginBottom: 5,
                    flexWrap: "wrap",
                  }}
                >
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          onPress={() => addressModalizeRef.current?.close()}
          style={{
            flex: 1,
            backgroundColor: "#D1D1D1",
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#333", fontWeight: "bold", fontSize: 16 }}>
            {t("cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </Modalize>
  );

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

  const handleBack = () => {
    router.push({
      pathname: "/screen/chefDetail",
      params: { chefId: chefId },
    });
  };

  // Limit to maximum 5 packages
  const displayedPackages = packages.slice(0, 5);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("longTermBooking")} onLeftPress={handleBack} />
        {/* <ProgressBar title="Chọn gói" currentStep={2} totalSteps={4} /> */}
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
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 15,
              marginBottom: 5,
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
          <TextInput
            style={inputStyle}
            keyboardType="numeric"
            value={numPeople}
            onChangeText={(text) => {
              // Only allow positive numbers up to maxGuestCountPerMeal
              if (
                text === "" ||
                (/^\d+$/.test(text) &&
                  parseInt(text) <=
                    (selectedPackage?.maxGuestCountPerMeal || 999))
              ) {
                setNumPeople(text);
              }
            }}
            placeholder={t("enterNumberOfPeople")}
          />

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
            onPress={() => openAddressModal()}
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
                alert("Vui lòng chọn một gói dịch vụ!");
                return;
              }
              if (
                !numPeople ||
                parseInt(numPeople) < 1 ||
                parseInt(numPeople) > selectedPackage.maxGuestCountPerMeal
              ) {
                alert(
                  `Vui lòng nhập số người hợp lệ (từ 1 đến ${selectedPackage.maxGuestCountPerMeal})!`
                );
                return;
              }
              router.push({
                pathname: "/screen/longTermSelect",
                params: {
                  selectedPackage: JSON.stringify(selectedPackage),
                  numPeople,
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
        {renderAddressModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default LongTermBookingScreen;
