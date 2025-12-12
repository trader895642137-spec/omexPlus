import { getGroups } from "./omexApi";

const INTERVAL = 30 * 60 * 1000; // ۳۰ دقیقه
const STORAGE_KEY = "strategyGroupsLogs";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Error reading logs:", err);
    return {};
  }
}

function saveLogs(logs) {
  try {
    const keys = Object.keys(logs).sort().reverse(); // جدید → قدیم
    const trimmed = {};

    for (let i = 0; i < Math.min(3, keys.length); i++) {
      trimmed[keys[i]] = logs[keys[i]];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Error saving logs:", err);
  }
}



async function collectLog() {
  try {
    const data = await getGroups();
    if (!data) return; // اگر چیزی نیاومد لاگ نمی‌زنیم

    const logs = loadLogs();
    const today = getTodayKey();
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!logs[today]) logs[today] = [];

    logs[today].push({
      time: now,
      data,
    });

    saveLogs(logs);

  } catch (err) {
    // هر خطای غیرمنتظره
    console.error("Unexpected error inside collectLog:", err);
  }
}




export const strategyGroupsLogger = {
    collectLog,
    runInterval() {
        try {
            collectLog(); // اگر این throw کند catch آبشاری نمی‌شود
        } catch (err) {
            console.error("Error in runInterval wrapper:", err);
            setInterval(() => {
                try {
                    collectLog(); // اگر این throw کند catch آبشاری نمی‌شود
                } catch (err) {
                    console.error("Error in setInterval wrapper:", err);
                }
            }, INTERVAL);
        }
        // تکرار با فاصله نیم ساعت


    }
}