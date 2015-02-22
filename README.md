telep-packet
============

This NPM module provides a definition for a packet object
that understands what a telep-packet read/written to a serial
port looks like.

Installation
------------

Since this is an npm module, you can install it in the usual way.

    npm install telep-packet

Well, almost. I haven't yet published this module to the npm repository
so the best way to install this module is to clone this repository, then
point npm at the directory like so:

    npm install ../telep-packet

Assuming you are running the npm command in a directory parallel to the 
telep-project directory.

Usage
-----

If you have a buffer of bytes and you want to read the valid packet
contents you can do something like:

    var telep = require('telep-packet');

    var packet = new Packet();

    var buffer = new Buffer(....);

    packet.readFromBuffer(buffer);

If you want to construct a new packet manually (a command for example)
you might do it this way:

    var telep = require('telep-packet');

    var packet = new Packet();

    packet.append(0x02); // The length of the packet
    packet.append(0x00); // The command group
    packet.append(0x00); // The command itself
    packet.complete();   // Deal with the checksum

    port.write(packet.packetBuffer());

When reading from a source that breaks the packet into small sequential
parts, you might do something like this:

    ... require, etc.

    if (packet.readFromBuffer(buffer)) {
      // if true, then we have a complete, valid packet
      ... Do something with it
      packet.reset(); // to prepare for the next packet
    } else if (packet.readCompleted()) {
      // If true, then the packet is complete, but invalid
      packet.reset(); // clear it for the next packet
    } else {
      // The packet has not been completely read. Usually
      // you'll do nothing here.
    }

Copyright
=========

Copyright (c) 2015 Dave Sieh

See details in LICENSE.txt.
