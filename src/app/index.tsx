import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getAccountToken } from "../lib/account";
import { loadAgreed } from "../lib/agreement";
import { hasSeenIntro } from "../lib/onboarding";
import { useTheme } from "../lib/theme-context";

export default function Index() {
  const { colors } = useTheme();
  const [state, setState] = useState<{ intro: boolean; agreed: boolean; token: string | null } | null>(null);

  useEffect(() => {
    Promise.all([hasSeenIntro(), loadAgreed(), getAccountToken()])
      .then(([intro, agreed, token]) => setState({ intro, agreed, token }))
      .catch(() => setState({ intro: true, agreed: true, token: null }));
  }, []);

  if (!state) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!state.intro) return <Redirect href="/intro" />;
  if (!state.agreed) return <Redirect href="/agreement" />;
  if (!state.token) return <Redirect href="/account?gate=1" />;
  return <Redirect href="/home" />;
}
