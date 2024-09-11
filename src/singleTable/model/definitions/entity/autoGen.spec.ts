/* eslint-disable @typescript-eslint/no-explicit-any */
import { getId } from '../../../../utils/id';
import { removeUndefinedProps } from '../../../../utils/object';

import { addAutoGenParams } from './autoGen';

jest.mock('../../../../utils/id', () => ({
  getId: jest.fn(),
}));

jest.mock('../../../../utils/object', () => ({
  removeUndefinedProps: jest.fn((obj) => obj),
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
    const values = { id: '123', name: 'John Doe' };
    const genConfig = { id: 'UUID' };

    (getId as jest.Mock).mockReturnValue('mocked-uuid');

    const result = addAutoGenParams(values, genConfig);

    expect(result).toEqual({ id: 'mocked-uuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('UUID');
  });

  it('should correctly generate values using KSUID generator', () => {
    const values = { id: '123', name: 'John Doe' };
    const genConfig = { id: 'KSUID' };

    (getId as jest.Mock).mockReturnValue('mocked-ksuid');

    const result = addAutoGenParams(values, genConfig);

    expect(result).toEqual({ id: 'mocked-ksuid', name: 'John Doe' });
    expect(getId).toHaveBeenCalledWith('KSUID');
  });

  it('should correctly generate values using timestamp generator', () => {
    const values = { id: '123', name: 'John Doe', createdAt: '' };
    const genConfig = { createdAt: 'timestamp' };

    const mockTimestamp = '2024-01-01T00:00:00.000Z';

    jest.useFakeTimers().setSystemTime(new Date(mockTimestamp));

    const result = addAutoGenParams(values, genConfig);

    expect(result).toEqual({ id: '123', name: 'John Doe', createdAt: mockTimestamp });

    jest.useRealTimers();
  });

  it('should correctly generate values using count generator', () => {
    const values = { id: '123', name: 'John Doe', counter: 5 };
    const genConfig = { counter: 'count' };

    const result = addAutoGenParams(values, genConfig);

    expect(result).toEqual({ id: '123', name: 'John Doe', counter: 0 });
  });

  it('should handle custom function generators', () => {
    const values = { id: '123', name: 'John Doe', custom: 'initial' };
    const genConfig = { custom: () => 'custom-generated-value' };

    const result = addAutoGenParams(values, genConfig);

    expect(result).toEqual({ id: '123', name: 'John Doe', custom: 'custom-generated-value' });
  });

  it('should remove undefined properties using removeUndefinedProps', () => {
    const values = { name: 'John Doe', some: undefined };
    const genConfig = { age: 'count' };

    addAutoGenParams(values, genConfig);

    expect(removeUndefinedProps).toHaveBeenCalledWith({ name: 'John Doe', age: 0 });
  });
});