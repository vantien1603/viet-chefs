import { View, Text, TextInput, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { PasswordInput } from '../../components/PasswordInput/passwordInput'; 
import { commonStyles } from '../../style';
import Header from '../../components/header';
export default function SignUpScreen() {
    const [phone, setPhone] = useState('');
    const [mail, setMail] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    // const [rePassword, setRePassword] = useState('');
    // const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSignUp = () => {
        // router.push('/screen/verify');
        router.push({ pathname: "screen/verify", params: {username,fullName,phone , mail, mode: "register" } });
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };

    return (

        <ScrollView style={commonStyles.containerContent}>
            <Header title="Register" />
            <View>

                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> Pleasure to be at your service!</Text>
                <Text style={{ fontSize: 16, marginTop: 10, marginBottom: 20 }}> Create an account now to experience our services!</Text>

                <Text style={commonStyles.labelInput}>Username</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='thangcayEP'
                    value={username}
                    onChangeText={setUsername}
                />
                <Text style={commonStyles.labelInput}>First and last name</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='Huynh Van Tien'
                    value={fullName}
                    onChangeText={setFullName}
                />
                <Text style={commonStyles.labelInput}>Phone number</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder="0373097409"
                    // placeholderTextColor="#968B7B"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={setPhone}
                />
                <Text style={commonStyles.labelInput}>Mail address</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder="abc@gmail.com"
                    // placeholderTextColor="#968B7B"
                    keyboardType="email-address"
                    value={mail}
                    onChangeText={setMail}
                />

                <View style={{ flex: 1, alignItems: 'center' }}>

                    <TouchableOpacity onPress={handleSignUp} style={{
                        padding: 13,
                        marginTop: 10,
                        borderWidth: 1,
                        backgroundColor: '#383737',
                        borderColor: '#383737',
                        borderRadius: 50,
                        width: 300,
                    }}>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 18,
                            color: '#fff',
                            fontFamily: 'nunito-bold',
                        }}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}