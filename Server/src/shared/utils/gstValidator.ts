export const validateGSTIN = (gstin: string): boolean => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstin || gstin.length !== 15) {
    return false;
  }

  return regex.test(gstin);
};

/**
 * Validate PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 */
export const validatePAN = (pan: string): boolean => {
  if (!pan || pan.length !== 10) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
};

/**
 * Characters 3–12 of a GSTIN embed the PAN of the taxpayer.
 * Returns true if the PAN is consistent with the given GSTIN.
 */
export const validateGstPanConsistency = (gstin: string, pan: string): boolean => {
  if (!validateGSTIN(gstin) || !validatePAN(pan)) return false;
  const panInGstin = gstin.substring(2, 12).toUpperCase();
  return panInGstin === pan.toUpperCase();
};

/**
 * First two digits of a GSTIN represent the state code.
 * Returns empty string if GSTIN is invalid.
 */
export const extractStateCodeFromGstin = (gstin: string): string => {
  if (!validateGSTIN(gstin)) return "";
  return gstin.substring(0, 2);
};
