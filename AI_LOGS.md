I have been given the following Builder Round problem statement:

"The college AV room lends out gear — DSLR cameras, projectors, mics, tripods — and popular items have several units. Today it’s a paper register nobody keeps up to date, so kit goes missing and two clubs show up for the same projector. Students keep asking ‘is a DSLR free this weekend?’ and no one can say. Borrowers hang on to things far too long, so a sensible return date and a small per-day late fee would help, and a refundable deposit keeps people honest — returned minus any late fee. And one person shouldn’t be able to book out half the room at once.

Build something to track the gear and nudge people to return it.

Notice the questions people ask and the gaps in the paper register — solving those is the job, for any lending desk and not just this one. Get borrowing, availability and returns solid first, then deposits and limits."

I need a step-by-step plan and prompts to give AI for building the solution.

AI
Use a step-by-step development process. Build the MVP first:

Requirement analysis

Architecture

Project setup

Database models

Authentication

Equipment management

Availability

Booking/rental

User dashboard

Return equipment

Deposits

Borrowing limits

Overdue handling

Return reminders

Admin dashboard

UI improvement

Validation and edge cases

Security review

Testing

README and REASONING

Final submission check

Recommended stack:

React.js

Vite

Tailwind CSS

React Router

Axios

Node.js

Express.js

MongoDB Atlas

Mongoose

JWT

bcrypt

Project structure:

equipment-rental/
├── client/
├── server/
├── README.md
├── REASONING.md
├── AI_LOGS.md
└── .gitignore

Core flow:
Register/Login
→ Equipment List
→ Check Availability
→ Select quantity + dates
→ Create Booking
→ My Rentals
→ Return Equipment
→ Calculate Late Fee
→ Calculate Deposit Refund
→ Equipment Available Again

User
We do on the Codespace GitHub.

AI
Yes. Build the entire project directly inside GitHub Codespaces.

Use two terminals:

Terminal 1:
cd server
npm run dev

Terminal 2:
cd client
npm run dev

Keep README.md, REASONING.md and AI_LOGS.md at the repository root.

Commit and push working versions regularly.

User
Bro localhost error is arising.

AI
Check:

Whether frontend is running

Whether backend is running

Correct ports

Codespaces port forwarding

Express host configuration

Vite host configuration

npm/dependency errors

For Express, Codespaces should listen on 0.0.0.0, for example:

app.listen(PORT, '0.0.0.0', () => {
console.log(Server running on port ${PORT});
});

Check the Codespaces Ports tab and open the forwarded frontend port.

User
How to create MongoDB Atlas URI?

AI
Create a MongoDB Atlas cluster, create a database user, configure Network Access, then use Database → Connect → Drivers and select Node.js.

The connection string looks approximately like:

mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/equipment_rental?retryWrites=true&w=majority

Put it in server/.env as:

MONGO_URI=your_mongodb_atlas_uri

Also use:

PORT=5000
JWT_SECRET=your_secret

Never commit .env.

User
Next.

AI
Implement authentication:

Registration

Login

bcrypt password hashing

JWT

Authentication middleware

GET /api/auth/me

Admin authorization

Endpoints:
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Use:
Authorization: Bearer <token>

Test successful registration, duplicate email, login, wrong password, valid token, invalid token and missing token.

User
Bro quickly do it. How many steps are remaining? Give quickly.

AI
Use a faster approach and combine related work.

Remaining core work:

Equipment + availability + booking

Return + late fee + deposit

Borrowing limit + overdue/reminders

Admin dashboard + UI

Final testing + README + REASONING

Prioritize:
Authentication
→ Equipment
→ Availability
→ Booking
→ Return
→ Late Fee
→ Deposit
→ Borrowing Limit

Avoid real payment gateways, email, SMS, complex notifications and unnecessary animations.

User
The UI is very bad. Make it better, use blue, make professional UI.

AI
Redesign the frontend as a professional SaaS-style application.

Use:

White/light background

Slate/dark text

Blue as primary accent

Light blue active states

Gray borders

Rounded cards

Subtle shadows

Professional sidebar

Clean header

Dashboard cards

Equipment cards

My Rentals table

Booking form

Return modal

Transfer modal

Admin dashboard

Login/Register pages

Use icons instead of emojis and keep backend/business logic unchanged.

User
I forgot to add the twist. Also add the button or required functionality.

The solution must allow an active loan to be transferred from one borrower to another. The original due date carries over unchanged, and the item's availability is unaffected by the transfer.

AI
Implement Loan Transfer.

Important rule:
Transfer the borrower on the existing active rental. Do NOT return the old rental and create a new rental.

Example:

Before:
User A
DSLR
Quantity: 2
Due date: September 25

After:
User B
DSLR
Quantity: 2
Due date: September 25

Availability remains unchanged.

Endpoint:

POST /api/rentals//transfer

Request:

{
"newBorrowerId": "USER_ID"
}

Validate:

Rental exists

Rental is active

Rental is not returned

New borrower exists

New borrower is not current borrower

New borrower does not exceed borrowing limit

Unauthorized users cannot transfer another user's loan

Update the existing rental's user field.

Optional transferHistory can record fromUser, toUser and transferredAt.

The original expectedReturnDate must remain unchanged.

Add a Transfer Loan button and professional transfer modal.

User
Now make the UI better. Add dark/light mode, better font size, professional UI like a real website.

AI
Create a polished modern SaaS UI with:

Blue primary accent

Light mode

Dark mode

Professional sidebar

Clean header

Better typography

Consistent cards

Better tables

Professional forms

Status badges

Responsive design

Loading/error/empty states

Icons

Loan transfer modal

Return modal

Keep business logic unchanged.

User
I forgot also add button color or theme. The theme change should be black, not blue, and header should be right because it looks bad.

AI
Use a proper black/charcoal dark theme.

Dark mode:
Main background: #09090B
Secondary: #111113
Cards: #18181B
Borders: #27272A
Primary text: #FAFAFA
Secondary text: #A1A1AA

Blue should only be an accent.

Light mode:
Background: #F8FAFC
Cards: #FFFFFF
Text: #0F172A
Borders: #E2E8F0
Primary: #2563EB

Buttons:
Primary = blue
Secondary = neutral/outline
Danger = red
Success = green

Header:

Approximately 64px

Sticky

Thin bottom border

White in light mode

Black/charcoal in dark mode

No large blue background

Theme toggle on right

User avatar/name on right

Breadcrumb/page title on left

Sidebar:

White in light mode

Black/charcoal in dark mode

Blue only for active navigation

Approximately 240–260px

Dark mode should be black/charcoal, not blue.

