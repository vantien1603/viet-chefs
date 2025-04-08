import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import AXIOS_API from '../../config/AXIOS_API';
import { router, useLocalSearchParams } from 'expo-router';

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const params = useLocalSearchParams();

  const fetchWalletData = async () => {
    try {
      const response = await AXIOS_API.get('/users/profile/my-wallet');
      setBalance(response.data.balance || 0);
      setWalletId(response.data.id); 
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Unable to load wallet data.');
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (params?.depositAmount) {
      const newAmount = parseFloat(params.depositAmount);
      setBalance(prevBalance => prevBalance + newAmount);
      setTransactions(prev => [
        { 
          id: Date.now().toString(), 
          type: 'deposit', 
          amount: newAmount, 
          date: new Date().toISOString().split('T')[0], 
          description: 'Deposit from PayPal' 
        },
        ...prev,
      ]);
    }
  }, [params?.depositAmount]);

  const handleDeposit = () => {
    if (walletId) {
      router.push({
        pathname: "/screen/deposit",
        params: { id: walletId, balance }
      });
    } else {
      Alert.alert('Error', 'Wallet ID not found.');
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.type === 'deposit' ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={24}
          color={item.type === 'deposit' ? 'green' : 'red'}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.type === 'deposit' ? 'green' : 'red' }]}>
        {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Wallet" />
      <View style={styles.container}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeposit}>
              <Ionicons name="add-circle-outline" size={24} color="black" />
              <Text style={styles.actionButtonText}>Deposit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.transactionHistory}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noTransactions}>No transactions yet.</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles giữ nguyên, chỉ xóa các style liên quan đến withdrawForm
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  balanceContainer: {
    backgroundColor: '#A9411D',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  actionButtonText: {
    color: '#A9411D',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  transactionHistory: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTransactions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default WalletScreen;