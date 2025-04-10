import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import axios from "axios";
import useAxios from "../../config/AXIOS_API";

const ScheduleCalendar = () => {
  const [schedule, setSchedule] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axiosInstance.get("/chef-schedules/me");
      console.log(response.data);
      const data = response.data;
      setSchedule(data);
      highlightDays(data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải lịch từ server.");
    } finally {
      setLoading(false);
    }
  };

  const highlightDays = (scheduleData) => {
    const newMarks = {};
    const now = moment();
    const startOfMonth = now.clone().startOf("month");
    const endOfMonth = now.clone().endOf("month");

    for (
      let day = startOfMonth.clone();
      day.isSameOrBefore(endOfMonth, "day");
      day.add(1, "day")
    ) {
      const dow = (day.isoWeekday() + 6) % 7;

      const matched = scheduleData.some((item) => item.dayOfWeek === dow);
      if (matched) {
        const formatted = day.format("YYYY-MM-DD");
        newMarks[formatted] = {
          selected: true,
          selectedColor: "#A9411D",
        };
      }
    }

    setMarkedDates(newMarks);
  };

  if (loading) return <ActivityIndicator size="large" color="#A9411D" />;

  return (
    <View>
      <Calendar
        markedDates={markedDates}
        markingType={"simple"}
        theme={{
          selectedDayBackgroundColor: "#A9411D",
          selectedDayTextColor: "white",
          todayTextColor: "#A9411D",
        }}
      />
    </View>
  );
};

export default ScheduleCalendar;
