
Environment = {
    systemStdIn: java.lang.System["in"],
    systemStdErr: java.lang.System["err"],
    systemStdOut: java.lang.System.out,
    
    stdIn: function(stream) {
        if (stream !== undefined) {
            java.lang.System.setIn(stream);
        }
        return java.lang.System["in"];
    },
    
    stdOut: function(stream) {
        if (stream !== undefined) {
            java.lang.System.setOut(stream);
        }
        return java.lang.System.out;
    },
    
    stdErr: function(stream) {
        if (stream !== undefined) {
            java.lang.System.setErr(stream);
        }
        return java.lang.System["err"];
    },

    getEnvironmentVariable: function(variableName) {
        return java.lang.System.getenv(variableName);
    }
}

Utils = {}

Utils.IO = {
        
    createInputStreamReader: function(stream) {
            return new java.io.BufferedReader(new java.io.InputStreamReader(stream));
    },
    
    readWholeStreamAsString: function(stream) {
        var bout = new java.io.ByteArrayOutputStream();
        var b = 0;
        while ((b = stream.read()) != -1) {
            bout.write(b);
        }
        return new java.lang.String(bout.toByteArray());
    },
    
    decodeURI: function(uri) {
        return java.net.URLDecoder.decode(uri,"UTF8");
    },
    
    createByteArrayOutputStream: function() {
        return new java.io.ByteArrayOutputStream();
    },
    
    createByteArrayInputStream: function(bytes) {
        return new java.io.ByteArrayInputStream(bytes);
    },
    
    createInputStreamFromString: function(value) {
        return Utils.IO.createByteArrayInputStream(new java.lang.String(value).getBytes());
    },
    
    createPrintStream: function(endpointStream) {
        return new java.io.PrintStream(endpointStream);
    },
    
    createMemoryPrintStream: function(endpointStream) {
        return Utils.IO.createPrintStream(Utils.IO.createByteArrayOutputStream());
    },
    
    checkIfFileExists: function(file, path) {
        if (path !== undefined) {
            return new java.io.File(path, file).exists();
        } else {
            return new java.io.File(file).exists();
        }
    },
    
    readLine: function(stream) {
        var b = -1;
        var buf = Utils.String.createStringBuilder();
        while ((b = stream.read()) !== -1) {
            var s = Utils.String.readStringFromByte(b);
            if (s == "\n") {
                return buf;
            }
            if (s != "\r") {
                buf.append(s);
            }
        }
        if (buf.length() === 0) {
            return null;
        }
        return buf;
    }
    
}

Utils.Number = {
    
    createInteger: function(number) {
        return new java.lang.Integer(number);
    }
    
}

Utils.String = {
    
    isIdentifierPart: function(character) {
        return java.lang.Character.isJavaIdentifierPart(character);
    },
    
    readStringFromBytes: function(bytes) {
        return new java.lang.String(bytes);
    },

    readStringFromByte: function(_byte) {
        return new java.lang.Character(_byte);
    },
    
    createStringBuilder: function(len) {
        if (len === undefined) {
            return new java.lang.StringBuilder();
        } else {
            return new java.lang.StringBuilder(len);
        }
    },
    
    createHexString: function(bytes) {
        var sb = new Utils.String.createStringBuilder(bytes.length * 2);
        for (var b in bytes) {
            var v = bytes[b] & 0xFF;
            sb.append(java.lang.Integer.toHexString(v >>> 4)).append(java.lang.Integer.toHexString(v & 0xF));
        }
        return sb.toString();
    }
    
}

Utils.Crypto = {
    
    createSHA1Checksum: function(bytes) {
        var digest = java.security.MessageDigest.getInstance("SHA1");
        digest["update(byte[])"](bytes);
        bytes = digest.digest();
        return Utils.Crypto.createHexString(bytes);
    },
    
    createHexString: function (bytes) {
        var sb = Utils.String.createStringBuilder(bytes.length * 2);
        for (var i in bytes) {
            var v = bytes[i] & 0xFF;
            sb.append(java.lang.Integer.toHexString(v >>> 4)).append(java.lang.Integer.toHexString(v & 0xF));
        }
        return sb.toString();
    }
    
}