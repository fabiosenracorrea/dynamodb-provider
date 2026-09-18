export function getEpochTime(date: Date): number {
  // DynamoDB TTL should be in EPOCH format
  // EPOCH = number of seconds elapsed since 1/1/1970 UTC
  // getTime() returns the MIL seconds amount
  const asEpochTime = Math.floor(date.getTime() / 1000);

  return asEpochTime;
}

export function ensureEpoch(date: number | Date) {
  return typeof date === 'number' ? date : getEpochTime(date);
}
