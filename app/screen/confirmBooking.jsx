import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../config/AuthContext";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { t } from "i18next";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

const ConfirmBookingScreen = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  const bookingData = JSON.parse(params.bookingData || "{}");
  const selectedMenu = JSON.parse(params.selectedMenu || "null");
  const selectedDishes = JSON.parse(params.selectedDishes || "[]");
  const sessionDate = params.sessionDate || "N/A";
  const startTime = params.startTime || "N/A";
  const chefId = parseInt(params.chefId);
  const location = params.address || "N/A";
  const requestDetails = params.requestDetails;
  const dishNotes = JSON.parse(params.dishNotes || "{}");
  const numPeople = parseInt(params.numPeople) || 1;
  const menuId = params.menuId || null;
  const chefBringIngredients = params.chefBringIngredients;
  const { user } = useContext(AuthContext);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();
  const { showModal } = useCommonNoification();


  const menuDishes =
    selectedMenu?.menuItems?.map((item) => ({
      id: item.dishId || item.id,
      name: item.dishName || item.name || "Unnamed Dish",
    })) || [];

  const extraDishes = selectedDishes.map((dish) => ({
    id: dish.id,
    name: dish.name || "Unnamed Dish",
  }));

  const allDishes = [...menuDishes, ...extraDishes];
  const numberOfDishes = allDishes.length;

  const menuDishList =
    menuDishes.length > 0
      ? `${selectedMenu?.name || "Menu"}: ${menuDishes
        .map((dish) => {
          const note = dishNotes[dish.id] ? ` (${dishNotes[dish.id]})` : "";
          return `${dish.name}${note}`;
        })
        .join(", ")}`
      : "";

  const extraDishList =
    extraDishes.length > 0
      ? `${extraDishes
        .map((dish) => {
          const note = dishNotes[dish.id] ? ` (${dishNotes[dish.id]})` : "";
          return `${dish.name}${note}`;
        })
        .join(", ")}`
      : "";

  const dishList =
    [menuDishList, extraDishList].filter(Boolean).join(" | ") || "N/A";

  const numberOfMenuDishes = menuDishes.length;

  useEffect(() => {
    const backAction = () => {
      router.push({
        pathname: "/screen/booking",
        params: {
          chefId: chefId.toString(),
          selectedMenu: selectedMenu ? JSON.stringify(selectedMenu) : null,
          selectedDishes:
            selectedDishes.length > 0 ? JSON.stringify(selectedDishes) : null,
          dishNotes: JSON.stringify(dishNotes),
          address: location,
          sessionDate,
          startTime,
          numPeople: numPeople.toString(),
          requestDetails,
          menuId: menuId || null,
          chefBringIngredients,
        },
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [
    chefId,
    selectedMenu,
    selectedDishes,
    dishNotes,
    location,
    sessionDate,
    startTime,
    numPeople,
    requestDetails,
    menuId,
    chefBringIngredients
  ]);

  const handleBack = () => {
    router.push({
      pathname: "/screen/booking",
      params: {
        chefId: chefId.toString(),
        selectedMenu: selectedMenu ? JSON.stringify(selectedMenu) : null,
        selectedDishes:
          selectedDishes.length > 0 ? JSON.stringify(selectedDishes) : null,
        dishNotes: JSON.stringify(dishNotes),
        address: location,
        sessionDate,
        startTime,
        numPeople: numPeople.toString(),
        requestDetails,
        menuId: menuId || null,
        chefBringIngredients
      },
    });
  };

  const handleKeepBooking = async () => {
    setLoading(true);
    try {
      const selectedDishIds = allDishes.map((dish) => dish.id);
      const payload = {
        customerId: user?.userId,
        chefId: parseInt(chefId),
        requestDetails: requestDetails,
        guestCount: numPeople,
        bookingDetails: [
          {
            sessionDate: sessionDate,
            startTime: `${startTime}:00`,
            location: location,
            totalPrice: bookingData.totalPrice || 0,
            chefCookingFee: bookingData.chefCookingFee || 0,
            priceOfDishes: bookingData.priceOfDishes || 0,
            arrivalFee: bookingData.arrivalFee || 0,
            chefServingFee: bookingData.chefServingFee || 0,
            timeBeginCook: bookingData.timeBeginCook || null,
            timeBeginTravel: bookingData.timeBeginTravel || null,
            platformFee: bookingData.platformFee || 0,
            totalChefFeePrice: bookingData.totalChefFeePrice || 0,
            totalCookTime: (bookingData.cookTimeMinutes || 0) / 60,
            isUpdated: false,
            menuId: menuId,
            dishes: selectedDishIds.map((dishId) => ({
              dishId: dishId,
              notes: dishNotes[dishId] || null,
            })),
            chefBringIngredients
          },
        ],
      };
      console.log("Payload for booking confirmation:", payload);

      const response = await axiosInstance.post("/bookings", payload);
      console.log("API Response:", response.data);

      showModal("Success", "Booking confirmed successfully!", "Success");

      router.push({
        pathname: "/screen/paymentBooking",
        params: {
          bookingId: response.data.id,
          bookingData: JSON.stringify(bookingData),
        },
      });
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  };

  // const handleKeepBooking = async () => {
  //   setLoading(true);
  //   try {
  //     await handleConfirmBooking();
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("confirmAndPayment")} onLeftPress={handleBack} />
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: "500", marginBottom: 10 }}>
            {t("location")}
          </Text>
          <View
            style={{
              borderColor: "#BBBBBB",
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{location}</Text>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>
            {t("infor")}
          </Text>
          <View
            style={{
              borderColor: "#BBBBBB",
              borderWidth: 2,
              borderRadius: 10,
              padding: 20,
              marginBottom: 20,
            }}
          >
            {/* Subsection: Thời Gian Làm Việc */}
            <Text style={styles.subSectionTitle}>{t("workingTime")}</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("date")}</Text>
              <Text style={styles.details}>{sessionDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("time")}</Text>
              <Text style={styles.details}>{`${startTime}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("timeBeginTravel")}</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginTravel || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("timeBeginCook")}</Text>
              <Text style={styles.details}>
                {bookingData.timeBeginCook || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("cookTime")}</Text>
              <Text style={styles.details}>
                {bookingData.cookTimeMinutes
                  ? `${bookingData.cookTimeMinutes} ${t("minutes")}`
                  : "N/A"}
              </Text>
            </View>

            {/* Subsection: Chi Tiết Công Việc */}
            <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
              {t("jobDetails")}
            </Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("numberOfPeople")}</Text>
              <Text style={styles.details}>{numPeople}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("totalNumberOfDishes")}</Text>
              <Text style={styles.details}>{numberOfDishes}</Text>
            </View>
            {selectedMenu && (
              <View style={styles.row}>
                <Text style={{ fontSize: 14, flex: 1 }}>{t("dishesInMenu")}</Text>
                <Text style={styles.details}>{numberOfMenuDishes}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("dishList")}</Text>
              <Text style={[styles.details, { flex: 2 }]}>{dishList}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("ingredients")}</Text>
              <Text style={styles.details}>
                {chefBringIngredients === "true" ? t("chefWillPrepareIngredients") : t("IWillPrepareIngredients")}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ padding: 5 }} />
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#EBE5DD",
          padding: 10,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "100%",
            borderColor: "#BBBBBB",
            borderWidth: 2,
            borderRadius: 10,
            padding: 10,
            marginBottom: 20,
          }}
        >
          <View style={styles.costRow}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: "bold" }}>
              {t("total")}:
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {bookingData.totalPrice?.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              }) || "$0"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            width: "100%",
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => requireAuthAndNetwork(handleKeepBooking)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              {t("confirmBooking")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

export default ConfirmBookingScreen;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8BF40",
    backgroundColor: "#FDFBF6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A9411D",
    marginLeft: 10,
  },
  row: {
    margin: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  details: {
    textAlign: "right",
    fontSize: 14,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
});
