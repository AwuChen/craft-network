(this["webpackJsonpgraph-viz"]=this["webpackJsonpgraph-viz"]||[]).push([[0],{140:function(e,t,n){},177:function(e,t,n){e.exports=n(235)},182:function(e,t,n){},235:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),o=n(108),l=n.n(o),i=(n(182),n(140),n(18)),c=n(134),u=n(14),s=n(6),d=n.n(s),m=n(15),E=n(42),f=n(63),h=n(67),p=n(64),v=n(172),g=n(5),b=n(173),w=function(e){Object(p.a)(n,e);var t=Object(h.a)(n);function n(e){var a,o=e.driver;return Object(E.a)(this,n),(a=t.call(this)).loadData=Object(m.a)(d.a.mark((function e(){var t,n,r,o,l,i,c,u=arguments;return d.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=u.length>0&&void 0!==u[0]?u[0]:null,n=a.driver.session({database:"neo4j"}),e.next=4,n.run(a.state.query);case 4:r=e.sent,n.close(),o=new Map,l=r.records.map((function(e){var t=e.get("source"),n=e.get("target");return o.has(t)||o.set(t,{name:t,role:e.get("sourceRole"),title:e.get("sourceTitle"),website:e.get("sourceWebsite"),x:500*Math.random(),y:500*Math.random()}),o.has(n)||o.set(n,{name:n,role:e.get("targetRole"),title:e.get("targetTitle"),website:e.get("targetWebsite"),x:500*Math.random(),y:500*Math.random()}),{source:t,target:n}})),i=Array.from(o.values()),c={nodes:i,links:l},localStorage.setItem("graphData",JSON.stringify(c)),a.setState({data:c,latestNode:t},(function(){t&&setTimeout((function(){var e=i.find((function(e){return e.name===t}));e&&a.fgRef.current&&(console.log("Focusing on:",e),a.fgRef.current.centerAt(e.x,e.y,1500),a.fgRef.current.zoom(1.25))}),2e3)}));case 12:case"end":return e.stop()}}),e)}))),a.addNodeNFC=function(){var e=Object(m.a)(d.a.mark((function e(t){var n;return d.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=a.driver.session({database:"neo4j"}),e.prev=1,e.next=4,n.run("MERGE (u:User {name: $user}) \n         ON CREATE SET u.role = 'new user', \n                       u.title = '', \n                       u.website = ''\n\n         MERGE (nfc:User {name: $nfcUser}) \n         ON CREATE SET nfc.role = 'NFC', \n                       nfc.title = 'DEMO', \n                       nfc.website = 'https://www.hako.soooul.xyz/drafts/washi'\n\n         MERGE (awu:User {name: $awuUser}) \n\n         MERGE (u)-[:CONNECTED_TO]->(nfc) \n        MERGE (nfc)-[:CONNECTED_TO]->(awu)",{user:t,nfcUser:"NFC Connection",awuUser:"Awu Chen"});case 4:return e.next=6,a.loadData(t);case 6:e.next=11;break;case 8:e.prev=8,e.t0=e.catch(1),console.error("Error adding user:",e.t0);case 11:return e.prev=11,n.close(),e.finish(11);case 14:case"end":return e.stop()}}),e,null,[[1,8,11,14]])})));return function(t){return e.apply(this,arguments)}}(),a.handleChange=function(e){a.setState({query:e.target.value})},a.driver=o,a.fgRef=r.a.createRef(),a.defaultData={nodes:[],links:[]},a.state={data:a.defaultData,query:"MATCH (u:User)-[r:CONNECTED_TO]->(v:User) \n          RETURN u.name AS source, u.role AS sourceRole, u.title AS sourceTitle, u.website AS sourceWebsite, \n      v.name AS target, v.role AS targetRole, v.title AS targetTitle, v.website AS targetWebsite",latestNode:null},a}return Object(f.a)(n,[{key:"componentDidMount",value:function(){this.loadData()}},{key:"render",value:function(){return r.a.createElement(v.a,null,r.a.createElement("div",null,r.a.createElement(g.c,null,r.a.createElement(g.a,{path:"/NFC",element:r.a.createElement(C,{addNode:this.addNodeNFC})}),r.a.createElement(g.a,{path:"/",element:r.a.createElement(O,{data:this.state.data,handleChange:this.handleChange,loadData:this.loadData,fgRef:this.fgRef,latestNode:this.state.latestNode,driver:this.driver})}))))}}]),n}(r.a.Component),C=function(e){var t=e.addNode,n=Object(g.n)();return r.a.useEffect((function(){(function(){var e=Object(m.a)(d.a.mark((function e(){var n;return d.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n="User-".concat(Date.now()),e.prev=1,e.next=4,t(n);case 4:e.next=10;break;case 6:return e.prev=6,e.t0=e.catch(1),console.error("Error adding user:",e.t0),e.abrupt("return");case 10:setTimeout((function(){window.location.assign("/craft-network/#/")}),1e3);case 11:case"end":return e.stop()}}),e,null,[[1,6]])})));return function(){return e.apply(this,arguments)}})()()}),[n]),r.a.createElement("div",{style:{textAlign:"center",padding:"20px",fontSize:"16px",color:"red"}},"Processing NFC tap...")},O=function(e){var t=e.data,n=e.handleChange,o=e.loadData,l=e.fgRef,s=e.latestNode,E=e.driver,f=Object(a.useState)(""),h=Object(u.a)(f,2),p=h[0],v=h[1],g=Object(a.useState)(null),w=Object(u.a)(g,2),C=w[0],O=w[1],S=Object(a.useState)(null),N=Object(u.a)(S,2),T=N[0],k=N[1],R=function(e){var t=e.target,n=t.name,a=t.value;k((function(e){return Object(c.a)({},e,Object(i.a)({},n,a))}))},x=function(){var e=Object(m.a)(d.a.mark((function e(){var t,n;return d.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(T&&C){e.next=2;break}return e.abrupt("return");case 2:return!(t=T.website.trim())||t.startsWith("http://")||t.startsWith("https://")||(t="https://"+t),n=E.session(),e.prev=5,e.next=8,n.run("MATCH (u:User {name: $oldName}) \n      SET u.name = $newName, u.role = $role, u.title = $title, u.website = $website",{oldName:C.name,newName:T.name,role:T.role,title:T.title,website:t});case 8:return e.next=10,o(T.name);case 10:e.next=15;break;case 12:e.prev=12,e.t0=e.catch(5),console.error("Error updating node:",e.t0);case 15:return e.prev=15,n.close(),e.finish(15);case 18:case"end":return e.stop()}}),e,null,[[5,12,15,18]])})));return function(){return e.apply(this,arguments)}}();return r.a.createElement("div",{width:"95%"},r.a.createElement("textarea",{placeholder:"Enter query, node name, or title...",style:{display:"block",width:"95%",height:"60px",margin:"0 auto",textAlign:"center"},value:p,onChange:function(e){var a=e.target.value;if(v(a),n(e),!/\b(MATCH|RETURN|WHERE|SET|CREATE|MERGE|DELETE)\b/i.test(a)&&l.current){var r=t.nodes.filter((function(e){return e.name.toLowerCase().includes(a.toLowerCase())||e.title&&e.title.toLowerCase().includes(a.toLowerCase())}));if(r.length>0){var o=r[0];l.current.centerAt(o.x,o.y+100,1500),l.current.zoom(2.5)}}}}),r.a.createElement("button",{id:"simulate",onClick:function(){return o()}},"Run"),r.a.createElement("button",{id:"visualize",onClick:function(){return window.open("https://awuchen.github.io/craft-network-3d/","_blank")}},"Visualize3D"),r.a.createElement("button",{id:"info",onClick:function(){return window.open("https://www.hako.soooul.xyz/drafts/washi","_blank")}},"Info"),r.a.createElement(b.a,{ref:l,graphData:t,nodeId:"name",nodeLabel:function(e){return e.title||"No Title"},onNodeClick:function(e){e&&(O(e),k(Object(c.a)({},e)))},nodeCanvasObject:function(e,t){var n=p&&(e.name.toLowerCase().includes(p.toLowerCase())||e.title&&e.title.toLowerCase().includes(p.toLowerCase()));t.fillStyle=e.name===s?"black":"white",t.strokeStyle=n?"red":"black",t.lineWidth=n?3:2,t.beginPath(),t.arc(e.x||500*Math.random(),e.y||500*Math.random(),6,0,2*Math.PI),t.fill(),t.stroke(),t.fillStyle="gray",t.fillText(e.role,e.x+10,e.y)},linkCurvature:.2,linkDirectionalArrowRelPos:1,linkDirectionalArrowLength:5}),C&&T&&r.a.createElement("div",{style:{position:"absolute",top:"20%",left:"50%",transform:"translate(-50%, -50%)",padding:"20px",backgroundColor:"white",border:"1px solid black",boxShadow:"0px 0px 10px rgba(0, 0, 0, 0.3)",zIndex:1e3}},C.name===s?r.a.createElement(r.a.Fragment,null,r.a.createElement("h3",null,"Edit Network Info"),r.a.createElement("p",null,r.a.createElement("strong",null,"Name:"),r.a.createElement("input",{name:"name",value:T.name,placeholder:"Enter name",onChange:R,onFocus:function(e){return e.target.placeholder=""},onBlur:function(e){return e.target.placeholder="Enter name"}})),r.a.createElement("p",null,r.a.createElement("strong",null,"Title:"),r.a.createElement("input",{name:"title",value:T.title,placeholder:"Enter title",onChange:R,onFocus:function(e){return e.target.placeholder=""},onBlur:function(e){return e.target.placeholder="Enter title"}})),r.a.createElement("p",null,r.a.createElement("strong",null,"Role:"),r.a.createElement("input",{name:"role",value:T.role,placeholder:"Enter role",onChange:R,onFocus:function(e){return e.target.placeholder=""},onBlur:function(e){return e.target.placeholder="Enter role"}})),r.a.createElement("p",null,r.a.createElement("strong",null,"Website:"),r.a.createElement("input",{name:"website",value:T.website,placeholder:"Enter website",onChange:R,onFocus:function(e){return e.target.placeholder=""},onBlur:function(e){return e.target.placeholder="Enter website"}})),r.a.createElement("p",null,r.a.createElement("button",{onClick:x},"Save"))):r.a.createElement(r.a.Fragment,null,r.a.createElement("h3",null,"Network Info"),r.a.createElement("p",null,r.a.createElement("strong",null,"Name:")," ",null===C||void 0===C?void 0:C.name),r.a.createElement("p",null,r.a.createElement("strong",null,"Title:")," ",null===C||void 0===C?void 0:C.title),r.a.createElement("p",null,r.a.createElement("strong",null,"Role:")," ",null===C||void 0===C?void 0:C.role),r.a.createElement("p",null,r.a.createElement("strong",null,"Website:")," ",C.website&&""!==C.website?r.a.createElement("a",{href:C.website,target:"_blank",rel:"noopener noreferrer"},C.website.length>30?"".concat(C.website.substring(0,30),"..."):C.website):"")),r.a.createElement("button",{onClick:function(){return O(null)}},"Close")))},S=w;var N=function(e){var t=e.driver;return r.a.createElement("div",{className:"App"},r.a.createElement(S,{driver:t}))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var T=n(137),k=T.driver(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_URI||"neo4j+s://7714be1a.databases.neo4j.io",T.auth.basic(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_USER||"neo4j",Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_PASSWORD||"lwW-hWpruNTNNrD-gCAMreXMZcUlAFcrjxmaeL94ZzM"),{});l.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(N,{driver:k})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[177,1,2]]]);
//# sourceMappingURL=main.c9373d73.chunk.js.map