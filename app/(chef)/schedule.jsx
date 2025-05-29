import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAxios from '../../config/AXIOS_API';
import { useCommonNoification } from '../../context/commonNoti';
import Header from '../../components/header';
import { TabBar, TabView } from 'react-native-tab-view';
import { commonStyles } from '../../style';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { t } from 'i18next';

// const dayInWeek = [
//   { id: 0, label: 'Mon', full: 'Monday' },
//   { id: 1, label: 'Tue', full: 'Tuesday' },
//   { id: 2, label: 'Wed', full: 'Wednesday' },
//   { id: 3, label: 'Thu', full: 'Thursday' },
//   { id: 4, label: 'Fri', full: 'Friday' },
//   { id: 5, label: 'Sat', full: 'Saturday' },
//   { id: 6, label: 'Sun', full: 'Sunday' },
// ];



const ScheduleRender = ({ bookings, onLoadMore, refreshing, onRefresh, onViewDetail, loading }) => {
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} style={[styles.section, item.status === "IN_PROGRESS" && styles.highlighted, item.status === "WAITING_FOR_CONFIRMATION" && { borderWidth: 3, borderColor: 'green' }]} onPress={() => onViewDetail(item.id)}>
        <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontFamily: "nunito-bold" }}>{item.booking?.customer?.fullName}</Text>
          <Text style={{ fontSize: 14, fontFamily: "nunito-bold" }}>Date: {item.sessionDate}</Text>
          {/* <Text style={{ fontSize: 14, fontFamily: "nunito-bold" }}>Date: {item.status}</Text> */}
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail">
          <Text style={styles.itemContentLabel}>{t("address")}: </Text>
          <Text style={styles.itemContent}>{item.location}</Text>
        </Text>
        <Text>
          <Text style={styles.itemContentLabel}>{t("Mealtime")}: </Text>
          <Text style={styles.itemContent}>{item.startTime}</Text>
        </Text>
        <Text>
          <Text style={styles.itemContentLabel}>{t("travelTime")}: </Text>
          <Text style={styles.itemContent}>{item.timeBeginTravel}</Text>
        </Text>
        <Text numberOfLines={2} ellipsizeMode="tail">
          <Text style={styles.itemContentLabel}>{t("dishes")}: </Text>
          {item.dishes?.length === 0 && (
            <Text style={styles.itemContent}>
              {t("notYet")}
            </Text>
          )}
          {item.dishes && item.dishes.map((dish) => (
            // <View>
            <Text key={dish.id} style={styles.itemContent}>{dish.dish?.name}, </Text>
            // </View>
          ))}

        </Text>
        <Text style={styles.itemContentLabel}>{t("price")}: ${item.totalPrice}</Text>
      </TouchableOpacity>
    )

    // );
  }
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16, marginTop: 20, fontFamily: "nunito-regular" }}>{t("noOrder")}</Text>}
        ListFooterComponent={(loading ? <ActivityIndicator size="large" /> : <View style={{ height: 100 }} />)}
      />
    </View>
  );
};

const Schedule = () => {
  const dayInWeek = [
    { id: 0, label: t("Mon"), full: t("Monday") },
    { id: 1, label: t("Tue"), full: t("Tuesday") },
    { id: 2, label: t("Wed"), full: t("Wednesday") },
    { id: 3, label: t("Thu"), full: t("Thursday") },
    { id: 4, label: t("Fri"), full: t("Friday") },
    { id: 5, label: t("Sat"), full: t("Saturday") },
    { id: 6, label: t("Sun"), full: t("Sunday") },
  ];
  const axiosInstance = useAxios();
  const [page, setPage] = useState(0);
  const [schedules, setSchedules] = useState(() =>
    dayInWeek.reduce((acc, day) => {
      acc[day.full] = [];
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const navigation = useNavigation();
  const [totalPages, setTotalPages] = useState(0);
  const { showModal } = useCommonNoification();
  const [routes] = useState(dayInWeek.map((day) => ({ key: day.id.toString(), title: day.full })));

  const PAGE_SIZE = 20;

  const getDayOfWeekId = (date) => {
    const day = new Date(date).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const statuses = ['SCHEDULED_COMPLETE', 'IN_PROGRESS', 'WAITING_FOR_CONFIRMATION'];

  const fetchBookingDetails = async (pageNum, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const requests = statuses.map(status =>
        axiosInstance.get('/bookings/booking-details/chefs', {
          params: {
            status,
            pageNo: pageNum,
            pageSize: PAGE_SIZE,
            sortBy: 'sessionDate',
            sortDir: 'desc',
          },
        })
      );

      const response = await Promise.all(requests);
      const mergedData = response.flatMap(res => res.data?.content || []);

      const totalPages = Math.max(...response.map(res => res.data?.totalPages || 0));
      setTotalPages(totalPages);

      const categorizedSchedules = isRefresh
        ? dayInWeek.reduce((acc, day) => {
          acc[day.full] = [];
          return acc;
        }, {})
        : { ...schedules };

      // setSchedules(data);
      mergedData.forEach((booking) => {
        const dayOfWeekId = getDayOfWeekId(booking.sessionDate);
        const dayName = dayInWeek[dayOfWeekId].full;
        categorizedSchedules[dayName] = [...(categorizedSchedules[dayName] || []), booking];
      });

      setSchedules(categorizedSchedules);
      // }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
      showModal(t("modal.error"), error.response.data.message, "Failed");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      fetchBookingDetails(0, true);
    }, [])
  );

  // useEffect(() => {
  //   fetchBookingDetails(0, true);
  // }, []);

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

  const renderScene = ({ route }) => {
    const bookingsOfDay = schedules[route.key] || [];
    const currentDate = new Date();
    const today = new Date(currentDate.setHours(0, 0, 0, 0));

    const pastBookings = bookingsOfDay.filter((item) => {
      const bookingDate = new Date(item.sessionDate);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    });

    const sortedBookings = pastBookings.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

    return (
      <ScheduleRender
        bookings={pastBookings}
        onLoadMore={loadMoreData}
        refreshing={refresh}
        onRefresh={handleRefresh}
        onViewDetail={viewDetail}
      />
    );
  };

  const viewDetail = useCallback((id) => {
    navigation.navigate('screen/detailsScheduleBooking', { bookingId: id });
  }, [navigation]);

  const handleViewDone = async () => {
    navigation.navigate('screen/completeBooking');
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t('schedule')}
        rightIcon={'checkmark-done-circle-outline'} onRightPress={() => handleViewDone()} />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        loading={loading}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            inactiveColor="gray"
            activeColor="#9C583F"
            indicatorStyle={{ backgroundColor: '#A9411D' }}
            style={{ backgroundColor: '#EBE5DD', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
            labelStyle={{ color: '#A9411D', fontFamily: "nunito-bold" }}
            tabStyle={{ paddingVertical: 0, width: 130 }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 250,
    backgroundColor: '#F9F5F0',
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemContentLabel: {
    fontFamily: "nunito-bold",
  },
  itemContent: {
    fontSize: 14,
    fontFamily: "nunito-regular"
  },
  highlighted: {
    borderWidth: 3,
    borderColor: "#F8BF40",
  }
});

export default Schedule;