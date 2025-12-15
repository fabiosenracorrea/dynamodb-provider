# Single Table Patterns

Production-ready examples using SingleTable for single-table designs.

## Setup

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

// Create provider
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

// Create SingleTable
export const table = new SingleTable({
  dynamodbProvider: provider,
  table: 'AppData',
  partitionKey: 'pk',
  rangeKey: 'sk',
  keySeparator: '#',

  typeIndex: {
    name: 'TypeIndex',
    partitionKey: '_type',
    rangeKey: '_timestamp'
  },

  expiresAt: 'ttl',

  indexes: {
    GSI1: {
      partitionKey: 'gsi1pk',
      rangeKey: 'gsi1sk'
    },
    GSI2: {
      partitionKey: 'gsi2pk',
      rangeKey: 'gsi2sk'
    }
  },

  autoRemoveTableProperties: true,
  keepTypeProperty: false,
  blockInternalPropUpdate: true
});
```

## Multi-Entity Application

Complete application with Users, Posts, Comments, and Tags.

```typescript
import { table } from './dynamodb-setup';

// Types
interface User {
  userId: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  postCount: number;
}

interface Post {
  postId: string;
  userId: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface Comment {
  commentId: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface Tag {
  tag: string;
  postId: string;
  postTitle: string;
  createdAt: string;
}

// User Service
export class UserService {
  async createUser(input: {
    username: string;
    email: string;
    name: string;
  }): Promise<User> {
    const userId = this.generateId();
    const now = new Date().toISOString();

    const user: User = {
      userId,
      username: input.username,
      email: input.email,
      name: input.name,
      createdAt: now,
      postCount: 0
    };

    await table.create({
      key: {
        partitionKey: ['USER', userId],
        rangeKey: '#METADATA'
      },
      item: user,
      type: 'USER',
      indexes: {
        GSI1: {
          partitionKey: ['EMAIL', input.email],
          rangeKey: now
        },
        GSI2: {
          partitionKey: ['USERNAME', input.username],
          rangeKey: now
        }
      }
    });

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await table.get<User>({
      partitionKey: ['USER', userId],
      rangeKey: '#METADATA',
      consistentRead: true
    });

    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { items } = await table.query<User>({
      partition: ['EMAIL', email],
      index: 'GSI1',
      limit: 1
    });

    return items[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { items } = await table.query<User>({
      partition: ['USERNAME', username],
      index: 'GSI2',
      limit: 1
    });

    return items[0] || null;
  }

  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'bio' | 'avatarUrl'>>): Promise<void> {
    await table.update({
      partitionKey: ['USER', userId],
      rangeKey: '#METADATA',
      values: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    });
  }

  async incrementPostCount(userId: string): Promise<void> {
    await table.update({
      partitionKey: ['USER', userId],
      rangeKey: '#METADATA',
      atomicOperations: [
        { operation: 'add', property: 'postCount', value: 1 }
      ]
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Post Service
export class PostService {
  async createPost(input: {
    userId: string;
    username: string;
    title: string;
    content: string;
    tags?: string[];
  }): Promise<Post> {
    const postId = this.generateId();
    const now = new Date().toISOString();

    const post: Post = {
      postId,
      userId: input.userId,
      title: input.title,
      content: input.content,
      status: 'draft',
      tags: input.tags || [],
      viewCount: 0,
      createdAt: now
    };

    // Create post and tag entries in transaction
    const transactionItems = [
      // Create post
      {
        create: {
          key: {
            partitionKey: ['USER', input.userId],
            rangeKey: ['POST', postId]
          },
          item: post,
          type: 'POST',
          indexes: {
            GSI1: {
              partitionKey: ['POST', postId],
              rangeKey: now
            }
          }
        }
      },

      // Increment user post count
      {
        update: {
          partitionKey: ['USER', input.userId],
          rangeKey: '#METADATA',
          atomicOperations: [
            { operation: 'add', property: 'postCount', value: 1 }
          ]
        }
      },

      // Create tag entries
      ...(input.tags || []).map(tag => ({
        create: {
          key: {
            partitionKey: ['TAG', tag],
            rangeKey: ['POST', postId]
          },
          item: {
            tag,
            postId,
            postTitle: input.title,
            createdAt: now
          } as Tag,
          type: 'TAG'
        }
      }))
    ];

    await table.transaction(transactionItems);

    return post;
  }

  async getPost(postId: string): Promise<Post | null> {
    const { items } = await table.query<Post>({
      partition: ['POST', postId],
      index: 'GSI1',
      limit: 1
    });

    return items[0] || null;
  }

  async getUserPosts(userId: string, limit: number = 20): Promise<Post[]> {
    const { items } = await table.query<Post>({
      partition: ['USER', userId],
      range: {
        value: 'POST#',
        operation: 'begins_with'
      },
      retrieveOrder: 'DESC',
      limit
    });

    return items;
  }

  async publishPost(postId: string, userId: string): Promise<void> {
    await table.update({
      partitionKey: ['USER', userId],
      rangeKey: ['POST', postId],
      values: {
        status: 'published' as const,
        updatedAt: new Date().toISOString()
      },
      conditions: [
        { operation: 'equal', property: 'status', value: 'draft' }
      ]
    });
  }

  async incrementViewCount(postId: string, userId: string): Promise<number> {
    const result = await table.update({
      partitionKey: ['USER', userId],
      rangeKey: ['POST', postId],
      atomicOperations: [
        { operation: 'add', property: 'viewCount', value: 1 }
      ],
      returnUpdatedProperties: true
    });

    return result?.viewCount || 0;
  }

  async getPostsByTag(tag: string, limit: number = 20): Promise<Tag[]> {
    const { items } = await table.query<Tag>({
      partition: ['TAG', tag],
      range: {
        value: 'POST#',
        operation: 'begins_with'
      },
      retrieveOrder: 'DESC',
      limit
    });

    return items;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Comment Service
export class CommentService {
  async addComment(input: {
    postId: string;
    userId: string;
    username: string;
    content: string;
  }): Promise<Comment> {
    const commentId = this.generateId();
    const now = new Date().toISOString();

    const comment: Comment = {
      commentId,
      postId: input.postId,
      userId: input.userId,
      username: input.username,
      content: input.content,
      createdAt: now
    };

    await table.create({
      key: {
        partitionKey: ['POST', input.postId],
        rangeKey: ['COMMENT', commentId]
      },
      item: comment,
      type: 'COMMENT',
      indexes: {
        GSI1: {
          partitionKey: ['USER', input.userId],
          rangeKey: ['COMMENT', now]
        }
      }
    });

    return comment;
  }

  async getPostComments(postId: string, limit: number = 50): Promise<Comment[]> {
    const { items } = await table.query<Comment>({
      partition: ['POST', postId],
      range: {
        value: 'COMMENT#',
        operation: 'begins_with'
      },
      retrieveOrder: 'ASC',
      limit
    });

    return items;
  }

  async getUserComments(userId: string, limit: number = 50): Promise<Comment[]> {
    const { items } = await table.query<Comment>({
      partition: ['USER', userId],
      range: {
        value: 'COMMENT#',
        operation: 'begins_with'
      },
      index: 'GSI1',
      retrieveOrder: 'DESC',
      limit
    });

    return items;
  }

  async deleteComment(postId: string, commentId: string, userId: string): Promise<void> {
    await table.delete({
      partitionKey: ['POST', postId],
      rangeKey: ['COMMENT', commentId],
      conditions: [
        { operation: 'equal', property: 'userId', value: userId }
      ]
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage Example
async function example() {
  const userService = new UserService();
  const postService = new PostService();
  const commentService = new CommentService();

  // Create user
  const user = await userService.createUser({
    username: 'johndoe',
    email: 'john@example.com',
    name: 'John Doe'
  });
  console.log('Created user:', user);

  // Create post
  const post = await postService.createPost({
    userId: user.userId,
    username: user.username,
    title: 'My First Post',
    content: 'This is the content of my first post.',
    tags: ['introduction', 'hello-world']
  });
  console.log('Created post:', post);

  // Publish post
  await postService.publishPost(post.postId, user.userId);

  // Add comment
  const comment = await commentService.addComment({
    postId: post.postId,
    userId: user.userId,
    username: user.username,
    content: 'Great first post!'
  });
  console.log('Added comment:', comment);

  // Get user posts
  const userPosts = await postService.getUserPosts(user.userId);
  console.log('User posts:', userPosts.length);

  // Get posts by tag
  const taggedPosts = await postService.getPostsByTag('introduction');
  console.log('Tagged posts:', taggedPosts.length);

  // Get post comments
  const comments = await commentService.getPostComments(post.postId);
  console.log('Post comments:', comments.length);
}
```

## Session Management

TTL-based session handling.

```typescript
import { table } from './dynamodb-setup';

interface Session {
  sessionId: string;
  userId: string;
  data: Record<string, any>;
  createdAt: string;
  lastAccessedAt: string;
}

export class SessionService {
  private readonly SESSION_TTL = 60 * 60 * 24; // 24 hours

  async createSession(userId: string, data: Record<string, any> = {}): Promise<Session> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: Session = {
      sessionId,
      userId,
      data,
      createdAt: now,
      lastAccessedAt: now
    };

    await table.create({
      key: {
        partitionKey: ['SESSION', sessionId],
        rangeKey: '#DATA'
      },
      item: session,
      type: 'SESSION',
      expiresAt: Math.floor(Date.now() / 1000) + this.SESSION_TTL,
      indexes: {
        GSI1: {
          partitionKey: ['USER_SESSIONS', userId],
          rangeKey: now
        }
      }
    });

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await table.get<Session>({
      partitionKey: ['SESSION', sessionId],
      rangeKey: '#DATA',
      consistentRead: true
    });

    if (session) {
      // Update last accessed and extend TTL
      await table.update({
        partitionKey: ['SESSION', sessionId],
        rangeKey: '#DATA',
        values: {
          lastAccessedAt: new Date().toISOString()
        },
        expiresAt: Math.floor(Date.now() / 1000) + this.SESSION_TTL
      });
    }

    return session || null;
  }

  async updateSessionData(sessionId: string, data: Record<string, any>): Promise<void> {
    await table.update({
      partitionKey: ['SESSION', sessionId],
      rangeKey: '#DATA',
      values: {
        data,
        lastAccessedAt: new Date().toISOString()
      },
      expiresAt: Math.floor(Date.now() / 1000) + this.SESSION_TTL
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await table.delete({
      partitionKey: ['SESSION', sessionId],
      rangeKey: '#DATA'
    });
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const { items } = await table.query<Session>({
      partition: ['USER_SESSIONS', userId],
      index: 'GSI1',
      retrieveOrder: 'DESC'
    });

    return items;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}
```

## See Also

- [SingleTable Configuration](/single-table/configuration) - Complete configuration reference
- [SingleTable Methods](/single-table/) - All available methods
- [Advanced Patterns](/examples/advanced-patterns) - Schema-based patterns
