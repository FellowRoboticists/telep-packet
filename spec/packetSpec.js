var packet = require("../lib/telep-packet");

describe("Packet Library", function() {

  beforeEach(function() {
    packet.reset();
  });

  describe("#reset", function() {

    it("resets the contents of the buffer", function() {
      packet.reset();
      expect(packet.length()).toEqual(1);
      packet.append(0x01);
      expect(packet.length()).toEqual(2);
    });

  });

  describe("#resetToStartByte", function() {

    it ("handles a packet with just the start byte", function() {
      packet.resetToStartByte();
      expect(packet.length()).toEqual(1);
    });

    it ("handles the case where there is no other start byte", function() {
      packet.append(0x01);
      packet.append(0x02);
      packet.append(0x03);
      
      packet.resetToStartByte();
      expect(packet.length()).toEqual(1);
    });

    it ("pulls back the data from the other start byte", function() {
      packet.append(0x01);
      packet.append(0x02);
      packet.append(0x03);
      packet.append(0x13);
      packet.append(0x04);
      packet.append(0x05);
      
      packet.resetToStartByte();
      expect(packet.length()).toEqual(3);
      expect(packet.valueAt(1)).toEqual(0x04);
      expect(packet.valueAt(2)).toEqual(0x05);
    });
  });

  describe("#readCompleted", function() {

    it ("returns true when the packet is complete", function() {
      packet.append(0x02);
      packet.append(0xf2);
      packet.append(0xf3);
      packet.complete();
      expect(packet.readCompleted()).toBe(true);
    });

    it ("returns false when not complete", function() {
      packet.append(0x02);
      packet.append(0xf2);
      packet.append(0xf3);
      expect(packet.readCompleted()).toBe(false);
    });

    it ("returns false when empty", function() {
      expect(packet.readCompleted()).toBe(false);
    });
  });

  describe("#valid", function() {

    it ("returns true if the packet is complete and valid", function() {
      packet.append(0x02);
      packet.append(0xf2);
      packet.append(0xf3);
      packet.complete();
      expect(packet.valid()).toBe(true);
      expect(packet.valueAt(4)).toEqual(0xfa);
    });

    it ("returns false if the checksum is invalid", function() {
      packet.append(0x02);
      packet.append(0xf2);
      packet.append(0xf3);
      packet.append(0xfb);
      expect(packet.valid()).toBe(false);
      expect(packet.valueAt(4)).toEqual(0xfb);
    });

    it ("returns false if the packet is not complete", function() {
      packet.append(0x02);
      packet.append(0xf2);
      packet.append(0xf3);
      expect(packet.valid()).toBe(false);
    });

  });

});
