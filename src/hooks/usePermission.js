import { useStore } from '../store/useStore';

export function usePermission() {
  const { permissionCodes, currentUser } = useStore();

  const check = (code) => {
    // Default to 'Allow' if not explicitly defined in the DB for retro-compatibility
    return permissionCodes[code] || 'Allow';
  };

  const isVisible = (code) => {
    const perm = check(code);
    return perm !== 'Deny' && perm !== 'Hidden';
  };

  const isEditable = (code) => {
    const perm = check(code);
    return perm === 'Allow' || perm === 'Edit' || perm === 'Create' || perm === 'Full Access';
  };

  const isReadOnly = (code) => {
    return check(code) === 'Read Only';
  };

  return { check, isVisible, isEditable, isReadOnly };
}
