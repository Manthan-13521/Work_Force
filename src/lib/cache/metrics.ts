const snapshot = { hits: 0, misses: 0, refreshes: 0, evictions: 0, sets: 0 };
let lastReset = Date.now();

export const cacheMetrics = {
  hit() {
    snapshot.hits++;
  },
  miss() {
    snapshot.misses++;
  },
  refresh() {
    snapshot.refreshes++;
  },
  eviction() {
    snapshot.evictions++;
  },
  set() {
    snapshot.sets++;
  },
  reset() {
    snapshot.hits = 0;
    snapshot.misses = 0;
    snapshot.refreshes = 0;
    snapshot.evictions = 0;
    snapshot.sets = 0;
    lastReset = Date.now();
  },
  stats() {
    const total = snapshot.hits + snapshot.misses;
    return {
      hits: snapshot.hits,
      misses: snapshot.misses,
      sets: snapshot.sets,
      refreshes: snapshot.refreshes,
      evictions: snapshot.evictions,
      ratio: total > 0 ? `${((snapshot.hits / total) * 100).toFixed(1)}%` : "0%",
      uptime: Date.now() - lastReset,
    };
  },
};
