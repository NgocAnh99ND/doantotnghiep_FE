// ===== HomePage.tsx =====
import React from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { Screen, AppText, Divider } from "@/components";
import { theme } from "@/styles/theme";

type LatLng = { lat: number; lng: number };
type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

const FALLBACK_REGION: Region = {
  latitude: 10.8231,
  longitude: 106.6297,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ========= Permission + helpers =========
async function ensureLocationPermission(): Promise<{ ok: boolean; canAskAgain: boolean }> {
  if (Platform.OS === "web") return { ok: false, canAskAgain: true };

  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.status === Location.PermissionStatus.GRANTED) return { ok: true, canAskAgain: true };

  const req = await Location.requestForegroundPermissionsAsync();
  return { ok: req.status === Location.PermissionStatus.GRANTED, canAskAgain: !!req.canAskAgain };
}

async function getMyLocation(): Promise<LatLng | null> {
  if (Platform.OS === "web") return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

function fmtLatLng(p: LatLng) {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

function isLatLngText(text: string): LatLng | null {
  // hỗ trợ "10.123, 106.456" hoặc "10.123 106.456"
  const t = (text || "").trim();
  const m = t.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

async function reverseToText(p: LatLng): Promise<string> {
  if (Platform.OS === "web") return fmtLatLng(p);

  try {
    const res = await Location.reverseGeocodeAsync({ latitude: p.lat, longitude: p.lng });
    const a = res?.[0];
    if (!a) return fmtLatLng(p);

    // expo-location type có district, subregion... (KHÔNG có subdistrict)
    const parts = [
      a.name,
      a.street,
      a.city,
      a.district, // ✅ đúng type
      a.region,
      a.country,
    ].filter(Boolean);

    const text = parts.join(", ").replace(/\s+/g, " ").trim();
    return text || fmtLatLng(p);
  } catch {
    return fmtLatLng(p);
  }
}

async function forwardGeocode(text: string): Promise<LatLng | null> {
  if (Platform.OS === "web") return null;
  const q = (text || "").trim();
  if (!q) return null;

  // nếu user nhập lat,lng thì parse nhanh
  const parsed = isLatLngText(q);
  if (parsed) return parsed;

  try {
    const res = await Location.geocodeAsync(q);
    const first = res?.[0];
    if (!first) return null;
    return { lat: first.latitude, lng: first.longitude };
  } catch {
    return null;
  }
}

function useDebouncedValue<T>(value: T, ms: number) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

// ========= Native Map (dynamic import to avoid web crash) =========
function NativeMap({
  region,
  start,
  end,
  onPick,
}: {
  region: Region;
  start: LatLng | null;
  end: LatLng | null;
  onPick: (p: LatLng) => void;
}) {
  const Maps = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-maps") as typeof import("react-native-maps");
  }, []);

  const MapView = Maps.default;
  const Marker = Maps.Marker;

  return (
    <MapView
      style={{ flex: 1 }}
      region={region} // ✅ dùng region để map nhảy theo state
      onPress={(e: any) => {
        const c = e?.nativeEvent?.coordinate;
        if (!c) return;
        onPick({ lat: c.latitude, lng: c.longitude });
      }}
    >
      {start ? <Marker coordinate={{ latitude: start.lat, longitude: start.lng }} title="Start" /> : null}
      {end ? <Marker coordinate={{ latitude: end.lat, longitude: end.lng }} title="End" /> : null}
    </MapView>
  );
}

// ========= Page =========
export default function HomePage() {
  const router = useRouter();

  const [locDenied, setLocDenied] = React.useState(false);

  // Input text: gõ tay được
  const [startText, setStartText] = React.useState("");
  const [endText, setEndText] = React.useState("");

  // Toạ độ (khi chọn map / geocode)
  const [start, setStart] = React.useState<LatLng | null>(null);
  const [end, setEnd] = React.useState<LatLng | null>(null);

  const [picking, setPicking] = React.useState<"start" | "end">("start");

  // Map region
  const [region, setRegion] = React.useState<Region>(FALLBACK_REGION);

  // Debounce input để geocode
  const startTextDebounced = useDebouncedValue(startText, 800);
  const endTextDebounced = useDebouncedValue(endText, 800);

  // ===== 1) xin quyền + lấy vị trí hiện tại -> center map + fill start input =====
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;

      const perm = await ensureLocationPermission();
      if (!perm.ok) {
        setLocDenied(true);
        if (!perm.canAskAgain) {
          Alert.alert(
            "Cần bật quyền vị trí",
            "Bạn đã tắt quyền Location. Hãy vào Cài đặt để bật lại.",
            [
              { text: "Huỷ", style: "cancel" },
              { text: "Mở Cài đặt", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return;
      }

      setLocDenied(false);

      try {
        const me = await getMyLocation();
        if (!me) return;

        // ✅ center map đúng vị trí hiện tại
        setRegion((prev) => ({
          ...prev,
          latitude: me.lat,
          longitude: me.lng,
        }));

        // ✅ default: điểm đi = vị trí hiện tại
        setStart(me);

        // ✅ reverse geocode để ra địa chỉ (nếu fail thì fallback lat,lng)
        const addr = await reverseToText(me);
        setStartText(addr);
      } catch {
        // ignore
      }
    })();
  }, []);

  // ===== 2) user gõ startText -> geocode -> update start coord + map center =====
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;
      const q = startTextDebounced.trim();
      if (!q) return;

      const p = await forwardGeocode(q);
      if (!p) return;

      setStart(p);
      setRegion((prev) => ({
        ...prev,
        latitude: p.lat,
        longitude: p.lng,
      }));
    })();
  }, [startTextDebounced]);

  // ===== 3) user gõ endText -> geocode -> update end coord + map center =====
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;
      const q = endTextDebounced.trim();
      if (!q) return;

      const p = await forwardGeocode(q);
      if (!p) return;

      setEnd(p);
      setRegion((prev) => ({
        ...prev,
        latitude: p.lat,
        longitude: p.lng,
      }));
    })();
  }, [endTextDebounced]);

  // ===== 4) chạm map chọn điểm -> update input (reverse) + update region =====
  const onPickFromMap = React.useCallback(
    async (p: LatLng) => {
      setRegion((prev) => ({
        ...prev,
        latitude: p.lat,
        longitude: p.lng,
      }));

      if (picking === "start") {
        setStart(p);
        const text = await reverseToText(p);
        setStartText(text);
      } else {
        setEnd(p);
        const text = await reverseToText(p);
        setEndText(text);
      }
    },
    [picking]
  );

  const onSearch = () => {
    const s = startText.trim();
    const e = endText.trim();

    if (!s || !e) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đủ điểm đi và điểm đến.");
      return;
    }

    router.push({
      pathname: "/(tabs)/routes",
      params: { start: s, end: e },
    } as any);
  };

  // ===== Map block: native vs web fallback =====
  const MapBlock = Platform.select({
    web: () => (
      <View style={styles.webMapFallback}>
        <AppText style={styles.webMapTitle}>Map (Web fallback)</AppText>
        <AppText style={styles.webMapSub}>Web không hỗ trợ react-native-maps.</AppText>
        <View style={{ height: 10 }} />
        <AppText style={styles.webMapCoord}>Start: {start ? fmtLatLng(start) : "-"}</AppText>
        <AppText style={styles.webMapCoord}>End: {end ? fmtLatLng(end) : "-"}</AppText>
      </View>
    ),
    default: () => <NativeMap region={region} start={start} end={end} onPick={onPickFromMap} />,
  });

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Tiện Chuyến</AppText>
        <AppText style={styles.sub}>Chạm map hoặc nhập địa chỉ để chọn điểm</AppText>

        {locDenied ? (
          <AppText style={styles.locWarn}>
            Bạn đang tắt quyền Location. Vẫn nhập/chọn điểm được nhưng không tự định vị.
          </AppText>
        ) : null}
      </View>

      {/* MAP */}
      <View style={styles.mapWrap}>{MapBlock?.()}</View>

      {/* PICK MODE */}
      <View style={styles.pickRow}>
        <Pressable
          onPress={() => setPicking("start")}
          style={[styles.pickBtn, picking === "start" ? styles.pickBtnActive : null]}
        >
          <AppText style={[styles.pickText, picking === "start" ? styles.pickTextActive : null]}>
            Chọn điểm đi
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setPicking("end")}
          style={[styles.pickBtn, picking === "end" ? styles.pickBtnActive : null]}
        >
          <AppText style={[styles.pickText, picking === "end" ? styles.pickTextActive : null]}>
            Chọn điểm đến
          </AppText>
        </Pressable>
      </View>

      {/* INPUTS (gõ tay được) */}
      <View style={styles.form}>
        <AppText style={styles.sectionTitle}>Điểm đi / Điểm đến</AppText>

        <TextInput
          value={startText}
          onChangeText={setStartText}
          placeholder="Điểm đi (địa chỉ hoặc lat,lng)"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={endText}
          onChangeText={setEndText}
          placeholder="Điểm đến (địa chỉ hoặc lat,lng)"
          style={styles.input}
          autoCapitalize="none"
        />

        <Pressable
          onPress={onSearch}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          disabled={!startText.trim() || !endText.trim()}
        >
          <AppText style={styles.primaryBtnText}>Tìm tuyến</AppText>
        </Pressable>
      </View>

      <Divider />

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Gợi ý nhanh</AppText>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Tuyến gần bạn</AppText>
          </View>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Giá tốt</AppText>
          </View>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Giờ khởi hành sớm</AppText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Hoạt động gần đây</AppText>
        <View style={styles.listItem}>
          <AppText style={styles.listTitle}>Bạn chưa có hoạt động</AppText>
          <AppText style={styles.listSub}>Tạo yêu cầu hoặc tìm tuyến để bắt đầu.</AppText>
        </View>
      </View>
    </Screen>
  );
}

// ========= styles =========
const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: "700" },
  sub: { fontSize: 14, opacity: 0.7 },

  locWarn: { marginTop: 6, color: "crimson", fontWeight: "700" },

  mapWrap: {
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  webMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  webMapTitle: { fontSize: 18, fontWeight: "900" },
  webMapSub: { marginTop: 6, opacity: 0.7, textAlign: "center" },
  webMapCoord: { marginTop: 4, fontWeight: "800" },

  pickRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  pickBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: "center",
  },
  pickBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pickText: { fontWeight: "800", color: theme.colors.text },
  pickTextActive: { color: theme.colors.primaryText },

  form: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    gap: 10,
  },
  section: { marginTop: 14, gap: 10 },
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

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: { fontSize: 12, opacity: 0.8 },

  listItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  listTitle: { fontSize: 14, fontWeight: "700" },
  listSub: { fontSize: 13, opacity: 0.7, marginTop: 4 },
});
