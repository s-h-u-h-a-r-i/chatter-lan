# Chatter-LAN

End-to-end encrypted, room-based chat built with SolidJS, TypeScript, and Firebase.  
Each room is protected by a passphrase, and message encryption/decryption happens client-side using the Web Crypto API in a dedicated Web Worker.

## Why This Project

I built Chatter-LAN to explore a practical crypto-first frontend architecture:

- Secure room chat without exposing plaintext messages to the backend
- Passphrase-based access control per room
- Real-time synchronization using Firestore
- Clear feature boundaries (`rooms`, `messages`, `user`) and repository/store patterns

This repository is intended to showcase implementation quality and architectural thinking for interviews.

## Core Features

- **End-to-end message encryption** using AES-GCM (256-bit)
- **Per-room passphrase protection** with key derivation (PBKDF2, SHA-256, 200,000 iterations)
- **Web Worker crypto isolation**, so key operations stay off the main UI thread
- **Real-time rooms and messages** via Firestore subscriptions
- **Anonymous authentication** with Firebase Auth
- **IP-scoped room collections** (`rooms/ips/{ip}/{roomId}`) to partition room namespaces

## Security Model

### Key points

- Room keys are derived from `passphrase + room salt` in the crypto worker.
- The app stores encrypted content and room metadata in Firestore; plaintext is never persisted by the app.
- Each room stores an encrypted verification token used to validate a passphrase on join.
- Keys are kept in worker memory and can be removed when access fails or context changes.

### Crypto choices in code

- **KDF:** PBKDF2 + SHA-256
- **Iterations:** `200_000`
- **Cipher:** AES-GCM
- **Per-message IV:** random 12 bytes
- **Per-room salt:** random 16 bytes

## Architecture Overview

```text
src/
  app/                 # Root app composition and fallbacks
  core/
    crypto/            # Crypto service, worker, provider, types
    firebase/          # Firebase client + Firestore path/subscription utilities
    guards/            # Utility type guards
    solid/             # SolidJS helper utilities
  features/
    user/              # User onboarding (IP + username) and auth
    rooms/             # Room creation/listing/selection/passphrase flow
    messages/          # Message encryption, send/subscribe, chat UI
  ui/                  # Reusable UI primitives (inputs, modal, layouts, icons)
  styles/              # Global styles, tokens, reset, animations
```

### Patterns used

- **Feature-first module boundaries**
- **Repository pattern** for Firestore data access
- **Store/provider pattern** for state and dependency access
- **Schema validation** with Zod for Firestore payloads

## User Flow

1. User signs in anonymously (Firebase Auth).
2. User grants IP consent (auto fetch) or enters IP manually.
3. User sets a display name.
4. User creates a room with a passphrase (room salt + verification token generated).
5. User selects a room and enters passphrase if key is not loaded.
6. Messages are encrypted on send and decrypted on render in the selected room.

## Tech Stack

- **Frontend:** SolidJS, TypeScript
- **Build tooling:** Vite, `vite-plugin-solid`, `solid-devtools`
- **Backend services:** Firebase (Firestore, Auth, Analytics)
- **Validation:** Zod
- **Icons/UI assets:** lucide-solid

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm (or pnpm)

### Install dependencies

```bash
npm install
```

### Firebase setup

Configure Firebase in:

- `src/core/firebase/firebase.client.ts`

Template available at:

- `src/core/firebase/firebase.client.sample.ts`

### Run locally

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:3000`.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run serve
```

## Available Scripts

- `npm start` - start dev server (same as `npm run dev`)
- `npm run dev` - start Vite dev server
- `npm run build` - create production build
- `npm run serve` - preview production build locally

## Data Shape (Firestore)

```text
rooms/
  ips/
    {ip}/
      {roomId}/
        name
        createdAt
        salt
        verificationToken
        verificationIV
        messages/
          {messageId}/
            encryptedContent { ciphertext, iv }
            senderId
            senderName
            createdAt
```

## Current Limitations

- No automated test suite configured yet
- No lint script configured yet
- No room/message deletion flow yet
- No unread counter / last message preview in room list yet
- Empty-room chat placeholder still basic

## License

MIT
