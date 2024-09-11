# Coin98 History Guide

Victoria xao quyet xin chao

```tsx
  const historyServices = new HistoryServices()

  const historyResponse = await historyServices.getHistory({
        address, //wallet address
        chain, //chain
        token, //non_native token(optionals)
        pagination:{ //pagination
          page,
          limit: 20
        }
    })
```
