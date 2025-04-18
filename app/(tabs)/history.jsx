import React, { useState, useEffect, useCallback, useContext } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";

// Import các component từ BookingRoutes
import {
  PendingRoute,
  PaidDepositRoute,
  ConfirmRoute,
  CompletedRoute,
  CancelRoute,
} from "../../components/bookingRouter";

const OrderHistories = () => {
  const { user, isGuest } = useContext(AuthContext);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: "Pending" },
    { key: "paidDeposit", title: "Paid/Deposit" },
    { key: "completed", title: "Completed" },
    { key: "confirm", title: "Confirm" },
    { key: "cancel", title: "Cancel" },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;
  const { showModal } = useCommonNoification();

  // const fetchRequestBooking = async (page, isRefresh = false) => {
  //   if (isLoading && !isRefresh) return;
  //   setIsLoading(true);
  //   try {
  //     const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
  //       params: {
  //         pageNo: page,
  //         pageSize: PAGE_SIZE,
  //         sortBy: "id",
  //         sortDir: "desc",
  //       },
  //     });

  //     const bookingData = response.data.content || response.data || [];
  //     setBookings((prev) => {
  //       const newData = isRefresh ? bookingData : [...prev, ...bookingData];
  //       const uniqueData = Array.from(
  //         new Map(newData.map((item) => [item.id, item])).values()
  //       );
  //       return uniqueData;
  //     });
  //     setTotalPages(
  //       response.data.totalPages ||
  //         Math.ceil(
  //           (response.data.totalElements || bookingData.length) / PAGE_SIZE
  //         )
  //     );
  //     setPageNo(page);
  //   } catch (error) {
  //     console.error("Error fetching booking details1111:", error.message);
  //   } finally {
  //     setIsLoading(false);
  //     if (isRefresh) setRefreshing(false);
  //   }
  // };

  const fetchBookingDetails = async (page, isRefresh = false) => {
    if (isGuest) return;
    if (isLoading && !isRefresh) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/my-bookings", {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "desc",
        },
      });

      const bookingData = response.data.content || response.data || [];
      setBookings((prev) => {
        const newData = isRefresh ? bookingData : [...prev, ...bookingData];
        const uniqueData = Array.from(
          new Map(newData.map((item) => [item.id, item])).values()
        );
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
      console.error("Error fetching booking details1111:", error.message);
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // const handleReject = async (id) => {
  //   try {
  //     setLoading(true);
  //     await axiosInstance.put(`/bookings/${id}/reject`);
  //     fetchRequestBooking(0, true);
  //     showModal("Success", "Reject successfully");
  //   } catch (error) {
  //     console.error(
  //       "Error rejecting booking:",
  //       error.response?.data || error.message
  //     );
  //     showModal("Error", "Failed to reject booking");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleAccept = async (id) => {
  //   try {
  //     setLoading(true);
  //     await axiosInstance.put(`/bookings/${id}/confirm`);
  //     showModal("Success", "Confirmed successfully");
  //     fetchRequestBooking(0, true);
  //   } catch (error) {
  //     console.error(
  //       "Error confirming booking:",
  //       error.response?.data || error.message
  //     );
  //     showModal("Error", "Failed to confirm booking");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePayment = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/bookings/${id}/payment`);
      if (response.status === 200) {
        showModal("Success", "Payment successfully");
        fetchBookingDetails(0, true);
      }
    } catch (error) {
      console.error(
        "Error processing payment:",
        error.response?.data || error.message
      );
      showModal("Error", "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails(0);
  }, []);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !isLoading) {
      fetchBookingDetails(pageNo + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setBookings([]);
    fetchBookingDetails(0, true);
  }, []);

  const pendingBookings = bookings.filter(
    (booking) =>
      booking.status === "PENDING" || booking.status === "PENDING_FIRST_CYCLE"
  );
  const paidDepositBookings = bookings.filter(
    (booking) =>
      booking.status === "PAID" ||
      booking.status === "DEPOSITED" ||
      booking.status === "PAID_FIRST_CYCLE"
  );
  const completedBookings = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  );
  const confirmedBookings = bookings.filter(
    (booking) =>
      booking.status === "CONFIRMED" ||
      booking.status === "CONFIRMED_PARTIALLY_PAID" ||
      booking.status === "CONFIRMED_PAID"
  );
  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELED" || booking.status === "OVERDUE"
  );

  const renderScene = SceneMap({
    pending: () => (
      <PendingRoute
        bookings={pendingBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        payment={handlePayment}
      />
    ),
    paidDeposit: () => (
      <PaidDepositRoute
        bookings={paidDepositBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
      // onAccept={handleAccept}
      // onReject={handleReject}
      />
    ),
    confirm: () => (
      <ConfirmRoute
        bookings={confirmedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
    completed: () => (
      <CompletedRoute
        bookings={completedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
    cancel: () => (
      <CancelRoute
        bookings={cancelledBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={"History"} />
      <View style={{ flex: 1 }}>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexGrow: 0,
    backgroundColor: "#EBE5DD",
    flexDirection: "row",
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#9C583F",
  },
  tabText: {
    color: "gray",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeTabText: {
    color: "#9C583F",
  },
});

export default OrderHistories;