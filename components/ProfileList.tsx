'use client';

/**
 * 多聯絡人 Profile 管理與切換列表組件
 */
import React from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { Users, Trash2, CheckCircle2, MapPin, Calendar, Clock } from 'lucide-react';

export default function ProfileList() {
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const deleteProfile = useProfileStore((state) => state.deleteProfile);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm text-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">已儲存命盤清單</h2>
            <p className="text-xs text-slate-400">點擊卡片即可切換並重新推算時間</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-purple-300 border border-purple-500/20">
          共 {profiles.length} 筆
        </span>
      </div>

      {profiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-500">
          <Users className="w-10 h-10 mb-2 stroke-1 opacity-50" />
          <p className="text-sm">尚無已建立的個人檔案</p>
          <p className="text-xs text-slate-600 mt-1">請透過左側表單新增第一筆資料</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;

            return (
              <div
                key={profile.id}
                onClick={() => setActiveProfile(profile.id)}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-950/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        profile.gender === 'female'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {profile.gender === 'female' ? '坤造' : '乾造'}
                    </span>
                    <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition">
                      {profile.name}
                    </h3>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[11px] text-purple-400 font-medium ml-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        分析中
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    title="刪除檔案"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`確定要刪除「${profile.name}」的命盤檔案嗎？`)) {
                        deleteProfile(profile.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mt-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{profile.birthDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{profile.birthTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {profile.location.name} (
                      {profile.location.longitude >= 0
                        ? `東經${profile.location.longitude}°`
                        : `西經${Math.abs(profile.location.longitude)}°`}
                      )
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
