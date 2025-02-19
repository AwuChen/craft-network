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
      query: `MATCH (u:User)-[r:CONNECTED_TO]->(v:User) RETURN u.name AS source, v.name AS target`,
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

      if (!nodesMap.has(source)) nodesMap.set(source, { name: source, x: Math.random() * 500, y: Math.random() * 500 });
      if (!nodesMap.has(target)) nodesMap.set(target, { name: target, x: Math.random() * 500, y: Math.random() * 500 });

      return { source, target };
    });

    const nodes = Array.from(nodesMap.values());
    const updatedData = { nodes, links };

    localStorage.setItem('graphData', JSON.stringify(updatedData));
    this.setState({ data: updatedData, latestNode: newNodeName }, () => {
  if (newNodeName) {
    setTimeout(() => {
      let newNode = nodes.find(n => n.name === newNodeName);
      if (newNode && this.fgRef.current) {
        console.log("Focusing on:", newNode);
        this.fgRef.current.centerAt(newNode.x, newNode.y, 1000);
        this.fgRef.current.zoom(1.5);  // Adjust as needed
      }
    }, 1500);  // Small delay to ensure rendering
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

        const GraphView = ({ data, query, handleChange, loadData, fgRef, latestNode }) => (
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
          </div>
          );

          export default CypherViz;
