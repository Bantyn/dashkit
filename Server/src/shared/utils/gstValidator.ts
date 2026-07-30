export const validateGSTIN = (gstin: string): boolean => {
  if (!gstin) return false;
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) return false;
  // Validates Indian GSTIN format (State Code + PAN + Entity Code + Z/AlphaNum + Checksum)
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z0-9A-Z]{1}[0-9A-Z]{1}$/;
  return regex.test(cleaned);
};

/**
 * Validate PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 */
export const validatePAN = (pan: string): boolean => {
  if (!pan) return false;
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned);
};

/**
 * Characters 3–12 of a GSTIN embed the PAN of the taxpayer.
 * Returns true if the PAN is consistent with the given GSTIN.
 */
export const validateGstPanConsistency = (gstin: string, pan: string): boolean => {
  if (!gstin || !pan || !pan.trim()) return true;
  const cleanGst = gstin.trim().toUpperCase();
  const cleanPan = pan.trim().toUpperCase();
  if (!validateGSTIN(cleanGst) || !validatePAN(cleanPan)) return true;
  const panInGstin = cleanGst.substring(2, 12);
  return panInGstin === cleanPan;
};

/**
 * First two digits of a GSTIN represent the state code.
 * Returns empty string if GSTIN is invalid.
 */
export const extractStateCodeFromGstin = (gstin: string): string => {
  if (!validateGSTIN(gstin)) return "";
  return gstin.trim().toUpperCase().substring(0, 2);
};
