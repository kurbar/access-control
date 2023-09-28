[![NPM Version](https://badge.fury.io/js/role-acl.svg?style=flat)](https://npmjs.org/package/role-acl) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/kyrisu/access-control/issues)

Role, Attribute and conditions based Access Control for Node.js

`npm i role-acl --save`

Many [RBAC][rbac] (Role-Based Access Control) implementations differ, but the basics is widely adopted since it simulates real life role (job) assignments. But while data is getting more and more complex; you need to define policies on resources, subjects or even environments. This is called [ABAC][abac] (Attribute-Based Access Control).

With the idea of merging the best features of the two (see this [NIST paper][nist-paper]); this library implements RBAC basics and also focuses on _resource_, _action_ attributes and conditions.

This library is an extension of [AccessControl][onury-accesscontrol]. But I removed support for possession and deny statements from orginal implementation.

### Core Features

- Chainable, friendly API.  
  e.g. `ac.can(role).execute('create').on(resource)`
- Role hierarchical inheritance.
- Define grants at once (e.g. from database result) or one by one.
- Grant permissions by resources and actions define by glob notation.
- Grant permissions by attributes defined by glob notation (with nested object support).
- Ability to filter data (model) instance by allowed attributes.
- Ability to control access using conditions.
- Supports AND, OR, NOT, EQUALS, NOT_EQUALS, STARTS_WITH, LIST_CONTAINS core conditions.
- You can specify dynamic context values in the core conditions using JSON Paths.
- Supports your own custom conditions e.g. `custom:isArticleOwner`.
- You can define your own function conditions too but please note if you use custom functions instead of standard conditions, you won't be able to save them as json in the DB.
- Policies are JSON compatible so can be stored and retrieved from database.
- Fast. (Grants are stored in memory, no database queries.)
- TypeScript support.
- **Note**:
  - For versions < 4.0: follow this [ReadMe](https://github.com/kyrisu/access-control/blob/6cde220e5d4956270c60f5fe58f84dcd8a257924/README.md).

## Guide

```js
const AccessControl = require("role-acl");
// or:
// import { AccessControl } from 'role-acl';
```

## Examples

### Basic Examples

Define roles and grants one by one.

```js
const ac = new AccessControl();
ac.grant("user") // define new or modify existing role. also takes an array.
  .execute("create")
  .on("video") // equivalent to .execute('create').on('video', ['*'])
  .execute("delete")
  .on("video")
  .execute("read")
  .on("video")
  .grant("admin") // switch to another role without breaking the chain
  .extend("user") // inherit role capabilities. also takes an array
  .execute("update")
  .on("video", ["title"]) // explicitly defined attributes
  .execute("delete")
  .on("video");

const permission = ac.can("user").execute("create").sync().on("video"); // <-- Sync Example
const permission = await ac.can("user").execute("create").on("video"); // <-- Async Example
console.log(permission.granted); // —> true
console.log(permission.attributes); // —> ['*'] (all attributes)

permission = ac.can("admin").execute("update").sync().on("video"); // <-- Sync Example
permission = await ac.can("admin").execute("update").on("video"); // <-- Async Example
console.log(permission.granted); // —> true
console.log(permission.attributes); // —> ['title']
```

### Conditions Examples

```js
const ac = new AccessControl();
ac.grant("user")
  .condition({
    Fn: "EQUALS",
    args: {
      category: "sports",
    },
  })
  .execute("create")
  .on("article");

let permission = ac
  .can("user")
  .context({ category: "sports" })
  .execute("create")
  .sync()
  .on("article"); // <-- Sync Example
let permission = await ac
  .can("user")
  .context({ category: "sports" })
  .execute("create")
  .on("article"); // <-- Async Example
console.log(permission.granted); // —> true
console.log(permission.attributes); // —> ['*'] (all attributes)

permission = ac
  .can("user")
  .context({ category: "tech" })
  .execute("create")
  .sync()
  .on("article"); // <-- Sync Example
permission = await ac
  .can("user")
  .context({ category: "tech" })
  .execute("create")
  .on("article"); // <-- Async Example
console.log(permission.granted); // —> false
console.log(permission.attributes); // —> []

// Condition with dynamic context values using JSONPath
// We can use this to allow only owner of the article to edit it
ac.grant("user")
  .condition({
    Fn: "EQUALS",
    args: {
      requester: "$.owner",
    },
  })
  .execute("edit")
  .on("article");

permission = ac
  .can("user")
  .context({ requester: "dilip", owner: "dilip" })
  .execute("edit")
  .sync()
  .on("article"); // <-- Sync Example
permission = await ac
  .can("user")
  .context({ requester: "dilip", owner: "dilip" })
  .execute("edit")
  .on("article"); // <-- Async Example
console.log(permission.granted); // —> true

// We can use this to prevent someone to approve their own article so that it goes to review
// by someone else before publishing
ac.grant("user")
  .condition({
    Fn: "NOT_EQUALS",
    args: {
      requester: "$.owner",
    },
  })
  .execute("approve")
  .on("article");

permission = ac
  .can("user")
  .context({ requester: "dilip", owner: "dilip" })
  .execute("approve")
  .sync()
  .on("article"); // <-- Sync Example
permission = await ac
  .can("user")
  .context({ requester: "dilip", owner: "dilip" })
  .execute("approve")
  .on("article"); // <-- Async Example
console.log(permission.granted); // —> false

// Using custom/own condition functions
ac.grant("user")
  .condition((context) => {
    return context.category !== "politics";
  })
  .execute("create")
  .on("article");
permission = ac
  .can("user")
  .context({ category: "sports" })
  .execute("create")
  .sync()
  .on("article"); // <-- Sync Example
permission = await ac
  .can("user")
  .context({ category: "sports" })
  .execute("create")
  .on("article"); // <-- Async Example
console.log(permission.granted); // —> true
```

### Custom Conditions

You can declare your own conditions (**requires version >= 4.5.2**). Those declarations should be registerd with the library BEFORE your grants and permission checks. The custom condition declarations are allowing you to extend the library core conditions with your own business logic without sacrificing the abillity to serialize your grants.

**Basic example:**

```js
// 1. Define the condition handler
const greaterOrEqual = (context, args) => {
  if (!args || typeof args.level !== "number") {
    throw new Error('custom:gte requires "level" argument');
  }

  return +context.level >= args.level;
};

const ac = new AccessControl();

// 2. Register the condition with appropriate name
ac.registerConditionFunction("gte", greaterOrEqual);

// 3. Use it in grants, same as core conditions but with "custom:" prefix
ac.grant("user")
  .condition({
    Fn: "custom:gte",
    args: { level: 2 },
  })
  .execute("comment")
  .on("article");

// 4. Evaluate permissions with appropraite context (sync) - same as core conditions
const permission1 = ac
  .can("user")
  .context({ level: 2 })
  .execute("comment")
  .sync()
  .on("article");

// prints "LEVEL 2 true"
console.log("LEVEL 2", permission1.granted);

const permission2 = ac
  .can("user")
  .context({ level: 1 })
  .execute("comment")
  .sync()
  .on("article");

// prints "LEVEL 1 false"
console.log("LEVEL 1", permission2.granted);
```

**Argument is optional:**

Custom condition argument is optional - same as core conditions.

```js
const myConditions = {
  isArticleOwner: (context) => {
    return (
      context.loginUserId && context.loginUserId === context.articleOwnerId
    );
  },
};
const ac = new AccessControl();
ac.registerConditionFunction("isArticleOwner", myConditions.isArticleOwner);
ac.gr;
```
