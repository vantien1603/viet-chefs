import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ProgressBar = ({ title, currentStep, totalSteps }) => {
  // Tạo mảng steps dựa trên totalSteps
  const steps = Array.from({ length: totalSteps }, (_, index) => {
    const stepNumber = index + 1;
    return {
      label: stepNumber === currentStep ? title : `Bước ${stepNumber}`, // Nhãn mặc định nếu không phải bước hiện tại
      step: stepNumber,
    };
  });

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.step} style={styles.stepContainer}>
          {/* Vòng tròn bước */}
          <View
            style={[
              styles.circle,
              step.step <= currentStep
                ? styles.circleActive
                : styles.circleInactive,
            ]}
          >
            <Text
              style={[
                styles.circleText,
                step.step <= currentStep
                  ? styles.circleTextActive
                  : styles.circleTextInactive,
              ]}
            >
              {step.step}
            </Text>
          </View>
          {/* Nhãn bước */}
          <Text
            style={[
              styles.label,
              step.step <= currentStep
                ? styles.labelActive
                : styles.labelInactive,
            ]}
          >
            {step.label}
          </Text>
          {/* Đường nối giữa các bước */}
          {index < steps.length - 1 && (
            <View
              style={[
                styles.line,
                step.step < currentStep
                  ? styles.lineActive
                  : styles.lineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  circleActive: {
    backgroundColor: "#4CAF50",
  },
  circleInactive: {
    backgroundColor: "#E0E0E0",
  },
  circleText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  circleTextActive: {
    color: "#fff",
  },
  circleTextInactive: {
    color: "#888",
  },
  label: {
    fontSize: 12,
    textAlign: "center",
  },
  labelActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  labelInactive: {
    color: "#888",
  },
  line: {
    position: "absolute",
    top: 15,
    left: "50%",
    width: "100%",
    height: 2,
  },
  lineActive: {
    backgroundColor: "#4CAF50",
  },
  lineInactive: {
    backgroundColor: "#E0E0E0",
  },
});

export default ProgressBar;