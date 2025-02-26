// import React from "react";
// import { 
//   SafeAreaView, 
//   View, 
//   Text, 
//   ScrollView, 
//   TouchableOpacity 
// } from "react-native";
// import { Header } from "./../../../components/header";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { VictoryChart, VictoryLine, VictoryTooltip, VictoryTheme } from "victory-native";

// const ChefDashboardScreen = () => {
//   const data = [
//     { x: "10AM", y: 100 },
//     { x: "11AM", y: 200 },
//     { x: "12PM", y: 300 },
//     { x: "1PM", y: 400 },
//     { x: "2PM", y: 500 },
//     { x: "3PM", y: 600 },
//   ];

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa", paddingTop: 10 }}>
//       <Header title="Dashboard" />
//       <ScrollView style={{ flex: 1, padding: 20 }}>

//         {/* Header Section */}
//         <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//           <View>
//             <Text style={{ color: "red", fontWeight: "bold", fontSize: 14 }}>LOCATION</Text>
//             <Text style={{ fontSize: 16, fontWeight: "600" }}>New York, USA</Text>
//           </View>
//           <TouchableOpacity>
//             <Icon name="account-circle" size={40} color="black" />
//           </TouchableOpacity>
//         </View>

//         {/* Cards Section */}
//         <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>TOTAL ORDERS</Text>
//             <Text style={styles.cardText}>100</Text>
//           </View>
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>TOTAL ORDERS</Text>
//             <Text style={styles.cardText}>10</Text>
//           </View>
//         </View>

//         {/* Revenue Chart */}
//         <View style={styles.card}>
//           <View style={styles.cardHeader}>
//             <Text style={styles.cardTitle}>Total Revenue</Text>
//             <TouchableOpacity>
//               <Text style={{ color: "#ff6600" }}>View Details</Text>
//             </TouchableOpacity>
//           </View>
//           <Text style={styles.bigText}>$1000</Text>

//           <VictoryChart theme={VictoryTheme.material} domainPadding={{ x: 20 }}>
//             <VictoryLine
//               data={data}
//               style={{ data: { stroke: "#ff6600", strokeWidth: 3 } }}
//               labels={({ datum }) => `$${datum.y}`}
//               labelComponent={
//                 <VictoryTooltip 
//                   flyoutStyle={{ stroke: "gray", fill: "white" }} 
//                   style={{ fontSize: 12 }}
//                 />
//               }
//             />
//           </VictoryChart>
//         </View>

//         {/* Reviews Section */}
//         <View style={styles.card}>
//           <View style={styles.cardHeader}>
//             <Text style={styles.cardTitle}>Reviews</Text>
//             <TouchableOpacity>
//               <Text style={{ color: "#ff6600" }}>See All Reviews</Text>
//             </TouchableOpacity>
//           </View>
//           <Text style={styles.rating}>4.5</Text>
//           <Text>Total 20 Reviews</Text>
//         </View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = {
//   card: {
//     flex: 1,
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     marginBottom: 20,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   cardTitle: {
//     fontWeight: "bold",
//     fontSize: 18,
//   },
//   cardText: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   bigText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginTop: 10,
//   },
//   rating: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginTop: 10,
//     color: "#ff6600",
//   },
// };

// export default ChefDashboardScreen;
