import React from 'react';
import { HashRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';

class CypherViz extends React.Component {
  constructor({ driver }) {
    super();
    this.driver = driver;

    this.defaultData = {
      nodes: [
        {"name":"Dan Wadwhani","color":"Gray","craft":"business historian","roles":"researcher","website":"https://www.marshall.usc.edu/personnel/dan-wadhwani"},
        {"name":"Eugene Choi","color":"Gray","craft":"digitization of craft","roles":"researcher","website":"https://kendb.doshisha.ac.jp/profile/en.7895667c8d3ec428.html"},
        {"name":"Masataka Hosoo","color":"White","craft":"digital craft","roles":"producer","website":"https://awuchen.github.io/"},
        {"name":"John Hijika","color":"Blue","craft":"curator","roles":"curator","website":"https://www.instagram.com/hijika_agenda/?hl=en"},
        {"name":"Shuji Nakagawa","color":"Green","craft":"wood","roles":"craftsmen","website":"http://www.nakagawa-mokkougei.com/"},
        {"name":"Hosai Matsubayashi","color":"Green","craft":"pottery","roles":"craftsmen","website":"https://asahiyaki.com/"},
        {"name":"Toru Tsuji","color":"Green","craft":"metal","roles":"craftsmen","website":"https://kanaamitsuji.net/"},
        {"name":"Takahiro Yagi","color":"Green","craft":"tea caddy","roles":"craftsmen","website":"https://www.kaikado.jp/"},
        {"name":"Tatsuyuki Kosuga","color":"Green","craft":"bamboo","roles":"craftsmen","website":"https://www.kohchosai.co.jp/"},
        {"name":"Taeko Hosoo","color":"Purple","craft":"kimono","roles":"producer","website":"https://www.hosoo.co.jp/en/story/"},
        {"name":"Ami Miura","color":"Purple","craft":"life wisdom","roles":"producer","website":"https://jinsei-keiko.com/en/"},
        {"name":"Mae Englegeer","color":"Blue","craft":"textile","background":"Studio Mae Englegeer","roles":"artist","website":"https://www.mae-engelgeer.nl/"},
        {"name":"Hidehiko Matsumoto","color":"Green","craft":"sake","background":"Nichi Nichi","roles":"craftsmen","website":"https://sake.inc/"},
        {"name":"Yoshida Shinichiro","color":"Green","craft":"hemp","roles":"craftsmen","website":"https://www.instagram.com/shinmyouan/"},
        {"name":"Takafumi Zenryu Kawakami","color":"Green","craft":"zazen","roles":"craftsmen","website":"https://shunkoin.com/en/about"},
        {"name":"Toryo Ito","color":"Yellow","craft":"Ryosokuin","roles":"venue","website":"https://ryosokuin.com/"},
        {"name":"Mitsuru Yokoyama","color":"Green","craft":"tatami","background":"Yokoyama Tatami","website":"https://yokoyamatatami.com/biography/"},
        {"name":"Garrett Uno","color":"Yellow","craft":"kimono","roles":"patron"},
        {"name":"Ko Kado","color":"Green","craft":"karakami","roles":"craftsmen","website":"https://kamisoe.com/en/index.html"},
        {"name":"A-C-K","color":"Yellow","craft":"A-C-K","roles":"venue","website":"https://a-c-k.jp/en/"},
        {"name":"Sudo","color":"Green","roles":"craftsmen"},
        {"name":"Ethan Yu","color":"Yellow","roles":"patron"},
        {"name":"Takahashi","color":"Purple","craft":"whiskey","roles":"producer"},
        {"name":"Yusai Okuda","color":"Green","craft":"textile dye","roles":"craftsmen","website":"https://yusai.kyoto/yusai"},
        {"name":"Annick Luo","color":"Gray","roles":"researcher"},
        {"name":"Ilan Derech","color":"Blue","craft":"kimono","roles":"artist"},
        {"name":"Tien-san","color":"Green","craft":"kaiseki","roles":"craftsmen","website":"https://www.hamatoku.co/`"},
        {"name":"Eddie","color":"Yellow","roles":"patron"},
        {"name":"Yuki Kataoka","color":"Green","craft":"bike","roles":"craftsmen","website":"https://vigore.co.jp/"},
        {"name":"Michael Kozlowski","color":"Blue","roles":"artist"},
        {"name":"Koichi Saito","color":"Purple","craft":"silk","roles":"producer","website":"https://spiber.inc/en/"},
        {"name":"Osawa Kiyomi","color":"Green","craft":"embroidery","roles":"craftsmen","website":"https://osawashokai.jp/"},
        {"name":"Daido-san","color":"Green","craft":"dye","roles":"craftsmen"},
        {"name":"Yui Tanaka","color":"Blue","roles":"artist"},
        {"name":"Alex Kimi","color":"Yellow","roles":"artist"},
        {"name":"Vicki Dobbs Beck","color":"Yellow","craft":"kimono","roles":"patron"},
        {"name":"Carole Sabas","color":"Purple","craft":"kimono","roles":"producer"},
        {"name":"Matthew Drinkwater","color":"Yellow","craft":"kimono","roles":"patron"},
        {"name":"Robin Caudwell","color":"Yellow","roles":"researcher"},
        {"name":"Kate Reardon","color":"Yellow","roles":"researcher"},
        {"name":"Gala","color":"Yellow","craft":"kimono","roles":"CEO","website":"https://www.tribute-brand.com/about"},
        {"name":"Hirokazu Kato","color":"Green","craft":"pottery","roles":"craftsmen","website":"https://www.cerkato.com/"},
        {"name":"Akiteru Kawai","color":"Green","craft":"pottery","roles":"craftsmen","website":"https://kawai1908.com/works/"},
        {"name":"Tenshin Juba","color":"Green","craft":"pottery","roles":"craftsmen","website":"http://www.tsukumogama.com/home.en.html"},
        {"name":"Daniel Calderon Arenas","color":"Blue","craft":"pottery","roles":"artist"},
        {"name":"Nanao Kobayashi","color":"Blue","craft":"metal","roles":"artist","website":"http://www.nanaokobayashi.com/"},
        {"name":"Yuriko Takagi","color":"Blue","craft":"photogaphy","roles":"artist","website":"https://yurikotakagi.com/"},
        {"name":"Kaori Sasayama","color":"Purple","craft":"art x craft","roles":"producer","website":"https://www.instagram.com/sasa_yama_kaori/?locale=en_US&hl=en"},
        {"name":"Ariko Inaoka","color":"Green","craft":"soba","roles":"craftsmen","website":"https://honke-owariya.co.jp/en/the-story-of-owariya/"},
        {"name":"Kondaya Genbei","color":"Purple","craft":"obi","roles":"producer","website":"https://kondayagenbei.jp/"},
        {"name":"Nagano Ishikawa","color":"Green","roles":"craftsmen"},
        {"name":"Shogo Okawa","color":"Green","craft":"lacquer","roles":"craftsmen","website":"https://www.instagram.com/shogo_okawa/"},
        {"name":"Nina Fradet","color":"Green","craft":"wood","roles":"craftsmen","website":"https://www.hinnstudio.com/"},
        {"name":"Kondo","color":"Blue","roles":"artist"},
        {"name":"Yui Kondo","color":"Blue","roles":"architect"},
        {"name":"Nanjo Kobo","color":"Green","craft":"orin","roles":"craftsmen","website":"https://linne-orin.com/en/craftmanship/"},
        {"name":"Aluan Wang","color":"Blue","craft":"generative art","roles":"artist"},
        {"name":"Sachihito Kudo","color":"Green","craft":"karakami","roles":"craftsmen","website":"https://karamaru.kyoto/en/"},
        {"name":"Gunma","color":"Green","roles":"craftsmen"},
        {"name":"Sky Whitehead","color":"Yellow","craft":"Japan House","roles":"producer","website":"https://www.japanhousela.com/aboutus/"},
        {"name":"John Couch","color":"Blue","craft":"zen","roles":"artist","website":"https://www.john-couch.com/about"},
        {"name":"Yu Kamimura","color":"Yellow","craft":"Gallery Sugata","roles":"venue","website":"https://www.instagram.com/gallery_sugata/"},
        {"name":"Shoe Nakamura","color":"Purple","craft":"Ambient Kyoto","roles":"producer","website":"https://ambientkyoto.com/en/about"},
        {"name":"Marta Gasparin","color":"Gray","craft":"Hephaestus","roles":"researcher","website":"https://www.cbs.dk/en/research/departments-and-centres/department-of-business-humanities-and-law/staff/mgabhl"},
        {"name":"Paul Niiro","color":"Green","roles":"craftsmen"},
        {"name":"Takeshi Shigemizu","color":"Green","roles":"craftsmen"},
        {"name":"Terui Yamawaki","color":"Green","craft":"pottery","roles":"craftsmen"},
        {"name":"Kimoto Yuriko","color":"Green","roles":"craftsmen"},
        {"name":"Ryoma Noda","color":"Green","roles":"craftsmen"},
        {"name":"Natsuko Toda","color":"Green","roles":"craftsmen"},
        {"name":"Morino Keito","color":"Green","roles":"craftsmen"},
        {"name":"Yandonghong Anna","color":"Green","roles":"craftsmen"},
        {"name":"Ota Kai","color":"Green","roles":"craftsmen"},
        {"name":"Banjo","color":"Purple","craft":"Yamauchi No.10","roles":"producer","website":"https://y-n10.com/"},
        {"name":"Matsumoto","color":"Blue","roles":"artist"},
        {"name":"Shiho Fukuhara","color":"Blue","craft":"Bōsōzoku","roles":"artist","website":"https://hae.tokyo/en/"},
        {"name":"Umi Chae","color":"Green","craft":"kinkou","background":"Human Awesome Error","roles":"researcher","website":"https://hae.tokyo/en/"},
        {"name":"Takaaki Murase","color":"Blue","craft":"plant","roles":"artist","website":"https://www.replanter.com/"},
        {"name":"Masaya Kushino","color":"Blue","craft":"fashion","roles":"artist", "website":"https://www.instagram.com/masayakushino/?hl=en"},
        {"name":"Kodama","color":"Purple","roles":"producer"},
        {"name":"Hatta Shun","color":"Green","craft":"kumihimo","background":"Showen","roles":"researcher","website":"https://showenkumihimo.com/"},
        {"name":"Shizuku Tatsuaki","color":"Green","craft":"kinkou","background":"Umi's Apprentice","roles":"researcher"},
        {"name":"Fukutaro Nakayama","color":"Green","roles":"craftsmen"},
        {"name":"Yuna Yagi","color":"Blue","craft":"photogaphy","roles":"artist","website":"https://www.yunayagi.com/"},
        {"name":"Sander Wassick","color":"Blue","roles":"artist","website":"https://www.instagram.com/sander__wassink/?hl=en"},
        {"name":"Rintaro Akazawa","color":"Blue","roles":"architect","website":"https://kenchikuproject.tumblr.com/"},
        {"name":"Mitasho-san","color":"Green","roles":"craftsmen"},
        {"name":"Kiyoko","color":"Yellow","craft":"The Terminal Kyoto","background":"The Terminal","roles":"venue","website":"https://kyoto.theterminal.jp/"},
        {"name":"Danielle Demetriou","color":"Gray","craft":"marketing","background":"British","roles":"researcher","website":"https://www.instagram.com/danielleinjapan/?hl=en"},
        {"name":"Vittoria Magrelli","color":"Gray","craft":"","background":"University of Bozen-Bolzano","roles":"researcher","website":"https://www.research.lancs.ac.uk/portal/en/people/vittoria-magrelli(c471d5c9-2142-40f2-83dc-70237a5f715a).html"},
        {"name":"Daniel Hjorth","color":"Gray","craft":"","background":"Copenhagen Business School","roles":"researcher","website":"https://www.cbs.dk/en/research/departments-and-centres/department-of-business-humanities-and-law/staff/dhbhl"},
        {"name":"Damian Doherty","color":"Gray","craft":"","background":"University of Liverpool","roles":"researcher","website":"https://www.liverpool.ac.uk/people/damian-odoherty"},
        {"name":"Yamauchi Yutaka","color":"Gray","craft":"tea ceremony","background":"Kyoto University","roles":"researcher","website":"https://www.gsm.kyoto-u.ac.jp/en/faculty/543/"},
        {"name":"Soshin Kimura","color":"Green","craft":"tea master","background":"Hoshinkai","roles":"craftsmen"},
        {"name":"Adam Clauge","color":"Gray","craft":"pottery","background":"University of Oxford","roles":"researcher"},
        {"name":"Hee-Chan Sang","color":"Gray","craft":"","background":"Sasin School of Management","roles":"researcher","website":"https://www.sasin.edu/profile/hee-chan-song"},
        {"name":"Fabrizio Panozzo","color":"Gray","craft":"pottery","background":"University of Venice","roles":"researcher","website":"https://www.unive.it/data/people/5592695"},
        {"name":"Kenichi Hashimoto","color":"Green","craft":"sake","background":"Ryozanpaku","roles":"researcher","website":"https://jwhisky.jp/en/profile/kenichi-hashimoto/"},
        {"name":"Jingjing Weng","color":"Gray","craft":"glass","background":"National Taiwan University of Science and Technology","roles":"researcher","website":"https://www.tm.ntust.edu.tw/p/404-1012-118276.php?Lang=en"},
        {"name":"Michelle Yang","color":"Black","craft":"marketing","background":"Kyoto University","roles":"researcher","website":"https://www.michelleicyang.com/about-michelle"},
        {"name":"Grace Yi","color":"Gray","craft":"sword","background":"National Tsing Hua University","roles":"researcher","website":"https://imba.ncku.edu.tw/index.php?option=module&lang=en&task=pageinfo&id=560&index=8"},
        {"name":"Chichie Huang","color":"Green","craft":"paper","background":"GoangXing Paper Mill","roles":"researcher","website":"https://www.taiwanpaper.net/visitors"},
        {"name":"Shirah Hoy","color":"Gray","craft":"","background":"Kyoto University Research Residency","roles":"researcher"},
        {"name":"Masaru Karube","color":"Gray","craft":"","background":"Hitotsubashi University","roles":"researcher","website":"https://hri.ad.hit-u.ac.jp/html/112_profile_en.html"},
        {"name":"Matthias Kipping","color":"Gray","craft":"","background":"York University","roles":"researcher","website":"https://schulich.yorku.ca/faculty/matthias-kipping/"},
        {"name":"Kazuo Doi","color":"Gray","craft":"","background":"Kyushu Sangyo University","roles":"researcher","website":"https://hyoka.ofc.kyushu-u.ac.jp/html/100022138_en.html"},
        {"name":"Eleanor Westney","color":"Gray","craft":"","background":"MIT Sloan","roles":"researcher","website":"https://mitsloan.mit.edu/faculty/directory/d-eleanor-westney"},
        {"name":"Kiyohiko Ho","color":"Gray","craft":"","background":"Shidler College of Business","roles":"researcher"},
        {"name":"Ito ","color":"Gray","craft":"","background":"Kyoto University","note":"prev bartender","roles":"researcher"},
        {"name":"Yusuke Nananishi","color":"Purple","craft":"Kyotographie","background":"Kyotographie","note":"friendly approachable","roles":"researcher","website":"https://2021.kyotographie.jp/about/?lang=en"},
        {"name":"Mama-san","color":"Purple","craft":"shamisen","background":"8000 generation","note":"small cozy space","roles":"connector"},
        {"name":"Yuima Nakazato","color":"Purple","craft":"fashion","background":"Pottery","note":"Collanorated with Spiber, met through Shiho","roles":"director","website":"https://www.yuimanakazato.com/"},
        {"name":"Ako Myochin","color":"Green","craft":"samurai armour","background":"studied under the 25th head of the family, armor maker Myochin Muneyoshi, and Akira Kawanishi of the Takada family, who is in charge of preparing costumes for the Imperial Household Agency","note":"Next to HOSOO dyeing lab","roles":"craftsmen","website":"https://yoroinoya.kyoto/"},
        {"name":"Masayo Funakoshi","color":"Green","craft":"culinary","background":"farmoon","note":"","roles":"chef","website":"https://www.instagram.com/masayofunakoshi/"},
        {"name":"Tanabe Chikuunsai IV","color":"Green","craft":"bamboo","background":"Chikuunsai","note":"exhibited at JHLA","roles":"craftsmen","website":"https://chikuunsai.com/"},
        ],
links:[
  {source:"Dan Wadwhani",target:"Eugene Choi"},
  {source:"Eugene Choi",target:"Masataka Hosoo"},
  {source:"Eugene Choi",target:"Masaru Karube"},
  {source:"Masataka Hosoo",target:"Taeko Hosoo"},
  {source:"Masataka Hosoo",target:"Kondo"},
  {source:"Masataka Hosoo",target:"Yui Kondo"},
  {source:"Masataka Hosoo",target:"Kondo"},
  {source:"Masataka Hosoo",target:"John Hijika"},
  {source:"Yui Kondo",target:"Nina Fradet"},
  {source:"Yui Kondo",target:"Nina Fradet"},
  {source:"Yui Kondo",target:"Shoe Nakamura"},
  {source:"Nina Fradet",target:"Tanabe Chikuunsai IV"},
  {source:"Yoshida Shinichiro",target:"John Hijika"}, 
  {source:"Masataka Hosoo",target:"Yoshida Shinichiro"},
  {source:"Yoshida Shinichiro",target:"Mae Englegeer"},
  {source:"Masataka Hosoo",target:"Mae Englegeer"},
  {source:"Masataka Hosoo",target:"Mae Englegeer"},
  {source:"Masataka Hosoo",target:"Mae Englegeer"},
  {source:"Mae Englegeer",target:"John Hijika"},
  {source:"Masataka Hosoo",target:"Hosai Matsubayashi"},
  {source:"Masataka Hosoo",target:"Toryo Ito"},
  {source:"Masataka Hosoo",target:"Hidehiko Matsumoto"},
  {source:"Masataka Hosoo",target:"Takafumi Zenryu Kawakami"},
  {source:"Masataka Hosoo",target:"Ami Miura"},
  {source:"Masataka Hosoo",target:"Mitsuru Yokoyama"},
  {source:"Masataka Hosoo",target:"Ako Myochin"},
  {source:"Mitsuru Yokoyama",target:"Mae Englegeer"},
  {source:"Masataka Hosoo",target:"Ko Kado"},
  {source:"Masataka Hosoo",target:"A-C-K"},
  {source:"Sky Whitehead",target:"Masataka Hosoo"},
  {source:"Tanabe Chikuunsai IV",target:"Sky Whitehead"},
  {source:"Masataka Hosoo",target:"Yu Kamimura"},
  {source:"Masataka Hosoo",target:"Yuna Yagi"},
  {source:"Ami Miura",target:"Hosai Matsubayashi"},
  {source:"Ami Miura",target:"Takafumi Zenryu Kawakami"},
  {source:"Shiho Fukuhara", target:"Banjo"},
  {source:"Banjo", target:"Masataka Hosoo"},
  {source:"Banjo",target:"Matsumoto"},
  {source:"Banjo",target:"Umi Chae"},
  {source:"Banjo",target:"Takaaki Murase"},
  {source:"Banjo",target:"Masaya Kushino"},
  {source:"Banjo",target:"Kodama"},
  {source:"Banjo",target:"Hatta Shun"},
  {source:"Hatta Shun",target:"Nanjo Kobo"},
  {source:"Banjo",target:"Yuna Yagi"},
  {source:"Yuna Yagi",target:"Toryo Ito"},
  {source:"Banjo",target:"Fukutaro Nakayama"},
  {source:"Fukutaro Nakayama",target:"Toryo Ito"},
  {source:"Sander Wassick",target:"Mae Englegeer"},
  {source:"Takahashi",target:"Tien-san"},
  {source:"Takahashi",target:"Yusai Okuda"},
  {source:"Koichi Saito",target:"Osawa Kiyomi"},
  {source:"Alex Kimi",target:"Osawa Kiyomi"},
  {source:"Osawa Kiyomi",target:"Daido-san"},
  {source:"Koichi Saito",target:"Yui Tanaka"},
  {source:"Vicki Dobbs Beck",target:"Carole Sabas"},
  {source:"Vicki Dobbs Beck",target:"Matthew Drinkwater"},
  {source:"Vicki Dobbs Beck",target:"Robin Caudwell"},
  {source:"Vicki Dobbs Beck",target:"Kate Reardon"},
  {source:"Kiyoko",target:"Ko Kado"},
  {source:"Dan Wadwhani",target:"Marta Gasparin"},
  {source:"Marta Gasparin",target:"Yamauchi Yutaka"},
  {source:"Marta Gasparin",target:"Daniel Hjorth"},
  {source:"Marta Gasparin",target:"Daniel Hjorth"},
  {source:"Daniel Hjorth",target:"Jingjing Weng"},
  {source:"Marta Gasparin",target:"Vittoria Magrelli"},
  {source:"Yamauchi Yutaka",target:"Soshin Kimura"},
  {source:"Yamauchi Yutaka",target:"Kenichi Hashimoto"},
  {source:"Yamauchi Yutaka",target:"Adam Clauge"},
  {source:"Adam Clauge",target:"Hidehiko Matsumoto"},
  {source:"Yamauchi Yutaka",target:"Michelle Yang"},
  {source:"Yamauchi Yutaka",target:"Shirah Hoy"},
  {source:"Yamauchi Yutaka",target:"Jingjing Weng"},
  {source:"Jingjing Weng",target:"Grace Yi"},
  {source:"Jingjing Weng",target:"Chichie Huang"},
  {source:"Yui Kondo",target:"Yusuke Nananishi"},
  {source:"Takaaki Murase",target:"Mama-san"},
  {source:"Shiho Fukuhara",target:"Yuima Nakazato"},
  {source:"Koichi Saito",target:"Yuima Nakazato"},
  {source:"Koichi Saito",target:"Yusai Okuda"},
  {source:"Sky Whitehead",target:"John Couch"},
  {source:"Ako Myochin",target:"Sky Whitehead"},
  {source:"Kaori Sasayama",target:"Nanao Kobayashi"},
  {source:"Nanao Kobayashi",target:"Yuriko Takagi"},
  {source:"Kaori Sasayama",target:"Tenshin Juba"},
  {source:"Kaori Sasayama",target:"Kondaya Genbei"},
  {source:"John Hijika",target:"Masayo Funakoshi"},
  {source:"Nanao Kobayashi",target:"Masayo Funakoshi"}
  ]
    };
    this.state = {
      query: `
      MATCH (n:Character)-[:INTERACTS1]->(m:Character) 
      RETURN n.name as source, m.name as target
      `,
      data: this.loadGraphData()
    };
  }

  loadGraphData = () => {
    try {
      const storedData = JSON.parse(localStorage.getItem('graphData'));
      if (!storedData || !Array.isArray(storedData.nodes) || !Array.isArray(storedData.links)) {
        console.warn("Invalid graph data found in localStorage. Resetting...");
        this.resetData();
        return this.defaultData;
      }

      // Ensure all nodes have x, y positions
      return {
        nodes: storedData.nodes.map(node => ({
          ...node,
          x: node.x || Math.random() * 500,
          y: node.y || Math.random() * 500
        })),
        links: storedData.links
      };
    } catch (e) {
      console.error("Error parsing local storage data:", e);
      this.resetData();
      return this.defaultData;
    }
  };

  persistGraphData = () => {
    localStorage.setItem('graphData', JSON.stringify(this.state.data));
  };

  resetData = () => {
    localStorage.setItem('graphData', JSON.stringify(this.defaultData));
  };

  componentDidMount() {
    this.persistGraphData();
  }

  addNodeNFC = () => {
    this.setState(prevState => {
      const existingNodes = prevState.data.nodes.map(node => node.name);
      if (!existingNodes.includes('Masataka Hosoo')) {
        console.error("Masataka Hosoo not found in nodes.");
        return prevState;
      }

      const newNodeName = `User ${Date.now()}`;
      const updatedData = {
        nodes: [
          ...prevState.data.nodes,
          { name: newNodeName, color: 'white', craft: 'NFC-Generated', size: 10, isNew: true, website: 'https://hako.soooul.xyz/apply/', x: Math.random() * 500, y: Math.random() * 500 }
        ],
        links: [...prevState.data.links, { source: 'Masataka Hosoo', target: newNodeName }]
      };

      localStorage.setItem('graphData', JSON.stringify(updatedData));
      return { data: updatedData };
    }, this.persistGraphData);
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

    nodes = Array.from(nodes).map(name => ({ name, x: Math.random() * 500, y: Math.random() * 500 }));
    const updatedData = { nodes, links };
    localStorage.setItem('graphData', JSON.stringify(updatedData));
    this.setState({ data: updatedData }, this.persistGraphData);
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
        onChange={this.handleChange}
      />
      <button id="simulate" onClick={this.loadData}>Simulate</button>
      <button id="visualize" onClick={() => window.open("https://awuchen.github.io/craft-network-3d/", "_blank")}>Visualize3D</button>
      <button id="form" onClick={() => window.open("https://hako.soooul.xyz/apply/", "_blank")}>Onboard</button>
      <button id="reset" onClick={() => { this.resetData(); window.location.reload(); }}>Reset</button>
      <ForceGraph2D
        graphData={this.state.data}
        nodeId="name"
        nodeLabel="craft"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = (node.isNew ? 10 : 0) / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          if (node.isNew) {
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
          } else {
            ctx.fillStyle = node.color;
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.isNew ? 10 : 5, 0, 2 * Math.PI, false);
          ctx.fill();
          if (node.isNew) ctx.stroke();

          ctx.fillStyle = "gray";
          if (node.isNew) {
            ctx.fillText(label, node.x + 8, node.y + 8);
          }
        }}
        linkCurvature={0.2}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowLength={10}
        onNodeClick={node => node.website && window.open(node.website, 'New Window', 'width=500px,height=500px')}
      />
    </div>
  );
}

const NFCTrigger = ({ addNode }) => {
  const location = useLocation();
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      addNode();
    }
  }, [location]);

  return <Navigate to="/" />;
};

export default CypherViz;