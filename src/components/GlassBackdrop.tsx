import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Scheme } from "../theme";

export function GlassBackdrop({ scheme }: { scheme: Scheme }) {
  const dark = scheme === "dark";
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="glassBlue" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={dark ? "#2563EB" : "#60A5FA"} stopOpacity={dark ? 0.52 : 0.62} />
          <Stop offset="62%" stopColor={dark ? "#2563EB" : "#60A5FA"} stopOpacity={dark ? 0.18 : 0.22} />
          <Stop offset="100%" stopColor={dark ? "#2563EB" : "#60A5FA"} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glassViolet" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={dark ? "#7C3AED" : "#A78BFA"} stopOpacity={dark ? 0.46 : 0.48} />
          <Stop offset="60%" stopColor={dark ? "#7C3AED" : "#A78BFA"} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={dark ? "#7C3AED" : "#A78BFA"} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glassTeal" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={dark ? "#0D9488" : "#5EEAD4"} stopOpacity={dark ? 0.40 : 0.46} />
          <Stop offset="60%" stopColor={dark ? "#0D9488" : "#5EEAD4"} stopOpacity="0.10" />
          <Stop offset="100%" stopColor={dark ? "#0D9488" : "#5EEAD4"} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glassPink" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={dark ? "#BE185D" : "#F0ABFC"} stopOpacity={dark ? 0.3 : 0.32} />
          <Stop offset="100%" stopColor={dark ? "#BE185D" : "#F0ABFC"} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="338" cy="86" r="280" fill="url(#glassBlue)" />
      <Circle cx="22" cy="390" r="260" fill="url(#glassViolet)" />
      <Circle cx="370" cy="690" r="250" fill="url(#glassTeal)" />
      <Circle cx="120" cy="650" r="190" fill="url(#glassPink)" />
    </Svg>
  );
}
