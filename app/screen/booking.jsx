import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import moment from 'moment';
import AntDesign from '@expo/vector-icons/AntDesign';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Checkbox, RadioButton, ToggleButton } from "react-native-paper";
import useAxios from '../../config/AXIOS_API';


const getDaysInMonth = (month, year) => {
  const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = moment(`${year}-${month}-${i + 1}`, "YYYY-MM-DD");
    return {
      day: i + 1,
      dayOfWeek: date.format("ddd"),
      date,
    };
  });
};



const dayInWeek = (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);

const min = 1;
const max = 5;

const BookingScreen = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);


  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [selectedDay, setSelectedDay] = useState(null);
  const [address, setAddress] = useState("");
  const today = moment();
  const days = getDaysInMonth(month, year);
  const isBeforeToday = (date) => date.isBefore(today, 'day');
  const isSelectedDay = (day) => selectedDay && selectedDay.isSame(day, 'day');
  const isToday = (date) => moment(date).isSame(today, "day");

  const [menu, setMenu] = useState([]);
  const [dishes, setDishes] = useState([]);

  const modalRef = useRef(null);
  const modalDishesRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [timeStart, setTimeStart] = useState(new Date());
  const [timeEnd, setTimeEnd] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [checked, setChecked] = useState(false);
  const [checkedRepeat, setCheckedRepeat] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  const [quantity, setQuantity] = useState(min);
  const updateQuantity = (num) => setQuantity(Math.min(max, Math.max(min, num)));

  const [selectedMenu, setSelectedMenu] = useState(null);

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTimeStartChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      setTimeStart(selectedTime);
    }
  };

  const handleTimeEndChange = (event, selectedTime) => {
    setShowPicker(false);
    if (selectedTime) {
      setTimeEnd(selectedTime);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuRes, dishesRes] = await Promise.all([
          axiosInstance.get("/menus"),
          axiosInstance.get("/dishes"),
        ]);

        if (menuRes.status === 200) setMenu(menuRes.data.content);
        if (dishesRes.status === 200) setDishes(dishesRes.data.content);
      } catch (error) {
        if (error.response) {
          console.error(`Lỗi ${error.response.status}:`, error.response.data);
        } else {
          console.error(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleBooking = async () => {
    const chefId = 1;
    const menuId = 1;
    const bookingPayload = {
      chefId: chefId,
      isServing: checked,
      bookingDetails: [
        {
          sessionDate: selectedDay.format("YYYY-MM-DD"),
          startTime: moment(timeStart).format("HH:mm"),
          endTime: timeEnd ? moment(timeEnd).format("HH:mm") : null,
          location: address,
          guestCount: quantity,
          menuId: menuId,
          extraDishIds: []
        }
      ]
    };

    try {
      console.log("Payload booking", bookingPayload);
      const response = await axiosInstance.post('/bookings/calculate-single-booking', bookingPayload);
      const sessionDate = selectedDay.format("YYYY-MM-DD")
      const startTime = moment(timeStart).format("HH:mm");
      const endTime = timeEnd ? moment(timeEnd).format("HH:mm") : null;
      response.status === 200 && router.push({ pathname: "screen/confirmBooking", params: { chefId, sessionDate, startTime, endTime, address, quantity, menuId } });

    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
      }
    }
  }


  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header title="Booking" />

      <ScrollView style={{ paddingTop: 20 }} showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}>

        <View >
          <Text style={styles.sectionTitle}>Chef information</Text>
          <View style={[styles.profileContainer, { marginVertical: 20 }]}>
            <View style={styles.profileContainer}>
              <Image source={{ uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600" }} style={styles.profileImage} />
              <View>
                <Text style={styles.profileName}>John Doe</Text>
                <Text style={{ fontSize: 14 }}>20 yearold</Text>
              </View>
            </View>
            <AntDesign name="message1" size={24} color="black" />
          </View>
        </View>



        <View style={styles.section}>
          <View>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            {/* <Text>Tháng {month}</Text> */}
          </View>
          <FlatList
            data={days}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            initialScrollIndex={days.findIndex((item) => isToday(item.date))}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dayContainer,
                  isBeforeToday(item.date) && styles.disabledDay,
                  isSelectedDay(item.date) && styles.selectedDay,
                ]}
                disabled={isBeforeToday(item.date)}
                onPress={() => setSelectedDay(item.date)}
              >
                <Text style={[styles.dayOfWeek, isSelectedDay(item.date) && styles.selectedText]}>
                  {item.dayOfWeek}
                </Text>
                <Text style={[styles.day, isSelectedDay(item.date) && styles.selectedText]}>
                  {item.day}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.label}>Meal time</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeBox}>
            <Text style={styles.timeText}>{timeStart.getHours()}</Text>
            <Text style={styles.separator}>|</Text>
            <Text style={styles.timeText}>{String(timeStart.getMinutes()).padStart(2, "0")}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={timeStart}
              mode="time"
              display="spinner"
              onChange={handleTimeStartChange}
            />
          )}
        </View>
        {checked && (
          <View style={styles.timeContainer}>
            <Text style={styles.label}>End time</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeBox}>
              <Text style={styles.timeText}>{timeEnd.getHours()}</Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.timeText}>{String(timeEnd.getMinutes()).padStart(2, "0")}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={timeEnd}
                mode="time"
                display="spinner"
                onChange={handleTimeEndChange}
              />
            )}
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionTitle}>
            After-meal cleaning service
          </Text>
          <ToggleButton
            size={40}
            icon={checked ? 'toggle-switch' : 'toggle-switch-off'}
            value="toggle"
            status={checked ? 'checked' : 'unchecked'}
            style={{ backgroundColor: 'transparent' }}
            onPress={() => setChecked(!checked)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount of people</Text>
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: 'space-between',
            backgroundColor: "#EBE5DD", borderRadius: 10, marginHorizontal: 50,
            padding: 5
          }}>
            <TouchableOpacity
              onPress={() => updateQuantity(quantity - 1)}
              style={{
                width: 40, height: 40, justifyContent: "center", alignItems: "center",
                backgroundColor: "#fff", borderRadius: 10
              }}
            >
              <Text style={{ fontSize: 20 }}>-</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 20, fontWeight: "bold", marginHorizontal: 20 }}>
              {quantity}
            </Text>

            <TouchableOpacity
              onPress={() => updateQuantity(quantity + 1)}
              style={{
                width: 40, height: 40, justifyContent: "center", alignItems: "center",
                backgroundColor: "#fff", borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>
              Weekly Schedule
            </Text>
            <ToggleButton
              size={40}
              icon={checkedRepeat ? 'toggle-switch' : 'toggle-switch-off'}
              value="toggle"
              status={checkedRepeat ? 'checked' : 'unchecked'}
              onPress={() => setCheckedRepeat(!checkedRepeat)}
              style={{ backgroundColor: 'transparent' }}
            />
          </View>
          {checkedRepeat && (
            <View >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderColor: '#000',
                  borderWidth: 0.5,
                  padding: 10,
                  borderRadius: 20,
                }}
              >
                {dayInWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 16,
                      backgroundColor: selectedDays.includes(day) ? "#A9411D" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        // fontSize:12,
                        color: selectedDays.includes(day) ? "white" : "black",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { flex: 1 }]}>Menu list</Text>
            <TouchableOpacity onPress={() => modalRef.current?.open()}>
              <AntDesign name="plus" size={20} color="black" />
            </TouchableOpacity>
          </View>
          {selectedMenu && (
            <View>
              <Text style={{fontSize:18, fontWeight:'500'}}>{selectedMenu?.name}</Text>
              <Text style={{marginLeft:10}}>{selectedMenu.menuItems.map(dish => dish.dishName).join(", ")}
              </Text>
            </View>
          )}

        </View>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { flex: 1 }]}>Food list</Text>
            <TouchableOpacity onPress={() => modalDishesRef.current?.open()}>
              <AntDesign name="plus" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <View>
            <Text>Mon 1</Text>
            <Text>Mon 2</Text>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <TextInput style={styles.addressText} value={address} onChangeText={setAddress} placeholder='Vinhome' />
        </View>
      </ScrollView>

      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#EBE5DD",
        padding: 20,
        alignItems: "center",
      }}>

        <TouchableOpacity
          style={{
            width: '100%',
            bottom: 10,
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}

          onPress={() => handleBooking()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Confirm booking
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Modalize ref={modalRef} adjustToContentHeight>
        <View style={{ padding: 10, backgroundColor: '#EBE5DD' }}>
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            menu.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 15,
                  backgroundColor: "#EBE5DD",
                  borderRadius: 12,
                  marginBottom: 10,
                  padding: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 1,
                }}
                onPress={() => setSelectedMenu(selectedMenu?.id === item.id ? null : item)}
              >
                <RadioButton
                  value={item.id}
                  status={selectedMenu?.id === item.id ? "checked" : "unchecked"}
                  onPress={() => setSelectedMenu(selectedMenu?.id === item.id ? null : item)}
                  color="#4CAF50"
                />

                <Image
                  source={{
                    uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600",
                  }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 10,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1, }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30 }}>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "500",
                        color: "#333",
                        // flex:1,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{
                      textDecorationLine: 'line-through', fontSize: 18,
                      color: "#333",
                    }}>
                      {item.beforePrice}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#777",
                      }}
                    >
                      {item.menuItems.map(dish => dish.dishName).join(", ")}
                    </Text>
                    <Text style={{
                      fontSize: 18,
                      color: "#333",
                    }}>
                      {item.afterPrice}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

        </View>
      </Modalize>

      <Modalize ref={modalDishesRef} adjustToContentHeight>
        <View style={{ padding: 10, backgroundColor: '#EBE5DD' }}>
          {loading == false && dishes?.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                backgroundColor: "#EBE5DD",
                borderRadius: 12,
                marginBottom: 10,
                padding: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 1,
              }}
              onPress={() => toggleSelection(item.id)}
            >
              <Checkbox.Android
                status={selectedItems.includes(item.id) ? "checked" : "unchecked"}
                onPress={() => toggleSelection(item.id)}
                color="#4CAF50"
              />

              <Image
                source={{
                  uri: "https://images.pexels.com/photos/39866/entrepreneur-startup-start-up-man-39866.jpeg?auto=compress&cs=tinysrgb&w=600",
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 12,
                }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#777",
                  }}
                >
                  Thoi gian nau
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modalize>
    </GestureHandlerRootView>

  );
};

const styles = StyleSheet.create({
  section: {
    borderTopColor: "#D1D1D1",
    borderTopWidth: 0.5,
    paddingVertical: 20,
    // paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: "center",
    // marginVertical: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 45,
    marginRight: 20
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dayContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: "center",
    // backgroundColor: '#E2AA97',
    backgroundColor: "#519254",
    borderRadius: 20,
  },
  disabledDay: {
    backgroundColor: "#BAB8B8",
  },
  selectedDay: {
    backgroundColor: "#A9411D",
  },
  selectedText: {
    color: "white",
    fontWeight: "bold",
  },
  bookButton: {
    backgroundColor: "#A9411D",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    margin: 20,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  //thoi gian
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  timeBox: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#A9411D'
  },
  separator: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 5,
  },
  // selectedText: { fontSize: 18, fontWeight: "bold", marginTop: 20 },

  //
});

export default BookingScreen;
