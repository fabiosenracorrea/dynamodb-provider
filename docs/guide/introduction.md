# Introduction

The DynamoDB SDK (both v2 and v3) lacks type safety and requires significant boilerplate. Building expressions, avoiding attribute name collisions, and managing code repetition typically results in verbose, hard-to-maintain abstractions.

This library wraps DynamoDB operations with type-safe methods that work for both table-per-entity and single-table designs. Apart from the `ksuid` for ID generation, it has zero dependencies.

## Requirements

- **Minimum Node version**: 16

## What Problems Does It Solve?

### 1. Type Safety
The AWS SDK for DynamoDB doesn't provide type safety for your data models. This library adds full TypeScript support, catching errors at compile time rather than runtime.

### 2. Reduced Boilerplate
Building DynamoDB expressions manually is verbose and error-prone. This library provides clean, intuitive methods for all common operations.

### 3. Attribute Name Collision Prevention
DynamoDB has reserved words that can cause errors. This library handles attribute name mapping automatically.

### 4. Code Reusability
Single-table designs require repeating table configuration. This library eliminates that repetition through the SingleTable and Schema layers.

## Next Steps

- [Getting Started](/guide/getting-started) - Install and set up the library
- [Architecture](/guide/architecture) - Understand the three-part architecture
- [Provider](/provider/) - Learn about the DynamoDB Provider
