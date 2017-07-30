const path = require("path")
const express = require("express")
const ws = require("ws")

function randInt(a,b){return a+Math.floor(Math.random()*(++b-a))}

const PORT = process.env.PORT || 5000

const publicRoot = path.join(__dirname, "/client", "dist")
const expressServer = express().use(express.static(publicRoot))
	.listen(PORT, ()=> console.log(`Listening on port ${PORT}`))

class Game {
	// socketA will play first
	constructor(socketA, socketB) {
		this.socketA = socketA
		this.socketB = socketB
		this.grid = [0,0,0,0,0,0,0,0,0]
		this.turnFlag = true
	}
	move(socket, idx) {
		if( (this.turnFlag==true && socket==this.socketA) ||
			(this.turnFlag==false && socket==this.socketB)) {
			if(this.grid[idx] == 0) {
				this.grid[idx] = socket==this.socketA ? 1 : 2
				this.turnFlag = !this.turnFlag
				return true
			}
		}
		return false
	}
}

const server = new ws.Server({ server: expressServer })

var waiting = null

server.on("connection", socket => {
	console.log("Client connected")

	socket.partner = null
	socket.game = null

	function cancel() {
		if(waiting !== null && waiting.socket === socket)
			waiting = null
		if(socket.partner !== null) {
			socket.partner.partner = null
			socket.partner.game = null
			socket.partner.send(JSON.stringify({ type: "end" }))
			socket.partner = null
			socket.game = null
		}
	}

	socket.on("message", msg => {
		console.log(msg)
		let o = JSON.parse(msg)
		switch(o.type) {
			case "partner":
				if(waiting === null || waiting.socket === socket)
					waiting = { socket, name: o.name }
				else {
					socket.partner = waiting.socket
					socket.partner.partner = socket
					let partnerName = waiting.name
					waiting = null
					let [a,b] = [["left","right"],["right","left"]][randInt(0,1)]
					if(a=="left")
						socket.game = new Game(socket,socket.partner)
					else
						socket.game = new Game(socket.partner,socket)
					socket.partner.game = socket.game
					socket.send(JSON.stringify({
						type: "partner",
						name: partnerName,
						turn: a
					}))
					socket.partner.send(JSON.stringify({
						type: "partner",
						name: o.name,
						turn: b
					}))
				}
				break
			case "move":
				if(socket.game.move(socket, o.idx))
					socket.partner.send(JSON.stringify({
						type: "opponentMove",
						idx: o.idx
					}))
				break
			case "cancel": default:
				cancel()
				break
		}
	})
	socket.on("close", ()=> {
		console.log("Client disconnected")
		cancel()
	})
})

server.on("error", e => console.log(e))