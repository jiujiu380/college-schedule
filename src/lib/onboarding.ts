import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.intro.v1";

export async function hasSeenIntro(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function markIntroSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}
