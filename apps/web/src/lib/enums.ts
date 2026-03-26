import type { DependabotPackageManager } from '@paklo/core/dependabot';
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

// Repository Type
export const RepositoryPullRequestStatusSchema = z.enum(['open', 'closed', 'merged']);
export type RepositoryPullRequestStatus = z.infer<typeof RepositoryPullRequestStatusSchema>;

// Synchronization Status
export const SynchronizationStatusSchema = z.enum(['pending', 'success', 'failed']);
export type SynchronizationStatus = z.infer<typeof SynchronizationStatusSchema>;

// Verification Status
export const SubscriptionStatusSchema = z.enum(['active', 'inactive', 'past_due', 'canceled']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// Update Job Status
export const UpdateJobStatusSchema = z.enum(['scheduled', 'running', 'succeeded', 'failed']);
export type UpdateJobStatus = z.infer<typeof UpdateJobStatusSchema>;

// Update Job Trigger
export const UpdateJobTriggerSchema = z.enum(['synchronization', 'scheduled', 'conflicts', 'comment', 'manual']);
export type UpdateJobTrigger = z.infer<typeof UpdateJobTriggerSchema>;

const updateJobStatusLabelMap: Record<UpdateJobStatus, string> = {
  scheduled: 'Scheduled',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
};
export const updateJobStatusOptions: { value: UpdateJobStatus; label: string }[] = Object.entries(
  updateJobStatusLabelMap,
).map(([value, label]) => ({ value: value as UpdateJobStatus, label }));

const updateJobTriggerLabelMap: Record<UpdateJobTrigger, string> = {
  scheduled: 'Scheduled',
  synchronization: 'Synchronization',
  comment: 'Comment',
  conflicts: 'Conflicts',
  manual: 'Manual',
};
export const updateJobTriggerOptions: { value: UpdateJobTrigger; label: string }[] = Object.entries(
  updateJobTriggerLabelMap,
).map(([value, label]) => ({ value: value as UpdateJobTrigger, label }));

const packageManagerLabelMap: Record<DependabotPackageManager, string> = {
  bundler: 'Bundler',
  cargo: 'Cargo',
  composer: 'Composer',
  conda: 'Conda',
  pub: 'Pub',
  docker: 'Docker',
  elm: 'Elm',
  github_actions: 'GitHub Actions',
  submodules: 'Git Submodules',
  go_modules: 'Go Modules',
  gradle: 'Gradle',
  maven: 'Maven',
  hex: 'Hex',
  nuget: 'NuGet',
  npm_and_yarn: 'npm & Yarn',
  pip: 'Pip',
  rust_toolchain: 'Rust Toolchain',
  swift: 'Swift',
  terraform: 'Terraform',
  devcontainers: 'Devcontainers',
  dotnet_sdk: '.NET SDK',
  bun: 'Bun',
  docker_compose: 'Docker Compose',
  uv: 'uv',
  vcpkg: 'vcpkg',
  helm: 'Helm',
  julia: 'Julia',
  bazel: 'Bazel',
  opentofu: 'OpenTofu',
  pre_commit: 'Pre-commit',
};
export const packageManagerOptions: { value: DependabotPackageManager; label: string }[] = Object.entries(
  packageManagerLabelMap,
).map(([value, label]) => ({ value: value as DependabotPackageManager, label }));
