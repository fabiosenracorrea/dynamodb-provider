# Basic Usage Examples

Complete, production-ready examples using the DynamoDB Provider for table-per-entity designs.

## Setup

### With AWS SDK v3 (Recommended)

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
import { DynamodbProvider } from 'dynamodb-provider';

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...awsConfig
});

const documentClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
      removeUndefinedValues: true,
  },
});

// Create provider
export const provider = new DynamodbProvider({
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
  },
  logCallParams: process.env.DEBUG === 'true'  // Enable for debugging
});
```

### With AWS SDK v2

```typescript
import { DynamoDB } from 'aws-sdk';
import { DynamodbProvider } from 'dynamodb-provider';

export const provider = new DynamodbProvider({
  dynamoDB: {
    target: 'v2',
    instance: new DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && {
        endpoint: process.env.DYNAMODB_ENDPOINT
      })
    })
  }
});
```

## User Management System

Complete example with CRUD operations, queries, and error handling.

```typescript
import { provider } from './dynamodb-setup';

// Types
interface User {
  userId: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  loginCount: number;
  roles: Set<string>;
}

interface CreateUserInput {
  email: string;
  name: string;
}

// Service
export class UserService {
  private readonly tableName = 'Users';

  async createUser(input: CreateUserInput): Promise<User> {
    const userId = this.generateUserId();
    const now = new Date().toISOString();

    try {
      const user = await provider.create<User>({
        table: this.tableName,
        item: {
          userId,
          email: input.email,
          name: input.name,
          status: 'active',
          createdAt: now,
          loginCount: 0,
          roles: provider.createSet(['user'])
        },
        conditions: [
          { operation: 'not_exists', property: 'userId' }
        ]
      });

      return user;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`User with ID ${userId} already exists`);
      }
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const user = await provider.get<User>({
      table: this.tableName,
      key: { userId },
      consistentRead: true
    });

    return user
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return provider.queryOne<User>({
      table: this.tableName,
      index: 'EmailIndex',
      partitionKey: { name: 'email', value: email },
      limit: 1
    });
  }

  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'status'>>): Promise<void> {
    try {
      await provider.update({
        table: this.tableName,
        key: { userId },
        values: {
          ...updates,
          updatedAt: new Date().toISOString()
        },
        conditions: [
          { operation: 'exists', property: 'userId' }
        ]
      });
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`User ${userId} not found`);
      }
      throw error;
    }
  }

  async incrementLoginCount(userId: string): Promise<number> {
    const { loginCount } = await provider.update({
      table: this.tableName,
      key: { userId },
      atomicOperations: [
        { operation: 'add', property: 'loginCount', value: 1 }
      ],
      values: {
        updatedAt: new Date().toISOString()
      },
      returnUpdatedProperties: true
    });

    return loginCount || 0;
  }

  async addRole(userId: string, role: string): Promise<void> {
    await provider.update({
      table: this.tableName,
      key: { userId },
      atomicOperations: [
        {
          operation: 'add_to_set',
          property: 'roles',
          value: [role]
        }
      ]
    });
  }

  async removeRole(userId: string, role: string): Promise<void> {
    await provider.update({
      table: this.tableName,
      key: { userId },
      atomicOperations: [
        {
          operation: 'remove_from_set',
          property: 'roles',
          value: [role]
        }
      ]
    });
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await provider.delete({
        table: this.tableName,
        key: { userId },
        conditions: [
          { operation: 'exists', property: 'userId' }
        ]
      });
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error(`User ${userId} not found`);
      }
      throw error;
    }
  }

  async listActiveUsers(limit: number = 50): Promise<User[]> {
    return provider.listAll<User>(this.tableName, {
      filters: {
        status: 'active'
      },
      limit
    });
  }

  async batchGetUsers(userIds: string[]): Promise<User[]> {
    return provider.batchGet<User>({
      table: this.tableName,
      keys: userIds.map(userId => ({ userId })),
      throwOnUnprocessed: true
    });
  }

  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage

const userService = new UserService();

// Create user
const newUser = await userService.createUser({
  email: 'john@example.com',
  name: 'John Doe'
});

// Get user
const user = await userService.getUserById(newUser.userId);

// Update user
await userService.updateUser(newUser.userId, {
  name: 'John Smith'
});

// Increment login count
const count = await userService.incrementLoginCount(newUser.userId);
console.log('Login count:', count);

// Add role
await userService.addRole(newUser.userId, 'admin');

// List active users
const activeUsers = await userService.listActiveUsers();
console.log('Active users:', activeUsers.length);
```

## E-Commerce Order System

Complete example with transactions and complex queries.

```typescript
import { provider } from './dynamodb-setup';

interface Product {
  productId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface Order {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CartItem {
  cartId: string;
  customerId: string;
  productId: string;
  quantity: number;
}

export class OrderService {
  async createOrder(customerId: string, cartItems: CartItem[]): Promise<Order> {
    const orderId = this.generateOrderId();
    const now = new Date().toISOString();

    // Calculate total
    const productIds = cartItems.map(item => item.productId);
    const products = await provider.batchGet<Product>({
      table: 'Products',
      keys: productIds.map(productId => ({ productId }))
    });

    const productMap = new Map(products.map(p => [p.productId, p]));

    const items: OrderItem[] = cartItems.map(cartItem => {
      const product = productMap.get(cartItem.productId);
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found`);
      }
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: product.price
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order with transaction
    const order: Order = {
      orderId,
      customerId,
      items,
      totalAmount,
      status: 'pending',
      createdAt: now
    };

    try {
      await provider.transaction([
        // Create order
        {
          create: {
            table: 'Orders',
            item: order,
            conditions: [
              { operation: 'not_exists', property: 'orderId' }
            ]
          }
        },

        // Update product stock
        ...items.map(item => ({
          update: {
            table: 'Products',
            key: { productId: item.productId },
            atomicOperations: [
              {
                operation: 'subtract',
                property: 'stock',
                value: item.quantity,
                if: { operation: 'bigger_or_equal_than', value: item.quantity }
              }
            ]
          }
        })),

        // Delete cart items
        ...cartItems.map(cartItem => ({
          erase: {
            table: 'CartItems',
            key: { cartId: cartItem.cartId }
          }
        }))
      ]);

      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const items = await provider.queryAll<Order>({
      table: 'Orders',
      index: 'CustomerIndex',
      partitionKey: { name: 'customerId', value: customerId },
      retrieveOrder: 'DESC',
      fullRetrieval: true
    });

    return items;
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    await provider.update({
      table: 'Orders',
      key: { orderId },
      values: { status },
      conditions: [
        { operation: 'exists', property: 'orderId' }
      ]
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    // Get order
    const order = await provider.get<Order>({
      table: 'Orders',
      key: { orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Only pending orders can be cancelled');
    }

    // Cancel order and restore stock
    await provider.transaction([
      // Update order status
      {
        update: {
          table: 'Orders',
          key: { orderId },
          values: { status: 'cancelled' as const },
          conditions: [
            { operation: 'equal', property: 'status', value: 'pending' }
          ]
        }
      },

      // Restore product stock
      ...order.items.map(item => ({
        update: {
          table: 'Products',
          key: { productId: item.productId },
          atomicOperations: [
            { operation: 'add', property: 'stock', value: item.quantity }
          ]
        }
      }))
    ]);
  }

  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

// Usage

const orderService = new OrderService();

const cartItems: CartItem[] = [
  { cartId: 'cart1', customerId: 'customer123', productId: 'prod1', quantity: 2 },
  { cartId: 'cart2', customerId: 'customer123', productId: 'prod2', quantity: 1 }
];

// Create order
const order = await orderService.createOrder('customer123', cartItems);

// Get customer orders
const orders = await orderService.getOrdersByCustomer('customer123');

// Update status
await orderService.updateOrderStatus(order.orderId, 'confirmed');

// Cancel order
await orderService.cancelOrder(order.orderId);
```

## See Also

- [Provider Methods](/provider/) - Full API reference
- [Single Table Patterns](/examples/single-table-patterns) - Single-table design examples
- [Advanced Patterns](/examples/advanced-patterns) - Complex patterns and optimizations
