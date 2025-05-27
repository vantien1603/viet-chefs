import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { commonStyles } from '../../style'
import useAxios from '../../config/AXIOS_API'
import { AuthContext } from '../../config/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { useCommonNoification } from '../../context/commonNoti'
import axios from 'axios'
import { useConfirmModal } from '../../context/commonConfirm'
import { t } from 'i18next'


const BookingHistories = ({ bookings, onLoadMore, refreshing, onRefresh, onAccept, onReject, onCancel, onViewDetail }) => {
  const renderItem = ({ item }) => {
    let sessionDateDisplay = '';

    if (
      item.bookingType === 'SINGLE' &&
      Array.isArray(item.bookingDetails) &&
      item.bookingDetails.length > 0
    ) {
      sessionDateDisplay = item.bookingDetails[0]?.sessionDate || '';
    } else if (
      item.bookingType === 'LONG_TERM' &&
      Array.isArray(item.bookingDetails) &&
      item.bookingDetails.length > 0
    ) {
      const details = item.bookingDetails
        .map((d) => d?.sessionDate)
        .filter(Boolean)
        .sort();

      if (details.length <= 5) {
        const grouped = {};

        for (let date of details) {
          const [year, month, day] = date.split('-');
          const key = `${year}-${month}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(day.replace(/^0/, ''));
        }

        const formatted = Object.entries(grouped)
          .map(([key, days]) => `${key}-${days.join(',')}`)
          .join(' | ');

        sessionDateDisplay = formatted;
      } else {
        const first = details[0];
        const last = details[details.length - 1];
        sessionDateDisplay = `${first} ~ ${last}`;
      }
    }

    return (
      <View key={item.id} style={styles.section}>
        <TouchableOpacity onPress={() => onViewDetail(item.id)} >
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: "nunito-bold" }}>{t("sessionDate")}: {sessionDateDisplay}</Text>
            <Text style={[styles.itemContentLabel, { textAlign: 'right', fontSize: 20 }]}>${item.totalPrice}</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>{t("customer")}: </Text>
            <Text style={{ fontSize: 16, fontFamily: "nunito-bold" }}>{item.customer.fullName}</Text>
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>{t("phone")}: </Text>
            <Text style={styles.itemContent}>{item.customer.phone}</Text>
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>{t("address")}: </Text>
            <Text style={styles.itemContent}>46/1 Tan Hoa 2, Hiep Phu, Q9</Text>
          </Text>
          <Text>
            <Text style={styles.itemContentLabel}>{t("bookingType")}: </Text>
            <Text style={styles.itemContent}>{item.bookingType === "LONG_TERM" ? item.bookingPackage.name : item.bookingType}</Text>
          </Text>
          <Text>
            <Text style={styles.itemContentLabel}>{t("guest")}: </Text>
            <Text style={styles.itemContent}>{item.guestCount}</Text>
          </Text>
          <Text numberOfLines={2} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>{t("note")}: </Text>
            <Text style={styles.itemContent}>{item.requestDetails}</Text>
          </Text>
          {/* <Text style={[styles.itemContentLabel,{textAlign:'right', fontSize:20}]}>${item.totalPrice}</Text> */}
        </TouchableOpacity>
        {item.status === "PAID" || item.status === "DEPOSITED" || item.status === "PAID_FIRST_CYCLE" ? (
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-around' }}>
            <TouchableOpacity style={{ backgroundColor: "green", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onAccept(item.id)}>
              <Text style={{ textAlign: 'center', color: 'white', fontFamily: "nunito-bold" }}>{t("confirm")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: "red", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onReject(item.id)}>
              <Text style={{ textAlign: 'center', color: 'white', fontFamily: "nunito-bold" }}>{t("reject")}</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === "CONFIRMED_PAID" || item.status === "CONFIRMED_PARTIALLY_PAID" || item.status === "CONFIRMED" && (
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ backgroundColor: "red", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onCancel(item.id, item.bookingType === "SINGLE" && "single")}>
              <Text style={{ textAlign: 'center', color: 'white', fontFamily: "nunito-bold" }}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

    )
  }
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16, fontFamily: "nunito-regular" }}>{t("noPendingOrders")}</Text>}
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />
    </View>
  );
};

const Histories = () => {
  const axiosInstance = useAxios();
  const [bookings, setBookings] = useState({
    PAID: [],
    CONFIRMED: [],
    CANCELED: []
  });
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const PAGE_SIZE = 10;
  const [totalPages, setTotalPages] = useState({
    PAID: 0,
    CONFIRMED: 0,
    CANCELED: 0
  });
  const [page, setPage] = useState({
    PAID: 0,
    CONFIRMED: 0,
    CANCELED: 0
  });
  const [index, setIndex] = React.useState(0);
  const navigation = useNavigation();
  const [routes] = React.useState([
    { key: 'new', title: 'New' },
    { key: 'confirmed', title: 'Confirmed' },
    { key: 'canceled', title: 'Canceled' },
  ]);

  const { showModal } = useCommonNoification();
  const { showConfirm } = useConfirmModal();

  useEffect(() => {
    fetchRequestBooking(0, 'PAID', true);
    fetchRequestBooking(0, 'CONFIRMED', true);
    fetchRequestBooking(0, 'CANCELED', true);
  }, []);

  const fetchRequestBooking = async (page, status, isRefresh = false) => {

    if (loading && !isRefresh) return;
    setLoading(true);
    if (isRefresh == true) {
    }
    try {
      const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
        params: {
          status: status,
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "asc",
        },
      });

      if (response.status === 200) {
        const bookingData = response.data.content || response.data || [];
        console.log(bookingData.length)
        // setTotalPages(response.data.totalPages);
        setTotalPages(prev => ({
          ...prev,
          [status]: response.data.totalPages
        }));
        setBookings(prev => ({
          ...prev,
          [status]: isRefresh ? bookingData : [...prev[status], ...bookingData]
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("fetchDataFailed"), t("modal.failed"));
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }



  const loadMoreData = async () => {
    console.log('cc');
    // if (!loading && page + 1 <= totalPages - 1) {
    //   let c = 1
    //   console.log("goi load more lan", c++)
    //   const nextPage = page + 1;
    //   setPage(nextPage);
    //   await fetchRequestBooking(nextPage);
    // }
    if (!loading) {
      if (index === 0 && page.PAID + 1 < totalPages.PAID - 1) {
        const nextPage = page.PAID + 1;
        setPage(prev => ({
          ...prev,
          PAID: prev.PAID + 1
        }));

        await fetchRequestBooking(nextPage, 'PAID');
      } else if (index === 1 && page.CONFIRMED + 1 < totalPages.CONFIRMED - 1) {
        const nextPage = page.CONFIRMED + 1;
        setPage(prev => ({
          ...prev,
          CONFIRMED: prev.CONFIRMED + 1
        }));
        await fetchRequestBooking(nextPage, 'CONFIRMED');
      } else if (index === 2 && page.CANCELED + 1 < totalPages.CANCELED - 1) {
        console.log("asd", index);
        const nextPage = page.CANCELED + 1;
        setPage(prev => ({
          ...prev,
          CANCELED: prev.CANCELED + 1
        }));

        await fetchRequestBooking(nextPage, 'CANCELED');
      }
    }
  };
  const handleRefresh = async () => {
    setRefresh(true);
    if (index === 0) {
      setPage(prev => ({
        ...prev,
        PAID: 0
      }));
      await fetchRequestBooking(0, 'PAID', true);
    } else if (index === 1) {
      setPage(prev => ({
        ...prev,
        CONFIRMED: 0
      }));
      await fetchRequestBooking(0, 'CONFIRMED', true);
    } else if (index === 2) {
      setPage(prev => ({
        ...prev,
        CANCELED: 0
      }));
      await fetchRequestBooking(0, 'CANCELED', true);
    }
    setRefresh(false);
  };


  const handleReject = async (id) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/reject`);
      if (response.status === 200) {
        // setNewBooking(prev => prev.filter(item => item.id !== id));
        setBookings(prev => ({ ...prev, PAID: prev.PAID.filter(item => item.id !== id) }));
        showModal(t("modal.success"), t("rejectSuccess"));
        // fetchRequestBooking(0, true)
      }

    } catch (error) {
      const mes = error.response.data?.message;
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), mes, t("modal.failed"));
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (id) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/confirm`);
      if (response.status === 200) {
        // setNewBooking(prev => prev.filter(item => item.id !== id));
        setBookings(prev => ({ ...prev, PAID: prev.PAID.filter(item => item.id !== id) }));
        showModal(t("modal.success"), t("confirmSuccess"));
        // fetchRequestBooking(0, true)
      }
    } catch (error) {
      const mes = error.response.data?.message;
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), mes, t("modal.failed"));
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id, type) => {
    showConfirm(t("modal.warning"), t("cancelHisChef"), async () => {
      setLoading(true);
      try {
        console.log(type, id);
        const response = type === "single" ? await axiosInstance.put(`/bookings/single/cancel-chef/${id}`) : await axiosInstance.put(`/bookings/long-term/cancel-chef/${id}`);
        if (response.status === 200) {
          showModal(t("modal.success"), "Cancel successfully");
          // fetchRequestBooking(0, 'CONFIRMED', true);
          setBookings(prev => ({ ...prev, CONFIRMED: prev.CONFIRMED.filter(item => item.id !== id) }));
        }
      } catch (error) {
        const mes = error.response.data?.message;
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal(t("modal.error"), mes, t("modal.failed"))
      } finally {
        setLoading(false);
      }
    });

  }


  const viewDetail = useCallback((id) => {
    console.log("goi ne")
    navigation.navigate("screen/detailsBooking", { bookingId: id });
  }, []);


  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'new':
        return (
          <BookingHistories
            bookings={bookings.PAID}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onAccept={handleAccept}
            onReject={handleReject}
            onViewDetail={viewDetail}
          />
        );
      case 'confirmed':
        return (
          <BookingHistories
            bookings={bookings.CONFIRMED}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onCancel={handleCancel}
            onViewDetail={viewDetail}
          />
        );
      case 'canceled':
        return (
          <BookingHistories
            bookings={bookings.CANCELED}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onViewDetail={viewDetail}
          />
        );
      default:
        return null;
    }
  };


  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={"Orders"} />
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              scrollEnabled={true}
              indicatorStyle={{ backgroundColor: '#9C583F', height: 3 }}
              style={{
                backgroundColor: '#EBE5DD',
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
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 300,
    backgroundColor: "#F9F5F0",
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    // marginHorizontal: 10,
  },
  itemContentLabel: {
    fontFamily: "nunito-bold"
  },
  itemContent: {
    fontSize: 14,
    fontFamily: "nunito-regular"
  }
});
export default Histories
