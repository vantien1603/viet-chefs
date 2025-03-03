import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import { Ionicons } from '@expo/vector-icons';

const ConfirmBookingScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleKeepBooking = () => {
    router.push('screen/Booking/historyBooking');
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
          <Text style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>Job information</Text>
          <View style={{ borderColor: '#e0e0e0', borderWidth: 2, borderRadius: 10, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', }}>Working time</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Working days</Text>
              <Text style={styles.details}>Monday, 03/03/2025 - 12:00</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ fontSize: 14, flex: 1 }}>Work for</Text>
              <Text style={styles.details}>2 hours, 10:00 to 12:00</Text>
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
