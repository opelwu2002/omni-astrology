/**
 * 個人檔案狀態管理 (Zustand + LocalStorage 持久化)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, TimeCalculationResult } from '@/types/profile';
import { DEFAULT_LOCATION } from '@/lib/geoData';
import { calculateSolarAndUtcTime, logTimeCalculationSummary } from '@/lib/timeUtils';

interface ProfileState {
  profiles: UserProfile[];
  activeProfileId: string | null;
  activeCalculationResult: TimeCalculationResult | null;

  // 動作
  addProfile: (data: Omit<UserProfile, 'id' | 'createdAt'>) => UserProfile;
  updateProfile: (id: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  recalculateActive: () => void;
}

// 預設範例檔案
const defaultProfile: UserProfile = {
  id: 'default-profile-1',
  name: '範例使用者',
  gender: 'male',
  birthDate: '1995-10-24',
  birthTime: '12:30',
  location: DEFAULT_LOCATION,
  createdAt: 1700000000000,
  notes: '預設測試檔案（台北）',
};

const initialCalcResult = calculateSolarAndUtcTime(
  defaultProfile.birthDate,
  defaultProfile.birthTime,
  defaultProfile.location
);

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [defaultProfile],
      activeProfileId: defaultProfile.id,
      activeCalculationResult: initialCalcResult,

      addProfile: (data) => {
        const newId = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newProfile: UserProfile = {
          ...data,
          id: newId,
          createdAt: Date.now(),
        };

        const calc = calculateSolarAndUtcTime(
          newProfile.birthDate,
          newProfile.birthTime,
          newProfile.location
        );

        // 控制台輸出日誌
        logTimeCalculationSummary(calc);

        set((state) => ({
          profiles: [newProfile, ...state.profiles],
          activeProfileId: newId,
          activeCalculationResult: calc,
        }));

        return newProfile;
      },

      updateProfile: (id, updatedData) => {
        set((state) => {
          const updatedProfiles = state.profiles.map((p) =>
            p.id === id ? { ...p, ...updatedData } : p
          );

          let updatedCalc = state.activeCalculationResult;
          if (state.activeProfileId === id) {
            const target = updatedProfiles.find((p) => p.id === id);
            if (target) {
              updatedCalc = calculateSolarAndUtcTime(
                target.birthDate,
                target.birthTime,
                target.location
              );
              logTimeCalculationSummary(updatedCalc);
            }
          }

          return {
            profiles: updatedProfiles,
            activeCalculationResult: updatedCalc,
          };
        });
      },

      deleteProfile: (id) => {
        set((state) => {
          const remaining = state.profiles.filter((p) => p.id !== id);
          let nextActiveId = state.activeProfileId;
          let nextCalc = state.activeCalculationResult;

          if (state.activeProfileId === id) {
            nextActiveId = remaining.length > 0 ? remaining[0].id : null;
            if (nextActiveId) {
              const target = remaining[0];
              nextCalc = calculateSolarAndUtcTime(
                target.birthDate,
                target.birthTime,
                target.location
              );
              logTimeCalculationSummary(nextCalc);
            } else {
              nextCalc = null;
            }
          }

          return {
            profiles: remaining,
            activeProfileId: nextActiveId,
            activeCalculationResult: nextCalc,
          };
        });
      },

      setActiveProfile: (id) => {
        const state = get();
        const target = state.profiles.find((p) => p.id === id);
        if (!target) return;

        const calc = calculateSolarAndUtcTime(
          target.birthDate,
          target.birthTime,
          target.location
        );

        logTimeCalculationSummary(calc);

        set({
          activeProfileId: id,
          activeCalculationResult: calc,
        });
      },

      recalculateActive: () => {
        const state = get();
        const target = state.profiles.find((p) => p.id === state.activeProfileId);
        if (!target) return;

        const calc = calculateSolarAndUtcTime(
          target.birthDate,
          target.birthTime,
          target.location
        );

        logTimeCalculationSummary(calc);

        set({ activeCalculationResult: calc });
      },
    }),
    {
      name: 'omni-astrology-profiles-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
