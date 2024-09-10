import { v4 as uuidv4 } from 'uuid';
import KSUID from 'ksuid';

import { getId } from './id';

jest.mock('uuid');
jest.mock('ksuid');

describe('getId', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should return a UUID when type is "UUID"', () => {
    (uuidv4 as jest.Mock).mockReturnValue('mocked-uuid');

    const result = getId('UUID');

    expect(result).toBe('mocked-uuid');
    expect(uuidv4).toHaveBeenCalled();
  });

  it('should return a KSUID when type is "KSUID"', () => {
    const mockKSUID = { string: 'mocked-ksuid' };
    (KSUID.randomSync as jest.Mock).mockReturnValue(mockKSUID);

    const result = getId('KSUID');

    expect(result).toBe('mocked-ksuid');
    expect(KSUID.randomSync).toHaveBeenCalled();
  });
});
