import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useSelectedItems } from "../../context/itemContext";
import * as SecureStore from "expo-secure-store";

const LongTermBookingScreen = () => {
  const router = useRouter();
  const {
    numPeople,
    setNumPeople,
    address,
    setAddress,
    chefId,
    selectedPackage,
    setSelectedPackage,
    setIsLong,
  } = useSelectedItems();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const startChef = SecureStore.getItem("firstChef");

  useEffect(() => {
    fetchPackagesByChefId();
    loadSelectedAddress();
  }, []);

  const loadSelectedAddress = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setAddress(parsedAddress);
      }
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.loadAddressFailed"),
        "Failed"
      );
    }
  };

  const fetchPackagesByChefId = async () => {
    try {
      const response = await axiosInstance.get(`/packages/chefs/${chefId}`);
      if (response.status === 200) {
        const fetchedPackages = response.data.content || response.data || [];
        setPackages(fetchedPackages);
        if (fetchedPackages.length > 0) {
          // setSelectedPackage(fetchedPackages[0]);
        }
      }
    } catch (error) {
      if (error.response?.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchPackagesFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

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

  const navigateToChooseAddress = () => {
    setIsLong(true);
    router.replace("/screen/chooseAddress");
  };

  const handleContinue = () => {
    {
      if (!selectedPackage) {
        showModal(
          t("modal.error"),
          t("errors.noPackageSelected"),
          "Failed"
        );
        return;
      }
      if (!address) {
        showModal(
          t("modal.error"),
          t("errors.noAddressSelected"),
          "Failed"
        );
        return;
      }
      router.replace("/screen/longTermSelect");
    }
  };

  const handleBack = () => {
    router.replace({
      pathname: "/screen/chefDetail",
      params: {
        chefId: startChef,
      },
    });
  };
  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("longTermBooking")} onLeftPress={() => handleBack()} />
      {loading ? (
        <ActivityIndicator size={"large"} color={"white"} />
      ) : (
        <>
          <ScrollView style={{ padding: 20, backgroundColor: "#EBE5DD" }}>
            <View style={{ marginVertical: 10 }}>
              <Text
                style={{ fontSize: 20, fontFamily: "nunito-bold", marginBottom: 10 }}
              >
                {t("selectServicePackage")}
              </Text>
              {packages.length > 0 ? (
                packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    onPress={() => setSelectedPackage(pkg)}
                    style={[
                      styles.buttonStyle,
                      {
                        backgroundColor:
                          selectedPackage?.id === pkg.id
                            ? "#A64B2A"
                            : "#e0e0e0",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          selectedPackage?.id === pkg.id ? "white" : "black",
                        fontSize: 16,
                        fontFamily: "nunito-regular",
                      }}
                    >
                      {pkg.name} - {pkg.durationDays} {t("days")}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ fontSize: 16, color: "#777", fontFamily: "nunito-regular" }}>
                  {t("noPackageForChef")}
                </Text>
              )}
            </View>

            <View style={{ marginVertical: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, fontFamily: "nunito-bold" }}>
                  {" "}
                  {t("numberOfPeople")}:{" "}
                </Text>
                {selectedPackage && (
                  <Text style={{ fontSize: 14, color: "#666", fontFamily: "nunito-regular" }}>
                    {t("maximum")}: {selectedPackage.maxGuestCountPerMeal}{" "}
                    {t("people")}
                  </Text>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 20,
                  justifyContent: "center",
                  width: "100%",
                  paddingHorizontal: 20,
                }}
              >
                <TouchableOpacity
                  onPress={decrementNumPeople}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: numPeople <= 1 ? "#D1D1D1" : "#A64B2A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  disabled={numPeople <= 1}
                >
                  <Text
                    style={{ fontSize: 20, fontFamily: "nunito-bold", color: "white" }}
                  >
                    −
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "nunito-bold",
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
                    backgroundColor:
                      numPeople >=
                      (selectedPackage?.maxGuestCountPerMeal || 999)
                        ? "#D1D1D1"
                        : "#A64B2A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  disabled={
                    numPeople >= (selectedPackage?.maxGuestCountPerMeal || 999)
                  }
                >
                  <Text
                    style={{ fontSize: 20, fontFamily: "nunito-bold", color: "white" }}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginVertical: 10 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "nunito-bold",
                  marginTop: 15,
                  marginBottom: 10,
                }}
              >
                {t("address")}:
              </Text>
              <TouchableOpacity
                onPress={navigateToChooseAddress}
                style={styles.inputStyle}
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
                      color: address.address ? "#333" : "#777",
                      flexShrink: 1,
                      flexWrap: "wrap",
                      fontFamily: "nunito-regular"
                    }}
                  >
                    {address.address || t("selectAddress")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View>
            <TouchableOpacity
              style={[
                styles.buttonStyle,
                {
                  backgroundColor: "#A64B2A",
                  marginTop: 20,
                  marginBottom: 20,
                  marginHorizontal: 20,
                },
              ]}
              onPress={() => handleContinue()}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontFamily: "nunito-bold",
                  fontSize: 18,
                }}
              >
                {t("continue")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputStyle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonStyle: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  },
});

export default LongTermBookingScreen;
