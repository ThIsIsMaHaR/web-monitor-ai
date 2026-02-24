# 🤖 AI Collaboration & Prompt Engineering Log

This document outlines the systematic use of Generative AI (Gemini/ChatGPT) to assist in the architecture, debugging, and documentation of the Web Monitor AI project.

## 🏗️ Phase 1: Project Architecture & Environment
**Objective:** Establish a standard repository structure and resolve cross-platform CLI issues.

* **Initial Prompt:** "Act as a Senior DevOps Engineer. What is the standard file structure for a GitHub repository that includes AI notes, professional documentation, and API testing files?"
* **Refinement (Debugging):** "I am receiving a 'CommandNotFoundException' for the `touch` command in Windows PowerShell. Provide the equivalent PowerShell 'New-Item' syntax to create multiple files simultaneously."
* **Outcome:** Successfully initialized a clean repository root compatible with Windows environment constraints.

## 💻 Phase 2: Logic & Feature Development
**Objective:** Develop a robust monitoring script with error handling.

* **Prompt:** "Write a Node.js script to monitor website uptime. The script must:
    1. Check status codes every 60 seconds.
    2. Log response times.
    3. Use a try-catch block to handle 'ECONNREFUSED' or timeout errors."
* **Iteration:** "The previous script crashes if the URL is invalid. Refactor the code to validate the URL string before attempting the fetch request."

## 🧪 Phase 3: API Testing & Postman Integration
**Objective:** Automate the verification of the monitoring tool's endpoints.

* **Prompt:** "I am learning **Postman**. How do I structure a JSON collection to test a Web Monitor API? Include examples of 'Pre-request Scripts' and 'Tests' that check if the response time is under 200ms."
* **Outcome:** Created a structured testing suite that validates both positive (200 OK) and negative (404/500) API scenarios.

## 📝 Phase 4: Documentation & Polish
**Objective:** Create high-quality Markdown documentation for academic submission.

* **Prompt:** "Review my README.md. Suggest improvements to make it more professional for a technical assignment, focusing on 'Readability' and 'Technical Stack' visualization."