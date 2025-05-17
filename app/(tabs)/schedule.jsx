import React, { useContext, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { AuthContext } from "../../config/AuthContext";

const CustomerSchedule = () => {
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, isGuest } = useContext(AuthContext);
  const [routes] = useState([
    { key: "today", title: "Today" },
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past" },
  ]);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    setLoading(true);
    if (isGuest) return;
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
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
    }
    finally {
      setLoading(false);
    }
  };


  const handlePressDetail = (id) => {
    router.push({
      pathname: "/screen/viewDetailBookingDetails",
      params: {
        bookingDetailsId: id,
      },
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter booking details to only include SCHEDULED or COMPLETED statuses
  const filteredBookingDetails = bookingDetails.filter(
    (detail) => detail.status === "SCHEDULED" || detail.status === "COMPLETED"
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
      {loading ? (
        <ActivityIndicator size={'large'} color={'white'} />
      ) : details.length > 0 ? (
        details.map((detail) => (
          <TouchableOpacity
            key={detail.id}
            style={styles.bookingItem}
            onPress={() => handlePressDetail(detail.id)}
          >
            <View style={styles.row}>
              <Text style={styles.label1}>
                {detail.booking?.chef?.user?.fullName || "N/A"}
              </Text>
              <Text style={styles.label}>{detail.sessionDate || "N/A"}</Text>
            </View>
            <Text style={styles.label}>Giờ: {detail.startTime || "N/A"}</Text>
            <Text style={styles.label}>
              Địa chỉ: {detail.location || "N/A"}
            </Text>
            <Text style={styles.label}>
              Tổng giá:{" "}
              {detail.totalPrice ? `${detail.totalPrice.toFixed(2)}` : "N/A"}
            </Text>
            <Text
              style={[
                styles.labelStatus,
                {
                  color:
                    detail.status === "COMPLETED"
                      ? "green"
                      : detail.status === "SCHEDULED"
                      ? "orange"
                      : "black",
                },
              ]}
            >
              {detail.status}{" "}
              {detail.status === "COMPLETED" && (
                <Ionicons name="checkmark-done" size={24} color="green" />
              )}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noData}>Không có đặt chỗ nào.</Text>
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
      <Header title="Schedule" />
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
    backgroundColor: "#F9F5F0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
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
  labelStatus: {
    textAlign: "right",
    color: "green",
    fontWeight: "bold",
  },
});

export default CustomerSchedule;