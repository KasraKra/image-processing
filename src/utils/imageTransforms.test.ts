import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyLogTransform,
  applyPowerLawTransform,
  applyMedianFilter,
  applyBoxFilter,
  addSaltAndPepperNoise,
  calculateHistogram,
  buildGonzalezJupyterNotebook
} from './imageTransforms';

test('applyLogTransform scales dynamic range correctly', () => {
  // 1x3 grayscale image: [0, 50, 255] in RGBA
  const input = new Uint8ClampedArray([
    0, 0, 0, 255,
    50, 50, 50, 255,
    255, 255, 255, 255
  ]);

  const { output, effectiveC } = applyLogTransform(input);

  // maxR is 255, so effectiveC = 255 / ln(1 + 255) ≈ 45.986
  assert.ok(effectiveC > 45 && effectiveC < 47, `effectiveC should be ~46, got ${effectiveC}`);

  // r=0 -> s=0
  assert.equal(output[0], 0);
  // r=255 -> s=255
  assert.equal(output[8], 255);

  // r=50 -> s = 45.986 * ln(51) ≈ 180.8 -> significant expansion of dark value
  assert.ok(output[4] > 170 && output[4] < 190, `r=50 should expand to ~180, got ${output[4]}`);
});

test('applyPowerLawTransform handles gamma < 1 and gamma > 1 correctly', () => {
  // RGBA pixel with middle-gray value 64 (0.25 of 255)
  const input = new Uint8ClampedArray([64, 64, 64, 255]);

  // Gamma = 0.5 (square root): (64/255)^0.5 ≈ 0.501 -> output ≈ 128 (brightens dark values)
  const resGammaLow = applyPowerLawTransform(input, 0.5, 1.0);
  assert.ok(resGammaLow.output[0] > 120 && resGammaLow.output[0] < 135,
    `Gamma 0.5 on 64 should brighten to ~128, got ${resGammaLow.output[0]}`);

  // Gamma = 2.0 (square): (64/255)^2.0 ≈ 0.063 -> output ≈ 16 (darkens/compresses values)
  const resGammaHigh = applyPowerLawTransform(input, 2.0, 1.0);
  assert.ok(resGammaHigh.output[0] > 10 && resGammaHigh.output[0] < 20,
    `Gamma 2.0 on 64 should darken to ~16, got ${resGammaHigh.output[0]}`);

  // Gamma = 1.0 (identity): output should match input exactly
  const resIdentity = applyPowerLawTransform(input, 1.0, 1.0);
  assert.equal(resIdentity.output[0], 64);
});

test('applyMedianFilter removes impulse noise without blurring uniform regions', () => {
  // 3x3 uniform image (all 100), with center corrupted to pure salt noise (255)
  const width = 3;
  const height = 3;
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(100);

  // Center pixel (x=1, y=1) -> index (1*3 + 1)*4 = 16
  data[16] = 255;
  data[17] = 255;
  data[18] = 255;

  const medianResult = applyMedianFilter(data, width, height, 3);
  // Center pixel median of 8 values of 100 and 1 value of 255 is 100!
  assert.equal(medianResult[16], 100, `Median filter center pixel should be 100, got ${medianResult[16]}`);

  // In contrast, Box/Mean filter dilutes the noise into a gray blur: (8*100 + 255)/9 = 117
  const boxResult = applyBoxFilter(data, width, height, 3);
  assert.equal(boxResult[16], 117, `Box filter center pixel should be 117, got ${boxResult[16]}`);
});

test('addSaltAndPepperNoise introduces impulse noise', () => {
  const width = 20;
  const height = 20;
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(128);

  const noisy = addSaltAndPepperNoise(data, 0.1, 0.1, 1234);

  let saltCount = 0;
  let pepperCount = 0;
  for (let i = 0; i < noisy.length; i += 4) {
    if (noisy[i] === 255) saltCount++;
    if (noisy[i] === 0) pepperCount++;
  }

  assert.ok(saltCount > 10, `Expected at least 10 salt pixels, got ${saltCount}`);
  assert.ok(pepperCount > 10, `Expected at least 10 pepper pixels, got ${pepperCount}`);
});

test('calculateHistogram calculates accurate distribution statistics', () => {
  const width = 4;
  const height = 1;
  const data = new Uint8ClampedArray([
    10, 10, 10, 255,
    20, 20, 20, 255,
    30, 30, 30, 255,
    40, 40, 40, 255
  ]);

  const hist = calculateHistogram(data, width, height);
  assert.equal(hist.min, 10);
  assert.equal(hist.max, 40);
  assert.equal(hist.mean, 25);
  assert.equal(hist.bins[10], 1);
  assert.equal(hist.bins[20], 1);
  assert.equal(hist.bins[30], 1);
  assert.equal(hist.bins[40], 1);
});

test('buildGonzalezJupyterNotebook produces a valid nbformat v4 structure', () => {
  const nb = buildGonzalezJupyterNotebook();
  assert.equal(nb.nbformat, 4);
  assert.equal(nb.nbformat_minor, 5);
  assert.ok(Array.isArray(nb.cells));
  assert.ok(nb.cells.length >= 8);

  // Check specific required topics
  const allText = nb.cells.map(c => c.source.join('\n')).join('\n');
  assert.ok(allText.includes('Logarithmic Transformations'), 'Missing log transform');
  assert.ok(allText.includes('Power-Law (Gamma) Transformations'), 'Missing gamma transform');
  assert.ok(allText.includes('Median Filtering'), 'Missing median filtering');
  assert.ok(allText.includes('Gonzalez & Woods'), 'Missing textbook citation');
});
