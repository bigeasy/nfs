var net = require('net')
var Reactor = require('reactor')
var cadence = require('cadence')
var Delta = require('delta')
var path = require('path')

var compiler = require('packet/compiler/require')
var composer = require('packet/compose/parser/inc')
var filename = path.resolve(__dirname, './generated/nfs.parse.inc.js')

var parsers = composer(compiler(filename), [{
    type: 'structure',
    name: 'object',
    fields: [{
        type: 'integer',
        endianess: 'b',
        bits: 32
    }]
}])

function Service () {
}

Service.prototype.serve = cadence(function (async, status, socket) {
    async(function () {
        var loop = async(function () {
            var data = socket.read()
            if (data == null) {
                new Delta(async()).ee(socket).on('readable')
            } else {
                return [ loop.break, data ]
            }
        })()
    }, function (data) {
        var frame = data.readUInt32BE(0)
        var last = !!(frame & ~0x80000000)
        var length = frame & ~0x80000000
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
            verfFlavor: data.readUInt32BE(32)
        })
        console.log(data.slice(36))
        return []
    })
})

var service = new Service

var reactor = new Reactor({ object: service, method: 'serve' })

net.createServer(function (socket) {
    reactor.push(socket)
}).listen(2049)
