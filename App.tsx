import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { Search, MapPin, Star, Sun, Wind, Droplets, Bell, AlertTriangle } from 'lucide-react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

import { getWeatherData, searchLocations, getCityFromCoords } from './src/services/weatherService';
import { WeatherData, FavoriteLocation, UserPreferences } from './src/types';
import { WeatherIcon } from './src/components/WeatherIcon';
import RadarMap from './src/components/RadarMap';

export default function App() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState({ lat: 51.5074, lon: -0.1278, name: 'London' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({ unit: 'metric', alertThreshold: 'moderate' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'forecast' | 'radar'>('forecast');

  useEffect(() => {
    AsyncStorage.getItem('nimbus_favorites').then(res => res && setFavorites(JSON.parse(res)));
    AsyncStorage.getItem('nimbus_prefs').then(res => res && setPrefs(JSON.parse(res)));
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setIsLoading(true);
    try {
      const weather = await getWeatherData(lat, lon, prefs.unit);
      setData(weather);
      setLocation({ lat, lon, name });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setIsLoading(false);
    }
  }, [prefs.unit]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          fetchWeather(location.lat, location.lon, location.name);
          return;
        }

        let pos = await Location.getCurrentPositionAsync({});
        const name = await getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
        fetchWeather(pos.coords.latitude, pos.coords.longitude, name);
      } catch (e) {
        console.warn('Location fetching failed/timed out, falling back', e);
        fetchWeather(location.lat, location.lon, location.name);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('nimbus_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    AsyncStorage.setItem('nimbus_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    const results = await searchLocations(searchQuery);
    setSearchResults(results);
  };

  const addFavorite = () => {
    const isFav = favorites.some(f => f.lat === location.lat && f.lon === location.lon);
    if (isFav) {
      setFavorites(favorites.filter(f => f.lat !== location.lat || f.lon !== location.lon));
    } else {
      setFavorites([...favorites, { 
        id: Math.random().toString(36).substring(2, 9),
        name: location.name,
        lat: location.lat,
        lon: location.lon
      }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}><Sun color="#f97316" size={24} /> Nimbus</Text>
            <Text style={styles.subtitle}>Precision weather forecasting</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search color="#94a3b8" size={20} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search city..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((res: any) => (
              <TouchableOpacity 
                key={res.id} 
                style={styles.searchResultItem}
                onPress={() => {
                  fetchWeather(res.latitude, res.longitude, res.name);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text style={styles.searchResultName}>{res.name}</Text>
                <Text style={styles.searchResultCountry}>{res.admin1 || res.country}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && !data ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
        ) : data && (
          <>
            {/* Current Weather Card */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <View style={styles.locationRow}>
                  <MapPin color="#bfdbfe" size={16} />
                  <Text style={styles.locationName}>{location.name}</Text>
                  <TouchableOpacity onPress={addFavorite} style={styles.favBtn}>
                    <Star 
                      color={favorites.some(f => f.lat === location.lat && f.lon === location.lon) ? "#facc15" : "#94a3b8"} 
                      fill={favorites.some(f => f.lat === location.lat && f.lon === location.lon) ? "#facc15" : "transparent"} 
                      size={18} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.temp}>{data.current.temp}°{prefs.unit === 'metric' ? 'C' : 'F'}</Text>
              
              <View style={styles.descRow}>
                <WeatherIcon name={data.current.icon} color="#bfdbfe" size={24} />
                <Text style={styles.descText}>{data.current.description}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Wind color="#bfdbfe" size={16} />
                  <View style={styles.statTextGroup}>
                    <Text style={styles.statLabel}>Wind</Text>
                    <Text style={styles.statValue}>{data.current.windSpeed} {prefs.unit === 'metric' ? 'km/h' : 'mph'}</Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Droplets color="#bfdbfe" size={16} />
                  <View style={styles.statTextGroup}>
                    <Text style={styles.statLabel}>Humidity</Text>
                    <Text style={styles.statValue}>{data.current.humidity}%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Alerts */}
            {data.alerts.map(alert => (
              <View key={alert.id} style={styles.alertCard}>
                <AlertTriangle color="#ef4444" size={24} />
                <View style={styles.alertTextGroup}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDesc}>{alert.description}</Text>
                </View>
              </View>
            ))}

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'forecast' && styles.tabBtnActive]}
                onPress={() => setActiveTab('forecast')}
              >
                <Text style={[styles.tabText, activeTab === 'forecast' && styles.tabTextActive]}>FORECAST</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'radar' && styles.tabBtnActive]}
                onPress={() => setActiveTab('radar')}
              >
                <Text style={[styles.tabText, activeTab === 'radar' && styles.tabTextActive]}>RADAR</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'forecast' && (
              <>
                {/* Hourly Forecast */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
                    {data.hourly.map((hour, i) => (
                      <View key={i} style={styles.hourlyItem}>
                        <Text style={styles.hourlyTime}>{format(new Date(hour.time), 'HH:mm')}</Text>
                        <WeatherIcon name={hour.icon} size={24} color="#3b82f6" />
                        <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
                        <View style={styles.precipRow}>
                          <Droplets color="#60a5fa" size={10} />
                          <Text style={styles.precipText}>{hour.precipProb}%</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* 5-Day Forecast */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>5-Day Forecast</Text>
                  {data.daily.map((day, i) => (
                    <View key={i} style={styles.dailyRow}>
                      <Text style={styles.dailyDay}>{i === 0 ? 'Today' : format(new Date(day.date), 'EEE')}</Text>
                      <View style={styles.dailyMid}>
                        <WeatherIcon name={day.icon} size={20} color="#3b82f6" />
                        <View style={styles.precipRow}>
                          <Droplets color="#60a5fa" size={12} />
                          <Text style={styles.precipText}>{day.precipProb}%</Text>
                        </View>
                      </View>
                      <View style={styles.dailyTemps}>
                        <Text style={styles.dailyMax}>{day.maxTemp}°</Text>
                        <Text style={styles.dailyMin}>{day.minTemp}°</Text>
                      </View>
                    </View>
                  ))}
                </View>
                
                {/* Favorites List */}
                <View style={styles.sectionCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                     <Text style={styles.sectionTitle}>Favorites</Text>
                     <Star color="#facc15" size={16} fill="#facc15" />
                  </View>
                  {favorites.length === 0 ? (
                    <Text style={styles.dailyDay}>No favorites yet. Add one!</Text>
                  ) : (
                    favorites.map(fav => (
                      <TouchableOpacity 
                        key={fav.id} 
                        style={styles.favItem}
                        onPress={() => fetchWeather(fav.lat, fav.lon, fav.name)}
                      >
                        <Text style={styles.favItemName}>{fav.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}

            {activeTab === 'radar' && (
              <View style={styles.sectionCard}>
                <RadarMap lat={location.lat} lon={location.lon} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    flexDirection: 'row',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#f8fafc',
  },
  searchResults: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  searchResultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchResultName: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  searchResultCountry: {
    color: '#94a3b8',
    fontSize: 12,
  },
  mainCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 30,
    padding: 25,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationName: {
    color: '#bfdbfe',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 5,
  },
  favBtn: {
    marginLeft: 10,
    padding: 5,
  },
  temp: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  descText: {
    color: '#bfdbfe',
    fontSize: 18,
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTextGroup: {
    marginLeft: 10,
  },
  statLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTextGroup: {
    marginLeft: 15,
    flex: 1,
  },
  alertTitle: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alertDesc: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#334155',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#60a5fa',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  hourlyScroll: {
    flexDirection: 'row',
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  hourlyTime: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  hourlyTemp: {
    color: '#f8fafc',
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
  },
  precipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precipText: {
    color: '#60a5fa',
    fontSize: 10,
    marginLeft: 4,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dailyDay: {
    color: '#94a3b8',
    width: 60,
    fontWeight: '500',
  },
  dailyMid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  dailyTemps: {
    flexDirection: 'row',
    gap: 15,
    width: 70,
    justifyContent: 'flex-end',
  },
  dailyMax: {
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  dailyMin: {
    color: '#64748b',
  },
  favItem: {
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  favItemName: {
    color: '#f8fafc',
    fontWeight: '600',
  }
});
