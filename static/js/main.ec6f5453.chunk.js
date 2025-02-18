(this["webpackJsonpgraph-viz"]=this["webpackJsonpgraph-viz"]||[]).push([[0],{138:function(e,t,a){},175:function(e,t,a){e.exports=a(233)},180:function(e,t,a){},233:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),o=a(107),i=a.n(o),c=(a(180),a(138),a(6)),s=a.n(c),u=a(15),d=a(41),l=a(62),v=a(66),p=a(63),m=a(170),h=a(5),f=a(171),E=function(e){Object(p.a)(a,e);var t=Object(v.a)(a);function a(e){var n,o=e.driver;return Object(d.a)(this,a),(n=t.call(this)).loadData=Object(u.a)(s.a.mark((function e(){var t,a,r,o,i;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=n.driver.session({database:"neo4j"}),e.next=3,t.run(n.state.query);case 3:a=e.sent,t.close(),r=new Set,o=a.records.map((function(e){var t=e.get("source"),a=e.get("target");return r.add(t),r.add(a),{source:t,target:a}})),r=Array.from(r).map((function(e){return{name:e,x:500*Math.random(),y:500*Math.random()}})),i={nodes:r,links:o},localStorage.setItem("graphData",JSON.stringify(i)),n.setState({data:i});case 11:case"end":return e.stop()}}),e)}))),n.addNodeNFC=function(){var e=Object(u.a)(s.a.mark((function e(t){var a,r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return r=n.driver.session({database:"neo4j"}),e.next=3,r.run("MERGE (u:User {name: $user}) MERGE (prev:User {name: $prevUser}) MERGE (u)-[:CONNECTED_TO]->(prev)",{user:t,prevUser:(null===(a=n.state.data.nodes[n.state.data.nodes.length-1])||void 0===a?void 0:a.name)||"Root"});case 3:r.close(),n.loadData();case 5:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),n.renderGraph=function(){return r.a.createElement("div",{width:"95%"},r.a.createElement("textarea",{style:{display:"block",width:"95%",height:"100px",margin:"0 auto",textAlign:"center"},value:n.state.query,onChange:function(e){return n.setState({query:e.target.value})}}),r.a.createElement("button",{id:"simulate",onClick:n.loadData},"Simulate"),r.a.createElement("button",{id:"visualize",onClick:function(){return window.open("https://awuchen.github.io/craft-network-3d/","_blank")}},"Visualize3D"),r.a.createElement(f.a,{graphData:n.state.data,nodeId:"name",nodeLabel:"name",nodeCanvasObject:function(e,t){t.fillStyle="blue",t.beginPath(),t.arc(e.x||500*Math.random(),e.y||500*Math.random(),6,0,2*Math.PI),t.fill(),t.fillStyle="black",t.fillText(e.name,e.x+10,e.y)},linkDirectionalArrowRelPos:1,linkDirectionalArrowLength:5,onNodeClick:function(e){return e.website&&window.open(e.website,"New Window","width=500px,height=500px")}}))},n.driver=o,n.defaultData={nodes:[],links:[]},n.state={query:"\n      MATCH (u:User)-[r:CONNECTED_TO]->(v:User) RETURN u.name AS source, v.name AS target\n      "},n}return Object(l.a)(a,[{key:"componentDidMount",value:function(){this.loadData()}},{key:"render",value:function(){return r.a.createElement(m.a,null,r.a.createElement(h.c,null,r.a.createElement(h.a,{path:"/NFC",element:r.a.createElement(O,{addNode:this.addNodeNFC})}),r.a.createElement(h.a,{path:"/",element:this.renderGraph()})))}}]),a}(r.a.Component),O=function(e){var t=e.addNode,a=(e.setDebugMessage,Object(h.n)());return r.a.useEffect((function(){(function(){var e=Object(u.a)(s.a.mark((function e(){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a="User-".concat(Date.now()),e.prev=1,e.next=4,t(a);case 4:e.next=10;break;case 6:return e.prev=6,e.t0=e.catch(1),console.error("Error adding user:",e.t0),e.abrupt("return");case 10:setTimeout((function(){window.location.assign("/")}),1e3);case 11:case"end":return e.stop()}}),e,null,[[1,6]])})));return function(){return e.apply(this,arguments)}})()()}),[a]),r.a.createElement("div",{style:{textAlign:"center",padding:"20px",fontSize:"16px",color:"red"}},"Processing NFC tap...")},w=E;var S=function(e){var t=e.driver;return r.a.createElement("div",{className:"App"},r.a.createElement(w,{driver:t}))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var g=a(135),b=g.driver(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_URI||"neo4j+s://7714be1a.databases.neo4j.io",g.auth.basic(Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_USER||"neo4j",Object({NODE_ENV:"production",PUBLIC_URL:"/craft-network",WDS_SOCKET_HOST:void 0,WDS_SOCKET_PATH:void 0,WDS_SOCKET_PORT:void 0}).NEO4J_PASSWORD||"lwW-hWpruNTNNrD-gCAMreXMZcUlAFcrjxmaeL94ZzM"),{});i.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(S,{driver:b})),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[175,1,2]]]);
//# sourceMappingURL=main.ec6f5453.chunk.js.map