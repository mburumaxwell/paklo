import { describe, expect, it } from 'vitest';

import type { DependabotGroup, DependabotIgnoreCondition, DependabotUpdate } from './config';
import {
  type DependabotSourceInfo,
  mapAllowedUpdatesFromDependabotConfigToJobConfig,
  mapCredentials,
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

    const result = mapSourceFromDependabotConfigToJobConfig(sourceInfo, update);
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
      'hostname': 'my-org.com',
      'port': '8443',
      'repository-slug': 'tfs/my-collection/my-project/_git/my-repo',
    };
    const update = {
      'package-ecosystem': 'nuget',
      'schedule': { interval: 'daily', time: '02:00', timezone: 'UTC', day: 'sunday' },
      'directory': '/',
      'directories': [],
    } as DependabotUpdate;

    const result = mapSourceFromDependabotConfigToJobConfig(sourceInfo, update);
    expect(result).toMatchObject({
      'provider': 'azure',
      'api-endpoint': 'https://my-org.com:8443/tfs',
      'hostname': 'my-org.com:8443',
      'repo': 'tfs/my-collection/my-project/_git/my-repo',
    });
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

describe('mapCredentials', () => {
  it('should create a single git_source credential for standard hostname without port', () => {
    const result = mapCredentials({
      sourceHostname: 'dev.azure.com',
      systemAccessToken: 'my-token',
    });
    const gitSourceCredentials = result.filter((c) => c.type === 'git_source');
    expect(gitSourceCredentials).toHaveLength(1);
    expect(gitSourceCredentials[0]).toMatchObject({
      type: 'git_source',
      host: 'dev.azure.com',
      username: 'x-access-token',
      password: 'my-token',
    });
  });

  it('should create two git_source credentials for hostname with non-standard port', () => {
    const result = mapCredentials({
      sourceHostname: 'tfs.example.com',
      sourcePort: '8443',
      systemAccessToken: 'my-token',
    });
    const gitSourceCredentials = result.filter((c) => c.type === 'git_source');
    expect(gitSourceCredentials).toHaveLength(2);
    expect(gitSourceCredentials[0]).toMatchObject({
      type: 'git_source',
      host: 'tfs.example.com:8443',
      username: 'x-access-token',
      password: 'my-token',
    });
    expect(gitSourceCredentials[1]).toMatchObject({
      type: 'git_source',
      host: 'tfs.example.com',
      username: 'x-access-token',
      password: 'my-token',
    });
  });

  it('should not create any git_source credential when systemAccessToken is undefined', () => {
    const result = mapCredentials({
      sourceHostname: 'dev.azure.com',
    });
    expect(result.filter((c) => c.type === 'git_source')).toHaveLength(0);
  });

  it('should use custom systemAccessUser when provided', () => {
    const result = mapCredentials({
      sourceHostname: 'tfs.example.com',
      sourcePort: '8443',
      systemAccessUser: 'custom-user',
      systemAccessToken: 'my-token',
    });
    const gitSourceCredentials = result.filter((c) => c.type === 'git_source');
    expect(gitSourceCredentials).toHaveLength(2);
    expect(gitSourceCredentials[0]!.username).toBe('custom-user');
    expect(gitSourceCredentials[1]!.username).toBe('custom-user');
  });
});
