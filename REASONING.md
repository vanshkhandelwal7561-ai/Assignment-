# Engineering Reasoning

## Problem Understanding

The college AV room needs a reliable way to know what equipment exists, how many units are available for a requested date range, who has borrowed equipment, and what happens when equipment is returned late. The system must prevent overlapping reservations from exceeding physical inventory, limit one borrower from reserving too many units, and preserve deposit/late-fee accountability.

## Requirements Identified

The implementation covers:

- JWT-based registration, login, protected access, and admin authorization
- Equipment inventory with quantities, deposits, late fees, and active state
- Date-range availability based on overlapping reservations
- Booking with quantity, deposit, and a five-unit borrower limit
- User rental history and admin rental visibility
- Return processing with actual return date, late days, late fee, and refund
- Due-soon and overdue reminders in the UI
- Admin dashboard and equipment/rental management views
- Codespaces-compatible development servers

## MVP Decisions

The implementation favors direct controllers, routes, Mongoose models, and small React components. It does not add payments, email/SMS notifications, background jobs, a separate state-management library, or a booking calendar. Availability is calculated from rental records at request time, which keeps the data model simple and makes returned inventory immediately available.

## Architecture

The repository contains a Vite React client and an Express server under `equipment-rental/`.

- React Router handles client navigation.
- Axios sends API requests and adds the JWT from local storage.
- Vite proxies `/api` to the Express server for Codespaces compatibility.
- Express routes delegate to controllers.
- Authentication middleware verifies JWTs and reloads the user from MongoDB.
- Admin middleware checks the current user's database role.
- Mongoose models define users, equipment, and rentals.

## Database Design

### User

Stores name, normalized unique email, bcrypt hash, role, and created timestamp. Passwords are hashed in a Mongoose pre-save hook and are excluded from API responses.

### Equipment

Stores name, category, total physical quantity, daily late fee, deposit per unit, active state, and timestamps. Deactivation preserves inventory history.

### Rental

References one User and one Equipment. Stores quantity, start/expected/actual dates, deposit, late fee, refundable amount, status, and timestamps. Indexes support user/status, equipment/status, and expected-return/status queries.

## Availability Logic

A requested range overlaps an existing reservation when:

```text
existing.startDate <= requested.endDate
AND existing.expectedReturnDate >= requested.startDate
```

Only `BOOKED`, `ACTIVE`, and `OVERDUE` rentals reserve units. The controller sums their quantities for the equipment and returns:

```text
availableQuantity = max(0, totalQuantity - bookedQuantity)
```

The same calculation is used before creating a booking, so the API rejects a request that exceeds the current range availability.

## Booking Logic

A booking requires authentication, an active equipment record, valid `YYYY-MM-DD` dates, a positive integer quantity, and a non-reversed date range. The API checks availability first, then checks the borrower's active/upcoming unit total. A valid booking is stored with status `BOOKED` and its calculated deposit.

## Return Logic

A return requires authentication and can be processed only by the rental borrower or an admin. The API rejects missing rentals, cancelled rentals, and already returned rentals. It records the current date, late fee, refundable amount, and `RETURNED` status. Because availability excludes returned rentals, units become available without a separate inventory counter.

## Late Fee Logic

Late days are calendar days between the expected return date and actual return date, floored at zero:

```text
lateDays = max(0, actualReturnDate - expectedReturnDate)
lateFee = lateDays × dailyLateFee × quantity
```

The frontend displays `OVERDUE` when the expected date has passed and there is no actual return date. It displays a due-soon message for rentals due within two days.

## Deposit Logic

At booking:

```text
depositAmount = quantity × depositPerUnit
```

At return:

```text
refundableAmount = max(0, depositAmount - lateFee)
```

This prevents a late fee from producing a negative refund.

## Borrowing Limit

The maximum is five active/upcoming units per user:

```text
existing active/upcoming units + requested quantity <= 5
```

Returned and cancelled rentals do not count. The check uses the current UTC day boundary so a rental ending today is still counted.

## Security

- Passwords are bcrypt-hashed.
- JWT secrets and MongoDB credentials come from `.env`.
- Passwords are never returned by controllers.
- Protected routes require a Bearer token.
- Admin mutations and all-rentals access require the `ADMIN` role.
- Rental reads and returns enforce ownership unless the requester is an admin.
- `.env` and dependency folders are ignored by Git.
- Error responses use generic messages rather than database or credential details.

## Edge Cases

Handled cases include:

- Duplicate registration email
- Invalid email and short password
- Missing, invalid, and expired JWTs
- Invalid MongoDB/equipment/rental IDs
- Reversed or malformed dates
- Zero/negative/non-integer quantities
- Inactive equipment
- Overlapping reservations, including an inclusive boundary date
- Overbooking attempts
- Borrowing-limit violations
- Already returned rentals
- Late fees larger than deposits
- Equipment deactivation with rental history
- Empty equipment and rental collections

## Trade-offs Due to the 2.5-Hour Limit

- Availability is calculated with queries rather than a separate inventory ledger.
- There is no database transaction or reservation lock around the availability check; production traffic with simultaneous bookings would need atomic reservation handling.
- Status transitions are explicit return-time behavior rather than a scheduled overdue job.
- The UI is intentionally small and focuses on repeated operational workflows.
- Admin creation of users and seed equipment are not separate features; administrators can manage equipment through the API/UI, while roles are controlled in the database.
- There are no automated test files; verification was performed with focused Node scripts, API requests, syntax checks, lint, and production builds.

## Future Improvements

- Add atomic booking transactions or MongoDB reservation locks.
- Add server-side scheduled status updates for overdue rentals.
- Add pagination, filtering, and search for large inventories.
- Add admin user/role management and seed scripts.
- Add automated integration tests and frontend component tests.
- Add audit logs for equipment and return changes.
- Add secure cookie-based token storage and refresh tokens.
- Add payment processing and notification integrations only when required.
