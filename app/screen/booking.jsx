import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, useSegments } from "expo-router";
import { commonStyles } from "../../style";
import moment from "moment";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import { t } from "i18next";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCommonNoification } from "../../context/commonNoti";

const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }
  return timeSlots;
};

const getSurrounding30Days = () => {
  const today = moment();
  const startDate = today.clone().subtract(15, "days");
  const days = [];

  for (let i = 0; i < 30; i++) {
    const date = startDate.clone().add(i, "days");
    days.push({
      day: date.date(),
      dayOfWeek: date.format("ddd"),
      date,
    });
  }

  return days;
};

const timeSlots = generateTimeSlots();

const BookingScreen = () => {
  const {
    selectedMenu, setSelectedMenu,
    selectedDishes, setSelectedDishes,
    extraDishIds, setExtraDishIds,
    selectedDay, setSelectedDay,
    specialRequest, setSpecialRequest,
    numPeople, setNumPeople,
    startTime, setStartTime,
    dishNotes, setDishNotes,
    ingredientPrep, setIngredientPrep,
    address, setAddress,
    chefId, routeBefore, setRouteBefore } = useSelectedItems();
  const today = moment();
  const days = getSurrounding30Days();
  const [loading, setLoading] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isSubMenuExpanded, setIsSubMenuExpanded] = useState(false);
  const [tempDishNotes, setTempDishNotes] = useState({});
  const axiosInstance = useAxios();
  const [availability, setAvailability] = useState([]);
  const [dishIds, setDishIds] = useState([]);
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [dishesData, setDishesData] = useState([]);
  const modalizeRef = useRef(null);
  const [modalKey, setModalKey] = useState(0);
  const [dishesDataNote, setDishesDataNote] = useState([]);
  const requireAuthAndNetwork = useRequireAuthAndNetwork();
  const [errors, setErrors] = useState({});
  const { showModal } = useCommonNoification();


  useEffect(() => {
    fetchUnavailableDates();
  }, [chefId]);

  useEffect(() => {
    fetchAvailability();
  }, [chefId, selectedDay, address, numPeople, dishIds]);

  useEffect(() => {
    loadSelectedAddress();
  }, []);

  useEffect(() => {
    const menuDishIds = selectedMenu?.menuItems?.map((item) => item.dishId || item.id) || [];
    const extraDishId = Object.keys(extraDishIds) || [];
    const singleDishId = Object.keys(selectedDishes) || [];
    const allDishIds = [...new Set([...menuDishIds, ...extraDishId, ...singleDishId])];
    setDishIds(allDishIds);
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
  }, [selectedMenu, selectedDishes]);

  const fetchUnavailableDates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/bookings/unavailable-dates?chefId=${chefId}`);
      if (response.status === 200) {
        setUnavailableDates(response.data);
      }
    } catch (error) {
      if (error.response?.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.unavailableDatesLoadError"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedAddress = async () => {
    setLoading(true);
    try {
      const savedAddress = await AsyncStorage.getItem("selectedAddress");
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);
        setAddress(parsedAddress);
      }
    } catch (error) {
      console.error("Error loading selected address:", error);
    } finally {
      setLoading(false)
    }
  };


  console.log("dish note ben booking", dishNotes);
  console.log("dishes ben booking", selectedDishes);

  const fetchAvailability = async () => {
    if (!selectedDay || !address?.address) {
      return;
    }
    setIsFetchingAvailability(true);
    try {
      const date = selectedDay.format("YYYY-MM-DD");
      const menuIdParam = selectedMenu ? selectedMenu.id : null;
      const response = await axiosInstance.get(`/availability/chef/${chefId}/single-date`, {
        params: {
          date,
          customerLocation: address?.address,
          guestCount: numPeople,
          menuId: menuIdParam || undefined,
          dishIds: dishIds.length > 0 ? dishIds : undefined,
          maxDishesPerMeal: 6,
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, item));
            } else if (value !== undefined) {
              searchParams.append(key, value);
            }
          }
          return searchParams.toString();
        },
      }
      );
      if (response.status === 200) {
        setAvailability(response.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải danh sách availability", "Failed");
      showModal(t("modal.error"), error.response.data.message || t("errors.availabilityLoadError"), "Failed");
    } finally {
      setIsFetchingAvailability(false);
    }
  };



  const getAvailableTimeSlots = () => {
    if (!selectedDay) return [];

    const dayAvailabilities = availability.filter((avail) =>
      moment(avail.date).isSame(selectedDay, "day")
    );

    if (!dayAvailabilities.length) return [];

    const availableSlots = new Set();
    dayAvailabilities.forEach(
      ({ startTime: availStart, endTime: availEnd }) => {
        const [startHour, startMinute] = availStart.split(":").map(Number);
        const [endHour, endMinute] = availEnd.split(":").map(Number);
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        timeSlots.forEach((slot) => {
          const [slotHour, slotMinute] = slot.split(":").map(Number);
          const slotTimeInMinutes = slotHour * 60 + slotMinute;

          const isToday = selectedDay.isSame(moment(), "day");
          if (isToday) {
            const now = moment();
            const currentHour = now.hour();
            const currentMinute = now.minute();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            if (slotTimeInMinutes <= currentTimeInMinutes) {
              return;
            }
          }

          if (
            slotTimeInMinutes >= startTimeInMinutes &&
            slotTimeInMinutes <= endTimeInMinutes
          ) {
            availableSlots.add(slot);
          }
        });
      }
    );

    return Array.from(availableSlots).sort();
  };

  const availableTimeSlots = getAvailableTimeSlots();
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, "day");
  const isTodayOrBefore = (date) => date.isSameOrBefore(today, "day");
  const incrementPeople = () =>
    setNumPeople((prev) => (prev < 10 ? prev + 1 : prev));
  const decrementPeople = () =>
    setNumPeople((prev) => (prev > 1 ? prev - 1 : 1));

  const openAddressModal = () => {
    setErrors((prev) => ({ ...prev, address: false }));
    // setRouteBefore(segment);
    router.replace("/screen/chooseAddress");
  };

  const handleAddItems = () => {
    router.replace("/screen/selectFood");

  };

  const handleBack = () => {
    if (routeBefore[1] === "schedule") {
      router.replace(`${routeBefore[0]}/${routeBefore[1]}`);
    } else {
      router.replace("/screen/selectFood");
    }
  }

  const handleConfirmBooking = async () => {
    const hasError = !selectedDay || !startTime || !address;

    if (hasError) {
      if (!selectedDay) {
        setErrors((prev) => ({ ...prev, selectedDay: true }));
      }
      if (!startTime) {
        setErrors((prev) => ({ ...prev, startTime: true }));
      }
      if (!address) {
        setErrors((prev) => ({ ...prev, address: true }));
      }
      showModal("Thiếu thông tin", t("errors.missingInformation"), "Failed");
      return;
    }
    // setRouteBefore(segment);
    router.replace("screen/confirmBooking");
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

  const handleRemoveDish = (item) => {
    if (!item?.id && !item.dishId) return;
    if (selectedMenu) {
      setExtraDishIds((prev) => {
        const updated = { ...prev };
        delete updated[item.id || item.dishId];
        return updated;
      });
    }
    setSelectedDishes((prev) => {
      const updated = { ...prev };
      delete updated[item.id || item.dishId];
      return updated;
    });
  };

  const handleRemoveMenu = () => {
    setSelectedMenu(null);
    setSelectedDishes(extraDishIds);
    setExtraDishIds({});
  };

  const renderRightActions = (dish, type) => (
    <TouchableOpacity
      onPress={() => type === "menu" ? handleRemoveMenu() : handleRemoveDish(dish)}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 4,
        borderRadius: 10,
      }}
    >
      <FontAwesome name="remove" size={22} color="red" />
    </TouchableOpacity>
  );

  console.log(selectedDishes);

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title={t("booking")} onLeftPress={() => handleBack()} />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("numberOfPeople")}</Text>
          <View style={styles.numberPicker}>
            <TouchableOpacity
              style={[
                styles.numberButton,
                numPeople <= 1 && styles.disabledButton,
              ]}
              onPress={decrementPeople}
              disabled={numPeople <= 1}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.numberDisplay}>
              <Text style={styles.numberText}>{numPeople}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.numberButton,
                numPeople >= 10 && styles.disabledButton,
              ]}
              onPress={incrementPeople}
              disabled={numPeople >= 10}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, errors.address && styles.error]}>
          <Text style={styles.sectionTitle}>{t("address")}</Text>
          <TouchableOpacity
            onPress={openAddressModal}
            style={styles.locationContainer}
          >
            <MaterialIcons
              name="location-on"
              size={20}
              color="#A64B2A"
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>
              {address?.address || "Select an address"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, errors.selectedDay && styles.error]}>
          <Text style={styles.sectionTitle}>{t("selectDate")}</Text>
          <FlatList
            data={days}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            initialScrollIndex={15}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            renderItem={({ item }) => {
              const isUnavailable = unavailableDates.includes(
                item.date.format("YYYY-MM-DD")
              );
              const isTodayOrPast = isTodayOrBefore(item.date);
              return (
                <TouchableOpacity
                  style={[
                    styles.dayContainer,
                    isTodayOrPast && styles.disabledDay,
                    isSelectedDay(item.date) && styles.selectedDay,
                    isUnavailable && styles.unavailableDay,
                  ]}
                  disabled={isTodayOrPast || isUnavailable}
                  onPress={() => {
                    if (!isUnavailable && !isTodayOrPast) {
                      setSelectedDay(item.date);
                      setStartTime(null);
                      errors.selectedDay && setErrors((prev) => ({ ...prev, selectedDay: false }));

                    }
                  }}
                >
                  <Text
                    style={[
                      styles.dayOfWeek,
                      isSelectedDay(item.date) && styles.selectedText,
                      (isUnavailable || isTodayOrPast) &&
                      styles.unavailableText,
                    ]}
                  >
                    {item.dayOfWeek}
                  </Text>
                  <Text
                    style={[
                      styles.day,
                      isSelectedDay(item.date) && styles.selectedText,
                      (isUnavailable || isTodayOrPast) &&
                      styles.unavailableText,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {selectedDay && (
          <View style={[styles.timeContainer, errors.startTime && styles.error]}>
            <Text style={styles.sectionTitle}>{t("startTime")}</Text>
            {isFetchingAvailability ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A64B2A" />
              </View>
            ) : availableTimeSlots.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableTimeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      startTime === time && styles.timeButtonSelected,
                    ]}
                    onPress={() => {
                      errors.startTime && setErrors((prev) => ({ ...prev, startTime: false }));
                      setStartTime(time)
                    }}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        startTime === time && styles.timeButtonTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noTimeText}>{t("noSlotsAvailable")}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.menuHeader}>
            <TouchableOpacity
              style={styles.menuHeaderContent}
              onPress={() => setIsMenuExpanded(!isMenuExpanded)}
            >
              <Text style={styles.sectionTitle}>
                {t("order")}
              </Text>
              <MaterialIcons
                name={isMenuExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={30}
                color="#A64B2A"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddItems}>
              <Text style={styles.addItemsText}>{t("addItems")}</Text>
            </TouchableOpacity>
          </View>

          {isMenuExpanded && (
            <View style={styles.menuContent}>
              {selectedMenu?.menuItems && (
                <Swipeable renderRightActions={() => renderRightActions(selectedMenu, "menu")}>
                  <View style={{ borderWidth: 1, borderColor: '#777', borderStyle: 'dotted', padding: 5, borderRadius: 20 }}>
                    <View style={styles.dishInfo}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => setIsSubMenuExpanded(!isSubMenuExpanded)}
                      >
                        <Image
                          source={
                            selectedMenu.imageUrl
                              ? { uri: selectedMenu.imageUrl }
                              : require("../../assets/images/1.jpg")
                          }
                          style={styles.dishImage}
                          resizeMode="cover"
                        />
                        <View style={styles.dishText}>
                          <Text style={styles.dishName}>{selectedMenu.name}</Text>
                        </View>
                        <MaterialIcons
                          name={
                            isSubMenuExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"
                          }
                          size={24}
                          color="#A64B2A"
                        />
                      </TouchableOpacity>
                    </View>

                    {isSubMenuExpanded &&
                      selectedMenu.menuItems.map((item, idx) => (
                        <View key={idx} style={styles.dishRow}>
                          <View style={styles.dishInfo}>
                            <Image
                              source={
                                item.dishImageUrl
                                  ? { uri: item.dishImageUrl }
                                  : require("../../assets/images/1.jpg")
                              }
                              style={styles.dishImage}
                              resizeMode="cover"
                            />
                            <View style={styles.dishText}>
                              <Text style={styles.dishName}>{item.dishName}</Text>
                              {dishNotes[item.dishId || item.id] && (
                                <Text style={styles.noteText}>
                                  {t("note")}: {dishNotes[item.dishId || item.id]}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                </Swipeable>
              )}
              {dishesData.length > 0 &&
                dishesData.map((dish, idx) => (
                  <Swipeable
                    key={idx}
                    renderRightActions={() => renderRightActions(dish)}
                  >
                    <View
                      style={[
                        styles.dishRow,
                      ]}
                    >
                      <View style={styles.dishInfo}>
                        <Image
                          source={
                            dish.imageUrl || dish.dishImageUrl
                              ? { uri: dish.imageUrl || dish.dishImageUrl }
                              : require("../../assets/images/1.jpg")
                          }
                          style={styles.dishImage}
                          resizeMode="cover"
                        />
                        <View style={styles.dishText}>
                          <Text style={styles.dishName}>
                            {dish.name || dish.dishName || dish.dish.name || "Unnamed Dish"}
                          </Text>
                          {dishNotes?.[dish.id || dish.dishId] && (
                            <Text style={styles.noteText}>
                              {t("note")}: {dishNotes[dish.id || dish.dishId]}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Swipeable>
                ))}
              {!selectedMenu && dishesData.length === 0 && (
                <Text style={styles.noItemsText}>{t("noMenus")}</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionTitle}>{t("note")}</Text>
          <TouchableOpacity onPress={openModal}>
            <Text style={styles.editText}>{t("editNotes")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("specialRequest")}</Text>
          <TextInput
            style={styles.specialRequestInput}
            placeholder={t("enterYourRequest")}
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("ingredientPreparation")}</Text>
          <View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
              }}
              onPress={() => setIngredientPrep("customer")}
            >
              <MaterialIcons
                name={
                  ingredientPrep === "customer"
                    ? "check-box"
                    : "check-box-outline-blank"
                }
                size={24}
                color={ingredientPrep === "customer" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>
                {t("IWillPrepareIngredients")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => setIngredientPrep("chef")}
            >
              <MaterialIcons
                name={
                  ingredientPrep === "chef"
                    ? "check-box"
                    : "check-box-outline-blank"
                }
                size={24}
                color={ingredientPrep === "chef" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>
                {t("chefWillPrepareIngredients")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView >

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={() => requireAuthAndNetwork((handleConfirmBooking))} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>{t("confirmBooking")}</Text>
          )}
        </TouchableOpacity>
      </View>

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
    </GestureHandlerRootView >
  );
};

const styles = StyleSheet.create({
  section: {
    borderTopColor: "#E5E5E5",
    borderTopWidth: 1,
    paddingVertical: 20,
  },
  error: {
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 15,
  },
  numberPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#A64B2A",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#D1D1D1",
  },
  numberButtonText: {
    fontSize: 24,
    color: "white",
    fontFamily: "nunito-bold",
  },
  numberDisplay: {
    flex: 1,
    alignItems: "center",
  },
  numberText: {
    fontSize: 24,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "center",
  },
  menuHeaderContent: {
    flexDirection: "row",
    // alignItems: "center",
  },
  addItemsText: {
    fontSize: 16,
    color: "#A64B2A",
    fontFamily: "nunito-bold",
  },
  menuContent: {
    marginTop: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dishRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    padding: 5,
    borderRadius: 8,
  },
  dishInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dishText: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold",
  },
  noteText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    fontFamily: "nunito-regular",
  },
  latestTag: {
    fontSize: 12,
    color: "#A64B2A",
    marginTop: 5,
    fontFamily: "nunito-bold",
  },
  editText: {
    fontSize: 14,
    color: "#A64B2A",
    fontFamily: "nunito-bold",
  },
  noItemsText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    fontFamily: "nunito-regular",
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#519254",
    borderRadius: 12,
    width: 80,
  },
  disabledDay: {
    backgroundColor: "#D1D1D1",
  },
  selectedDay: {
    backgroundColor: "#A9411D",
    borderWidth: 2,
    borderColor: "#F8BF40",
  },
  unavailableDay: {
    backgroundColor: "#FF4D4D",
    opacity: 0.7,
  },
  selectedText: {
    color: "white",
    fontFamily: "nunito-bold",
  },
  unavailableText: {
    color: "white",
    fontFamily: "nunito-regular",
  },
  timeContainer: {
    paddingVertical: 10,
  },
  timeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  timeButtonSelected: {
    backgroundColor: "#A9411D",
    borderColor: "#A9411D",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold",
  },
  timeButtonTextSelected: {
    color: "white",
    fontFamily: "nunito-bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
    flexWrap: "wrap",
    fontFamily: "nunito-regular",
  },
  specialRequestInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    backgroundColor: "#FFF",
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    fontFamily: "nunito-regular",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 18,
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
    marginBottom:50
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
  noTimeText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "nunito-regular",
  },
  noAddressesText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "nunito-regular",
  },
  addressItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontFamily: "nunito-regular",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    fontFamily: "nunito-regular",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#777",
    fontFamily: "nunito-regular",
  },
  ingredientPrepContainer: {
    marginTop: 10,
  },
});

export default BookingScreen;