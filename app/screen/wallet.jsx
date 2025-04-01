import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import axios from 'axios';

const WalletScreen = () => {
  const [balance, setBalance] = useState(500); // Số dư ví (500 USD)
  const [transactions, setTransactions] = useState([
    { id: '1', type: 'deposit', amount: 200, date: '2025-03-10', description: 'Deposit from bank' },
    { id: '2', type: 'withdraw', amount: -100, date: '2025-03-09', description: 'Withdraw to PayPal' },
  ]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false); // Trạng thái hiển thị form

  const handleDeposit = () => {
    Alert.alert('Redirecting to deposit screen...');
  };

  const toggleWithdrawForm = () => {
    setShowWithdrawForm(!showWithdrawForm);
    // Reset form khi đóng
    if (showWithdrawForm) {
      setWithdrawAmount('');
      setPaypalEmail('');
    }
  };

  const handleWithdraw = async () => {
    if (!paypalEmail || !withdrawAmount) {
      Alert.alert('Error', 'Please enter PayPal email and amount to withdraw.');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Invalid amount.');
      return;
    }

    if (amount > balance) {
      Alert.alert('Error', 'Insufficient balance to withdraw.');
      return;
    }

    try {
      const response = await axios.post('http://YOUR_BACKEND_URL/api/paypal/withdraw', {
        email: paypalEmail,
        amount: amount,
        note: 'Withdraw from app wallet',
      });

      if (response.status === 200) {
        setBalance(prevBalance => prevBalance - amount);
        setTransactions(prev => [
          { id: Date.now().toString(), type: 'withdraw', amount: -amount, date: new Date().toISOString().split('T')[0], description: 'Withdraw to PayPal' },
          ...prev,
        ]);
        setWithdrawAmount('');
        setPaypalEmail('');
        setShowWithdrawForm(false); // Đóng form sau khi rút thành công
        Alert.alert('Success', 'Withdrawal successful!');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to process withdrawal: ' + error.message);
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
        {/* Số dư ví */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeposit}>
              <Ionicons name="add-circle-outline" size={24} color="blackblack" />
              <Text style={styles.actionButtonText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={toggleWithdrawForm}>
              <Ionicons name="remove-circle-outline" size={24} color="blackblack" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showWithdrawForm && (
          <View style={styles.withdrawForm}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>Withdraw to PayPal</Text>
              <TouchableOpacity onPress={toggleWithdrawForm}>
                <Ionicons name="close" size={24} color="#A9411D" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="PayPal Email"
              value={paypalEmail}
              onChangeText={setPaypalEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (USD)"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={toggleWithdrawForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleWithdraw}>
                <Text style={styles.submitButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#A9411D',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  withdrawForm: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#A9411D',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionHistory: {
    flex: 1,
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