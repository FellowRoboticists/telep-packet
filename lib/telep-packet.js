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

  Packet.prototype.readCompleted = function() {
    if (this.mCurrentIndex <= PKT_LENGTH_BYTE) {
      return false;
    }

    if (this.mBuffer[PKT_LENGTH_BYTE] + 3 > MAX_PACKET_LENGTH) {
      return true;
    }

    return this.mBuffer[PKT_LENGTH_BYTE] + 3 == this.mCurrentIndex;
  };

  Packet.prototype.complete = function() {
    this.append(this.calculateChecksum());
  };

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

  Packet.prototype.calculateChecksum = function() {
    var sum = 0;
    for (var i=0; i<this.mCurrentIndex; i++) {
      sum += this.mBuffer[i];
    }
    return sum & 0x000000ff;
  };

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
