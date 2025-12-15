import { randomUUID } from 'crypto';

import KSUID from 'ksuid';

import { getId } from './id';

jest.mock('crypto');
jest.mock('ksuid');

describe('getId', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should return a UUID when type is "UUID"', () => {
    (randomUUID as jest.Mock).mockReturnValue('mocked-uuid');

    const result = getId('UUID');

    expect(result).toBe('mocked-uuid');
    expect(randomUUID).toHaveBeenCalled();
  });

  it('should return a KSUID when type is "KSUID"', () => {
    const mockKSUID = { string: 'mocked-ksuid' };
    (KSUID.randomSync as jest.Mock).mockReturnValue(mockKSUID);

    const result = getId('KSUID');

    expect(result).toBe('mocked-ksuid');
    expect(KSUID.randomSync).toHaveBeenCalled();
  });
});
