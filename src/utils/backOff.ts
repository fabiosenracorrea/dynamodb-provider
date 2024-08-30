function calculateExponentialBackOff(retries: number): number {
  const backOff = 2 ** retries * 10;

  return backOff;
}

// eslint-disable-next-line no-promise-executor-return
const wait = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

export async function waitExponentially(tries: number): Promise<void> {
  await wait(calculateExponentialBackOff(tries));
}
