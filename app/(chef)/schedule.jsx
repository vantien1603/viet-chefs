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

const dayInWeek = [
  { id: 0, label: 'Mon', full: 'Monday' },
  { id: 1, label: 'Tue', full: 'Tuesday' },
  { id: 2, label: 'Wed', full: 'Wednesday' },
  { id: 3, label: 'Thu', full: 'Thursday' },
  { id: 4, label: 'Fri', full: 'Friday' },
  { id: 5, label: 'Sat', full: 'Saturday' },
  { id: 6, label: 'Sun', full: 'Sunday' },
];

const ScheduleRender = ({ bookings, onLoadMore, refreshing, onRefresh, onViewDetail, loading }) => {
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity key={item.id} style={[styles.section, item.status === "IN_PROGRESS" && styles.highlighted]} onPress={() => onViewDetail(item.id)}>
        <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.booking?.customer?.fullName}</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: {item.sessionDate}</Text>
          {/* <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: {item.status}</Text> */}
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail">
          <Text style={styles.itemContentLabel}>Address: </Text>
          <Text style={styles.itemContent}>{item.location}</Text>
        </Text>
        <Text>
          <Text style={styles.itemContentLabel}>Dinner time: </Text>
          <Text style={styles.itemContent}>{item.startTime}</Text>
        </Text>
        <Text>
          <Text style={styles.itemContentLabel}>Travel time: </Text>
          <Text style={styles.itemContent}>{item.timeBeginTravel}</Text>
        </Text>
        <Text numberOfLines={2} ellipsizeMode="tail">
          <Text style={styles.itemContentLabel}>Dishes: </Text>
          {item.dishes?.length === 0 && (
            <Text style={styles.itemContent}>
              Not yet
            </Text>
          )}
          {item.dishes && item.dishes.map((dish) => (
            // <View>
            <Text key={dish.id} style={styles.itemContent}>{dish.dish?.name}, </Text>
            // </View>
          ))}

        </Text>
        <Text style={styles.itemContentLabel}>Price: {item.totalPrice}</Text>
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
        ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16, marginTop: 20 }}>No orders</Text>}
        ListFooterComponent={(loading ? <ActivityIndicator size="large" /> : <View style={{ height: 100 }} />)}
      />
    </View>
  );
};

const Schedule = () => {
  const axiosInstance = useAxios();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
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

  const [routes] = useState(dayInWeek.map((day) => ({ key: day.full, title: day.full })));

  const PAGE_SIZE = 20;

  const getDayOfWeekId = (date) => {
    const day = new Date(date).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const statuses = ['SCHEDULED_COMPLETE', 'in_PROGRESS'];

  const fetchBookingDetails = async (pageNum, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      // const response = await axiosInstance.get('/bookings/booking-details/chefs'
      //   , {
      //     params: {
      //       pageNo: pageNum,
      //       pageSize: PAGE_SIZE,
      //       sortBy: 'id',
      //       sortDir: 'asc',
      //     },
      //   }
      // );

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

      // if (response.status === 200) {
      // const data = response.data.content || [];
      // setTotalPages(response.data.totalPages);
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

      // mergedData.forEach((booking) => {
      //   const bookingDate = new Date(booking.sessionDate);
      //   const currentDate = new Date();
      //   // if (booking.status === 'SCHEDULED_COMPLETE' || booking.status === 'in_PROGRESS') {
      //   const dayOfWeekId = getDayOfWeekId(booking.sessionDate);
      //   const dayName = dayInWeek[dayOfWeekId].full;
      //   categorizedSchedules[dayName] = [...(categorizedSchedules[dayName] || []), booking];
      //   // }
      // });

      setSchedules(categorizedSchedules);
      // }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      // showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
      showModal("Error", error.response.data.message, "Failed");
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
      <Header title={'Schedule'}
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
            labelStyle={{ color: '#A9411D', fontWeight: 'bold' }}
            tabStyle={{ paddingVertical: 0, width: 130 }}
          />
        )}
      />


      {/* <ScrollView>
        {schedules.length > 0 ? schedules.map((item) = (
          <TouchableOpacity key={item.id} style={[styles.section,]} onPress={() => onViewDetail(item.id)}>
            <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.booking?.customer?.fullName}</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: {item.sessionDate}</Text>
            </View>
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Address: </Text>
              <Text style={styles.itemContent}>{item.location}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>Dinner time: </Text>
              <Text style={styles.itemContent}>{item.startTime}</Text>
            </Text>
            <Text>
              <Text style={styles.itemContentLabel}>Travel time: </Text>
              <Text style={styles.itemContent}>{item.timeBeginTravel}</Text>
            </Text>
            <Text numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Dishes: </Text>
              {item.dishes?.length === 0 && (
                <Text style={styles.itemContent}>
                  Not yet
                </Text>
              )}
              {item.dishes && item.dishes.map((dish) => (
                <Text key={dish.id} style={styles.itemContent}>{dish.dish?.name}, </Text>
              ))}

            </Text>
            <Text style={styles.itemContentLabel}>Price: {item.totalPrice}</Text>
          </TouchableOpacity>
        )) : (
          <Text style={{ textAlign: 'center' }}>No schedules</Text>
        )}
      </ScrollView> */}

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
    fontWeight: 'bold',
  },
  itemContent: {
    fontSize: 14,
  },
  highlighted: {
    borderWidth: 3,
    borderColor: "#F8BF40",
  }
});

export default Schedule;