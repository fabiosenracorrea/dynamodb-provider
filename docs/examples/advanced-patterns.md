# Advanced Patterns

Real-world patterns using the Schema system for complex single-table designs.

## Setup with Schema

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  DeleteCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamodbProvider, SingleTable } from 'dynamodb-provider';

// Create table with custom generators
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const documentClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
      removeUndefinedValues: true,
  },
});

const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v3',
    instance: documentClient,
    commands: {
      BatchGetCommand,
      GetCommand,
      DeleteCommand,
      PutCommand,
      UpdateCommand,
      ScanCommand,
      QueryCommand,
      TransactWriteCommand,
    }
  }
});

// Custom generators for multi-tenancy
function getCurrentTenantId(): string {
  // In real app, get from request context
  return process.env.TENANT_ID || 'tenant-default';
}

function getCurrentUserId(): string {
  // In real app, get from request context
  return 'current-user-id';
}

export const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'MultiTenantApp',
  partitionKey: 'pk',
  rangeKey: 'sk',
  keySeparator: '#',

  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp'
  },

  indexes: {
    GSI1: {
      partitionKey: 'gsi1pk',
      rangeKey: 'gsi1sk'
    }
  },

  autoGenerators: {
    // Custom generators
    tenantId: () => getCurrentTenantId(),
    userId: () => getCurrentUserId(),
    requestId: () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
});
```

## Multi-Tenant SaaS Application

Complete multi-tenant application with organizations, teams, and projects.

```typescript
import { table } from './dynamodb-setup';
import type { GetCollectionType } from 'dynamodb-provider';

// Types
type Organization = {
  id: string;
  tenantId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxUsers: number;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
};

type Team = {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
};

type TeamMember = {
  id: string;
  tenantId: string;
  teamId: string;
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
};

type Project = {
  id: string;
  tenantId: string;
  teamId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt?: string;
  taskCount: number;
};

// Create partition
const orgPartition = table.schema.createPartition({
  name: 'ORG_PARTITION',
  getPartitionKey: ({ tenantId, organizationId }: { tenantId: string; organizationId: string }) =>
    ['TENANT', tenantId, 'ORG', organizationId],
  entries: {
    metadata: () => '#METADATA',
    teams: ({ teamId }: { teamId: string }) => ['TEAM', teamId],
    teamMembers: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      ['TEAM', teamId, 'MEMBER', memberId]
  }
});

// Define entities
const Organization = orgPartition.use('metadata').create<Organization>().entity({
  type: 'ORGANIZATION',
  paramMatch: {
    organizationId: 'id'
  },
  autoGen: {
    onCreate: {
      id: 'UUID',
      tenantId: 'tenantId',
      createdAt: 'timestamp',
      createdBy: 'userId',
      memberCount: 'count'
    },
    onUpdate: {
      updatedAt: 'timestamp'
    }
  }
});

const Team = orgPartition.use('teams').create<Team>().entity({
  type: 'TEAM',
  paramMatch: {
    organizationId: 'organizationId',
    teamId: 'id'
  },
  autoGen: {
    onCreate: {
      id: 'UUID',
      tenantId: 'tenantId',
      createdAt: 'timestamp',
      memberCount: 'count'
    },
    onUpdate: {
      updatedAt: 'timestamp'
    }
  },
  rangeQueries: {
    active: {
      operation: 'equal',
      getValues: () => ({ value: 'TEAM#' })
    }
  }
});

const TeamMember = orgPartition.use('teamMembers').create<TeamMember>().entity({
  type: 'TEAM_MEMBER',
  paramMatch: {
    organizationId: 'organizationId',
    memberId: 'id'
  },
  autoGen: {
    onCreate: {
      id: 'UUID',
      tenantId: 'tenantId',
      joinedAt: 'timestamp'
    }
  }
});

// Team partition for projects
const teamPartition = table.schema.createPartition({
  name: 'TEAM_PARTITION',
  getPartitionKey: ({ tenantId, teamId }: { tenantId: string; teamId: string }) =>
    ['TENANT', tenantId, 'TEAM', teamId],
  entries: {
    projects: ({ projectId }: { projectId: string }) => ['PROJECT', projectId]
  }
});

const Project = teamPartition.use('projects').create<Project>().entity({
  type: 'PROJECT',
  paramMatch: {
    projectId: 'id'
  },
  autoGen: {
    onCreate: {
      id: 'UUID',
      tenantId: 'tenantId',
      createdAt: 'timestamp',
      taskCount: 'count'
    },
    onUpdate: {
      updatedAt: 'timestamp'
    }
  },
  rangeQueries: {
    byStatus: {
      operation: 'equal',
      getValues: ({ status }: { status: string }) => ({ value: status })
    }
  }
});

// Collections
const teamWithMembers = orgPartition.collection({
  ref: Team,
  type: 'SINGLE',
  join: {
    members: {
      entity: TeamMember,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      sorter: (a, b) => a.username.localeCompare(b.username)
    }
  }
});

const organizationComplete = orgPartition.collection({
  ref: Organization,
  type: 'SINGLE',
  join: {
    teams: {
      entity: Team,
      type: 'MULTIPLE',
      joinBy: 'TYPE',
      join: {
        // Nested join for team members
        members: {
          entity: TeamMember,
          type: 'MULTIPLE',
          joinBy: (team, member) => team.id === member.teamId
        }
      }
    }
  }
});

type TeamWithMembers = GetCollectionType<typeof teamWithMembers>;
type OrganizationComplete = GetCollectionType<typeof organizationComplete>;

// Services
export class OrganizationService {
  async createOrganization(input: {
    name: string;
    plan: Organization['plan'];
  }): Promise<Organization> {
    const maxUsers = input.plan === 'free' ? 5 : input.plan === 'pro' ? 50 : 500;

    const org = await table.schema.from(Organization).create({
      tenantId: getCurrentTenantId(),
      organizationId: 'placeholder',  // Will be auto-generated
      name: input.name,
      plan: input.plan,
      maxUsers
    });

    return org;
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    const org = await table.schema.from(Organization).get({
      tenantId: getCurrentTenantId(),
      organizationId
    });

    return org || null;
  }

  async getOrganizationWithTeams(organizationId: string): Promise<OrganizationComplete | undefined> {
    return await table.schema.from(organizationComplete).get({
      tenantId: getCurrentTenantId(),
      organizationId
    });
  }

  async updateOrganization(organizationId: string, updates: Partial<Pick<Organization, 'name' | 'plan'>>): Promise<void> {
    await table.schema.from(Organization).update({
      tenantId: getCurrentTenantId(),
      organizationId,
      values: updates
    });
  }
}

export class TeamService {
  async createTeam(input: {
    organizationId: string;
    name: string;
    description?: string;
  }): Promise<Team> {
    const team = await table.schema.from(Team).create({
      tenantId: getCurrentTenantId(),
      organizationId: input.organizationId,
      teamId: 'placeholder',  // Will be auto-generated
      name: input.name,
      description: input.description
    });

    return team;
  }

  async getTeam(organizationId: string, teamId: string): Promise<TeamWithMembers | undefined> {
    return await table.schema.from(teamWithMembers).get({
      tenantId: getCurrentTenantId(),
      organizationId,
      teamId
    });
  }

  async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    return await table.schema.from(Team).query.all({
      tenantId: getCurrentTenantId(),
      organizationId
    });
  }

  async addMember(input: {
    organizationId: string;
    teamId: string;
    userId: string;
    username: string;
    email: string;
    role: TeamMember['role'];
  }): Promise<TeamMember> {
    const member = await table.schema.from(TeamMember).create({
      tenantId: getCurrentTenantId(),
      organizationId: input.organizationId,
      teamId: input.teamId,
      memberId: 'placeholder',  // Will be auto-generated
      userId: input.userId,
      username: input.username,
      email: input.email,
      role: input.role
    });

    // Increment team member count
    await table.schema.from(Team).update({
      tenantId: getCurrentTenantId(),
      organizationId: input.organizationId,
      teamId: input.teamId,
      atomicOperations: [
        { operation: 'add', property: 'memberCount', value: 1 }
      ]
    });

    return member;
  }

  async removeMember(organizationId: string, teamId: string, memberId: string): Promise<void> {
    await table.schema.from(TeamMember).delete({
      tenantId: getCurrentTenantId(),
      organizationId,
      teamId,
      memberId
    });

    // Decrement team member count
    await table.schema.from(Team).update({
      tenantId: getCurrentTenantId(),
      organizationId,
      teamId,
      atomicOperations: [
        { operation: 'subtract', property: 'memberCount', value: 1 }
      ]
    });
  }
}

export class ProjectService {
  async createProject(input: {
    teamId: string;
    name: string;
    description?: string;
  }): Promise<Project> {
    const project = await table.schema.from(Project).create({
      tenantId: getCurrentTenantId(),
      teamId: input.teamId,
      projectId: 'placeholder',  // Will be auto-generated
      name: input.name,
      description: input.description,
      status: 'active'
    });

    return project;
  }

  async getProject(teamId: string, projectId: string): Promise<Project | null> {
    const project = await table.schema.from(Project).get({
      tenantId: getCurrentTenantId(),
      teamId,
      projectId
    });

    return project || null;
  }

  async getTeamProjects(teamId: string, status?: Project['status']): Promise<Project[]> {
    if (status) {
      return await table.schema.from(Project).query.byStatus.all({
        tenantId: getCurrentTenantId(),
        teamId,
        status
      });
    }

    return await table.schema.from(Project).query.all({
      tenantId: getCurrentTenantId(),
      teamId
    });
  }

  async archiveProject(teamId: string, projectId: string): Promise<void> {
    await table.schema.from(Project).update({
      tenantId: getCurrentTenantId(),
      teamId,
      projectId,
      values: { status: 'archived' as const }
    });
  }
}

// Usage Example
async function example() {
  const orgService = new OrganizationService();
  const teamService = new TeamService();
  const projectService = new ProjectService();

  // Create organization
  const org = await orgService.createOrganization({
    name: 'Acme Corp',
    plan: 'pro'
  });
  console.log('Created organization:', org);

  // Create team
  const team = await teamService.createTeam({
    organizationId: org.id,
    name: 'Engineering',
    description: 'Product engineering team'
  });
  console.log('Created team:', team);

  // Add members
  const member1 = await teamService.addMember({
    organizationId: org.id,
    teamId: team.id,
    userId: 'user1',
    username: 'john',
    email: 'john@acme.com',
    role: 'admin'
  });

  const member2 = await teamService.addMember({
    organizationId: org.id,
    teamId: team.id,
    userId: 'user2',
    username: 'jane',
    email: 'jane@acme.com',
    role: 'member'
  });

  // Create project
  const project = await projectService.createProject({
    teamId: team.id,
    name: 'Website Redesign',
    description: 'Redesign company website'
  });
  console.log('Created project:', project);

  // Get team with members
  const teamWithMembers = await teamService.getTeam(org.id, team.id);
  console.log('Team members:', teamWithMembers?.members.length);

  // Get organization with all teams and members
  const orgComplete = await orgService.getOrganizationWithTeams(org.id);
  console.log('Organization teams:', orgComplete?.teams.length);
  console.log('Total members across all teams:',
    orgComplete?.teams.reduce((sum, t) => sum + t.members.length, 0)
  );

  // Get active projects
  const activeProjects = await projectService.getTeamProjects(team.id, 'active');
  console.log('Active projects:', activeProjects.length);
}
```

## Audit Logging with Collections

Complete audit trail implementation.

```typescript
type AuditLog = {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  username: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
  requestId: string;
};

const auditPartition = table.schema.createPartition({
  name: 'AUDIT_PARTITION',
  getPartitionKey: ({ tenantId, entityType, entityId }: {
    tenantId: string;
    entityType: string;
    entityId: string;
  }) => ['TENANT', tenantId, entityType, entityId],
  entries: {
    logs: ({ timestamp }: { timestamp: string }) => ['AUDIT', timestamp]
  }
});

const AuditLog = auditPartition.use('logs').create<AuditLog>().entity({
  type: 'AUDIT_LOG',
  autoGen: {
    onCreate: {
      id: 'UUID',
      tenantId: 'tenantId',
      timestamp: 'timestamp',
      userId: 'userId',
      requestId: 'requestId'
    }
  }
});

export class AuditService {
  async logAction(input: {
    entityType: string;
    entityId: string;
    action: AuditLog['action'];
    username: string;
    changes?: Record<string, { old: any; new: any }>;
  }): Promise<void> {
    await table.schema.from(AuditLog).create({
      tenantId: getCurrentTenantId(),
      entityType: input.entityType,
      entityId: input.entityId,
      timestamp: new Date().toISOString(),
      action: input.action,
      username: input.username,
      changes: input.changes
    });
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await table.schema.from(AuditLog).query.all({
      tenantId: getCurrentTenantId(),
      entityType,
      entityId
    });
  }
}
```

## See Also

- [Schema System](/schema/) - Complete schema reference
- [Entities](/schema/entities) - Entity configuration
- [Partitions](/schema/partitions) - Partition patterns
- [Collections](/schema/collections) - Collection joins
