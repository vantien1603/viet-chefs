import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";

const CustomerSchedule = () => {
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "today", title: "Today" },
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past" },
  ]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axiosInstance.get(
          "/bookings/booking-details/user",
          {
            params: {
              pageNo: 0,
              pageSize: 1000,
              sortBy: "sessionDate",
              sortDir: "desc",
            },
          }
        );
        setBookingDetails(response.data.content);
        console.log("Booking Details:", response.data.content);
      } catch (error) {
        console.log("err", error);
      }
    };
    fetchBookingDetails();
  }, []);

  const handlePressDetail = (id) => {
    router.push({
      pathname: "/screen/viewDetailBookingDetails",
      params: {
        bookingDetailsId: id,
      },
    });
  };

  const handleRebook = (bookingDetail) => {
    if (bookingDetail.status !== "COMPLETED") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Rebook is only allowed when status is COMPLETED",
      });
      return;
    }
  
    let selectedMenu = null;
    if (bookingDetail.menuId) {
      selectedMenu = {
        id: bookingDetail.menuId,
        name: `Menu ${bookingDetail.menuId}`,
        menuItems: [],
      };
    }
  
    const selectDishes = bookingDetail.dishes.map(({ dish }) => ({
      id: dish.id,
      name: dish.name,
      imageUrl: dish?.imageUrl,
    }));
  
    const dishNotes = {};
    if (bookingDetail.dishes && bookingDetail.dishes.length > 0) {
      bookingDetail.dishes.forEach(({ dish, notes }) => {
        dishNotes[dish.id] = notes || "";
      });
    }
  
    console.log("Rebook Data:", { selectedMenu, selectDishes, dishNotes });
    console.log("length", selectDishes.length)
  
    router.push({
      pathname: "/screen/booking",
      params: {
        chefId: bookingDetail.booking?.chef?.id,
        selectedMenu: selectedMenu ? JSON.stringify(selectedMenu) : null,
        selectedDishes: selectDishes.length > 0 ? JSON.stringify(selectDishes) : null,
        dishNotes: Object.keys(dishNotes).length > 0 ? JSON.stringify(dishNotes) : null,
        address: bookingDetail.location,
      },
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookingDetails = bookingDetails.filter(
    (detail) => detail.status === "SCHEDULED" || detail.status === "COMPLETED" || detail.status === "SCHEDULED_COMPLETE" || detail.status === "WAITING_FOR_CONFIRMATION"
  );

  const todayDetails = filteredBookingDetails.filter(
    (detail) =>
      new Date(detail.sessionDate).toDateString() === today.toDateString()
  );
  const upcomingDetails = filteredBookingDetails.filter(
    (detail) => new Date(detail.sessionDate) > today
  );
  const pastDetails = filteredBookingDetails.filter(
    (detail) => new Date(detail.sessionDate) < today
  );

  const renderBookingList = (details) => (
    <ScrollView style={styles.container}>
      {details.length > 0 ? (
        details.map((detail) => (
          <View key={detail.id} style={styles.bookingItem}>
            <TouchableOpacity
              onPress={() => handlePressDetail(detail.id)}
              style={styles.touchableArea}
            >
              <View style={styles.row}>
                <Text style={styles.label1}>
                  {detail.booking?.chef?.user?.fullName || "N/A"}
                </Text>
                <Text style={styles.label}>{detail.sessionDate || "N/A"}</Text>
              </View>
              <Text style={styles.label}>{t("time")}: {detail.startTime || "N/A"}</Text>
              <Text style={styles.label}>
                {t("address")}: {detail.location || "N/A"}
              </Text>
              <Text style={styles.label}>
                {t("totalPrice")}:{" "}
                {detail.totalPrice
                  ? `${detail.totalPrice.toFixed(2)}`
                  : "N/A"}
              </Text>
              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.labelStatus,
                    {
                      color:
                        detail.status === "COMPLETED"
                          ? "green"
                          : detail.status === "SCHEDULED" || detail.status === "SCHEDULED_COMPLETE"
                          ? "orange"
                          : "black",
                    },
                  ]}
                >
                  {detail.status.replace("_", " ")}
                  {detail.status === "COMPLETED" && (
                    <Ionicons name="checkmark-done" size={24} color="green" />
                  )}
                </Text>
                {detail.status === "COMPLETED" && (
                  <TouchableOpacity
                    style={styles.rebookButton}
                    onPress={() => handleRebook(detail)}
                  >
                    <Text style={styles.rebookText}>{t("rebook")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noData}>{t("noBookings")}</Text>
      )}
    </ScrollView>
  );

  const TodayRoute = () => renderBookingList(todayDetails);
  const UpcomingRoute = () => renderBookingList(upcomingDetails);
  const PastRoute = () => renderBookingList(pastDetails);

  const renderScene = SceneMap({
    today: TodayRoute,
    upcoming: UpcomingRoute,
    past: PastRoute,
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header
        title={t("activity")}
        onRightPress={() => router.push("/screen/history")}
        rightText={t("history")}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled={true}
            indicatorStyle={{ backgroundColor: "#9C583F", height: 3 }}
            style={{
              backgroundColor: "#EBE5DD",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            }}
            activeColor="#9C583F"
            inactiveColor="gray"
            labelStyle={{ fontWeight: "bold" }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
  },
  bookingItem: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  touchableArea: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label1: {
    fontWeight: "bold",
    fontSize: 18,
  },
  label: {
    marginVertical: 5,
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  tabBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
  },
  tabLabel: {
    color: "#333",
    fontWeight: "bold",
  },
  indicator: {
    backgroundColor: "#007AFF",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  labelStatus: {
    textAlign: "right",
    color: "green",
    fontWeight: "bold",
  },
  rebookButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  rebookText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CustomerSchedule;