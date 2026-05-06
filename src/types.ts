export interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    precipProb: number;
    isDay: boolean;
  };
  hourly: {
    time: string;
    temp: number;
    icon: string;
    precipProb: number;
  }[];
  daily: {
    date: string;
    maxTemp: number;
    minTemp: number;
    icon: string;
    precipProb: number;
  }[];
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'moderate' | 'severe' | 'extreme';
  time: string;
}

export interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface UserPreferences {
  unit: 'metric' | 'imperial';
  alertThreshold: 'moderate' | 'severe' | 'extreme';
}
