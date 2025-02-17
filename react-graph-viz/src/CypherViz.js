import React from 'react';
import { HashRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
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
      query: `
      MATCH (u:User)-[r:CONNECTED_TO]->(v:User) RETURN u.name AS source, v.name AS target
      `
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
    await session.run(
      "MERGE (u:User {name: $user}) MERGE (prev:User {name: $prevUser}) MERGE (u)-[:CONNECTED_TO]->(prev)",
      { user: newUser, prevUser: this.state.data.nodes[this.state.data.nodes.length - 1]?.name || "Root" }
    );
    session.close();
    this.loadData();
  };

  render() {
    return (
      <Router>
        <Routes>
          <Route path="/NFC" element={<NFCTrigger addNode={this.addNodeNFC} />} />
          <Route path="/" element={this.renderGraph()} />
        </Routes>
      </Router>
    );
  }

  renderGraph = () => (
    <div width="95%">
      <textarea
        style={{ display: "block", width: "95%", height: "100px", margin: "0 auto", textAlign: "center"}}
        value={this.state.query}
        onChange={(e) => this.setState({ query: e.target.value })} // ✅ Directly updates state
      />
      <button id="simulate" onClick={this.loadData}>Simulate</button>
      <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
      <ForceGraph2D
        graphData={this.state.data}
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
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowLength={5}
        onNodeClick={node => node.website && window.open(node.website, 'New Window', 'width=500px,height=500px')}
      />
    </div>
  );
}

const NFCTrigger = ({ addNode }) => {
  const location = useLocation();
  React.useEffect(() => {
    const newUser = `User-${Date.now()}`;
    addNode(newUser);
  }, [location]);

  return <Navigate to="/" />;
};

export default CypherViz;
