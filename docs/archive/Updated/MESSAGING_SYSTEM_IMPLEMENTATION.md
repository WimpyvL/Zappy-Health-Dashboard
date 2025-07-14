# Ultra-Simplified Messaging System Implementation

This document outlines the bare-minimum implementation of the messaging system for the Telehealth platform.

## Overview

The messaging system provides only the most essential communication capabilities:

- Basic conversations between users
- Simple message sending and viewing
- Conversation archiving

## Database Schema

The messaging system uses the following simplified tables in Supabase:

### `conversations`
- `id`: UUID (primary key)
- `title`: String (conversation title)
- `is_archived`: Boolean (whether the conversation is archived)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `conversation_participants`
- `id`: UUID (primary key)
- `conversation_id`: UUID (foreign key to conversations)
- `user_id`: UUID (foreign key to auth.users)
- `created_at`: Timestamp

### `messages`
- `id`: UUID (primary key)
- `conversation_id`: UUID (foreign key to conversations)
- `sender_id`: UUID (foreign key to auth.users)
- `content`: Text (message content)
- `created_at`: Timestamp

## API Implementation

The messaging API is implemented with minimal functionality:

1. `src/apis/messaging/api.js`: Contains only the essential API functions
2. `src/apis/messaging/hooks.js`: Contains minimal React Query hooks

### Core API Functions

- `getConversations`: Fetch all non-archived conversations for the current user
- `getMessages`: Fetch all messages for a conversation
- `createConversation`: Create a new conversation with participants and optional initial message
- `sendMessage`: Send a message in a conversation
- `archiveConversation`: Archive a conversation

### React Query Hooks

- `useConversations`: Hook to fetch all conversations
- `useMessages`: Hook to fetch messages for a conversation
- `useCreateConversation`: Hook to create a new conversation
- `useSendMessage`: Hook to send a message
- `useArchiveConversation`: Hook to archive a conversation

## UI Components

The messaging UI should be implemented with minimal components:

- `MessagingPage`: Main page component
- `ConversationList`: Simple list of conversations
- `MessageView`: Basic message display and input

## Authentication

The messaging system uses Supabase authentication to identify users. Each API call includes the user's ID from the Supabase auth context.

## Polling for Updates

The system uses simple polling to check for updates:

- Conversations are refreshed every 30 seconds
- Messages are refreshed every 15 seconds
- The UI also refreshes when the window regains focus

## Implementation Steps

1. Create the minimal database tables in Supabase
2. Implement the core API functions
3. Implement the React Query hooks
4. Create the basic UI components
5. Connect the UI components to the hooks
6. Test the messaging system

## Future Considerations

If more features are needed in the future, consider:

- Message read status
- Conversation categories
- Participant types
- File attachments
- Message templates

However, the current implementation focuses on providing only the most essential functionality with no bells and whistles.
