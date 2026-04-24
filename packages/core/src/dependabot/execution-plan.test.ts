import { describe, expect, it } from 'vitest';

import type { DependabotConfig, DependabotUpdate } from '@/dependabot';

import { createExecutionPlan } from './execution-plan';

describe('createExecutionPlan', () => {
  it('creates one unit per standalone update', () => {
    const updates = [
      {
        'package-ecosystem': 'npm',
        'directory': '/',
        'schedule': { interval: 'daily' },
      },
      {
        'package-ecosystem': 'docker',
        'directory': '/',
        'schedule': { interval: 'weekly' },
      },
    ] as DependabotUpdate[];

    const { units } = createExecutionPlan({} as Pick<DependabotConfig, 'multi-ecosystem-groups'>, updates);

    expect(units).toEqual([
      { kind: 'single', update: updates[0] },
      { kind: 'single', update: updates[1] },
    ]);
  });

  it('groups multi-ecosystem updates by group name', () => {
    const config = {
      'multi-ecosystem-groups': {
        infrastructure: {
          schedule: { interval: 'weekly', day: 'monday', timezone: 'Etc/UTC' },
        },
      },
    } as unknown as Pick<DependabotConfig, 'multi-ecosystem-groups'>;
    const docker = {
      'package-ecosystem': 'docker',
      'directory': '/',
      'multi-ecosystem-group': 'infrastructure',
      'patterns': ['*'],
    } as DependabotUpdate;
    const terraform = {
      'package-ecosystem': 'terraform',
      'directory': '/',
      'multi-ecosystem-group': 'infrastructure',
      'patterns': ['*'],
    } as DependabotUpdate;

    const { units } = createExecutionPlan(config, [docker, terraform]);

    expect(units).toEqual([
      {
        kind: 'multi-ecosystem',
        groupname: 'infrastructure',
        group: config['multi-ecosystem-groups']!.infrastructure,
        updates: [docker, terraform],
      },
    ]);
  });

  it('preserves first-seen unit order while collecting later group members', () => {
    const config = {
      'multi-ecosystem-groups': {
        infrastructure: {
          schedule: { interval: 'weekly', day: 'monday', timezone: 'Etc/UTC' },
        },
      },
    } as unknown as Pick<DependabotConfig, 'multi-ecosystem-groups'>;
    const docker = {
      'package-ecosystem': 'docker',
      'directory': '/',
      'multi-ecosystem-group': 'infrastructure',
      'patterns': ['*'],
    } as DependabotUpdate;
    const npm = {
      'package-ecosystem': 'npm',
      'directory': '/',
      'schedule': { interval: 'daily' },
    } as DependabotUpdate;
    const terraform = {
      'package-ecosystem': 'terraform',
      'directory': '/',
      'multi-ecosystem-group': 'infrastructure',
      'patterns': ['*'],
    } as DependabotUpdate;

    const { units } = createExecutionPlan(config, [docker, npm, terraform]);

    expect(units).toEqual([
      {
        kind: 'multi-ecosystem',
        groupname: 'infrastructure',
        group: config['multi-ecosystem-groups']!.infrastructure,
        updates: [docker, terraform],
      },
      { kind: 'single', update: npm },
    ]);
  });
});
