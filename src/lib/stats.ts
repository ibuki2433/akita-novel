import fs from "fs";
import path from "path";

const STATS_FILE = path.join(process.cwd(), "data", "stats.json");

// Active reader window: 45 seconds timeout for live presence
const ACTIVE_TIMEOUT_MS = 45 * 1000;

export interface NovelStats {
  totalViews: number;
  uniqueVisitors: number;
  activeReaders: number;
  visitorIds: string[];
  activeSessions?: Record<string, number>; // visitorId -> timestamp (ms)
  volumes: {
    part1: number;
    special: number;
  };
  chapters: Record<
    string,
    {
      views: number;
      lastReadAt: string;
    }
  >;
}

const DEFAULT_STATS: NovelStats = {
  totalViews: 0,
  uniqueVisitors: 0,
  activeReaders: 0,
  visitorIds: [],
  activeSessions: {},
  volumes: {
    special: 0,
    part1: 0,
  },
  chapters: {},
};

function readStatsFile(): NovelStats {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      fs.writeFileSync(STATS_FILE, JSON.stringify(DEFAULT_STATS, null, 2), "utf8");
      return { ...DEFAULT_STATS };
    }
    const raw = fs.readFileSync(STATS_FILE, "utf8");
    const data = JSON.parse(raw);
    if (!data.activeSessions) data.activeSessions = {};
    if (!data.volumes) data.volumes = { special: 0, part1: 0 };
    if (!data.chapters) data.chapters = {};
    if (!data.visitorIds) data.visitorIds = [];
    return data;
  } catch (error) {
    console.error("Error reading stats file:", error);
    return { ...DEFAULT_STATS };
  }
}

function writeStatsFile(stats: NovelStats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing stats file:", error);
  }
}

export function getStats(visitorId?: string): NovelStats {
  const data = readStatsFile();
  const now = Date.now();

  // Clean up inactive sessions past the window
  let sessionModified = false;
  if (data.activeSessions) {
    for (const [id, lastTime] of Object.entries(data.activeSessions)) {
      if (now - lastTime > ACTIVE_TIMEOUT_MS) {
        delete data.activeSessions[id];
        sessionModified = true;
      }
    }
  } else {
    data.activeSessions = {};
    sessionModified = true;
  }

  // If visitorId provided, record live presence heartbeat
  if (visitorId) {
    data.activeSessions[visitorId] = now;
    sessionModified = true;

    // Track unique visitor
    if (!data.visitorIds.includes(visitorId)) {
      if (data.visitorIds.length > 20000) data.visitorIds.shift();
      data.visitorIds.push(visitorId);
      data.uniqueVisitors = data.visitorIds.length;
    }
  }

  // True active readers count based on live connected sessions
  data.activeReaders = Object.keys(data.activeSessions).length;

  if (sessionModified) {
    writeStatsFile(data);
  }

  return data;
}

export function recordView(slug: string, volume: "part1" | "special", visitorId?: string): NovelStats {
  try {
    const stats = getStats(visitorId);

    // Increment overall views from 0
    stats.totalViews = (stats.totalViews || 0) + 1;

    // Increment volume views
    if (!stats.volumes) {
      stats.volumes = { part1: 0, special: 0 };
    }
    stats.volumes[volume] = (stats.volumes[volume] || 0) + 1;

    // Increment chapter views
    if (!stats.chapters) {
      stats.chapters = {};
    }
    if (!stats.chapters[slug]) {
      stats.chapters[slug] = { views: 0, lastReadAt: new Date().toISOString() };
    }
    stats.chapters[slug].views = (stats.chapters[slug].views || 0) + 1;
    stats.chapters[slug].lastReadAt = new Date().toISOString();

    writeStatsFile(stats);
    return stats;
  } catch (error) {
    console.error("Error saving view stats:", error);
    return getStats();
  }
}
