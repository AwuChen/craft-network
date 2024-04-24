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
          {"name":"Hidehiko Matsumoto","color":"Green","craft":"sake","background":"Nichi Nichi"},
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
          {"name":"Kondo","color":"Blue"},
          {"name":"Yui Kondo","color":"Gold"},
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
          {"name":"Kiyoko","color":"gold","craft":"manager","background":"The Terminal"},
          {"name":"Danielle Demetriou","color":"Gray","craft":"writer","background":"British"},
          {"name":"Vittoria Magrelli","color":"Gray","craft":"researcher","background":"University of Bozen-Bolzano"},
          {"name":"Daniel Hjorth","color":"Gray","craft":"researcher","background":"Copenhagen Business School"},
          {"name":"Damian Doherty","color":"Gray","craft":"researcher","background":"University of Liverpool"},
          {"name":"Yamauchi Yutaka","color":"Gray","craft":"professor","background":"Kyoto University"},
          {"name":"Soshin Kimura","color":"Green","craft":"tea master","background":"Hoshinkai"},
          {"name":"Adam Clauge","color":"Gray","craft":"researcher","background":"University of Oxford"},
          {"name":"Hee-Chan Sang","color":"Gray","craft":"researcher","background":"Sasin School of Management"},
          {"name":"Fabrizio Panozzo","color":"Gray","craft":"researcher","background":"Sasin School of Management"},
          {"name":"Kenichi Hashimoto","color":"Green","craft":"chef","background":"Ryozanpaku"},
          {"name":"Jingjing Weng","color":"Gray","craft":"researcher","background":"National Taiwan University of Science and Technology"},
          {"name":"Michelle Yang","color":"Black","craft":"marketing professor","background":"Kyoto University"},
          {"name":"Grace Yi","color":"Gray","craft":"researcher","background":"National Tsing Hua University"},
          {"name":"Chichie Huang","color":"Green","craft":"paper","background":"GoangXing Paper Mill"},
          {"name":"Shirah Hoy","color":"Gray","craft":"researcher","background":"Kyoto University Research Residency"},
          {"name":"Masaru Karube","color":"Gray","craft":"researcher","background":"Hitotsubashi University"},
          {"name":"Matthias Kipping","color":"Gray","craft":"researcher","background":"York University"},
          {"name":"Kazuo Doi","color":"Gray","craft":"researcher","background":"Kyushu Sangyo University"},
          {"name":"Eleanor Westney","color":"Gray","craft":"researcher","background":"MIT Sloan"},
          {"name":"Kiyohiko Ho","color":"Gray","craft":"researcher","background":"Shidler College of Business"},
          {"name":"Ito ","color":"Gray","craft":"researcher","background":"Kyoto University","note":"prev bartender"},
          {"name":"Yusuke Nananishi","color":"Purple","craft":"director","background":"Kyoto Graphie","note":"friendly approachable"},
          {"name":"Mama-san","color":"Purple","craft":"networker","background":"8000 generation","note":"small cozy space"},
          {"name":"Yuima Nakazato","color":"Purple","craft":"fashion designer","background":"Pottery","note":"Collanorated with Spiber, met through Shiho"},

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