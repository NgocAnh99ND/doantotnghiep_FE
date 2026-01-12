import React from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Screen, AppText, Divider } from "@/components";
import { theme } from "@/styles/theme";
import MapPicker from "@/components/map/MapPicker.native"; // ✅ để chắc chắn web không kéo native
// Nếu bạn muốn import “chuẩn” 1 dòng cho cả 2:
// import MapPicker from "@/components/map/MapPicker"; 
// (giữ đúng cấu trúc file như mình đưa)

type LatLng = { latitude: number; longitude: number };

function buildAddressText(place?: Location.LocationGeocodedAddress | null) {
  if (!place) return "";
  return [place.name, place.street, place.district, place.city, place.region]
    .filter(Boolean)
    .join(", ");
}

export default function HomePage() {
  const router = useRouter();

  const [startLocation, setStartLocation] = React.useState("");
  const [endLocation, setEndLocation] = React.useState("");

  const [startCoord, setStartCoord] = React.useState<LatLng | null>(null);
  const [endCoord, setEndCoord] = React.useState<LatLng | null>(null);

  const [selecting, setSelecting] = React.useState<"start" | "end">("start");
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  const [region, setRegion] = React.useState({
    latitude: 10.8231,
    longitude: 106.6297,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const ok = status === "granted";
        setHasPermission(ok);

        if (!ok) return;

        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setRegion((prev) => ({
          ...prev,
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
        }));
      } catch (e: any) {
        setHasPermission(false);
        console.log("Location permission error:", e?.message ?? e);
      }
    })();
  }, []);

  const onPickCoord = React.useCallback(
    async ({ latitude, longitude }: LatLng) => {
      try {
        const res = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = res?.[0] ?? null;
        const text =
          buildAddressText(place) ||
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        if (selecting === "start") {
          setStartCoord({ latitude, longitude });
          setStartLocation(text);
        } else {
          setEndCoord({ latitude, longitude });
          setEndLocation(text);
        }
      } catch (err: any) {
        const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        if (selecting === "start") {
          setStartCoord({ latitude, longitude });
          setStartLocation(fallback);
        } else {
          setEndCoord({ latitude, longitude });
          setEndLocation(fallback);
        }
      }
    },
    [selecting]
  );

  const onSearch = () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn đủ điểm đi và điểm đến.");
      return;
    }

    router.push({
      pathname: "/(tabs)/routes",
      params: {
        start: startLocation.trim(),
        end: endLocation.trim(),
      },
    } as any);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Tiện Chuyến</AppText>
        <AppText style={styles.sub}>
          Chạm lên bản đồ để chọn điểm {selecting === "start" ? "đi" : "đến"}
        </AppText>

        {hasPermission === false ? (
          <AppText style={styles.warn}>
            Bạn đang tắt quyền Location. Vẫn chọn điểm được nhưng không tự định vị.
          </AppText>
        ) : null}
      </View>

      {/* MAP */}
      <MapPicker
        height={260}
        region={region}
        showsUserLocation={hasPermission === true}
        startCoord={startCoord}
        endCoord={endCoord}
        startTitle="Điểm đi"
        endTitle="Điểm đến"
        startDesc={startLocation}
        endDesc={endLocation}
        onPress={onPickCoord}
      />

      {/* INPUTS */}
      <View style={styles.form}>
        <AppText style={styles.sectionTitle}>Điểm đi / Điểm đến</AppText>

        <View style={styles.pickerRow}>
          <Pressable
            onPress={() => setSelecting("start")}
            style={[styles.pickBtn, selecting === "start" && styles.pickBtnActive]}
          >
            <AppText style={[styles.pickText, selecting === "start" && styles.pickTextActive]}>
              Chọn điểm đi
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setSelecting("end")}
            style={[styles.pickBtn, selecting === "end" && styles.pickBtnActive]}
          >
            <AppText style={[styles.pickText, selecting === "end" && styles.pickTextActive]}>
              Chọn điểm đến
            </AppText>
          </Pressable>
        </View>

        <TextInput
          value={startLocation}
          onChangeText={setStartLocation}
          placeholder="Điểm đi (start_location)"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={endLocation}
          onChangeText={setEndLocation}
          placeholder="Điểm đến (end_location)"
          style={styles.input}
          autoCapitalize="none"
        />

        <Pressable
          onPress={onSearch}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          disabled={!startLocation.trim() || !endLocation.trim()}
        >
          <AppText style={styles.primaryBtnText}>Tìm tuyến</AppText>
        </Pressable>
      </View>

      <Divider />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: "700" },
  sub: { fontSize: 14, opacity: 0.7 },
  warn: { marginTop: 6, fontSize: 13, color: "crimson" },

  form: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    gap: 10,
  },

  pickerRow: { flexDirection: "row", gap: 10 },
  pickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    backgroundColor: theme.colors.card,
  },
  pickBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  pickText: { fontWeight: "800", color: theme.colors.text, opacity: 0.8 },
  pickTextActive: { color: theme.colors.primaryText, opacity: 1 },

  sectionTitle: { fontSize: 16, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  primaryBtn: {
    marginTop: 2,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    backgroundColor: "#111",
  },
  primaryBtnText: { fontWeight: "800", color: "#fff" },
});
