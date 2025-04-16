import React, { useState, useEffect, useCallback, useContext } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { useCommonNoification } from "../../context/commonNoti";
import BookingList from "../../components/bookingRouter";

const OrderHistories = () => {
  const { user } = useContext(AuthContext);
  const axiosInstance = useAxios(); // Use hook to get Axios instance
  const { showModal } = useCommonNoification();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: "Pending" },
    { key: "paidDeposit", title: "Paid/Deposit" },
    { key: "completed", title: "Completed" },
    { key: "confirm", title: "Confirmed" },
    { key: "cancel", title: "Cancelled" },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

  const fetchRequestBooking = async (page, isRefresh = false) => {
    if (isLoading && !isRefresh) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
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
      console.error("Error fetching booking details:", error.message);
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchBookingDetails = async (page, isRefresh = false) => {
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
      console.error("Error fetching booking details:", error.message);
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/bookings/${id}/reject`);
      fetchRequestBooking(0, true);
      showModal("Success", "Reject successfully");
    } catch (error) {
      showModal("Error", "Failed to reject booking");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/bookings/${id}/confirm`);
      showModal("Success", "Confirmed successfully");
      fetchRequestBooking(0, true);
    } catch (error) {
      showModal("Error", "Failed to confirm booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/bookings/${id}/payment`);
      if (response.status === 200) {
        showModal("Success", "Payment successfully");
        fetchBookingDetails(0, true);
      }
    } catch (error) {
      showModal("Error", "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    user?.roleName === "ROLE_CHEF"
      ? fetchRequestBooking(0)
      : fetchBookingDetails(0);
  }, [user?.roleName]);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !isLoading) {
      user?.roleName === "ROLE_CHEF"
        ? fetchRequestBooking(pageNo + 1)
        : fetchBookingDetails(pageNo + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setBookings([]);
    user?.roleName === "ROLE_CHEF"
      ? fetchRequestBooking(0, true)
      : fetchBookingDetails(0, true);
  }, [user?.roleName]);

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
      <BookingList
        bookings={pendingBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        role={user?.roleName}
        onAccept={handleAccept}
        onReject={handleReject}
        onPayment={handlePayment}
        axiosInstance={axiosInstance}
      />
    ),
    paidDeposit: () => (
      <BookingList
        bookings={paidDepositBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        role={user?.roleName}
        onAccept={handleAccept}
        onReject={handleReject}
        onPayment={handlePayment}
        axiosInstance={axiosInstance}
      />
    ),
    confirm: () => (
      <BookingList
        bookings={confirmedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        role={user?.roleName}
        onAccept={handleAccept}
        onReject={handleReject}
        onPayment={handlePayment}
        axiosInstance={axiosInstance}
      />
    ),
    completed: () => (
      <BookingList
        bookings={completedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        role={user?.roleName}
        onAccept={handleAccept}
        onReject={handleReject}
        onPayment={handlePayment}
        axiosInstance={axiosInstance}
      />
    ),
    cancel: () => (
      <BookingList
        bookings={cancelledBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        role={user?.roleName}
        onAccept={handleAccept}
        onReject={handleReject}
        onPayment={handlePayment}
        axiosInstance={axiosInstance}
      />
    ),
  });

  return (
    <SafeAreaView style={[commonStyles.containerContent, styles.container]}>
      <Header title="Order History" />
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
  },
  tabBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 0,
  },
  tabIndicator: {
    backgroundColor: "#2dd4bf",
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "none",
  },
});

export default OrderHistories;
