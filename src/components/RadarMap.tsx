import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';

export default function RadarMap({ lat, lon }: { lat: number; lon: number }) {
  const [radarTimestamp, setRadarTimestamp] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        const lastTimestamp = data.radar.past[data.radar.past.length - 1].time;
        setRadarTimestamp(lastTimestamp);
      })
      .catch(err => console.error('Failed to fetch radar data', err));
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 2,
          longitudeDelta: 2,
        }}
        mapType="standard"
      >
        {radarTimestamp && (
          <UrlTile
            urlTemplate={`https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`}
            maximumZ={19}
            flipY={false}
            opacity={0.6}
          />
        )}
      </MapView>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Live Radar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 250, width: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  badge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' }
});
