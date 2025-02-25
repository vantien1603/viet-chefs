import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import  MapView, {
  Callout,
  Circle,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

const MapScreen = () => {
  const [marketList, setMarketList] = useState([
    {
      id: 1,
      latitude: 24.794446,
      longitude: 67.057423,
      title: "Team A",
      description: "This is Team A location",
    },
    {
      id: 2,
      latitude: 24.833368,
      longitude: 67.048489,
      title: "Team B",
      description: "This is Team B location",
    },
  ]);

  const MyCustomMarkerView = () => {
    return (
      <Image
        style={{
          width: 30,
          height: 30,
        }}
        source={require("../../assets/images/car-location.png")}
      />
    );
  };

  const MyCustomCalloutView = () => {
    return (
      <View style={{ width: 150 }}>
        <Text>MyCustomCalloutView</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text>Your location</Text>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
            latitude: 24.842865,
            longitude: 67.044405,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={{ latitude: 24.759833, longitude: 67.079526 }}>
          <MyCustomMarkerView />
          <Callout style={{ width: 300, height: 100 }}>
            <MyCustomCalloutView />
          </Callout>
        </Marker>
        {marketList.map((marker) => {
          return (
            <Marker
              draggable
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={marker.title}
              description={marker.description}
              onDragEnd={(e) => console.log({ x: e.nativeEvent.coordinate })}
            />
          );
        })}

        <Circle
          center={{
            latitude: 24.769263,
            longitude: 67.066263,
          }}
          radius={200}
          strokeColor="blue"
          fillColor="#EBF5FB"
        />

        <Polyline
          strokeColor="red"
          strokeWidth={2}
          coordinates={[
            {
              latitude: 24.780292,
              longitude: 67.064913,
            },
            {
              latitude: 24.771274,
              longitude: 67.076091,
            },
          ]}
        />

        <Polygon
          strokeColor="red"
          strokeWidth={2}
          fillColor="#EBF5FB"
          coordinates={[
            {
              latitude: 24.782303,
              longitude: 67.062179,
            },
            {
              latitude: 24.780324,
              longitude: 67.064671,
            },
            {
              latitude: 24.777024,
              longitude: 67.061591,
            },
            {
              latitude: 24.779130,
              longitude: 67.059134,
            },
          ]}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // height: 600,
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;
