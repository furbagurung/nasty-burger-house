$ErrorActionPreference = "Stop"

function Replace-Exact([string]$Path,[string]$Old,[string]$New) {
  $c = (Get-Content -Raw $Path).Replace("`r`n", "`n")
  $oldNormalized = $Old.Replace("`r`n", "`n")
  $newNormalized = $New.Replace("`r`n", "`n")
  if (-not $c.Contains($oldNormalized)) { throw "Expected code not found in $Path. Run git pull origin main first." }
  Set-Content -NoNewline -Path $Path -Value $c.Replace($oldNormalized,$newNormalized)
}

# Reuse one Supabase browser client.
$path = "app/lib/supabase/client.ts"
@'
import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase browser credentials are not configured.");
  }

  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}

export function getBrowserClientOrNull() {
  return isSupabaseBrowserConfigured() ? createClient() : null;
}
'@ | Set-Content -NoNewline $path

# Use the local browser session instead of re-validating the user over the network every loader call.
$path = "app/lib/customer-backend.ts"
Replace-Exact $path @'
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return { supabase, user: null };
  return { supabase, user };
'@ @'
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) return { supabase, user: null };
  return { supabase, user: session?.user ?? null };
'@

# Keep the sidebar from waiting on orders/reviews just to become visible.
$path = "app/components/account-dashboard-shell.tsx"
Replace-Exact $path @'
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [customer, orders, reviews] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setProfile(customer);
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } finally {
        if (active) setReady(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);
'@ @'
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const customer = await loadCurrentCustomer();
        if (active) setProfile(customer);
      } finally {
        if (active) setReady(true);
      }
    }

    async function loadCounts() {
      try {
        const [orders, reviews] = await Promise.all([
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } catch {
        // Counts are secondary UI.
      }
    }

    void loadProfile();
    void loadCounts();

    return () => {
      active = false;
    };
  }, []);
'@

# Do not let the Square API block the whole overview page.
$path = "app/components/account-profile-page.tsx"
Replace-Exact $path '  const [balance, setBalance] = useState(0);' @'
  const [balance, setBalance] = useState(0);
  const [loyaltyReady, setLoyaltyReady] = useState(false);
'@

Replace-Exact $path @'
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [current, orders, reviews, loyaltyBalance] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
          loadCustomerReviews(),
          loadLoyaltyBalance(),
        ]);
        if (!active) return;
        setProfile(current);
        if (current) {
          setName(current.name);
          setEmail(current.email);
          setPhone(current.phone);
          setBirthday(current.birthday ?? "");
          setPhoneModalOpen(backendMode === "supabase" && !current.phone);
        }
        setBalance(loyaltyBalance ?? 0);
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
      } finally {
        if (active) setReady(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [backendMode]);
'@ @'
  useEffect(() => {
    let active = true;

    async function loadCoreAccount() {
      try {
        const [current, orders, reviews] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setProfile(current);
        if (current) {
          setName(current.name);
          setEmail(current.email);
          setPhone(current.phone);
          setBirthday(current.birthday ?? "");
          setPhoneModalOpen(backendMode === "supabase" && !current.phone);
        }
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
      } finally {
        if (active) setReady(true);
      }
    }

    async function loadSquareLoyalty() {
      const loyaltyBalance = await loadLoyaltyBalance();
      if (!active) return;
      if (loyaltyBalance !== null) setBalance(loyaltyBalance);
      setLoyaltyReady(true);
    }

    void loadCoreAccount();
    void loadSquareLoyalty();

    return () => {
      active = false;
    };
  }, [backendMode]);
'@

Replace-Exact $path @'
      const loyaltyBalance = await loadLoyaltyBalance();
      if (loyaltyBalance !== null) setBalance(loyaltyBalance);
'@ @'
      setLoyaltyReady(false);
      const loyaltyBalance = await loadLoyaltyBalance();
      if (loyaltyBalance !== null) setBalance(loyaltyBalance);
      setLoyaltyReady(true);
'@

Replace-Exact $path @'
          <strong>{balance.toLocaleString()}</strong>
          <small>{progress}% toward {DRIP_REWARD_TARGET.toLocaleString()} Drip Points</small>
          <i aria-hidden="true"><b style={{ width: `${progress}%` }} /></i>
'@ @'
          <strong>{loyaltyReady ? balance.toLocaleString() : "…"}</strong>
          <small>{loyaltyReady ? `${progress}% toward ${DRIP_REWARD_TARGET.toLocaleString()} Drip Points` : "Syncing Square Loyalty…"}</small>
          <i aria-hidden="true"><b style={{ width: `${loyaltyReady ? progress : 0}%` }} /></i>
'@

# Deduplicate repeated profile/orders/reviews requests across the persistent shell and route content.
$path = "app/lib/customer-backend.ts"

Replace-Exact $path @'
export function customerBackendMode(): CustomerBackendMode {
  return isSupabaseBrowserConfigured() ? "supabase" : "local-fallback";
}
'@ @'
export function customerBackendMode(): CustomerBackendMode {
  return isSupabaseBrowserConfigured() ? "supabase" : "local-fallback";
}

const ACCOUNT_DATA_CACHE_TTL_MS = 20_000;

type TimedRequest<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

let currentCustomerCache: TimedRequest<CustomerProfile | null> | null = null;
let customerOrdersCache: TimedRequest<CustomerOrder[]> | null = null;
let customerReviewsCache: TimedRequest<CustomerReview[]> | null = null;

function cachedRequest<T>(
  cache: TimedRequest<T> | null,
  setCache: (entry: TimedRequest<T> | null) => void,
  loader: () => Promise<T>,
) {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.promise;

  const promise = loader();
  setCache({ expiresAt: now + ACCOUNT_DATA_CACHE_TTL_MS, promise });
  void promise.catch(() => setCache(null));
  return promise;
}

function clearAccountDataCache() {
  currentCustomerCache = null;
  customerOrdersCache = null;
  customerReviewsCache = null;
}
'@

Replace-Exact $path 'export async function loadCurrentCustomer() {' 'async function loadCurrentCustomerFresh() {'

Replace-Exact $path @'
export async function updateCurrentCustomer(input: {
'@ @'
export function loadCurrentCustomer(): Promise<CustomerProfile | null> {
  if (!isSupabaseBrowserConfigured()) return loadCurrentCustomerFresh();

  return cachedRequest(
    currentCustomerCache,
    (entry) => {
      currentCustomerCache = entry;
    },
    loadCurrentCustomerFresh,
  );
}

export async function updateCurrentCustomer(input: {
'@

Replace-Exact $path @'
  if (!squareResponse.ok) {
    throw new Error("Profile saved, but Square customer sync failed.");
  }
  return mapProfile(data as CustomerRow);
'@ @'
  if (!squareResponse.ok) {
    throw new Error("Profile saved, but Square customer sync failed.");
  }

  currentCustomerCache = null;
  return mapProfile(data as CustomerRow);
'@

Replace-Exact $path @'
export async function signOutCurrentCustomer() {
  const supabase = getBrowserClientOrNull();
'@ @'
export async function signOutCurrentCustomer() {
  clearAccountDataCache();
  const supabase = getBrowserClientOrNull();
'@

Replace-Exact $path 'export async function loadCustomerOrders(): Promise<CustomerOrder[]> {' 'async function loadCustomerOrdersFresh(): Promise<CustomerOrder[]> {'

Replace-Exact $path @'
export async function loadCustomerOrder(orderId: string) {
'@ @'
export function loadCustomerOrders(): Promise<CustomerOrder[]> {
  if (!isSupabaseBrowserConfigured()) return loadCustomerOrdersFresh();

  return cachedRequest(
    customerOrdersCache,
    (entry) => {
      customerOrdersCache = entry;
    },
    loadCustomerOrdersFresh,
  );
}

export async function loadCustomerOrder(orderId: string) {
'@

Replace-Exact $path 'export async function loadCustomerReviews(): Promise<CustomerReview[]> {' 'async function loadCustomerReviewsFresh(): Promise<CustomerReview[]> {'

Replace-Exact $path @'
export async function saveReview(input: {
'@ @'
export function loadCustomerReviews(): Promise<CustomerReview[]> {
  if (!isSupabaseBrowserConfigured()) return loadCustomerReviewsFresh();

  return cachedRequest(
    customerReviewsCache,
    (entry) => {
      customerReviewsCache = entry;
    },
    loadCustomerReviewsFresh,
  );
}

export async function saveReview(input: {
'@

Replace-Exact $path @'
  if (error) throw error;
  return mapReview(data as ReviewRow);
}
'@ @'
  if (error) throw error;
  customerReviewsCache = null;
  return mapReview(data as ReviewRow);
}
'@

Write-Host "Optimisation applied." -ForegroundColor Green
Write-Host "Run: npm run dev"
Write-Host "Then test /account and switch between Orders / Drip Points / Reviews."
