import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';

class CypherViz extends React.Component {
  constructor({ driver }) {
    super();
    this.driver = driver;
    
    this.defaultData = {
      nodes: [],
      links: []
    };
    
    this.state = {
      data: this.defaultData,
      query: `MATCH (u:User)-[r:CONNECTED_TO]->(v:User) RETURN u.name AS source, v.name AS target`
    };
  }

  loadData = async () => {
    let session = this.driver.session({ database: "neo4j" });
    let res = await session.run(this.state.query);
    session.close();

    let nodes = new Set();
    let links = res.records.map(r => {
      let source = r.get("source");
      let target = r.get("target");
      nodes.add(source);
      nodes.add(target);
      return { source, target };
    });

    nodes = Array.from(nodes).map(name => ({ name, x: Math.random() * 500, y: Math.random() * 500 }));
    const updatedData = { nodes, links };
    localStorage.setItem('graphData', JSON.stringify(updatedData));
    this.setState({ data: updatedData });
  };

  componentDidMount() {
    this.loadData();
  }

  addNodeNFC = async (newUser) => {
    let session = this.driver.session({ database: "neo4j" });
    try {
      await session.run(
        "MERGE (u:User {name: $user}) MERGE (prev:User {name: $prevUser}) MERGE (u)-[:CONNECTED_TO]->(prev)",
        { user: newUser, prevUser: "Root" }
      );
      await this.loadData();
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
            <Route path="/" element={<GraphView data={this.state.data} query={this.state.query} handleChange={this.handleChange} loadData={this.loadData} />} />
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

const GraphView = ({ data, query, handleChange, loadData }) => (
  <div width="95%">
    <textarea
      style={{ display: "block", width: "95%", height: "100px", margin: "0 auto", textAlign: "center" }}
      value={query}
      onChange={handleChange}
    />
    <button id="simulate" onClick={loadData}>Simulate</button>
    <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
    <ForceGraph2D
      graphData={data}
      nodeId="name"
      nodeLabel="name"
      nodeCanvasObject={(node, ctx) => {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(node.x || Math.random() * 500, node.y || Math.random() * 500, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillText(node.name, node.x + 10, node.y);
      }}
      linkCurvature={0.2}
      linkDirectionalArrowRelPos={1}
      linkDirectionalArrowLength={5}
    />
  </div>
);

export default CypherViz;
