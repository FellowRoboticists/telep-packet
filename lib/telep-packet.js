var packet = (function() {
  var START_BYTE = 0x13;
  var PKT_LENGTH_BYTE = 1;
  var MAX_PACKET_LENGTH = 100;

  // The actual thing that will get exported from this module
  var mod = { }; 

  /**
   * Function to ensure we have a padded hex value. It's not really a 
   * member of Packet; just a helper method we need for the toString()
   * override.
   */
  function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return "0x" + hex;
}

  /**
   * Constructor for a new packat
   */
  function Packet() {
    this.mBuffer = new Uint8Array(MAX_PACKET_LENGTH);
    this.reset();
  };

  /**
   * Clear the contents of the buffer and reset the current index;
   */
  Packet.prototype.reset = function() {
    this.mCurrentIndex = 0;
    this.append(START_BYTE);
  };

  /**
   * Returns a buffer with only the actual packet contents up to
   * the correct length.
   */
  Packet.prototype.packetBuffer = function() {
    var newBuffer = new Buffer(this.length());
    var i;
    for (i=0; i<this.length(); i++) {
      newBuffer[i] = this.mBuffer[i];
    }
    return newBuffer;
  };

  /**
   * Resets the buffer in the case where we have read a packet
   * incorrectly and the start byte is located somewhere in the
   * buffer. This method will shift all the bytes left for the
   * new start byte position.
   */
  Packet.prototype.resetToStartByte = function() {
    var startByte = 0;
    var i;
    var pos;
    for (i=1; i<this.mCurrentIndex && startByte === 0; i++) {
      if (START_BYTE === this.mBuffer[i]) {
        startByte = i;
      }
    }
    if (startByte > 0) {
      pos = 1;
      for (i=startByte + 1; i<this.mCurrentIndex; i++) {
        this.mBuffer[pos] = this.mBuffer[i];
        pos += 1
      }
      this.mCurrentIndex = this.mCurrentIndex - startByte;
    } else {
      this.reset();
    }
  };

  /**
   * Returns the byte at the specifed 0-based index of the
   * packet.
   */
  Packet.prototype.valueAt = function(index) {
    return this.mBuffer[index];
  };

  /**
   * Returns the length of the current packet
   */
  Packet.prototype.length = function() {
    return this.mCurrentIndex;
  };

  /**
   * Append the specified character and increment the current index
   */
  Packet.prototype.append = function(b) {
    this.mBuffer[this.mCurrentIndex++] = b;
  };

  /**
   * Reads the contents of the specified buffer into the packet until
   * the packet is deemed completely read. This method is re-entrant
   * in that if a partial packet was read previously, a subsequent
   * read will attempt to complete the packet from where it left off.
   */
  Packet.prototype.readFromBuffer = function(buffer) {
    var started = this.length() > 1;
    var i;
    var readCompleted = false;
    for (i = 0; i < buffer.length && ! readCompleted; i++) {
      if (started) {
        this.append(buffer[i]);
        readCompleted = this.readCompleted();
      } else if (buffer[i] == START_BYTE) {
        started = true;
      }
    }
    return readCompleted && this.valid();
  }

  /**
   * Returns true if the packet is deemed to have been completely
   * read based on the length byte.
   */
  Packet.prototype.readCompleted = function() {
    if (this.mCurrentIndex <= PKT_LENGTH_BYTE) {
      return false;
    }

    if (this.mBuffer[PKT_LENGTH_BYTE] + 3 > MAX_PACKET_LENGTH) {
      return true;
    }

    return this.mBuffer[PKT_LENGTH_BYTE] + 3 == this.mCurrentIndex;
  };

  /**
   * This method completes a packet by computing the checksum for 
   * the current packet buffer and appends it.
   */
  Packet.prototype.complete = function() {
    this.append(this.calculateChecksum());
  };

  /**
   * Returns true if the packet is complete and valid.
   */
  Packet.prototype.valid = function() {
    var sum = 0;
    for (var i=0; i<(this.mCurrentIndex - 1); i++) {
      sum += this.mBuffer[i];
    }

    sum &= 0x000000ff;

    return this.mBuffer[0] === START_BYTE &&
      this.readCompleted() &&
      sum === this.mBuffer[this.mCurrentIndex - 1];
  };

  /**
   * Returns the checksum of the current packet.
   */
  Packet.prototype.calculateChecksum = function() {
    var sum = 0;
    for (var i=0; i<this.mCurrentIndex; i++) {
      sum += this.mBuffer[i];
    }
    return sum & 0x000000ff;
  };

  /**
   * Converts the packet buffer into a comma-separated list of
   * hex values.
   */
  Packet.prototype.toString = function() {
    var outString = "";
    var i;
    for (i = 0; i < this.mCurrentIndex; i++) {
      if (i > 0) {
        outString += ", ";
      }
      outString += decimalToHex(this.mBuffer[i]);
    }
    return outString;
  };

  mod.Packet = Packet;

  return mod; // The exported module
}());

module.exports = packet;
