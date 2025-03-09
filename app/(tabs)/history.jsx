import React, { useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import CardOrder from '../../components/cardOrder';

const FirstRoute = () => (
  <View style={{ alignItems: 'center', padding: 20 }}>
    <CardOrder/>
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

// const initialLayout = { width: Dimensions.get('window').width };

const OrderHistories = () => {
  const [index, setIndex] = useState(1);
  const [routes] = useState([
    { key: 'waiting', title: 'Waiting' },
    { key: 'repeat', title: 'Repeat' },
    { key: 'completed', title: 'Completed' },
  ]);

  const renderScene = SceneMap({
    waiting: ThirdRoute,
    repeat: FirstRoute,
    completed: SecondRoute,
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={'List order'} />
      <View style={{flex:1}}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          
          // initialLayout={initialLayout}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: '#9C583F', height: 3 }}
              style={{ backgroundColor: '#EBE5DD', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0}}
              activeColor="#9C583F"
              inactiveColor="gray"
              labelStyle={{ fontWeight: 'bold' }}
              
            />
          )}
        />
      </View>

    </SafeAreaView>

  );
};

export default OrderHistories;
