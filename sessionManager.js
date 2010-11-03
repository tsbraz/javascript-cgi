/*
CREATE TABLE  `server_sessions`.`session` (
  `id` varchar(40) NOT NULL COMMENT 'Session Id',
  `principal` varchar(30) NOT NULL COMMENT 'User name',
  `creation_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created on',
  `last_access_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'Last time accessed',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='User''s session'

CREATE TABLE  `server_sessions`.`session_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Object Id',
  `session_id` varchar(40) NOT NULL COMMENT 'Session Id',
  `name` varchar(30) NOT NULL COMMENT 'Object Mapped Name',
  `value` blob NOT NULL COMMENT 'Object Value',
  PRIMARY KEY (`id`),
  KEY `session_object` (`session_id`,`name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='Session Values'
*/

SessionManager = function(request, response) {
    this.request = request;
    this.response = response;
    var sessionId = this.getCookieId();
    if (sessionId != null) {
        var s = this.execute("select id, principal, creation_time, last_access_time from session where id = :id").
            setString("id", sessionId).
            list();
        if (s.length > 0) {
            this.setSessionInfo(s[0]);
        }
    }
}

SessionManager.prototype = new DataAccess();

SessionManager.prototype.getCookieId = function() {
    var cookies = this.request.getHeader("HTTP_COOKIE");
    if (cookies != null) {
        var regexp = /(^|( ))(js-session-id=)([a-z0-9]+)/;
        var cookie = cookies.match(regexp);
        if (cookie.length > 0) {
            return cookie[cookie.length-1];
        }
    }
    return null;
}

SessionManager.prototype.setSessionInfo = function(session) {
    if (session.last_access_time.getTime() < (new Date().getTime() - (30 * 60 * 1000))) {
        this.deleteSession(session.id);
        return;
    }
    this.id = session.id;
    this.principal = session.principal;
    this.creationTime = session.creation_time;
    this.isNew = session.creation_time == session.last_access_time;
    this.updateLastAccessTime();
}

SessionManager.prototype.deleteSession = function(id) {
    this.execute("delete from session_values where session_id = :id").
            setString("id", id).
            update();
            
    this.execute("delete from session where id = :id").
            setString("id", id).
            update();
}

SessionManager.prototype.updateLastAccessTime = function() {
    this.execute("update session set last_access_time = now() where id = :id").
            setString("id", this.id).update();
}

SessionManager.prototype.connectionInfo = {
    driver:"com.mysql.jdbc.Driver",
    url:"jdbc:mysql://localhost:3306/server_sessions",
    username:"server_sessions",
    password:""
}

SessionManager.prototype.createNewSession = function(principal) {
    this.createSessionInfo(principal);
    this.response.addHeader("Set-Cookie", "js-session-id=" + this.id + "; path=/");
    this.execute("insert into session (id, principal, creation_time, last_access_time) values (:id, :principal, now(), now())").
        setString("id", this.id).
        setString("principal", this.principal).
        update();
}

SessionManager.prototype.createSessionInfo = function(principal) {
    var sessionId = new java.lang.String(Math.random() + principal + new Date().getTime());
    this.id = Utils.Crypto.createSHA1Checksum(sessionId.getBytes());
    this.principal = principal;
    this.creationTime = new Date();
    this.isNew = true;
}

SessionManager.prototype.getAttribute = function(attrName) {
    var obj = this.execute("select value from session_values where session_id=:id and name=:name").
        setString("id", this.id).
        setString("name", attrName).
        list();
    if (obj.length > 0) {
        obj = obj[0];
        return JSON.parse(new java.lang.String(obj.value));
    }
    return null;
}

SessionManager.prototype.setAttribute = function(attrName, attr) {
    this.removeAttribute(attrName);
    this.execute("insert into session_values (session_id, name, value) values (:id, :name, :value)").
        setString("id", this.id).
        setString("name", attrName).
        setString("value", JSON.stringify(attr)).
        update();
    return attr;
}

SessionManager.prototype.removeAttribute = function(attrName) {
    var obj = this.execute("delete from session_values where session_id=:id and name=:name").
        setString("id", this.id).
        setString("name", attrName).
        update();
}