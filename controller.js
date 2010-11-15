load("javaInterface.js");
load("dataAccess.js");
load("json2.js");

// ***************************
// HTTPResponse
// ***************************

HTTPResponse = function() {
    Environment.stdOut(Environment.systemStdErr);
    this.addHeader("Content-Type", "text/html");
    this.responseCommited = false;
}

HTTPResponse.prototype.status = {
    OK: {code:Utils.Number.createInteger(200), message:"OK"},
    CREATED: {code:Utils.Number.createInteger(201), message:"Created"},
    ACCEPTED: {code:Utils.Number.createInteger(202), message:"Accepted"},
    NON_AUTHORITATIVE: {code:Utils.Number.createInteger(203), message:"Non-Authoritative Information"},
    NO_CONTENT: {code:Utils.Number.createInteger(204), message:"No Content"},
    RESET_CONTENT: {code:Utils.Number.createInteger(205), message:"Reset Content"},
    PARTIAL_CONTENT: {code:Utils.Number.createInteger(206), message:"Partial Content"},
    MULTIPLE_CHOICES: {code:Utils.Number.createInteger(300), message:"Multiple Choices"},
    MOVED_PERMANENTLY: {code:Utils.Number.createInteger(301), message:"Moved Permanently"},
    FOUND: {code:Utils.Number.createInteger(302), message:"Found"},
    SEE_OTHER: {code:Utils.Number.createInteger(303), message:"See Other"},
    NOT_MODIFIED: {code:Utils.Number.createInteger(304), message:"Not Modified"},
    USE_PROXY: {code:Utils.Number.createInteger(305), message:"Use Proxy"},
    TEMPORARY_REDIRECT: {code:Utils.Number.createInteger(307), message:"Temporary Redirect"},
    BAD_REQUEST: {code:Utils.Number.createInteger(400), message:"Bad Request"},
    UNAUTHORIZED: {code:Utils.Number.createInteger(401), message:"Unauthorized"},
    PAYMENT_REQUIRED: {code:Utils.Number.createInteger(402), message:"Payment Required"},
    FORBIDDEN: {code:Utils.Number.createInteger(403), message:"Forbidden"},
    NOT_FOUND: {code:Utils.Number.createInteger(404), message:"Not Found"},
    METHOD_NOT_ALLOWED: {code:Utils.Number.createInteger(405), message:"Method Not Allowed"},
    NOT_ACCEPTABLE: {code:Utils.Number.createInteger(406), message:"Not Acceptable"},
    PROXY_AUTHENTICATION_REQUIRED: {code:Utils.Number.createInteger(407), message:"Proxy Authentication Required"},
    REQUEST_TIMEOUT: {code:Utils.Number.createInteger(408), message:"Request Timeout"},
    CONFLICT: {code:Utils.Number.createInteger(409), message:"Conflict"},
    GONE: {code:Utils.Number.createInteger(410), message:"Gone"},
    LENGTH_REQUIRED: {code:Utils.Number.createInteger(411), message:"Length Required"},
    PRECONDITION_FAILED: {code:Utils.Number.createInteger(412), message:"Precondition Failed"},
    REQUEST_ENTITY_TOO_LARGE: {code:Utils.Number.createInteger(413), message:"Request Entity Too Large"},
    REQUEST_URI_TOO_LONG: {code:Utils.Number.createInteger(414), message:"Request-URI Too Long"},
    UNSUPPORTED_MEDIA_TYPE: {code:Utils.Number.createInteger(415), message:"Unsupported Media Type"},
    REQUEST_RANGE_NOT_SATISFIABLE: {code:Utils.Number.createInteger(416), message:"Requested Range Not Satisfiable"},
    EXPECTATION_FAILED: {code:Utils.Number.createInteger(417), message:"Expectation Failed"},
    INTERNAL_SERVER_ERROR: {code:Utils.Number.createInteger(500), message:"Internal Server Error"},
    NOT_IMPLEMENTED: {code:Utils.Number.createInteger(501), message:"Not Implemented"},
    BAD_GATEWAY: {code:Utils.Number.createInteger(502), message:"Bad Gateway"},
    SERVICE_UNAVAILABLE: {code:Utils.Number.createInteger(503), message:"Service Unavailable"},
    GATEWAY_TIMEOUT: {code:Utils.Number.createInteger(504), message:"Gateway Timeout"},
    HTTP_VERSION_NOT_SUPPORTED: {code:Utils.Number.createInteger(505), message:"HTTP Version Not Supported"}
}

HTTPResponse.prototype.addHeader = function(name, value) {
    if (this.header == null) {
        this.header = new Object();
    }
    this.header[name.toUpperCase()] = value;
}

HTTPResponse.prototype.setHeader = HTTPResponse.prototype.addHeader;

HTTPResponse.prototype.printHeader = function() {
    if (this.writer == null) {
        throw "Writer not acquired";
    }
    if (this.header != null) {
        for (var i in this.header) {
            if (this.header[i] != null) {
                this.writer.print(i);
                this.writer.print(": ");
                this.writer.println(this.header[i].toString());
            }
        }
    }
    this.writer.println();
}

HTTPResponse.prototype.getWriter = function() {
    if (this.writer == null) {
        this.writer = Environment.systemStdOut;
        this.printHeader();
        this.responseCommited = true;
    }
    return this.writer;
}

HTTPResponse.prototype.getOutputStream = function() {
    return this.getWriter();
}

HTTPResponse.prototype.sendRedirect = function(uri) {
    this.addHeader("Location", uri);
    this.getWriter();
}

HTTPResponse.prototype.sendError = function(status) {
    if (status == null || status.code == null) {
        throw "Cannot send error null";
    }
    this.addHeader("Status", status.code);
    this.getWriter().print(status.code);
    this.getWriter().print(" - ");
    this.getWriter().println(status.message);
}

// ***************************
// HTTPRequest
// ***************************

HTTPRequest = function() {
    this.setQueryString(this.getHeader("QUERY_STRING"));
    this.readStdInContent();
    this.requestURI = this.getHeader("REQUEST_URI");
    this.dispatch();
}

HTTPRequest.prototype.checkDispatchResponse = function(dispatchResponse) {
    if (!this.response.responseCommited) {
        if (dispatchResponse != null) {
            if (typeof(dispatchResponse) !== "string" && (dispatchResponse.getClass == null || dispatchResponse.getClass().getName() != "java.lang.String")) {
                dispatchResponse = JSON.stringify(dispatchResponse);
            }
            this.response.getWriter().println(dispatchResponse);
        } else {
            this.response.getWriter().println("");
        }
    }
}

HTTPRequest.prototype.dispatch = function() {
    var scriptFile = this.getRequestURIAtLevel(0) + "code/";
    var documentRoot = this.getDocumentRoot() + "code/";
    var method = this.getMethod();
    this.response = new HTTPResponse();
    if (Utils.IO.checkIfFileExists(scriptFile, documentRoot)) {
        load("code/" + scriptFile);
        var dispatchResponse = null;
        if (method == "GET") {
            dispatchResponse = get(this, this.response);
        } else if (method == "POST") {
            dispatchResponse = post(this, this.response);
        }
        this.checkDispatchResponse(dispatchResponse);
    } else {
        this.response.sendError(this.response.status.NOT_IMPLEMENTED);
    }
}

HTTPRequest.prototype.getSession = function() {
    if (this.sessionManager === undefined) {
        load("sessionManager.js");
        this.sessionManager = new SessionManager(this, this.response);
    }
    return this.sessionManager;
}

HTTPRequest.prototype.getParameter = function(paramName) {
    if (paramName === undefined) {
        return this.param;
    }
    return this.param[paramName];
}

HTTPRequest.prototype.isJSONParameter = function() {
    return this.json;
}

HTTPRequest.prototype.readMultipartBytes = function(stream, header, boundary) {
    var bout = Utils.IO.createByteArrayOutputStream();
    var btemp = Utils.IO.createByteArrayOutputStream();
    var c = -1;
    var line = null;
    main_loop:
    while ((c = stream.read()) !== -1) {
        if (boundary.charAt(0) == c) {
            var i = 1;
            var finalReached = true;
            btemp.reset();
            btemp.write(c);
            while (i < boundary.length() && (c = stream.read()) !== -1) {
                btemp.write(c);
                if (boundary.charAt(i++) != c) {
                    finalReached = false;
                    break;
                }
            }
            if (finalReached) {
                Utils.IO.readLine(stream);//ignora o final da linha
                break main_loop;
            }
            btemp.writeTo(bout);
        } else {
            bout.write(c);
        }
    }
    if (this.param === undefined) {
        this.param = new Object();
    }
    this.param[header.name] = {filename: header.filename, content: bout.toByteArray(), contentType: header.contentType};
}

HTTPRequest.prototype.readMultipartText = function(stream, header, boundary) {
    var value = Utils.String.createStringBuilder();
    var line = null;
    while ((line = Utils.IO.readLine(stream)) != null && line.indexOf(boundary) === -1) {
        value.append(line);
    }
    this.insertRequestParameter(header.name, value.toString());
}

HTTPRequest.prototype.readMultipartHeader = function(line, stream) {
    var i = line.indexOf("name=\"") + 6; // i + length(name=")
    var j = line.indexOf("\"", i);
    var name = line.substring(i,j);
    
    var filename = null;
    if ((i = line.indexOf("filename=\"")) > -1) {
        i += 10; // i + length(filename=")
        j = line.indexOf("\"", i);
        filename = line.substring(i, j);
    }
    
    if (filename != null) {
        line = Utils.IO.readLine(stream);
        var contentType = null;
        if ((i = line.indexOf("Content-Type")) > -1) {
            contentType = line.substring(line.indexOf(":") + 2);
        }
    }
    
    Utils.IO.readLine(stream); // pula uma linha

    return {name: name, filename: filename, contentType: contentType};
}


HTTPRequest.prototype.readStdInMultipart = function(contentLength) {
    var stream = Environment.stdIn();
    var boundary = Utils.IO.readLine(stream);
    var line = null;
    while ((line = Utils.IO.readLine(stream)) != null) {
        var header = this.readMultipartHeader(line, stream);
        if (header.filename != null) {
            this.readMultipartBytes(stream, header, boundary);
        } else {
            this.readMultipartText(stream, header, boundary);
        }
    }
}

HTTPRequest.prototype.readStdInParameter = function() {
    var param = Utils.IO.readWholeStreamAsString(Environment.stdIn());
    var contentType = this.getContentType();
    if (contentType.indexOf("text/json") == 0) {
        this.param = JSON.parse(param);
        this.json = true;
    } else {
        this.setQueryString(param);
    }
}

HTTPRequest.prototype.readStdInContent = function() {
    var contentLength = parseInt(this.getHeader("CONTENT_LENGTH"), 10);
    if (contentLength > 0) {
        if (this.getContentType().indexOf("application/x-www-form-urlencoded") === 0 || this.getContentType().indexOf("text/json") === 0) {
            this.readStdInParameter();
        } else {
            this.readStdInMultipart();
        }
    }
}

HTTPRequest.prototype.insertRequestParameter = function(paramName, paramValue) {
    if (paramName != null) {
        if (paramValue !== undefined) {
            paramValue = Utils.IO.decodeURI(paramValue);
        }
        if (this.param === undefined) {
            this.param = new Object();
        }
        this.param[paramName] = paramValue;
    }
}

HTTPRequest.prototype.setRequestParameter = function(param) {
    if (param != null) {
        param = param.split("=");
        if (param.length === 2) {
            insertRequestParameter(param[0], param[1]);
        } else {
            insertRequestParameter(param[0], null);
        }
    }
}

HTTPRequest.prototype.setQueryString = function(queryString) {
    if (queryString != null) {
        queryString = queryString.split("&");
        for (var i in queryString) {
            setRequestParameter(queryString[i]);
        }
    }
}

HTTPRequest.prototype.getHeader = function(name) {
    if (name == null) {
        throw "Name must be informed";
    }
    return Environment.getEnvironmentVariable(name);
}

HTTPRequest.prototype.getContentType = function() {
    return this.getHeader("CONTENT_TYPE");
}

HTTPRequest.prototype.getUserAgent = function() {
    return this.getHeader("HTTP_USER_AGENT");
}

HTTPRequest.prototype.getLanguage = function() {
    return this.getHeader("HTTP_ACCEPT_LANGUAGE");
}

HTTPRequest.prototype.getServerName = function() {
    return this.getHeader("SERVER_NAME");
}

HTTPRequest.prototype.getServerPort = function() {
    return this.getHeader("SERVER_PORT");
}
    
HTTPRequest.prototype.getMethod = function() {
    return this.getHeader("REQUEST_METHOD");
}

HTTPRequest.prototype.getContentLength = function() {
    return this.getHeader("CONTENT_LENGTH");
}

HTTPRequest.prototype.getRequestURI = function() {
    return this.requestURI;
}

HTTPRequest.prototype.getRequestURIAtLevel = function(i) {
    if (this.splitURI === undefined) {
        this.splitURI = this.requestURI.substring(1).split("/");
    }
    return this.splitURI[i];
}

HTTPRequest.prototype.getDocumentRoot = function() {
    return this.getHeader("DOCUMENT_ROOT");
}

try {
    new HTTPRequest();
} catch (err) {
    print ("Content-Type: text/html\nStatus: 500\n\n500 - Internal Server Error. {" + err + "}");
}