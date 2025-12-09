/* eslint-disable @typescript-eslint/no-explicit-any */
import { getId } from '../../../../utils/id';
import { omitUndefined } from '../../../../utils/object';

import { addAutoGenParams } from './autoGen';

jest.mock('../../../../utils/id', () => ({
  getId: jest.fn(),
}));

jest.mock('../../../../utils/object', () => ({
  omitUndefined: jest.fn((obj) =>
    Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)),
  ),
}));

describe('single table model: addAutoGenParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should return the original values if no genConfig is provided', () => {
    const values = { id: '123', name: 'John Doe' };

    const result = addAutoGenParams(values);

    expect(result).toStrictEqual(values);
  });

  it('should correctly generate values using UUID generator', () => {
    const values = { name: 'John Doe' };

    (getId as jest.Mock).mockReturnValue('mocked-uuid');

    const result = addAutoGenParams(values, { id: 'UUID' });

    expect(result).toEqual({ id: 'mocked-uuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('UUID');
  });

  it('should correctly generate values using KSUID generator', () => {
    const values = { name: 'John Doe' };

    (getId as jest.Mock).mockReturnValue('mocked-ksuid');

    const result = addAutoGenParams(values, { id: 'KSUID' });

    expect(result).toEqual({ id: 'mocked-ksuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('KSUID');
  });

  it('should correctly generate values using timestamp generator', () => {
    const values = { id: '123', name: 'John Doe' };

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const result = addAutoGenParams(values, { createdAt: 'timestamp' });

    expect(result).toEqual({ id: '123', name: 'John Doe', createdAt: mockTimestamp });

    jest.useRealTimers();
  });

  it('should correctly generate values using count generator', () => {
    const values = { id: '123', name: 'John Doe' };

    const result = addAutoGenParams(values, { counter: 'count' });

    expect(result).toEqual({ id: '123', name: 'John Doe', counter: 0 });
  });

  it('should handle custom function generators', () => {
    const values = { id: '123', name: 'John Doe' };

    const result = addAutoGenParams(values, { custom: () => 'custom-generated-value' });

    expect(result).toEqual({ id: '123', name: 'John Doe', custom: 'custom-generated-value' });
  });

  it('should remove undefined properties using omitUndefined', () => {
    const values = { name: 'John Doe', some: undefined };

    addAutoGenParams(values, { age: 'count' });

    expect(omitUndefined).toHaveBeenCalledWith({ name: 'John Doe', age: 0 });
  });

  it('should not autogenerate if value is present', () => {
    const values = { id: '123', name: 'John Doe' };

    (getId as jest.Mock).mockReturnValueOnce('mocked-uuid');

    const result = addAutoGenParams(values, { id: 'UUID' });

    expect(result).toEqual(values);
  });

  it('should autogenerate if value is present only as undefined', () => {
    const values = { id: undefined, name: 'John Doe' };

    (getId as jest.Mock).mockReturnValueOnce('mocked-uuid');

    const result = addAutoGenParams(values, { id: 'UUID' });

    expect(result).toEqual({ id: 'mocked-uuid', name: 'John Doe' });
  });
});
