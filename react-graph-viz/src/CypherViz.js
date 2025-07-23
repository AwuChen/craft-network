import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, useLocation, useParams } from 'react-router-dom';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';

class CypherViz extends React.Component {
  constructor({ driver }) {
    super();
    this.driver = driver;
    this.fgRef = React.createRef();
    
    this.defaultData = {
      nodes: [],
      links: []
    };
    
    this.state = {
      data: this.defaultData,
      query: `MATCH (u:User)-[r:CONNECTED_TO]->(v:User) 
          RETURN u.name AS source, u.role AS sourceRole, u.location AS sourceLocation, u.website AS sourceWebsite, 
      v.name AS target, v.role AS targetRole, v.location AS targetLocation, v.website AS targetWebsite`,
      latestNode: null,
      lastUpdateTime: null,
      isPolling: false,
      useWebSocket: false,
      wsConnected: false,
      customQueryActive: false,
      customQueryTimeout: null,
      processingMutation: false,
      lastUserActivity: Date.now(),
      isUserActive: true
    };

    // Store the default query for polling (separate from user input)
    this.defaultQuery = `MATCH (u:User)-[r:CONNECTED_TO]->(v:User) 
        RETURN u.name AS source, u.role AS sourceRole, u.location AS sourceLocation, u.website AS sourceWebsite, 
        v.name AS target, v.role AS targetRole, v.location AS targetLocation, v.website AS targetWebsite`;

    // Store the last known data hash for change detection
    this.lastDataHash = null;
    this.pollingInterval = null;
    this.websocket = null;
    this.lastUpdateTime = 0;
    this.updateDebounceTime = 2000; // 2 seconds debounce
    this.updateCount = 0;
    this.maxUpdatesPerCycle = 3; // Prevent infinite loops
    this.mutationReloadTimeout = null;
    this.idleTimeout = null;
    this.idleCheckInterval = null;
  }

  // Update user activity timestamp
  updateUserActivity = () => {
    const now = Date.now();
    this.setState({ 
      lastUserActivity: now,
      isUserActive: true 
    });
    
    // Clear existing idle timeout
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    // Set new idle timeout (5 seconds of inactivity)
    this.idleTimeout = setTimeout(() => {
      console.log("User is now idle");
      this.setState({ isUserActive: false });
    }, 5000); // 5 seconds of inactivity
  };

  // Check if user is idle and should return to default query
  checkIdleAndReturnToDefault = () => {
    if (this.state.customQueryActive && !this.state.isUserActive) {
      console.log("User is idle, returning to default query");
      this.setState({ 
        customQueryActive: false, 
        customQueryTimeout: null 
      });
      
      // Clear any existing timeout
      if (this.state.customQueryTimeout) {
        clearTimeout(this.state.customQueryTimeout);
      }
      
      // Reload with default query
      this.loadData(null, this.defaultQuery);
    }
  };

  // Start idle detection system
  startIdleDetection = () => {
    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.updateUserActivity, true);
    });
    
    // Check for idle state every 2 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleAndReturnToDefault();
    }, 2000);
    
    // Initial activity update
    this.updateUserActivity();
  };

  // Stop idle detection
  stopIdleDetection = () => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.updateUserActivity, true);
    });
    
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  };

  loadData = async (newNodeName = null, queryOverride = null) => {
    let session = this.driver.session({ database: "neo4j" });
    let res;
    
    // Determine which query to use
    let queryToExecute = queryOverride;
    let isCustomQuery = false;
    
    if (!queryToExecute) {
      // For polling, use default query unless a custom query is active
      if (newNodeName === null && !queryOverride && !this.state.customQueryActive) {
        queryToExecute = this.defaultQuery;
      } else {
        // For user-initiated queries, use state.query but validate it
        queryToExecute = this.state.query;
        isCustomQuery = true;
      }
    } else if (queryOverride !== this.defaultQuery) {
      // If a custom query is being executed
      isCustomQuery = true;
    }
    
    // Validate the query
    if (!queryToExecute || typeof queryToExecute !== 'string' || queryToExecute.trim() === '') {
      console.error("Invalid query:", queryToExecute);
      return;
    }
    
    // Check if query starts with valid Cypher keywords
    const validStartKeywords = ['MATCH', 'CREATE', 'MERGE', 'DELETE', 'SET', 'RETURN', 'WITH', 'UNWIND', 'CALL'];
    const queryStart = queryToExecute.trim().toUpperCase();
    const isValidQuery = validStartKeywords.some(keyword => queryStart.startsWith(keyword));
    
    if (!isValidQuery) {
      console.error("Invalid Cypher query format:", queryToExecute);
      return;
    }
    
    try {
      console.log("=== Query Execution Debug ===");
      console.log("Query to execute:", queryToExecute.substring(0, 100) + "...");
      console.log("Is custom query:", isCustomQuery);
      console.log("Query override:", queryOverride);
      console.log("New node name:", newNodeName);
      
      // Check if this is a mutation query
      const isMutationQuery = /(CREATE|MERGE|SET|DELETE|REMOVE|DETACH DELETE)/i.test(queryToExecute.trim());
      console.log("Is mutation query:", isMutationQuery);
      
      res = await session.run(queryToExecute);
      
      // Handle mutations for ALL queries (not just custom ones)
      if (isMutationQuery) {
        // For mutation queries, immediately return to default query
        console.log("Mutation query detected, immediately returning to default query");
        this.setState({ 
          customQueryActive: false, 
          customQueryTimeout: null,
          processingMutation: true
        });
        
        // Clear any existing timeout
        if (this.state.customQueryTimeout) {
          clearTimeout(this.state.customQueryTimeout);
        }
        
        // Prevent multiple mutation reloads
        if (this.mutationReloadTimeout) {
          clearTimeout(this.mutationReloadTimeout);
        }
        
        // Reload with default query to show updated graph
        console.log("Setting up mutation reload timeout...");
        this.mutationReloadTimeout = setTimeout(() => {
          console.log("Executing mutation reload with default query");
          this.loadData(null, this.defaultQuery);
          this.setState({ processingMutation: false });
          this.mutationReloadTimeout = null;
        }, 1000); // Small delay to ensure mutation is complete
      } else if (isCustomQuery) {
        // For non-mutation custom queries, activate custom query state
        console.log("Custom query activated, will return to default when user is idle");
        this.setState({ customQueryActive: true });
        
        // Clear any existing timeout
        if (this.state.customQueryTimeout) {
          clearTimeout(this.state.customQueryTimeout);
        }
        
        // Update user activity to reset idle timer
        this.updateUserActivity();
      }
    } catch (err) {
      console.error("Neo4j query failed:", err);
      console.error("Query was:", queryToExecute);
      this.setState({ data: { nodes: [], links: [] } });
      return;
    } finally {
      session.close();
    }

    let nodesMap = new Map();
    let links = [];

    // Intelligent parser
    res.records.forEach((record) => {
      if (record.has("source") && record.has("target") && record.get("source") && record.get("target") && 
          typeof record.get("source") === 'string' && typeof record.get("target") === 'string') {
        // standard case
        let source = record.get("source");
        let target = record.get("target");

        if (!nodesMap.has(source)) {
          nodesMap.set(source, {
            name: source,
            role: record.get("sourceRole"),
            location: record.get("sourceLocation"),
            website: record.get("sourceWebsite"),
            x: Math.random() * 500,
            y: Math.random() * 500,
          });
        }

        if (!nodesMap.has(target)) {
          nodesMap.set(target, {
            name: target,
            role: record.get("targetRole"),
            location: record.get("targetLocation"),
            website: record.get("targetWebsite"),
            x: Math.random() * 500,
            y: Math.random() * 500,
          });
        }

        if (nodesMap.has(source) && nodesMap.has(target)) {
          links.push({ source, target });
        } else {
  console.warn("Invalid link skipped:", { source, target });
}
      } else {
        // fallback: node-only query
        record.keys.forEach((key) => {
          const node = record.get(key);
          if (node && node.properties && node.identity) {
            const name = node.properties.name || `Node-${node.identity.low}`;
            if (!nodesMap.has(name)) {
              nodesMap.set(name, {
                name,
                role: node.properties.role || "",
                location: node.properties.location || "",
                website: node.properties.website || "",
                x: Math.random() * 500,
                y: Math.random() * 500,
              });
            }
          } else if (node && typeof node === 'object') {
            // Handle SET query results that might have different structure
            const name = node.name || node.u_name || `Node-${Date.now()}`;
            if (!nodesMap.has(name)) {
              nodesMap.set(name, {
                name,
                role: node.role || node.u_role || "",
                location: node.location || node.u_location || "",
                website: node.website || node.u_website || "",
                x: Math.random() * 500,
                y: Math.random() * 500,
              });
            }
          } else if (typeof node === 'string' && key.includes('name')) {
            // Handle direct string values from queries like RETURN u.name, u.role
            const name = node;
            if (!nodesMap.has(name)) {
              nodesMap.set(name, {
                name,
                role: record.get(key.replace('name', 'role')) || "",
                location: record.get(key.replace('name', 'location')) || "",
                website: record.get(key.replace('name', 'website')) || "",
                x: Math.random() * 500,
                y: Math.random() * 500,
              });
            }
          }
        });
      }
    });

    const nodes = Array.from(nodesMap.values());
    const updatedData = { nodes, links };

    // Calculate hash of current data for change detection
    const currentDataHash = this.calculateDataHash(updatedData);
    const hasChanged = this.lastDataHash !== currentDataHash;
    
    // Also use more detailed change detection
    const hasDetailedChange = this.hasDataChanged(updatedData, this.state.data);
    
    // Additional check: if the data is exactly the same, don't update
    const isDataIdentical = JSON.stringify(updatedData) === JSON.stringify(this.state.data);
    
    // Store a reference to the current state data for next comparison
    const currentStateData = this.state.data;
    
    console.log("=== Change Detection Debug ===");
    console.log("Current hash:", currentDataHash);
    console.log("Last hash:", this.lastDataHash);
    console.log("Hash changed:", hasChanged);
    console.log("Detailed change detected:", hasDetailedChange);
    console.log("Data identical:", isDataIdentical);
    console.log("Current nodes count:", updatedData.nodes.length);
    console.log("Current links count:", updatedData.links.length);
    console.log("State nodes count:", this.state.data.nodes.length);
    console.log("State links count:", this.state.data.links.length);
    
    if (hasChanged || hasDetailedChange) {
      console.log("Graph data has changed, updating...");
    } else {
      console.log("No changes detected, skipping update");
    }

    localStorage.setItem("graphData", JSON.stringify(updatedData));
    
    // Only update state if there's a change or if it's the initial load
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    if ((hasChanged || hasDetailedChange || this.lastDataHash === null) && 
        !isDataIdentical &&
        (timeSinceLastUpdate > this.updateDebounceTime || this.lastDataHash === null) &&
        this.updateCount < this.maxUpdatesPerCycle) {
      // Update the hash only when we actually update the state
      this.lastDataHash = currentDataHash;
      this.lastUpdateTime = now;
      this.updateCount++;
      console.log("Updating state after", timeSinceLastUpdate, "ms (update #", this.updateCount, ")");
      
      this.setState({ 
        data: updatedData, 
        latestNode: newNodeName,
        lastUpdateTime: hasChanged ? now : this.state.lastUpdateTime
      }, () => {
        if (newNodeName) {
          setTimeout(() => {
            let newNode = nodes.find((n) => n.name === newNodeName);
            if (newNode && this.fgRef.current) {
              console.log("Focusing on:", newNode);
              this.fgRef.current.centerAt(newNode.x, newNode.y, 1500);
              this.fgRef.current.zoom(1.25);
            }
          }, 2000);
        }
      });
    } else {
      // Even if no change, we might need to update latestNode for new additions
      if (newNodeName && this.state.latestNode !== newNodeName) {
        this.setState({ latestNode: newNodeName });
      }
      // Reset update count when no changes are detected
      this.updateCount = 0;
    }
  };

  // Calculate a simple hash of the graph data for change detection
  calculateDataHash = (data) => {
    // Only hash the actual data, not the random coordinates
    const nodesStr = data.nodes.map(n => `${n.name}:${n.role}:${n.location}:${n.website}`).sort().join('|');
    const linksStr = data.links.map(l => {
      const source = typeof l.source === 'object' ? l.source.name : l.source;
      const target = typeof l.target === 'object' ? l.target.name : l.target;
      return `${source}:${target}`;
    }).sort().join('|');
    return `${nodesStr}|${linksStr}`;
  };

  // More detailed change detection
  hasDataChanged = (newData, oldData) => {
    if (!oldData || !oldData.nodes || !oldData.links) return true;
    
    // Check if number of nodes or links changed
    if (newData.nodes.length !== oldData.nodes.length || 
        newData.links.length !== oldData.links.length) {
      return true;
    }
    
    // Check if any node properties changed
    const oldNodesMap = new Map(oldData.nodes.map(n => [n.name, n]));
    for (const newNode of newData.nodes) {
      const oldNode = oldNodesMap.get(newNode.name);
      if (!oldNode || 
          oldNode.role !== newNode.role || 
          oldNode.location !== newNode.location || 
          oldNode.website !== newNode.website) {
        return true;
      }
    }
    
    // Check if any links changed
    const oldLinksSet = new Set(oldData.links.map(l => {
      const source = typeof l.source === 'object' ? l.source.name : l.source;
      const target = typeof l.target === 'object' ? l.target.name : l.target;
      return `${source}:${target}`;
    }));
    
    for (const newLink of newData.links) {
      const source = typeof newLink.source === 'object' ? newLink.source.name : newLink.source;
      const target = typeof newLink.target === 'object' ? newLink.target.name : newLink.target;
      if (!oldLinksSet.has(`${source}:${target}`)) {
        return true;
      }
    }
    
    return false;
  };

  // Start polling for changes
  startPolling = () => {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.setState({ isPolling: true });
    this.pollingInterval = setInterval(() => {
      // Only poll if the tab is active (to save resources)
      if (!document.hidden) {
        // Use default query for polling, but respect custom query state and mutation processing
        if (this.state.customQueryActive || this.state.processingMutation) {
          console.log("Skipping poll - custom query active or mutation processing");
          return;
        }
        this.loadData(null, this.defaultQuery);
      }
    }, 5000); // Check every 5 seconds
    
    // Reset update count every 30 seconds to prevent permanent blocking
    if (this.updateCountResetInterval) {
      clearInterval(this.updateCountResetInterval);
    }
    this.updateCountResetInterval = setInterval(() => {
      this.updateCount = 0;
      console.log("Reset update count");
    }, 30000);
  };

  // Stop polling
  stopPolling = () => {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.updateCountResetInterval) {
      clearInterval(this.updateCountResetInterval);
      this.updateCountResetInterval = null;
    }
    this.setState({ isPolling: false });
  };

  // WebSocket methods for real-time updates
  connectWebSocket = () => {
    try {
      // Replace with your WebSocket server URL
      this.websocket = new WebSocket('wss://your-websocket-server.com');
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.setState({ wsConnected: true, useWebSocket: true });
      };
      
      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'graph_update') {
          console.log('Received graph update via WebSocket');
          this.loadData(null, this.defaultQuery); // Reload data when update is received
        }
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.setState({ wsConnected: false });
        // Fallback to polling if WebSocket fails
        setTimeout(() => {
          if (!this.state.isPolling) {
            this.startPolling();
          }
        }, 5000);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setState({ wsConnected: false });
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      // Fallback to polling
      this.startPolling();
    }
  };

  disconnectWebSocket = () => {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.setState({ wsConnected: false, useWebSocket: false });
  };

  // Enhanced componentDidMount to try WebSocket first, then fallback to polling
  componentDidMount() {
    // Validate and clean the query state first
    this.validateAndCleanQuery();
    
    this.loadData();
    
    // Try WebSocket first, fallback to polling
    this.connectWebSocket();
    
    // Add visibility change listener to pause polling when tab is not active
    this.handleVisibilityChange = () => {
      if (document.hidden && this.state.isPolling) {
        console.log('Tab hidden, pausing polling');
      } else if (!document.hidden && this.state.isPolling) {
        console.log('Tab visible, resuming polling');
      }
    };
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Start idle detection
    this.startIdleDetection();
  }

  componentWillUnmount() {
    // Clean up both polling and WebSocket
    this.stopPolling();
    this.disconnectWebSocket();
    
    // Clear custom query timeout
    if (this.state.customQueryTimeout) {
      clearTimeout(this.state.customQueryTimeout);
    }
    
    // Clear mutation reload timeout
    if (this.mutationReloadTimeout) {
      clearTimeout(this.mutationReloadTimeout);
      this.mutationReloadTimeout = null;
    }
    
    // Clear processing mutation state
    this.setState({ processingMutation: false });
    
    // Stop idle detection
    this.stopIdleDetection();
    
    // Remove visibility change listener
    if (this.handleVisibilityChange) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  addNodeNFC = async (newUser, nfcUserName) => {
    // Helper function to capitalize first letter of each word
    const capitalizeWords = (str) => {
      if (!str) return str;
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    let session = this.driver.session({ database: "neo4j" });
    try {
      await session.run(
        `MERGE (u:User {name: $user}) 
         ON CREATE SET u.role = 'Affiliate', 
                       u.location = '', 
                       u.website = ''

         MERGE (nfc:User {name: $nfcUser}) 
         ON CREATE SET nfc.role = 'Holder', 
                       nfc.location = $nfcUser + "'s network", 
                       nfc.website = ''

         MERGE (awu:User {name: $awuUser}) 

         MERGE (u)-[:CONNECTED_TO]->(nfc) 
        MERGE (nfc)-[:CONNECTED_TO]->(awu)`,
        { 
          user: capitalizeWords(newUser), 
          nfcUser: capitalizeWords(nfcUserName), 
          awuUser: "Awu Chen" 
        }
        );
      await this.loadData(newUser);
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      session.close();
    }
  };

  handleChange = (event) => {
    // Only update the query state if it's a valid Cypher query or empty
    const newQuery = event.target.value;
    
    // Allow empty queries (for clearing)
    if (!newQuery || newQuery.trim() === '') {
      this.setState({ query: this.defaultQuery });
      return;
    }
    
    // Check if it starts with valid Cypher keywords
    const validStartKeywords = ['MATCH', 'CREATE', 'MERGE', 'DELETE', 'SET', 'RETURN', 'WITH', 'UNWIND', 'CALL'];
    const queryStart = newQuery.trim().toUpperCase();
    const isValidQuery = validStartKeywords.some(keyword => queryStart.startsWith(keyword));
    
    if (isValidQuery) {
      this.setState({ query: newQuery });
    } else {
      // If invalid, don't update the query state
      console.log("Invalid Cypher query format, not updating state:", newQuery);
    }
  };

  // Method to reset query to default
  resetQuery = () => {
    this.setState({ 
      query: this.defaultQuery,
      customQueryActive: false,
      customQueryTimeout: null,
      processingMutation: false
    });
    
    // Clear any existing timeout
    if (this.state.customQueryTimeout) {
      clearTimeout(this.state.customQueryTimeout);
    }
  };

  // Method to validate and clean the current query state
  validateAndCleanQuery = () => {
    const currentQuery = this.state.query;
    
    // Check if current query is valid
    if (!currentQuery || typeof currentQuery !== 'string' || currentQuery.trim() === '') {
      console.log("Resetting invalid query to default");
      this.setState({ query: this.defaultQuery });
      return;
    }
    
    // Check if it starts with valid Cypher keywords
    const validStartKeywords = ['MATCH', 'CREATE', 'MERGE', 'DELETE', 'SET', 'RETURN', 'WITH', 'UNWIND', 'CALL'];
    const queryStart = currentQuery.trim().toUpperCase();
    const isValidQuery = validStartKeywords.some(keyword => queryStart.startsWith(keyword));
    
    if (!isValidQuery) {
      console.log("Resetting invalid query to default:", currentQuery);
      this.setState({ query: this.defaultQuery });
    }
  };

  render() {
    return (
      <Router>
      <div>
      <Routes>
      <Route path="/:username" element={<NFCTrigger addNode={this.addNodeNFC} />} />
      <Route path="/" element={
        <GraphView 
        data={this.state.data} 
        handleChange={this.handleChange} 
        loadData={this.loadData} 
        fgRef={this.fgRef} 
        latestNode={this.state.latestNode} 
        driver={this.driver} // Pass the driver
        isPolling={this.state.isPolling}
        lastUpdateTime={this.state.lastUpdateTime}
        startPolling={this.startPolling}
        stopPolling={this.stopPolling}
        customQueryActive={this.state.customQueryActive}
        resetQuery={this.resetQuery}
        processingMutation={this.state.processingMutation}
        updateUserActivity={this.updateUserActivity}
        isUserActive={this.state.isUserActive}
    />
  } />
  </Routes>
  </div>
  </Router>
  );
}
}

const NFCTrigger = ({ addNode }) => {
  const location = useLocation();
  const { username } = useParams();

  React.useEffect(() => {
    const addAndRedirect = async () => {
      const newUser = `User-${Date.now()}`;

      try {
        await addNode(newUser, username); // pass dynamic user
        } catch (error) {
          console.error("Error adding user:", error);
          return;
        }

        setTimeout(() => {
          window.location.assign("/craft-network/#/");
          }, 2000);
        };

        addAndRedirect();
        }, [location, username]);

        return <div style={{ textAlign: "center", padding: "20px", fontSize: "16px", color: "red" }}>Processing NFC tap for {username}...</div>
      };

              const GraphView = ({ data, handleChange, loadData, fgRef, latestNode, driver, isPolling, lastUpdateTime, startPolling, stopPolling, customQueryActive, resetQuery, processingMutation, updateUserActivity, isUserActive }) => {
        const [inputValue, setInputValue] = useState(""); 
        const [selectedNode, setSelectedNode] = useState(null);
        const [editedNode, setEditedNode] = useState(null);
        const [focusNode, setFocusNode] = useState(null);
        const [clickedNode, setClickedNode] = useState(null);
        const [lastAction, setLastAction] = useState(null); // 'search', 'click', 'latestNode', or 'mutation'
        const [mutatedNodes, setMutatedNodes] = useState([]); // Track nodes created/modified by mutation queries

        // Detect when latestNode changes (NFC addition) and set lastAction
        useEffect(() => {
          if (latestNode) {
            setLastAction('latestNode');
          }
        }, [latestNode]);

        // Initial zoom when graph first loads
        useEffect(() => {
          if (fgRef.current && data.nodes.length > 0 && !lastAction) {
            // Wait a bit for the graph to settle, then zoom to 2x
            setTimeout(() => {
              if (fgRef.current) {
                fgRef.current.zoom(2, 1000);
              }
            }, 1000);
          }
        }, [data.nodes, fgRef, lastAction]);

        // Compute 1-degree neighbors of latestNode
        const getOneDegreeNodes = () => {
          if (!latestNode || !data) return new Set();
          const neighbors = new Set();
          neighbors.add(latestNode);
          data.links.forEach(link => {
            if (link.source === latestNode) neighbors.add(link.target);
            if (link.target === latestNode) neighbors.add(link.source);
          });
          return neighbors;
        };
        const oneDegreeNodes = getOneDegreeNodes();

        // Compute N-degree neighbors of latestNode
        const visibleDegree = 1; // Change this value to adjust visible degree
        const getNDegreeNodes = (startNode, degree) => {
          if (!startNode || !data) return new Set();
          const visited = new Set();
          let currentLevel = new Set([startNode]);
          for (let d = 0; d < degree; d++) {
            const nextLevel = new Set();
            data.links.forEach(link => {
              // Normalize source/target to node names if they are objects
              const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
              const targetName = typeof link.target === 'object' ? link.target.name : link.target;
              currentLevel.forEach(n => {
                if (n === sourceName && !visited.has(targetName)) {
                  nextLevel.add(targetName);
                }
                if (n === targetName && !visited.has(sourceName)) {
                  nextLevel.add(sourceName);
                }
              });
            });
            nextLevel.forEach(n => visited.add(n));
            currentLevel.forEach(n => visited.add(n));
            currentLevel = nextLevel;
          }
          visited.add(startNode);
          return visited;
        };
        // For visibility: use hover (focusNode) if available, otherwise clicked node, otherwise latestNode
        const visibilityFocus = focusNode || clickedNode || latestNode;
        // For zoom: use the most recent action
        const zoomFocus = lastAction === 'search' ? 'search' : 
                         lastAction === 'click' ? clickedNode : 
                         lastAction === 'latestNode' ? latestNode :
                         lastAction === 'mutation' ? mutatedNodes[0] : null;
        const visibilityNodes = getNDegreeNodes(visibilityFocus, visibleDegree);
        
        // Always include search results in visibility if there's a search term
        if (inputValue && inputValue.trim()) {
          const searchMatches = data.nodes.filter(node => 
            node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            (node.location && node.location.toLowerCase().includes(inputValue.toLowerCase())) ||
            (node.role && node.role.toLowerCase().includes(inputValue.toLowerCase()))
          );
          searchMatches.forEach(match => {
            const matchNeighbors = getNDegreeNodes(match.name, visibleDegree);
            matchNeighbors.forEach(neighbor => visibilityNodes.add(neighbor));
          });
        }
        
        // Always include mutated nodes in visibility if there was a mutation
        if (lastAction === 'mutation' && mutatedNodes.length > 0) {
          mutatedNodes.forEach(nodeName => {
            const nodeNeighbors = getNDegreeNodes(nodeName, 0); // Always use 0 degree for mutations
            nodeNeighbors.forEach(neighbor => visibilityNodes.add(neighbor));
          });
        }
        
        const zoomNodes = lastAction === 'search' ? 
                         (() => {
                           const searchMatches = data.nodes.filter(node => 
                             node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                             (node.location && node.location.toLowerCase().includes(inputValue.toLowerCase())) ||
                             (node.role && node.role.toLowerCase().includes(inputValue.toLowerCase()))
                           );
                           const searchNodes = new Set();
                           searchMatches.forEach(match => {
                             const matchNeighbors = getNDegreeNodes(match.name, visibleDegree);
                             matchNeighbors.forEach(neighbor => searchNodes.add(neighbor));
                           });
                           return searchNodes;
                         })() : 
                         lastAction === 'mutation' ?
                         (() => {
                           const mutationNodes = new Set();
                           mutatedNodes.forEach(nodeName => {
                             const nodeNeighbors = getNDegreeNodes(nodeName, 1); // Always use 1 degree for mutations
                             nodeNeighbors.forEach(neighbor => mutationNodes.add(neighbor));
                           });
                           return mutationNodes;
                         })() :
                         getNDegreeNodes(zoomFocus, visibleDegree);
        
        // Auto-zoom to visible nodes
        useEffect(() => {
          // Only auto-zoom if there's a search term or if a node was clicked (not just hovered)
          // Don't auto-zoom for latestNode unless there's no other focus
          if (fgRef.current && zoomNodes.size > 0) {
            // Zoom based on last action
            if (lastAction === 'click' && clickedNode) {
              const visibleNodes = data.nodes.filter(node => zoomNodes.has(node.name));
              if (visibleNodes.length > 0) {
                // Calculate bounding box of visible nodes
                const xs = visibleNodes.map(n => n.x);
                const ys = visibleNodes.map(n => n.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                const width = maxX - minX;
                const height = maxY - minY;
                
                // Add some padding
                const padding = 100;
                const scale = Math.min(
                  (window.innerWidth - padding) / width,
                  (window.innerHeight - padding) / height,
                  2 // Max zoom level
                );
                
                fgRef.current.centerAt(centerX, centerY, 1000);
                fgRef.current.zoom(scale, 1000);
              }
            }
            // For search results (only if no node is clicked)
            else if (lastAction === 'search' && inputValue) {
              const visibleNodes = data.nodes.filter(node => zoomNodes.has(node.name));
              if (visibleNodes.length > 0) {
                // Calculate bounding box of visible nodes
                const xs = visibleNodes.map(n => n.x);
                const ys = visibleNodes.map(n => n.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                const width = maxX - minX;
                const height = maxY - minY;
                
                // Add some padding
                const padding = 100;
                const scale = Math.min(
                  (window.innerWidth - padding) / width,
                  (window.innerHeight - padding) / height,
                  2 // Max zoom level
                );
                
                fgRef.current.centerAt(centerX, centerY, 1000);
                fgRef.current.zoom(scale, 1000);
              }
            }
            // For latestNode, delay the zoom to allow graph to stabilize
            else if (lastAction === 'latestNode' && latestNode) {
              setTimeout(() => {
                const visibleNodes = data.nodes.filter(node => zoomNodes.has(node.name));
                if (visibleNodes.length > 0 && fgRef.current) {
                  // Calculate bounding box of visible nodes
                  const xs = visibleNodes.map(n => n.x);
                  const ys = visibleNodes.map(n => n.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  
                  const centerX = (minX + maxX) / 2;
                  const centerY = (minY + maxY) / 2;
                  const width = maxX - minX;
                  const height = maxY - minY;
                  
                  // Add some padding
                  const padding = 100;
                  const scale = Math.min(
                    (window.innerWidth - padding) / width,
                    (window.innerHeight - padding) / height,
                    2 // Max zoom level
                  );
                  
                  fgRef.current.centerAt(centerX, centerY, 1000);
                  fgRef.current.zoom(scale, 1000);
                }
              }, 1000); // 1 second delay for latestNode
            }
            // For mutation queries, zoom to the mutated nodes
            else if (lastAction === 'mutation' && mutatedNodes.length > 0) {
              setTimeout(() => {
                const visibleNodes = data.nodes.filter(node => zoomNodes.has(node.name));
                if (visibleNodes.length > 0 && fgRef.current) {
                  // Calculate bounding box of visible nodes
                  const xs = visibleNodes.map(n => n.x);
                  const ys = visibleNodes.map(n => n.y);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  
                  const centerX = (minX + maxX) / 2;
                  const centerY = (minY + maxY) / 2;
                  const width = maxX - minX;
                  const height = maxY - minY;
                  
                  // Add some padding
                  const padding = 100;
                  const scale = Math.min(
                    (window.innerWidth - padding) / width,
                    (window.innerHeight - padding) / height,
                    2 // Max zoom level
                  );
                  
                  fgRef.current.centerAt(centerX, centerY, 1000);
                  fgRef.current.zoom(scale, 1000);
                }
              }, 1000); // 1 second delay for mutation
            }
          }
        }, [zoomNodes, data.nodes, fgRef, lastAction, clickedNode, latestNode, inputValue, mutatedNodes]);

        const handleInputChange = (event) => {
          const input = event.target.value;
          setInputValue(input);
          handleChange(event); // updates CypherViz state.query too
          
          // Update user activity when typing
          updateUserActivity();
          
          // Clear other actions when searching
          if (input.trim()) {
            setClickedNode(null);
            setLastAction('search');
          }
        };

        const handleSubmit = async (e) => {
          e.preventDefault();

          try {
            const response = await fetch("https://flowise-hako.onrender.com/api/v1/prediction/29e305b3-c569-4676-a454-1c4fdc380c69", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ question: inputValue })
            });

            const data = await response.json();
            const generatedQuery = data.text || data.query || "";

            setInputValue(generatedQuery);
            handleChange({ target: { value: generatedQuery } });

            await loadData(null, generatedQuery);

            // Check if the generated query is a mutation query (updates the graph)
            const isMutationQuery = /(CREATE|MERGE|SET|DELETE|REMOVE|DETACH DELETE)/i.test(generatedQuery.trim());
            
            // If it's a mutation query, reload with the default MATCH query to show the updated graph
            if (isMutationQuery) {
              // Extract node names from the mutation query to track what was created/modified
              let extractedNodes = [];
              
              // Handle different mutation query patterns
              if (generatedQuery.includes('DELETE')) {
                // For DELETE queries, extract from patterns like DELETE (u:User {name: "John"}) or MATCH (u:User {name: "John"}) DELETE u
                const deleteMatches = generatedQuery.match(/\{name:\s*['"]([^'"]+)['"]\}/g);
                if (deleteMatches) {
                  extractedNodes = deleteMatches.map(match => {
                    const nameMatch = match.match(/name:\s*['"]([^'"]+)['"]/);
                    return nameMatch ? nameMatch[1] : null;
                  }).filter(Boolean);
                }
              } else if (generatedQuery.includes('SET')) {
                // For SET queries, extract from MATCH clause like MATCH (u:User {name: "John"}) SET u.role = 'admin'
                const matchClause = generatedQuery.match(/MATCH\s*\([^)]*\{name:\s*['"]([^'"]+)['"][^}]*\}\)/i);
                if (matchClause) {
                  extractedNodes = [matchClause[1]];
                }
              } else {
                // For CREATE/MERGE queries, extract from {name: "nodeName"} patterns
                const nodeMatches = generatedQuery.match(/\{([^}]+)\}/g);
                extractedNodes = nodeMatches ? 
                  nodeMatches.map(match => {
                    const nameMatch = match.match(/name:\s*['"]([^'"]+)['"]/);
                    return nameMatch ? nameMatch[1] : null;
                  }).filter(Boolean) : [];
              }
              
              setMutatedNodes(extractedNodes);
              setLastAction('mutation');
              
              const defaultQuery = `
                MATCH (u:User)-[r:CONNECTED_TO]->(v:User)
                RETURN u.name AS source, u.role AS sourceRole, u.location AS sourceLocation, u.website AS sourceWebsite, 
                       v.name AS target, v.role AS targetRole, v.location AS targetLocation, v.website AS targetWebsite
              `;
              await loadData(null, defaultQuery);
            }
            
            } catch (error) {
              console.error("Flowise call failed:", error);
            }
        };

        const handleNodeClick = (node) => {
          if (!node) return;
          setSelectedNode(node);
          setEditedNode({ ...node });
          setFocusNode(node.name);
          setClickedNode(node.name);
          setLastAction('click');
          
          // Update user activity when clicking nodes
          updateUserActivity();
          
          // Clear search when clicking a node to avoid zoom conflicts
          setInputValue("");
        };

        const handleNodeHover = (node) => {
          if (node) {
            setFocusNode(node.name);
          } else {
            setFocusNode(null);
          }
        };

        const handleEditChange = (event) => {
          const { name, value } = event.target;
          setEditedNode((prev) => ({
            ...prev,
            [name]: value,
          }));
        };

        const saveNodeChanges = async () => {
          if (!editedNode || !selectedNode) return;

          // Helper function to capitalize first letter of each word
          const capitalizeWords = (str) => {
            if (!str) return str;
            return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
          };

          // Ensure the website has "https://" if missing
          let formattedWebsite = editedNode.website.trim();
          if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
            formattedWebsite = "https://" + formattedWebsite;
          }

          const session = driver.session();
          try {
            await session.run(
              `MATCH (u:User {name: $oldName}) 
              SET u.name = $newName, u.role = $role, u.location = $location, u.website = $website`,
              {
                oldName: selectedNode.name,
                newName: capitalizeWords(editedNode.name),
                role: capitalizeWords(editedNode.role),
                location: capitalizeWords(editedNode.location),
                website: formattedWebsite, // Use the corrected website
              }
            );
            await loadData(editedNode.name); // Keep the edited node as latestNode
            setSelectedNode(null); // Close the panel
          } catch (error) {
            console.error("Error updating node:", error);
          } finally {
            session.close();
          }
        };


return (
    <div width="95%">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Show me all the artist in Kyoto..."
          style={{ display: "block", width: "95%", height: "60px", margin: "0 auto", textAlign: "center" }}
          value={inputValue}
          onChange={handleInputChange}
        />
        <button type="submit">Run</button>
      </form>
      <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
      <button id="info" onClick={() => window.open("https://www.hako.soooul.xyz/drafts/washi", "_blank")}>Info</button>
      <button 
        id="toggle-polling" 
        onClick={() => isPolling ? stopPolling() : startPolling()}
        style={{ 
          backgroundColor: isPolling ? "#f44336" : "#4CAF50",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        {isPolling ? "Pause Updates" : "Resume Updates"}
      </button>
      
      {/* Custom query indicator and reset button */}
      {customQueryActive && (
        <div style={{
          position: "fixed",
          top: "60px",
          right: "10px",
          padding: "8px 12px",
          backgroundColor: isUserActive ? "#FF9800" : "#FF5722",
          color: "white",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            animation: isUserActive ? "pulse 1s infinite" : "pulse 0.5s infinite"
          }}></div>
          {isUserActive ? "Custom Query Active" : "Returning to Default..."}
          <button
            onClick={resetQuery}
            style={{
              backgroundColor: "transparent",
              color: "white",
              border: "1px solid white",
              borderRadius: "2px",
              padding: "2px 6px",
              fontSize: "10px",
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>
      )}
      
      {/* Mutation processing indicator */}
      {processingMutation && (
        <div style={{
          position: "fixed",
          top: "60px",
          right: "10px",
          padding: "8px 12px",
          backgroundColor: "#9C27B0",
          color: "white",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            animation: "pulse 0.5s infinite"
          }}></div>
          Processing Mutation...
        </div>
      )}
      
      {/* Real-time update status indicator */}
      <div style={{ 
        position: "fixed", 
        top: "10px", 
        right: "10px", 
        padding: "8px 12px", 
        backgroundColor: isPolling ? "#4CAF50" : "#f44336", 
        color: "white", 
        borderRadius: "4px", 
        fontSize: "12px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <div style={{ 
          width: "8px", 
          height: "8px", 
          borderRadius: "50%", 
          backgroundColor: isPolling ? "#fff" : "#ccc",
          animation: isPolling ? "pulse 2s infinite" : "none"
        }}></div>
        {isPolling ? "Live Updates Active" : "Updates Paused"}
        {lastUpdateTime && (
          <span style={{ fontSize: "10px", opacity: 0.8 }}>
            (Last: {new Date(lastUpdateTime).toLocaleTimeString()})
          </span>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

  <ForceGraph2D
  ref={fgRef}
  graphData={data}
  nodeId="name"
  nodeLabel={(node) => node.location || "No Location"}
  onNodeClick={handleNodeClick}
  onNodeHover={handleNodeHover}
  onBackgroundClick={() => {
    setFocusNode(null);
    setClickedNode(null);
    setLastAction(null);
    setMutatedNodes([]);
  }}
  nodeCanvasObject={(node, ctx) => {
    const isHighlighted =
      inputValue &&
      (node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        (node.location && node.location.toLowerCase().includes(inputValue.toLowerCase())) ||
        (node.role && node.role.toLowerCase().includes(inputValue.toLowerCase())));
    const isOneDegree = oneDegreeNodes.has(node.name);
    const isNDegree = visibilityNodes.has(node.name);

    ctx.globalAlpha = isNDegree ? 1.0 : 0.2;
    ctx.fillStyle = node.name === latestNode ? "black" : "white";
    ctx.strokeStyle = isHighlighted ? "red" : "black";
    ctx.lineWidth = isHighlighted ? 3 : 2;

    ctx.beginPath();
    ctx.arc(node.x || Math.random() * 500, node.y || Math.random() * 500, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "gray";
    ctx.fillText(node.role, node.x + 10, node.y);

    ctx.globalAlpha = 1.0; // Reset alpha for next node
  }}
  linkColor={(link) => {
    const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
    const targetName = typeof link.target === 'object' ? link.target.name : link.target;
    const isConnected = visibilityNodes.has(sourceName) && visibilityNodes.has(targetName);
    return isConnected ? '#999' : '#ccc';
  }}
  linkOpacity={(link) => {
    const sourceName = typeof link.source === 'object' ? link.source.name : link.source;
    const targetName = typeof link.target === 'object' ? link.target.name : link.target;
    const isConnected = visibilityNodes.has(sourceName) && visibilityNodes.has(targetName);
    return isConnected ? 1.0 : 0.15;
  }}
  linkCurvature={0.2}
  linkDirectionalArrowRelPos={1}
  linkDirectionalArrowLength={5}
  />

  {selectedNode && editedNode && (
    <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", padding: "20px", backgroundColor: "white", border: "1px solid black", boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.3)", zIndex: 1000 }}>
    {selectedNode.name === latestNode ? (
      <>
      <h3>Edit Network Info</h3>
      <p><strong>Name:</strong>
      <input 
      name="name" 
      value={editedNode.name} 
      placeholder="Enter name" 
      onChange={handleEditChange}
      onFocus={(e) => e.target.placeholder = ""}
      onBlur={(e) => e.target.placeholder = "Enter name"} 
      /></p>

      <p><strong>Role:</strong>
      <input 
      name="role" 
      value={editedNode.role} 
      placeholder="Enter role" 
      onChange={handleEditChange}
      onFocus={(e) => e.target.placeholder = ""}
      onBlur={(e) => e.target.placeholder = "Enter role"} 
      /></p>

      <p><strong>Location:</strong>
      <input 
      name="location" 
      value={editedNode.location} 
      placeholder="Enter location" 
      onChange={handleEditChange}
      onFocus={(e) => e.target.placeholder = ""}
      onBlur={(e) => e.target.placeholder = "Enter location"} 
      /></p>

      <p><strong>Website:</strong>
      <input 
      name="website" 
      value={editedNode.website} 
      placeholder="Enter website" 
      onChange={handleEditChange}
      onFocus={(e) => e.target.placeholder = ""}
      onBlur={(e) => e.target.placeholder = "Enter website"} 
      /></p>

      <p><button onClick={saveNodeChanges}>Save</button></p>
      </>
      ) : (
      <>
      <h3>Network Info</h3>
      <p><strong>Name:</strong> {selectedNode?.name}</p>
      <p><strong>Role:</strong> {selectedNode?.role}</p>
      <p><strong>Location:</strong> {selectedNode?.location}</p>
      <p><strong>Website:</strong>{" "}
      {selectedNode.website && selectedNode.website !== "" ? (
        <a href={selectedNode.website} target="_blank" rel="noopener noreferrer">
        {selectedNode.website.length > 30 
          ? `${selectedNode.website.substring(0, 30)}...`
        : selectedNode.website}
        </a>
        ) : (
        ""
      )}</p>
      </>
    )}
    <button onClick={() => setSelectedNode(null)}>Close</button>
    </div>
  )}
  </div>
  );
    };





    export default CypherViz;
