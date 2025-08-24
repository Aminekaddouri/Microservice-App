# User Service – Microservice

Handles user profiles, friendships, and friend lists.

## Endpoints

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id` (auth required)
- `GET /api/friendship/friend-list`
- `GET /api/friendship/pending-requests`
- `GET /api/friendship/block-list`
- `POST /api/friendship/add-friend`
- `POST /api/friendship/accept-friend`
- `POST /api/friendship/block-friend`
- `POST /api/friendship/unfriend`

## Setup

```bash
cp .env.example .env
# Edit .env