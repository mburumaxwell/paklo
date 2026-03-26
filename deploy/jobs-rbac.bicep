type RoleDefinition = { name: string, id: string }

@description('Resource Identifier of the managed identity to assign roles to.')
param managedIdentityId string

@description('Principal ID of the managed identity to assign roles to.')
param managedIdentityPrincipalId string

@description('Roles to assign to the managed identity in the jobs resource group.')
param roles RoleDefinition[]

resource roleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for role in roles: {
    name: guid(managedIdentityId, role.name)
    scope: resourceGroup()
    properties: {
      roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', role.id)
      principalId: managedIdentityPrincipalId
    }
  }
]
