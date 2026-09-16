/**
 * 預設常用城市經緯度與時區資料庫
 */
import { GeoLocation } from '@/types/profile';

export const DEFAULT_CITIES: GeoLocation[] = [
  // 台灣主要城市
  { name: '台北市', country: '台灣', longitude: 121.5654, latitude: 25.0330, timezone: 'Asia/Taipei' },
  { name: '新北市', country: '台灣', longitude: 121.4657, latitude: 25.0124, timezone: 'Asia/Taipei' },
  { name: '桃園市', country: '台灣', longitude: 121.3010, latitude: 24.9936, timezone: 'Asia/Taipei' },
  { name: '台中市', country: '台灣', longitude: 120.6736, latitude: 24.1477, timezone: 'Asia/Taipei' },
  { name: '台南市', country: '台灣', longitude: 120.1856, latitude: 22.9997, timezone: 'Asia/Taipei' },
  { name: '高雄市', country: '台灣', longitude: 120.3120, latitude: 22.6273, timezone: 'Asia/Taipei' },
  { name: '基隆市', country: '台灣', longitude: 121.7462, latitude: 25.1276, timezone: 'Asia/Taipei' },
  { name: '新竹市', country: '台灣', longitude: 120.9688, latitude: 24.8138, timezone: 'Asia/Taipei' },
  { name: '嘉義市', country: '台灣', longitude: 120.4491, latitude: 23.4801, timezone: 'Asia/Taipei' },
  { name: '花蓮縣', country: '台灣', longitude: 121.6016, latitude: 23.9872, timezone: 'Asia/Taipei' },
  { name: '宜蘭縣', country: '台灣', longitude: 121.7686, latitude: 24.7021, timezone: 'Asia/Taipei' },
  { name: '台東縣', country: '台灣', longitude: 121.1444, latitude: 22.7583, timezone: 'Asia/Taipei' },
  { name: '澎湖縣', country: '台灣', longitude: 119.5793, latitude: 23.5711, timezone: 'Asia/Taipei' },
  { name: '金門縣', country: '台灣', longitude: 118.3226, latitude: 24.4492, timezone: 'Asia/Taipei' },

  // 港澳與大陸重要城市
  { name: '香港', country: '香港', longitude: 114.1694, latitude: 22.3193, timezone: 'Asia/Hong_Kong' },
  { name: '澳門', country: '澳門', longitude: 113.5439, latitude: 22.1987, timezone: 'Asia/Macau' },
  { name: '北京', country: '中國', longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai' },
  { name: '上海', country: '中國', longitude: 121.4737, latitude: 31.2304, timezone: 'Asia/Shanghai' },
  { name: '廣州', country: '中國', longitude: 113.2644, latitude: 23.1291, timezone: 'Asia/Shanghai' },
  { name: '深圳', country: '中國', longitude: 114.0579, latitude: 22.5431, timezone: 'Asia/Shanghai' },
  { name: '成都', country: '中國', longitude: 104.0668, latitude: 30.5728, timezone: 'Asia/Shanghai' },
  { name: '重慶', country: '中國', longitude: 106.5516, latitude: 29.5630, timezone: 'Asia/Shanghai' },
  { name: '烏魯木齊', country: '中國', longitude: 87.6168, latitude: 43.8256, timezone: 'Asia/Urumqi' },

  // 東亞與東南亞
  { name: '東京', country: '日本', longitude: 139.6917, latitude: 35.6895, timezone: 'Asia/Tokyo' },
  { name: '大阪', country: '日本', longitude: 135.5023, latitude: 34.6937, timezone: 'Asia/Tokyo' },
  { name: '首爾', country: '南韓', longitude: 126.9780, latitude: 37.5665, timezone: 'Asia/Seoul' },
  { name: '新加坡', country: '新加坡', longitude: 103.8198, latitude: 1.3521, timezone: 'Asia/Singapore' },
  { name: '吉隆坡', country: '馬來西亞', longitude: 101.6869, latitude: 3.1390, timezone: 'Asia/Kuala_Lumpur' },
  { name: '曼谷', country: '泰國', longitude: 100.5018, latitude: 13.7563, timezone: 'Asia/Bangkok' },
  { name: '胡志明市', country: '越南', longitude: 106.6297, latitude: 10.8231, timezone: 'Asia/Ho_Chi_Minh' },

  // 歐美與大洋洲
  { name: '倫敦', country: '英國', longitude: -0.1278, latitude: 51.5074, timezone: 'Europe/London' },
  { name: '巴黎', country: '法國', longitude: 2.3522, latitude: 48.8566, timezone: 'Europe/Paris' },
  { name: '柏林', country: '德國', longitude: 13.4050, latitude: 52.5200, timezone: 'Europe/Berlin' },
  { name: '紐約', country: '美國', longitude: -74.0060, latitude: 40.7128, timezone: 'America/New_York' },
  { name: '洛杉磯', country: '美國', longitude: -118.2437, latitude: 34.0522, timezone: 'America/Los_Angeles' },
  { name: '舊金山', country: '美國', longitude: -122.4194, latitude: 37.7749, timezone: 'America/Los_Angeles' },
  { name: '芝加哥', country: '美國', longitude: -87.6298, latitude: 41.8781, timezone: 'America/Chicago' },
  { name: '溫哥華', country: '加拿大', longitude: -123.1207, latitude: 49.2827, timezone: 'America/Vancouver' },
  { name: '多倫多', country: '加拿大', longitude: -79.3832, latitude: 43.6532, timezone: 'America/Toronto' },
  { name: '雪梨', country: '澳洲', longitude: 151.2093, latitude: -33.8688, timezone: 'Australia/Sydney' },
  { name: '墨爾本', country: '澳洲', longitude: 144.9631, latitude: -37.8136, timezone: 'Australia/Melbourne' },
  { name: '奧克蘭', country: '紐西蘭', longitude: 174.7633, latitude: -36.8485, timezone: 'Pacific/Auckland' },
];

/**
 * 預設城市（台北市）
 */
export const DEFAULT_LOCATION: GeoLocation = DEFAULT_CITIES[0];
