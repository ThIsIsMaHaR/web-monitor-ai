Project Sheet — Web Monitor AI
🔹 Project Name

Web Monitor AI

🔹 Overview

A full-stack AI-powered web monitoring application that tracks changes on specified web pages, generates diffs between versions, and summarizes changes using an LLM.

🔹 Problem Statement Solved

Users can:

Add 3–8 links to monitor

Fetch latest page content

Detect changes via diff comparison

Generate AI-based summaries of changes

View history of last 5 checks per link

🔹 Architecture

Frontend:

React (Vite)

Axios for API communication

Backend:

Node.js

Express

MongoDB (Atlas)

Mongoose

AI Integration:

OpenAI API

Model: gpt-4o-mini

Used for summarizing content differences

🔹 Core Flow

User adds link

Backend fetches page content

Previous snapshot retrieved

Diff generated

Diff sent to LLM

Summary generated

Check stored (last 5 maintained)

🔹 Features Implemented

Link creation

Tag support

On-demand check

Diff generation

AI summary

History retention (last 5)

Backend health endpoint (/status)

Basic input validation

Clean minimal UI

🔹 Status Endpoint

GET /status

Returns:

{
  "backend": "ok",
  "database": "connected",
  "llm": "configured"
}
🔹 Environment Variables

Backend:

MONGO_URI

OPENAI_API_KEY

PORT

Frontend:

VITE_API_URL

🔹 Limitations

No scheduled automatic checks

No authentication

No advanced diff visualization

Basic UI styling

🔹 Future Improvements

Scheduled cron-based monitoring

Email alerts

Improved diff UI highlighting

Authentication system

Tag filtering & grouping