/* eslint-disable @typescript-eslint/no-explicit-any */
import { waitExponentially } from './backOff';

describe('backOff utils', () => {
  describe('waitExponentially', () => {
    it('should wait exponentially based on the count', async () => {
      const setTimeoutMock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return 0 as any;
      });

      const counts = [0, 1, 3, 5, 8, 10, 20];

      await Promise.all(
        counts.map(async (count) => {
          await waitExponentially(count);

          expect(setTimeoutMock).toHaveBeenCalledWith(
            expect.any(Function),
            2 ** count * 10,
          );
        }),
      );

      setTimeoutMock.mockRestore();
    });
  });
});
