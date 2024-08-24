/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function printLog(...logs: any[]): void {
  logs.forEach((log) => {
    console.log(typeof log === 'string' ? log : JSON.stringify(log, null, 2));
  });
}
