import React from "react";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import { theme } from "@/styles/theme";

type LatLng = { latitude: number; longitude: number };

export default function MapPicker({
  height = 260,
  region,
  showsUserLocation,
  startCoord,
  endCoord,
  startTitle,
  endTitle,
  startDesc,
  endDesc,
  onPress,
}: {
  height?: number;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  startCoord?: LatLng | null;
  endCoord?: LatLng | null;
  startTitle?: string;
  endTitle?: string;
  startDesc?: string;
  endDesc?: string;
  onPress: (coord: LatLng) => void;
}) {
  const onMapPress = (e: MapPressEvent) => {
    onPress(e.nativeEvent.coordinate);
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        onPress={onMapPress}
        showsUserLocation={!!showsUserLocation}
        showsMyLocationButton={true}
      >
        {startCoord ? (
          <Marker coordinate={startCoord} title={startTitle ?? "Điểm đi"} description={startDesc ?? ""} />
        ) : null}

        {endCoord ? (
          <Marker coordinate={endCoord} title={endTitle ?? "Điểm đến"} description={endDesc ?? ""} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
});
