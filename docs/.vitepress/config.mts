import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dynamodb Provider",
  description: "Fast Develop for DynamoDB with a type-safe & single-table aware library!",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/provider/' },
      { text: 'Examples', link: '/examples/basic-usage' }
    ],

    sidebar: [
      {
        text: 'Guide',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Architecture', link: '/guide/architecture' }
        ]
      },
      {
        text: 'DynamoDB Provider',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/provider/' },
          { text: 'Setup', link: '/provider/setup' },
          { text: 'get', link: '/provider/get' },
          { text: 'create', link: '/provider/create' },
          { text: 'delete', link: '/provider/delete' },
          { text: 'update', link: '/provider/update' },
          { text: 'batchGet', link: '/provider/batch-get' },
          { text: 'list & listAll', link: '/provider/list' },
          { text: 'query, queryOne, queryAll', link: '/provider/query' },
          { text: 'transaction', link: '/provider/transaction' },
          { text: 'Helpers', link: '/provider/helpers' }
        ]
      },
      {
        text: 'Single Table',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/single-table/' },
          { text: 'Configuration', link: '/single-table/configuration' },
          { text: 'get', link: '/single-table/get' },
          { text: 'batchGet', link: '/single-table/batch-get' },
          { text: 'create', link: '/single-table/create' },
          { text: 'delete', link: '/single-table/delete' },
          { text: 'update', link: '/single-table/update' },
          { text: 'query, queryOne, queryAll', link: '/single-table/query' },
          { text: 'transaction', link: '/single-table/transaction' },
          { text: 'Type Methods', link: '/single-table/type-methods' },
          { text: 'Helpers', link: '/single-table/helpers' }
        ]
      },
      {
        text: 'Schema System',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/schema/' },
          { text: 'Entities', link: '/schema/entities' },
          { text: 'Partitions', link: '/schema/partitions' },
          { text: 'Collections', link: '/schema/collections' }
        ]
      },
      {
        text: 'Examples',
        collapsed: false,
        items: [
          { text: 'Basic Usage', link: '/examples/basic-usage' },
          { text: 'Single Table Patterns', link: '/examples/single-table-patterns' },
          { text: 'Advanced Patterns', link: '/examples/advanced-patterns' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fabiosenracorrea/dynamodb-provider' }
    ],

    search: {
      provider: 'local'
    }
  }
})
