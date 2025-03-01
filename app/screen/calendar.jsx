// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, Switch } from "react-native";
// import CalendarPicker from "react-native-calendar-picker";
// import { Ionicons } from "@expo/vector-icons";

// const CalendarScreen = () => {
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [multiSelect, setMultiSelect] = useState(false);
//   const [startTime, setStartTime] = useState("Start time");
//   const [endTime, setEndTime] = useState("End time");

//   return (
//     <View style={{ flex: 1, padding: 20, backgroundColor: "#F8F5F1" }}>
//       <Text style={{ fontSize: 22, textAlign: "center", fontWeight: "bold", marginBottom: 10 }}>
//         September 2021
//       </Text>

//       <CalendarPicker
//         onDateChange={(date) => setSelectedDate(date)}
//         selectedDayColor="#6C63FF"
//         selectedDayTextColor="#fff"
//         textStyle={{ color: "#000" }}
//       />

//       {/* Time Selection */}
//       <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
//         <TouchableOpacity
//           style={{
//             borderWidth: 1,
//             borderRadius: 8,
//             padding: 10,
//             flex: 1,
//             alignItems: "center",
//             marginRight: 10,
//             borderColor: "#B08458",
//           }}
//           onPress={() => setStartTime("10:00 AM")}
//         >
//           <Text>{startTime}</Text>
//           <Ionicons name="time-outline" size={16} />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={{
//             borderWidth: 1,
//             borderRadius: 8,
//             padding: 10,
//             flex: 1,
//             alignItems: "center",
//             marginLeft: 10,
//             borderColor: "#B08458",
//           }}
//           onPress={() => setEndTime("6:00 PM")}
//         >
//           <Text>{endTime}</Text>
//           <Ionicons name="time-outline" size={16} />
//         </TouchableOpacity>
//       </View>

//       {/* Toggle Multi-Select */}
//       <View style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}>
//         <Text style={{ flex: 1 }}>Chọn cho nhiều ngày</Text>
//         <Switch value={multiSelect} onValueChange={setMultiSelect} />
//       </View>
//     </View>
//   );
// };

// export default CalendarScreen;