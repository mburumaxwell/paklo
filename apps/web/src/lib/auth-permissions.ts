import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

export const statement = {
  ...defaultStatements,
  usage: ['view'], // <-- Permissions available for created roles
} as const;

export const accessControl = createAccessControl(statement);

export const user = accessControl.newRole({
  usage: [],
});

export const admin = accessControl.newRole({
  usage: ['view'],
  ...adminAc.statements,
});
