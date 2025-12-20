import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
const BASE =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://adkcrackers.com/foodmate/api/v1' // change to server IP on device

async function authFetch(
  path: string,
  opts: RequestInit & { returnBlob?: boolean } = {},
) {
  const { returnBlob, ...fetchOpts } = opts
  const token = await AsyncStorage.getItem('token')
  const headers: any = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'network error')
  }
  // Return raw response for blob data (e.g., PDF files)
  if (returnBlob) {
    return res
  }
  return res.json()
}

export function login(email: string, password: string) {
  return fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((res) => res.json())
}

export function register(payload: any) {
  return fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => res.json())
}

export default authFetch
