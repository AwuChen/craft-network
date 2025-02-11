import React from 'react';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';

class CypherViz extends React.Component {
  constructor({ driver }) {
    super();
    this.driver = driver;
    this.state = {
      query: `
      MATCH (n:Character)-[:INTERACTS1]->(m:Character) 
      RETURN n.name as source, m.name as target
      `,
      data: {
        nodes: [
          { name: 'Awu Chen', color: 'White', craft: 'AI', roles: 'user', website: 'https://www.youtube.com/embed/ZqszIG2Vi30?start' }
        ],
        links: []
      }
    };
  }

  componentDidMount() {
    this.addNodeToAwuChen();
  }

  addNodeToAwuChen = () => {
    const newNodeName = `New Node ${Date.now()}`;
    this.setState(prevState => ({
      data: {
        nodes: [...prevState.data.nodes, { name: newNodeName, color: 'Gray', craft: 'Auto-Generated' }],
        links: [...prevState.data.links, { source: 'Awu Chen', target: newNodeName }]
      }
    }));
  };

  render() {
    return (
      <div width="100%">
        <button onClick={this.addNodeToAwuChen}>Add Node to Awu Chen</button>
        <ForceGraph2D
          graphData={this.state.data}
          nodeId="name"
          nodeLabel="craft"
          linkCurvature={0.2}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowLength={10}
          onNodeClick={node => window.open(node.website, 'New Window', 'width=500px,height=500px')}
        />
      </div>
    );
  }
}

export default CypherViz;
