const CodeService = require('../services/codeService');

describe('FoodLoop Handover Security & Code Verification Tests', () => {
  test('CodeService generates a 6-digit numeric string', () => {
    const code = CodeService.generateCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  test('CodeService securely hashes and verifies valid OTP', () => {
    const code = '582914';
    const hash = CodeService.hashCode(code);
    expect(hash).toHaveLength(64); // SHA-256 hex string

    // Correct code succeeds
    const verifyCorrect = CodeService.verifyCode('582914', hash);
    expect(verifyCorrect).toBe(true);

    // Incorrect code fails
    const verifyWrong = CodeService.verifyCode('123456', hash);
    expect(verifyWrong).toBe(false);
  });

  test('CodeService handles whitespaces and bad inputs gracefully', () => {
    const code = '771234';
    const hash = CodeService.hashCode(code);

    expect(CodeService.verifyCode(' 771234 ', hash)).toBe(true);
    expect(CodeService.verifyCode('', hash)).toBe(false);
    expect(CodeService.verifyCode(null, hash)).toBe(false);
  });
});
