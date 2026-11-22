import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSiteBase } from "./site-api";

const TOKEN_KEY = "college.account.token.v1";
const USER_KEY = "college.account.user.v1";

export type AccountUser = {
  id: number;
  username: string;
  email: string;
  qq: string;
  wechat: string;
  status: string;
  created_at: string;
  last_login: string | null;
};

export type CaptchaPayload = { lot_number: string; captcha_output: string; pass_token: string; gen_time: string };

export async function getAccountToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getCachedAccount(): Promise<AccountUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function saveSession(token: string, user: AccountUser): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

async function postJson(path: string, body: unknown): Promise<any> {
  const base = await getSiteBase();
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "请求失败，请稍后再试");
  return data;
}

export async function loginAccount(username: string, password: string, captcha?: CaptchaPayload): Promise<AccountUser> {
  const data = await postJson("/api.php?action=user_login", { username, password, captcha });
  await saveSession(data.token, data.user);
  return data.user as AccountUser;
}

export async function registerAccount(input: {
  username: string;
  password: string;
  email?: string;
  qq?: string;
  wechat?: string;
  captcha?: CaptchaPayload;
}): Promise<void> {
  await postJson("/api.php?action=user_register", input);
  await loginAccount(input.username, input.password, input.captcha);
}

export async function refreshAccount(): Promise<AccountUser | null> {
  const token = await getAccountToken();
  if (!token) return null;
  const base = await getSiteBase();
  const res = await fetch(base + "/api.php?action=user_me&token=" + encodeURIComponent(token));
  if (!res.ok) {
    await clearSession();
    return null;
  }
  const data = await res.json();
  if (data?.user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return (data?.user as AccountUser) ?? null;
}

export async function logoutAccount(): Promise<void> {
  const token = await getAccountToken();
  if (token) {
    try {
      const base = await getSiteBase();
      await fetch(base + "/api.php?action=user_logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {
      // 忽略网络失败
    }
  }
  await clearSession();
}
