# FLEETX — Edge-AI Fleet Coordination for Autonomous Mobile Robots

<p align="center">
  <strong>Decentralized Edge-AI Based Fleet Coordination for Autonomous Mobile Robots (AMRs) in Smart Warehouses</strong>
</p>

<p align="center">
  SIH 2026 • Problem Statement: SIH26123 • Bharat Electronics Limited
</p>

<p align="center">
  <a href="https://fleetx-demo.vercel.app/">🚀 Live Demo</a>
  •
  <a href="https://github.com/harika-1296/FLEETX-DEMO">💻 Source Code</a>
</p>

---

## 📌 Overview

**FLEETX** is a software prototype for decentralized coordination of multiple Autonomous Mobile Robots (AMRs) operating inside dynamic smart warehouses.

The system simulates a fleet of AMRs that independently coordinate their movement, share position and route intent, detect conflicts, avoid collisions, handle blocked aisles, re-plan routes, and dynamically allocate tasks.

Instead of relying entirely on a centralized cloud server for every decision, FLEETX demonstrates an **edge-oriented multi-agent coordination approach** where robots can make fast local decisions while continuously sharing fleet-state information.

---

## 🎯 Problem Statement

### SIH26123

**Edge-AI Based Distributed Fleet Coordination for Autonomous Mobile Robots (AMRs) in Smart Warehouses**

Modern smart warehouses increasingly use fleets of AMRs for material movement. As fleet size increases, centralized path planning can introduce:

- Network latency
- Dependence on continuous connectivity
- Single-point-of-failure risks
- Inefficient handling of overlapping robot paths
- Deadlocks at narrow intersections and choke points
- Delays when aisles become blocked

The objective is to design a decentralized coordination framework capable of managing multiple AMRs operating simultaneously in a dynamic warehouse environment.

---

## 💡 FLEETX Solution

FLEETX provides a simulation-driven coordination framework containing:

- Multi-AMR path planning
- Decentralized fleet-state communication
- Real-time conflict detection
- Collision avoidance
- Deadlock detection
- Dynamic route re-planning
- Task allocation
- Blocked-aisle handling
- Fleet monitoring
- Performance benchmarking

The prototype allows these mechanisms to be demonstrated through an interactive warehouse simulation.

---

## 🧠 Core Features

### 🤖 Multi-AMR Simulation

Simulates multiple autonomous mobile robots operating simultaneously within a warehouse environment.

Each AMR has:

- Current position
- Destination
- Route
- Task
- Battery state
- Movement state

---

### 🗺️ Multi-Agent Path Planning

The system calculates routes for multiple robots while considering the movement of other AMRs.

The simulation demonstrates:

- Route generation
- Shared-space coordination
- Conflict identification
- Alternative route selection

---

### ⚠️ Conflict Detection

FLEETX identifies potential conflicts when multiple AMRs attempt to occupy overlapping paths or warehouse locations.

The system can visualize:

- Path conflicts
- Intersection conflicts
- Potential collisions
- Blocked routes

---

### 🔄 Dynamic Re-routing

When a route becomes unavailable, the affected AMR can select an alternative path.

Example:

```text
Blocked Aisle
      ↓
Detect Obstacle
      ↓
Identify Affected AMR
      ↓
Recalculate Route
      ↓
Select Alternative Path
      ↓
Continue Task
