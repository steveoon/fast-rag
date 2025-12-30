完美！我已经用多维搜索工具为你查到了最新和最权威的资源。让我为你整理一份详细的总结：

## 📚 Zustand 在 Next.js 中使用 - 完整指南

基于我查找到的官方文档和最新实践，这是 2025 年最新的使用方法：

### **1. Next.js 的独特挑战** [1]

Zustand 在 Next.js 中有几个重要的考虑点：

| 挑战                  | 说明                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| **Per-request store** | Next.js 服务器同时处理多个请求，store 必须**按请求创建**，而不是全局共享  |
| **SSR 友好**          | Next.js 应用会渲染两次（服务器端和客户端），不同输出会导致 hydration 错误 |
| **SPA 路由**          | 需要在组件级别使用 Context 来重置 store                                   |
| **服务器缓存**        | App Router 支持积极的服务器缓存，Zustand 的模块状态与之兼容               |

### **2. 官方推荐的做法：Per-Request Store** [1]

**核心原则：**

- ❌ **不要使用全局 store** - 因为 store 不应跨请求共享
- ❌ **RSC 不应读写 store** - React Server Components 无法使用 hooks 或 context
- ✅ **每个请求创建新 store** - 使用工厂函数

**创建 Store（使用 `zustand/vanilla`）**

```typescript
// src/stores/counter-store.ts
import { createStore } from 'zustand/vanilla';

export type CounterState = {
  count: number;
};

export type CounterActions = {
  decrementCount: () => void;
  incrementCount: () => void;
};

export type CounterStore = CounterState & CounterActions;

export const defaultInitState: CounterState = {
  count: 0,
};

export const createCounterStore = (initState: CounterState = defaultInitState) => {
  return createStore<CounterStore>()(set => ({
    ...initState,
    decrementCount: () => set(state => ({ count: state.count - 1 })),
    incrementCount: () => set(state => ({ count: state.count + 1 })),
  }));
};
```

**创建 Provider 包装** [1]

```typescript
// src/providers/counter-store-provider.tsx
'use client'

import { ReactNode, createContext, useState, useContext } from 'react'
import { useStore } from 'zustand'
import {
  type CounterStore,
  createCounterStore
} from '@/stores/counter-store'

export type CounterStoreApi = ReturnType<typeof createCounterStore>

export const CounterStoreContext = createContext<CounterStoreApi | undefined>(
  undefined,
)

export interface CounterStoreProviderProps {
  children: ReactNode
}

export const CounterStoreProvider = ({
  children,
}: CounterStoreProviderProps) => {
  const [store] = useState(() => createCounterStore())
  return (
    <CounterStoreContext.Provider value={store}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export const useCounterStore = <T,>(
  selector: (store: CounterStore) => T,
): T => {
  const counterStoreContext = useContext(CounterStoreContext)
  if (!counterStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`)
  }
  return useStore(counterStoreContext, selector)
}
```

### **3. 在 App Router（Next.js 13+）中使用** [1]

```typescript
// src/app/layout.tsx
import { CounterStoreProvider } from '@/providers/counter-store-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <CounterStoreProvider>
          {children}
        </CounterStoreProvider>
      </body>
    </html>
  )
}
```

```typescript
// src/app/page.tsx
'use client'

import { useCounterStore } from '@/providers/counter-store-provider'

export default function Home() {
  const { count, incrementCount, decrementCount } = useCounterStore(
    (state) => state
  )

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementCount}>+</button>
      <button onClick={decrementCount}>-</button>
    </div>
  )
}
```

### **4. 高级技巧：Slice-Based 架构** [2]

对于复杂的应用，可以使用 **slice-based** 架构来组织 store：

**项目结构：**

```
store/
├─slices/
│ ├─traveler-slice.ts
│ ├─application-slice.ts
│ └─insurance-slice.ts
└─agency-store.ts
```

**创建 Slice：**

```typescript
// store/slices/traveler-slice.ts
import { StateCreator } from 'zustand';

export type TravelerSlice = {
  travelers: Record<number, { name: string; passport: string }>;
  addTraveler: (data: { name: string; passport: string }) => void;
  removeTraveler: (id: number) => void;
};

export const createTravelerSlice: StateCreator<TravelerSlice> = set => ({
  travelers: {},
  addTraveler: data =>
    set(state => {
      state.travelers[Date.now()] = data;
    }),
  removeTraveler: id =>
    set(state => {
      delete state.travelers[id];
    }),
});
```

**合并 Slices：**

```typescript
// store/agency-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createTravelerSlice, TravelerSlice } from './slices/traveler-slice';

export type Store = TravelerSlice; // 可以继续添加其他 slices

export const useAgencyStore = create<Store>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createTravelerSlice(...args),
        // ...其他 slices
      })),
      { name: 'agency-store' }
    ),
    { name: 'AgencyDevtools' }
  )
);
```

### **5. 中间件选项** [2]

| 中间件                    | 用途                           | 示例             |
| ------------------------- | ------------------------------ | ---------------- |
| **devtools**              | Redux DevTools 集成，用于调试  | 时间旅行调试     |
| **persist**               | localStorage 持久化            | 刷新后恢复状态   |
| **immer**                 | 简化 immutable 更新            | 直接修改状态对象 |
| **subscribeWithSelector** | 细粒度订阅，避免不必要重新渲染 | 只监听特定字段   |

### **6. 性能优化：useShallow** [2]

避免不必要的重新渲染：

```typescript
import { useShallow } from 'zustand/react/shallow';

const userInfo = useAgencyStore(
  useShallow(store => ({
    name: store.user.name,
    age: store.user.age,
  }))
);
// 只在 name 或 age 改变时重新渲染
```

### **7. 常见陷阱** [1][2]

⚠️ **Server vs. Client**

- 不要在服务器组件中导入 client store

⚠️ **中间件顺序**

- devtools > persist > subscribeWithSelector > immer

⚠️ **localStorage 限制**

- 持久化大量数据可能超过存储空间

⚠️ **性能**

- 对大数据集使用 selector 或 useShallow

---

## 📖 参考资源

[1] **官方文档**：https://zustand.docs.pmnd.rs/guides/nextjs
[2] **Heinrich Winterbach 的完整教程（2025）**：https://engineering.atlys.com/a-slice-based-zustand-store-for-next-js-14-and-typescript-6b92385a48f5

这是最新的、经过验证的最佳实践！有任何具体问题都可以继续提问。
