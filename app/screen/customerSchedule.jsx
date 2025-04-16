import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { useNavigation } from "@react-navigation/native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SortBy } from "expo-media-library";

const CustomerSchedule = () => {
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState([]);
  const navigation = useNavigation();
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
        // console.log("cc", response.data.content);
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

  // Lọc dữ liệu theo tab
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh

  const todayDetails = bookingDetails.filter(
    (detail) =>
      new Date(detail.sessionDate).toDateString() === today.toDateString()
  );
  const upcomingDetails = bookingDetails.filter(
    (detail) => new Date(detail.sessionDate) > today
  );
  const pastDetails = bookingDetails.filter(
    (detail) => new Date(detail.sessionDate) < today
  );

  // Component render danh sách đặt chỗ
  const renderBookingList = (details) => (
    <ScrollView style={styles.container}>
      {details.length > 0 ? (
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
                      : detail.status === "LOCKED"
                      ? "red"
                      : "black", // fallback color
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

  // Định nghĩa các tab
  const TodayRoute = () => renderBookingList(todayDetails);
  const UpcomingRoute = () => renderBookingList(upcomingDetails);
  const PastRoute = () => renderBookingList(pastDetails);

  // Cấu hình SceneMap
  const renderScene = SceneMap({
    today: TodayRoute,
    upcoming: UpcomingRoute,
    past: PastRoute,
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header />
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
