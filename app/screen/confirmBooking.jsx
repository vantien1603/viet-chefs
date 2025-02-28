import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ConfirmBookingScreen = () => {
  const handleKeepBooking = () => {
    router.push('screen/Booking/historyBooking');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Confirm booking</Text>
      </View>

      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.image}
        />
        <Text style={styles.thankYouText}>Thank you for booking</Text>
        <Text style={styles.chefText}>with Viet Chef</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Your booking details:</Text>
          <Text style={styles.detailValue}>Tuesday, 19    01:30pm</Text>
          <Text style={styles.detailValue}>
            At The <Text style={styles.linkText}>8502 Preston Rd. Inglewood</Text>
          </Text>
          <Text style={styles.detailValue}>5 people</Text>
          <Text style={styles.detailValue}>Add lots of sauce</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.keepBookingButton} onPress={handleKeepBooking}>
          <Text style={styles.keepBookingText}>Keep booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mainPageButton}>
          <Text style={styles.mainPageText}>Main page</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ConfirmBookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EC',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  image: {
    width: 300,
    height: 300,
  },
  thankYouText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#333',
  },
  chefText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#D35400',
    marginTop: 5,
  },
  detailsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#333',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  linkText: {
    color: '#D35400',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  keepBookingButton: {
    backgroundColor: '#D35400',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 10,
    marginBottom: 15,
  },
  keepBookingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainPageButton: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D35400',
  },
  mainPageText: {
    color: '#D35400',
    fontSize: 16,
    fontWeight: '600',
  },
});
