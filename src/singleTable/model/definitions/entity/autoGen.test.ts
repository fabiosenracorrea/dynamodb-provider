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

    const result = addAutoGenParams({ values });

    expect(result).toStrictEqual(values);
  });

  it('should correctly generate values using UUID generator', () => {
    const values = { name: 'John Doe' };

    (getId as jest.Mock).mockReturnValue('mocked-uuid');

    const result = addAutoGenParams({ values, genConfig: { id: 'UUID' } });

    expect(result).toEqual({ id: 'mocked-uuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('UUID');
  });

  it('should correctly generate values using KSUID generator', () => {
    const values = { name: 'John Doe' };

    (getId as jest.Mock).mockReturnValue('mocked-ksuid');

    const result = addAutoGenParams({ values, genConfig: { id: 'KSUID' } });

    expect(result).toEqual({ id: 'mocked-ksuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('KSUID');
  });

  it('should correctly generate values using timestamp generator', () => {
    const values = { id: '123', name: 'John Doe' };

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const result = addAutoGenParams({ values, genConfig: { createdAt: 'timestamp' } });

    expect(result).toEqual({ id: '123', name: 'John Doe', createdAt: mockTimestamp });

    jest.useRealTimers();
  });

  it('should correctly generate values using count generator', () => {
    const values = { id: '123', name: 'John Doe' };

    const result = addAutoGenParams({ values, genConfig: { counter: 'count' } });

    expect(result).toEqual({ id: '123', name: 'John Doe', counter: 0 });
  });

  it('should handle custom function generators in genConfig', () => {
    const values = { id: '123', name: 'John Doe' };

    const result = addAutoGenParams({
      values,
      genConfig: { custom: () => 'custom-generated-value' },
    });

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      custom: 'custom-generated-value',
    });
  });

  it('should remove undefined properties using omitUndefined', () => {
    const values = { name: 'John Doe', some: undefined };

    addAutoGenParams({ values, genConfig: { age: 'count' } });

    expect(omitUndefined).toHaveBeenCalledWith({ name: 'John Doe', age: 0 });
  });

  it('should not autogenerate if value is present', () => {
    const values = { id: '123', name: 'John Doe' };

    (getId as jest.Mock).mockReturnValueOnce('mocked-uuid');

    const result = addAutoGenParams({ values, genConfig: { id: 'UUID' } });

    expect(result).toEqual(values);
  });

  it('should autogenerate if value is present only as undefined', () => {
    const values = { id: undefined, name: 'John Doe' };

    (getId as jest.Mock).mockReturnValueOnce('mocked-uuid');

    const result = addAutoGenParams({ values, genConfig: { id: 'UUID' } });

    expect(result).toEqual({ id: 'mocked-uuid', name: 'John Doe' });
  });

  describe('custom autoGenerators from tableConfig', () => {
    it('should use custom generators from tableConfig', () => {
      const values = { name: 'John Doe' };

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
        autoGenerators: {
          customId: () => 'custom-id-123',
          customHash: () => 'hash-456',
        },
      };

      const result = addAutoGenParams({
        values,
        genConfig: { id: 'customId', hash: 'customHash' },
        tableConfig,
      });

      expect(result).toEqual({
        name: 'John Doe',
        id: 'custom-id-123',
        hash: 'hash-456',
      });
    });

    it('should allow custom generators to override built-in generators', () => {
      const values = { name: 'John Doe' };

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
        autoGenerators: {
          UUID: () => 'my-custom-uuid',
          timestamp: () => 'my-custom-timestamp',
        },
      } as any;

      const result = addAutoGenParams({
        values,
        genConfig: { id: 'UUID', createdAt: 'timestamp' },
        tableConfig,
      });

      expect(result).toEqual({
        name: 'John Doe',
        id: 'my-custom-uuid',
        createdAt: 'my-custom-timestamp',
      });

      // Should not call the built-in getId
      expect(getId).not.toHaveBeenCalled();
    });

    it('should use built-in generators when custom generator is not defined', () => {
      const values = { name: 'John Doe' };

      (getId as jest.Mock).mockReturnValue('mocked-ksuid');

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
        autoGenerators: {
          customId: () => 'custom-id',
        },
      };

      const result = addAutoGenParams({
        values,
        genConfig: { id: 'KSUID', custom: 'customId' },
        tableConfig,
      });

      expect(result).toEqual({
        name: 'John Doe',
        id: 'mocked-ksuid',
        custom: 'custom-id',
      });

      expect(getId).toHaveBeenCalledWith('KSUID');
    });

    it('should mix custom generators, built-in generators, and inline functions', () => {
      const values = { name: 'John Doe' };

      const mockTimestamp = '2024-01-01T00:00:00.000Z';
      jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
        autoGenerators: {
          tenantId: () => 'tenant-123',
        },
      };

      const result = addAutoGenParams({
        values,
        genConfig: {
          tenant: 'tenantId',
          createdAt: 'timestamp',
          status: () => 'active',
          counter: 'count',
        },
        tableConfig,
      });

      expect(result).toEqual({
        name: 'John Doe',
        tenant: 'tenant-123',
        createdAt: mockTimestamp,
        status: 'active',
        counter: 0,
      });

      jest.useRealTimers();
    });

    it('should handle tableConfig without autoGenerators', () => {
      const values = { name: 'John Doe' };

      (getId as jest.Mock).mockReturnValue('mocked-uuid');

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
      } as any;

      const result = addAutoGenParams({
        values,
        genConfig: { id: 'UUID' },
        tableConfig,
      });

      expect(result).toEqual({
        name: 'John Doe',
        id: 'mocked-uuid',
      });

      expect(getId).toHaveBeenCalledWith('UUID');
    });

    it('should not override user-provided values even with custom generators', () => {
      const values = { id: 'user-provided', name: 'John Doe' };

      const tableConfig = {
        table: 'test-table',
        partitionKey: 'pk',
        rangeKey: 'sk',
        autoGenerators: {
          customId: () => 'should-not-be-used',
        },
      };

      const result = addAutoGenParams({
        values,
        genConfig: { id: 'customId' },
        tableConfig,
      });

      expect(result).toEqual({
        id: 'user-provided',
        name: 'John Doe',
      });
    });
  });
});
