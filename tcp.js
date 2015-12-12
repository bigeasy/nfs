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
        console.log(data.length)
        var frame = data.readUInt32BE(0)
        var last = !!(frame & ~0x80000000)
        var length = frame & ~0x80000000
        console.log(last, length)
        console.log(data.readUInt32BE(4))
        console.log(data.toJSON())
        return []
    })
})

var service = new Service

var reactor = new Reactor({ object: service, method: 'serve' })

net.createServer(function (socket) {
    reactor.push(socket)
}).listen(2049)
