import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import useAxios from "../../config/AXIOS_API";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import DateTimePicker from "@react-native-community/datetimepicker";
import Header from "../../components/header";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useCommonNoification } from "../../context/commonNoti";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useConfirmModal } from "../../context/commonConfirm";
import { t } from "i18next";
import axios from "axios";

const ScheduleBlocked = () => {
  const [schedule, setSchedule] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();
  const [showPicker, setShowPicker] = useState(false);
  const [currentField, setCurrentField] = useState({ date: "", index: 0, field: "" });
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const [existingDates, setExistingDates] = useState({});
  const { showModal } = useCommonNoification();
  const { showConfirm } = useConfirmModal();
  const [initialPickerTime, setInitialPickerTime] = useState(new Date());
  const [originalSchedule, setOriginalSchedule] = useState({});
  const [editableBlocks, setEditableBlocks] = useState({});
  const makeKey = (date, index) => `${date}_${index}`;

  const handleTimeChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === "dismissed") return;
    const newTime = selectedDate.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const { date, index, field } = currentField;

    const updated = [...schedule[date]];
    updated[index][field] = newTime;

    setSchedule((prev) => ({
      ...prev,
      [date]: updated,
    }));
  };

  // const openTimePicker = (date, index, field) => {
  //     setCurrentField({ date, index, field });
  //     setShowPicker(true);
  // };
  const openTimePicker = (date, index, field) => {
    const timeString = schedule[date][index][field];
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    const currentDate = new Date();
    currentDate.setHours(hours || 0);
    currentDate.setMinutes(minutes || 0);
    currentDate.setSeconds(seconds || 0);

    setInitialPickerTime(currentDate);
    setCurrentField({ date, index, field });
    setShowPicker(true);
  };



  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/chef-blocked-dates/me");
      const data = response.data;
      console.log(data);

      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.blockedDate]) {
          grouped[item.blockedDate] = [];
        }
        grouped[item.blockedDate].push({
          id: item.blockId,
          startTime: item.startTime,
          endTime: item.endTime,
          reason: item.reason
        });

      });

      setSchedule(grouped);
      setOriginalSchedule(grouped);
      setExistingDates({ ...grouped });

      const marks = {};
      Object.keys(grouped).forEach((date) => {
        marks[date] = {
          marked: true,
          selected: true,
          selectedColor: "#A9411D",
        };
      });
      setMarkedDates(marks);
      setSelectedDates(marks);
    } catch (error) {
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.fetchBlockScheduleFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    const date = day.dateString;
    const isSelected = selectedDates[date];

    const updatedSelected = { ...selectedDates };
    const updatedMarked = { ...markedDates };

    if (isSelected) {
      delete updatedSelected[date];
    } else {
      updatedSelected[date] = {
        selected: true,
        selectedColor: "#A9411D",
      };

      if (!schedule[date]) {
        setSchedule((prev) => ({
          ...prev,
          [date]: [{ startTime: "", endTime: "", reason: "" }],
        }));
      }
    }

    setSelectedDates(updatedSelected);
    setMarkedDates(updatedSelected);
  };

  const handleFieldChange = (date, index, field, value) => {
    const updated = [...schedule[date]];
    updated[index][field] = value;

    setSchedule((prev) => ({
      ...prev,
      [date]: updated,
    }));
  };

  const handleAddField = (date) => {
    setSchedule((prev) => ({
      ...prev,
      [date]: [...prev[date], { startTime: "", endTime: "", reason: "" }],
    }));
  };

  const handleRemoveField = (date, index) => {
    const updatedFields = [...schedule[date]];
    updatedFields.splice(index, 1);

    setSchedule((prev) => ({
      ...prev,
      [date]: updatedFields.length
        ? updatedFields
        : [{ startTime: "", endTime: "", reason: "" }],
    }));
  };

  const handleDelete = async (id) => {
    showConfirm("Delete confirm", "Bạn có chắc muốn xóa lịch bận này không?", async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.delete(`/chef-blocked-dates/${id}`);
        if (response.status === 200) {
          showModal(t("success"), "Xóa lịch bận thành công");
          fetchSchedule();
        }
      } catch (error) {

      } finally {
        setLoading(false);
      }
    })
  }

  const handleUpdate = async (item) => {
    setLoading(true);
    try {
      const payload = {};
      const response = await axiosInstance.put(`/chef-blocked-dates`, payload);

    } catch (error) {
      if (axios.isCancel(error) || error.response?.status === 401) return;
      showModal(t("error"), error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    const allBlocks = [];
    // Object.keys(selectedDates).forEach(date => {
    //     if (!existingDates[date] && schedule[date]) {
    //         const validBlocks = schedule[date]
    //             .filter(item => item.startTime && item.endTime)
    //             .map(item => ({
    //                 blockedDate: date,
    //                 startTime: item.startTime,
    //                 endTime: item.endTime,
    //                 reason: item.reason,
    //             }));
    //         allBlocks.push(...validBlocks);
    //     }
    // });


    Object.keys(selectedDates).forEach(date => {
      if (schedule[date]) {
        const existingIndexes = existingDates[date]?.map((_, idx) => idx) || [];
        console.log("cc");

        const validBlocks = schedule[date]
          .map((item, index) => ({ ...item, index }))
          .filter(item =>
            item.startTime && item.endTime && !existingIndexes.includes(item.index)
          )
          .map(item => ({
            blockedDate: date,
            startTime: item.startTime,
            endTime: item.endTime,
            reason: item.reason,
          }));

        allBlocks.push(...validBlocks);
      }
    });




    if (allBlocks.length === 0) {
      showModal(
        t("modal.notification"),
        t("errors.noNewSchedule"),
        "Failed"
      );
      return;
    }

    try {
      setLoading(true);

      const results = await Promise.allSettled(
        allBlocks.map((block) =>
          axiosInstance
            .post("/chef-blocked-dates", block)
            .then((res) => ({ success: true, data: res.data }))
            .catch((err) => ({
              success: false,
              error: err.response?.data?.message || "Lỗi không xác định",
              date: block.blockedDate,
            }))
        )
      );

      const failed = results.filter((r) => !r.value?.success);

      if (failed.length > 0) {
        const messages = failed
          .map((f, i) => {
            const err = f.value;
            return `• ${err.date}: ${err.error}`;
          })
          .join("\n");

        throw new Error(`Một số ngày bị lỗi:\n${messages}`);
      }

      showModal(t("modal.success"),
        t("saveScheduleSuccess"),
      );
      fetchSchedule();
    } catch (error) {
      showModal(
        t("modal.error"),
        error.message || t("errors.saveScheduleFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("scheduleBlocked")} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A9411D" />
        </View>
      ) : (
        <>
          <ScrollView
            style={commonStyles.containerContent}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={markedDates}
                onDayPress={handleDayPress}
                markingType="simple"
                minDate={moment().add(1, "days").format("YYYY-MM-DD")}
                theme={{
                  backgroundColor: "#F8F1E9",
                  calendarBackground: "#F8F1E9",
                  selectedDayBackgroundColor: "#A9411D",
                  selectedDayTextColor: "#FFFFFF",
                  todayTextColor: "#A9411D",
                  dayTextColor: "#4A2C1F",
                  textDisabledColor: "#B0A8A0",
                  arrowColor: "#A9411D",
                  monthTextColor: "#4A2C1F",
                  textDayFontFamily: "nunito-bold",
                  textMonthfontFamily: "nunito-bold",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                }}
              />
            </View>

            {Object.keys(selectedDates).map(date => {
              return (
                <View style={styles.card} key={date}>
                  <Text style={styles.dateTitle}>
                    {moment(date).format("DD/MM/YYYY")}
                    <Text style={styles.viewOnlyTag}> {t("viewOnly")}</Text>
                  </Text>

                  {schedule[date]?.map((item, index) => {
                    const isDisabled = !!existingDates[date]?.[index];
                    const isEditing = editableBlocks[makeKey(date, index)];
                    console.log(editableBlocks);
                    return (
                      <View key={index} style={styles.fieldGroup}>
                        <Text style={styles.blockLabel}>Khung giờ {index + 1}</Text>

                        <TouchableOpacity
                          disabled={isDisabled && !isEditing}
                          onPress={() => openTimePicker(date, index, "startTime")}
                          style={[styles.inputContainer, isDisabled && !isEditing && styles.disabledInput]}
                        >
                          <TextInput
                            placeholder={t("startTimePlaceholder")}
                            value={item.startTime}
                            editable={false}
                            style={[styles.input, isDisabled && !isEditing && styles.disabledInput]}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={isDisabled && !isEditing}
                          onPress={() => openTimePicker(date, index, "endTime")}
                          style={[styles.inputContainer, isDisabled && !isEditing && styles.disabledInput]}
                        >
                          <TextInput
                            placeholder={t("endTimePlaceholder")}
                            value={item.endTime}
                            editable={false}
                            style={[styles.input, isDisabled && !isEditing && styles.disabledInput]}
                          />
                        </TouchableOpacity>

                        <View style={[styles.inputContainer, isDisabled && !isEditing && styles.disabledInput]}>
                          <TextInput
                            placeholder={t("reasonPlaceholder")}
                            value={item.reason}
                            onChangeText={(text) => handleFieldChange(date, index, "reason", text)}
                            editable={
                              !existingDates[date]?.[index] ||
                              editableBlocks[makeKey(date, index)] === true
                            } style={[styles.input, isDisabled && !isEditing && styles.disabledInput]}
                          />
                        </View>

                        <View style={styles.buttonContainer}>
                          {isDisabled && !isEditing && (
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => setEditableBlocks(prev => ({ ...prev, [makeKey(date, index)]: true }))}
                            >
                              <Icon name="edit" size={18} color="white" />
                            </TouchableOpacity>
                          )}

                          {isDisabled && isEditing && (
                            <>
                              <TouchableOpacity onPress={() => {
                                handleUpdate(item); // gọi API cập nhật
                                setEditableBlocks(prev => ({ ...prev, [makeKey(date, index)]: false }));
                              }}>
                                <Text>Save</Text>
                              </TouchableOpacity>

                              <TouchableOpacity onPress={() => {
                                setEditableBlocks(prev => ({ ...prev, [makeKey(date, index)]: false }));
                                handleResetField(date, index); // nếu có logic revert
                              }}>
                                <Text>Cancel</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              if (item.id) {
                                handleDelete(item.id);
                              } else {
                                handleRemoveField(date, index);
                              }
                            }}
                          >
                            <Icon name="delete" size={18} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                  {/* {!isExisting && ( */}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddField(date)}
                  >
                    <Icon name="add" size={20} color="#A9411D" />
                    <Text style={styles.addButtonText}>{t("addTimeSlot")}</Text>
                  </TouchableOpacity>
                  {/* )} */}
                </View>
              );
            })}

            {showPicker && (
              <DateTimePicker
                value={
                  schedule[currentField.date]?.[currentField.index]?.[currentField.field]
                    ? new Date(`1970-01-01T${schedule[currentField.date][currentField.index][currentField.field]}:00`)
                    : new Date()
                }
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                is24Hour={true}
              />
            )}
          </ScrollView>

          {Object.keys(selectedDates).length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
              onPress={() => requireAuthAndNetWork(() => handleSave())}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{t("saveSchedule")}</Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default ScheduleBlocked;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F1E9", // Nền nhạt, ấm áp
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Đảm bảo nút Save không che nội dung
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dateTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#4A2C1F",
    marginBottom: 12,
  },
  viewOnlyTag: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "nunito-regular",
  },
  fieldGroup: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    position: "relative",
    padding: 10
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#F8F8F8",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#4A2C1F",
    paddingVertical: 12,
    borderWidth: 0,
    fontFamily: "nunito-regular"
  },
  disabledInput: {
    backgroundColor: "#EDEDED",
    color: "#888888",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: "#A9411D",
    fontFamily: "nunito-bold",
    marginLeft: 8,
  },
  removeButton: {
    position: "absolute",
    right: -10,
    top: -10,
    backgroundColor: "#D9534F",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#A9411D",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
});
