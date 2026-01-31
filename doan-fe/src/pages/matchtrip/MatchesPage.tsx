import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { useAuth } from "@/store/authStore";
import { AppText, Divider, Screen, Loading } from "@/components";
import { routeApi } from "@/api/route";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import {
  useFetchAcceptedMatchesByDriver,
  useFetchFinishedMatchesByDriver,
} from "@/api/matchtrip/useFetch";
import { useFocusEffect } from "expo-router";

// ✅ NEW: driver api
import { driverApi } from "@/api/driver";

// ✅ review api
import { reviewApi } from "@/api/review";

// ✅ map + location
import * as Location from "expo-location";

/** =========================
 * Helpers
 ========================= */
function formatWithDots(rawDigits: string) {
  if (!rawDigits) return "";
  const digits = rawDigits.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function toDigits(text: string) {
  return (text ?? "").replace(/\D/g, "");
}

/** =========================
 * Map helpers (copy from HomePage)
 ========================= */
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

// ✅ Base URL cho API backend
const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://192.168.0.100:8080";

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
 * ========================= */
async function fetchPlaceSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `format=json&addressdetails=1&limit=6&countrycodes=vn&accept-language=vi&` +
    `q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
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
    .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lng));
}

function NativeMap({
  region,
  start,
  end,
  onPick,
  routeLine,
}: {
  region: Region;
  start: LatLng | null;
  end: LatLng | null;
  onPick: (p: LatLng) => void;
  routeLine: { latitude: number; longitude: number }[];
}) {
  const Maps = React.useMemo(() => {
    return require("react-native-maps") as typeof import("react-native-maps");
  }, []);

  const MapView = Maps.default;
  const Marker = Maps.Marker;
  const Polyline = Maps.Polyline;

  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!mapRef.current) return;
    if (!routeLine || routeLine.length < 2) return;

    mapRef.current.fitToCoordinates(routeLine, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  }, [routeLine]);

  return (
    <MapView
      ref={mapRef}
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

      {/* ✅ Line xanh chỉ đường A→B */}
      {routeLine.length >= 2 ? (
        <>
          <Polyline coordinates={routeLine} strokeWidth={8} strokeColor="#FFFFFF" />
          <Polyline coordinates={routeLine} strokeWidth={5} strokeColor="#1E88E5" />
        </>
      ) : null}
    </MapView>
  );
}

/** =========================
 * Page
 ========================= */
export default function MatchesPage() {
  const { status, user } = useAuth();

  if (status === "loading") return <Loading />;

  if (!user) {
    return (
      <Screen>
        <AppText>Bạn chưa đăng nhập.</AppText>
      </Screen>
    );
  }

  if (user.role === "PASSENGER") {
    const passengerId = user.passenger_id ?? null;
    if (!passengerId) {
      return (
        <Screen>
          <AppText>Thiếu passenger_id. Vui lòng đăng xuất và đăng nhập lại.</AppText>
        </Screen>
      );
    }
    return <PassengerMatchesView passengerId={passengerId} />;
  }

  return <DriverMatchesView driverId={user.user_id} />;
}

/** =========================
 * Passenger View
 * ✅ Enrich match list: match -> route(detail) -> driver(detail)
 * ✅ Review Modal + KeyboardAvoidingView (fix keyboard che popup)
 * ========================= */
function PassengerMatchesView({ passengerId }: { passengerId: number }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // cache để tránh gọi API lặp
  const routeCacheRef = React.useRef<Map<number, any>>(new Map());
  const driverCacheRef = React.useRef<Map<number, any>>(new Map());

  // ===== Review Modal State =====
  const [reviewVisible, setReviewVisible] = React.useState(false);
  const [reviewMatch, setReviewMatch] = React.useState<any | null>(null);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Local set để tránh hỏi đánh giá lại (tạm thời phía FE)
  const reviewedSetRef = React.useRef<Set<number>>(new Set());

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) lấy list match (có route_id)
      const list = await matchTripApi.fetchByPassenger(passengerId);

      // 2) enrich: lấy route detail + driver detail
      const enriched = await Promise.all(
        (list ?? []).map(async (m: any) => {
          const routeId = Number(m?.route_id);
          let route: any = null;

          if (Number.isFinite(routeId)) {
            if (routeCacheRef.current.has(routeId)) {
              route = routeCacheRef.current.get(routeId);
            } else {
              route = await routeApi.fetchDetail(routeId);
              routeCacheRef.current.set(routeId, route);
            }
          }

          const driverId = Number(route?.driver_id);
          let driver: any = null;

          if (Number.isFinite(driverId)) {
            if (driverCacheRef.current.has(driverId)) {
              driver = driverCacheRef.current.get(driverId);
            } else {
              driver = await driverApi.fetchDetail(driverId);
              driverCacheRef.current.set(driverId, driver);
            }
          }

          return { ...m, route, driver };
        })
      );

      setData(enriched);
    } catch (e: any) {
      setData([]);
      setError(e?.message ?? "Không tải được matches");
    } finally {
      setLoading(false);
    }
  }, [passengerId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  // ✅ quay lại tab matches sẽ tự refresh
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const openReview = (item: any) => {
    const matchId = Number(item?.match_id);
    if (!Number.isFinite(matchId)) return;

    if (reviewedSetRef.current.has(matchId)) {
      Alert.alert("Thông báo", "Bạn đã đánh giá chuyến này rồi.");
      return;
    }

    // chỉ cho đánh giá khi FINISHED
    if (String(item?.match_trip_status).toUpperCase() !== "FINISHED") {
      Alert.alert(
        "Chưa thể đánh giá",
        "Chỉ đánh giá sau khi chuyến đã kết thúc (FINISHED)."
      );
      return;
    }

    setReviewMatch(item);
    setRating(5);
    setComment("");
    setReviewVisible(true);
  };

  const closeReview = () => {
    setReviewVisible(false);
    setReviewMatch(null);
    setRating(5);
    setComment("");
  };

  const submitReview = async () => {
    try {
      if (!reviewMatch) return;

      const matchId = Number(reviewMatch.match_id);
      const driverId = Number(reviewMatch?.route?.driver_id);

      if (!Number.isFinite(matchId) || !Number.isFinite(driverId)) {
        Alert.alert("Lỗi", "Thiếu match_id hoặc driver_id");
        return;
      }
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        Alert.alert("Lỗi", "Rating phải từ 1 đến 5");
        return;
      }

      setSubmitting(true);

      await reviewApi.create({
        match_id: matchId,
        user_id: driverId, // theo BE: review.user_id = người được đánh giá (tài xế)
        rating,
        comment: (comment ?? "").trim(),
      });

      reviewedSetRef.current.add(matchId);
      Alert.alert("Thành công", "Đã gửi đánh giá");
      closeReview();

      // optional: refresh để update UI
      await refetch();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 6, paddingBottom: 8 }}>
        <AppText style={{ fontSize: 20, fontWeight: "800" }}>
          Matches (Passenger)
        </AppText>
      </View>

      <Divider />

      {loading ? <Loading /> : null}
      {error ? (
        <AppText style={{ marginTop: 10, color: "crimson" }}>{error}</AppText>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(it: any) => String(it.match_id)}
        refreshing={loading}
        onRefresh={refetch}
        contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? <AppText>Chưa có match nào.</AppText> : null
        }
        renderItem={({ item }: any) => {
          const r = item.route;
          const d = item.driver;

          const status = String(item.match_trip_status || "").toUpperCase();
          const canReview =
            status === "FINISHED" &&
            !reviewedSetRef.current.has(Number(item.match_id));

          return (
            <View style={stylesP.card}>
              <AppText style={stylesP.cardTitle}>Match #{item.match_id}</AppText>

              <AppText style={stylesP.line}>
                Tài xế: {d?.user_name ?? "-"}
              </AppText>
              <AppText style={stylesP.line}>SĐT: {d?.phone ?? "-"}</AppText>
              <AppText style={stylesP.line}>Rating: {d?.rating ?? "-"}</AppText>

              <AppText style={stylesP.line}>
                Tuyến: {r?.start_location ?? "-"} → {r?.end_location ?? "-"}
              </AppText>
              <AppText style={stylesP.line}>Thời gian: {r?.time ?? "-"}</AppText>

              <AppText style={stylesP.badge}>
                Status: {item.match_trip_status}
              </AppText>

              {canReview ? (
                <Pressable
                  style={stylesP.reviewBtn}
                  onPress={() => openReview(item)}
                >
                  <AppText style={stylesP.reviewText}>Đánh giá tài xế</AppText>
                </Pressable>
              ) : null}

              {!canReview && status === "FINISHED" ? (
                <AppText style={{ fontSize: 12, opacity: 0.7, fontWeight: "700" }}>
                  (Bạn đã đánh giá)
                </AppText>
              ) : null}
            </View>
          );
        }}
      />

      {/* ✅ Review Modal (Keyboard không che) */}
      <ReviewModal
        visible={reviewVisible}
        submitting={submitting}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        onClose={closeReview}
        onSubmit={submitReview}
      />
    </Screen>
  );
}

/** =========================
 * Driver View: ACCEPTED (API) + FINISHED (API)
 * ✅ Có map phía trên "Đăng tuyến xe"
 ========================= */
function DriverMatchesView({ driverId }: { driverId: number }) {
  const [tab, setTab] = React.useState<"ACCEPTED" | "FINISHED">("ACCEPTED");

  // ===== MAP STATE (shared into CreateRouteBox) =====
  const [locDenied, setLocDenied] = React.useState(false);

  const [startLocation, setStartLocation] = React.useState("");
  const [endLocation, setEndLocation] = React.useState("");

  const [start, setStart] = React.useState<LatLng | null>(null);
  const [end, setEnd] = React.useState<LatLng | null>(null);

  const [picking, setPicking] = React.useState<"start" | "end">("start");
  const [focused, setFocused] = React.useState<"start" | "end" | null>(null);

  const [region, setRegion] = React.useState<Region>(FALLBACK_REGION);

  const [startSug, setStartSug] = React.useState<PlaceSuggestion[]>([]);
  const [endSug, setEndSug] = React.useState<PlaceSuggestion[]>([]);
  const [sugLoading, setSugLoading] = React.useState(false);

  const startTextDebounced = useDebouncedValue(startLocation, 500);
  const endTextDebounced = useDebouncedValue(endLocation, 500);

  const [routeLine, setRouteLine] = React.useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeLoading, setRouteLoading] = React.useState(false);

  const fetchRouteLine = React.useCallback(async (a: LatLng, b: LatLng) => {
    setRouteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/map/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: [a, b] }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setRouteLine([]);
        return;
      }

      const pts = (data.points ?? [])
        .map((p: any) => ({
          latitude: Number(p.lat),
          longitude: Number(p.lng),
        }))
        .filter(
          (x: any) => Number.isFinite(x.latitude) && Number.isFinite(x.longitude)
        );

      setRouteLine(pts);
    } catch {
      setRouteLine([]);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // 1) init location -> set start
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
        setStartLocation(addr);
      } catch { }
    })();
  }, []);

  // 2) typing -> update pins + region
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

  // 3) auto draw line when has start & end
  React.useEffect(() => {
    if (Platform.OS === "web") return;

    if (!start || !end) {
      setRouteLine([]);
      return;
    }

    fetchRouteLine(start, end);
  }, [start?.lat, start?.lng, end?.lat, end?.lng, fetchRouteLine]);

  // 4) Autocomplete suggestions
  React.useEffect(() => {
    if (Platform.OS === "web") return;

    const active = focused;
    const query =
      active === "start"
        ? startTextDebounced
        : active === "end"
          ? endTextDebounced
          : "";
    const trimmed = (query ?? "").trim();

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

        if (isLatLngText(trimmed)) {
          if (active === "start") setStartSug([]);
          else setEndSug([]);
          return;
        }

        if (active === "start") setStartSug(list);
        else setEndSug(list);
      } catch {
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
        setStartLocation(await reverseToText(p));
        setStartSug([]);
      } else {
        setEnd(p);
        setEndLocation(await reverseToText(p));
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
      setStartLocation(s.label);
      setStartSug([]);
    } else {
      setPicking("end");
      setFocused(null);
      setEnd(p);
      setEndLocation(s.label);
      setEndSug([]);
    }
  };

  const {
    data: acceptedData,
    loading: acceptedLoading,
    error: acceptedError,
    refetch: refetchAccepted,
  } = useFetchAcceptedMatchesByDriver(driverId);

  const {
    data: finishedData,
    loading: finishedLoading,
    error: finishedError,
    refetch: refetchFinished,
  } = useFetchFinishedMatchesByDriver(driverId);

  const onFinish = (match_id: number) => {
    Alert.alert("Xác nhận", "Bạn chắc chắn muốn kết thúc chuyến này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Kết thúc",
        style: "default",
        onPress: async () => {
          try {
            await matchTripApi.finishMatch(match_id);
            Alert.alert("Thành công", "Đã kết thúc chuyến.");

            await Promise.all([refetchAccepted(), refetchFinished()]);
            setTab("FINISHED");
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Không thể kết thúc chuyến");
          }
        },
      },
    ]);
  };

  const onViewReviews = async () => {
    try {
      const list = await reviewApi.fetchByDriver(driverId);
      const top = (list ?? [])[0];
      if (!top) {
        Alert.alert("Đánh giá", "Chưa có đánh giá nào.");
        return;
      }
      Alert.alert(
        "Đánh giá mới nhất",
        `⭐ ${top.rating}/5\n${top.comment || "(Không có nhận xét)"}\n${top.created_at || ""
        }`
      );
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không tải được review");
    }
  };

  const listData =
    tab === "ACCEPTED" ? (acceptedData ?? []) : (finishedData ?? []);
  const loading = tab === "ACCEPTED" ? acceptedLoading : finishedLoading;
  const error = tab === "ACCEPTED" ? acceptedError : finishedError;
  const onRefresh = tab === "ACCEPTED" ? refetchAccepted : refetchFinished;

  const showStartSug = focused === "start" && (startSug.length > 0 || sugLoading);
  const showEndSug = focused === "end" && (endSug.length > 0 || sugLoading);

  return (
    <Screen>
      <FlatList
        data={listData as any[]}
        keyExtractor={(it: any) => String(it.match_id)}
        refreshing={loading}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <AppText style={styles.h1}>Matches (Driver)</AppText>
              <AppText style={styles.sub}>
                Chạm map hoặc nhập địa chỉ để chọn điểm
              </AppText>
            </View>

            <Divider />

            {/* ===== MAP BLOCK (nằm trên "Đăng tuyến xe") ===== */}
            <View style={styles.mapWrap}>
              {Platform.OS === "web" ? (
                <View style={styles.webMapFallback}>
                  <AppText style={styles.webMapTitle}>Map (Web fallback)</AppText>
                  <AppText style={styles.webMapSub}>
                    Web không hỗ trợ react-native-maps.
                  </AppText>
                  <View style={{ height: 10 }} />
                  <AppText style={styles.webMapCoord}>
                    Start: {start ? fmtLatLng(start) : "-"}
                  </AppText>
                  <AppText style={styles.webMapCoord}>
                    End: {end ? fmtLatLng(end) : "-"}
                  </AppText>
                  {routeLoading ? (
                    <AppText style={{ marginTop: 8, fontWeight: "800" }}>
                      Đang vẽ đường…
                    </AppText>
                  ) : null}
                </View>
              ) : (
                <NativeMap
                  region={region}
                  start={start}
                  end={end}
                  onPick={onPickFromMap}
                  routeLine={routeLine}
                />
              )}
            </View>

            {locDenied ? (
              <AppText style={styles.locWarn}>
                Bạn đang tắt quyền Location. Vẫn chọn điểm được nhưng không tự định vị.
              </AppText>
            ) : null}

            {routeLoading ? (
              <AppText style={{ marginTop: 8, fontWeight: "800", opacity: 0.8 }}>
                Đang vẽ đường đi…
              </AppText>
            ) : null}


            {/* ===== Create Route Box (nhận start/end từ map) ===== */}
            <CreateRouteBox
              driverId={driverId}
              startLocation={startLocation}
              endLocation={endLocation}
              setStartLocation={setStartLocation}
              setEndLocation={setEndLocation}
              onCreated={async () => {
                await refetchAccepted();
              }}
            />

            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => setTab("ACCEPTED")}
                style={[styles.tabBtn, tab === "ACCEPTED" && styles.tabBtnActive]}
              >
                <AppText
                  style={[styles.tabText, tab === "ACCEPTED" && styles.tabTextActive]}
                >
                  Đang chạy
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => setTab("FINISHED")}
                style={[styles.tabBtn, tab === "FINISHED" && styles.tabBtnActive]}
              >
                <AppText
                  style={[
                    styles.tabText,
                    tab === "FINISHED" && styles.tabTextActive,
                  ]}
                >
                  Đã xong
                </AppText>
              </Pressable>
            </View>

            {/* ✅ nút xem đánh giá (demo) */}
            <Pressable onPress={onViewReviews} style={styles.viewReviewBtn}>
              <AppText style={{ fontWeight: "900" }}>Xem đánh giá</AppText>
            </Pressable>

            <Divider />

            <AppText style={styles.h2}>
              {tab === "ACCEPTED"
                ? "Danh sách chuyến đã match (ACCEPTED)"
                : "Danh sách chuyến đã hoàn thành (FINISHED)"}
            </AppText>

            {error ? (
              <AppText style={styles.err}>
                Lỗi: {String((error as any)?.message ?? error)}
              </AppText>
            ) : null}

            <View style={{ height: 12 }} />
          </>
        }
        ListEmptyComponent={!loading ? <AppText>Chưa có chuyến nào.</AppText> : null}
        renderItem={({ item }: any) => {
          const r = item.route;
          const rr = item.ride_request;

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Match #{item.match_id}</AppText>

              <AppText style={styles.line}>
                Tuyến: {r.start_location} → {r.end_location}
              </AppText>
              <AppText style={styles.line}>Giờ tuyến: {r.time}</AppText>
              <AppText style={styles.line}>
                Giá: {r.price} | Ghế: {r.seats}
              </AppText>
              <AppText style={styles.line}>Route status: {r.route_status}</AppText>

              <Divider />

              <AppText style={styles.line}>
                Khách: {rr.pick_up} → {rr.drop_off}
              </AppText>
              <AppText style={styles.line}>Giờ khách: {rr.time}</AppText>
              <AppText style={styles.line}>Số chỗ khách đặt: {rr.passengers}</AppText>
              <AppText style={styles.line}>
                RideRequest status: {rr.ride_request_status}
              </AppText>

              <AppText style={styles.badge}>Match status: {item.match_trip_status}</AppText>

              {tab === "ACCEPTED" ? (
                <Pressable
                  style={styles.finishBtn}
                  onPress={() => onFinish(item.match_id)}
                >
                  <AppText style={styles.finishText}>Kết thúc chuyến đi</AppText>
                </Pressable>
              ) : null}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </Screen>
  );
}

/** =========================
 * Review Modal (Keyboard Avoid)
 ========================= */
function ReviewModal({
  visible,
  submitting,
  rating,
  setRating,
  comment,
  setComment,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  submitting: boolean;
  rating: number;
  setRating: (v: number) => void;
  comment: string;
  setComment: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={stylesM.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={stylesM.center}
          >
            <View style={stylesM.box}>
              <AppText style={stylesM.title}>Đánh giá tài xế</AppText>

              <View style={stylesM.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)} disabled={submitting}>
                    <AppText style={[stylesM.star, rating >= n && stylesM.starActive]}>
                      ★
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Nhập nhận xét (tuỳ chọn)..."
                style={stylesM.input}
                editable={!submitting}
                multiline
              />

              <View style={stylesM.row}>
                <Pressable onPress={onClose} style={stylesM.cancel} disabled={submitting}>
                  <AppText style={{ fontWeight: "800" }}>Huỷ</AppText>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  style={[stylesM.submit, submitting && { opacity: 0.6 }]}
                  disabled={submitting}
                >
                  <AppText style={{ fontWeight: "900" }}>
                    {submitting ? "Đang gửi..." : "Gửi"}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/** =========================
 * Create Route Box (đã nhận start/end từ map)
 ========================= */
function CreateRouteBox({
  driverId,
  onCreated,
  startLocation,
  endLocation,
  setStartLocation,
  setEndLocation,
}: {
  driverId: number;
  onCreated: () => Promise<void> | void;
  startLocation: string;
  endLocation: string;
  setStartLocation: (v: string) => void;
  setEndLocation: (v: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  const [time, setTime] = React.useState("");
  const [seats, setSeats] = React.useState("");
  const [priceRaw, setPriceRaw] = React.useState("");

  const reset = () => {
    // nếu bạn muốn sau khi đăng tuyến xong vẫn giữ điểm trên map,
    // hãy comment 2 dòng dưới
    setStartLocation("");
    setEndLocation("");
    setTime("");
    setSeats("");
    setPriceRaw("");
  };

  const submit = async () => {
    if (!startLocation.trim() || !endLocation.trim() || !time.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập điểm đi, điểm đến và thời gian.");
      return;
    }

    const seatsNum = Number(toDigits(seats));
    const priceNum = Number(priceRaw);

    if (!seatsNum || Number.isNaN(seatsNum) || seatsNum <= 0) {
      Alert.alert("Sai dữ liệu", "Số ghế phải là số > 0.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Sai dữ liệu", "Giá phải là số hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      await routeApi.create({
        driver_id: driverId,
        start_location: startLocation.trim(),
        end_location: endLocation.trim(),
        time: time.trim(),
        seats: seatsNum,
        price: priceNum,
      });

      Alert.alert("Thành công", "Đã đăng tuyến xe.");
      reset();
      await onCreated();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể đăng tuyến");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.createBox}>
      <AppText style={styles.h2}>Đăng tuyến xe</AppText>

      <View style={{ gap: 10 }}>
        <TextInput
          value={startLocation}
          onChangeText={setStartLocation}
          placeholder="Điểm đi (start_location)"
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          value={endLocation}
          onChangeText={setEndLocation}
          placeholder="Điểm đến (end_location)"
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="Thời gian (vd 2025-01-10 08:00)"
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={seats}
            onChangeText={(t) => setSeats(toDigits(t))}
            placeholder="Số ghế"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1, minWidth: 0 }]}
          />

          <TextInput
            value={formatWithDots(priceRaw)}
            onChangeText={(t) => setPriceRaw(toDigits(t))}
            placeholder="Giá"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1, minWidth: 0 }]}
          />
        </View>

        <Pressable
          onPress={submit}
          disabled={loading}
          style={[styles.btn, loading && { opacity: 0.6 }]}
        >
          <AppText style={styles.btnText}>{loading ? "Đang đăng..." : "Đăng tuyến"}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** =========================
 * Styles
 ========================= */
const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 8 },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 13, opacity: 0.7 },
  err: { marginTop: 10, color: "crimson" },

  listContent: {
    padding: 10,
    paddingBottom: 40,
  },

  // ===== map styles =====
  locWarn: { marginTop: 6, color: "crimson", fontWeight: "700" },

  mapWrap: {
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    marginTop: 8,
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
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  pickBtnActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  pickText: { fontWeight: "800", color: "#111" },
  pickTextActive: { color: "#fff" },

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

  // ===== existing styles =====
  createBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
  },
  btnText: { fontWeight: "800" },

  tabsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  tabBtnActive: { borderColor: "#111827" },
  tabText: { fontWeight: "800", opacity: 0.6 },
  tabTextActive: { opacity: 1 },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  line: { fontSize: 13, opacity: 0.9 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: "900" },

  finishBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
  },
  finishText: { fontWeight: "900" },

  viewReviewBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
  },
});

const stylesP = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  line: { fontSize: 13, opacity: 0.85 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: "900" },

  reviewBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
  },
  reviewText: { fontWeight: "900" },
});

const stylesM = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  center: { width: "100%" },
  box: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "800" },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  star: { fontSize: 28, color: "#d1d5db" },
  starActive: { color: "#facc15" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    minHeight: 90,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  cancel: { paddingVertical: 10, paddingHorizontal: 12 },
  submit: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#111",
  },
});