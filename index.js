const path = require("path")
const express = require("express")
const ws = require("ws")

const PORT = process.env.PORT || 5000
console.log(PORT)

const publicRoot = path.join(__dirname, "/public")
const expressServer = express().use(express.static(publicRoot))
	.listen(PORT, ()=> console.log(`Listening on ${PORT}`))

const wss = new ws.Server({ server: expressServer })

wss.on("connection", socket => {
	console.log("Client connected")
	socket.on("message", msg => {
		console.log("received: "+msg)
		socket.send("Echo "+msg)
	})
	socket.on("close", () => console.log("Client disconnected"))
	socket.send("something");
})

wss.on("error", e => console.log(e))
wss.on("listening", ()=> console.log("Socket server listening"))