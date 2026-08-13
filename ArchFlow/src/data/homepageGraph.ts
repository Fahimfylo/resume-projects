import { Node, Edge } from '@xyflow/react';
import { EntityNodeData, RelationshipEdgeData } from '../types';

/**
 * Sample "NEXUS Web Platform" system-level graph used by the homepage hero.
 * Reuses the exact EntityNode / RelationshipEdge data shapes the product
 * renders so the marketing canvas is indistinguishable from the real thing.
 */
export const NEXUS_GRAPH_NODES: Node<EntityNodeData>[] = [
  {
    id: 'landing',
    type: 'entityNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Landing Page',
      subtitle: 'Page View',
      category: 'page',
      filePath: 'src/pages/LandingPage.tsx',
      stats: { lines: 210, complexity: 'Low', calls: 6 },
      childCount: 0,
    },
  },
  {
    id: 'grid',
    type: 'entityNode',
    position: { x: 0, y: 260 },
    data: {
      label: 'ProductGrid',
      subtitle: 'React Component',
      category: 'component',
      filePath: 'src/components/ProductGrid.tsx',
      stats: { lines: 148, complexity: 'Low', calls: 12 },
      childCount: 0,
    },
  },
  {
    id: 'checkout',
    type: 'entityNode',
    position: { x: 0, y: 520 },
    data: {
      label: 'CheckoutFlow',
      subtitle: 'React Component',
      category: 'component',
      filePath: 'src/components/CheckoutFlow.tsx',
      stats: { lines: 264, complexity: 'Medium', calls: 18 },
      childCount: 0,
    },
  },
  {
    id: 'useCart',
    type: 'entityNode',
    position: { x: 380, y: 0 },
    data: {
      label: 'useCart',
      subtitle: 'React Hook',
      category: 'hook',
      filePath: 'src/hooks/useCart.ts',
      stats: { lines: 96, complexity: 'Low', calls: 9 },
      childCount: 0,
    },
  },
  {
    id: 'useProducts',
    type: 'entityNode',
    position: { x: 380, y: 260 },
    data: {
      label: 'useProducts',
      subtitle: 'React Hook',
      category: 'hook',
      filePath: 'src/hooks/useProducts.ts',
      stats: { lines: 88, complexity: 'Low', calls: 11 },
      childCount: 0,
    },
  },
  {
    id: 'store',
    type: 'entityNode',
    position: { x: 380, y: 520 },
    data: {
      label: 'Global Store',
      subtitle: 'State Store',
      category: 'store',
      filePath: 'src/store/appStore.ts',
      stats: { lines: 142, complexity: 'Low', calls: 24 },
      childCount: 2,
      subNodes: [
        { id: 'cart-slice', label: 'CartSlice', category: 'store', subtitle: 'state slice' },
        { id: 'user-slice', label: 'UserSlice', category: 'store', subtitle: 'state slice' },
      ],
    },
  },
  {
    id: 'productsRoute',
    type: 'entityNode',
    position: { x: 760, y: 0 },
    data: {
      label: '/api/products',
      subtitle: 'API Route',
      category: 'route',
      filePath: 'src/routes/products.ts',
      stats: { lines: 42, complexity: 'Low', calls: 3 },
      childCount: 0,
    },
  },
  {
    id: 'productController',
    type: 'entityNode',
    position: { x: 760, y: 260 },
    data: {
      label: 'ProductController',
      subtitle: 'Controller',
      category: 'controller',
      filePath: 'src/controllers/product.controller.ts',
      stats: { lines: 176, complexity: 'Low', calls: 22 },
      childCount: 0,
    },
  },
  {
    id: 'productService',
    type: 'entityNode',
    position: { x: 760, y: 520 },
    data: {
      label: 'ProductService',
      subtitle: 'Service',
      category: 'service',
      filePath: 'src/services/product.service.ts',
      stats: { lines: 232, complexity: 'Medium', calls: 31 },
      childCount: 0,
    },
  },
  {
    id: 'productModel',
    type: 'entityNode',
    position: { x: 1140, y: 260 },
    data: {
      label: 'Product',
      subtitle: 'ORM Model',
      category: 'model',
      filePath: 'src/models/Product.ts',
      stats: { lines: 98, complexity: 'Low', calls: 8 },
      childCount: 0,
    },
  },
  {
    id: 'productsTable',
    type: 'entityNode',
    position: { x: 1140, y: 520 },
    data: {
      label: 'products',
      subtitle: 'DB Table',
      category: 'db-table',
      filePath: 'src/db/schema.ts',
      stats: { lines: 64, complexity: 'Low', calls: 0 },
      childCount: 0,
    },
  },
  {
    id: 'stripe',
    type: 'entityNode',
    position: { x: 1140, y: 0 },
    data: {
      label: 'Stripe API',
      subtitle: 'External API',
      category: 'external-api',
      filePath: 'src/services/stripe.client.ts',
      stats: { lines: 120, complexity: 'Low', calls: 14 },
      childCount: 0,
    },
  },
];

export const NEXUS_GRAPH_EDGES: Edge<RelationshipEdgeData>[] = [
  {
    id: 'e-landing-grid',
    source: 'landing',
    target: 'grid',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'IMPORTS',
      evidence: {
        filePath: 'src/pages/LandingPage.tsx',
        lineNumber: 4,
        codeSnippet: "import { ProductGrid } from '../components/ProductGrid';",
        confidence: 99,
      },
    },
  },
  {
    id: 'e-landing-checkout',
    source: 'landing',
    target: 'checkout',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'IMPORTS',
      evidence: {
        filePath: 'src/pages/LandingPage.tsx',
        lineNumber: 6,
        codeSnippet: "import { CheckoutFlow } from '../components/CheckoutFlow';",
        confidence: 99,
      },
    },
  },
  {
    id: 'e-grid-useproducts',
    source: 'grid',
    target: 'useProducts',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'USES',
      evidence: {
        filePath: 'src/components/ProductGrid.tsx',
        lineNumber: 12,
        codeSnippet: 'const { products, loading } = useProducts();',
        confidence: 98,
      },
    },
  },
  {
    id: 'e-checkout-usecart',
    source: 'checkout',
    target: 'useCart',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'USES',
      evidence: {
        filePath: 'src/components/CheckoutFlow.tsx',
        lineNumber: 15,
        codeSnippet: 'const { items, subtotal } = useCart();',
        confidence: 98,
      },
    },
  },
  {
    id: 'e-usecart-store',
    source: 'useCart',
    target: 'store',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'READS_FROM',
      evidence: {
        filePath: 'src/hooks/useCart.ts',
        lineNumber: 22,
        codeSnippet: 'const items = useAppStore((s) => s.cart.items);',
        confidence: 97,
      },
    },
  },
  {
    id: 'e-useproducts-store',
    source: 'useProducts',
    target: 'store',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'READS_FROM',
      evidence: {
        filePath: 'src/hooks/useProducts.ts',
        lineNumber: 19,
        codeSnippet: 'const setProducts = useAppStore((s) => s.setProducts);',
        confidence: 97,
      },
    },
  },
  {
    id: 'e-route-controller',
    source: 'productsRoute',
    target: 'productController',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'ROUTES_TO',
      evidence: {
        filePath: 'src/routes/products.ts',
        lineNumber: 8,
        codeSnippet: "router.get('/', productController.list);",
        confidence: 99,
      },
    },
  },
  {
    id: 'e-controller-service',
    source: 'productController',
    target: 'productService',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'CALLS',
      evidence: {
        filePath: 'src/controllers/product.controller.ts',
        lineNumber: 27,
        codeSnippet: 'const products = await productService.list({ limit });',
        confidence: 98,
      },
    },
  },
  {
    id: 'e-service-model',
    source: 'productService',
    target: 'productModel',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'USES',
      evidence: {
        filePath: 'src/services/product.service.ts',
        lineNumber: 34,
        codeSnippet: 'return Product.query().where("active", true);',
        confidence: 96,
      },
    },
  },
  {
    id: 'e-service-stripe',
    source: 'productService',
    target: 'stripe',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'CALLS',
      evidence: {
        filePath: 'src/services/product.service.ts',
        lineNumber: 51,
        codeSnippet: 'await stripeClient.createCheckoutSession(lineItems);',
        confidence: 95,
      },
    },
  },
  {
    id: 'e-model-table',
    source: 'productModel',
    target: 'productsTable',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'READS_FROM',
      evidence: {
        filePath: 'src/models/Product.ts',
        lineNumber: 9,
        codeSnippet: 'export const Product = sqlTable("products", { ... });',
        confidence: 97,
      },
    },
  },
  {
    id: 'e-controller-model',
    source: 'productController',
    target: 'productModel',
    type: 'relationshipEdge',
    data: {
      relationshipType: 'USES',
      evidence: {
        filePath: 'src/controllers/product.controller.ts',
        lineNumber: 41,
        codeSnippet: 'await product.toJSON();',
        confidence: 93,
      },
    },
  },
];
