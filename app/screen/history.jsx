import React, { useState, useEffect, useCallback, useContext } from "react";
import { SafeAreaView, StyleSheet, View, Text } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router, useLocalSearchParams } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";
import BookingList from "../../components/bookingRouter";
import { t } from "i18next";

const OrderHistories = () => {
  const { user } = useContext(AuthContext);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const params = useLocalSearchParams();
  const { tab } = params;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: "Pending" },
    { key: "paidDeposit", title: "Paid/Deposit" },
    { key: "completed", title: "Completed" },
    { key: "confirm", title: "Confirmed" },
    { key: "cancel", title: "Canceled" },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 10;

  // Map each tab to a single primary status
  const statusMap = {
    pending: "PENDING",
    paidDeposit: "PAID",
    completed: "COMPLETED",
    confirm: "CONFIRMED",
    cancel: "CANCELED",
  };

  const filterStatusMap = {
    pending: ["PENDING", "PENDING_FIRST_CYCLE"],
    paidDeposit: ["PAID", "DEPOSITED", "PAID_FIRST_CYCLE"],
    completed: ["COMPLETED"],
    confirm: ["CONFIRMED", "CONFIRMED_PARTIALLY_PAID", "CONFIRMED_PAID"],
    cancel: ["CANCELED", "OVERDUE"],
  };

  useEffect(() => {
    if (tab) {
      const tabIndex = routes.findIndex((route) => route.key === tab);
      if (tabIndex !== -1 && tabIndex !== index) {
        setIndex(tabIndex);
      }
    }
  }, [tab]);

  const fetchBookingDetails = async (page, status, isRefresh = false) => {
    if (isLoading && !isRefresh) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/my-bookings", {
        params: {
          status,
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "desc",
        },
      });

      const bookingData = response.data.content;
      setBookings((prev) => {
        const newData = isRefresh ? bookingData : [...prev, ...bookingData];
        const uniqueData = Array.from(
          new Map(newData.map((item) => [item.id, item])).values()
        );
        // console.log("Updated bookings:", uniqueData);
        return uniqueData;
      });
      setTotalPages(
        response.data.totalPages ||
          Math.ceil(
            (response.data.totalElements || bookingData.length) / PAGE_SIZE
          )
      );
      setPageNo(page);
    } catch (error) {
      console.error(
        "Error fetching bookings:",
        error.message,
        error.response?.data
      );
      showModal(
        "Error",
        "Failed to fetch bookings: " + (error.message || "Unknown error")
      );
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.roleName) {
      console.warn("User or roleName is missing:", user);
      showModal("Error", "Please log in to view bookings");
      return;
    }
    // console.log("Fetching for role:", user.roleName, "tab:", routes[index].key);
    const currentStatus = statusMap[routes[index].key];
    setBookings([]);
    setPageNo(0);

    fetchBookingDetails(0, currentStatus);
  }, [index]);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !isLoading) {
      const currentStatus = statusMap[routes[index].key];

      fetchBookingDetails(pageNo + 1, currentStatus);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setBookings([]);
    const currentStatus = statusMap[routes[index].key];
    console.log("Refreshing with status:", currentStatus);

    fetchBookingDetails(0, currentStatus, true);
  }, [index]);

  const renderScene = SceneMap({
    pending: () => (
      <BookingList
        bookings={bookings.filter((booking) =>
          filterStatusMap.pending.includes(booking.status)
        )}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
    paidDeposit: () => (
      <BookingList
        bookings={bookings.filter((booking) =>
          filterStatusMap.paidDeposit.includes(booking.status)
        )}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
    confirm: () => (
      <BookingList
        bookings={bookings.filter((booking) =>
          filterStatusMap.confirm.includes(booking.status)
        )}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
    completed: () => (
      <BookingList
        bookings={bookings.filter((booking) =>
          filterStatusMap.completed.includes(booking.status)
        )}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
    cancel: () => (
      <BookingList
        bookings={bookings.filter((booking) =>
          filterStatusMap.cancel.includes(booking.status)
        )}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
  });

  if (!user?.roleName) {
    return (
      <SafeAreaView style={[commonStyles.containerContent, styles.container]}>
        <Header title={t("orderHistory")} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Please log in to view your order history
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[commonStyles.containerContent, styles.container]}>
      <Header title={t("orderHistory")} />
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
    backgroundColor: "#EBE5DD",
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#991b1b",
    textAlign: "center",
  },
});

export default OrderHistories;
