import { ref } from "vue";
import { toast } from "vue3-toastify";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const isNative = Capacitor.isNativePlatform();

// Workzone password hashes
const WORKZONE_HASHES = {
  sahil: "1843142582894dbf0147fdc7a00e84dbf32e2e49ab5deee36b789ed50b712029", // sahil123
  slnp: "56044901ecf7eaa11161c9362617080f0117da68659e62b46128b735b15ab844"   // slnp123
};

const activeWorkzoneAuth = ref({
  sahil: false,
  slnp: false
});

let initialized = false;

const hashPassword = async (msg) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(msg);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

const getStorageKey = (zone) => `sbe_workzone_auth_${zone}`;

const getStoredAuth = async (zone) => {
  if (isNative) {
    const { value } = await Preferences.get({ key: getStorageKey(zone) });
    return value === "true";
  }
  return sessionStorage.getItem(getStorageKey(zone)) === "true";
};

const setStoredAuth = async (zone, value) => {
  if (isNative) {
    await Preferences.set({ key: getStorageKey(zone), value: String(value) });
  } else {
    sessionStorage.setItem(getStorageKey(zone), String(value));
  }
};

const removeStoredAuth = async (zone) => {
  if (isNative) {
    await Preferences.remove({ key: getStorageKey(zone) });
  } else {
    sessionStorage.removeItem(getStorageKey(zone));
  }
};

export function useWorkzoneAuth() {
  const checkWorkzoneAuth = async (zone) => {
    if (!zone) return false;
    const normalizedZone = zone.toLowerCase();
    const isAuthed = await getStoredAuth(normalizedZone);
    activeWorkzoneAuth.value[normalizedZone] = isAuthed;
    return isAuthed;
  };

  const initAll = async () => {
    if (initialized) return;
    initialized = true;
    await checkWorkzoneAuth("sahil");
    await checkWorkzoneAuth("slnp");
  };

  initAll();

  const isWorkzoneAuthenticated = (zone) => {
    const normalizedZone = (zone || "").toLowerCase();
    return !!activeWorkzoneAuth.value[normalizedZone];
  };

  const loginWorkzone = async (zone, password) => {
    if (!zone || !password) return false;
    const normalizedZone = zone.toLowerCase();
    const expectedHash = WORKZONE_HASHES[normalizedZone];

    if (!expectedHash) {
      toast.error("Unknown workzone", { autoClose: 3000 });
      return false;
    }

    const inputHash = await hashPassword(password);
    if (inputHash === expectedHash) {
      activeWorkzoneAuth.value[normalizedZone] = true;
      await setStoredAuth(normalizedZone, true);
      const zoneTitle = normalizedZone === "sahil" ? "Sahil Workzone" : "SLNP Workzone";
      toast.success(`${zoneTitle} Unlocked`, { autoClose: 2000 });
      return true;
    } else {
      toast.error("Incorrect password", { autoClose: 3000 });
      return false;
    }
  };

  const logoutWorkzone = async (zone) => {
    if (!zone) return;
    const normalizedZone = zone.toLowerCase();
    activeWorkzoneAuth.value[normalizedZone] = false;
    await removeStoredAuth(normalizedZone);
    const zoneTitle = normalizedZone === "sahil" ? "Sahil Workzone" : "SLNP Workzone";
    toast.info(`${zoneTitle} Locked`, { autoClose: 2000 });
  };

  return {
    activeWorkzoneAuth,
    checkWorkzoneAuth,
    isWorkzoneAuthenticated,
    loginWorkzone,
    logoutWorkzone
  };
}
