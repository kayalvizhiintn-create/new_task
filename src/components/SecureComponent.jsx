import React from 'react';
import { usePermission } from '../hooks/usePermission';

export function SecureComponent({ code, children, fallback = null, type = 'visible' }) {
  const { check, isVisible, isEditable } = usePermission();
  const perm = check(code);

  if (perm === 'Deny' || perm === 'Hidden') { 
    return fallback;
  }

  if (type === 'editable' && !isEditable(code)) {
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { disabled: true, readOnly: true });
      }
      return child;
    });
  }

  return <>{children}</>;
}
export default SecureComponent;
