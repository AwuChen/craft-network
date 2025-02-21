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
          role: r.get("sourceRole") || "N/A",
          title: r.get("sourceTitle") || "N/A",
          website: r.get("sourceWebsite") || "N/A",
          x: Math.random() * 500,
          y: Math.random() * 500
        });
      }

    // Add or update target node
      if (!nodesMap.has(target)) {
        nodesMap.set(target, {
          name: target,
          role: r.get("targetRole") || "N/A",
          title: r.get("targetTitle") || "N/A",
          website: r.get("targetWebsite") || "N/A",
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
            this.fgRef.current.centerAt(newNode.x, newNode.y, 1000);
            this.fgRef.current.zoom(1.5);
          }
        }, 1500);
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
        "MERGE (u:User {name: $user}) MERGE (prev:User {name: $prevUser}) MERGE (u)-[:CONNECTED_TO]->(prev)",
        { user: newUser, prevUser: "NFC Connection" }
        );
      await this.loadData(newUser);
    } catch (error) {
      console.error("Error adding user:", error);
    }
    session.close();
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
      <Route path="/" element={<GraphView data={this.state.data} query={this.state.query} handleChange={this.handleChange} loadData={this.loadData} fgRef={this.fgRef} latestNode={this.state.latestNode} />} />
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

        const GraphView = ({ data, query, handleChange, loadData, fgRef, latestNode }) => {
          const [selectedNode, setSelectedNode] = useState(null);

          const handleNodeClick = (node) => {
            setSelectedNode(node);
          };

          return (
            <div width="95%">
            <textarea
            style={{ display: "block", width: "95%", height: "50px", margin: "0 auto", textAlign: "center" }}
            value={query}
            onChange={handleChange}
            />
            <button id="simulate" onClick={() => loadData()}>Simulate</button>
            <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
            <button id="info" onClick={() => window.open("https://www.hako.soooul.xyz/drafts/washi", "_blank")}>Info</button>

            <ForceGraph2D
            ref={fgRef}
            graphData={data}
            nodeId="name"
            nodeLabel="name"
            onNodeClick={handleNodeClick} // Add click event handler
            nodeCanvasObject={(node, ctx) => {
              ctx.fillStyle = node.name === latestNode ? "black" : "white";
              ctx.strokeStyle = "black";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(node.x || Math.random() * 500, node.y || Math.random() * 500, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "gray";
              ctx.fillText(node.name, node.x + 10, node.y);
            }}
            linkCurvature={0.2}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowLength={5}
            />

            {selectedNode && (
              <div style={{
                position: "absolute",
                top: "20%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "20px",
                backgroundColor: "white",
                border: "1px solid black",
                boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.3)",
                zIndex: 1000
              }}>
              <h3>Node Information</h3>
              <p><strong>Name:</strong> {selectedNode.name}</p>
              <p><strong>Role:</strong> {selectedNode.role || "N/A"}</p>
              <p><strong>Title:</strong> {selectedNode.title || "N/A"}</p>
              <p>
              <strong>Website:</strong>{" "}
              {selectedNode.website && selectedNode.website !== "N/A" ? (
                <a href={selectedNode.website} target="_blank" rel="noopener noreferrer">
                {selectedNode.website}
                </a>
                ) : (
                "N/A"
              )}
              </p>
              <button onClick={() => setSelectedNode(null)}>Close</button>
              </div>
            )}
              </div>
              );
            };


            export default CypherViz;
