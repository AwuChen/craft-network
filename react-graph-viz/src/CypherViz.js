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
          RETURN u.name AS source, u.role AS sourceRole, u.title AS sourceTitle, u.website AS sourceWebsite, 
      v.name AS target, v.role AS targetRole, v.title AS targetTitle, v.website AS targetWebsite`,
      latestNode: null
    };

  }

  loadData = async (newNodeName = null, queryOverride = null) => {
    let session = this.driver.session({ database: "neo4j" });
    let res;
    try {
      res = await session.run(queryOverride || this.state.query);
    } catch (err) {
      console.error("Neo4j query failed:", err);
      this.setState({ data: { nodes: [], links: [] } });
      return;
    } finally {
      session.close();
    }

    let nodesMap = new Map();
    let links = [];

    // Intelligent parser
    res.records.forEach((record) => {
      if (record.has("source") && record.has("target")) {
        // standard case
        let source = record.get("source");
        let target = record.get("target");

        if (!nodesMap.has(source)) {
          nodesMap.set(source, {
            name: source,
            role: record.get("sourceRole"),
            title: record.get("sourceTitle"),
            website: record.get("sourceWebsite"),
            x: Math.random() * 500,
            y: Math.random() * 500,
          });
        }

        if (!nodesMap.has(target)) {
          nodesMap.set(target, {
            name: target,
            role: record.get("targetRole"),
            title: record.get("targetTitle"),
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
          if (node.properties && node.identity) {
            const name = node.properties.name || `Node-${node.identity.low}`;
            if (!nodesMap.has(name)) {
              nodesMap.set(name, {
                name,
                role: node.properties.role || "",
                title: node.properties.title || "",
                website: node.properties.website || "",
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

    localStorage.setItem("graphData", JSON.stringify(updatedData));
    this.setState({ data: updatedData, latestNode: newNodeName }, () => {
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
  };



  componentDidMount() {
    this.loadData();
  }

  addNodeNFC = async (newUser, nfcUserName) => {
    let session = this.driver.session({ database: "neo4j" });
    try {
      await session.run(
        `MERGE (u:User {name: $user}) 
         ON CREATE SET u.role = 'affiliate', 
                       u.title = '', 
                       u.website = ''

         MERGE (nfc:User {name: $nfcUser}) 
         ON CREATE SET nfc.role = 'ambassador', 
                       nfc.title = $nfcUser + "'s network", 
                       nfc.website = ''

         MERGE (awu:User {name: $awuUser}) 

         MERGE (u)-[:CONNECTED_TO]->(nfc) 
        MERGE (nfc)-[:CONNECTED_TO]->(awu)`,
        { 
          user: newUser, 
          nfcUser: nfcUserName, 
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
    this.setState({ query: event.target.value });
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

      const GraphView = ({ data, handleChange, loadData, fgRef, latestNode, driver }) => {
        const [inputValue, setInputValue] = useState(""); 
        const [selectedNode, setSelectedNode] = useState(null);
        const [editedNode, setEditedNode] = useState(null);
        const [focusNode, setFocusNode] = useState(null);
        const [clickedNode, setClickedNode] = useState(null);
        const [lastAction, setLastAction] = useState(null); // 'search', 'click', or 'latestNode'

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
                         lastAction === 'latestNode' ? latestNode : null;
        const visibilityNodes = getNDegreeNodes(visibilityFocus, visibleDegree);
        
        // Always include search results in visibility if there's a search term
        if (inputValue && inputValue.trim()) {
          const searchMatches = data.nodes.filter(node => 
            node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            (node.title && node.title.toLowerCase().includes(inputValue.toLowerCase())) ||
            (node.role && node.role.toLowerCase().includes(inputValue.toLowerCase()))
          );
          searchMatches.forEach(match => {
            const matchNeighbors = getNDegreeNodes(match.name, visibleDegree);
            matchNeighbors.forEach(neighbor => visibilityNodes.add(neighbor));
          });
        }
        
        const zoomNodes = lastAction === 'search' ? 
                         (() => {
                           const searchMatches = data.nodes.filter(node => 
                             node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                             (node.title && node.title.toLowerCase().includes(inputValue.toLowerCase())) ||
                             (node.role && node.role.toLowerCase().includes(inputValue.toLowerCase()))
                           );
                           const searchNodes = new Set();
                           searchMatches.forEach(match => {
                             const matchNeighbors = getNDegreeNodes(match.name, visibleDegree);
                             matchNeighbors.forEach(neighbor => searchNodes.add(neighbor));
                           });
                           return searchNodes;
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
          }
        }, [zoomNodes, data.nodes, fgRef, lastAction, clickedNode, latestNode, inputValue]);

        const handleInputChange = (event) => {
          const input = event.target.value;
          setInputValue(input);
          handleChange(event); // updates CypherViz state.query too
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
            const isMutationQuery = /^(CREATE|MERGE|SET|DELETE|REMOVE|DETACH DELETE)/i.test(generatedQuery.trim());
            
            // If it's a mutation query, reload with the default MATCH query to show the updated graph
            if (isMutationQuery) {
              // Extract the affected node name from the mutation query
              let affectedNode = null;
              if (generatedQuery.includes('CREATE') || generatedQuery.includes('MERGE')) {
                // Try to extract node name from patterns like "CREATE (n:User {name: 'John'})" or "MERGE (n:User {name: 'John'})"
                const nameMatch = generatedQuery.match(/name:\s*['"`]([^'"`]+)['"`]/i);
                if (nameMatch) {
                  affectedNode = nameMatch[1];
                }
              }
              
              const defaultQuery = `
                MATCH (u:User)-[r:CONNECTED_TO]->(v:User)
                RETURN u.name AS source, u.role AS sourceRole, u.title AS sourceTitle, u.website AS sourceWebsite, 
                       v.name AS target, v.role AS targetRole, v.title AS targetTitle, v.website AS targetWebsite
              `;
              await loadData(affectedNode, defaultQuery);
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

          // Ensure the website has "https://" if missing
          let formattedWebsite = editedNode.website.trim();
          if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
            formattedWebsite = "https://" + formattedWebsite;
          }

          const session = driver.session();
          try {
            await session.run(
              `MATCH (u:User {name: $oldName}) 
              SET u.name = $newName, u.role = $role, u.title = $title, u.website = $website`,
              {
                oldName: selectedNode.name,
                newName: editedNode.name,
                role: editedNode.role,
                title: editedNode.title,
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
          placeholder="Enter natural language query, search for nodes..."
          style={{ display: "block", width: "95%", height: "60px", margin: "0 auto", textAlign: "center" }}
          value={inputValue}
          onChange={handleInputChange}
        />
        <button type="submit">Run</button>
      </form>
      <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
      <button id="info" onClick={() => window.open("https://www.hako.soooul.xyz/drafts/washi", "_blank")}>Info</button>

  <ForceGraph2D
  ref={fgRef}
  graphData={data}
  nodeId="name"
  nodeLabel={(node) => node.title || "No Title"}
  onNodeClick={handleNodeClick}
  onNodeHover={handleNodeHover}
  onBackgroundClick={() => {
    setFocusNode(null);
    setClickedNode(null);
    setLastAction(null);
  }}
  nodeCanvasObject={(node, ctx) => {
    const isHighlighted =
      inputValue &&
      (node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        (node.title && node.title.toLowerCase().includes(inputValue.toLowerCase())) ||
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

      <p><strong>Title:</strong>
      <input 
      name="title" 
      value={editedNode.title} 
      placeholder="Enter title" 
      onChange={handleEditChange}
      onFocus={(e) => e.target.placeholder = ""}
      onBlur={(e) => e.target.placeholder = "Enter title"} 
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
      <p><strong>Title:</strong> {selectedNode?.title}</p>
      <p><strong>Role:</strong> {selectedNode?.role}</p>
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
