/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(3);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {


const Moon = __webpack_require__(2)
window.Moon = Moon

const host = location.origin.replace(/^http/, 'ws')
const server = new WebSocket(host)
server = server

function randInt(a,b){return a+Math.floor(Math.random()*(++b-a))}

Moon.component("mark", {
	props: ["type", "width", "height"],
	template:
		`<div m-literal:class="['mark-container', type]" m-literal:style="dimStyle">
			<div></div>
			<div></div>
		</div>`,
	computed: {
		dimStyle: {
			get: function() {
				let w = h = "100%"
				if(this.get("width") !== undefined)
					w = this.get("width")
				if(this.get("height") !== undefined)
					h = this.get("height")
				return `width:${w};height:${h}`
			}
		}
	}
})

window.start = function() {

	const app = new Moon({
		el: "#app",
		data: {
			grid: [0,1,2,0,0,2,2,1,0],
			username: "",

			stateStack: ["main-menu"],
			state: {
				"main-menu": {},
				"connection": {},
				"playing": {
					online: false,
					opponentName: "",
					"ongoing": {
						"left": {},
						"right": {}
					},
					"complete": {
						"draw": {},
						"win": {
							"left": {},
							"right": {}
						}
					}
				}
			}
		},
		computed: {
			classNames: {
				get: function() {
					let stack = this.get("stateStack"),
						state = this.get("state")
					let o = {}
					for(let k of stack) {
						o[k] = true
					}
					o["grid-container"] = true
					return o
				}
			}
		},
		methods: {
			validateUsername: function() {
				let s = this.get("username")
				if(s.length == 0)
					this.set("username", "Anonymous")
				else if(s.length > 16)
					this.set("username", s.substr(0,16))
			},
			gridStatus: function() {
				let g = this.get("grid")
				let filled = true
				for(let v of g)
					if(v === 0)
						filled = false
				for(let indeces of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) {
					let r = indeces.map(i=>g[i]).reduce((a,b)=>a===b?a:0)
					if(r !== 0) return {
						complete: true,
						draw: false,
						winner: r,
						indeces
					}
				}
				if(filled) return { complete: true, draw: true }
				else return { complete: false }
			},
			is: function(name) {
				let xs = name.split("."),
					stack = this.get("stateStack")
				for(let i=0; i < xs.length; i++)
					if(xs[i] !== stack[i])
						return false
				return true
			},
			setState: function(name, ...args) {
				let stack = name.split(".")
				this.set("stateStack", stack)
				let state = this.get("state")
				switch(name) {
					case "main-menu":
						break
					case "connection":
						server.send(JSON.stringify({
							type: "partner",
							name: this.get("username")
						}))
						break
					case "playing":
						let online = args[0]
						this.set("state.playing.online", online)
						let turn
						if(online === true) {
							this.set("state.playing.opponentName", args[1])
							turn = args[2]
						}
						else {
							this.set("state.playing.opponentName", "CPU")
							turn = randInt(0,1)==0 ? "left" : "right"
						}
						for(let i=0; i < 9; i++)
							this.set(`grid[${i}]`, 0)
						this.callMethod("setState", ["playing.ongoing."+turn])
						break
					case "playing.ongoing.left":
					case "playing.ongoing.right":
						let r = this.callMethod("gridStatus")
						if(r.complete) {
							if(r.draw)
								this.callMethod("setState", ["playing.complete.draw"])
							else {
								let winner = r.winner==1 ? "left" : "right"
								this.callMethod("setState", [`playing.complete.win.${winner}`])
							}
						}
						else if(stack[stack.length-1] === "right" && state.playing.online === false) {
							setTimeout(()=> {
								let indeces = []
								let g = this.get("grid")
								for(let i=0; i < 9; i++)
									if(g[i]===0)
										indeces.push(i)
								let choice = indeces[randInt(0, indeces.length-1)]
								this.set(`grid[${choice}]`, 2)
								this.callMethod("setState", ["playing.ongoing.left"])
							}, randInt(200,500))
						}
						break
					case "playing.complete.draw":
					case "playing.complete.draw.win.left":
					case "playing.complete.draw.win.right":
						// setTimeout(()=> {
						// 	that.callMethod("setState", ["main-menu"])
						// }, 1000)
						break
					default:
						console.log("State with no function: ", name, args)
						break
				}
			},
			playOnline: function() {
				this.callMethod("validateUsername")
				this.callMethod("setState", ["connection"])
			},
			playOffline: function() {
				this.callMethod("validateUsername")
				this.callMethod("setState", ["playing", false])
			},
			cellClick: function(idx) {
				let state = this.get("state")
				if( this.callMethod("is", ["playing.ongoing.left"]) &&
					this.get("grid")[idx] === 0 )
				{
					this.set(`grid[${idx}]`, 1)
					this.callMethod("setState", ["playing.ongoing.right"])
					if(state.playing.online === true) {
						server.send(JSON.stringify({
							type: "move",
							idx
						}))
					}
				}
			},
			onMessage: function(msg) {
				console.log(msg)
				let o = JSON.parse(msg)
				switch(o.type) {
					case "opponentMove":
						let state = this.get("state")
						if( this.callMethod("is", ["playing.ongoing.right"]) && state.playing.online === true) {
							this.set(`grid[${o.idx}]`, 2)
							this.callMethod("setState", ["playing.ongoing.left"])
						}
						break
					case "partner":
						if(this.callMethod("is", ["connection"]))
							this.callMethod("setState", ["playing", true, o.name, o.turn])
						break
					case "end":
						this.callMethod("quitGame")
				}
			},
			quitGame: function() {
				let state = this.get("state")
				if(this.callMethod("is", ["connection"]) || (this.callMethod("is", ["playing"]) && state.playing.online === true)) {
					server.send(JSON.stringify({
						type: "cancel"
					}))
				}
				this.callMethod("setState", ["main-menu"])
			}
		}
	})

	// window.app = app
	server.addEventListener("message", msg => {
		app.callMethod("onMessage", [msg.data])
	})

}

/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
 * Moon v0.11.0
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */
!function(e,t){"object"==typeof module&&module.exports?module.exports=t():e.Moon=t()}(this,function(){"use strict";function e(e){this.instance=e,this.cache={},this.setters={},this.clear={},this.target=null,this.map={}}function t(t){void 0===t&&(t={}),this.$options=t,$(this,"$name",t.name,"root");var n=t.data;this.$data=void 0===n?{}:"function"==typeof n?n():n,$(this,"$render",t.render,k),$(this,"$hooks",t.hooks,{});var r=t.methods;void 0!==r&&l(this,r),this.$events={},this.$dom={},this.$observer=new e(this),this.$destroyed=!0,this.$queued=!1;var i=t.computed;void 0!==i&&s(this,i),this.init()}var n={},r={},i={},o={stop:"event.stopPropagation();",prevent:"event.preventDefault();",ctrl:"if(event.ctrlKey === false) {return null;};",shift:"if(event.shiftKey === false) {return null;};",alt:"if(event.altKey === false) {return null;};",enter:"if(event.keyCode !== 13) {return null;};"},a={},l=function(e,t){var n=e.$data;for(var r in t)!function(t,r){n[t]=function(){return r.apply(e,arguments)}}(r,t[r])},s=function(e,t){for(var n in t)!function(n){var r=e.$observer;r.observe(n),Object.defineProperty(e.$data,n,{get:function(){var i=null;return void 0===r.cache[n]?(r.target=n,i=t[n].get.call(e),r.target=null,r.cache[n]=i):i=r.cache[n],i},set:k});var i=null;void 0!==(i=t[n].set)&&(r.setters[n]=i)}(n)};e.prototype.observe=function(e){var t=this;this.clear[e]=function(){t.cache[e]=void 0}},e.prototype.notify=function(e,t){var n=this,r=null;if(void 0!==(r=this.map[e]))for(var i=0;i<r.length;i++)n.notify(r[i]);var o=null;void 0!==(o=this.clear[e])&&o()};var u=/\[(\w+)\]/g,v=/(?:(?:&(?:lt|gt|quot|amp);)|"|\\|\n)/g,c={"&lt;":"<","&gt;":">","&quot;":'\\"',"&amp;":"&","\\":"\\\\",'"':'\\"',"\n":"\\n"},f=function(e){!1===t.config.silent&&console.log(e)},d=function(e){!1===t.config.silent&&console.error("[Moon] ERROR: "+e)},p=function(e){!1===e.$queued&&!1===e.$destroyed&&(e.$queued=!0,setTimeout(function(){e.build(),m(e,"updated"),e.$queued=!1},0))},h=function(e,t,n,r){n=n.replace(u,".$1");for(var i=n.split("."),o=0;o<i.length-1;o++){t=t[i[o]]}return t[i[o]]=r,i[0]},m=function(e,t){var n=e.$hooks[t];void 0!==n&&n.call(e)},g=function(e){var t={};if(t.default=[],0===e.length)return t;for(var n=0;n<e.length;n++){var r=e[n],i=r.props.attrs,o="",a=null;void 0!==(o=i.slot)?(a=t[o],void 0===a?t[o]=[r]:a.push(r),delete i.slot):t.default.push(r)}return t},y=function(e,t){for(var n in t)e[n]=t[n];return e},$=function(e,t,n,r){e[t]=void 0===n?r:n},b=function(e){return e.replace(v,function(e){return c[e]})},k=function(){},x=function(e){for(var t={},n=e.attributes,r=n.length;r--;)t[n[r].name]=n[r].value;return t},A=function(e,t){for(var n in t)!function(n){var r=function(e){for(var t=r.handlers,n=0;n<t.length;n++)t[n](e)};r.handlers=t[n],t[n]=r,e.addEventListener(n,r)}(n)},E=function(e){var t=null;if("#text"===e.type)t=document.createTextNode(e.val);else{if(t=e.meta.isSVG?document.createElementNS("http://www.w3.org/2000/svg",e.type):document.createElement(e.type),1===e.children.length&&"#text"===e.children[0].type)t.textContent=e.children[0].val,e.children[0].meta.el=t.firstChild;else for(var n=0;n<e.children.length;n++){var r=e.children[n];_(E(r),r,t)}var i=null;void 0!==(i=e.meta.eventListeners)&&A(t,i)}return N(t,{},e,e.props.attrs),e.meta.el=t,t},_=function(e,t,n){n.appendChild(e);var r=null;void 0!==(r=t.meta.component)&&G(e,t,r)},w=function(e,t){var n=null;void 0!==(n=e.__moon__)&&n.destroy(),t.removeChild(e)},C=function(e,t,n,r){var i=null;void 0!==(i=e.__moon__)&&i.destroy(),r.replaceChild(t,e);var o=null;void 0!==(o=n.meta.component)&&G(t,n,o)},L={SKIP:0,APPEND:1,REMOVE:2,REPLACE:3,TEXT:4,CHILDREN:5},R=function(){return{shouldRender:!1}},O=function(e,t,n){var r=n.meta,i=r.eventListeners;void 0===i&&(i=r.eventListeners={});var o=i[e];void 0===o?i[e]=[t]:o.push(t)},P=function(e,t,n,r,i){return{type:e,val:t,props:n,children:i,meta:r||R()}},M=function(e,t,n){var r=n.options,i=e.attrs,o=r.data;void 0===o&&(o={});var a=r.props;if(void 0===a)o=i;else for(var l=0;l<a.length;l++){var s=a[l];o[s]=i[s]}return n.options.render(T,{data:o,slots:g(t)})},T=function(e,t,n,r){var o=null;if("#text"===e)return P("#text",n,{attrs:{}},t,[]);if(void 0!==(o=i[e])){if(!0===o.options.functional)return M(t,r,o);n.component=o}return P(e,"",t,n,r)},G=function(e,t,n){for(var r=new n.CTor,i=r.$props,o=r.$data,a=t.props.attrs,l=0;l<i.length;l++){var s=i[l];o[s]=a[s]}var u=t.meta.eventListeners;return void 0!==u&&y(r.$events,u),r.$slots=g(t.children),r.$el=e,r.build(),m(r,"mounted"),t.meta.el=r.$el,r.$el},S=function(e,t,n){for(var r in t){var i=n[r];void 0===i?e.removeEventListener(r,i):n[r].handlers=t[r]}},N=function(e,t,r){var i=r.props.attrs;for(var o in i){var a=i[o],l=t[o];void 0===a||!1===a||null===a||void 0!==l&&!1!==l&&null!==l&&a===l||(10===o.length&&"xlink:href"===o?e.setAttributeNS("http://www.w3.org/1999/xlink","href",a):e.setAttribute(o,!0===a?"":a))}for(var s in t){var u=i[s];void 0!==u&&!1!==u&&null!==u||e.removeAttribute(s)}var v=null;if(void 0!==(v=r.props.directives))for(var c in v){var f=null;void 0!==(f=n[c])&&f(e,v[c],r)}var d=null;if(void 0!==(d=r.props.dom))for(var p in d){var h=d[p];e[p]!==h&&(e[p]=h)}},D=function(e,t){if(void 0===e.__moon__)G(e,t,t.meta.component);else{for(var n=e.__moon__,r=!1,i=n.$props,o=n.$data,a=t.props.attrs,l=0;l<i.length;l++){var s=i[l];o[s]!==a[s]&&(o[s]=a[s],r=!0)}0!==t.children.length&&(n.$slots=g(t.children),r=!0),!0===r&&n.build()}},j=function(e,t,n){var r=null!==e?e.nodeName.toLowerCase():null;if(null===e){var i=E(t);return _(i,t,n),i}if(null===t)return w(e,n),null;if(r!==t.type){var o=E(t);return C(e,o,t,n),o}if("#text"===t.type)return"#text"===r?(e.textContent!==t.val&&(e.textContent=t.val),t.meta.el=e):C(e,E(t),t,n),e;if(t.meta.el=e,void 0!==t.meta.component)return D(e,t),e;N(e,x(e),t);var a=null;void 0!==(a=t.meta.eventListeners)&&A(e,a);var l=t.props.dom;if(void 0!==l&&void 0!==l.innerHTML)return e;for(var s=t.children,u=s.length,v=0,c=e.firstChild,f=0!==u?s[0]:null;null!==f||null!==c;){var d=null!==c?c.nextSibling:null;j(c,f,e),f=++v<u?s[v]:null,c=d}return e},I=function(e,t,n){if(null===e)return _(E(t),t,n),L.APPEND;if(null===t)return w(e.meta.el,n),L.REMOVE;if(e===t)return L.SKIP;if(e.type!==t.type)return C(e.meta.el,E(t),t,n),L.REPLACE;if(!0===t.meta.shouldRender&&"#text"===t.type){var r=e.meta.el;return"#text"===e.type?(t.val!==e.val&&(r.textContent=t.val),L.TEXT):(C(r,E(t),t,n),L.REPLACE)}if(!0===t.meta.shouldRender){var i=e.meta.el;if(void 0!==t.meta.component)return D(i,t),L.SKIP;N(i,e.props.attrs,t),e.props.attrs=t.props.attrs;var o=null;void 0!==(o=t.meta.eventListeners)&&S(i,o,e.meta.eventListeners);var a=t.props.dom;if(void 0!==a&&void 0!==a.innerHTML)return L.SKIP;var l=t.children,s=e.children,u=l.length,v=s.length;if(0===u){if(0!==v){for(var c=null;null!==(c=i.firstChild);)w(c,i);e.children=[]}}else for(var f=u>v?u:v,d=0,p=0;d<f;d++,p++){var h=p<v?s[p]:null,m=d<u?l[d]:null,g=I(h,m,i);switch(g){case L.APPEND:s[v++]=m;break;case L.REMOVE:s.splice(p--,1),v--;break;case L.REPLACE:s[p]=l[d];break;case L.TEXT:h.val=m.val}}return L.CHILDREN}return t.meta.el=e.meta.el,L.SKIP},K=/\{\{/,q=/\s*\}\}/,H=/\s/,V=/"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g,z=["true","false","undefined","null","NaN","typeof","in"],Z=function(e,t,n){var r={current:0,template:e,output:"",dependencies:t};return X(r,n),r.output},X=function(e,t){for(var n=e.template,r=n.length;e.current<r;){var i=B(e,K);if(0!==i.length&&(e.output+=b(i)),e.current===r)break;e.current+=2,J(e);var o=B(e,q);if(e.current===r)break;0!==o.length&&(F(o,e.dependencies),t&&(o='" + '+o+' + "'),e.output+=o),J(e),e.current+=2}},F=function(e,t){return e.replace(V,function(e,n){void 0!==n&&-1===t.indexOf(n)&&-1===z.indexOf(n)&&t.push(n)}),t},B=function(e,t){var n=e.template,r=n.substring(e.current),i=(r.length,r.search(t)),o="";switch(i){case-1:o=r;break;case 0:o="";break;default:o=r.substring(0,i)}return e.current+=o.length,o},J=function(e){for(var t=e.template,n=t[e.current];H.test(n);)n=t[++e.current]},Q=/<\/?(?:[A-Za-z]+\w*)|<!--/,U=function(e){var t={input:e,current:0,tokens:[]};return W(t),t.tokens},W=function(e){for(var t=e.input,n=t.length;e.current<n;)"<"===t.charAt(e.current)?"\x3c!--"!==t.substr(e.current,4)?te(e):ee(e):Y(e)},Y=function(e){var t=e.current,n=e.input,r=n.length,i=n.substring(t).search(Q);if(-1===i)return e.tokens.push({type:"text",value:n.slice(t)}),void(e.current=r);0!==i&&(i+=t,e.tokens.push({type:"text",value:n.slice(t,i)}),e.current=i)},ee=function(e){var t=e.current,n=e.input,r=n.length;t+=4;var i=n.indexOf("--\x3e",t);-1===i?(e.tokens.push({type:"comment",value:n.slice(t)}),e.current=r):(e.tokens.push({type:"comment",value:n.slice(t,i)}),e.current=i+3)},te=function(e){var t=e.input,n=(t.length,"/"===t.charAt(e.current+1));e.current+=!0===n?2:1;var r=ne(e);re(r,e);var i="/"===t.charAt(e.current);e.current+=!0===i?2:1,!0===n&&(r.closeStart=!0),!0===i&&(r.closeEnd=!0)},ne=function(e){for(var t=e.input,n=t.length,r=e.current,i="";r<n;){var o=t.charAt(r);if("/"===o||">"===o||" "===o)break;i+=o,r++}var a={type:"tag",value:i};return e.tokens.push(a),e.current=r,a},re=function(e,t){for(var n=t.input,r=n.length,i=t.current,o=n.charAt(i),a=n.charAt(i+1),l=function(){i++,o=n.charAt(i),a=n.charAt(i+1)},s={};i<r&&">"!==o&&("/"!==o||">"!==a);)if(" "!==o){for(var u="",v=!1;i<r&&"="!==o;){if(" "===o||">"===o||"/"===o&&">"===a){v=!0;break}u+=o,l()}var c={name:u,value:"",meta:{}};if(!0!==v){l();var f=" ";for("'"!==o&&'"'!==o||(f=o,l());i<r&&o!==f;)c.value+=o,l();l();var d=u.indexOf(":");if(-1!==d){var p=u.split(":");c.name=p[0],c.meta.arg=p[1]}s[u]=c}else s[u]=c}else l();t.current=i,e.attributes=s},ie=function(e){for(var t={type:"ROOT",children:[]},n={current:0,tokens:e};n.current<e.length;){var r=se(n);r&&t.children.push(r)}return t},oe=["area","base","br","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"],ae=["svg","animate","circle","clippath","cursor","defs","desc","ellipse","filter","font-face","foreignObject","g","glyph","image","line","marker","mask","missing-glyph","path","pattern","polygon","polyline","rect","switch","symbol","text","textpath","tspan","use","view"],le=function(e,t,n){return{type:e,props:t,children:n}},se=function(e){var t=e.tokens[e.current],n=e.tokens[e.current-1],r=e.tokens[e.current+1],i=function(i){e.current+=void 0===i?1:i,t=e.tokens[e.current],n=e.tokens[e.current-1],r=e.tokens[e.current+1]};if("text"===t.type)return i(),n.value;if("comment"===t.type)return i(),null;if("tag"===t.type){var o=t.value,a=t.closeStart,l=t.closeEnd,s=-1!==ae.indexOf(o),u=-1!==oe.indexOf(o)||!0===l,v=le(o,t.attributes,[]);if(i(),s&&(v.isSVG=!0),!0===u)return v;if(!0===a)return null;if(void 0!==t){for(e.current;"tag"!==t.type||"tag"===t.type&&(void 0===t.closeStart&&void 0===t.closeEnd||t.value!==o);){var c=se(e);if(null!==c&&v.children.push(c),i(0),void 0===t)break}i()}return v}i()},ue=function(e,t,n){var i=e.props;e.props={attrs:i};var o=!1,a=[],l=!1,s={},u=null,v=null,c="{attrs: {",f=null;for(u in i){var d=i[u],p=d.name;void 0!==(v=r[p])&&void 0!==(f=v.beforeGenerate)&&f(d,e,t,n)}var h=null,m=null;for(u in i){var g=i[u],y=g.name;if(void 0!==(v=r[y]))void 0!==(h=v.afterGenerate)&&(s[y]={prop:g,afterGenerate:h},l=!0),void 0!==(m=v.duringPropGenerate)&&(c+=m(g,e,n)),e.meta.shouldRender=!0;else if("m"===y[0]&&"-"===y[1])a.push(g),o=!0,e.meta.shouldRender=!0;else{var $=g.value,b=Z($,n.dependencies,!0);$!==b&&(e.meta.shouldRender=!0),!1===n.hasAttrs&&(n.hasAttrs=!0),c+='"'+u+'": "'+b+'", '}}if(!0===n.hasAttrs?(c=c.substring(0,c.length-2)+"}",n.hasAttrs=!1):c+="}",!0===o){c+=", directives: {";for(var k=null,x=null,A=0;A<a.length;A++)k=a[A],x=k.value,F(x,n.dependencies),c+='"'+k.name+'": '+(0===x.length?'""':x)+", ";c=c.substring(0,c.length-2)+"}"}!0===l&&(n.specialDirectivesAfter=s);var E=e.props.dom;if(void 0!==E){c+=", dom: {";for(var _ in E)c+='"'+_+'": '+E[_]+", ";c=c.substring(0,c.length-2)+"}"}return c+="}, "},ve=function(e){var t='"eventListeners": {';for(var n in e){var r=e[n];t+='"'+n+'": [';for(var i=0;i<r.length;i++)t+=r[i]+", ";t=t.substring(0,t.length-2)+"], "}return t=t.substring(0,t.length-2)+"}, "},ce=function(e){var t="{";for(var n in e)t+="eventListeners"===n?ve(e[n]):'"'+n+'": '+e[n]+", ";return t=t.substring(0,t.length-2)+"}, "},fe=function(e,t,n){if("string"==typeof e){var r=Z(e,n.dependencies,!0),i=R();return e!==r&&(i.shouldRender=!0,t.meta.shouldRender=!0),'m("#text", '+ce(i)+'"'+r+'")'}if("slot"===e.type){t.meta.shouldRender=!0,t.deep=!0;var o=e.props.name;return'instance.$slots["'+(void 0===o?"default":o.value)+'"]'}var a='m("'+e.type+'", ',l=R();e.meta=l;var s=ue(e,t,n),u=n.specialDirectivesAfter;null!==u&&(n.specialDirectivesAfter=null);var v=e.children,c=v.length,f="[";if(0===c)f+="]";else{for(var d=0;d<v.length;d++)f+=fe(v[d],e,n)+", ";f=f.substring(0,f.length-2)+"]"}if(!0===e.deep&&(f="[].concat.apply([], "+f+")"),!0===e.meta.shouldRender&&void 0!==t&&(t.meta.shouldRender=!0),a+=s,a+=ce(l),a+=f,a+=")",null!==u){var p;for(var h in u)p=u[h],a=p.afterGenerate(p.prop,a,e,n)}return a},de=function(e){for(var t=e.children[0],n={hasAttrs:!1,specialDirectivesAfter:null,dependencies:[]},r=fe(t,void 0,n),i=n.dependencies,o="",a=0;a<i.length;a++){var l=i[a];o+="var "+l+' = instance.get("'+l+'"); '}var s="var instance = this; "+o+"return "+r+";";try{return new Function("m",s)}catch(e){return d("Could not create render function"),k}},pe=function(e){var t=U(e),n=ie(t);return de(n)};t.prototype.get=function(e){var t=this.$observer,n=null;return null!==(n=t.target)&&(void 0===t.map[e]?t.map[e]=[n]:-1===t.map[e].indexOf(n)&&t.map[e].push(n)),this.$data[e]},t.prototype.set=function(e,t){var n=this.$observer,r=h(0,this.$data,e,t),i=null;void 0!==(i=n.setters[r])&&i.call(this,t),n.notify(r,t),p(this)},t.prototype.destroy=function(){this.off(),this.$el=null,this.$destroyed=!0,m(this,"destroyed")},t.prototype.callMethod=function(e,t){return t=t||[],this.$data[e].apply(this,t)},t.prototype.on=function(e,t){var n=this.$events[e];void 0===n?this.$events[e]=[t]:n.push(t)},t.prototype.off=function(e,t){if(void 0===e)this.$events={};else if(void 0===t)this.$events[e]=[];else{var n=this.$events[e],r=n.indexOf(t);n.splice(r,1)}},t.prototype.emit=function(e,t){var n=t||{};n.type=e;var r=this.$events[e],i=this.$events["*"],o=0;if(void 0!==r)for(o=0;o<r.length;o++)r[o](n);if(void 0!==i)for(o=0;o<i.length;o++)i[o](n)},t.prototype.mount=function(e){this.$el="string"==typeof e?document.querySelector(e):e,this.$destroyed=!1,this.$el.__moon__=this,$(this,"$template",this.$options.template,this.$el.outerHTML),this.$render===k&&(this.$render=t.compile(this.$template)),this.build(),m(this,"mounted")},t.prototype.render=function(){return this.$render(T)},t.prototype.patch=function(e,t,n){if(void 0!==e.meta)if(t.type!==e.type){var r=E(t);C(e.meta.el,r,t,n),r.__moon__=this,this.$el=r}else I(e,t,n);else if(e instanceof Node){var i=j(e,t,n);i!==e&&(this.$el=t.meta.el,this.$el.__moon__=this)}},t.prototype.build=function(){var e=this.render(),t=null;void 0!==this.$dom.meta?t=this.$dom:(t=this.$el,this.$dom=e),this.patch(t,e,this.$el.parentNode)},t.prototype.init=function(){f("======= Moon ======="),m(this,"init");var e=this.$options.el;void 0!==e&&this.mount(e)},t.config={silent:!0,keyCodes:function(e){y(a,e)}},t.version="0.11.0",t.util={noop:k,error:d,log:f,extend:y,m:T},t.use=function(e,n){e.init(t,n)},t.compile=function(e){return pe(e)},t.nextTick=function(e){setTimeout(e,0)},t.directive=function(e,t){n["m-"+e]=t},t.component=function(e,n){function r(){t.call(this,n)}var o=this;return void 0!==n.name?e=n.name:n.name=e,void 0!==n.data&&"function"!=typeof n.data&&d("In components, data must be a function returning an object"),r.prototype=Object.create(o.prototype),r.prototype.constructor=r,r.prototype.init=function(){m(this,"init");var e=this.$options;this.$destroyed=!1,$(this,"$props",e.props,[]);var n=e.template;this.$template=n,this.$render===k&&(this.$render=t.compile(n))},i[e]={CTor:r,options:n},r},t.renderClass=function(e){if("string"==typeof e)return e;var n="";if(Array.isArray(e))for(var r=0;r<e.length;r++)n+=t.renderClass(e[r])+" ";else if("object"==typeof e)for(var i in e)e[i]&&(n+=i+" ");return n=n.slice(0,-1)},t.renderLoop=function(e,t){var n=null;if(Array.isArray(e)){n=new Array(e.length);for(var r=0;r<e.length;r++)n[r]=t(e[r],r)}else if("object"==typeof e){n=[];for(var i in e)n.push(t(e[i],i))}else if("number"==typeof e){n=new Array(e);for(var o=0;o<e;o++)n[o]=t(o+1,o)}return n},t.renderEventModifier=function(e,t){return e===a[t]};var he='m("#text", '+ce(R())+'"")';return r["m-if"]={afterGenerate:function(e,t,n,r){var i=e.value;return F(i,r.dependencies),i+" ? "+t+" : "+he}},r["m-for"]={beforeGenerate:function(e,t,n,r){n.deep=!0},afterGenerate:function(e,t,n,r){var i=r.dependencies,o=e.value.split(" in "),a=o[0].split(","),l=o[1];F(l,i);for(var s=a.join(","),u=0;u<a.length;u++){var v=i.indexOf(a[u]);-1!==v&&i.splice(v,1)}return"Moon.renderLoop("+l+", function("+s+") { return "+t+"; })"}},r["m-on"]={beforeGenerate:function(e,t,n,r){var i=e.value,a=e.meta,l=i,s=a.arg.split("."),u=s.shift(),v="event",c=l.split("(");c.length>1&&(l=c.shift(),v=c.join("(").slice(0,-1),F(v,r.dependencies));for(var f="",d=0;d<s.length;d++){var p=o[s[d]];f+=void 0===p?'if(Moon.renderEventModifier(event.keyCode, "'+s[d]+'") === false) {return null;};':p}O(u,"function(event) {"+f+'instance.callMethod("'+l+'", ['+v+"])}",t)}},r["m-model"]={beforeGenerate:function(e,t,n,r){var i=e.value,o=t.props.attrs,a=r.dependencies;F(i,a);var l="input",s="value",u=i,v=i,c="event.target."+s,f=o.type;if(void 0!==f){f=f.value;var d=!1;if("checkbox"===f||"radio"===f&&(d=!0))if(l="change",s="checked",!0===d){var p=o.value,h=null,m="null";void 0!==p?m='"'+Z(p.value,a,!0)+'"':(h=o["m-literal:value"])&&(m=""+Z(h.value,a,!0)),u=u+" === "+m,c=m}else c="event.target."+s}var g=v.indexOf("["),y=v.indexOf("."),$=null,b=null,k=-1;-1===g&&-1===y||(k=-1===g?y:-1===y?g:g<y?g:y,$=i.substring(0,k),b=i.substring(k),v=$+b.replace(V,function(e,t){return void 0!==t?'" + '+t+' + "':e})),O(l,'function(event) {instance.set("'+v+'", '+c+")}",t);var x=t.props.dom;void 0===x&&(t.props.dom=x={}),x[s]=u}},r["m-literal"]={duringPropGenerate:function(e,t,n){var r=e.meta.arg,i=e.value;return F(i,n.dependencies),!1===n.hasAttrs&&(n.hasAttrs=!0),"class"===r?'"class": Moon.renderClass('+i+"), ":'"'+r+'": '+i+", "}},r["m-html"]={beforeGenerate:function(e,t,n,r){var i=e.value,o=t.props.dom;void 0===o&&(t.props.dom=o={}),F(i,r.dependencies),o.innerHTML='("" + '+i+")"}},r["m-mask"]={},n["m-show"]=function(e,t,n){e.style.display=t?"":"none"},t});

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);