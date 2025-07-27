# **App Name**: HashFinance

## Core Features:

- Chat Interface: Clean, intuitive chat interface for seamless conversation with the AI financial advisor.
- Start New Session: Use the Agent Development Kit APIs to create new chat session upon request, using the `/apps/{APP_NAME}/users/{st.session_state.user_id}/sessions/{session_id}` endpoint.
- Send Message: Send user messages to the AI agent via the Agent Development Kit API, using the `/run` endpoint, to receive responses.
- Message Display: Display chat messages in a structured format with clear distinctions between user and AI responses.
- Real-time Response: Real-time display of the AI response.
- ADK API integration: The application makes use of the Agent Development Kit API.
- AI Reasoning Tool: The AI tool will reason over current and prior turns of conversation in order to answer the user questions appropriately. For example, the AI tool will use follow-up questions and entity recognition to resolve ambiguity. The AI is a tool that decides whether to incorporate information.

## Style Guidelines:

- Primary color: Deep Blue (#3F51B5) to inspire trust and financial stability.
- Background color: Light Gray (#E8EAF6), for a clean and professional look.
- Accent color: Teal (#009688), to highlight important actions and elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif, provides a modern, machined, objective, neutral look suitable for both headlines and body text.
- Use financial icons with a clean, outline style.
- Subtle animations during message sending/receiving to provide smooth feedback.