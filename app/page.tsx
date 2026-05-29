"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api, convexEnabled } from "../lib/convex";
import { Drawer } from "../components/drawer";
import { buildSlug, catalog, categories, categorySlug, CUSTOM_CATEGORIES_KEY } from "./store-data";
export { buildSlug, catalog, CUSTOM_CATEGORIES_KEY } from "./store-data";
export type { Product } from "./store-data";

const PRODUCTS_STORAGE_KEY = "fixx-products";
const DELIVERY_ADDRESS_STORAGE_KEY = "fixx-delivery-address";
const PINNED_LOCATION_STORAGE_KEY = "fixx-pinned-location";

type MenuCategory = {
  label: string;
  tagline: string;
  href: string;
  slug: string;
  accent?: string;
  image?: string;
};

type CategoryDoc = {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  accent: string;
  image: string;
  isDefault: boolean;
};

type ProductDoc = {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  price: string;
  oldPrice?: string;
  brand?: string;
  seller?: string;
  rating?: string;
  reviews?: string;
  shipping?: string;
  discount?: string;
  image?: string;
  images?: string[];
  badge?: string;
};

type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: string;
  oldPrice: string;
  brand: string;
  seller: string;
  rating: string;
  reviews: string;
  shipping: string;
  discount: string;
  image?: string;
  badge?: string;
  categoryLabel: string;
};

type DeliveryAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type PinnedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

type MapPoint = {
  x: number;
  y: number;
};

const DEFAULT_DELIVERY_ADDRESS: DeliveryAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600049",
};

function mapStaticCategories(): MenuCategory[] {
  return categories.map((category) => ({
    label: category.label,
    tagline: category.tagline,
    href: `/category/${categorySlug(category.label)}`,
    slug: categorySlug(category.label),
    accent: category.accent,
    image: category.image,
  }));
}

function mapLiveCategories(rows: CategoryDoc[]): MenuCategory[] {
  return rows.map((category) => ({
    label: category.name,
    tagline: category.tagline,
    href: `/category/${category.slug}`,
    slug: category.slug,
    accent: category.accent,
    image: category.image,
  }));
}

function readStoredCategories(): MenuCategory[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<{ name?: string; hero?: string; route?: string }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => typeof item?.name === "string" && item.name.trim().length > 0)
      .map((item) => ({
        label: item.name!.trim(),
        tagline: item.hero?.trim() || "New category created in admin",
        href: item.route || `/category/${categorySlug(item.name!.trim())}`,
        slug: categorySlug(item.name!.trim()),
      }));
  } catch {
    return [];
  }
}

function readStoredProducts(): ProductDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      name: string; categorySlug: string; categoryName: string;
      price: string; oldPrice?: string; brand?: string; seller?: string;
      rating?: string; reviews?: string; shipping?: string; discount?: string;
      image?: string; images?: string[]; badge?: string;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => ({
      _id: `local-${Date.now()}-${index}`,
      name: item.name,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      categorySlug: item.categorySlug || "uncategorized",
      categoryName: item.categoryName || "Uncategorized",
      price: item.price,
      oldPrice: item.oldPrice,
      brand: item.brand,
      seller: item.seller,
      rating: item.rating,
      reviews: item.reviews,
      shipping: item.shipping,
      discount: item.discount,
      image: item.image || (item.images && item.images.length > 0 ? item.images[0] : undefined),
      images: item.images,
      badge: item.badge,
    }));
  } catch {
    return [];
  }
}

function readStoredDeliveryAddress(): DeliveryAddress {
  if (typeof window === "undefined") {
    return DEFAULT_DELIVERY_ADDRESS;
  }

  try {
    const raw = window.localStorage.getItem(DELIVERY_ADDRESS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DELIVERY_ADDRESS;
    }

    const parsed = JSON.parse(raw) as Partial<DeliveryAddress>;
    return {
      fullName: parsed.fullName?.trim() || DEFAULT_DELIVERY_ADDRESS.fullName,
      phone: parsed.phone?.trim() || DEFAULT_DELIVERY_ADDRESS.phone,
      line1: parsed.line1?.trim() || DEFAULT_DELIVERY_ADDRESS.line1,
      line2: parsed.line2?.trim() || DEFAULT_DELIVERY_ADDRESS.line2,
      landmark: parsed.landmark?.trim() || DEFAULT_DELIVERY_ADDRESS.landmark,
      city: parsed.city?.trim() || DEFAULT_DELIVERY_ADDRESS.city,
      state: parsed.state?.trim() || DEFAULT_DELIVERY_ADDRESS.state,
      pincode: parsed.pincode?.trim() || DEFAULT_DELIVERY_ADDRESS.pincode,
    };
  } catch {
    return DEFAULT_DELIVERY_ADDRESS;
  }
}

function readStoredPinnedLocation(): PinnedLocation | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PINNED_LOCATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PinnedLocation>;
    if (typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number") {
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      accuracy: typeof parsed.accuracy === "number" ? parsed.accuracy : undefined,
    };
  } catch {
    return null;
  }
}

function formatDeliveryLocation(address: DeliveryAddress) {
  return `${address.city || "Chennai"} ${address.pincode || "600049"}`.trim();
}

function formatDeliverySummary(address: DeliveryAddress) {
  const parts = [address.line1, address.line2, address.landmark].filter((part) => part.trim().length > 0);
  return parts.length > 0 ? parts.join(", ") : "Add your delivery address";
}

function formatPinnedLocation(location: PinnedLocation | null) {
  if (!location) {
    return "No location pinned yet";
  }

  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mapPointToPinnedLocation(point: MapPoint): PinnedLocation {
  const centerLatitude = 13.0827;
  const centerLongitude = 80.2707;
  const latitudeDelta = (50 - point.y) * 0.004;
  const longitudeDelta = (point.x - 50) * 0.004;

  return {
    latitude: centerLatitude + latitudeDelta,
    longitude: centerLongitude + longitudeDelta,
  };
}

function pinnedLocationToMapPoint(location: PinnedLocation): MapPoint {
  const centerLatitude = 13.0827;
  const centerLongitude = 80.2707;
  const x = 50 + (location.longitude - centerLongitude) / 0.004;
  const y = 50 - (location.latitude - centerLatitude) / 0.004;

  return {
    x: clamp(x, 8, 92),
    y: clamp(y, 8, 92),
  };
}

function mapFallbackProducts(categoryLabel: string) {
  return catalog[categoryLabel] ?? [];
}

function mapStaticProducts(categoryLabel: string): ProductCard[] {
  return mapFallbackProducts(categoryLabel).map((product, index) => ({
    id: product.id,
    slug: buildSlug(categoryLabel, product.name, index),
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice,
    brand: product.brand,
    seller: product.seller,
    rating: product.rating,
    reviews: product.reviews,
    shipping: product.shipping,
    discount: product.discount,
    image: product.image,
    badge: product.badge,
    categoryLabel: product.category,
  }));
}

function mapLiveProducts(rows: ProductDoc[]): ProductCard[] {
  return rows.map((product) => ({
    id: product._id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice ?? "",
    brand: product.brand ?? "",
    seller: product.seller ?? "",
    rating: product.rating ?? "",
    reviews: product.reviews ?? "",
    shipping: product.shipping ?? "",
    discount: product.discount ?? "",
    image: product.image || (product.images && product.images.length > 0 ? product.images[0] : undefined),
    badge: product.badge,
    categoryLabel: product.categoryName,
  }));
}

const spotlight = [
  {
    title: "Flip through today's top offers",
    copy: "A blue-first marketplace layout with category rails, promo banners, and fast shopping actions.",
    cta: "Shop deals",
    image: "/banners/flipkart-offers.svg",
    tone: "from-[#e8f1ff] to-[#cfe1ff]",
  },
  {
    title: "Trending tech, styled like a marketplace",
    copy: "Clean product cards, visible savings, and familiar ecommerce browsing patterns.",
    cta: "Explore tech",
    image: "/banners/poco-banner.svg",
    tone: "from-[#f0f5ff] to-[#dce8ff]",
  },
];

const highlights = [
  {
    title: "Super Value",
    copy: "Big savings on essentials with easy comparison and prominent discounts.",
  },
  {
    title: "Assured Picks",
    copy: "Trust-focused cards with brand, seller, rating and shipping details up front.",
  },
  {
    title: "Fast checkout",
    copy: "Quick access to wishlist, cart, and login without leaving the browsing flow.",
  },
];

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#2874f0]" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20s-7-4.6-9.5-8.7C0.5 8.1 2.1 4.5 5.9 4.5c2 0 3.4 1 4.1 2 0.7-1 2.1-2 4.1-2 3.8 0 5.4 3.6 3.4 6.8C19 15.4 12 20 12 20Z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H7.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconLocationPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#2874f0]" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPinTarget() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

function ProductFrame({
  src,
  alt,
  discount,
  badge,
}: {
  src: string;
  alt: string;
  discount?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-[#edf4ff] via-[#eaf1ff] to-[#dfe9fc] p-4">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(40,116,240,0.04)]">
        {discount ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#2874f0] shadow-sm">
            {discount}
          </div>
        ) : null}
        {badge ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-medium text-white">
            {badge}
          </div>
        ) : null}
        <div className="flex min-h-[220px] items-center justify-center sm:min-h-[240px]">
          {src ? (
            <Image src={src} alt={alt} width={900} height={700} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-[220px] w-full items-center justify-center rounded-[1.25rem] bg-slate-100 text-sm font-semibold text-slate-400">
              Image coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategorySlug, setActiveCategorySlug] = useState(categorySlug("Electronics"));
  const [heroIndex, setHeroIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState("");
  const [customCategories, setCustomCategories] = useState<MenuCategory[]>([]);
  const [localProducts, setLocalProducts] = useState<ProductDoc[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(DEFAULT_DELIVERY_ADDRESS);
  const [addressDraft, setAddressDraft] = useState<DeliveryAddress>(DEFAULT_DELIVERY_ADDRESS);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isLocationPinned, setIsLocationPinned] = useState(false);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation | null>(null);
  const [manualPinPoint, setManualPinPoint] = useState<MapPoint>({ x: 50, y: 50 });
  const isSignedIn = Boolean(currentUser.trim());
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const liveCategories = convexEnabled ? (useQuery(api.categories.getAll) as CategoryDoc[] | undefined) : undefined;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const liveProducts = convexEnabled ? (useQuery(api.products.getAll) as ProductDoc[] | undefined) : undefined;

  const hero = spotlight[heroIndex % spotlight.length];
  const menuCategories = useMemo(() => {
    if (convexEnabled) {
      const liveRows = Array.isArray(liveCategories) && liveCategories.length > 0 ? mapLiveCategories(liveCategories) : mapStaticCategories();
      return liveRows;
    }

    return [...mapStaticCategories(), ...customCategories];
  }, [customCategories, liveCategories]);

  const resolvedCategorySlug = useMemo(() => {
    if (menuCategories.some((category) => category.slug === activeCategorySlug)) {
      return activeCategorySlug;
    }

    return menuCategories[0]?.slug ?? activeCategorySlug;
  }, [activeCategorySlug, menuCategories]);

  const activeCategory = useMemo(() => {
    return menuCategories.find((category) => category.slug === resolvedCategorySlug) ?? menuCategories[0] ?? null;
  }, [menuCategories, resolvedCategorySlug]);

  const products = useMemo(() => {
    if (convexEnabled) {
      const rows = Array.isArray(liveProducts) ? liveProducts : [];
      if (rows.length > 0) {
        return mapLiveProducts(rows.filter((product) => product.categorySlug === resolvedCategorySlug));
      }

      return mapStaticProducts(activeCategory?.label ?? "Electronics");
    }

    const staticProducts = mapStaticProducts(activeCategory?.label ?? "Electronics");
    const localFiltered = localProducts.filter((p) => p.categorySlug === resolvedCategorySlug);
    const localMapped = localFiltered.map((p) => ({
      id: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice ?? "",
      brand: p.brand ?? "",
      seller: p.seller ?? "",
      rating: p.rating ?? "",
      reviews: p.reviews ?? "",
      shipping: p.shipping ?? "",
      discount: p.discount ?? "",
      image: p.image,
      badge: p.badge,
      categoryLabel: p.categoryName,
    }));
    return [...staticProducts, ...localMapped];
  }, [activeCategory?.label, liveProducts, localProducts, resolvedCategorySlug]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((value) => (value + 1) % spotlight.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncCurrentUser = () => {
      try {
        const raw = window.localStorage.getItem("fixx-current-user");
        if (!raw) {
          setCurrentUser("");
          return;
        }

        try {
          const parsed = JSON.parse(raw) as { name?: string; email?: string } | string;
          if (typeof parsed === "string") {
            setCurrentUser(parsed);
            return;
          }

          setCurrentUser(parsed.name || parsed.email || "");
        } catch {
          setCurrentUser(raw);
        }
      } catch {
        setCurrentUser("");
      }
    };

    syncCurrentUser();
    window.addEventListener("storage", syncCurrentUser);

    return () => window.removeEventListener("storage", syncCurrentUser);
  }, []);

  useEffect(() => {
    if (convexEnabled) {
      return undefined;
    }

    const loadData = () => {
      setCustomCategories(readStoredCategories());
      setLocalProducts(readStoredProducts());
    };

    const timer = window.setTimeout(loadData, 0);
    window.addEventListener("storage", loadData);
    window.addEventListener("fixx-admin-product-updated", loadData);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("fixx-admin-product-updated", loadData);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedAddress = readStoredDeliveryAddress();
      setDeliveryAddress(storedAddress);
      setAddressDraft(storedAddress);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPinnedLocation = readStoredPinnedLocation();
      if (storedPinnedLocation) {
        setPinnedLocation(storedPinnedLocation);
        setIsLocationPinned(true);
        setManualPinPoint(pinnedLocationToMapPoint(storedPinnedLocation));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function openAddressDrawer() {
    setAddressDraft(deliveryAddress);
    setIsAddressDrawerOpen(false);
    setIsLocationSheetOpen(true);
  }

  function closeAddressDrawer() {
    setIsAddressDrawerOpen(false);
    setIsLocationSheetOpen(false);
  }

  function updateDraftField(field: keyof DeliveryAddress, value: string) {
    setAddressDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveAddress() {
    const nextAddress: DeliveryAddress = {
      fullName: addressDraft.fullName.trim(),
      phone: addressDraft.phone.trim(),
      line1: addressDraft.line1.trim(),
      line2: addressDraft.line2.trim(),
      landmark: addressDraft.landmark.trim(),
      city: addressDraft.city.trim() || "Chennai",
      state: addressDraft.state.trim() || "Tamil Nadu",
      pincode: addressDraft.pincode.trim() || "600049",
    };

    setDeliveryAddress(nextAddress);
    setIsLocationPinned(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DELIVERY_ADDRESS_STORAGE_KEY, JSON.stringify(nextAddress));
    }

    setIsAddressDrawerOpen(false);
    setIsLocationSheetOpen(false);
  }

  function openMapPopup() {
    setIsLocationSheetOpen(false);
    setIsMapPopupOpen(true);
  }

  function closeMapPopup() {
    setIsMapPopupOpen(false);
  }

  function pinCurrentLocation() {
    if (typeof window === "undefined" || !window.navigator.geolocation) {
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPinnedLocation: PinnedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setPinnedLocation(nextPinnedLocation);
        setIsLocationPinned(true);
        setManualPinPoint(pinnedLocationToMapPoint(nextPinnedLocation));

        window.localStorage.setItem(PINNED_LOCATION_STORAGE_KEY, JSON.stringify(nextPinnedLocation));
      },
      () => {
        const fallbackPinnedLocation: PinnedLocation = {
          latitude: 13.0827,
          longitude: 80.2707,
        };

        setPinnedLocation(fallbackPinnedLocation);
        setIsLocationPinned(true);
        setManualPinPoint(pinnedLocationToMapPoint(fallbackPinnedLocation));
        window.localStorage.setItem(PINNED_LOCATION_STORAGE_KEY, JSON.stringify(fallbackPinnedLocation));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  function saveManualPinPoint() {
    const nextPinnedLocation = mapPointToPinnedLocation(manualPinPoint);
    setPinnedLocation(nextPinnedLocation);
    setIsLocationPinned(true);
    window.localStorage.setItem(PINNED_LOCATION_STORAGE_KEY, JSON.stringify(nextPinnedLocation));
  }

  function handleAccountClick() {
    if (!currentUser.trim()) {
      router.push("/login");
      return;
    }

    window.localStorage.removeItem("fixx-current-user");
    setCurrentUser("");
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <main className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#e4e7ed] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f5ff] lg:hidden">
            <IconMenu />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2874f0] text-lg font-bold text-white shadow-sm">
              F
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight text-slate-900">Fixx Market</p>
              <p className="text-xs text-slate-500">Explore, compare, shop fast</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={openAddressDrawer}
            className="hidden min-w-[220px] items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left transition hover:border-[#dfe3eb] hover:bg-[#f8fafc] md:flex"
            aria-label="Update delivery location"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff]">
              <IconLocationPin />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Delivering to {formatDeliveryLocation(deliveryAddress)}
              </span>
              <span className="block text-sm font-semibold text-slate-900">Update location</span>
            </span>
          </button>

          <label className="flex flex-1 items-center gap-3 rounded-full border border-[#dfe3eb] bg-[#f5f7fa] px-4 py-3 shadow-sm focus-within:border-[#2874f0] focus-within:bg-white">
            <IconSearch />
            <input
              type="search"
              placeholder="Search for products, brands and categories"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={handleAccountClick}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              title={currentUser ? "Sign out" : "Sign in"}
            >
              {currentUser || "Login"}
            </button>
            <button type="button" onClick={() => router.push("/wishlist")} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f5ff] hover:bg-[#e5edff]">
              <IconHeart />
            </button>
            <button type="button" onClick={() => router.push("/cart")} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f5ff] hover:bg-[#e5edff]">
              <IconCart />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${hero.tone} p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-8`}>
            <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Marketplace deals
                </span>
                <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  {hero.title}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
                  {hero.copy}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/cart" className="rounded-full bg-[#2874f0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f5fc1]">
                    {hero.cta}
                  </Link>
                  <Link href="/wishlist" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
                    View wishlist
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[420px]">
                <div className="rounded-[2rem] bg-gradient-to-br from-[#edf4ff] via-[#eaf1ff] to-[#dfe9fc] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.15)]">
                  <div className="overflow-hidden rounded-[1.5rem] bg-white p-3">
                    <Image
                      src={hero.image}
                      alt={hero.title}
                      width={800}
                      height={500}
                      priority={hero.image === spotlight[0].image}
                      className="h-[250px] w-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-4 left-4 rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Today&apos;s highlight</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Up to 43% off selected picks</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            {menuCategories.slice(0, 2).map((category) => (
              <Link
                key={category.slug}
                href={category.href}
                className={`overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${category.accent} p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{category.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{category.tagline}</p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-slate-700">Shop now</span>
                  <Image src={category.image ?? ""} alt={category.label} width={120} height={120} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                </div>
              </Link>
            ))}
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-[#e2e7f0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2">
            {menuCategories.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                onClick={() => setActiveCategorySlug(item.slug)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategorySlug === item.slug
                    ? "bg-[#2874f0] text-white"
                    : "bg-[#f5f7fa] text-slate-700 hover:bg-[#e9eef8]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="rounded-[1.6rem] border border-[#e2e7f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-semibold text-slate-900">{highlight.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Top picks</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{activeCategory?.label ?? "Featured"} deals</h2>
          </div>
          <p className="hidden max-w-md text-right text-sm text-slate-500 md:block">
            A cleaner marketplace layout with quick category switching and stronger product cards.
          </p>
        </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.length > 0 ? products.map((product) => {
            const slug = product.slug;

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[1.8rem] border border-[#e2e7f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
              >
                <Link href={`/product/${slug}`} className="block p-3">
                  <ProductFrame
                    src={product.image ?? ""}
                    alt={product.name}
                    discount={product.discount}
                    badge={product.badge}
                  />

                  <div className="px-1 pb-2 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{product.brand}</p>
                    <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-slate-900">{product.name}</h3>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-700">{product.price}</span>
                      {product.oldPrice ? <span className="text-sm text-slate-400 line-through">{product.oldPrice}</span> : null}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-700">
                        {product.rating}
                      </span>
                      <span>{product.reviews}</span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">{product.shipping}</p>
                  </div>
                </Link>
              </article>
            );
          }) : (
            <div className="rounded-[1.8rem] border border-dashed border-[#dfe5ee] bg-white p-8 text-sm text-slate-500 sm:col-span-2 xl:col-span-4">
              No products have been added for this category yet.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-[#e2e7f0] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8 md:grid-cols-3">
          {[
            ["Fast delivery", "Marketplace-style shipping details and quick fulfillment labels."],
            ["Trusted sellers", "Clear brand and seller hierarchy so the page feels familiar and shoppable."],
            ["Easy returns", "A more complete ecommerce feel with cart, wishlist, and account paths."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-[#e2e7f0] bg-[#f7f9fc] p-5">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {false && isLocationSheetOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close delivery address panel"
            className="absolute inset-0 bg-black/40"
            onClick={closeAddressDrawer}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e6ebf2] px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
              <button
                type="button"
                onClick={closeAddressDrawer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6ebf2] text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <IconChevronRight />
              </button>
            </div>

            <form
              className="h-[calc(100%-65px)] overflow-y-auto px-4 py-4 sm:px-5"
              onSubmit={(event) => {
                event.preventDefault();
                saveAddress();
              }}
            >
              <div className="rounded-[1.5rem] border border-[#e5eaf2] bg-[#f8fbff] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2874f0]">
                    <IconPinTarget />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">Currently delivering to</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {formatDeliveryLocation(deliveryAddress)}{" · "}{formatDeliverySummary(deliveryAddress)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Add or update the address where you want your orders delivered.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-[#cdd8e6] bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setIsLocationPinned((current) => !current)}
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                      isLocationPinned ? "bg-emerald-500" : "bg-[#2874f0]"
                    }`}
                    aria-label={isLocationPinned ? "Unpin location" : "Pin location"}
                  >
                    <IconLocationPin />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {isLocationPinned ? "Location pinned" : "Pin delivery location"}
                    </p>
                    <p className="text-xs leading-5 text-slate-500">
                      {isLocationPinned ? "Your drop point is set for this delivery." : "Tap to mark your delivery point."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Full name</span>
                  <input
                    type="text"
                    value={addressDraft.fullName}
                    onChange={(event) => updateDraftField("fullName", event.target.value)}
                    placeholder="Your name"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Phone number</span>
                  <input
                    type="tel"
                    value={addressDraft.phone}
                    onChange={(event) => updateDraftField("phone", event.target.value)}
                    placeholder="10-digit mobile number"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Address line 1</span>
                  <input
                    type="text"
                    value={addressDraft.line1}
                    onChange={(event) => updateDraftField("line1", event.target.value)}
                    placeholder="House no, street"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Address line 2</span>
                  <input
                    type="text"
                    value={addressDraft.line2}
                    onChange={(event) => updateDraftField("line2", event.target.value)}
                    placeholder="Area, locality"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Landmark</span>
                  <input
                    type="text"
                    value={addressDraft.landmark}
                    onChange={(event) => updateDraftField("landmark", event.target.value)}
                    placeholder="Nearby landmark"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">City</span>
                    <input
                      type="text"
                      value={addressDraft.city}
                      onChange={(event) => updateDraftField("city", event.target.value)}
                      placeholder="City"
                      className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">State</span>
                    <input
                      type="text"
                      value={addressDraft.state}
                      onChange={(event) => updateDraftField("state", event.target.value)}
                      placeholder="State"
                      className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Pincode</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addressDraft.pincode}
                    onChange={(event) => updateDraftField("pincode", event.target.value)}
                    placeholder="600049"
                    className="rounded-[1.25rem] border border-[#dbe3ee] bg-white px-4 py-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                  />
                </label>
              </div>

              <div className="sticky bottom-0 mt-5 flex gap-3 border-t border-[#eef2f7] bg-white/95 py-4 backdrop-blur">
                <button
                  type="button"
                  onClick={closeAddressDrawer}
                  className="flex-1 rounded-full border border-[#dbe3ee] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-[#2874f0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5fc1]"
                >
                  Save address
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {false && (
      <Drawer open={isAddressDrawerOpen} onClose={closeAddressDrawer} title="Delivery address">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveAddress();
          }}
        >
          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Currently delivering to</p>
            <p className="mt-1 text-slate-600">
              {formatDeliveryLocation(deliveryAddress)} · {formatDeliverySummary(deliveryAddress)}
            </p>
            <p className="mt-3">Add or update the address where you want your orders delivered.</p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                type="text"
                value={addressDraft.fullName}
                onChange={(event) => updateDraftField("fullName", event.target.value)}
                placeholder="Your name"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Phone number</span>
              <input
                type="tel"
                value={addressDraft.phone}
                onChange={(event) => updateDraftField("phone", event.target.value)}
                placeholder="10-digit mobile number"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Address line 1</span>
              <input
                type="text"
                value={addressDraft.line1}
                onChange={(event) => updateDraftField("line1", event.target.value)}
                placeholder="House no, street"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Address line 2</span>
              <input
                type="text"
                value={addressDraft.line2}
                onChange={(event) => updateDraftField("line2", event.target.value)}
                placeholder="Area, locality"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Landmark</span>
              <input
                type="text"
                value={addressDraft.landmark}
                onChange={(event) => updateDraftField("landmark", event.target.value)}
                placeholder="Nearby landmark"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  type="text"
                  value={addressDraft.city}
                  onChange={(event) => updateDraftField("city", event.target.value)}
                  placeholder="City"
                  className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">State</span>
                <input
                  type="text"
                  value={addressDraft.state}
                  onChange={(event) => updateDraftField("state", event.target.value)}
                  placeholder="State"
                  className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Pincode</span>
              <input
                type="text"
                inputMode="numeric"
                value={addressDraft.pincode}
                onChange={(event) => updateDraftField("pincode", event.target.value)}
                placeholder="600049"
                className="rounded-2xl border border-[#dfe3eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2874f0]"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeAddressDrawer}
              className="flex-1 rounded-full border border-[#dfe3eb] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full bg-[#2874f0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5fc1]"
            >
              Save address
            </button>
          </div>
        </form>
      </Drawer>
      )}

      {isLocationSheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close location popup"
            className="absolute inset-0 bg-black/45"
            onClick={closeAddressDrawer}
          />

          <div className="relative w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-[1.15rem] font-semibold text-slate-900">Choose your location</h2>
              <button
                type="button"
                onClick={closeAddressDrawer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-[15px] leading-6 text-slate-700">
                Select a delivery location to see product availability and delivery options
              </p>

              {isSignedIn ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[#dfe5ee] bg-[#f8fbff] p-4">
                    <p className="text-sm font-semibold text-slate-900">Signed in as {currentUser}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Choose one of your saved delivery addresses or add a new one below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddressDraft(deliveryAddress)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-[#dfe5ee] bg-white p-4 text-left transition hover:bg-slate-50"
                  >
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                      <IconLocationPin />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">Saved delivery address</span>
                      <span className="block text-sm leading-6 text-slate-600">
                        {formatDeliveryLocation(deliveryAddress)} · {formatDeliverySummary(deliveryAddress)}
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="mt-4 w-full rounded-full bg-[#ffd814] px-4 py-3 text-base font-medium text-slate-900 transition hover:bg-[#f7ca00]"
                >
                  Sign in to see your addresses
                </button>
              )}

              <div className="my-5 flex items-center gap-3 text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[15px] text-slate-500">or enter an Indian pincode</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveAddress();
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={addressDraft.pincode}
                  onChange={(event) => updateDraftField("pincode", event.target.value)}
                  placeholder="Pincode"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-[#2874f0]"
                />
                <button
                  type="submit"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-900 transition hover:bg-slate-50"
                >
                  Apply
                </button>
              </form>

              <button
                type="button"
                onClick={openMapPopup}
                className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#e5eaf2] bg-[#f8fbff] p-4 text-left transition hover:bg-[#f2f7ff]"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${isLocationPinned ? "bg-[#08c16b]" : "bg-[#2874f0]"}`}>
                  <IconLocationPin />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-900">
                    {isLocationPinned ? "Location pinned" : "Pin your current location"}
                  </span>
                  <span className="block text-sm leading-6 text-slate-500">
                    {isLocationPinned ? `Saved point: ${formatPinnedLocation(pinnedLocation)}` : "Tap to open map and pin your drop point."}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMapPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close map popup"
            className="absolute inset-0 bg-black/45"
            onClick={closeMapPopup}
          />

          <div className="relative w-full max-w-[460px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-[1.15rem] font-semibold text-slate-900">Pin location on map</h2>
                <p className="mt-1 text-sm text-slate-500">Click the button to capture your current delivery point.</p>
              </div>
              <button
                type="button"
                onClick={closeMapPopup}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-5">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#dbe3ee] bg-[radial-gradient(circle_at_top_left,_rgba(40,116,240,0.18),_transparent_28%),linear-gradient(135deg,_#edf4ff_0%,_#f8fbff_45%,_#e6f7ee_100%)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(40,116,240,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(40,116,240,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
                <div
                  className="relative min-h-[300px] cursor-crosshair p-4"
                  onClick={(event) => {
                    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
                    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);
                    setManualPinPoint({ x, y });
                  }}
                >
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    Tap anywhere to move the pin
                  </div>

                  <div
                    className="absolute -translate-x-1/2 -translate-y-full drop-shadow-[0_12px_18px_rgba(15,23,42,0.18)]"
                    style={{ left: `${manualPinPoint.x}%`, top: `${manualPinPoint.y}%` }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#08c16b]">
                          <IconLocationPin />
                        </span>
                      </div>
                      <div className="h-10 w-1 rounded-full bg-[#08c16b]/35" />
                      <div className="rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                        {mapPointToPinnedLocation(manualPinPoint).latitude.toFixed(5)}, {mapPointToPinnedLocation(manualPinPoint).longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e5eaf2] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {pinnedLocation ? "Location already selected" : "No pin selected yet"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {pinnedLocation
                    ? "Your current coordinates are ready. You can save them again or move to a new spot."
                    : "Use your browser location to pin the address on the map."}
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeMapPopup}
                  className="flex-1 rounded-full border border-[#dbe3ee] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveManualPinPoint();
                    setIsMapPopupOpen(false);
                  }}
                  className="flex-1 rounded-full bg-[#2874f0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5fc1]"
                >
                  Use this location
                </button>
              </div>

              <button
                type="button"
                onClick={pinCurrentLocation}
                className="mt-3 w-full rounded-full border border-[#dbe3ee] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Use current location instead
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
