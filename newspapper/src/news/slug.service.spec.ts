import { SlugService } from './slug.service';

describe('SlugService', () => {
  const service = new SlugService();

  describe('normalize', () => {
    it('lowercases, removes accents and joins with hyphens', () => {
      expect(service.normalize('Año Nuevo: ¿Cómo celebrarlo?')).toBe(
        'ano-nuevo-como-celebrarlo',
      );
    });

    it('handles ñ, ü and mixed case', () => {
      expect(service.normalize('Niño ÜBER Grande')).toBe('nino-uber-grande');
    });

    it('collapses separators and trims', () => {
      expect(service.normalize('  hola---mundo__test  ')).toBe(
        'hola-mundo-test',
      );
    });

    it('strips characters not allowed', () => {
      expect(service.normalize('Título (100%) #1!')).toBe('titulo-100-1');
    });

    it('throws on empty result', () => {
      expect(() => service.normalize('!!!')).toThrow();
    });
  });

  describe('assertAvailable', () => {
    it('accepts a free slug', async () => {
      const exists = () => Promise.resolve(false);
      await expect(
        service.assertAvailable('titulo-largo', exists),
      ).resolves.toBeUndefined();
    });

    it('rejects a duplicated slug', async () => {
      const exists = () => Promise.resolve(true);
      await expect(service.assertAvailable('titulo', exists)).rejects.toThrow(
        'Slug already in use',
      );
    });
  });
});
