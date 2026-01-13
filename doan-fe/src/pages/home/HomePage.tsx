// ===== HomePage.tsx =====
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { Screen, AppText, Divider } from "@/components";
import { theme } from "@/styles/theme";

type LatLng = { lat: number; lng: number };
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type PlaceSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

const FALLBACK_REGION: Region = {
  latitude: 10.8231,
  longitude: 106.6297,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

async function ensureLocationPermission(): Promise<{
  ok: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === "web") return { ok: false, canAskAgain: true };

  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.status === Location.PermissionStatus.GRANTED)
    return { ok: true, canAskAgain: true };

  const req = await Location.requestForegroundPermissionsAsync();
  return {
    ok: req.status === Location.PermissionStatus.GRANTED,
    canAskAgain: !!req.canAskAgain,
  };
}

async function getMyLocation(): Promise<LatLng | null> {
  if (Platform.OS === "web") return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

function fmtLatLng(p: LatLng) {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

function isLatLngText(text: string): LatLng | null {
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
    const res = await Location.reverseGeocodeAsync({
      latitude: p.lat,
      longitude: p.lng,
    });
    const a = res?.[0];
    if (!a) return fmtLatLng(p);

    // ⚠️ expo-location type có district (không có subdistrict)
    const parts = [
      a.name,
      a.street,
      a.city,
      a.district,
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

/** =========================
 * Autocomplete (Nominatim OSM)
 * =========================
 * - free, không cần API key
 * - có rate-limit => debounce + limit
 */
async function fetchPlaceSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // ưu tiên Việt Nam: countrycodes=vn
  // limit ít để tránh spam
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `format=json&addressdetails=1&limit=6&countrycodes=vn&accept-language=vi&` +
    `q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      // Một số môi trường cần User-Agent/Referer; Expo thường ok.
      // Nếu gặp bị chặn, bạn sẽ cần proxy từ BE.
    },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as any[];
  return (data ?? [])
    .map((it) => ({
      id: String(it.place_id ?? `${it.lat}-${it.lon}`),
      label: String(it.display_name ?? "").trim(),
      lat: Number(it.lat),
      lng: Number(it.lon),
    }))
    .filter(
      (x) =>
        x.label &&
        Number.isFinite(x.lat) &&
        Number.isFinite(x.lng)
    );
}

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
      region={region}
      onPress={(e: any) => {
        const c = e?.nativeEvent?.coordinate;
        if (!c) return;
        onPick({ lat: c.latitude, lng: c.longitude });
      }}
    >
      {start ? (
        <Marker
          coordinate={{ latitude: start.lat, longitude: start.lng }}
          title="Start"
        />
      ) : null}
      {end ? (
        <Marker
          coordinate={{ latitude: end.lat, longitude: end.lng }}
          title="End"
        />
      ) : null}
    </MapView>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [locDenied, setLocDenied] = React.useState(false);

  const [startText, setStartText] = React.useState("");
  const [endText, setEndText] = React.useState("");

  const [start, setStart] = React.useState<LatLng | null>(null);
  const [end, setEnd] = React.useState<LatLng | null>(null);

  const [picking, setPicking] = React.useState<"start" | "end">("start");

  // focus input nào thì show suggestion của input đó
  const [focused, setFocused] = React.useState<"start" | "end" | null>(null);

  const [region, setRegion] = React.useState<Region>(FALLBACK_REGION);

  // suggestions state
  const [startSug, setStartSug] = React.useState<PlaceSuggestion[]>([]);
  const [endSug, setEndSug] = React.useState<PlaceSuggestion[]>([]);
  const [sugLoading, setSugLoading] = React.useState(false);

  const startTextDebounced = useDebouncedValue(startText, 500);
  const endTextDebounced = useDebouncedValue(endText, 500);

  // =========================
  // 1) Init: current location -> set start
  // =========================
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

        setRegion((prev) => ({
          ...prev,
          latitude: me.lat,
          longitude: me.lng,
        }));
        setStart(me);

        const addr = await reverseToText(me);
        setStartText(addr);
      } catch {}
    })();
  }, []);

  // =========================
  // 2) Typing -> update pins + region (forward geocode)
  // =========================
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

  // =========================
  // 3) Autocomplete suggestions (Nominatim)
  //    - only for the focused input
  // =========================
  React.useEffect(() => {
    if (Platform.OS === "web") return;

    const active = focused;
    const query = active === "start" ? startTextDebounced : active === "end" ? endTextDebounced : "";
    const trimmed = (query ?? "").trim();

    // nếu không focus hoặc text quá ngắn => clear
    if (!active || trimmed.length < 2) {
      if (active === "start") setStartSug([]);
      if (active === "end") setEndSug([]);
      setSugLoading(false);
      return;
    }

    const controller = new AbortController();
    setSugLoading(true);

    (async () => {
      try {
        const list = await fetchPlaceSuggestions(trimmed, controller.signal);

        // tránh gợi ý khi user nhập lat,lng
        if (isLatLngText(trimmed)) {
          if (active === "start") setStartSug([]);
          else setEndSug([]);
          return;
        }

        if (active === "start") setStartSug(list);
        else setEndSug(list);
      } catch {
        // ignore
      } finally {
        setSugLoading(false);
      }
    })();

    return () => controller.abort();
  }, [focused, startTextDebounced, endTextDebounced]);

  const onPickFromMap = React.useCallback(
    async (p: LatLng) => {
      setRegion((prev) => ({
        ...prev,
        latitude: p.lat,
        longitude: p.lng,
      }));

      if (picking === "start") {
        setStart(p);
        setStartText(await reverseToText(p));
        setStartSug([]);
      } else {
        setEnd(p);
        setEndText(await reverseToText(p));
        setEndSug([]);
      }
    },
    [picking]
  );

  const applySuggestion = async (which: "start" | "end", s: PlaceSuggestion) => {
    const p = { lat: s.lat, lng: s.lng };

    setRegion((prev) => ({
      ...prev,
      latitude: p.lat,
      longitude: p.lng,
    }));

    if (which === "start") {
      setPicking("start");
      setFocused(null);
      setStart(p);
      setStartText(s.label);
      setStartSug([]);
    } else {
      setPicking("end");
      setFocused(null);
      setEnd(p);
      setEndText(s.label);
      setEndSug([]);
    }
  };

const onSearch = () => {
  const s = startText.trim();
  const e = endText.trim();

  if (!s || !e) {
    return Alert.alert("Thiếu thông tin", "Vui lòng nhập đủ điểm đi và điểm đến.");
  }

  // ✅ nếu đã có pin start/end thì gửi kèm toạ độ
  const a_lat = start?.lat;
  const a_lng = start?.lng;
  const b_lat = end?.lat;
  const b_lng = end?.lng;

  router.push({
    pathname: "/(tabs)/routes",
    params: {
      start: s,
      end: e,
      ...(Number.isFinite(a_lat as any) ? { a_lat: String(a_lat) } : {}),
      ...(Number.isFinite(a_lng as any) ? { a_lng: String(a_lng) } : {}),
      ...(Number.isFinite(b_lat as any) ? { b_lat: String(b_lat) } : {}),
      ...(Number.isFinite(b_lng as any) ? { b_lng: String(b_lng) } : {}),
    },
  } as any);
};



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

  const showStartSug = focused === "start" && (startSug.length > 0 || sugLoading);
  const showEndSug = focused === "end" && (endSug.length > 0 || sugLoading);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText style={styles.h1}>Tiện Chuyến</AppText>
        <AppText style={styles.sub}>Chạm map hoặc nhập địa chỉ để chọn điểm</AppText>

        {locDenied ? (
          <AppText style={styles.locWarn}>
            Bạn đang tắt quyền Location. Vẫn nhập/chọn điểm được nhưng không tự định vị.
          </AppText>
        ) : null}
      </View>

      <View style={styles.mapWrap}>{MapBlock?.()}</View>

      <View style={styles.pickRow}>
        <Pressable
          onPress={() => setPicking("start")}
          style={[styles.pickBtn, picking === "start" && styles.pickBtnActive]}
        >
          <AppText style={[styles.pickText, picking === "start" && styles.pickTextActive]}>
            Chọn điểm đi
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setPicking("end")}
          style={[styles.pickBtn, picking === "end" && styles.pickBtnActive]}
        >
          <AppText style={[styles.pickText, picking === "end" && styles.pickTextActive]}>
            Chọn điểm đến
          </AppText>
        </Pressable>
      </View>

      <View style={styles.form}>
        <AppText style={styles.sectionTitle}>Điểm đi / Điểm đến</AppText>

        {/* ===== START INPUT + SUGGESTIONS ===== */}
        <View style={{ position: "relative" }}>
          <TextInput
            value={startText}
            onChangeText={(t) => {
              setStartText(t);
              setPicking("start");
            }}
            placeholder="Điểm đi (vd: Lệ Chi, Gia Lâm...)"
            style={styles.input}
            autoCapitalize="none"
            onFocus={() => {
              setFocused("start");
              setPicking("start");
            }}
            onBlur={() => {
              // delay nhỏ để kịp tap item trong dropdown
              setTimeout(() => setFocused((prev) => (prev === "start" ? null : prev)), 150);
            }}
          />

          {showStartSug ? (
            <View style={styles.sugBox}>
              {sugLoading && startSug.length === 0 ? (
                <AppText style={styles.sugHint}>Đang tìm gợi ý…</AppText>
              ) : null}

              <FlatList
                keyboardShouldPersistTaps="handled"
                data={startSug}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => applySuggestion("start", item)} style={styles.sugItem}>
                    <AppText numberOfLines={2} style={styles.sugText}>
                      {item.label}
                    </AppText>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.sugSep} />}
                style={{ maxHeight: 220 }}
              />
            </View>
          ) : null}
        </View>

        {/* ===== END INPUT + SUGGESTIONS ===== */}
        <View style={{ position: "relative" }}>
          <TextInput
            value={endText}
            onChangeText={(t) => {
              setEndText(t);
              setPicking("end");
            }}
            placeholder="Điểm đến (vd: Lệ Chi...)"
            style={styles.input}
            autoCapitalize="none"
            onFocus={() => {
              setFocused("end");
              setPicking("end");
            }}
            onBlur={() => {
              setTimeout(() => setFocused((prev) => (prev === "end" ? null : prev)), 150);
            }}
          />

          {showEndSug ? (
            <View style={styles.sugBox}>
              {sugLoading && endSug.length === 0 ? (
                <AppText style={styles.sugHint}>Đang tìm gợi ý…</AppText>
              ) : null}

              <FlatList
                keyboardShouldPersistTaps="handled"
                data={endSug}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => applySuggestion("end", item)} style={styles.sugItem}>
                    <AppText numberOfLines={2} style={styles.sugText}>
                      {item.label}
                    </AppText>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.sugSep} />}
                style={{ maxHeight: 220 }}
              />
            </View>
          ) : null}
        </View>

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

      <View style={{ height: 20 }} />
    </Screen>
  );
}

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

  webMapFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 14 },
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

  // suggestions dropdown
  sugBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  sugHint: { padding: 10, opacity: 0.7, fontWeight: "700" },
  sugItem: { paddingHorizontal: 12, paddingVertical: 10 },
  sugText: { fontSize: 13, fontWeight: "700", opacity: 0.9 },
  sugSep: { height: 1, backgroundColor: "#f3f4f6" },

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
