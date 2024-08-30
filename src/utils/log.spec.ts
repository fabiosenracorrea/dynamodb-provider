/* eslint-disable @typescript-eslint/no-empty-function */

import { printLog } from './log';

describe('log helpers', () => {
  describe('print log', () => {
    it('should be use console.log', () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      printLog('some log');

      expect(consoleLogMock).toHaveBeenCalledWith('some log');

      consoleLogMock.mockRestore();
    });

    it('should accept any param count', () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const params = ['some', 'log', 'hello', 'shout', 'another', 'one-more', 'la-top'];

      printLog(...params);

      expect(consoleLogMock).toHaveBeenCalledTimes(params.length);

      params.forEach((text) => {
        expect(consoleLogMock).toHaveBeenCalledWith(text);
      });

      consoleLogMock.mockRestore();
    });

    it('should JSON.stringify any complex param', () => {
      const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});

      const obj = { hello: '1', but: 'yes' };

      printLog(obj);

      const result = JSON.stringify(obj, null, 2);

      expect(consoleLogMock).toHaveBeenCalledWith(result);

      consoleLogMock.mockRestore();
    });
  });
});
