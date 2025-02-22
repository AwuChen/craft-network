import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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

  loadData = async (newNodeName = null) => {
    let session = this.driver.session({ database: "neo4j" });
    let res = await session.run(this.state.query);
    session.close();

    let nodesMap = new Map();
    let links = res.records.map(r => {
      let source = r.get("source");
      let target = r.get("target");

    // Add or update source node
      if (!nodesMap.has(source)) {
        nodesMap.set(source, {
          name: source,
          role: r.get("sourceRole"),
          title: r.get("sourceTitle"),
          website: r.get("sourceWebsite"),
          x: Math.random() * 500,
          y: Math.random() * 500
        });
      }

    // Add or update target node
      if (!nodesMap.has(target)) {
        nodesMap.set(target, {
          name: target,
          role: r.get("targetRole"),
          title: r.get("targetTitle"),
          website: r.get("targetWebsite"),
          x: Math.random() * 500,
          y: Math.random() * 500
        });
      }

      return { source, target };
    });

    const nodes = Array.from(nodesMap.values());
    const updatedData = { nodes, links };

    localStorage.setItem("graphData", JSON.stringify(updatedData));
    this.setState({ data: updatedData, latestNode: newNodeName }, () => {
      if (newNodeName) {
        setTimeout(() => {
          let newNode = nodes.find(n => n.name === newNodeName);
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

  addNodeNFC = async (newUser) => {
    let session = this.driver.session({ database: "neo4j" });
    try {
      await session.run(
        `MERGE (u:User {name: $user}) 
         ON CREATE SET u.role = 'new user', 
                       u.title = '', 
                       u.website = ''

         MERGE (nfc:User {name: $nfcUser}) 
         ON CREATE SET nfc.role = 'NFC', 
                       nfc.title = 'DEMO', 
                       nfc.website = 'https://www.hako.soooul.xyz/drafts/washi'
         
         MERGE (awu:User {name: $awuUser}) 

         MERGE (u)-[:CONNECTED_TO]->(nfc) 
         MERGE (nfc)-[:CONNECTED_TO]->(awu)`,
        { 
          user: newUser, 
          nfcUser: "NFC Connection", 
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
      <Route path="/NFC" element={<NFCTrigger addNode={this.addNodeNFC} />} />
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

  React.useEffect(() => {
    const addAndRedirect = async () => {
      const newUser = `User-${Date.now()}`;

      try {
        await addNode(newUser);
        } catch (error) {
          console.error("Error adding user:", error);
          return;
        }

        setTimeout(() => {
          window.location.assign("/craft-network/#/");
          }, 1000);
        };

        addAndRedirect();
        }, [location]);

        return <div style={{ textAlign: "center", padding: "20px", fontSize: "16px", color: "red" }}>Processing NFC tap...</div>;
      };

      const GraphView = ({ data, handleChange, loadData, fgRef, latestNode, driver }) => {
  const [inputValue, setInputValue] = useState(""); // Keep input empty initially
  const [selectedNode, setSelectedNode] = useState(null);
  const [editedNode, setEditedNode] = useState(null); // Stores edited node details

  const handleInputChange = (event) => {
    const input = event.target.value;
    setInputValue(input);
    handleChange(event); // Update query state (even if blank)

    const isCypherQuery = /\b(MATCH|RETURN|WHERE|SET|CREATE|MERGE|DELETE)\b/i.test(input);

    if (!isCypherQuery && fgRef.current) {
      const matchedNodes = data.nodes.filter(
        (node) =>
        node.name.toLowerCase().includes(input.toLowerCase()) ||
        (node.title && node.title.toLowerCase().includes(input.toLowerCase()))
        );

      if (matchedNodes.length > 0) {
        const firstMatch = matchedNodes[0];
        fgRef.current.centerAt(firstMatch.x, firstMatch.y+100, 1500);
        fgRef.current.zoom(2.5);
      }
    }
  };

  const handleNodeClick = (node) => {
  if (!node) return; // Prevent errors if node is null
  setSelectedNode(node);
  setEditedNode({ ...node }); // Clone the selected node for editing
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
        website: editedNode.website
      }
      );
    await loadData(); // Reload the graph data to reflect changes
    setSelectedNode(null); // Automatically close the edit form
  } catch (error) {
    console.error("Error updating node:", error);
  } finally {
    session.close();
  }
};

return (
  <div width="95%">
  <textarea
  placeholder="Enter query, node name, or title..."
  style={{ display: "block", width: "95%", height: "60px", margin: "0 auto", textAlign: "center" }}
  value={inputValue}
  onChange={handleInputChange}
  />
  <button id="simulate" onClick={() => loadData()}>Run</button>
  <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
  <button id="info" onClick={() => window.open("https://www.hako.soooul.xyz/drafts/washi", "_blank")}>Info</button>

  <ForceGraph2D
  ref={fgRef}
  graphData={data}
  nodeId="name"
  nodeLabel={(node) => node.title || "No Title"}
  onNodeClick={handleNodeClick}
  nodeCanvasObject={(node, ctx) => {
    const isHighlighted =
    inputValue &&
    (node.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    (node.title && node.title.toLowerCase().includes(inputValue.toLowerCase())));

    ctx.fillStyle = node.name === latestNode ? "black" : "white";
    ctx.strokeStyle = isHighlighted ? "red" : "black";
    ctx.lineWidth = isHighlighted ? 3 : 2;

    ctx.beginPath();
    ctx.arc(node.x || Math.random() * 500, node.y || Math.random() * 500, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "gray";
    ctx.fillText(node.role, node.x + 10, node.y);
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
