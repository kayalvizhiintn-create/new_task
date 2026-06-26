/**
 * Frontend validation helpers for email and mobile number.
 */

/**
 * Validates an email address based on strict criteria.
 * Returns a string error message if invalid, or true if valid.
 */
export const validateEmail = (email) => {
  if (email === undefined || email === null) return "Email is required";
  const trimmed = String(email).trim();
  if (trimmed.length === 0) return "Email is required";
  if (trimmed.length > 254) return "Email must not exceed 254 characters";
  if (/\s/.test(trimmed)) return "Email must not contain spaces";
  if (trimmed.includes("..")) return "Email must not contain consecutive dots (..)";
  
  // Basic structure check
  if (!trimmed.includes("@")) return "Email must contain @";
  
  const parts = trimmed.split("@");
  if (parts.length !== 2) return "Email must contain exactly one @ symbol";
  
  const localPart = parts[0];
  const domainPart = parts[1];
  
  if (!localPart) return "Local part (before @) should not be empty";
  if (!domainPart) return "Domain part (after @) should not be empty";
  
  // Allowed special characters in local part: ., _, -, +
  const localRegex = /^[a-zA-Z0-9._+-]+$/;
  if (!localRegex.test(localPart)) {
    return "Email contains invalid special characters. Only (., _, -, +) are allowed in the local part.";
  }
  
  // Allowed characters in domain part: ., -
  const domainRegex = /^[a-zA-Z0-9.-]+$/;
  if (!domainRegex.test(domainPart)) {
    return "Domain contains invalid characters. Only letters, numbers, dots, and hyphens are allowed.";
  }
  
  // Must contain valid domain extension from the allowed list
  if (!domainPart.includes(".")) return "Domain part must contain a dot (.)";
  const lastDotIndex = domainPart.lastIndexOf(".");
  const domainExtension = domainPart.substring(lastDotIndex).toLowerCase();
  
  const allowedExtensions = [".com", ".in", ".org", ".net", ".edu", ".gov", ".co", ".io"];
  if (!allowedExtensions.includes(domainExtension)) {
    return "Email must contain a valid domain extension: " + allowedExtensions.join(", ");
  }
  
  // Block invalid/localhost domains
  const blockedDomains = ["test", "localhost", "example", "invalid"];
  const domainName = domainPart.split(".")[0].toLowerCase();
  if (blockedDomains.includes(domainName) || blockedDomains.includes(domainPart.toLowerCase())) {
    return `Domain '${domainPart}' is blocked or invalid`;
  }
  
  // Block disposable domains
  const disposableDomains = ["mailinator.com", "yopmail.com", "tempmail.com", "dispostable.com", "10minutemail.com"];
  if (disposableDomains.includes(domainPart.toLowerCase())) {
    return "Disposable/temporary email addresses are not allowed";
  }
  
  // Prevent SQL injection / script tags
  if (/<script/i.test(trimmed) || /javascript:/i.test(trimmed) || /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|DROP\s/i.test(trimmed)) {
    return "Invalid characters or words detected in email";
  }
  
  return true; // Valid
};

/**
 * Validates a mobile number based on strict criteria.
 * Returns a string error message if invalid, or true if valid.
 */
export const validateMobile = (mobile) => {
  if (mobile === undefined || mobile === null) return "Mobile number is required";
  let cleaned = String(mobile).trim();
  if (cleaned.length === 0) return "Mobile number is required";
  
  // Allow and strip country code (+91 or 91)
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  
  // Check for spaces inside
  if (/\s/.test(cleaned)) return "Mobile number must not contain spaces";
  
  // Only numeric characters allowed (no alphabets, no special characters)
  if (!/^\d+$/.test(cleaned)) {
    return "Mobile number must contain only numeric characters (no letters or special characters)";
  }
  
  // Must be exactly 10 digits
  if (cleaned.length !== 10) {
    return "Mobile number must contain exactly 10 digits";
  }
  
  // First digit should be between 6 and 9 (India)
  const firstDigit = cleaned[0];
  if (firstDigit < '6' || firstDigit > '9') {
    return "Mobile number must start with a digit between 6 and 9 (India standard)";
  }
  
  // Block dummy numbers (e.g. 9999999999, 1111111111, 1234567890)
  const dummyPatterns = [
    "1234567890", "0987654321",
    "0000000000", "1111111111", "2222222222", "3333333333", "4444444444",
    "5555555555", "6666666666", "7777777777", "8888888888", "9999999999"
  ];
  if (dummyPatterns.includes(cleaned)) {
    return "This mobile number is a blocked dummy number";
  }
  
  // Prevent SQL injection / script tags
  if (/<script/i.test(cleaned) || /javascript:/i.test(cleaned) || /SELECT\s|INSERT\s|UPDATE\s|DELETE\s|DROP\s/i.test(cleaned)) {
    return "Invalid characters or words detected in mobile number";
  }
  
  return true; // Valid
};
