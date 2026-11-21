import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { loadAgreed } from "../lib/agreement";
import { useTheme } from "../lib/theme-context";

export default function Index() {
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState<boolean | null>(null);

  useEffect(() => {
    loadAgreed().then(setAgreed);
  }, []);

  if (agreed === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!agreed) return <Redirect href="/agreement" />;
  return <Redirect href="/home" />;
}
