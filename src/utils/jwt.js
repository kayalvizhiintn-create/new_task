export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Add base64 padding
    const pad = base64.length % 4;
    if (pad === 2) {
      base64 += '==';
    } else if (pad === 3) {
      base64 += '=';
    }
    
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    
    // Extract key claims using standard JWT and ASP.NET Core claim names
    const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"] || decoded["Role"];
    const employeeId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded["nameid"] || decoded["sub"];
    const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded["unique_name"] || decoded["name"];
    const bioId = decoded["BioId"] || decoded["bioId"];
    const roleId = decoded["RoleId"] || decoded["roleId"];

    return {
      role,
      employeeId: employeeId ? parseInt(employeeId, 10) : null,
      name,
      bioId,
      roleId: roleId ? parseInt(roleId, 10) : null,
      raw: decoded
    };
  } catch (error) {
    console.error('Failed to decode JWT token', error);
    return null;
  }
}
