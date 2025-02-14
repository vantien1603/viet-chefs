import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Button, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HistoryBookingScreen = () => {
  const [activeTab, setActiveTab] = useState('Past');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const pastBookings = [
    { id: '1', chef: 'John Doe Chef', distance: '5.0 Kms', details: 'Yakisoba Noodles 1 x', date: '4 Jan 2025', price: '$30' },
    { id: '2', chef: 'John Doe Chef', distance: '5.0 Kms', details: 'Yakisoba Noodles 1 x + Thai Fried Noodles 1 x', date: '3 Jan 2025', price: '$65' },
    { id: '3', chef: 'John Doe Chef', distance: '5.0 Kms', details: 'Yakisoba Noodles 1 x + Thai Fried Noodles 1 x', date: '2 Jan 2025', price: '$150' },
  ];

  const upcomingBookings = [
    { id: '4', chef: 'John Doe Chef', distance: '5.0 Kms', details: 'Yakisoba Noodles 1 x + Thai Fried Noodles 1 x', date: '5 Jan 2025', price: '$150' },
    { id: '5', chef: 'John Doe Chef', distance: '5.0 Kms', details: 'Yakisoba Noodles 1 x', date: '5 Jan 2025', price: '$55' },
  ];

  const handleCancelPress = (booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const confirmCancellation = () => {
    console.log(`Booking ${selectedBooking.id} cancelled`);
    setModalVisible(false);
    setSelectedBooking(null);
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.chefName}>{item.chef}</Text>
      <Text style={styles.detailText}>• {item.distance}</Text>
      <Text style={styles.detailText}>{item.details}</Text>
      <Text style={styles.detailText}>{item.date} • {item.price}</Text>
      {activeTab === 'Upcoming' && (
        <TouchableOpacity onPress={() => handleCancelPress(item)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>History</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Past' && styles.activeTabButton]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Upcoming' && styles.activeTabButton]}
          onPress={() => setActiveTab('Upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'Past' ? pastBookings : upcomingBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Image source={require('../../../assets/images/cancel.png')} style={styles.cancelImage} />            
            <Text style={styles.modalText}>Are you sure, you want to cancel this booking?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.noText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={confirmCancellation}>
                <Text style={styles.confirmCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HistoryBookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EC',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: '#D35400',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#D35400',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  bookingItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 10,
  },
  chefName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF666A',
    fontWeight: '600',
  },
  confirmCancel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  noText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginHorizontal: 20,
    paddingVertical: 15,
  },
  cancelImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  btnCancel: {
    backgroundColor: '#A9411D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  }
});
