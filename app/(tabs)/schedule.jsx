import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { TabView, TabBar } from "react-native-tab-view";
import { useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";
import axios from "axios";
import { AuthContext } from "../../config/AuthContext";
import { useSelectedItems } from "../../context/itemContext";

const CustomerSchedule = () => {
  const axiosInstance = useAxios();
  const { user, isGuest } = useContext(AuthContext);
  const router = useRouter();
  const segment = useSegments();
  const [bookingDetails, setBookingDetails] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setChefId, setRouteBefore } = useSelectedItems();
  const routes = useMemo(() => [
    { key: "today", title: "Today" },
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past" },
  ], []);

  useEffect(() => {
    if (isGuest) return;
    fetchBookingDetails();
  }, [isGuest]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/booking-details/user", {
        params: {
          pageNo: 0,
          pageSize: 1000,
          sortBy: "sessionDate",
          sortDir: "desc",
        },
      });
      setBookingDetails(response.data.content);
    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredBookingDetails = useMemo(() =>
    bookingDetails.filter((d) =>
      ["SCHEDULED", "COMPLETED", "SCHEDULED_COMPLETE", "WAITING_FOR_CONFIRMATION"].includes(d.status)
    ), [bookingDetails]);

  const todayDetails = useMemo(() =>
    filteredBookingDetails.filter((d) =>
      new Date(d.sessionDate).toDateString() === today.toDateString()
    ), [filteredBookingDetails, today]);

  const upcomingDetails = useMemo(() =>
    filteredBookingDetails.filter((d) => new Date(d.sessionDate) > today), [filteredBookingDetails, today]);

  const pastDetails = useMemo(() =>
    filteredBookingDetails.filter((d) => new Date(d.sessionDate) < today), [filteredBookingDetails, today]);

  const handlePressDetail = useCallback((id) => {
    router.push({
      pathname: "/screen/viewDetailBookingDetails",
      params: { bookingDetailsId: id },
    });
  }, []);

  const handleRebook = useCallback((bookingDetail) => {
    if (bookingDetail.status !== "COMPLETED") {
      showModal("Error", "Rebook is only allowed when status is COMPLETED", "Failed");
      return;
    }

    const selectedMenu = bookingDetail.menuId
      ? { id: bookingDetail.menuId, name: `Menu ${bookingDetail.menuId}`, menuItems: [] }
      : null;

    const selectDishes = bookingDetail.dishes.map(({ dish }) => ({
      id: dish.id,
      name: dish.name,
      imageUrl: dish.imageUrl,
    }));

    const dishNotes = {};
    bookingDetail.dishes.forEach(({ dish, notes }) => {
      dishNotes[dish.id] = notes || "";
    });
    setChefId(bookingDetail.booking?.chef?.id);
    setRouteBefore(segment);
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
  }, []);

  const renderBookingItem = useCallback(({ item: detail }) => (
    <View style={styles.bookingItem}>
      <TouchableOpacity onPress={() => handlePressDetail(detail.id)} style={styles.touchableArea}>
        <View style={styles.row}>
          <Text style={styles.label1}>{detail.booking?.chef?.user?.fullName || "N/A"}</Text>
          <Text style={styles.label}>{detail.sessionDate || "N/A"}</Text>
        </View>
        <Text style={styles.label}>{t("time")}: {detail.startTime || "N/A"}</Text>
        <Text style={styles.label}>{t("address")}: {detail.location || "N/A"}</Text>
        <Text style={styles.label}>
          {t("totalPrice")}: {detail.totalPrice ? `${detail.totalPrice.toFixed(2)}` : "N/A"}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.labelStatus,
            {
              color: detail.status === "COMPLETED"
                ? "green"
                : ["SCHEDULED", "SCHEDULED_COMPLETE"].includes(detail.status)
                  ? "orange"
                  : "black"
            }
          ]}>
            {detail.status.replace("_", " ")}
            {detail.status === "COMPLETED" && (
              <Ionicons name="checkmark-done" size={20} color="green" />
            )}
          </Text>
          {detail.status === "COMPLETED" && (
            <TouchableOpacity style={styles.rebookButton} onPress={() => handleRebook(detail)}>
              <Text style={styles.rebookText}>{t("rebook")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  ), [handlePressDetail, handleRebook]);

  const renderBookingList = (details) => {
    if (loading) {
      return <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />;
    }

    return (
      <FlatList
        data={details}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        ListEmptyComponent={<Text style={styles.noData}>{t("noBookings")}</Text>}
        contentContainerStyle={{ padding: 10 }}
      />
    );
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "today":
        return renderBookingList(todayDetails);
      case "upcoming":
        return renderBookingList(upcomingDetails);
      case "past":
        return renderBookingList(pastDetails);
      default:
        return null;
    }
  };

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
            scrollEnabled
            indicatorStyle={{ backgroundColor: "#9C583F", height: 3 }}
            style={{ backgroundColor: "#EBE5DD" }}
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
    backgroundColor: "#F9F5F0",
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
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  labelStatus: {
    fontWeight: "bold",
  },
  rebookButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  rebookText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CustomerSchedule;
