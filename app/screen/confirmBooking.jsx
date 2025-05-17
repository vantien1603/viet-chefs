import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Toast from "react-native-toast-message";
import { AuthContext } from "../../config/AuthContext";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { t } from "i18next";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import { useSelectedItems } from "../../context/itemContext";

const ConfirmBookingScreen = () => {
  const { selectedMenu, selectedDishes, extraDishIds, selectedDay, specialRequest, numPeople, startTime, dishNotes, ingredientPrep, address, chefId, setTotalPrice } = useSelectedItems();
  const axiosInstance = useAxios();
  const [calcuResult, setCalcuResult] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();
  const { showModal } = useCommonNoification();
  const allDishes = [
    ...(selectedMenu?.menuItems || []),
    ...(selectedMenu ? Object.values(extraDishIds || {}) : Object.values(selectedDishes || {})),
  ];

  useEffect(() => {
    fetchCalculatorBooking();
  }, [])

  const fetchCalculatorBooking = async () => {
    setLoading(true);
    try {
      const payload = {
        chefId: parseInt(chefId),
        guestCount: numPeople,
        bookingDetail: {
          sessionDate: selectedDay && selectedDay.format("YYYY-MM-DD"),
          startTime: `${startTime}:00`,
          location: address?.address,
          menuId: selectedMenu ? selectedMenu.id : null,
          extraDishIds:
            // Object.keys(extraDishIds).length > 0
            selectedMenu
              ? Object.keys(extraDishIds).map((key) => extraDishIds[key].id)
              : Object.keys(selectedDishes).map((key) => selectedDishes[key].id),
          dishes: null,
          chefBringIngredients: ingredientPrep === "chef",
        },
      };
      const response = await axiosInstance.post("/bookings/calculate-single-booking", payload);
      console.log("response conculator", response.data);
      setCalcuResult(response.data)
    } catch (error) {
      if (axios.isCancel(error) || error.response.status === 401) {
        return;
      }
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  }
  const handleKeepBooking = async () => {
    setLoading(true);
    try {
      const selectedDishIds = allDishes.map((dish) => dish.id || dish.dishId); console.log("measd", selectedMenu);


      const payload = {
        customerId: user?.userId,
        chefId: parseInt(chefId),
        requestDetails: specialRequest,
        guestCount: numPeople,
        bookingDetails: [
          {
            sessionDate: selectedDay && selectedDay.format("YYYY-MM-DD"),
            startTime: `${startTime}:00`,
            location: address?.address,
            totalPrice: calcuResult.totalPrice || 0,
            chefCookingFee: calcuResult.chefCookingFee || 0,
            priceOfDishes: calcuResult.priceOfDishes || 0,
            arrivalFee: calcuResult.arrivalFee || 0,
            timeBeginCook: calcuResult.timeBeginCook || null,
            timeBeginTravel: calcuResult.timeBeginTravel || null,
            platformFee: calcuResult.platformFee || 0,
            totalChefFeePrice: calcuResult.totalChefFeePrice || 0,
            totalCookTime: (calcuResult.cookTimeMinutes || 0) / 60,
            isUpdated: false,
            menuId: selectedMenu?.id || null,
            dishes: selectedDishIds.map((dishId) => ({
              dishId: dishId,
              notes: dishNotes[dishId] || null,
            })),
            chefBringIngredients: ingredientPrep === "chef"
          },
        ],
      };
      const response = await axiosInstance.post("/bookings", payload);
      if (response.status === 201 || response.status === 200) {
        showModal("Success", "Booking confirmed successfully!", "Success");
      }
      setTotalPrice(calcuResult.totalPrice)
      router.replace({
        pathname: "/screen/paymentBooking",
        params: {
          bookingId: response.data.id,
        },
      });
    } catch (error) {
      if (axios.isCancel(error) || error.response.status === 401) {
        return;
      }
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace("/screen/booking");
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("confirmAndPayment")} onLeftPress={() => handleBack()} />
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
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{address?.address}</Text>
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
            <Text style={styles.subSectionTitle}>{t("workingTime")}</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("date")}</Text>
              <Text style={styles.details}>{selectedDay && selectedDay.format("YYYY-MM-DD")}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("time")}</Text>
              <Text style={styles.details}>{`${startTime}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("timeBeginTravel")}</Text>
              <Text style={styles.details}>
                {calcuResult.timeBeginTravel || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("timeBeginCook")}</Text>
              <Text style={styles.details}>
                {calcuResult.timeBeginCook || "N/A"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("cookTime")}</Text>
              <Text style={styles.details}>
                {calcuResult.cookTimeMinutes
                  ? `${calcuResult.cookTimeMinutes} ${t("minutes")}`
                  : "N/A"}
              </Text>
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
              {t("jobDetails")}
            </Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("numberOfPeople")}</Text>
              <Text style={styles.details}>{numPeople}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("totalNumberOfDishes")}</Text>
              <Text style={styles.details}>{allDishes.length}</Text>
            </View>
            {selectedMenu && (
              <View>
                <View style={styles.row}>
                  <Text style={{ fontSize: 14, flex: 1 }}>{t("menu")}</Text>
                  <Text style={styles.details}>{selectedMenu.name}</Text>
                </View>
                {selectedMenu.menuItems.map((item, idx) => (
                  <View key={idx} style={{ alignItems: 'flex-end', paddingHorizontal: 5 }}>
                    <Text style={styles.dishName}>{item.dishName}</Text>
                  </View>
                )
                )}
              </View>
            )}
            <View style={{ flexDirection: 'row', padding: 5, justifyContent: 'space-evenly' }}>
              {/* <View style={styles.row}> */}
              <Text style={{ fontSize: 14, flex: 1 }}>{selectedMenu ? 'Side dish' : t("dishList")}</Text>
              {/* </View> */}
              <View>
                {selectedMenu ? (
                  Object.keys(extraDishIds).map((key, idx) => (
                    <View key={idx} style={{ alignItems: 'flex-end', paddingHorizontal: 5 }}>
                      <Text style={styles.dishName}>{extraDishIds[key].name}</Text>
                    </View>
                  ))) : (
                  Object.keys(selectedDishes).map((key, idx) => (
                    <View key={idx} style={{ alignItems: 'flex-end', paddingHorizontal: 5 }}>
                      <Text style={styles.dishName}>{selectedDishes[key].name}</Text>
                    </View>
                  )))
                }
              </View>
            </View>

            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>{t("ingredients")}</Text>
              <Text style={styles.details}>
                {ingredientPrep === "customer" ? t("IWillPrepareIngredients") : t("chefWillPrepareIngredients")}
              </Text>
            </View>
            <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
              {t("specialRequest")}
            </Text>
            <Text style={{ fontSize: 14 }}>{specialRequest}</Text>
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
              {calcuResult.totalPrice && calcuResult.totalPrice?.toLocaleString("en-US", {
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
