import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const BASE = Constants.expoConfig.extra.apiUrl || "http://192.168.1.9:4000/api/v1"; // change to server IP on device

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'network error');
  }
  return res.json();
}

export function login(email: string, password: string) {
  return fetch(`${BASE}/auth/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) })
    .then(res=>res.json());
}

export function register(payload: any) {
  return fetch(`${BASE}/auth/register`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    .then(res=>res.json());
}

export default authFetch;
