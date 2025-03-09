import React, { useContext, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../../style';
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";


const menuItems = [
  { id: '1', icon: 'wallet', title: 'Payment methods' },
  // { id: '2', icon: 'gift', title: 'Ưu đãi của tôi', badge: 2 },
  // { id: '3', icon: 'ribbon', title: 'bRewards' },
  // { id: '4', icon: 'ticket', title: 'Gói Ưu Đãi' },
  // { id: '5', icon: 'heart', title: 'Tasker yêu thích' },
  // { id: '6', icon: 'ban', title: 'Danh sách chặn' },
  // { id: '7', icon: 'share-social', title: 'Săn quà giới thiệu' },
  // { id: '8', icon: 'help-circle', title: 'Trợ giúp' },
  { id: '2', icon: 'briefcase', title: 'Create chef account' },
  // { id: '3', icon: 'flag', title: 'Country' },
  // { id: '4', icon: 'language', title: 'Language' },
  { id: '3', icon: 'settings', title: 'Setting' },
];






const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const handleSetting = (id) => {
    switch (id) {
      case '1': {
        break;
      }
      case '2': {
        router.push('/screen/chefRegister');
        break;

      }
      case '3': {
        router.push('/screen/setting');
        break;

      }
      // case '4': {
      //   router.push('/screen/setting');
      //   break;
      // }
    }
  }
  return (
    <ScrollView style={commonStyles.containerContent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 , padding:10, borderBottomColor:"#ddd",borderBottomWidth:1}}>
        <Image
          source={{
            uri: "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png",
          }}
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 20 }}
        />
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Huỳnh Văn Tiến</Text>
          <Text style={{ color: '#A9411D', fontWeight: 'bold', fontSize: 16 }}>Xem hồ sơ {'>'}</Text>
        </View>
      </View>
      {/* <View style={{backgroundColor:"#fff", paddingVertical:5, marginHorizontal:-20}}> */}

      {/* </View> */}
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleSetting(item.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd'
          }}
        >
          <Ionicons name={item.icon} size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16 }}>{item.title}</Text>

          {item.badge && (
            <View style={{
              backgroundColor: '#FFA500',
              paddingHorizontal: 8,
              borderRadius: 12,
              marginRight: 8
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.badge}</Text>
            </View>
          )}

          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
};

export default Profile;


