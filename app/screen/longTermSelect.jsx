import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Header from "../../components/header";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import useAxios from "../../config/AXIOS_API";
import moment from "moment";
import { commonStyles } from "../../style";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { router } from "expo-router";
import { useSelectedItems } from "../../context/itemContext";

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

const timeSlots = generateTimeSlots();

const groupDatesByWeek = (dates) => {
  const sortedDates = dates.sort();
  const weeks = [];

  if (sortedDates.length === 0) return weeks;

  let currentWeek = [];
  let weekStart = moment(sortedDates[0]).startOf("week");
  let weekEnd = weekStart.clone().endOf("week");

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const date = moment(dateStr);

    if (date.isBetween(weekStart, weekEnd, undefined, "[]")) {
      currentWeek.push(dateStr);
    } else {
      weeks.push({
        start: weekStart.format("MMM D"),
        end: weekEnd.format("MMM D"),
        dates: currentWeek,
      });

      weekStart = date.clone().startOf("week");
      weekEnd = weekStart.clone().endOf("week");
      currentWeek = [dateStr];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push({
      start: weekStart.format("MMM D"),
      end: weekEnd.format("MMM D"),
      dates: currentWeek,
    });
  }
  return weeks;
};

const LongTermSelectBooking = () => {
  const {
    numPeople,
    address,
    chefId,
    selectedPackage,
    setIsLong,
    selectedDay,
    setSelectedDay,
    startTime,
    setStartTime,
    ingredientPrep,
    setIngredientPrep,
    dishNotes,
    setDishNotes,
    selectedMenuLong,
    setSelectedMenuLong,
    selectedDishes,
    setSelectedDishes,
    extraDishIds,
    setExtraDishIds,
    selectedDates,
    setSelectedDates,
    isSelected,
    setIsSelected,
    expandedWeeks, setExpandedWeeks
  } = useSelectedItems();

  const axiosInstance = useAxios();
  const [currentDish, setCurrentDish] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [availability, setAvailability] = useState({});
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  // const [expandedWeeks, setExpandedWeeks] = useState({});
  const modalizeRef = useRef(null);
  const infoModalizeRef = useRef(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [activeDish, setActiveDish] = useState(null);
  const { showModal } = useCommonNoification();
  const todayString = moment().format("YYYY-MM-DD");
  const [tempNote, setTempNote] = useState("");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [isExpanedCalenda, setIsExpanedCalenda] = useState(true);
  const toggleDishActive = (date, dishId) => {
    setActiveDish((prev) =>
      prev?.date === date && prev?.dishId === dishId ? null : { date, dishId }
    );
  };

  useEffect(() => {
    fetchUnavailableDates();
  }, []);

  useEffect(() => {
    if (selectedDates.length > 0 && address && numPeople) {
      fetchAvailability();
    }
  }, [selectedDates]);

  const fetchUnavailableDates = async () => {
    try {
      const response = await axiosInstance.get(
        `/bookings/unavailable-dates?chefId=${chefId}`
      );
      setUnavailableDates(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchBookingFailed"),
        "Failed"
      );
    }
  };

  const fetchAvailability = async () => {
    try {
      const requestBody = selectedDates.map((date) => {
        const menuId = selectedMenuLong[date]?.id || null;
        const extraDishId = Array.isArray(extraDishIds[date])
          ? extraDishIds[date].map((dish) => dish.id || dish.dishId)
          : [];
        const singleDishId =
          !selectedMenuLong[date] && Array.isArray(selectedDishes[date])
            ? selectedDishes[date].map((dish) => dish.id || dish.dishId)
            : [];
        const menuDishId = Array.isArray(selectedMenuLong[date])
          ? selectedMenuLong[date].map((dish) => dish.id || dish.dishId)
          : [];
        const dishIds = [
          ...new Set([...singleDishId, ...extraDishId, ...menuDishId]),
        ];
        return {
          sessionDate: date,
          ...(menuId && { menuId }),
          ...(dishIds.length > 0 && { dishIds }),
        };
      });
      const response = await axiosInstance.post(
        `/availability/chef/${chefId}/multiple-dates`,
        requestBody,
        {
          params: {
            customerLocation: address.address,
            guestCount: numPeople,
            maxDishesPerMeal: selectedPackage.maxDishesPerMeal,
          },
        }
      );
      if (response.status === 200) setAvailability(response.data);
    } catch (error) {
      console.log("Error fetching availability:", error);
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchAvailabilityFailed"),
        "Failed"
      );
      setAvailability({});
    } finally {
    }
  };
  const handleRepeatSelection = () => {
    if (!isRepeatEnabled || selectedWeekdays.length === 0) {
      showModal(
        t("modal.error"),
        t("errors.selectAtLeastOneWeekday"),
        "Failed"
      );
      return;
    }

    const maxDays = selectedPackage.durationDays;
    const resultDates = [];

    let currentDate = moment(todayString).add(1, "day");
    let loopSafetyLimit = 0;

    while (resultDates.length < maxDays) {
      const dateString = currentDate.format("YYYY-MM-DD");
      const dayOfWeek = currentDate.day();

      const isValid =
        selectedWeekdays.includes(dayOfWeek) &&
        !unavailableDates.includes(dateString);

      if (isValid) {
        resultDates.push(dateString);
      }

      currentDate.add(1, "day");

      loopSafetyLimit++;
      if (loopSafetyLimit > 370) {
        showModal(
          t("modal.error"),
          t("errors.cannotSelectEnoughDays"),
          "Failed"
        );
        return;
      }
    }

    setSelectedDates(resultDates);
    showModal(t("modal.success"),
      t("datesSelectedWithRepeat", { count: resultDates.length }),
    );
  };

  const toggleWeekday = (day) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekIndex]: !prev[weekIndex],
    }));
  };

  const showRepeatInfo = () => {
    setInfoModalVisible(true);
    infoModalizeRef.current?.open();
  };

  const getAvailableTimeSlots = (date) => {
    const dayAvailability = Array.isArray(availability)
      ? availability.filter((item) => item.date === date)
      : [];

    const availableSlots = new Set();

    dayAvailability.forEach(({ startTime: availStart, endTime: availEnd }) => {
      if (!availStart || !availEnd) return;

      const startTimeClean = availStart.slice(0, 5);
      const endTimeClean = availEnd.slice(0, 5);
      const [startHour, startMinute] = startTimeClean.split(":").map(Number);
      const [endHour, endMinute] = endTimeClean.split(":").map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      timeSlots.forEach((slot) => {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;

        const isToday = date === todayString;
        if (isToday) {
          const now = moment();
          const currentTimeInMinutes = now.hour() * 60 + now.minute();
          if (slotTimeInMinutes <= currentTimeInMinutes) return;
        }

        if (
          slotTimeInMinutes >= startTimeInMinutes &&
          slotTimeInMinutes <= endTimeInMinutes
        ) {
          availableSlots.add(slot);
        }
      });
    });
    return Array.from(availableSlots).sort();
  };

  const onDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDates((prev) => {
      if (prev.includes(dateString)) {
        // setIsSelected((prevIsSelected) => {
        //   const updated = { ...prevIsSelected };
        //   delete updated[dateString];
        //   return updated;
        // });
        // setExtraDishIds((prevExtra) => {
        //   const updated = { ...prevExtra };
        //   delete updated[dateString];
        //   return updated;
        // });
        // setSelectedDishes((prevDish) => {
        //   const updated = { ...prevDish };
        //   delete updated[dateString];
        //   return updated;
        // });
        // setSelectedMenuLong((prevMenu) => {
        //   const updated = { ...prevMenu };
        //   delete updated[dateString];
        //   return updated;
        // });
        return prev.filter((d) => d !== dateString);
      } else if (prev.length < selectedPackage.durationDays) {
        // setIsSelected((prevIsSelected) => ({
        //   ...prevIsSelected,
        //   [dateString]: false,
        // }));
        return [...prev, dateString];
      } else {
        return prev;
      }
    });
  };

  const removeDate = (date) => {
    setSelectedDates((prev) => prev.filter((d) => d !== date));
  };

  const handleEditNote = (date, dish) => {
    setCurrentDate(date);
    setCurrentDish(dish);
    const note = dishNotes[date]?.[dish.id || dish.dishId] || "";
    setTempNote(note);
    modalizeRef.current?.open();
  };

  const handleConfirm = async () => {
    const hasAtLeastOneNearFutureDate = selectedDates.some((day) =>
      moment(day, "YYYY-MM-DD").isBetween(
        moment(todayString, "YYYY-MM-DD").add(1, "day"),
        moment(todayString, "YYYY-MM-DD").add(3, "days"),
        "day",
        "[]"
      )
    );

    if (!hasAtLeastOneNearFutureDate) {
      showModal(
        t("modal.error"),
        t("errors.requireOneDayWithinNext3Days"),
        "Failed"
      );
      return;
    }

    for (const day of selectedDates) {
      const isNearFutureDate = moment(day, "YYYY-MM-DD").isBetween(
        moment(todayString, "YYYY-MM-DD").add(1, "day"),
        moment(todayString, "YYYY-MM-DD").add(3, "days"),
        "day",
        "[]"
      );
      console.log(isNearFutureDate);
      if (isNearFutureDate) {
        if (
          !isSelected[day] &&
          !selectedMenuLong[day]?.id &&
          !selectedDishes[day]
        ) {
          showModal(
            t("modal.error"),
            t("errors.selectDishesForAllDays"),
            "Failed"
          );
          return;
        }
      }

      if (!startTime[day]) {
        showModal(
          t("modal.error"),
          t("errors.selectStartTime"),
          "Failed"
        );
        return;
      }

      if (!getAvailableTimeSlots(day).includes(startTime[day])) {
        showModal(
          t("modal.error"),
          t("errors.timeNotAvailable", { time: startTime[day], date: day }),
          "Failed"
        );
        return;
      }
    }

    router.replace("/screen/reviewBooking");
  };

  const navigateToSelectFood = (date) => {
    setSelectedDay(date);
    router.replace("/screen/chooseFoodForLongterm");
  };

  const DishSection = React.memo(({ date, isSelected }) => {
    if (!isSelected) return null;
    return (
      <View>
        {selectedMenuLong[date] && (
          <View>
            <View style={styles.menuHeader}>
              <Text style={styles.summaryText}>
                {t("menu")}: {selectedMenuLong[date].name}
              </Text>
            </View>
            {selectedMenuLong[date]?.menuItems.map((item) => (
              <TouchableOpacity
                key={item.dishId}
                style={[
                  styles.dishItem,
                  activeDish?.date === date &&
                  activeDish?.dishId === item.dishId &&
                  styles.dishItemActive,
                ]}
              >
                <Image
                  source={{ uri: item.dishImageUrl }}
                  style={styles.dishImage}
                  resizeMode="cover"
                />
                <Text style={styles.dishText}>{item.dishName} </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {extraDishIds[date] && selectedMenuLong[date] && (
          <>
            <Text style={styles.subTitle}>
              {selectedMenuLong[date] ? t("additionalDishes") : t("dishes")}
            </Text>
            {extraDishIds[date] &&
              Object.values(extraDishIds[date]).map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={[
                    styles.dishItem,
                    activeDish?.date === date &&
                    activeDish?.dishId === dish.id &&
                    styles.dishItemActive,
                  ]}
                  onPress={() => toggleDishActive(date, dish.id)}
                >
                  <View style={{ flexDirection: "row", width: "90%" }}>
                    <Image
                      source={{ uri: dish.imageUrl }}
                      style={styles.dishImage}
                      resizeMode="cover"
                    />
                    <View>
                      <Text style={styles.dishText}>
                        {dish?.name || "Unknown Dish"}{" "}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#666", width: "50%" }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {dishNotes?.[date]?.[dish.id] || ""}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </>
        )}

        {selectedDishes[date] && (
          <>
            <Text style={styles.subTitle}>{t("dishes")}</Text>
            {selectedDishes[date] &&
              Object.values(selectedDishes[date]).map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={[
                    styles.dishItem,
                    activeDish?.date === date &&
                    activeDish?.dishId === dish.id &&
                    styles.dishItemActive,
                    { justifyContent: "space-between" },
                  ]}
                  onPress={() => toggleDishActive(date, dish.id)}
                >
                  <View style={{ flexDirection: "row", width: "90%" }}>
                    <Image
                      source={{ uri: dish.imageUrl }}
                      style={styles.dishImage}
                      resizeMode="cover"
                    />
                    <View>
                      <Text style={styles.dishText}>
                        {dish?.name || "Unknown Dish"}{" "}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#666", width: "50%" }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {dishNotes?.[date]?.[dish.id] || ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dishActions}>
                    <TouchableOpacity
                      onPress={() => handleEditNote(date, dish)}
                    >
                      <Text style={styles.noteText}>{t("note")}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
          </>
        )}

        <TouchableOpacity
          onPress={() => navigateToSelectFood(date)}
          style={{
            borderColor: "black",
            borderWidth: 1,
            borderStyle: "dotted",
            // padding: 5,
            width: "60%",
            borderRadius: 5,
            alignItems: "center",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            alignSelf: "center",
          }}
        >
          <Text style={styles.addItemsText}>
            {selectedMenuLong[date]?.id || selectedDishes[date]?.length > 0
              ? t("addItems")
              : t("addMenuOrFood")}
          </Text>
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>{t("note")}</Text>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>{t("chefBringIngredients")}</Text>
          <Switch
            value={ingredientPrep[date]}
            onValueChange={() =>
              setIngredientPrep((prev) => ({
                ...prev,
                [date]: !prev[date],
              }))
            }
            trackColor={{ false: "#767577", true: "#A64B2A" }}
            thumbColor={ingredientPrep[date] ? "#A64B2A" : "#f4f3f4"}
          />
        </View>
      </View>
    );
  });

  const handleBack = () => {
    router.replace("/screen/longTermBooking");
  };

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={t("longTermBooking")} onLeftPress={() => handleBack()} />
      <SafeAreaView style={commonStyles.containerContent}>
        <View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={groupDatesByWeek(selectedDates)}
            keyExtractor={(_, index) => `week-${index}`}
            nestedScrollEnabled={true}
            renderItem={({ item: week, index }) => (
              <View style={styles.weekCard}>
                <TouchableOpacity
                  style={styles.weekHeader}
                  onPress={() => toggleWeek(index)}
                >
                  <Text style={styles.weekTitle}>
                    {week.start} - {week.end}
                  </Text>
                  <MaterialIcons
                    name={expandedWeeks[index] ? "expand-less" : "expand-more"}
                    size={24}
                    color="#555"
                  />
                </TouchableOpacity>

                {expandedWeeks[index] && (
                  <FlatList
                    data={week.dates}
                    keyExtractor={(date) => date}
                    nestedScrollEnabled={true}
                    initialNumToRender={3}
                    windowSize={5}
                    renderItem={({ item: date }) => (
                      <View style={styles.dateCard}>
                        <View style={styles.dateHeader}>
                          <Text style={styles.dateTitle}>{date}</Text>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeDate(date)}
                          >
                            <MaterialIcons
                              name="close"
                              size={16}
                              color="#FFF"
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.switchContainer}>
                          <Text style={styles.label}>{t("selectDish")}:</Text>
                          <Switch
                            value={isSelected[date]}
                            onValueChange={() =>
                              setIsSelected((prev) => ({
                                ...prev,
                                [date]: !prev[date],
                              }))
                            }
                            trackColor={{ false: "#767577", true: "#A64B2A" }}
                            thumbColor={
                              isSelected[date] ? "#A64B2A" : "#f4f3f4"
                            }
                          />
                        </View>

                        {isSelected[date] && (
                          <DishSection date={date} isSelected={true} />
                        )}
                        <Text style={styles.label}>{t("startTime")}:</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {getAvailableTimeSlots(date).length > 0 ? (
                            getAvailableTimeSlots(date).map((time) => (
                              <TouchableOpacity
                                key={`start-${time}`}
                                style={[
                                  styles.timeButton,
                                  startTime[date] === time &&
                                  styles.timeButtonSelected,
                                ]}
                                onPress={() =>
                                  setStartTime((prev) => ({
                                    ...prev,
                                    [date]: time,
                                  }))
                                }
                              >
                                <Text
                                  style={
                                    startTime[date] === time
                                      ? styles.timeButtonTextSelected
                                      : styles.timeButtonText
                                  }
                                >
                                  {time}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noTimeText}>
                              {t("noAvailableTimeSlots")}
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.title}>
                    {t("needToSelect")} {selectedPackage?.durationDays || 0}{" "}
                    {t("days")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsExpanedCalenda(!isExpanedCalenda)}
                  >
                    <Ionicons
                      name={isExpanedCalenda ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#333"
                    />
                  </TouchableOpacity>
                </View>

                {isExpanedCalenda && (
                  <>
                    {selectedPackage?.durationDays >= 10 && (
                      <View style={styles.repeatContainer}>
                        <View style={styles.switchContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text style={styles.label}>
                              {t("repeatSchedule")}:{" "}
                            </Text>
                            <TouchableOpacity
                              style={styles.infoButton}
                              onPress={showRepeatInfo}
                            >
                              <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color="black"
                              />
                            </TouchableOpacity>
                          </View>
                          <Switch
                            value={isRepeatEnabled}
                            onValueChange={(value) => {
                              setIsRepeatEnabled(value);
                              if (!value) {
                                setSelectedWeekdays([]);
                              }
                            }}
                            trackColor={{ false: "#767577", true: "#A64B2A" }}
                            thumbColor={isRepeatEnabled ? "#A64B2A" : "#f4f3f4"}
                          />
                        </View>
                        {isRepeatEnabled && (
                          <View>
                            <View style={styles.weekdayContainer}>
                              {[
                                t("weekdays.0"),
                                t("weekdays.1"),
                                t("weekdays.2"),
                                t("weekdays.3"),
                                t("weekdays.4"),
                                t("weekdays.5"),
                                t("weekdays.6"),
                              ].map((day, index) => (
                                <TouchableOpacity
                                  key={day}
                                  style={[
                                    styles.weekdayButton,
                                    selectedWeekdays.includes(index) &&
                                    styles.weekdayButtonSelected,
                                  ]}
                                  onPress={() => toggleWeekday(index)}
                                >
                                  <Text
                                    style={[
                                      styles.weekdayText,
                                      selectedWeekdays.includes(index) &&
                                      styles.weekdayTextSelected,
                                    ]}
                                  >
                                    {day}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.applyButton,
                                selectedWeekdays.length === 0 &&
                                styles.disabledButton,
                              ]}
                              onPress={handleRepeatSelection}
                              disabled={selectedWeekdays.length === 0}
                            >
                              <Text style={styles.applyButtonText}>
                                {t("apply")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    <Calendar
                      markedDates={{
                        ...selectedDates.reduce(
                          (acc, date) => ({
                            ...acc,
                            [date]: {
                              selected: true,
                              selectedColor: "#6C63FF",
                            },
                          }),
                          {}
                        ),
                        ...unavailableDates.reduce(
                          (acc, date) => ({
                            ...acc,
                            [date]: {
                              marked: true,
                              dotColor: "#FF4D4D",
                              disableTouchEvent: true,
                            },
                          }),
                          {}
                        ),
                      }}
                      onDayPress={onDayPress}
                      style={styles.calendar}
                      theme={{
                        backgroundColor: "#F5F5F5",
                        calendarBackground: "#F5F5F5",
                        textDisabledColor: "#888888",
                        selectedDayBackgroundColor: "#6C63FF",
                        selectedDayTextColor: "#FFFFFF",
                      }}
                      minDate={moment().add(1, "day").format("YYYY-MM-DD")}
                      maxDate={moment().add(1, "year").format("YYYY-MM-DD")}
                    />
                  </>
                )}
              </View>
            }
          />
        </View>
        <View style={styles.spacer} />
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={[
              styles.fixedButton,
              Object.keys(selectedDates).length !==
              selectedPackage?.durationDays && styles.disabledButton,
            ]}
            onPress={handleConfirm}
            disabled={
              Object.keys(selectedDates).length !==
              selectedPackage?.durationDays
            }
          >
            <Text style={styles.buttonText}>{t("confirmBooking")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View
          style={{
            padding: 20,
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          {currentDate && currentDish ? (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "nunito-bold",
                  marginBottom: 12,
                  color: "#333",
                }}
              >
                {currentDish.name}
              </Text>

              <TextInput
                value={tempNote}
                onChangeText={setTempNote}
                placeholder={t("addNote")}
                multiline
                style={{
                  height: 100,
                  borderColor: "#ddd",
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  textAlignVertical: "top",
                  fontSize: 16,
                  fontFamily: "nunito-regular"
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#ccc",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    marginRight: 8,
                  }}
                  onPress={() => {
                    modalizeRef.current?.close();
                    setTempNote("");
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontFamily: "nunito-bold", fontSize: 16 }}
                  >
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#4CAF50",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    marginLeft: 8,
                  }}
                  onPress={() => {
                    setDishNotes((prev) => ({
                      ...prev,
                      [currentDate]: {
                        ...(prev[currentDate] || {}),
                        [currentDish.id || currentDish.dishId]: tempNote,
                      },
                    }));
                    modalizeRef.current?.close();
                    setTempNote("");
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontFamily: "nunito-bold", fontSize: 16 }}
                  >
                    {t("save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={{ fontSize: 16, color: "#777", fontFamily: "nunito-regular" }}>
              {t("noDishSelected")}
            </Text>
          )}
        </View>
      </Modalize>

      <Modalize
        ref={infoModalizeRef}
        adjustToContentHeight={true}
        handlePosition="outside"
        modalStyle={styles.modalContent}
        onClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalInner}>
          <Text style={styles.modalTitle}>{t("repeatScheduleGuideTitle")}</Text>
          <Text style={styles.modalText}>
            {t("repeatScheduleGuideDescription")}
          </Text>
          <Text style={styles.modalText}>
            - {t("repeatScheduleStep1")}
            {"\n"}- {t("repeatScheduleStep2")}
            {"\n"}-{" "}
            {t("repeatScheduleStep3", {
              durationDays: selectedPackage?.durationDays || "unknown",
            })}
            {"\n"}- {t("repeatScheduleStep4")}.
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { alignSelf: "center", width: "50%" }]}
            onPress={() => infoModalizeRef.current?.close()}
          >
            <Text style={styles.modalButtonText}>{t("close")}</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: { paddingBottom: 100, flexGrow: 1 },
  title: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
  },
  repeatContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weekdayContainer: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  weekdayButtonSelected: {
    backgroundColor: "#A64B2A",
  },
  weekdayText: {
    fontSize: 14,
    color: "#333",
  },
  weekdayTextSelected: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
  },
  applyButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  infoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
  calendar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },
  weekCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#A64B2A",
  },
  weekContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateCard: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  incompleteCard: {
    borderColor: "#FF9800",
    borderWidth: 2,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#333",
  },
  removeButton: {
    position: "absolute",
    right: -15,
    top: -15,
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
    marginRight: 8,
  },
  addItemsText: {
    color: "#222222",
    fontSize: 14,
    fontFamily: "nunito-bold",
    marginVertical: 8,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
    marginVertical: 4,
  },
  subTitle: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
    marginTop: 8,
  },
  dishItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dishItemActive: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dishText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
    marginRight: 8,
    fontFamily: "nunito-regular"
  },
  dishActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteText: {
    color: "#1E90FF",
    fontSize: 14,
    fontFamily: "nunito-bold",
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  removeItemButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF4D4D",
    justifyContent: "center",
    alignItems: "center",
  },
  timeButton: {
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },
  timeButtonSelected: {
    backgroundColor: "#A64B2A",
  },
  timeButtonText: {
    color: "#333",
    fontSize: 14,
  },
  timeButtonTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  fixedButton: {
    backgroundColor: "#A64B2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalInner: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: "nunito-regular"
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#A64B2A",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#777",
  },
  noTimeText: {
    fontSize: 14,
    color: "#777",
    marginVertical: 8,
  },
  warningCard: {
    borderColor: "#FF9800",
    borderWidth: 2,
    backgroundColor: "#FFF3E0",
  },
  warningText: {
    fontSize: 14,
    color: "#D32F2F",
    fontFamily: "nunito-bold",
    marginBottom: 8,
  },
  dishImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
});

export default LongTermSelectBooking;
