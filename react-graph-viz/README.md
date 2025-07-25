# React Graph Visualization

A React-based graph visualization tool that connects to Neo4j database and provides real-time network visualization with interactive features.

## Features

- **Real-time Graph Visualization**: Displays network data from Neo4j database
- **Interactive Node Editing**: Click on nodes to view and edit their properties
- **Search Functionality**: Natural language search with AI-powered query generation
- **NFC Integration**: Add new users to the network via NFC triggers
- **Polling Updates**: Automatic updates every 5 seconds to show new connections
- **Idle Animation**: Subtle swaying motion when user is inactive for 5+ seconds
- **3D Visualization**: Link to 3D graph visualization

## Idle Animation

The application includes a subtle idle animation that activates when the user is inactive for 5 seconds. The animation:

- Applies gentle circular forces to nodes creating a swaying motion
- Preserves the original graph structure and connections
- Automatically stops when user activity is detected
- Uses the existing D3 force simulation system for smooth performance

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

The application will start on `http://localhost:3000`

## Dependencies

- React
- react-force-graph-2d
- d3 (for force simulation)
- neo4j-driver
- react-router-dom