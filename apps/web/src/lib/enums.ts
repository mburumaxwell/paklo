import { type DependabotPackageManager, DependabotPackageManagerSchema } from '@paklo/core/dependabot';
import type Image from 'next/image';

import type { Icon } from '@/components/icons';
import { z } from '@/lib/zod';

// TODO: remove withAll and unwrapAll after moving fully to NUQS
export type WithAll<T> = T | 'all';

export function unwrapWithAll<T>(value?: WithAll<T>): T | undefined {
  return value === 'all' ? undefined : value;
}

export type LabelMappingValue = {
  label: string;
  icon?: Icon;
  image?: React.FC<Omit<React.ComponentPropsWithoutRef<typeof Image>, 'src' | 'alt'>>;
  title?: string;
  description?: string;
  disabled?: boolean;
  url?: string;
};
export type LabelOption<T extends string> = { value: T } & LabelMappingValue;

// User Role
export const UserRoleSchema = z.enum(['admin', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;
const userRoleLabelMap: Record<UserRole, LabelMappingValue> = {
  admin: { label: 'Admin' },
  user: { label: 'User' },
};
export const userRoleOptions: LabelOption<UserRole>[] = Object.entries(userRoleLabelMap).map(([value, props]) => ({
  value: value as UserRole,
  ...props,
}));
export const UserRoleCodec = z.enumCodec(UserRoleSchema);

// User Status
export const UserStatusSchema = z.enum(['active', 'banned']);
export type UserStatus = z.infer<typeof UserStatusSchema>;
const userStatusLabelMap: Record<UserStatus, LabelMappingValue> = {
  active: { label: 'Active' },
  banned: { label: 'Banned' },
};
export const userStatusOptions: LabelOption<UserStatus>[] = Object.entries(userStatusLabelMap).map(
  ([value, props]) => ({ value: value as UserStatus, ...props }),
);
export const UserStatusCodec = z.enumCodec(UserStatusSchema);

// Organization Type
export const OrganizationTypeSchema = z.enum(['azure', 'bitbucket', 'gitlab']);
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
export const OrganizationTypeCodec = z.enumCodec(OrganizationTypeSchema);

// Repository Type
export const RepositoryPullRequestStatusSchema = z.enum(['open', 'closed', 'merged']);
export type RepositoryPullRequestStatus = z.infer<typeof RepositoryPullRequestStatusSchema>;
export const RepositoryPullRequestStatusCodec = z.enumCodec(RepositoryPullRequestStatusSchema);

// Synchronization Status
export const SynchronizationStatusSchema = z.enum(['pending', 'success', 'failed']);
export type SynchronizationStatus = z.infer<typeof SynchronizationStatusSchema>;
export const SynchronizationStatusCodec = z.enumCodec(SynchronizationStatusSchema);

// Verification Status
export const SubscriptionStatusSchema = z.enum(['active', 'inactive', 'past_due', 'canceled']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export const SubscriptionStatusCodec = z.enumCodec(SubscriptionStatusSchema);

// Update Job Status
export const UpdateJobStatusSchema = z.enum(['scheduled', 'running', 'succeeded', 'failed']);
export type UpdateJobStatus = z.infer<typeof UpdateJobStatusSchema>;
const updateJobStatusLabelMap: Record<UpdateJobStatus, LabelMappingValue> = {
  scheduled: { label: 'Scheduled' },
  running: { label: 'Running' },
  succeeded: { label: 'Succeeded' },
  failed: { label: 'Failed' },
};
export const updateJobStatusOptions: LabelOption<UpdateJobStatus>[] = Object.entries(updateJobStatusLabelMap).map(
  ([value, props]) => ({ value: value as UpdateJobStatus, ...props }),
);
export const UpdateJobStatusCodec = z.enumCodec(UpdateJobStatusSchema);

// Update Job Trigger
export const UpdateJobTriggerSchema = z.enum(['synchronization', 'scheduled', 'conflicts', 'comment', 'manual']);
export type UpdateJobTrigger = z.infer<typeof UpdateJobTriggerSchema>;
const updateJobTriggerLabelMap: Record<UpdateJobTrigger, LabelMappingValue> = {
  scheduled: { label: 'Scheduled' },
  synchronization: { label: 'Synchronization' },
  comment: { label: 'Comment' },
  conflicts: { label: 'Conflicts' },
  manual: { label: 'Manual' },
};
export const updateJobTriggerOptions: LabelOption<UpdateJobTrigger>[] = Object.entries(updateJobTriggerLabelMap).map(
  ([value, props]) => ({ value: value as UpdateJobTrigger, ...props }),
);
export const UpdateJobTriggerCodec = z.enumCodec(UpdateJobTriggerSchema);

const packageManagerLabelMap: Record<DependabotPackageManager, LabelMappingValue> = {
  bundler: { label: 'Bundler' },
  cargo: { label: 'Cargo' },
  composer: { label: 'Composer' },
  conda: { label: 'Conda' },
  pub: { label: 'Pub' },
  docker: { label: 'Docker' },
  elm: { label: 'Elm' },
  github_actions: { label: 'GitHub Actions' },
  submodules: { label: 'Git Submodules' },
  go_modules: { label: 'Go Modules' },
  gradle: { label: 'Gradle' },
  maven: { label: 'Maven' },
  hex: { label: 'Hex' },
  nuget: { label: 'NuGet' },
  npm_and_yarn: { label: 'npm & Yarn' },
  pip: { label: 'Pip' },
  rust_toolchain: { label: 'Rust Toolchain' },
  swift: { label: 'Swift' },
  terraform: { label: 'Terraform' },
  devcontainers: { label: 'Devcontainers' },
  dotnet_sdk: { label: '.NET SDK' },
  bun: { label: 'Bun' },
  docker_compose: { label: 'Docker Compose' },
  uv: { label: 'uv' },
  vcpkg: { label: 'vcpkg' },
  helm: { label: 'Helm' },
  julia: { label: 'Julia' },
  bazel: { label: 'Bazel' },
  opentofu: { label: 'OpenTofu' },
  pre_commit: { label: 'Pre-commit' },
  nix: { label: 'Nix' },
};
export const packageManagerOptions: LabelOption<DependabotPackageManager>[] = Object.entries(
  packageManagerLabelMap,
).map(([value, props]) => ({ value: value as DependabotPackageManager, ...props }));
export const DependabotPackageManagerCodec = z.enumCodec(DependabotPackageManagerSchema);
