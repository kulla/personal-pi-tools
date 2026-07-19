# Refactoring Examples

Extended examples for the `refactor` skill. These examples illustrate transformations; adapt names and behavior to the target codebase.

## Long method

```ts
// Before
async function processOrder(orderId) {
  const order = await fetchOrder(orderId);
  validateOrder(order);
  const pricing = calculatePricing(order);
  await updateInventory(order);
  const shipment = await createShipment(order);
  await sendNotifications(order, pricing, shipment);
  return { order, pricing, shipment };
}

// After: the orchestration remains readable while each operation is focused.
```

## Duplicated code

```ts
function getMembershipDiscountRate(membership) {
  const rates = { gold: 0.2, silver: 0.1 };
  return rates[membership] || 0;
}

function calculateUserDiscount(user) {
  return user.total * getMembershipDiscountRate(user.membership);
}

function calculateOrderDiscount(order) {
  return order.total * getMembershipDiscountRate(order.user.membership);
}
```

## Large class

```ts
class UserService {
  create(data) { /* ... */ }
  update(id, data) { /* ... */ }
  delete(id) { /* ... */ }
}

class EmailService {
  send(to, subject, body) { /* ... */ }
}

class ReportService {
  generate(type, params) { /* ... */ }
}

class PaymentService {
  process(amount, method) { /* ... */ }
}
```

## Parameter object and domain types

```ts
interface UserData {
  email: string;
  password: string;
  name: string;
  age?: number;
  address?: Address;
  phone?: string;
}

function createUser(data: UserData) {
  // Preserve validation and construction behavior here.
}

class Email {
  private constructor(public readonly value: string) {}
  static create(value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Invalid email');
    return new Email(value);
  }
}
```

## Guard clauses

```ts
function process(order) {
  if (!order) return { error: 'No order' };
  if (!order.user) return { error: 'No user' };
  if (!order.user.isActive) return { error: 'User inactive' };
  if (order.total <= 0) return { error: 'Invalid total' };
  return processOrder(order);
}
```

## Extract method

```ts
function printReport(users) {
  printHeader('USER REPORT');
  console.log(`Total users: ${users.length}\n`);
  printUserSection('ACTIVE USERS', users.filter(u => u.isActive));
  printUserSection('INACTIVE USERS', users.filter(u => !u.isActive));
}

function printHeader(title) {
  const line = '='.repeat(title.length);
  console.log(title);
  console.log(line);
  console.log('');
}

function printUserSection(title, users) {
  console.log(title);
  console.log('-'.repeat(title.length));
  users.forEach(u => console.log(`- ${u.name} (${u.email})`));
  console.log('');
  console.log(`${title.split(' ')[0]}: ${users.length}`);
  console.log('');
}
```

## Type safety

```ts
type Membership = 'bronze' | 'silver' | 'gold';
interface User { id: string; name: string; membership: Membership; }
interface DiscountResult { original: number; discount: number; final: number; rate: number; }

function calculateDiscount(user: User, total: number, date = new Date()): DiscountResult {
  if (total < 0) throw new Error('Total cannot be negative');
  let rate = 0.1;
  if (user.membership === 'gold' && date.getDay() === 5) rate = 0.25;
  else if (user.membership === 'gold') rate = 0.2;
  else if (user.membership === 'silver') rate = 0.15;
  const discount = total * rate;
  return { original: total, discount, final: total - discount, rate };
}
```

## Strategy pattern

```ts
interface ShippingStrategy { calculate(order: Order): number; }
class StandardShipping implements ShippingStrategy {
  calculate(order: Order) { return order.total > 50 ? 0 : 5.99; }
}
class ExpressShipping implements ShippingStrategy {
  calculate(order: Order) { return order.total > 100 ? 9.99 : 14.99; }
}
class OvernightShipping implements ShippingStrategy {
  calculate(_order: Order) { return 29.99; }
}
function calculateShipping(order: Order, strategy: ShippingStrategy) {
  return strategy.calculate(order);
}
```

## Chain of responsibility

```ts
abstract class Validator {
  private next?: Validator;
  abstract doValidate(user: User): string | null;
  setNext(validator: Validator): Validator { this.next = validator; return validator; }
  validate(user: User): string | null {
    const error = this.doValidate(user);
    return error ?? this.next?.validate(user) ?? null;
  }
}

class EmailRequiredValidator extends Validator {
  doValidate(user: User) { return !user.email ? 'Email required' : null; }
}

const validator = new EmailRequiredValidator()
  .setNext(new EmailFormatValidator())
  .setNext(new NameRequiredValidator());
```

## Other code smells

- **Feature envy:** move behavior to the object that owns the data, then call a small domain method.
- **Magic values:** replace status codes, rates, and durations with named constants.
- **Dead code:** remove unused imports, functions, constants, and commented-out implementations.
- **Inappropriate intimacy:** expose operations such as `order.getShippingAddress()` instead of reaching through nested internals.

## Smell catalogue

| Smell | Typical refactoring |
| --- | --- |
| Long method | Extract method |
| Duplicated code | Extract shared function |
| Large class | Extract class |
| Long parameter list | Introduce parameter object |
| Feature envy | Move method |
| Primitive obsession | Introduce domain type |
| Magic number/string | Replace with constant |
| Nested conditional | Guard clauses or polymorphism |
| Dead code | Delete it |
| Inappropriate intimacy | Encapsulate field or method |
