const ActivityLog = require('../models/ActivityLog');
const FraudFlag = require('../models/FraudFlag');

const MAX_DAILY_STEPS = 40000;
const MAX_SPEED_KMH = 45; // max plausible walking/running speed
const SPIKE_THRESHOLD = 5; // 5x overnight increase = suspicious
const EARTH_RADIUS_KM = 6371;

/**
 * AI Fraud Detection Service
 * Implements Section 4.1 - rule-based checks (upgradeable to ML later)
 */
async function checkForFraud(userId, activityData) {
  const flags = [];

  // 1. Max daily step cap check
  if (activityData.raw_value > MAX_DAILY_STEPS) {
    flags.push({
      reason: `Step count ${activityData.raw_value} exceeds maximum plausible daily limit of ${MAX_DAILY_STEPS}`,
      severity: 'high'
    });
  }

  // 2. GPS plausibility check (impossible location jumps)
  if (activityData.gps_lat && activityData.gps_lng) {
    const lastLog = await ActivityLog.findOne({
      user_id: userId,
      gps_lat: { $ne: null },
      _id: { $ne: activityData._id }
    }).sort({ timestamp: -1 });

    if (lastLog && lastLog.gps_lat && lastLog.gps_lng) {
      const distance = haversineDistance(
        lastLog.gps_lat, lastLog.gps_lng,
        activityData.gps_lat, activityData.gps_lng
      );
      const timeDiffHours = (new Date(activityData.timestamp) - new Date(lastLog.timestamp)) / (1000 * 60 * 60);
      
      if (timeDiffHours > 0) {
        const speed = distance / timeDiffHours;
        if (speed > MAX_SPEED_KMH && timeDiffHours < 2) {
          flags.push({
            reason: `Impossible location jump: ${Math.round(distance)}km in ${timeDiffHours.toFixed(1)}hrs (${Math.round(speed)}km/h)`,
            severity: 'high'
          });
        }
      }
    }
  }

  // 3. Duplicate submission detection
  const duplicates = await ActivityLog.find({
    user_id: userId,
    date: activityData.date,
    _id: { $ne: activityData._id }
  });

  if (duplicates.length > 0) {
    flags.push({
      reason: `Duplicate activity submission for date ${activityData.date}`,
      severity: 'medium'
    });
  }

  // 4. Device sharing detection
  if (activityData.device_id) {
    const otherUsers = await ActivityLog.find({
      device_id: activityData.device_id,
      user_id: { $ne: userId },
      date: activityData.date
    }).distinct('user_id');

    if (otherUsers.length > 0) {
      flags.push({
        reason: `Device ${activityData.device_id} used by ${otherUsers.length + 1} different accounts on same day`,
        severity: 'high'
      });
    }
  }

  // 5. Statistical anomaly detection (sudden spike)
  const recentLogs = await ActivityLog.find({
    user_id: userId,
    is_flagged: false,
    date: { $lt: activityData.date }
  }).sort({ date: -1 }).limit(7);

  if (recentLogs.length >= 3) {
    const avgSteps = recentLogs.reduce((sum, log) => sum + log.raw_value, 0) / recentLogs.length;
    if (avgSteps > 0 && activityData.raw_value > avgSteps * SPIKE_THRESHOLD) {
      flags.push({
        reason: `Abnormal spike: ${activityData.raw_value} steps vs 7-day avg of ${Math.round(avgSteps)} (${(activityData.raw_value / avgSteps).toFixed(1)}x increase)`,
        severity: 'medium'
      });
    }
  }

  return flags;
}

/**
 * Create fraud flag records in database
 */
async function createFraudFlags(activityLogId, userId, flags) {
  const fraudFlags = [];
  for (const flag of flags) {
    const fraudFlag = await FraudFlag.create({
      activity_log_id: activityLogId,
      user_id: userId,
      reason: flag.reason,
      status: 'pending'
    });
    fraudFlags.push(fraudFlag);
  }
  return fraudFlags;
}

/**
 * Haversine formula - distance between two GPS coordinates
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg) { return deg * (Math.PI / 180); }

module.exports = { checkForFraud, createFraudFlags };
