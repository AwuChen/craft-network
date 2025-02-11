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
      data: JSON.parse(localStorage.getItem('graphData')) || {
        nodes: [
          { "name": "Dan Wadwhani", "color": "Gray", "craft": "business historian", "roles": "researcher", "website": "https://www.marshall.usc.edu/personnel/dan-wadhwani" },
          { "name": "Eugene Choi", "color": "Gray", "craft": "digitization of craft", "roles": "researcher", "website": "https://kendb.doshisha.ac.jp/profile/en.7895667c8d3ec428.html" },
          { "name": "Awu Chen", "color": "White", "craft": "AI", "roles": "user", "website": "https://www.youtube.com/embed/ZqszIG2Vi30?start" },
          { "name": "John Hijika", "color": "Blue", "craft": "curator", "roles": "curator", "website": "https://www.instagram.com/hijika_agenda/?hl=en" }
        ],
        links: [
          { "source": "Dan Wadwhani", "target": "Eugene Choi" },
          { "source": "Eugene Choi", "target": "Awu Chen" },
          { "source": "Awu Chen", "target": "John Hijika" }
        ]
      }
    };
  }

  componentDidMount() {
    this.addNodeToAwuChen();
  }

  addNodeToAwuChen = () => {
    const newNodeName = `New Node ${Date.now()}`;
    this.setState(prevState => {
      const updatedData = {
        nodes: [...prevState.data.nodes, { name: newNodeName, color: 'Gray', craft: 'Auto-Generated' }],
        links: [...prevState.data.links, { source: 'Awu Chen', target: newNodeName }]
      };
      localStorage.setItem('graphData', JSON.stringify(updatedData));
      return { data: updatedData };
    });
  };

  handleChange = (event) => {
    this.setState({ query: event.target.value });
  };

  loadData = async () => {
    let session = await this.driver.session({ database: "gameofthrones" });
    let res = await session.run(this.state.query);
    session.close();
    console.log(res);
    let nodes = new Set();
    let links = res.records.map(r => {
      let source = r.get("source");
      let target = r.get("target");
      nodes.add(source);
      nodes.add(target);
      return { source, target };
    });
    nodes = Array.from(nodes).map(name => ({ name }));
    const updatedData = { nodes, links };
    localStorage.setItem('graphData', JSON.stringify(updatedData));
    this.setState({ data: updatedData });
  };

  render() {
    return (
      <div width="100%">
        <textarea
          style={{ display: "block", width: "100%", height: "100px" }}
          value={this.state.query}
          onChange={this.handleChange}
        />
        <button id="simulate" onClick={this.loadData}>Simulate</button>
        <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
        <button id="form" onClick={() => window.open("https://hako.soooul.xyz/apply/", "_blank")}>Onboard</button>
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