declare module '*.md' {
  import type React from 'react';
  const Component: React.ComponentType<{ components?: Record<string, any> }>;
  export default Component;
}

declare module '*.mdx' {
  import type React from 'react';
  const Component: React.ComponentType<{ components?: Record<string, any> }>;
  export default Component;
}
