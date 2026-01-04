# 🛠️ Poppy Universe: Backend & Orchestration Layer

Welcome to the **Backend** of the Poppy Universe. This service acts as the central nervous system of the project, orchestrating the flow of data between the user interface, our persistent storage, and the specialized AI/Machine Learning components.

---

## 🔄 System Architecture & Data Flow

The backend is designed as an **Orchestrator**. Instead of simply serving static data, it dynamically gathers context from multiple layers to provide a personalized experience.

```text
Frontend        Backend           Database       ML Models       Engine
   │               │                 │              │             │
   │-------------->│                 │              │             │
   │Request to Backend               │              │             │
   │               │                 │              │             │
   │               │                 │              │             │
   │               │---------------->│              │             │
   │               │Query Objects    │              │             │
   │               │                 │              │             │
   │               │<----------------│              │             │
   │               │Return Objects   │              │             │
   │               │                 │              │             │
   │               │---------------->│              │             │
   │               │Querry Interactions             │             │
   │               │                 │              │             │
   │               │<----------------│              │             │
   │               │Return Interactions             │             │
   │               │                 │              │             │
   │               │                 │              │             │
   │               │------------------------------->│             │
   │               │Request ML Models + Sends Interactions        │
   │               │                 │              │             │
   │               │<-------------------------------│             │
   │               │Returns ML Data  │              │             │
   │               │                 │              │             │
   │               │--------------------------------------------->│
   │               │Send object data + ML outputs to Engine       │
   │               │                 │              │             │----┐
   │               │                 │              │             │    │
   │               │                 │              │             │    │Calculate Recommendations
   │               │                 │              │             │    │
   │               │                 │              │             │<---┘
   │               │<---------------------------------------------│
   │               │Return recommendations from Engine:           │
   │               │   1) Personalized recommendations            │
   │               │   2) Other layers                            │
   │<--------------│                 │              │             │
   │Display recommendations          │              │             │
   │               │                 │              │             │
   ├───────────────┼─────────────────┼──────────────┼─────────────┤
```

### Architecture Overview


As shown in the data flow above, a typical request follows this lifecycle:

1.  **Request Initiation**: The **Frontend** sends a request to the Backend (e.g., fetching the Discovery Feed).
2.  **Context Retrieval**: The **Backend** queries the **Database** for both raw celestial objects (stars/planets) and the specific user's interaction history.
3.  **ML Enrichment**: The Backend sends these interactions to the **ML Models** to receive behavioral embeddings or predictive data.
4.  **Engine Processing**: The Backend aggregates the object data + ML outputs and forwards them to the **Recommendation Engine**.
5.  **Heuristic Calculation**: The Engine runs its internal logic to rank and filter the best matches for the user.
6.  **Response Delivery**: The Backend receives the final recommendations (Personalized layers + Discovery layers) and serves them back to the **Frontend** for display.

---

## 🏗️ Core Responsibilities

* **Service Orchestration**: Managing the complex timing and sequence of calls between the DB, ML, and Engine layers.
* **Data Synthesis**: Merging raw astronomical data (from our **ETL/Data Notebooks**) with real-time user metadata.
* **API Security**: Implementing authentication and sanitization protocols to protect the system (see `2_Solutions/Hacking_AI_Systems`).
* **Deployment**: Optimized for cloud environments, ensuring low latency between the Backend and the **Vercel-hosted Frontend**.

---

## 🛠 Tech Stack

* **Language/Runtime**: [e.g., Node.js or Python]
* **Framework**: [e.g., Express or FastAPI]
* **Database**: [e.g., PostgreSQL / MongoDB]
* **Deployment**: [e.g., Heroku / AWS / DigitalOcean]

---

## 🚦 Getting Started

### Prerequisites
1.  Ensure the **Database** is populated using the scripts in `POPPY_Universe/Data_Notebooks`.
2.  Configure the `.env` file with your database credentials and ML service endpoints.

### Installation
```bash
# Clone the repo and navigate to backend
cd POPPY_Universe/Web/Backend

# Install dependencies
npm install  # OR pip install -r requirements.txt

# Start the server
Node Express.js  