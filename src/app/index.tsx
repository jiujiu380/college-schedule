import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { loadAgreed } from "../lib/agreement";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme-context";

export default function Index() {
  const { status } = useAuth();
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState<boolean | null>(null);

  useEffect(() => {
    loadAgreed().then(setAgreed);
  }, []);

  const bg = useMemo(() => ({ flex: 1, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: colors.surface }), [colors]);

  if (status === "loading" || agreed === null) {
    return (
      <View style={bg}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!agreed) return <Redirect href="/agreement" />;
  return <Redirect href={status === "guest" ? "/login" : "/home"} />;
}
