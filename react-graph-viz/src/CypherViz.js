import React from 'react';
import './App.css';
import ForceGraph2D from 'react-force-graph-2d';

// Usage: <CypherViz driver={driver}/>

class CypherViz extends React.Component {
    constructor({driver}) {
      super();
      this.driver = driver;
      this.state = { 
        query: `
        MATCH (n:Character)-[:INTERACTS1]->(m:Character) 
        RETURN n.name as source, m.name as target
        `,
        data : {nodes:[
          {"name":"Dan Wadwhani","color":"Gray","roles":"researcher"},
          {"name":"Eugene Choi","color":"Gray","roles":"researcher"},
          {"name":"Masataka Hosoo","color":"Purple","roles":"producer"},
          {"name":"Shuji Nakagawa","color":"Green","roles":"craftsmen"},
          {"name":"Hosai Matsubayashi","color":"Green","roles":"craftsmen"},
          {"name":"Toru Tsuji","color":"Green","roles":"craftsmen"},
          {"name":"Takahiro Yagi","color":"Green","roles":"craftsmen"},
          {"name":"Tatsuyuki Kosuga","color":"Green","roles":"craftsmen"},
          {"name":"Taeko Hosoo","color":"Purple","roles":"producer"},
          {"name":"John Couch","color":"Blue","roles":"artist"},
          {"name":"Ami","color":"Purple","roles":"producer"},
          {"name":"Mae Englegeer","color":"Blue","craft":"textile","background":"Studio Mae Englegeer","roles":"artist"},
          {"name":"Hidehiko Matsumoto","color":"Green","craft":"sake","background":"Nichi Nichi","roles":"craftsmen"},
          {"name":"Yoshida","color":"Green","roles":"craftsmen"},
          {"name":"Kawakami","color":"Green","roles":"craftsmen"},
          {"name":"Toryo Ito","color":"Green","roles":"researcher"},
          {"name":"Mitsuru Yokoyama","color":"Green","craft":"tatami","background":"Yokoyama Tatami"},
          {"name":"Garrett Uno","color":"Customer","roles":"researcher"},
          {"name":"Ko Kado","color":"Green","roles":"researcher"},
          {"name":"Hide Suzuki","color":"Purple","roles":"researcher"},
          {"name":"Sudo","color":"Green","roles":"researcher"},
          {"name":"Ethan Yu","color":"Customer","roles":"researcher"},
          {"name":"Takahashi","color":"Purple","roles":"researcher"},
          {"name":"Yusai Okuda","color":"Green","roles":"researcher"},
          {"name":"Annick Luo","color":"Purple","roles":"researcher"},
          {"name":"Derech","color":"Blue","roles":"researcher"},
          {"name":"Tien-san","color":"Green","roles":"researcher"},
          {"name":"Eddie","color":"Customer","roles":"researcher"},
          {"name":"Yuki Kataoka","color":"Green","roles":"researcher"},
          {"name":"Michael Kozlowski","color":"Blue","roles":"researcher"},
          {"name":"Koichi Saito","color":"Purple","roles":"researcher"},
          {"name":"Osawa Kiyomi","color":"Green","roles":"researcher"},
          {"name":"Daido-san","color":"Green","roles":"researcher"},
          {"name":"Yui Tanaka","color":"Blue","roles":"researcher"},
          {"name":"Alex Kimi","color":"Gold","roles":"researcher"},
          {"name":"Vicki Dobbs Beck","color":"Gold","roles":"researcher"},
          {"name":"Carole Sabas","color":"Purple","roles":"researcher"},
          {"name":"Matthew Drinkwater","color":"Gold","roles":"researcher"},
          {"name":"Robin Caudwell","color":"Gold","roles":"researcher"},
          {"name":"Kate Reardon","color":"Gold","roles":"researcher"},
          {"name":"Gala","color":"Blue","roles":"researcher"},
          {"name":"Hirokazu Kato","color":"Green","roles":"researcher"},
          {"name":"Akiteru Kawai","color":"Green","roles":"researcher"},
          {"name":"Tenshin Juba","color":"Green","roles":"researcher"},
          {"name":"Daniel Calderon Arenas","color":"Blue","roles":"researcher"},
          {"name":"Ariko","color":"Green","roles":"researcher"},
          {"name":"Genbei","color":"Green","roles":"researcher"},
          {"name":"Nanao","color":"Blue","roles":"researcher"},
          {"name":"Nagano,  Ishikawa","color":"Green","roles":"researcher"},
          {"name":"Shogo","color":"Green","roles":"researcher"},
          {"name":"Nina Fradet","color":"Blue","roles":"researcher"},
          {"name":"Kondo","color":"Blue","roles":"researcher"},
          {"name":"Yui Kondo","color":"Gold","roles":"researcher"},
          {"name":"Nanjo","color":"Green","roles":"researcher"},
          {"name":"Aluan Wang","color":"Blue","roles":"researcher"},
          {"name":"Masako","color":"Green","roles":"researcher"},
          {"name":"Sachihito Kudo","color":"Green","roles":"researcher"},
          {"name":"Gunma","color":"Green","roles":"researcher"},
          {"name":"Sky Whitehead","color":"Gold","roles":"researcher"},
          {"name":"Yu Kamimura","color":"Purple","roles":"researcher"},
          {"name":"Shoe","color":"Purple","roles":"researcher"},
          {"name":"Marta Gasparin","color":"Gray","roles":"researcher"},
          {"name":"Paul Niiro","color":"Green","roles":"researcher"},
          {"name":"Takeshi Shigemizu","color":"Green","roles":"researcher"},
          {"name":"Terui Yamawaki","color":"Green","roles":"researcher"},
          {"name":"Kimoto Yuriko","color":"Green","roles":"researcher"},
          {"name":"Ryoma Noda","color":"Green","roles":"researcher"},
          {"name":"Natsuko Toda","color":"Green","roles":"researcher"},
          {"name":"Morino Keito","color":"Green","roles":"researcher"},
          {"name":"Yandonghong Anna","color":"Green","roles":"researcher"},
          {"name":"Ota Kai","color":"Green","roles":"researcher"},
          {"name":"Banjo","color":"Purple","roles":"researcher"},
          {"name":"Matsumoto","color":"Blue","roles":"researcher"},
          {"name":"Shiho Fukuhara","color":"Blue","roles":"researcher"},
          {"name":"Umi Chae","color":"Green","craft":"kinkou","background":"Human Awesome Error","roles":"researcher"},
          {"name":"Takaaki Murase","color":"Blue","roles":"researcher"},
          {"name":"Masaya Kushino","color":"Blue","roles":"researcher"},
          {"name":"Kodama","color":"Purple"},
          {"name":"Hatta Shun","color":"Green","craft":"kumihimo","background":"Showen","roles":"researcher"},
          {"name":"Shizuku Tatsuaki","color":"Green","craft":"kinkou","background":"Umi's Apprentice","roles":"researcher"},
          {"name":"Fukutaro Nakayama","color":"Green","roles":"researcher"},
          {"name":"Yuna Yagi","color":"Blue","roles":"researcher"},
          {"name":"Sander Wassick","color":"Blue","roles":"researcher"},
          {"name":"Rintaro Akazawa","color":"Green","roles":"researcher"},
          {"name":"Mitasho-san","color":"Green","roles":"researcher"},
          {"name":"Kiyoko","color":"gold","craft":"manager","background":"The Terminal","roles":"researcher"},
          {"name":"Danielle Demetriou","color":"Gray","craft":"writer","background":"British","roles":"researcher"},
          {"name":"Vittoria Magrelli","color":"Gray","craft":"researcher","background":"University of Bozen-Bolzano","roles":"researcher"},
          {"name":"Daniel Hjorth","color":"Gray","craft":"researcher","background":"Copenhagen Business School","roles":"researcher"},
          {"name":"Damian Doherty","color":"Gray","craft":"researcher","background":"University of Liverpool","roles":"researcher"},
          {"name":"Yamauchi Yutaka","color":"Gray","craft":"professor","background":"Kyoto University","roles":"researcher"},
          {"name":"Soshin Kimura","color":"Green","craft":"tea master","background":"Hoshinkai","roles":"researcher"},
          {"name":"Adam Clauge","color":"Gray","craft":"researcher","background":"University of Oxford","roles":"researcher"},
          {"name":"Hee-Chan Sang","color":"Gray","craft":"researcher","background":"Sasin School of Management","roles":"researcher"},
          {"name":"Fabrizio Panozzo","color":"Gray","craft":"researcher","background":"Sasin School of Management","roles":"researcher"},
          {"name":"Kenichi Hashimoto","color":"Green","craft":"chef","background":"Ryozanpaku","roles":"researcher"},
          {"name":"Jingjing Weng","color":"Gray","craft":"researcher","background":"National Taiwan University of Science and Technology","roles":"researcher"},
          {"name":"Michelle Yang","color":"Black","craft":"marketing professor","background":"Kyoto University","roles":"researcher"},
          {"name":"Grace Yi","color":"Gray","craft":"researcher","background":"National Tsing Hua University","roles":"researcher"},
          {"name":"Chichie Huang","color":"Green","craft":"paper","background":"GoangXing Paper Mill","roles":"researcher"},
          {"name":"Shirah Hoy","color":"Gray","craft":"researcher","background":"Kyoto University Research Residency","roles":"researcher"},
          {"name":"Masaru Karube","color":"Gray","craft":"researcher","background":"Hitotsubashi University","roles":"researcher"},
          {"name":"Matthias Kipping","color":"Gray","craft":"researcher","background":"York University","roles":"researcher"},
          {"name":"Kazuo Doi","color":"Gray","craft":"researcher","background":"Kyushu Sangyo University","roles":"researcher"},
          {"name":"Eleanor Westney","color":"Gray","craft":"researcher","background":"MIT Sloan","roles":"researcher"},
          {"name":"Kiyohiko Ho","color":"Gray","craft":"researcher","background":"Shidler College of Business","roles":"researcher"},
          {"name":"Ito ","color":"Gray","craft":"researcher","background":"Kyoto University","note":"prev bartender","roles":"researcher"},
          {"name":"Yusuke Nananishi","color":"Purple","craft":"director","background":"Kyoto Graphie","note":"friendly approachable","roles":"researcher"},
          {"name":"Mama-san","color":"Purple","craft":"networker","background":"8000 generation","note":"small cozy space","roles":"researcher"},
          {"name":"Yuima Nakazato","color":"Purple","craft":"fashion designer","background":"Pottery","note":"Collanorated with Spiber, met through Shiho","roles":"director"},
          {"name":"Ako Myochin","color":"Green","craft":"samurai armour","background":"studied under the 25th head of the family, armor maker Myochin Muneyoshi, and Akira Kawanishi of the Takada family, who is in charge of preparing costumes for the Imperial Household Agency","note":"Next to HOSOO dyeing lab","roles":"craftsmen"},

          ],
        links:[
          {source:"Dan Wadwhani",target:"Eugene Choi"},
          {source:"Eugene Choi",target:"Masataka Hosoo"},
          {source:"Masataka Hosoo",target:"Taeko Hosoo"},
          {source:"Masataka Hosoo",target:"Kondo"},
          {source:"Masataka Hosoo",target:"Yui Kondo"},
          {source:"Masataka Hosoo",target:"Kondo"},
          {source:"Yui Kondo",target:"Nina Fradet"},
          {source:"Yui Kondo",target:"Nina Fradet"},
          {source:"Masataka Hosoo",target:"Yoshida"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Hosai Matsubayashi"},
          {source:"Masataka Hosoo",target:"Toryo Ito"},
          {source:"Masataka Hosoo",target:"Hidehiko Matsumoto"},
          {source:"Masataka Hosoo",target:"Kawakami"},
          {source:"Masataka Hosoo",target:"Ami"},
          {source:"Masataka Hosoo",target:"Mitsuru Yokoyama"},
          {source:"Masataka Hosoo",target:"Ako Myochin"},
          {source:"Mitsuru Yokoyama",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Ko Kado"},
          {source:"Masataka Hosoo",target:"Hide Suzuki"},
          {source:"Sky Whitehead",target:"Masataka Hosoo"},
          {source:"Masataka Hosoo",target:"Yu Kamimura"},
          {source:"Masataka Hosoo",target:"Yuna Yagi"},
          {source:"Ami",target:"Hosai Matsubayashi"},
          {source:"Ami",target:"Kawakami"},
          {source:"Shiho Fukuhara", target:"Banjo"},
          {source:"Banjo", target:"Masataka Hosoo"},
          {source:"Banjo",target:"Matsumoto"},
          {source:"Banjo",target:"Umi Chae"},
          {source:"Banjo",target:"Takaaki Murase"},
          {source:"Banjo",target:"Masaya Kushino"},
          {source:"Banjo",target:"Kodama"},
          {source:"Banjo",target:"Hatta Shun"},
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

          ]} }
    }
  
    handleChange = (event) => {
      this.setState({query:event.target.value})
    }
    loadData = async () => {
      this.disableButton();
      let session = await this.driver.session({database:"gameofthrones"});
      let res = await session.run(this.state.query);
      session.close();
      console.log(res);
      let nodes = new Set();
      let links = res.records.map(r => {
        let source = r.get("source");
        let target = r.get("target");
        nodes.add(source);
        nodes.add(target);
        return {source, target}});
      nodes = Array.from(nodes).map(name => {return {name}});
      this.setState({ data : {nodes, links}});
    }

    simData = async () => {
      let session = await this.driver.session({database:"gameofthrones"});
      let res = await session.run(this.state.query);
      session.close();
      console.log(res);
      let nodes = new Set();
      let links = res.records.map(r => {
        let source = r.get("source");
        let target = r.get("target");
        nodes.add(source);
        nodes.add(target);
        return {source, target}});
      nodes = Array.from(nodes).map(name => {return {name}});
      this.setState({ data : {nodes, links}});
    }

    displayButton() {
      const simButton = document.getElementById("simulate");
      const visButton = document.getElementById("visualize");
      simButton.disabled = true;
      visButton.disabled = false;
    }

    visualize3D() {
      window.open("https://awuchen.github.io/craft-network-3d/", "_blank");
    }
    
    render() {
      return (
        <div>
          <textarea style={{display:"block",width:"800px", height:"100px"}} 
                    value={this.state.query}
                    onChange={this.handleChange}/>
          <button id="simulate" onClick={this.loadData}>Simulate</button>
          <button id="visualize" onClick={this.visualize3D}>Visualize3D</button>
          <ForceGraph2D graphData={this.state.data} nodeId="name" /*nodeLabel=""*/
                    linkCurvature={0.2} linkDirectionalArrowRelPos={1} linkDirectionalArrowLength={10}/>
        </div>
      );  
    }
  }
  
  export default CypherViz