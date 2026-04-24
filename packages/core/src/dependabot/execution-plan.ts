import { type DependabotConfig, type DependabotMultiEcosystemGroup, type DependabotUpdate } from './config';

export type ExecutionUnitSingle = {
  kind: 'single';
  update: DependabotUpdate;
};

export type ExecutionUnitMultiEcosystem = {
  kind: 'multi-ecosystem';
  groupname: string;
  group: DependabotMultiEcosystemGroup;
  updates: DependabotUpdate[];
};

export type ExecutionUnit = ExecutionUnitSingle | ExecutionUnitMultiEcosystem;

export function createExecutionPlan(
  config: Pick<DependabotConfig, 'multi-ecosystem-groups'>,
  updates: DependabotUpdate[],
): { units: ExecutionUnit[] } {
  const units: ExecutionUnit[] = [];

  for (const update of updates) {
    const groupname = update['multi-ecosystem-group'];
    if (!groupname) {
      units.push({ kind: 'single', update });
      continue;
    }

    // Keep the unit where the group first appeared so execution follows config order.
    const existing = units.find((unit) => unit.kind === 'multi-ecosystem' && unit.groupname === groupname);
    if (existing && existing.kind === 'multi-ecosystem') {
      existing.updates.push(update);
      continue;
    }

    const group = config['multi-ecosystem-groups']?.[groupname];
    if (!group) {
      throw new Error(
        `Update belongs to multi-ecosystem group '${groupname}' but no matching group configuration was found. Please ensure the group is defined in the 'multi-ecosystem-groups' section of the config.`,
      );
    }

    units.push({
      kind: 'multi-ecosystem',
      groupname,
      group,
      updates: [update],
    });
  }

  return { units };
}
