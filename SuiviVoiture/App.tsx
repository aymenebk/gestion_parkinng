import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LangProvider } from "./src/LangContext";
import ControlScreen from "./src/screens/ControlScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <LangProvider>
        <ControlScreen />
      </LangProvider>
    </SafeAreaProvider>
  );
}
