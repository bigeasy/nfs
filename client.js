var net = require('net')
var Reactor = require('reactor')
var cadence = require('cadence')
var Delta = require('delta')
var path = require('path')
var abend = require('abend')

var buffer = new Buffer([ 128,
     0,
     0,
     40,
     46,
     83,
     204,
     90,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     2,
     0,
     1,
     134,
     163,
     0,
     0,
     0,
     4,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0,
     0 ])

function Service () {
}

Service.prototype.serve = cadence(function (async, timeout, socket) {
    async(function () {
        socket.write(buffer, async())
    }, function () {
        var loop = async(function () {
            var data = socket.read()
            if (data == null) {
                new Delta(async()).ee(socket).on('readable')
            } else {
                return [ loop.break, data ]
            }
        })()
    }, function (data) {
        console.log(data.toJSON())
        var frame = data.readUInt32BE(0)
        var last = !!(frame & ~0x80000000)
        var length = frame & ~0x80000000
        console.log({
            recordLength: data.length,
            last: !!(frame & ~0x80000000),
            length: frame & ~0x80000000,
            nonce: data.readUInt32BE(4),
            discriminator: data.readUInt32BE(8),
            accepted: data.readUInt32BE(12),
            vcerf: data.readUInt32BE(16),
            vcerfLen: data.readUInt32BE(20),
            acceptStat: data.readUInt32BE(24)
        })
        console.log(data.slice(24))
        return []
        var json = data.toJSON()
        var nonce = data.readUInt32BE(4)
        console.log({
            recordLength: data.length,
            last: !!(frame & ~0x80000000),
            length: frame & ~0x80000000,
            data: json.data || json,
            nonce: data.readUInt32BE(4),
            discriminator: data.readUInt32BE(8),
            version: data.readUInt32BE(12),
            programNumber: data.readUInt32BE(16),
            programVersion: data.readUInt32BE(20),
            procedureNumber: data.readUInt32BE(24),
            credFlavor: data.readUInt32BE(28),
            credLenth: data.readUInt32BE(32),
            verfFlavor: data.readUInt32BE(36),
            verfLength: data.readUInt32BE(40)
        })
        console.log(data.slice(36))
        return []
    })
})

var service = new Service

var reactor = new Reactor({ object: service, method: 'serve' })

var socket = net.connect({
    port: 2049,
    host: process.argv[2]
})
socket.on('connect', function () {
    new Service().serve(null, socket, abend)
})
