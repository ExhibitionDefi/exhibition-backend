# Exhibition Backend

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

***Off-chain metadata service for the Exhibition protocol.***

</div>

---

## Overview

Exhibition is a fully on-chain protocol — all launch parameters, contributions, liquidity events, and fund flows are enforced and recorded on Nexus Layer 1. This backend does not touch any of that.

Its sole responsibility is storing and serving the off-chain metadata that projects optionally attach to their launches: a human-readable overview and social links. This data is purely presentational — it has no effect on protocol execution and is never referenced by the smart contracts.

Access is authenticated via wallet signature and JWT, ensuring only a verified project owner can update their own launch metadata.

---

## Responsibilities

- Authenticate project owners via wallet signature and issue a JWT
- Store and update off-chain launch metadata — overview text and social links — per project
- Serve metadata to the frontend by project ID

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express |
| Database | MongoDB Atlas |
| Auth | Wallet signature + JWT |
| Sessions | Cookies |

---

## Authentication Flow

```
1. Frontend requests a challenge nonce for a given wallet address
2. User signs the nonce with their wallet (EIP-191)
3. Backend verifies the signature and confirms wallet ownership
4. Backend issues a signed JWT stored in an HTTP-only cookie
5. Subsequent requests to protected routes are authenticated via the cookie
```

This ensures only the verified owner of a wallet address can create or update metadata for launches associated with that address.

---

## API Reference

### Auth

**`POST /auth/challenge`**
Request a sign message challenge for a wallet address.

```json
// Request
{ "address": "0x123..." }

// Response
{ "nonce": "Sign this message to verify your wallet: a3f9..." }
```

**`POST /auth/verify`**
Verify a signed challenge and issue a JWT cookie.

```json
// Request
{ "address": "0x123...", "signature": "0xabc..." }

// Response
{ "success": true }
// Sets HTTP-only JWT cookie
```

**`POST /auth/logout`**
Clear the JWT cookie and end the session.

---

### Metadata

**`GET /projects/:projectId/metadata`**
Fetch off-chain metadata for a project. Public — no authentication required.

```json
// Response
{
  "projectId": "42",
  "overview": "A short description of the project...",
  "socials": {
    "website": "https://example.xyz",
    "twitter": "https://twitter.com/example",
    "telegram": "https://t.me/example",
    "discord": "https://discord.gg/example",
    "github": "https://github.com/example"
  }
}
```

**`POST /projects/:projectId/metadata`**
Create or update metadata for a project. Requires a valid JWT cookie. The authenticated wallet must match the project owner address on-chain.

```json
// Request
{
  "overview": "A short description of the project...",
  "socials": {
    "website": "https://example.xyz",
    "twitter": "https://twitter.com/example",
    "telegram": "https://t.me/example",
    "discord": "https://discord.gg/example",
    "github": "https://github.com/example"
  }
}

// Response
{ "success": true }
```

---

## Data Model

```js
// ProjectMetadata
{
  projectId:  String,   // On-chain project ID (unique)
  address:    String,   // Owner wallet address
  overview:   String,   // Project description (plaintext)
  socials: {
    website:  String,
    twitter:  String,
    telegram: String,
    discord:  String,
    github:   String,
  },
  updatedAt:  Date,
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster and connection string

### Installation

```bash
git clone https://github.com/your-org/exhibition-backend
cd exhibition-backend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```dotenv
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/exhibition

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=your_cookie_secret_here

# CORS
ALLOWED_ORIGIN=http://localhost:3000
```

### Development

```bash
npm run dev
```

Server runs at [http://localhost:4000](http://localhost:4000).

### Build & Start

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── routes/
│   ├── auth.ts          # Wallet signature + JWT endpoints
│   └── metadata.ts      # Project metadata endpoints
├── controllers/
│   ├── auth.ts          # Auth logic
│   └── metadata.ts      # Metadata CRUD logic
├── middleware/
│   ├── authenticate.ts  # JWT cookie verification
│   └── validate.ts      # Request body validation
├── models/
│   └── ProjectMetadata.ts  # Mongoose schema
├── lib/
│   ├── db.ts            # MongoDB Atlas connection
│   ├── jwt.ts           # JWT sign + verify helpers
│   └── signature.ts     # EIP-191 signature verification
└── app.ts               # Express app entry point
```

---

## Security Notes

- JWTs are stored in HTTP-only cookies — not accessible to client-side JavaScript
- Signature verification confirms wallet ownership before any write is permitted
- All write operations validate that the authenticated wallet matches the project owner address recorded on-chain
- No private keys or on-chain state are ever handled by this service

---

## License

MIT

---

<div align="center">

**Built by the Exhibition Developer**

[App](https://app.exhibitiondefi.xyz) • [GitHub](https://github.com/exhibitiondefi) • [Twitter](https://twitter.com/ExhibitionDefi)

</div>