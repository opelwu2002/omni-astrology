'use client';

/**
 * 時空召喚儀式個人資料輸入表單 (ProfileForm)
 * 特色：
 * 1. Framer Motion 驅動之外圈西洋十二星座 (順時針) 與內圈紫微地支 (逆時針) 雙向旋轉 SVG 軌跡齒輪
 * 2. 中央主命數動態跳動滾動數字特效 (Counter Animation)
 * 3. 支援真太陽時、經緯度精確定位與檔案持久化儲存
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '@/store/useProfileStore';
import { DEFAULT_CITIES, DEFAULT_LOCATION } from '@/lib/geoData';
import { GeoLocation, Gender } from '@/types/profile';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Check,
  Compass,
  RotateCw,
} from 'lucide-react';

// 西洋十二星座與代碼
const WESTERN_ZODIAC_SIGNS = [
  { name: '牡羊', symbol: '♈', angle: 0 },
  { name: '金牛', symbol: '♉', angle: 30 },
  { name: '雙子', symbol: '♊', angle: 60 },
  { name: '巨蟹', symbol: '♋', angle: 90 },
  { name: '獅子', symbol: '♌', angle: 120 },
  { name: '處女', symbol: '♍', angle: 150 },
  { name: '天秤', symbol: '♎', angle: 180 },
  { name: '天蠍', symbol: '♏', angle: 210 },
  { name: '射手', symbol: '♐', angle: 240 },
  { name: '摩羯', symbol: '♑', angle: 270 },
  { name: '水瓶', symbol: '♒', angle: 300 },
  { name: '雙魚', symbol: '♓', angle: 330 },
];

// 紫微十二地支
const ZIWEI_BRANCHES = [
  { name: '子', angle: 0 },
  { name: '丑', angle: 30 },
  { name: '寅', angle: 60 },
  { name: '卯', angle: 90 },
  { name: '辰', angle: 120 },
  { name: '巳', angle: 150 },
  { name: '午', angle: 180 },
  { name: '未', angle: 210 },
  { name: '申', angle: 240 },
  { name: '酉', angle: 270 },
  { name: '戌', angle: 300 },
  { name: '亥', angle: 330 },
];

/**
 * 計算生命靈數命運數 (Destiny Number)
 */
function computeDestinyNumber(dateStr: string): number {
  if (!dateStr) return 1;
  const digits = dateStr.replace(/\D/g, '').split('').map(Number);
  if (digits.length === 0) return 1;

  let sum = digits.reduce((acc, curr) => acc + curr, 0);
  while (sum > 9 && ![11, 22, 33].includes(sum)) {
    sum = String(sum)
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return sum;
}

export default function ProfileForm() {
  const addProfile = useProfileStore((state) => state.addProfile);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [birthDate, setBirthDate] = useState('1998-06-18');
  const [birthTime, setBirthTime] = useState('08:30');
  const [selectedCityName, setSelectedCityName] = useState(DEFAULT_LOCATION.name);
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  // 自訂經緯度與時區
  const [customLocation, setCustomLocation] = useState<GeoLocation>({
    name: '自訂地點',
    longitude: 121.5654,
    latitude: 25.033,
    timezone: 'Asia/Taipei',
  });

  const [isSuccess, setIsSuccess] = useState(false);

  // 計算動態主命數
  const destinyNumber = useMemo(() => {
    return computeDestinyNumber(birthDate);
  }, [birthDate]);

  // 動態旋轉齒輪速度倍率
  const [gearRotationSpeed, setGearRotationSpeed] = useState(1);

  // 輸入生日時觸發齒輪加速流轉儀式感
  useEffect(() => {
    setGearRotationSpeed(3.5);
    const timer = setTimeout(() => {
      setGearRotationSpeed(1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [birthDate, birthTime]);

  const handleCityChange = (cityName: string) => {
    setSelectedCityName(cityName);
    const found = DEFAULT_CITIES.find((c) => c.name === cityName);
    if (found) {
      setCustomLocation({ ...found });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim() || '未命名對象';
    const locationToSave: GeoLocation = isCustomLocation
      ? customLocation
      : DEFAULT_CITIES.find((c) => c.name === selectedCityName) || DEFAULT_LOCATION;

    addProfile({
      name: trimmedName,
      gender,
      birthDate,
      birthTime,
      location: locationToSave,
      notes: `${locationToSave.name} 出生`,
    });

    setIsSuccess(true);
    setName('');
    setTimeout(() => {
      setIsSuccess(false);
    }, 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md text-slate-100">
      {/* 表單頂部 */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              時空召喚儀式命盤建立
            </h2>
            <p className="text-xs text-slate-400">
              雙向星軌齒輪校準・即時連動生命靈數與真太陽時
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-purple-500/30 text-purple-300 text-xs font-mono">
          <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>儀式能量場同步中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 左側：時空召喚儀式儀表 (SVG 雙向旋轉齒輪與 Counter 動態滾動數字) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          {/* 背景星光霓虹 */}
          <div className="absolute w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* SVG 齒輪軌跡儀表盤 */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
            {/* 1. 外圈：西洋十二星座 (順時針旋轉) */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 40 / gearRotationSpeed,
                ease: 'linear',
              }}
            >
              <svg className="w-full h-full" viewBox="0 0 300 300">
                {/* 外圈裝飾刻度線 */}
                <circle
                  cx="150"
                  cy="150"
                  r="138"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  opacity="0.5"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1"
                  opacity="0.3"
                />

                {/* 12 星座圖標與名稱 */}
                {WESTERN_ZODIAC_SIGNS.map((sign, i) => {
                  const rad = (sign.angle * Math.PI) / 180;
                  const x = 150 + 128 * Math.cos(rad);
                  const y = 150 + 128 * Math.sin(rad);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                      <text
                        x={x}
                        y={y + 3.5}
                        textAnchor="middle"
                        fill="#c7d2fe"
                        fontSize="10"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {sign.symbol}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {/* 2. 內圈：紫微地支 (逆時針相反方向旋轉) */}
            <motion.div
              className="absolute inset-4 sm:inset-5"
              animate={{ rotate: -360 }}
              transition={{
                repeat: Infinity,
                duration: 35 / gearRotationSpeed,
                ease: 'linear',
              }}
            >
              <svg className="w-full h-full" viewBox="0 0 240 240">
                {/* 內圈齒輪邊界 */}
                <circle
                  cx="120"
                  cy="120"
                  r="98"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.6"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="82"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="0.8"
                  opacity="0.4"
                />

                {/* 十二地支名稱 */}
                {ZIWEI_BRANCHES.map((b, i) => {
                  const rad = (b.angle * Math.PI) / 180;
                  const x = 120 + 90 * Math.cos(rad);
                  const y = 120 + 90 * Math.sin(rad);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="7" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                      <text
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fill="#fde68a"
                        fontSize="9"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {b.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {/* 3. 中央主命數核心 (Counter Animation 彈跳滾動數字) */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-900/90 via-slate-900 to-indigo-950/90 border-2 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)] flex flex-col items-center justify-center text-center backdrop-blur-xl">
              <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">
                DESTINY
              </span>

              {/* 跳動滾動特效 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={destinyNumber}
                  initial={{ y: 15, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -15, opacity: 0, scale: 0.5 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="my-0.5"
                >
                  <span className="text-3xl sm:text-4xl font-black font-mono bg-gradient-to-r from-amber-300 via-pink-200 to-purple-300 bg-clip-text text-transparent">
                    {destinyNumber}
                  </span>
                </motion.div>
              </AnimatePresence>

              <span className="text-[9px] text-slate-400">生命主命數</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            外圈西洋黃道 ↺ 內圈紫微地支 ↻
          </p>
        </div>

        {/* 右側：表單輸入欄位 */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 姓名與性別 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  姓名或稱謂
                </label>
                <input
                  type="text"
                  required
                  placeholder="例：王小明"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">生理性別</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                      gender === 'female'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    坤造 (女)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                      gender === 'male'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    乾造 (男)
                  </button>
                </div>
              </div>
            </div>

            {/* 出生年月日與時間 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  出生國曆日期 (觸發齒輪與靈數)
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  出生時間 (24小時制)
                </label>
                <input
                  type="time"
                  required
                  step="60"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark]"
                />
              </div>
            </div>

            {/* 出生地點快速選擇 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  出生地點與真太陽時經度
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomLocation(!isCustomLocation)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition underline underline-offset-2 cursor-pointer"
                >
                  {isCustomLocation ? '切換回常用城市' : '自訂精確經緯度'}
                </button>
              </div>

              {!isCustomLocation ? (
                <select
                  value={selectedCityName}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                >
                  {DEFAULT_CITIES.map((city) => (
                    <option key={city.name} value={city.name} className="bg-slate-900 text-white">
                      {city.country ? `${city.country} - ` : ''}
                      {city.name} (經度 {city.longitude >= 0 ? `東經 ${city.longitude}°` : `西經 ${Math.abs(city.longitude)}°`})
                    </option>
                  ))}
                </select>
              ) : (
                /* 自訂經緯度介面 */
                <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">地點名稱</label>
                      <input
                        type="text"
                        value={customLocation.name}
                        onChange={(e) =>
                          setCustomLocation({ ...customLocation, name: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">時區 (IANA)</label>
                      <input
                        type="text"
                        value={customLocation.timezone}
                        placeholder="例: Asia/Taipei"
                        onChange={(e) =>
                          setCustomLocation({ ...customLocation, timezone: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        經度 (東經為正，西經為負)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={customLocation.longitude}
                        onChange={(e) =>
                          setCustomLocation({
                            ...customLocation,
                            longitude: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        緯度 (北緯為正，南緯為負)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={customLocation.latitude}
                        onChange={(e) =>
                          setCustomLocation({
                            ...customLocation,
                            latitude: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 提交按鈕 */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>已完成時空校準並建立命盤！</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>啟動時空召喚・建立命盤</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
