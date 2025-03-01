import React, { useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const FirstRoute = () => (
  <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
    <View style={{ backgroundColor: '#9C583F', padding: 15, borderRadius: 15, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }} 
          style={{ width: 80, height: 80, borderRadius: 10, marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Yakisoba Noodles</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>Noodle with Pork</Text>
        </View>
      </View>
      {/* <View style={{ height: 1, backgroundColor: 'white', marginVertical: 10 }} /> */}
      <Text style={{ color: 'white', fontStyle: 'italic' }}>Anh Khoa</Text>
      <Text style={{ color: 'white' }}>8502 Preston Rd. Inglewood</Text>
      <Text style={{ color: 'white' }}>0123232133</Text>
      <Text style={{ color: 'white' }}>Cook for 1 hour</Text>
      <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 5 }}>Status: Processing</Text>
    </View>
  </View>
);

const SecondRoute = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Completed Orders</Text>
  </View>
);

const ThirdRoute = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>New Orders</Text>
  </View>
);

const initialLayout = { width: Dimensions.get('window').width };

const OrderHistories = () => {
  const [index, setIndex] = useState(1);
  const [routes] = useState([
    { key: 'new', title: 'New' },
    { key: 'processing', title: 'Processing' },
    { key: 'completed', title: 'Completed' },
  ]);

  const renderScene = SceneMap({
    new: ThirdRoute,
    processing: FirstRoute,
    completed: SecondRoute,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: '#9C583F', height: 3 }}
          style={{ backgroundColor: 'white' }}
          activeColor="#9C583F"
          inactiveColor="gray"
          labelStyle={{ fontWeight: 'bold' }}
        />
      )}
    />
  );
};

export default OrderHistories;
