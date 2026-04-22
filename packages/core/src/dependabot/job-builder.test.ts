import { describe, expect, it } from 'vitest';

import {
  type DependabotConfig,
  type DependabotGroup,
  type DependabotIgnoreCondition,
  type DependabotUpdate,
  getEffectiveUpdateSettings,
} from './config';
import {
  DependabotJobBuilder,
  type DependabotSourceInfo,
  mapAllowedUpdatesFromDependabotConfigToJobConfig,
  mapExperiments,
  mapGroupsFromDependabotConfigToJobConfig,
  mapIgnoreConditionsFromDependabotConfigToJobConfig,
  mapSourceFromDependabotConfigToJobConfig,
} from './job-builder';

describe('mapExperiments', () => {
  it('should return an empty object if experiments is undefined', () => {
    const result = mapExperiments(undefined);
    expect(result).toEqual({});
  });

  it('should return an empty object if experiments is an empty object', () => {
    const result = mapExperiments({});
    expect(result).toEqual({});
  });

  it('should convert string experiment value "true" to boolean `true`', () => {
    const experiments = {
      experiment1: 'true',
    };
    const result = mapExperiments(experiments);
    expect(result).toEqual({
      experiment1: true,
    });
  });

  it('should convert string experiment value "false" to boolean `false`', () => {
    const experiments = {
      experiment1: 'false',
    };
    const result = mapExperiments(experiments);
    expect(result).toEqual({
      experiment1: false,
    });
  });

  it('should keep boolean experiment values as is', () => {
    const experiments = {
      experiment1: true,
      experiment2: false,
    };
    const result = mapExperiments(experiments);
    expect(result).toEqual({
      experiment1: true,
      experiment2: false,
    });
  });

  it('should keep string experiment values other than "true" or "false" as is', () => {
    const experiments = {
      experiment1: 'someString',
    };
    const result = mapExperiments(experiments);
    expect(result).toEqual({
      experiment1: 'someString',
    });
  });
});

describe('mapSourceFromDependabotConfigToJobConfig', () => {
  const config = {
    version: 2,
    updates: [],
  } as unknown as DependabotConfig;

  it('should map source correctly for Azure DevOps Services', () => {
    const sourceInfo: DependabotSourceInfo = {
      'provider': 'azure',
      'hostname': 'dev.azure.com',
      'api-endpoint': 'https://dev.azure.com',
      'repository-slug': 'my-org/my-project/_git/my-repo',
    };
    const update = {
      'package-ecosystem': 'nuget',
      'schedule': { interval: 'daily', time: '02:00', timezone: 'UTC', day: 'sunday' },
      'directory': '/',
      'directories': [],
    } as DependabotUpdate;

    const result = mapSourceFromDependabotConfigToJobConfig(sourceInfo, config, update);
    expect(result).toMatchObject({
      'provider': 'azure',
      'api-endpoint': 'https://dev.azure.com',
      'hostname': 'dev.azure.com',
      'repo': 'my-org/my-project/_git/my-repo',
    });
  });

  it('should map source correctly for Azure DevOps Server', () => {
    const sourceInfo: DependabotSourceInfo = {
      'provider': 'azure',
      'api-endpoint': 'https://my-org.com:8443/tfs',
      'hostname': 'my-org.com:8443',
      'repository-slug': 'tfs/my-collection/my-project/_git/my-repo',
    };
    const update = {
      'package-ecosystem': 'nuget',
      'schedule': { interval: 'daily', time: '02:00', timezone: 'UTC', day: 'sunday' },
      'directory': '/',
      'directories': [],
    } as DependabotUpdate;

    const result = mapSourceFromDependabotConfigToJobConfig(sourceInfo, config, update);
    expect(result).toMatchObject({
      'provider': 'azure',
      'api-endpoint': 'https://my-org.com:8443/tfs',
      'hostname': 'my-org.com:8443',
      'repo': 'tfs/my-collection/my-project/_git/my-repo',
    });
  });

  it('should prefer group target branch for multi-ecosystem updates', () => {
    const sourceInfo: DependabotSourceInfo = {
      'provider': 'azure',
      'api-endpoint': 'https://dev.azure.com',
      'hostname': 'dev.azure.com',
      'repository-slug': 'my-org/my-project/_git/my-repo',
    };
    const groupedConfig = {
      'version': 2,
      'multi-ecosystem-groups': {
        infrastructure: {
          'schedule': { interval: 'weekly' },
          'target-branch': 'release/1.x',
        },
      },
      'updates': [],
    } as unknown as DependabotConfig;
    const update = {
      'package-ecosystem': 'docker',
      'directory': '/',
      'patterns': ['*'],
      'multi-ecosystem-group': 'infrastructure',
    } as DependabotUpdate;

    const result = mapSourceFromDependabotConfigToJobConfig(sourceInfo, groupedConfig, update);
    expect(result.branch).toBe('release/1.x');
  });
});

describe('getEffectiveUpdateSettings', () => {
  it('should merge additive and group-only multi-ecosystem settings', () => {
    const config = {
      'version': 2,
      'multi-ecosystem-groups': {
        infrastructure: {
          'schedule': { interval: 'weekly' },
          'assignees': ['@platform-team'],
          'labels': ['infrastructure'],
          'milestone': '12',
          'target-branch': 'release/1.x',
          'commit-message': { prefix: 'chore' },
          'pull-request-branch-name': { separator: '-' },
        },
      },
      'updates': [],
    } as unknown as DependabotConfig;
    const update = {
      'package-ecosystem': 'docker',
      'directory': '/',
      'patterns': ['*'],
      'multi-ecosystem-group': 'infrastructure',
      'assignees': ['@docker-admin'],
      'labels': ['docker'],
    } as DependabotUpdate;

    const result = getEffectiveUpdateSettings(config, update);

    expect(result.assignees).toEqual(['@platform-team', '@docker-admin']);
    expect(result.labels).toEqual(['infrastructure', 'docker']);
    expect(result.milestone).toBe('12');
    expect(result['target-branch']).toBe('release/1.x');
    expect(result['commit-message']).toEqual({ prefix: 'chore' });
    expect(result['pull-request-branch-name']).toEqual({ separator: '-' });
  });
});

describe('mapAllowedUpdatesFromDependabotConfigToJobConfig', () => {
  it('should allow direct dependency updates if rules are undefined', () => {
    const result = mapAllowedUpdatesFromDependabotConfigToJobConfig(undefined);
    expect(result).toEqual([{ 'dependency-type': 'direct', 'update-type': 'all' }]);
  });

  it('should allow direct dependency security updates if rules are undefined and securityOnlyUpdate is true', () => {
    const result = mapAllowedUpdatesFromDependabotConfigToJobConfig(undefined, true);
    expect(result).toEqual([{ 'dependency-type': 'direct', 'update-type': 'security' }]);
  });
});

describe('mapIgnoreConditionsFromDependabotConfigToJobConfig', () => {
  it('should return an empty array if rules are undefined', () => {
    const result = mapIgnoreConditionsFromDependabotConfigToJobConfig(undefined);
    expect(result).toEqual([]);
  });

  it('should handle single version string correctly', () => {
    const ignore: DependabotIgnoreCondition[] = [{ 'dependency-name': 'dep1', 'versions': '>3' }];
    const result = mapIgnoreConditionsFromDependabotConfigToJobConfig(ignore);
    expect(result).toEqual([{ 'dependency-name': 'dep1', 'version-requirement': '>3' }]);
  });

  it('should handle single version string array correctly', () => {
    const ignore: DependabotIgnoreCondition[] = [{ 'dependency-name': 'dep1', 'versions': ['>1.0.0'] }];
    const result = mapIgnoreConditionsFromDependabotConfigToJobConfig(ignore);
    expect(result).toEqual([{ 'dependency-name': 'dep1', 'version-requirement': '>1.0.0' }]);
  });

  it('should handle multiple version strings correctly', () => {
    const ignore: DependabotIgnoreCondition[] = [{ 'dependency-name': 'dep1', 'versions': ['>1.0.0', '<2.0.0'] }];
    const result = mapIgnoreConditionsFromDependabotConfigToJobConfig(ignore);
    expect(result).toEqual([{ 'dependency-name': 'dep1', 'version-requirement': '>1.0.0, <2.0.0' }]);
  });

  it('should handle empty versions array correctly', () => {
    const ignore: DependabotIgnoreCondition[] = [{ 'dependency-name': 'dep1', 'versions': [] }];
    const result = mapIgnoreConditionsFromDependabotConfigToJobConfig(ignore);
    expect(result).toEqual([{ 'dependency-name': 'dep1', 'version-requirement': '' }]);
  });
});

describe('mapGroupsFromDependabotConfigToJobConfig', () => {
  it('should return an empty array if dependencyGroups is undefined', () => {
    const result = mapGroupsFromDependabotConfigToJobConfig(undefined);
    expect(result).toEqual([]);
  });

  it('should return an empty array if dependencyGroups is an empty object', () => {
    const result = mapGroupsFromDependabotConfigToJobConfig({});
    expect(result).toEqual([]);
  });

  it('should filter out undefined groups', () => {
    const dependencyGroups: Record<string, DependabotGroup | null> = {
      group1: null,
      group2: {
        patterns: ['pattern2'],
      },
    };

    const result = mapGroupsFromDependabotConfigToJobConfig(dependencyGroups);
    expect(result).toHaveLength(1);
  });

  it('should filter out null groups', () => {
    const dependencyGroups: Record<string, DependabotGroup | null> = {
      group1: null,
      group2: {
        patterns: ['pattern2'],
      },
    };

    const result = mapGroupsFromDependabotConfigToJobConfig(dependencyGroups);
    expect(result).toHaveLength(1);
  });

  it('should map dependency group properties correctly', () => {
    const dependencyGroups: Record<string, DependabotGroup> = {
      group: {
        'applies-to': 'version-updates',
        'group-by': 'dependency-name',
        'patterns': ['pattern1', 'pattern2'],
        'exclude-patterns': ['exclude1'],
        'dependency-type': 'production',
        'update-types': ['major'],
      },
    };

    const result = mapGroupsFromDependabotConfigToJobConfig(dependencyGroups);

    expect(result).toEqual([
      {
        'name': 'group',
        'applies-to': 'version-updates',
        'group-by': 'dependency-name',
        'rules': {
          'patterns': ['pattern1', 'pattern2'],
          'exclude-patterns': ['exclude1'],
          'dependency-type': 'production',
          'update-types': ['major'],
        },
      },
    ]);
  });

  it('should use IDENTIFIER when present and fall back to the record key otherwise', () => {
    const dependencyGroups: Record<string, DependabotGroup> = {
      'prod-deps': {
        IDENTIFIER: 'production-dependencies',
        patterns: ['*'],
      },
      'dev-deps': {
        patterns: ['dev-*'],
      },
    };

    const result = mapGroupsFromDependabotConfigToJobConfig(dependencyGroups);

    expect(result.map((g) => g.name)).toEqual(['production-dependencies', 'dev-deps']);
  });

  it('should use pattern "*" if no patterns are provided', () => {
    const dependencyGroups: Record<string, DependabotGroup> = {
      group: {},
    };

    const result = mapGroupsFromDependabotConfigToJobConfig(dependencyGroups);

    expect(result).toEqual([{ name: 'group', rules: { patterns: ['*'] } }]);
  });
});

describe('DependabotJobBuilder', () => {
  it('should use group commit message options for multi-ecosystem jobs', () => {
    const builder = new DependabotJobBuilder({
      experiments: {},
      source: {
        'provider': 'azure',
        'hostname': 'dev.azure.com',
        'api-endpoint': 'https://dev.azure.com',
        'repository-slug': 'my-org/my-project/_git/my-repo',
      },
      config: {
        'version': 2,
        'multi-ecosystem-groups': {
          infrastructure: {
            'schedule': { interval: 'weekly' },
            'commit-message': {
              'prefix': 'chore',
              'prefix-development': 'deps-dev',
              'include': 'scope',
            },
          },
        },
        'updates': [],
      } as unknown as DependabotConfig,
      update: {
        'package-ecosystem': 'docker',
        'directory': '/',
        'patterns': ['*'],
        'multi-ecosystem-group': 'infrastructure',
        'schedule': { interval: 'daily' },
      } as DependabotUpdate,
      debug: false,
    });

    const result = builder.forUpdate({
      id: '1',
      command: 'update',
      existingPullRequests: [],
    });

    expect(result.job['commit-message-options']).toEqual({
      'prefix': 'chore',
      'prefix-development': 'deps-dev',
      'include-scope': true,
    });
  });
});
