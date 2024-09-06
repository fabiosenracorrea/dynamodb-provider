import { v4 } from 'uuid';
import KSUID from 'ksuid';

function getUUID(): string {
  return v4();
}

function getKSUID(): string {
  return KSUID.randomSync().string;
}

export function getId(type: 'UUID' | 'KSUID'): string {
  return type === 'UUID' ? getUUID() : getKSUID();
}
