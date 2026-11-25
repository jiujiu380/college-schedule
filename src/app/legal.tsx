import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegalRedirect() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  return <Redirect href={("/about-you?doc=" + (doc ?? "terms")) as any} />;
}
