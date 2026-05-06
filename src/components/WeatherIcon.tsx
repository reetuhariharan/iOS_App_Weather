import React from 'react';
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudDrizzle, 
  CloudFog, 
  CloudSnow, 
  CloudLightning,
  Wind,
  Droplets
} from 'lucide-react-native';

const icons = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets
};

export function WeatherIcon({ name, size = 24, color = "#3b82f6" }: { name: string; size?: number; color?: string }) {
  const Icon = icons[name as keyof typeof icons] || Cloud;
  return <Icon size={size} color={color} />;
}
