# Coin98 History Guide

Congrats! You just saved yourself hours of work by bootstrapping this project with TSDX. Let’s get you oriented with what’s here and how to use it.

> This TSDX setup is meant for developing libraries (not apps!) that can be published to NPM. If you’re looking to build a Node app, you could use `ts-node-dev`, plain `ts-node`, or simple `tsc`.

> If you’re new to TypeScript, checkout [this handy cheatsheet](https://devhints.io/typescript)

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
