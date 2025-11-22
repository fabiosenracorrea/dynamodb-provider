import KSUID from 'ksuid';
import { randomUUID } from 'crypto';

function getUUID(): string {
  return randomUUID();
}

function getKSUID(): string {
  return KSUID.randomSync().string;
}

export function getId(type: 'UUID' | 'KSUID'): string {
  return type === 'UUID' ? getUUID() : getKSUID();
}
