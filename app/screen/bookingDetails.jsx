import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { useCommonNoification } from "../../context/commonNoti";

const BookingDetailScreen = () => {
  const { t } = useTranslation();
  const {
    selectedMenu,
    selectedDishes,
    extraDishIds,
    dishNotes, setDishNotes,
    chefId, bookingDetailId } = useSelectedItems();
  const [bookingDetail, setBookingDetail] = useState(null);
  const [dishNames, setDishNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const axiosInstance = useAxios();
  const [dishIds, setDishIds] = useState([]);
  const [dishesDataNote, setDishesDataNote] = useState([]);
  const [tempDishNotes, setTempDishNotes] = useState({});
  const { showModal } = useCommonNoification();
  const [dishesData, setDishesData] = useState([]);
  const [calcu, setCalcu] = useState(null);
  const modalizeRef = useRef(null);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    if (bookingDetailId) {
      fetchBookingDetail();
    }
  }, []);

  useEffect(() => {
    if (!bookingDetail?.isUpdated) {
      const extraDishId = Object.keys(extraDishIds) || [];
      setDishIds(extraDishId);
      const allDishes = [
        ...Object.values(extraDishIds),
        ...Object.values(selectedDishes),
      ];
      const allDishesNote = [
        ...Object.values(extraDishIds),
        ...Object.values(selectedDishes),
        ...(selectedMenu?.menuItems ? selectedMenu.menuItems : []),
      ];
      setDishesDataNote(allDishesNote);
      setDishesData(allDishes);
      handleCalculate(allDishesNote);
    }
  }, [bookingDetail, selectedMenu, selectedDishes, extraDishIds, dishNotes]);

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const openModal = () => {
    setTempDishNotes(dishNotes);
    setModalKey((prev) => prev + 1);
    setTimeout(() => {
      modalizeRef.current?.open();
    }, 100)
  };
  const saveNotes = () => {
    setDishNotes(tempDishNotes);
    modalizeRef.current?.close();
  };

  const cancelNotes = () => modalizeRef.current?.close();

  const handleCalculate = async (allDishesNote) => {
    if (bookingDetail.isUpdated) return;
    console.log("vaosd")
    setLoading(true);
    try {
      const calculateData = {
        menuId: selectedMenu ? selectedMenu.id : null,
        extraDishIds: selectedMenu
          ? Object.keys(extraDishIds).map((key) => extraDishIds[key].id)
          : Object.keys(selectedDishes).map(
            (key) => selectedDishes[key].id
          ),
        dishes: allDishesNote.map((dish) => ({
          dishId: dish.id || dish.dishId,
          notes: dishNotes[dish.id] || null,
        })),
      };

      console.log("Calculate data:", JSON.stringify(calculateData, null, 2));

      const response = await axiosInstance.post(
        `/bookings/booking-details/${bookingDetailId}/calculate`,
        calculateData
      );
      setCalcu(response.data);
      console.log('response', response.data);

      // const updateData = {
      //   dishes: selectedDishes.map((dish) => ({
      //     dishId: dish.dishId, // Chuẩn hóa cấu trúc
      //     notes: dish.notes,
      //   })),
      //   totalPrice: response.data.totalPrice || 0,
      //   chefCookingFee: response.data.chefCookingFee || 0,
      //   priceOfDishes: response.data.priceOfDishes || 0,
      //   arrivalFee: response.data.arrivalFee || 0,
      //   platformFee: response.data.platformFee || 0,
      //   totalChefFeePrice: response.data.totalChefFeePrice || 0,
      //   discountAmout: response.data.discountAmout || 0,
      //   timeBeginCook: response.data.timeBeginCook,
      //   timeBeginTravel: response.data.timeBeginTravel,
      //   menuId: selectedMenu ? parseInt(selectedMenu) : null, // Cho phép menuId là null
      //   extraDishIds: selectedExtraDishIds,
      //   chefBringIngredients: ingredientPrep === "chef",
      // };
    } catch (error) {
      // console.log("er", error.response?.data);
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.calculateFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };


  const fetchBookingDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingDetailId}`
      );
      // console.log("Booking detail:", JSON.stringify(response.data, null, 2));
      setBookingDetail(response.data);

      if (response.data.dishes && response.data.dishes.length > 0) {
        const dishPromises = response.data.dishes.map(async (dish) => {
          try {
            console.log(dish.dish.id);
            const dishResponse = await axiosInstance.get(
              `/dishes/${dish.dish.id}`
            );
            return { dishId: dish.dish.id, dishName: dishResponse.data.name };
          } catch (error) {
            showModal(
              t("modal.error"),
              `Error fetching dish ${dish.dish.id}`,
              "Failed"
            );
            return { dishId: dish.dish.id, dishName: `Dish ${dish.dish.id}` };
          }
        });
        const dishResults = await Promise.all(dishPromises);
        const dishNamesMap = dishResults.reduce((acc, { dishId, dishName }) => {
          acc[dishId] = dishName;
          return acc;
        }, {});
        setDishNames(dishNamesMap);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("failedToLoadBookingDetail") + "111", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = {
        dishes: calcu.dishes,
        totalPrice: calcu.totalPrice,
        chefCookingFee: calcu.chefCookingFee,
        priceOfDishes: calcu.priceOfDishes,
        arrivalFee: calcu.arrivalFee,
        platformFee: calcu.platformFee,
        totalChefFeePrice: calcu.totalChefFeePrice,
        discountAmout: calcu.discountAmout,
        timeBeginCook: calcu.timeBeginCook,
        timeBeginTravel: calcu.timeBeginTravel,
        totalCookTime: calcu.totalCookTime,
        chefBringIngredients: bookingDetail.chefBringIngredients,
      }
      const response = await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailId}`,
        payload
      );

      console.response(response.status);
      console.response(response.data);
      await fetchBookingDetail(bookingDetailId);
      showModal(t("modal.success"), t("bookingDetailUpdated"));
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), error.response.data.message || t("failedToUpdateBookingDetail"), "Failed");
    } finally {
      setUpdating(false);
    }
  };



  // useEffect(() => {
  //   if (updateData) {
  //     handleUpdate(updateData);
  //   }
  // }, [updateData]);

  const navigateToUpdateScreen = () => {
    router.replace({
      pathname: "/screen/updateBookingDetail",
      // params: { bookingDetailId, chefId },
    });
  };

  const handleBack = () => {
    router.replace('/screen/longTermDetails')
  }
  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("sessionDetail")} onLeftPress={() => handleBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A64B2A" />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetail) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("sessionDetail")} onLeftPress={() => handleBack()} />
        <View style={styles.noDataContainer}>
          <MaterialIcons name="error-outline" size={40} color="#A64B2A" />
          <Text style={styles.noDataText}>{t("noBookingDetailAvailable")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaView
        style={[commonStyles.container,]}
      >
        <Header title={t("sessionDetail")} onLeftPress={() => handleBack()} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Booking Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("bookingInfo")}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="calendar-today" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("sessionDate")}: </Text>
              <Text style={styles.detailValue}>{bookingDetail.sessionDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("startTime")}: </Text>
              <Text style={styles.detailValue}>{bookingDetail.startTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("location")}: </Text>
              <Text style={styles.detailValue}>{bookingDetail.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="info" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("status")}: </Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      bookingDetail.status === "COMPLETED"
                        ? "#2ECC71"
                        : "#E74C3C",
                  },
                ]}
              >
                {formatStatus(bookingDetail.status)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="attach-money" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("totalPrice")}: </Text>
              <Text style={styles.detailValue}>${bookingDetail.totalPrice || calcu?.totalPrice?.toFixed(2)}</Text>
            </View>
          </View>

          {/* Fee Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("chefCookingFee")}: </Text>
              <Text style={styles.detailValue}> ${bookingDetail.chefCookingFee || calcu?.chefCookingFee.toFixed(2) || 0}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("priceOfDishes")}: </Text>
              <Text style={styles.detailValue}>
                ${bookingDetail.priceOfDishes || calcu?.priceOfDishes.toFixed(2) || 0}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("arrivalFee")}: </Text>
              <Text style={styles.detailValue}>${bookingDetail.arrivalFee || calcu?.arrivalFee.toFixed(2) || 0}</Text>
            </View>
            {bookingDetail.chefServingFee && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("chefServingFee")}: </Text>
                <Text style={styles.detailValue}>
                  ${bookingDetail.chefServingFee || 0}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("platformFee")}: </Text>
              <Text style={styles.detailValue}>${bookingDetail.platformFee || calcu?.platformFee.toFixed(2) || 0}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("totalChefFee")}: </Text>
              <Text style={styles.detailValue}>
                ${bookingDetail.totalChefFeePrice || calcu?.totalChefFeePrice.toFixed(2) || 0}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("discountAmount")}: </Text>
              <Text style={styles.detailValue}>
                ${bookingDetail.discountAmout || calcu?.discountAmout.toFixed(2) || 0}
              </Text>
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("schedule")}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="kitchen" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("timeBeginCook")}: </Text>
              <Text style={styles.detailValue}>
                {bookingDetail.isUpdated ? bookingDetail.timeBeginCook : calcu?.timeBeginCook || bookingDetail.timeBeginCook}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="directions-car" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("timeBeginTravel")}: </Text>
              <Text style={styles.detailValue}>
                {bookingDetail.isUpdated ? bookingDetail.timeBeginTravel : calcu?.timeBeginTravel || bookingDetail.timeBeginTravel}
              </Text>
            </View>
          </View>


          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("menus")}</Text>
            {bookingDetail.menuId ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text>{t("menuId")}</Text>
                <Text>{bookingDetail.menuId}</Text>
              </View>
            ) : (
              selectedMenu && (
                <View style={styles.detailRow}>
                  <MaterialIcons style={{ marginRight: 10 }} name="restaurant-menu" size={18} color="#A64B2A" />
                  <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                    {selectedMenu.name}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Dishes */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>{t("dishes")}</Text>
              {(!bookingDetail.isUpdated && dishesDataNote.length > 0) && (
                <TouchableOpacity onPress={openModal}>
                  <Text style={styles.detailLabel}>{t("editNotes")}</Text>
                </TouchableOpacity>
              )}
            </View>

            {bookingDetail.isUpdated ? (
              bookingDetail.dishes.map((dish, index) => (
                <View key={index} style={styles.dishItem}>
                  <View style={styles.dishRow}>
                    <MaterialIcons name="fiber-manual-record" size={10} color="#A64B2A" />
                    <Text style={styles.detailLabel}>{t("dishName")}: </Text>
                    <Text style={styles.detailValue}>
                      {dishNames[dish.dish.id] || t("loading")}
                    </Text>
                  </View>
                  {dish.notes && (
                    <View style={[styles.dishRow, { marginLeft: 20 }]}>
                      <MaterialIcons name="note" size={16} color="#666" />
                      <Text style={styles.detailLabel}>{t("note")}: </Text>
                      <Text style={styles.detailValue}>{dish.dish.notes}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : Object.values(selectedDishes).length === 0 && !selectedMenu ? (
              <TouchableOpacity
                onPress={navigateToUpdateScreen}
                style={{
                  borderColor: "black",
                  borderWidth: 1,
                  borderStyle: "dotted",
                  paddingHorizontal: 20,
                  width: "80%",
                  borderRadius: 5,
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                  paddingVertical: 10,
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <Ionicons name="add" size={24} color="black" />
                <Text style={styles.addItemsText}>
                  {t("addMenuOrFood")}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {Object.values(dishesData).map((dish, index) => (
                  <View key={index} style={styles.dishRow}>
                    <MaterialIcons name="fiber-manual-record" size={10} color="#A64B2A" />
                    {/* <Text style={styles.detailLabel}>{t("dishName")}: </Text> */}
                    <Text style={styles.detailValue}> {dish.name}
                      {dishNotes[dish.dishId || dish.id] && (
                        <Text style={[styles.detailValue, { fontSize: 12 }]}> (
                          {t("note")}: {dishNotes[dish.dishId || dish.id]})
                        </Text>
                      )}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={navigateToUpdateScreen}
                  style={{
                    marginTop: 12,
                    borderColor: "black",
                    borderWidth: 1,
                    borderStyle: "dotted",
                    paddingHorizontal: 20,
                    borderRadius: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "center",
                    paddingVertical: 10,
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Ionicons name="add" size={24} color="black" />
                  <Text style={styles.addItemsText}>{t("addItems")}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("ingredients")}</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="shopping-basket" size={18} color="#A64B2A" />
              <Text style={styles.detailLabel}>{t("ingredients")}: </Text>
              <Text style={styles.detailValue}>
                {bookingDetail.chefBringIngredients
                  ? t("chefBringIngredients")
                  : t("customerBringIngredients")}
              </Text>
            </View>
          </View>
        </ScrollView>

        {
          !bookingDetail.isUpdated && (
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.disabledButton]}
              onPress={() => handleUpdate()}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.updateButtonText}>{t("update")}</Text>
              )}
            </TouchableOpacity>
          )
        }
      </SafeAreaView >
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        // handlePosition="outside"
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        key={modalKey}
      >
        <Text style={styles.modalTitle}>{t("editNotesForDishes")}</Text>
        <ScrollView style={styles.modalContent}>
          {dishesDataNote?.length > 0 ? (
            dishesDataNote.map((dish) => (
              <View key={dish.id || dish.dishId} style={styles.dishNoteContainer}>
                <Text style={styles.dishNoteLabel}>{dish.name || dish.dishName}</Text>
                <TextInput
                  style={styles.dishNoteInput}
                  placeholder={t("addYourRequestHere")}
                  value={tempDishNotes[dish.id || dish.dishId] || ""}
                  onChangeText={(text) =>
                    setTempDishNotes((prev) => ({ ...prev, [dish.id || dish.dishId]: text }))
                  }
                  multiline
                />
              </View>
            ))
          ) : (
            <Text style={styles.noDishesText}>
              {t("noDishesToAddNotesFor")}
            </Text>
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelNotes}>
              <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveNotes}>
              <Text style={styles.saveButtonText}>{t("save")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
    marginLeft: 8,
    // width: 150,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontFamily: "nunito-regular",
  },
  dishItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 8,
  },
  dishRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#A64B2A",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "nunito-regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A64B2A",
    marginTop: 8,
    fontFamily: "nunito-regular",
  },
  updateButton: {
    backgroundColor: "#A64B2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalStyle: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,

  },
  handleStyle: {
    backgroundColor: "#A64B2A",
    width: 40,
    height: 5,
    borderRadius: 5,
  },
  modalContent: {
    height: '500',
    padding: 20,
    paddingBottom: 100,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  dishNoteContainer: {
    marginBottom: 10,
  },
  dishNoteLabel: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 5,
  },
  dishNoteInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
    fontFamily: "nunito-regular",
  },
  noDishesText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "nunito-regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 50
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#D1D1D1",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#A64B2A",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  saveButtonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
});

export default BookingDetailScreen;
