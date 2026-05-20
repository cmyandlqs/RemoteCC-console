import { create } from "zustand";

export type AdminStore = {
  connectedDevices: number;
  accessUrl: string | null;
  pairingToken: string | null;
  setAccessUrl: (url: string) => void;
  setPairingToken: (token: string) => void;
  setConnectedDevices: (count: number) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  connectedDevices: 0,
  accessUrl: null,
  pairingToken: null,
  setAccessUrl: (url) => set({ accessUrl: url }),
  setPairingToken: (token) => set({ pairingToken: token }),
  setConnectedDevices: (count) => set({ connectedDevices: count }),
}));