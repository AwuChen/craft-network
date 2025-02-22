(this["webpackJsonpgraph-viz"]=this["webpackJsonpgraph-viz"]||[]).push([[0],{138:function(e,t,a){},175:function(e,t,a){e.exports=a(233)},180:function(e,t,a){},233:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),o=a(107),l=a.n(o),i=(a(180),a(138),a(14)),c=a(6),s=a.n(c),u=a(15),d=a(41),f=a(62),h=a(66),p=a(63),m=a(170),v=a(5),g=a(171),E=function(e){Object(p.a)(a,e);var t=Object(h.a)(a);function a(e){var n,o=e.driver;return Object(d.a)(this,a),(n=t.call(this)).loadData=Object(u.a)(s.a.mark((function e(){var t,a,r,o,l,i,c,u=arguments;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=u.length>0&&void 0!==u[0]?u[0]:null,a=n.driver.session({database:"neo4j"}),e.next=4,a.run(n.state.query);case 4:r=e.sent,a.close(),o=new Map,l=r.records.map((function(e){var t=e.get("source"),a=e.get("target");return o.has(t)||o.set(t,{name:t,role:e.get("sourceRole")||"N/A",title:e.get("sourceTitle")||"N/A",website:e.get("sourceWebsite")||"N/A",x:500*Math.random(),y:500*Math.random()}),o.has(a)||o.set(a,{name:a,role:e.get("targetRole")||"N/A",title:e.get("targetTitle")||"N/A",website:e.get("targetWebsite")||"N/A",x:500*Math.random(),y:500*Math.random()}),{source:t,target:a}})),i=Array.from(o.values()),c={nodes:i,links:l},localStorage.setItem("graphData",JSON.stringify(c)),n.setState({data:c,latestNode:t},(function(){t&&setTimeout((function(){var e=i.find((function(e){return e.name===t}));e&&n.fgRef.current&&(console.log("Focusing on:",e),n.fgRef.current.centerAt(e.x,e.y,1500),n.fgRef.current.zoom(1.25))}),2e3)}));case 12:case"end":return e.stop()}}),e)}))),n.addNodeNFC=function(){var e=Object(u.a)(s.a.mark((function e(t){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a=n.driver.session({database:"neo4j"}),e.prev=1,e.next=4,a.run("MERGE (u:User {name: $user}) \n             ON CREATE SET u.role = 'new user', \n                           u.title = 'TBD', \n                           u.website = 'https://hako.soooul.xyz/apply/'\n             MERGE (prev:User {name: $prevUser}) \n                ON CREATE SET prev.role = 'NFC', \n                           prev.title = 'DEMO', \n                           prev.website = 'https://www.hako.soooul.xyz/drafts/washi'\n        MERGE (u)-[:CONNECTED_TO]->(prev)",{user:t,prevUser:"WASHI Connection"});case 4:return e.next=6,n.loadData(t);case 6:e.next=11;break;case 8:e.prev=8,e.t0=e.catch(1),console.error("Error adding user:",e.t0);case 11:return e.prev=11,a.close(),e.finish(11);case 14:case"end":return e.stop()}}),e,null,[[1,8,11,14]])})));return function(t){return e.apply(this,arguments)}}(),n.handleChange=function(e){n.setState({query:e.target.value})},n.driver=o,n.fgRef=r.a.createRef(),n.defaultData={nodes:[],links:[]},n.state={data:n.defaultData,query:"MATCH (u:User)-[r:CONNECTED_TO]->(v:User) \n          RETURN u.name AS source, u.role AS sourceRole, u.title AS sourceTitle, u.website AS sourceWebsite, \n      v.name AS target, v.role AS targetRole, v.title AS targetTitle, v.website AS targetWebsite",latestNode:null},n}return Object(f.a)(a,[{key:"componentDidMount",value:function(){this.loadData()}},{key:"render",value:function(){return r.a.createElement(m.a,null,r.a.createElement("div",null,r.a.createElement(v.c,null,r.a.createElement(v.a,{path:"/NFC",element:r.a.createElement(b,{addNode:this.addNodeNFC})}),r.a.createElement(v.a,{path:"/",element:r.a.createElement(w,{data:this.state.data,query:this.state.query,handleChange:this.handleChange,loadData:this.loadData,fgRef:this.fgRef,latestNode:this.state.latestNode})}))))}}]),a}(r.a.Component),b=function(e){var t=e.addNode,a=Object(v.n)();return r.a.useEffect((function(){(function(){var e=Object(u.a)(s.a.mark((function e(){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a="User-".concat(Date.now()),e.prev=1,e.next=4,t(a);case 4:e.next=10;break;case 6:return e.prev=6,e.t0=e.catch(1),console.error("Error adding user:",e.t0),e.abrupt("return");case 10:setTimeout((function(){window.location.assign("/craft-network/#/")}),1e3);case 11:case"end":return e.stop()}}),e,null,[[1,6]])})));return function(){return e.apply(this,arguments)}})()()}),[a]),r.a.createElement("div",{style:{textAlign:"center",padding:"20px",fontSize:"16px",color:"red"}},"Processing NFC tap...")},w=function(e){var t=e.data,a=e.query,o=e.handleChange,l=e.loadData,c=e.fgRef,s=e.latestNode,u=Object(n.useState)(null),d=Object(i.a)(u,2),f=d[0],h=d[1],p=Object(n.useState)(""),m=Object(i.a)(p,2),v=m[0],E=m[1],b=t.nodes.filter((function(e){return e.name.toLowerCase().includes(v.toLowerCase())}));return r.a.createElement("div",{width:"95%"},r.a.createElement("input",{type:"text",placeholder:"Search for a node...",value:v,onChange:function(e){E(e.target.value)},style:{display:"block",width:"95%",margin:"20px auto",padding:"10px"}}),r.a.createElement("textarea",{style:{display:"block",width:"95%",height:"60px",margin:"0 auto",textAlign:"center"},value:a,onChange:o}),r.a.createElement("button",{id:"simulate",onClick:function(){return l()}},"Simulate"),r.a.createElement("button",{id:"visualize",onClick:function(){return window.open("https://awuchen.github.io/craft-network-3d/","_blank")}},"Visualize3D"),r.a.createElement("button",{id:"info",onClick:function(){return window.open("https://www.hako.soooul.xyz/drafts/washi","_blank")}},"Info"),r.a.createElement(g.a,{ref:c,graphData:{nodes:b,links:t.links},nodeId:"name",nodeLabel:function(e){return e.title||"No Title"},onNodeClick:function(e){h(e)},nodeCanvasObject:function(e,t){t.fillStyle=e.name===s?"black":"white",t.strokeStyle=e.name.toLowerCase().includes(v.toLowerCase())?"red":"black",t.lineWidth=2,t.beginPath(),t.arc(e.x||500*Math.random(),e.y||500*Math.random(),6,0,2*Math.PI),t.fill(),t.stroke(),t.fillStyle="gray",t.fillText(e.role,e.x+10,e.y)},linkCurvature:.2,linkDirectionalArrowRelPos:1,linkDirectionalArrowLength:5}),f&&r.a.createElement("div",{style:{position:"absolute",top:"20%",left:"50%",transform:"translate(-50%, -50%)",padding:"20px",backgroundColor:"white",border:"1px solid black",boxShadow:"0px 0px 10px rgba(0, 0, 0, 0.3)",zIndex:1e3}},r.a.createElement("h3",null,"Network Info"),r.a.createElement("p",null,r.a.createElement("strong",null,"Name:")," ",f.name),r.a.createElement("p",null,r.a.createElement("strong",null,"Role:")," ",f.role||"N/A"),r.a.createElement("p",null,r.a.createElement("strong",null,"Title:")," ",f.title||"N/A"),r.a.createElement("p",null,r.a.createElement("strong",null,"Website:")," ",f.website&&"N/A"!==f.website?r.a.createElement("a",{href:f.website,target:"_blank",rel:"noopener noreferrer"},f.website.length>30?"".concat(f.website.substring(0,30),"..."):f.website):"N/A"),r.a.createElement("button",{onClick:function(){return h(null)}},"Close")))},N=E;var S=function(e){var t=e.driver;return r.a.createElement("div",{className:"App"},r.a.createElement(N,{driver:t}))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var C=a(135),O=C.driver(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_URI||"neo4j+s://7714be1a.databases.neo4j.io",C.auth.basic(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_USER||"neo4j",Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_PASSWORD||"lwW-hWpruNTNNrD-gCAMreXMZcUlAFcrjxmaeL94ZzM"),{});l.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(S,{driver:O})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[175,1,2]]]);
//# sourceMappingURL=main.76969310.chunk.js.map