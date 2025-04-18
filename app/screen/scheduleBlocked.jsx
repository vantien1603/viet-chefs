import React, { useEffect, useState } from "react";
import {
    View,
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import useAxios from "../../config/AXIOS_API";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import DateTimePicker from "@react-native-community/datetimepicker";
import Header from "../../components/header";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";

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

    const handleTimeChange = (event, selectedDate) => {
        setShowPicker(false);
        if (event.type === "dismissed") return;

        const time = moment(selectedDate).format("HH:mm");
        const { date, index, field } = currentField;

        const updated = [...schedule[date]];
        updated[index][field] = time;

        setSchedule(prev => ({
            ...prev,
            [date]: updated,
        }));
    };

    const openTimePicker = (date, index, field) => {
        setCurrentField({ date, index, field });
        setShowPicker(true);
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const response = await axiosInstance.get("/chef-blocked-dates/me");
            const data = response.data;

            const grouped = {};
            data.forEach(item => {
                if (!grouped[item.blockedDate]) {
                    grouped[item.blockedDate] = [];
                }
                grouped[item.blockedDate].push({
                    startTime: item.startTime,
                    endTime: item.endTime,
                    reason: item.reason
                });
            });

            setSchedule(grouped);
            setExistingDates({ ...grouped });

            const marks = {};
            Object.keys(grouped).forEach(date => {
                marks[date] = {
                    marked: true,
                    selected: true,
                    selectedColor: "#A9411D",
                };
            });
            setMarkedDates(marks);
            setSelectedDates(marks);
        } catch (error) {
            if (error.response) {
                console.log(`Lỗi ${error.response.status}:`, error.response.data);
            }
            else {
                console.error(error.message);
            }
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
                setSchedule(prev => ({
                    ...prev,
                    [date]: [
                        { startTime: "", endTime: "", reason: "" }
                    ]
                }));
            }
        }

        setSelectedDates(updatedSelected);
        setMarkedDates(updatedSelected);

    };

    const handleFieldChange = (date, index, field, value) => {
        const updated = [...schedule[date]];
        updated[index][field] = value;

        setSchedule(prev => ({
            ...prev,
            [date]: updated
        }));
    };

    const handleAddField = (date) => {
        setSchedule(prev => ({
            ...prev,
            [date]: [
                ...prev[date],
                { startTime: "", endTime: "", reason: "" },
            ],
        }));
    };
    const handleRemoveField = (date, index) => {
        const updatedFields = [...schedule[date]];
        updatedFields.splice(index, 1);

        setSchedule(prev => ({
            ...prev,
            [date]: updatedFields.length ? updatedFields : [{ startTime: "", endTime: "", reason: "" }]
        }));
    };

    const handleSave = async () => {
        const allBlocks = [];
        Object.keys(selectedDates).forEach(date => {
            if (!existingDates[date] && schedule[date]) {
                const validBlocks = schedule[date]
                    .filter(item => item.startTime && item.endTime)
                    .map(item => ({
                        blockedDate: date,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        reason: item.reason,
                    }));
                allBlocks.push(...validBlocks);
            }
        });


        if (allBlocks.length === 0) return;

        try {
            setLoading(true);
            const promises = allBlocks.map(block =>
                axiosInstance.post("/chef-blocked-dates", block)
            );
            const results = await Promise.allSettled(promises);

            // results.forEach((result, index) => {
            //     const block = allBlocks[index];
            //     if (result.status === "fulfilled") {
            //         console.log(` Create blocked schedule success ${block.blockedDate}: ${block.startTime} - ${block.endTime}`);
            //     } else {
            //         console.error(`Create blocked schedule failed ${block.blockedDate}: ${result.reason?.message}`);
            //     }
            // });

            Alert.alert("Xong!", "Đã lưu lịch chặn.");
            fetchSchedule(); // reload lại
        } catch (error) {
            if (error.response) {
                const mes = error.response.data.message;
                console.log(mes);
                showModal("Error", mes);
            }
            else {
                console.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <ActivityIndicator size="large" color="#A9411D" />;

    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={"Blocked schedule"} />
            <ScrollView style={commonStyles.containerContent} contentContainerStyle={{ paddingBottom: 80 }}>
                <Calendar
                    markedDates={markedDates}
                    onDayPress={handleDayPress}
                    markingType="simple"
                    theme={{
                        backgroundColor: "#EBE5DD",
                        calendarBackground: "#EBE5DD",
                        selectedDayBackgroundColor: "#A9411D",
                        selectedDayTextColor: "white",
                        todayTextColor: "#A9411D",
                        dayTextColor: "#2d4150",
                        textDisabledColor: "#d9e1e8",
                        arrowColor: "#A9411D",
                        monthTextColor: "#A9411D",
                        textDayFontWeight: "500",
                        textMonthFontWeight: "bold",
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                    }}
                />


                {Object.keys(selectedDates).map(date => {
                    const isExisting = !!existingDates[date];
                    return (
                        <View style={styles.formContainer} key={date}>
                            <Text style={styles.dateTitle}>
                                Ngày: {date}
                                {/* {isExisting ? "(Đã có lịch, chỉ xem)" : ""} */}
                            </Text>
                            {schedule[date]?.map((item, index) => (
                                <View key={index} style={styles.fieldGroup}>
                                    <TouchableOpacity
                                        disabled={isExisting}
                                        onPress={() => openTimePicker(date, index, "startTime")}
                                    >
                                        <TextInput
                                            placeholder="Start Time (hh:mm)"
                                            value={item.startTime}
                                            editable={false}
                                            style={styles.input}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        disabled={isExisting}
                                        onPress={() => openTimePicker(date, index, "endTime")}
                                    >
                                        <TextInput
                                            placeholder="End Time (hh:mm)"
                                            value={item.endTime}
                                            editable={false}
                                            style={styles.input}
                                        />
                                    </TouchableOpacity>

                                    <TextInput
                                        placeholder="Reason"
                                        value={item.reason}
                                        onChangeText={(text) =>
                                            handleFieldChange(date, index, "reason", text)
                                        }
                                        editable={!isExisting}
                                        style={styles.input}
                                    />

                                    {!isExisting && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveField(date, index)}
                                            style={styles.removeButton}
                                        >
                                            <Text style={styles.removeButtonText}>X</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {!isExisting && (
                                <TouchableOpacity style={styles.addButton} onPress={() => handleAddField(date)}>
                                    <Text style={styles.addButtonText}>+ Add Field</Text>
                                </TouchableOpacity>
                            )}
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
                    onPress={() => requireAuthAndNetWork(() => handleSave())}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                            Save
                        </Text>
                    )}
                </TouchableOpacity>
            )}

        </SafeAreaView>

    );
};

export default ScheduleBlocked;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
    },
    formContainer: {
        marginTop: 20,
    },
    dateTitle: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 10,
    },
    fieldGroup: {
        marginBottom: 15,
        backgroundColor: "#f2f2f2",
        padding: 10,
        borderRadius: 8,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingVertical: 8,
        marginBottom: 8,
    },
    addButton: {
        // backgroundColor: "#888",
        // padding: 10,
        borderRadius: 8,
        alignItems: "flex-end",
        marginBottom: 10,
    },
    addButtonText: {
        color: "grey",
        fontWeight: "bold",
    },
    saveButton: {
        backgroundColor: "#1D6A96",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    saveButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    removeButton: {
        marginTop: 8,
        backgroundColor: "#D9534F",
        padding: 6,
        borderRadius: 6,
        alignItems: "center",
        width: 30,
        alignSelf: 'center',
        position: 'absolute',
        right: 10,
    },
    removeButtonText: {
        color: "white",
        fontSize: 13,
        fontWeight: "bold",
    },

});
