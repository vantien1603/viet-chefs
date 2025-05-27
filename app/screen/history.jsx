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
import axios from "axios";
import { t } from "i18next";

const OrderHistories = () => {
  const { user, isGuest } = useContext(AuthContext);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const params = useLocalSearchParams();
  const { tab } = params;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: t("tabs.pending") },
    { key: "paidDeposit", title: t("tabs.paidDeposit") },
    { key: "completed", title: t("tabs.completed") },
    { key: "confirm", title: t("tabs.confirm") },
    { key: "cancel", title: t("tabs.cancel") },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

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
    if (isGuest) return;
    if (loading && !isRefresh) return;
    setLoading(true);
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
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        t("errors.fetchBookingsFailed"),
        t("modal.failed")
      );
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    const currentStatus = statusMap[routes[index].key];
    setBookings([]);
    setPageNo(0);
    fetchBookingDetails(0, currentStatus, true);
  }, [index]);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !loading) {
      const currentStatus = statusMap[routes[index].key];

      fetchBookingDetails(pageNo + 1, currentStatus);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setBookings([]);
    const currentStatus = statusMap[routes[index].key];

    fetchBookingDetails(0, currentStatus, true);
  }, []);

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
            labelStyle={{ fontFamily: "nunito-bold" }}
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
    fontFamily: "nunito-regular"
  },
});

export default OrderHistories;
