import { AnyObject } from 'types';

export function toPaginationToken(dynamoKey: AnyObject): string {
  return Buffer.from(JSON.stringify(dynamoKey), 'utf-8').toString('base64');
}

export function fromPaginationToken(token: string): AnyObject | undefined {
  try {
    const result = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    if (result === null || typeof result !== 'object' || Array.isArray(result)) return;

    return result;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Db pagination token parse error');
  }
}
