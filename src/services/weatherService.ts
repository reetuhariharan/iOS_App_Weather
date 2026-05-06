import { WeatherData, WeatherAlert } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function getWeatherData(lat: number, lon: number, unit: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
  const tempUnit = unit === 'metric' ? 'celsius' : 'fahrenheit';
  const windUnit = unit === 'metric' ? 'kmh' : 'mph';
  const precipUnit = 'mm';

  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather data');
  const data = await response.json();

  const weatherCodeMap: Record<number, { desc: string; icon: string }> = {
    0: { desc: 'Clear sky', icon: 'Sun' },
    1: { desc: 'Mainly clear', icon: 'CloudSun' },
    2: { desc: 'Partly cloudy', icon: 'CloudSun' },
    3: { desc: 'Overcast', icon: 'Cloud' },
    45: { desc: 'Fog', icon: 'CloudFog' },
    48: { desc: 'Depositing rime fog', icon: 'CloudFog' },
    51: { desc: 'Light drizzle', icon: 'CloudDrizzle' },
    61: { desc: 'Slight rain', icon: 'CloudRain' },
    63: { desc: 'Moderate rain', icon: 'CloudRain' },
    65: { desc: 'Heavy rain', icon: 'CloudRain' },
    71: { desc: 'Slight snow', icon: 'CloudSnow' },
    95: { desc: 'Thunderstorm', icon: 'CloudLightning' },
    // Simplified for now
  };

  const currentCode = weatherCodeMap[data.current.weather_code] || { desc: 'Unknown', icon: 'Cloud' };

  // Simulate alerts based on forecast
  const alerts: WeatherAlert[] = [];
  if (data.current.wind_speed_10m > 50) {
    alerts.push({
      id: 'wind-alert',
      title: 'High Wind Alert',
      description: `Winds of ${data.current.wind_speed_10m} ${windUnit} detected. Stay indoors.`,
      severity: 'severe',
      time: new Date().toISOString()
    });
  }
  if (data.daily.precipitation_probability_max[0] > 80) {
     alerts.push({
      id: 'rain-alert',
      title: 'Heavy Rain Forecast',
      description: 'High probability of heavy precipitation today.',
      severity: 'moderate',
      time: new Date().toISOString()
    });
  }

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      description: currentCode.desc,
      icon: currentCode.icon,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      precipProb: data.daily.precipitation_probability_max[0],
      isDay: data.current.is_day === 1,
    },
    hourly: data.hourly.time.slice(0, 24).map((time: string, i: number) => ({
      time,
      temp: Math.round(data.hourly.temperature_2m[i]),
      icon: (weatherCodeMap[data.hourly.weather_code[i]] || { icon: 'Cloud' }).icon,
      precipProb: data.hourly.precipitation_probability[i],
    })),
    daily: data.daily.time.slice(0, 5).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      icon: (weatherCodeMap[data.daily.weather_code[i]] || { icon: 'Cloud' }).icon,
      precipProb: data.daily.precipitation_probability_max[i],
    })),
    alerts,
  };
}

export async function searchLocations(query: string) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.results || [];
}

export async function getCityFromCoords(lat: number, lon: number) {
  // Use Nominatim for reverse geocoding
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!response.ok) return 'Unknown Location';
  const data = await response.json();
  return data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown Location';
}
