import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TabView, TabBar } from "react-native-tab-view";
import useAxios from "../../config/AXIOS_API";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useCommonNoification } from "../../context/commonNoti";
import { useRouter } from "expo-router";
import { t } from "i18next";
import axios from "axios";
import { useConfirmModal } from "../../context/commonConfirm";

const dayInWeek = [
  { id: 0, label: t("Mon"), full: t("Monday") },
  { id: 1, label: t("Tue"), full: t("Tuesday") },
  { id: 2, label: t("Wed"), full: t("Wednesday") },
  { id: 3, label: t("Thu"), full: t("Thursday") },
  { id: 4, label: t("Fri"), full: t("Friday") },
  { id: 5, label: t("Sat"), full: t("Saturday") },
  { id: 6, label: t("Sun"), full: t("Sunday") },
];

export default function ChefScheduleScreen() {
  const [selectedDays, setSelectedDays] = useState([]);
  const [slots, setSlots] = useState({});
  const axiosInstance = useAxios();
  const modalizeRef = React.useRef(null);
  const modalizeAddRef = React.useRef(null);
  const [selectedSlot, setSelectedSlot] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [pickerState, setPickerState] = useState({
    show: false,
    mode: "start",
    dayId: null,
    index: null,
  });
  const { showModal } = useCommonNoification();
  const [addModalKey, setAddModalKey] = useState(0);
  const [updateModalKey, setUpdateModalKey] = useState(0);
  const route = useRouter();
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();

  const openModal = (slot) => {
    setUpdateModalKey((prev) => prev + 1);
    setSelectedSlot(slot);
    setShowPicker(false);
    setTimeout(() => {
      modalizeRef.current?.open();
    }, 100);
  };

  const openModalAdd = () => {
    setAddModalKey((prev) => prev + 1);
    setTimeout(() => {
      modalizeAddRef.current?.open();
    }, 100);
  };

  const toggleDay = (dayId) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        const updated = prev.filter((d) => d !== dayId);
        const newSlots = { ...slots };
        delete newSlots[dayId];
        setSlots(newSlots);
        return updated;
      } else {
        setSlots((prevSlots) => ({
          ...prevSlots,
          [dayId]: [{ startTime: new Date(), endTime: new Date() }],
        }));
        return [...prev, dayId];
      }
    });
  };

  const handleAddSlot = (dayId) => {
    const existing = schedules.filter((c) => c.dayOfWeek === dayId).length || 0;
    const currentSlots = slots[dayId];
    console.log("slott", slots);
    if (currentSlots.length + existing >= 3) {
      Alert.alert(t("maxSlotsAlertTitle"), t("maxSlotsAlertMessage"));
      return;
    }
    setSlots((prev) => ({
      ...prev,
      [dayId]: [
        ...currentSlots,
        { startTime: new Date(), endTime: new Date() },
      ],
    }));
  };

  const handleRemoveSlot = (dayId, index) => {
    const updated = [...slots[dayId]];
    updated.splice(index, 1);
    setSlots((prev) => ({ ...prev, [dayId]: updated }));
  };

  const showPickerAdd = (dayId, index, mode) => {
    setPickerState({ show: true, mode, dayId, index });
  };

  const onTimeChangeAdd = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setPickerState({ ...pickerState, show: false });
      return;
    }

    const { dayId, index, mode } = pickerState;
    const updated = [...slots[dayId]];
    updated[index][mode === "start" ? "startTime" : "endTime"] =
      selectedDate || new Date();
    setSlots((prev) => ({ ...prev, [dayId]: updated }));
    setPickerState({ ...pickerState, show: false });
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      seconds: "2-digit",
      hour12: false,
    });

  const handleOpenPicker = (field) => {
    setCurrentField(field);
    setShowPicker(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    if (event.type === "set" && selectedDate) {
      const newTime = selectedDate.toLocaleTimeString("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setSelectedSlot((prev) => ({
        ...prev,
        [currentField]: newTime,
      }));
    }

    setShowPicker(false);
    setCurrentField(null);
  };

  const convertToPayload = (slott) => {
    const result = [];

    Object.entries(slott).forEach(([day, slots]) => {
      slots.forEach((slot) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);

        const formatTime = (date) =>
          date.toLocaleTimeString("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            // timeZone: "UTC",
          });

        result.push({
          dayOfWeek: day,
          startTime: formatTime(start),
          endTime: formatTime(end),
        });
      });
    });

    return result;
  };

  const handleAddNewSlot = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;
      if (!slots) return;
      const payloads = convertToPayload(slots);
      console.log(payloads);
      const promises = payloads.map((item) =>
        axiosInstance.post("/chef-schedules", item)
      );
      const results = await Promise.allSettled(promises);
      results.forEach((result, index) => {
        const payload = payloads[index];
        const day = dayInWeek.find((d) => d.id === payload.dayOfWeek);
        const dayName = day?.full;
        fetchSchedule();
        if (result.status === "fulfilled") {
          successCount++;
          console.log(` Slot ${index + 1} thành công`, result.value.data);
          showModal(t("modal.success"),);
        } else {
          errorCount++;
          console.error(` Tạo slot ở ${dayName} thất bại`, result.reason);
        }
      });

      if (successCount === results.length) {
        showModal(t("modal.success"), t("addAllSuccess"),);
      } else if (errorCount === results.length) {
        showModal(t("modal.error"), t("errors.addAllFailed"), "Failed");
      } else {
        showModal(
          "Warning",
          t("errors.addSomeFailed", { successCount, errorCount }),
          "Warning"
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.addAllFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlot = async () => {
    console.log("seleceeteeteeet", selectedSlot);
    try {
      const updateData = {
        id: selectedSlot.id,
        dayOfWeek: selectedSlot.dayOfWeek,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      };
      const response = await axiosInstance.put("/chef-schedules", updateData);
      if (response.status === 200) {
        setShowPicker(false);
        setSelectedSlot(null);
        modalizeRef.current?.close();
        showModal(t("modal.success"), t("updateSuccess"),);
        fetchSchedule();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.updateFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    try {
      const response = await axiosInstance.delete(
        `/chef-schedules/${selectedSlot.id}`
      );
      if (response.status === 200) {
        setShowPicker(false);
        setSelectedSlot(null);
        modalizeRef.current?.close();
        console.log("xoa roi nha");
        showModal(t("modal.success"), t("deleteSuccess"),);
        fetchSchedule();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.deleteFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState(
    dayInWeek.map((day) => ({ key: day.full, title: day.full }))
  );

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/chef-schedules/me");
      setSchedules(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải lịch làm việc", "Failed");
      showModal(
        t("modal.error"),
        error.response?.data?.message ||
        t("errors.fetchScheduleFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const renderScene = ({ route }) => {
    const day = dayInWeek.find((d) => d.full === route.title);
    const dayId = day?.id;
    const slots = (Array.isArray(schedules) ? schedules : []).filter(
      (slot) => slot.dayOfWeek === dayId
    );

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator style={{ alignSelf: 'center' }} size="large" color="#0000ff" />
        ) : slots.length === 0 ? (
          <Text style={{ color: "#888", fontFamily: "nunito-regular", alignSelf: 'center' }}>{t("noSlotsAvailable")}</Text>
        ) : (
          slots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openModal(slot)}
              style={styles.section}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {t("timeStart")}
                </Text>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {t("timeEnd")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 5,
                }}
              >
                <Text style={styles.slotText}>{slot.startTime}</Text>
                <Text style={styles.slotText}>
                  ----------------------------
                </Text>
                <Text style={styles.slotText}>{slot.endTime}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#A9411D" />
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={commonStyles.container}>
        <Header
          title={t("schedule")}
          rightIcon={"add"}
          onRightPress={() => openModalAdd()}
        />
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#A9411D"
            style={{ marginTop: 20 }}
          />
        ) : (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                scrollEnabled
                inactiveColor="gray"
                activeColor="#9C583F"
                indicatorStyle={{ backgroundColor: "#A9411D" }}
                style={{
                  backgroundColor: "#EBE5DD",
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                }}
                labelStyle={{ color: "#A9411D", fontFamily: "nunito-bold" }}
                tabStyle={{ paddingVertical: 0, width: 130 }}
              />
            )}
          />
        )}
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: "#FFCDD2",
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
            onPress={() => route.push("/screen/scheduleBlocked")}
          >
            <MaterialIcons name="event-busy" size={30} color="red" />
            <Text style={{ fontFamily: "nunito-bold" }}>{t("busyDate")}</Text>
          </TouchableOpacity>
        </View>

        <Modalize
          ref={modalizeRef}
          adjustToContentHeight
          key={`update-${updateModalKey}`}
        >
          <View style={styles.modalContent}>
            {selectedSlot ? (
              <>
                <View style={styles.section1}>
                  <Text style={styles.sectionTitle}>{t("update")}</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontFamily: "nunito-bold", fontSize: 16 }}>
                      {t("timeStart")}
                    </Text>
                    <Text style={{ fontFamily: "nunito-bold", fontSize: 16 }}>
                      {t("timeEnd")}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 5,
                      marginVertical: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleOpenPicker("startTime")}
                      style={styles.timeBox}
                    >
                      <TextInput
                        style={styles.input}
                        value={selectedSlot.startTime}
                        editable={false}
                      />
                    </TouchableOpacity>

                    <Text>----------------------------</Text>

                    <TouchableOpacity
                      onPress={() => handleOpenPicker("endTime")}
                      style={styles.timeBox}
                    >
                      <TextInput
                        style={styles.input}
                        value={selectedSlot.endTime}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-evenly",
                    }}
                  >
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() =>
                        requireAuthAndNetWork(() => handleUpdateSlot())
                      }
                    >
                      <Text style={styles.buttonText}>{t("save")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        showConfirm(
                          "Confirm delete",
                          "Are you sure want to delete this slot",
                          () => requireAuthAndNetWork(() => handleDeleteSlot())
                        )
                      }
                    >
                      <Text style={styles.buttonText}>{t("delete")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <Text>{t("noDetailsAvailable")}</Text>
            )}
          </View>

          {showPicker && (
            <DateTimePicker
              value={
                selectedSlot[currentField]
                  ? new Date(`1970-01-01T${selectedSlot[currentField]}:00`)
                  : new Date()
              }
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              is24Hour={false}
            />
          )}
        </Modalize>

        <Modalize
          ref={modalizeAddRef}
          adjustToContentHeight
          key={`add-${addModalKey}`}
        >
          <View style={styles.modalContentAdd}>
            <ScrollView
              style={{ padding: 10 }}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View style={{ marginBottom: 20 }}>
                <View style={styles.daySelector}>
                  {dayInWeek.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => toggleDay(day.id)}
                      style={[
                        styles.dayButton,
                        selectedDays.includes(day.id) &&
                        styles.dayButtonSelected,
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: "nunito-bold",
                          color: selectedDays.includes(day.id)
                            ? "white"
                            : "black",
                        }}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {selectedDays.map((dayId) => {
                const dayLabel = dayInWeek.find((d) => d.id === dayId)?.full;
                const oldSlots =
                  schedules?.filter((c) => c.dayOfWeek === dayId) || [];

                return (
                  <View key={dayId} style={styles.section2}>
                    <Text style={styles.sectionTitle}>{dayLabel}</Text>
                    {oldSlots.map((slot, index) => (
                      <View key={`old-${index}`} style={styles.slotRow}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text style={{ fontFamily: "nunito-bold", marginRight: 10 }}>
                            {t("startTime")}
                          </Text>

                          <TextInput
                            style={{ fontFamily: "nunito-bold", fontSize: 15 }}
                            value={slot.startTime}
                            editable={false}
                          />
                        </View>
                        <Text>~</Text>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <TextInput
                            style={{ fontFamily: "nunito-bold", fontSize: 15 }}
                            value={slot.endTime}
                            editable={false}
                          />
                          <Text style={{ fontFamily: "nunito-bold", marginLeft: 10 }}>
                            {t("endTime")}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {slots[dayId]?.map((slot, index) => (
                      <View key={index} style={styles.slotRow}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text style={{ fontFamily: "nunito-bold", marginRight: 10 }}>
                            {t("startTime")}
                          </Text>
                          <TouchableOpacity
                            onPress={() => showPickerAdd(dayId, index, "start")}
                          >
                            <TextInput
                              style={styles.input}
                              value={formatTime(slot.startTime)}
                              editable={false}
                            />
                          </TouchableOpacity>
                        </View>

                        <Text>~</Text>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <TouchableOpacity
                            onPress={() => showPickerAdd(dayId, index, "end")}
                          >
                            <TextInput
                              style={styles.input}
                              value={formatTime(slot.endTime)}
                              editable={false}
                            />
                          </TouchableOpacity>
                          <Text style={{ fontFamily: "nunito-bold", marginLeft: 10 }}>
                            {t("endTime")}
                          </Text>
                        </View>

                        {slots[dayId].length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveSlot(dayId, index)}
                          >
                            <MaterialIcons
                              name="cancel"
                              size={24}
                              color="black"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    {slots[dayId].length + oldSlots.length < 3 && (
                      <TouchableOpacity
                        style={styles.addSlotButton}
                        onPress={() => handleAddSlot(dayId)}
                      >
                        <Text style={{ color: "white", fontFamily: "nunito-bold" }}>
                          + {t("addSlot")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {pickerState.show && (
                <DateTimePicker
                  value={
                    slots[pickerState.dayId][pickerState.index][
                    pickerState.mode === "start" ? "startTime" : "endTime"
                    ]
                  }
                  mode="time"
                  display="spinner"
                  onChange={onTimeChangeAdd}
                  is24Hour={true}
                />
              )}
            </ScrollView>
            <TouchableOpacity
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                backgroundColor: "#A64B2A",
                padding: 15,
                borderRadius: 10,
                alignItems: "center",
                elevation: 5,
              }}
              onPress={() => requireAuthAndNetWork(() => handleAddNewSlot())}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontFamily: "nunito-bold", fontSize: 16 }}
                >
                  {t("save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: "#000",
    borderWidth: 0.5,
    padding: 10,
    borderRadius: 20,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  dayButtonSelected: {
    backgroundColor: "#A9411D",
  },
  section: {
    backgroundColor: "#fff",
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
  section2: {
    backgroundColor: "#fff",
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    // marginHorizontal: 10,
  },

  section1: {
    backgroundColor: "#fff",
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    // marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 10,
    textAlign: "center",
  },
  slotRow: {
    paddingHorizontal: 10,
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    // flex: 1,
    // height: 40,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    backgroundColor: "#f5f5f5",
    fontFamily: "nunito-regular",
  },
  addSlotButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 8,
    marginTop: 5,
  },

  modalContent: {
    padding: 16,
    backgroundColor: "#fff",
  },
  modalContentAdd: {
    height: 800,
  },
  slotDetailText: {
    fontSize: 18,
    marginBottom: 16,
  },
  updateButton: {
    width: 80,
    backgroundColor: "#59A315",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButton: {
    width: 80,
    backgroundColor: "#A31515",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "nunito-bold",
  },
  floatingActions: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
    gap: 10,
  },

  floatingButton: {
    backgroundColor: "#FFF9C4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    alignItems: "center",
  },

  floatingText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold",
  },
});
