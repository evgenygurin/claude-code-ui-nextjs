import {
  cn,
  formatFileSize,
  formatDate,
  debounce,
  throttle,
  sanitizeFileName,
  getFileExtension,
  getLanguageFromExtension,
} from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('p-4', 'p-2')).toBe('p-2'); // Tailwind merge should handle conflicts
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2025/);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names', () => {
      expect(sanitizeFileName('file name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('File@Name#123.txt')).toBe('file_name_123.txt');
      expect(sanitizeFileName('UPPERCASE.TXT')).toBe('uppercase.txt');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('component.tsx')).toBe('tsx');
      expect(getFileExtension('no-extension')).toBe('');
      expect(getFileExtension('multiple.dots.js')).toBe('js');
    });
  });

  describe('getLanguageFromExtension', () => {
    it('should map extensions to languages', () => {
      expect(getLanguageFromExtension('js')).toBe('javascript');
      expect(getLanguageFromExtension('tsx')).toBe('typescript');
      expect(getLanguageFromExtension('py')).toBe('python');
      expect(getLanguageFromExtension('unknown')).toBe('text');
    });
  });
});