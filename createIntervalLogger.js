export function createIntervalLogger({ key, interval, sync }) {
  if (!key || !interval || typeof sync !== "function") {
    throw new Error("Invalid logger configuration");
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadLogs() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveLogs(logs) {
    try {
      const keys = Object.keys(logs).sort().reverse();
      const trimmed = {};

      for (let i = 0; i < Math.min(3, keys.length); i++) {
        trimmed[keys[i]] = logs[keys[i]];
      }

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {}
  }

  function canCollect(logs) {
    const today = getTodayKey();
    const todayLogs = logs[today];
    if (!todayLogs || todayLogs.length === 0) return true;

    const lastLog = todayLogs[todayLogs.length - 1];
    return Date.now() - lastLog.timestamp >= interval;
  }

  async function collect(isForce) {
    try {
      const logs = loadLogs();

      // ⛔ قبل از sync

      if (!isForce && !canCollect(logs)) return;

      const data = await sync();

      const today = getTodayKey();
      const nowTs = Date.now();

      if (!logs[today]) logs[today] = [];

      logs[today].push({
        time: new Date(nowTs).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: nowTs,
        data,
      });

      saveLogs(logs);

    } catch (err) {
      console.error(`Logger [${key}] error:`, err);
    }
  }

  // اجراها
  collect();
  const timer = setInterval(collect, interval);

  // API خروجی
  return {
    stop() {
      clearInterval(timer);
    },
    runNow() {
      collect();
    },
    saveLogs:collect,
    getLogs() {
      return loadLogs();
    },
    clear() {
      localStorage.removeItem(key);
    }
  };
}