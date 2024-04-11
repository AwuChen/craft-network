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
          {"name":"Dan Wadwhani","color":"Gray"},
          {"name":"Eugene Choi","color":"Gray"},
          {"name":"Masataka Hosoo","color":"Purple"},
          {"name":"Shuji Nakagawa","color":"Green"},
          {"name":"Hosai Matsubayashi","color":"Green"},
          {"name":"Toru Tsuji","color":"Green"},
          {"name":"Takahiro Yagi","color":"Green"},
          {"name":"Tatsuyuki Kosuga","color":"Green"},
          {"name":"Taeko Hosoo","color":"Purple"},
          {"name":"John","color":"Silver"},
          {"name":"Ami","color":"Purple"},
          {"name":"Mae Englegeer","color":"Blue","craft":"textile","background":"Studio Mae Englegeer"},
          {"name":"Hidehiko Matsumoto","color":"Green"},
          {"name":"Yoshida","color":"Green"},
          {"name":"Kawakami","color":"Green"},
          {"name":"Toryo Ito","color":"Green"},
          {"name":"Mitsuru Yokoyama","color":"Green","craft":"tatami","background":"Yokoyama Tatami"},
          {"name":"Garrett Uno","color":"Customer"},
          {"name":"Ko Kado","color":"Green"},
          {"name":"Hide Suzuki","color":"Purple"},
          {"name":"Sudo","color":"Green"},
          {"name":"Ethan Yu","color":"Customer"},
          {"name":"Takahashi","color":"Purple"},
          {"name":"Yusai Okuda","color":"Green"},
          {"name":"Annick Luo","color":"Purple"},
          {"name":"Derech","color":"Blue"},
          {"name":"Tien-san","color":"Green"},
          {"name":"Eddie","color":"Customer"},
          {"name":"Yuki Kataoka","color":"Green"},
          {"name":"Michael Kozlowski","color":"Blue"},
          {"name":"Koichi Saito","color":"Purple"},
          {"name":"Osawa Kiyomi","color":"Green"},
          {"name":"Daido-san","color":"Green"},
          {"name":"Yui Tanaka","color":"Blue"},
          {"name":"Alex Kimi","color":"Gold"},
          {"name":"Vicki Dobbs Beck","color":"Gold"},
          {"name":"Carole Sabas","color":"Purple"},
          {"name":"Matthew Drinkwater","color":"Gold"},
          {"name":"Robin Caudwell","color":"Gold"},
          {"name":"Kate Reardon","color":"Gold"},
          {"name":"Gala","color":"Blue"},
          {"name":"Hirokazu Kato","color":"Green"},
          {"name":"Akiteru Kawai","color":"Green"},
          {"name":"Tenshin Juba","color":"Green"},
          {"name":"Daniel Calderon Arenas","color":"Blue"},
          {"name":"Ariko","color":"Green"},
          {"name":"Genbei","color":"Green"},
          {"name":"Nanao","color":"Blue"},
          {"name":"Nagano,  Ishikawa","color":"Green"},
          {"name":"Shogo","color":"Green"},
          {"name":"Nina Fradet","color":"Blue"},
          {"name":"Nanjo","color":"Green"},
          {"name":"Aluan Wang","color":"Blue"},
          {"name":"Masako","color":"Green"},
          {"name":"Sachihito Kudo","color":"Green"},
          {"name":"Gunma","color":"Green"},
          {"name":"Sky Whitehead","color":"Gold"},
          {"name":"Yu Kamimura","color":"Purple"},
          {"name":"Shoe","color":"Purple"},
          {"name":"Marta Gasparin","color":"Gray"},
          {"name":"Paul Niiro","color":"Green"},
          {"name":"Takeshi Shigemizu","color":"Green"},
          {"name":"Terui Yamawaki","color":"Green"},
          {"name":"Kimoto Yuriko","color":"Green"},
          {"name":"Ryoma Noda","color":"Green"},
          {"name":"Natsuko Toda","color":"Green"},
          {"name":"Morino Keito","color":"Green"},
          {"name":"Yandonghong Anna","color":"Green"},
          {"name":"Ota Kai","color":"Green"},
          {"name":"Banjo","color":"Purple"},
          {"name":"Matsumoto","color":"Blue"},
          {"name":"Shiho Fukuhara","color":"Blue"},
          {"name":"Umi Chae","color":"Green","craft":"kinkou","background":"Human Awesome Error"},
          {"name":"Takaaki Murase","color":"Blue"},
          {"name":"Masaya Kushino","color":"Blue"},
          {"name":"Kodama","color":"Purple"},
          {"name":"Hatta Shun","color":"Green","craft":"kumihimo","background":"Showen"},
          {"name":"Shizuku Tatsuaki","color":"Green","craft":"kinkou","background":"Umi's Apprentice"},
          {"name":"Fukutaro Nakayama","color":"Green"},
          {"name":"Yuna Yagi","color":"Blue"},
          {"name":"Sander Wassick","color":"Blue"},
          {"name":"Rintaro Akazawa","color":"Green"},
          {"name":"Mitasho-san","color":"Green"},
          {"name":"Danielle Demetriou","color":"Gray","craft":"writer","background":"British"},
          {"name":"Yamauchi Yutaka","color":"Gray","craft":"professor","background":"Kyoto University"},
          {"name":"Soshin Kimura","color":"Green","craft":"tea master","background":"Hoshinkai"},
          {"name":"Adam Clauge","color":"Gray","craft":"researcher","background":"University of Oxford"},
          {"name":"Hee-Chan Sang","color":"Gray","craft":"researcher","background":"Sasin School of Management"},
          ],
        links:[
          {source:"Dan Wadwhani",target:"Eugene Choi"},
          {source:"Eugene Choi",target:"Masataka Hosoo"},
          {source:"Masataka Hosoo",target:"Taeko Hosoo"},
          {source:"Masataka Hosoo",target:"Yoshida"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Hosai Matsubayashi"},
          {source:"Masataka Hosoo",target:"John"},
          {source:"Masataka Hosoo",target:"Toryo Ito"},
          {source:"Masataka Hosoo",target:"Hidehiko Matsumoto"},
          {source:"Masataka Hosoo",target:"Kawakami"},
          {source:"Masataka Hosoo",target:"Ami"},
          {source:"Masataka Hosoo",target:"Mitsuru Yokoyama"},
          {source:"Mitsuru Yokoyama",target:"Mae Englegeer"},
          {source:"Masataka Hosoo",target:"Ko Kado"},
          {source:"Masataka Hosoo",target:"Hide Suzuki"},
          {source:"Masataka Hosoo",target:"Sky Whitehead"},
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
          ]} }
    }
  
    handleChange = (event) => {
      this.setState({query:event.target.value})
    }
    loadData = async () => {
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

    
    render() {
      return (
        <div>
          <textarea style={{display:"block",width:"800px", height:"100px"}} 
                    value={this.state.query}
                    onChange={this.handleChange}/>
          <button onClick={this.loadData}>Reload</button>
          <ForceGraph2D graphData={this.state.data} nodeId="name" 
                    linkCurvature={0.2} linkDirectionalArrowRelPos={1} linkDirectionalArrowLength={10}/>
        </div>
      );  
    }
  }
  
  export default CypherViz