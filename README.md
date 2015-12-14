Pure JavaScript Node.js implemenation of an NFSv4 server.

Create an Linux NFS daemon so you can test the Node.js NFS client and an Linux
NFS client so you can test the Node.js NFS server.

Create an NFS daemon image.

```console
homeport create nfsd
homeport append nfsd formula/apt-get nfs-kernel-server
homeport append nfsd formula/apt-get zsh vim man curl rsync git
homeport append nfsd formula/locale en_US.UTF-8
homeport append nfsd formula/chsh /usr/bin/zsh
```

Run `nfsd`. You need to use a volume in order to get an `ext4` filesytem for use
with the NFS daemon. It won't work with the default container volumes because
they are goofy filesystems like `aufs`.

```console
homeport run nfsd --privileged -p 2049 -v /srv
```

In that machine, create an `/etc/exports`.

```console
/srv/nfs4       *(rw,sync,no_subtree_check)
```

Run NFS.

```
sudo service rpcbind restart
sudo service nfs-kernel-service restart
```

You'll want to connect from Node.js.

Create a Node.js homeport image.

```console
homeport create node-0-12-9 --no-cache
homeport append node-0-12-9 formula/node https://nodejs.org/dist/v0.12.9/node-v0.12.9.tar.gz 35daad301191e5f8dd7e5d2fbb711d081b82d1837d59837b8ee224c256cfe5e4
homeport append node.0.12.9 formula/apt-get zsh vim man curl rsync git
homeport append node.0.12.9 formula/locale en_US.UTF-8
homeport append node.0.12.9 formula/chsh /usr/bin/zsh
```

Run the `tcp.js` stub.

```console
homeport run node-0-12-9 -p 2049 --link=homeport-nfsd:nfsd
homeport ssh node-0-12-9
cd ~/git/ecma/packet/nfs
node tcp.js
```

Mount using NFS.

```console
homeport run nfs --link=homeport-node.0.12.9:node --link=homeport-nfsd:nfsd
homeport ssh nfs
sudo mount -o nolock $NODE_PORT_2049_TCP_ADDR:/mnt /mnt
sudo mount -o nolock $NFSD_PORT_2049_TCP_ADDR:/mnt /mnt
```

## Diary

* [General troubleshooting
recommendations](http://wiki.linux-nfs.org/wiki/index.php/General_troubleshooting_recommendations)
&mdash; Here's a pretty good listing on how to debug NFS. Installation of TCP
dump might require you to use full virtualization instead of containers to run.
* Support of
[AUTH\_SYS](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Storage_Administration_Guide/s1-nfs-security.html)
is all that is necessary.

[7.1](https://tools.ietf.org/html/rfc1831#section-7.1) &mdash; The RPC call
message has three unsigned integer fields -- remote program number, remote
program version number, and remote procedure number -- which uniquely identify
the procedure to be called. Program numbers are administered by a central
authority (rpc@sun.com).
