
const Moon = require("moonjs")
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