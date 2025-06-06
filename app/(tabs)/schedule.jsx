import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
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
  const { setChefId, setSelectedMenu, setSelectedDishes, setExtraDishIds, setDishNotes, setRouteBefore } = useSelectedItems();
  const [refresh, setRefresh] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const routes = useMemo(() => [
    { key: "today", title: t('today') },
    { key: "upcoming", title: t('Upcoming') },
    { key: "past", title: t('past') },
  ], []);

  useEffect(() => {
    if (isGuest) return;
    fetchBookingDetails(0, true);
  }, []);

  console.log("user hsitasd", user);
  const statuses = ['SCHEDULED', 'COMPLETED', 'SCHEDULED_COMPLETE', 'IN_PROGRESS', 'WAITING_FOR_CONFIRMATION'];

  const fetchBookingDetails = async (pageNum, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const requests = statuses.map(status =>
        axiosInstance.get('/bookings/booking-details/user', {
          params: {
            status,
            pageNo: pageNum,
            pageSize: 10,
            sortBy: 'sessionDate',
            sortDir: 'asc',
          },
        })
      );

      const response = await Promise.all(requests);
      const mergedData = response.flatMap(res => res.data?.content || []);
      // console.log(mergedData);
      const totalPages = Math.max(...response.map(res => res.data?.totalPages || 0));
      setTotalPages(totalPages);
      setBookingDetails((prev) => {
        return isRefresh ? mergedData : [...prev, ...mergedData];
      });
    }
    catch (error) {
      console.log("Loi mang nayf nef cdcm nos")
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
    } finally {
      setLoading(false);
      if (isRefresh) setRefresh(false);
    }
  }

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const loadMoreData = async () => {
    if (!loading && page + 1 <= totalPages - 1) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchBookingDetails(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchBookingDetails(0, true);
  };
  // const fetchBookingDetails = async (pageNum, isRefresh = false) => {
  //   if (loading && !isRefresh) return;
  //   setLoading(true);
  //   try {
  //     const response = await axiosInstance.get("/bookings/booking-details/user", {
  //       params: {
  //         pageNo: 0,
  //         pageSize: 1000,
  //         sortBy: "sessionDate",
  //         sortDir: "desc",
  //       },
  //     });
  //     setBookingDetails(response.data.content);
  //   } catch (error) {
  //     if (axios.isCancel(error) || error.response?.status === 401) return;
  //     showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
  //   } finally {
  //     setLoading(false);
  //     if (isRefresh) setRefresh(false);
  //   }
  // };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Đặt giờ về 0h để so sánh chính xác theo ngày
    return d;
  }, []);

  const todayDetails = useMemo(() =>
    bookingDetails.filter((d) => {
      const session = new Date(d.sessionDate);
      session.setHours(0, 0, 0, 0);
      return session.getTime() === today.getTime(); // So sánh ngày chính xác
    }), [bookingDetails, today]);

  const upcomingDetails = useMemo(() =>
    bookingDetails.filter((d) => {
      const session = new Date(d.sessionDate);
      session.setHours(0, 0, 0, 0);
      return session.getTime() > today.getTime();
    }), [bookingDetails, today]);

  const pastDetails = useMemo(() =>
    bookingDetails.filter((d) => new Date(d.sessionDate) < today), [bookingDetails, today]);

  const handlePressDetail = useCallback((id) => {
    router.push({
      pathname: "/screen/viewDetailBookingDetails",
      params: { bookingDetailsId: id },
    });
  }, []);

  const fetchMenu = async (id, dishesFromBooking) => {
    try {
      const response = await axiosInstance.get(`/menus/${id}`);
      const menu = response.data;

      setSelectedMenu(menu);
      const menuDishIds = new Set(menu.menuItems.map(item => item.dishId));

      console.log("mmnenuas dosh id", menuDishIds);

      const notInMenuDishes = dishesFromBooking
        .filter(item => !menuDishIds.has(item.dish.id))
        .map(item => {
          const { id, name, description, imageUrl } = item.dish;
          return { id, name, description, imageUrl };
        });

      console.log("khonfcos trong meu", notInMenuDishes);
      setExtraDishIds(notInMenuDishes);
    } catch (error) {
      showModal(t("modal.error", "Không thể tải dữ liệu của menu", "Failed"));
    }
  };


  const handleRebook = async (bookingDetail) => {
    if (bookingDetail.status !== "COMPLETED") {
      showModal(
        t("modal.error"),
        "Rebook is only allowed when status is COMPLETED",
        "Failed"
      );
      return;
    }
    if (bookingDetail.menuId) {
      console.log(bookingDetail.dishes);
      await fetchMenu(bookingDetail.menuId, bookingDetail.dishes);


      // const menuDishIds = new Set(menu.menuItems.map((item) => item.dishId));

      // const nonMenuDishes = bookingDetail.dishes.filter(
      //   (d) => !menuDishIds.has(d.dish.id)
      // );

      // setExtraDishIds(nonMenuDishes);
    } else {
      setSelectedDishes(
        bookingDetail.dishes.reduce((acc, item) => {
          const { id, name, description, imageUrl } = item.dish;
          acc[id] = { id, name, description, imageUrl };
          return acc;
        }, {})
      );
    }
    // setSelectedDishes(bookingDetail.dishes);
    const dishNotes = {};
    bookingDetail.dishes.forEach(({ dish, notes }) => {
      dishNotes[dish.id] = notes || "";
    });
    console.log(dishNotes);
    setDishNotes(dishNotes);
    setChefId(bookingDetail.booking?.chef?.id);
    setRouteBefore(segment);
    router.push("/screen/booking");
  };

  const renderBookingItem = useCallback(
    ({ item: detail }) => (
      <View style={styles.bookingItem}>
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
          <Text style={styles.label}>
            {t("time")}: {detail.startTime || "N/A"}
          </Text>
          <Text style={styles.label}>
            {t("address")}: {detail.location || "N/A"}
          </Text>
          <Text style={styles.label}>
            {t("totalPrice")}:{" "}
            {detail.totalPrice ? `${detail.totalPrice.toFixed(2)}` : "N/A"}
          </Text>
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.labelStatus,
                {
                  color:
                    detail.status === "COMPLETED"
                      ? "green"
                      : ["SCHEDULED", "SCHEDULED_COMPLETE"].includes(
                        detail.status
                      )
                        ? "orange"
                        : "black",
                },
              ]}
            >
              {/* {detail.status.replace("_", " ")} */}
              {formatStatus(detail.status)}
              {detail.status === "COMPLETED" && (
                <Ionicons name="checkmark-done" size={20} color="green" />
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
    ),
    [handlePressDetail, handleRebook]
  );

  const renderBookingList = (details) => {
    if (loading) {
      return (
        <ActivityIndicator
          size="large"
          color="white"
          style={{ marginTop: 20 }}
        />
      );
    }

    return (
      <FlatList
        data={details}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        onRefresh={handleRefresh}
        refreshing={refresh}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.2}
        initialNumToRender={5}
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
            labelStyle={{ ffontFamily: "nunito-bold" }}
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
    fontFamily: "nunito-bold",
    fontSize: 18,
  },
  label: {
    marginVertical: 5,
    fontFamily: "nunito-bold",
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    fontFamily: "nunito-regular"
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  labelStatus: {
    fontFamily: "nunito-bold",
  },
  rebookButton: {
    backgroundColor: "#17a2b8",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  rebookText: {
    color: "#fff",
    ffontFamily: "nunito-bold",
    fontSize: 14,
  },
});

export default CustomerSchedule;
