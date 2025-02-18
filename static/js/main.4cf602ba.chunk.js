(this["webpackJsonpgraph-viz"]=this["webpackJsonpgraph-viz"]||[]).push([[0],{138:function(e,t,a){},175:function(e,t,a){e.exports=a(233)},180:function(e,t,a){},233:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),o=a(107),c=a.n(o),i=(a(180),a(138),a(6)),s=a.n(i),u=a(15),l=a(41),d=a(62),f=a(66),h=a(63),v=a(170),m=a(5),p=a(171),E=function(e){Object(h.a)(a,e);var t=Object(f.a)(a);function a(e){var n,o=e.driver;return Object(l.a)(this,a),(n=t.call(this)).loadData=Object(u.a)(s.a.mark((function e(){var t,a,r,o,c,i,u,l=arguments;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=l.length>0&&void 0!==l[0]?l[0]:null,a=n.driver.session({database:"neo4j"}),e.next=4,a.run(n.state.query);case 4:r=e.sent,a.close(),o=new Map,c=r.records.map((function(e){var t=e.get("source"),a=e.get("target");return o.has(t)||o.set(t,{name:t,x:500*Math.random(),y:500*Math.random()}),o.has(a)||o.set(a,{name:a,x:500*Math.random(),y:500*Math.random()}),{source:t,target:a}})),i=Array.from(o.values()),u={nodes:i,links:c},localStorage.setItem("graphData",JSON.stringify(u)),n.setState({data:u,latestNode:t},(function(){if(t){var e=i.find((function(e){return e.name===t}));e&&n.fgRef.current&&setTimeout((function(){n.fgRef.current.centerAt(e.x,e.y,1e3)}),500)}}));case 12:case"end":return e.stop()}}),e)}))),n.addNodeNFC=function(){var e=Object(u.a)(s.a.mark((function e(t){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a=n.driver.session({database:"neo4j"}),e.prev=1,e.next=4,a.run("MERGE (u:User {name: $user}) MERGE (prev:User {name: $prevUser}) MERGE (u)-[:CONNECTED_TO]->(prev)",{user:t,prevUser:"NFC Connect"});case 4:return e.next=6,n.loadData(t);case 6:e.next=11;break;case 8:e.prev=8,e.t0=e.catch(1),console.error("Error adding user:",e.t0);case 11:a.close();case 12:case"end":return e.stop()}}),e,null,[[1,8]])})));return function(t){return e.apply(this,arguments)}}(),n.handleChange=function(e){n.setState({query:e.target.value})},n.driver=o,n.fgRef=r.a.createRef(),n.defaultData={nodes:[],links:[]},n.state={data:n.defaultData,query:"MATCH (u:User)-[r:CONNECTED_TO]->(v:User) RETURN u.name AS source, v.name AS target",latestNode:null},n}return Object(d.a)(a,[{key:"componentDidMount",value:function(){this.loadData()}},{key:"render",value:function(){return r.a.createElement(v.a,null,r.a.createElement("div",null,r.a.createElement(m.c,null,r.a.createElement(m.a,{path:"/NFC",element:r.a.createElement(g,{addNode:this.addNodeNFC})}),r.a.createElement(m.a,{path:"/",element:r.a.createElement(O,{data:this.state.data,query:this.state.query,handleChange:this.handleChange,loadData:this.loadData,fgRef:this.fgRef,latestNode:this.state.latestNode})}))))}}]),a}(r.a.Component),g=function(e){var t=e.addNode,a=Object(m.n)();return r.a.useEffect((function(){(function(){var e=Object(u.a)(s.a.mark((function e(){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a="User-".concat(Date.now()),e.prev=1,e.next=4,t(a);case 4:e.next=10;break;case 6:return e.prev=6,e.t0=e.catch(1),console.error("Error adding user:",e.t0),e.abrupt("return");case 10:setTimeout((function(){window.location.assign("/craft-network/#/")}),1e3);case 11:case"end":return e.stop()}}),e,null,[[1,6]])})));return function(){return e.apply(this,arguments)}})()()}),[a]),r.a.createElement("div",{style:{textAlign:"center",padding:"20px",fontSize:"16px",color:"red"}},"Processing NFC tap...")},O=function(e){var t=e.data,a=e.query,n=e.handleChange,o=e.loadData,c=e.fgRef,i=e.latestNode;return r.a.createElement("div",{width:"95%"},r.a.createElement("textarea",{style:{display:"block",width:"95%",height:"100px",margin:"0 auto",textAlign:"center"},value:a,onChange:n}),r.a.createElement("button",{id:"simulate",onClick:function(){return o()}},"Simulate"),r.a.createElement("button",{id:"visualize",onClick:function(){return window.open("https://awuchen.github.io/craft-network-3d/","_blank")}},"Visualize3D"),r.a.createElement(p.a,{ref:c,graphData:t,nodeId:"name",nodeLabel:"name",nodeCanvasObject:function(e,t){t.fillStyle=e.name===i?"black":"white",t.strokeStyle="black",t.lineWidth=2,t.beginPath(),t.arc(e.x||500*Math.random(),e.y||500*Math.random(),6,0,2*Math.PI),t.fill(),t.stroke(),t.fillStyle="gray",t.fillText(e.name,e.x+10,e.y)},linkCurvature:.2,linkDirectionalArrowRelPos:1,linkDirectionalArrowLength:5}))},S=E;var C=function(e){var t=e.driver;return r.a.createElement("div",{className:"App"},r.a.createElement(S,{driver:t}))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var N=a(135),w=N.driver(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_URI||"neo4j+s://7714be1a.databases.neo4j.io",N.auth.basic(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_USER||"neo4j",Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_PASSWORD||"lwW-hWpruNTNNrD-gCAMreXMZcUlAFcrjxmaeL94ZzM"),{});c.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(C,{driver:w})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[175,1,2]]]);
//# sourceMappingURL=main.4cf602ba.chunk.js.map