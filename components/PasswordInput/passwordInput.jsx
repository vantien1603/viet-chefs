import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../../style';

export const PasswordInput = ({ placeholder, onPasswordChange }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const handlePasswordChange = (value) => {
    setPassword(value);
    onPasswordChange(value);
  };
  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        style={commonStyles.input}
        placeholder={placeholder}
        secureTextEntry={!passwordVisible}
        placeholderTextColor={'#968B7B'}
        value={password}
        onChangeText={handlePasswordChange}
      />
      <TouchableOpacity
        onPress={() => setPasswordVisible(!passwordVisible)}
        style={{
          position: 'absolute',
          right: 15,
          top: 15,
        }}
      >
        <Ionicons
          name={passwordVisible ? 'eye-off' : 'eye'}
          size={24}
          color="#968B7B"
        />
      </TouchableOpacity>
    </View>
  );
};
