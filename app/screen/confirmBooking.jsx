import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';
import useAxios from '../../config/AXIOS_API';
import moment from 'moment';
import DateTimePicker from "@react-native-community/datetimepicker";


const ConfirmBookingScreen = () => {
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const { chefId, sessionDate, startTime, endTime, address, quantity, menuId } = useLocalSearchParams();
  const [calculator, setCalculator] = useState(null);


  const getCalculator = async () => {
    console.log(chefId, sessionDate, startTime, endTime, address, quantity, menuId)
    const calcuPayload = {
      chefId: chefId,
      isServing: false,
      bookingDetails: [
        {
          sessionDate: sessionDate,
          startTime: startTime,
          endTime: endTime ? endTime : null,
          location: address,
          guestCount: quantity,
          menuId: menuId,
          extraDishIds: []
        }
      ]
    };

    try {
      const response = await axiosInstance.post('/bookings/calculate-single-booking', calcuPayload);
      setCalculator(response.data);
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
      }
    }
  }
  useEffect(() => {
    getCalculator();

  }, [chefId, sessionDate, startTime, endTime, address, quantity, menuId])

  const handleConfirmBooking = async () => {
    const confirmPayload = {

    }
    try {
      const response = await axiosInstance.post('/bookings', confirmPayload);

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
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Confirm & payment" />
      <ScrollView style={{ paddingTop: 20 }} showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>Job location</Text>
          <View style={{ borderColor: '#e0e0e0', borderWidth: 2, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>46/1 Tan Hoa 2 Street</Text>
            <Text style={{ fontSize: 16 }}>46.1 Tan Hoa 2, Hiep Phu, Quan 9, Ho Chi Minh,Viet Nam</Text>
          </View>
        </View>

        <View>
          {/* <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>Job information</Text> */}
          <View style={{ borderColor: '#e0e0e0', borderWidth: 2, borderRadius: 10, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10, margin: -10 }}>Job information</Text>

            <Text style={{ fontSize: 16, fontWeight: 'bold', }}>Working time</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Working days</Text>
              <Text style={styles.details}>{sessionDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time begin travel</Text>
              <Text style={styles.details}>{calculator?.timeBeginTravel} </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Time begin cook</Text>
              <Text style={styles.details}>{calculator?.timeBeginCook} </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', }}>Job details</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Number of diners</Text>
              <Text style={styles.details}>3</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Number of dishes</Text>
              <Text sstyle={styles.details}>3</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>List of dishes</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.details} >3</Text>
                <Text style={styles.details}>3</Text>
                <Text style={styles.details}>3</Text>
              </View>

            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Palate</Text>
              <Text style={styles.details}>Bac</Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>Payment details</Text>
          <View style={{ borderColor: '#e0e0e0', borderWidth: 2, borderRadius: 10, padding: 20 }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Arrival fee</Text>
              <Text style={styles.details}>{calculator?.arrivalFee}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Chef cooking fee</Text>
              <Text style={styles.details}>{calculator?.chefCookingFee}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Chef serving fee</Text>
              <Text style={styles.details}>{calculator?.chefServingFee}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Total cheff fee price</Text>
              <Text sstyle={styles.details}>{calculator?.totalChefFeePrice}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Total price</Text>
              <Text sstyle={styles.details}>{calculator?.totalPrice}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginBottom: 200 }}>
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>Payment methods</Text>
          <View style={{ borderColor: '#e0e0e0', borderWidth: 2, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row' }}>
                <Ionicons name="logo-paypal" size={24} color="black" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16 }}>Paypal </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="gray" />
            </View>


          </View>
        </View>
      </ScrollView>


      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        // backgroundColor: "#A64B2A",
        backgroundColor: "#EBE5DD",
        padding: 20,
        alignItems: "center",
      }}>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold' }}>Total </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>150,000 VND</Text>
        </View>
        <View>

        </View>
        <TouchableOpacity
          style={{
            // position: "relative",
            width: '100%',
            bottom: 10,
            backgroundColor: "#A64B2A",
            padding: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => handleConfirmBooking()}
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


    </SafeAreaView>
  );
};

export default ConfirmBookingScreen;

const styles = StyleSheet.create({
  row: {
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  details: {
    textAlign: 'right'
  }
});
